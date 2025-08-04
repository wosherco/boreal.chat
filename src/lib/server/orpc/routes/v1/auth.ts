import { osBase } from "../../context";
import {
  anonymousUserMiddleware,
  authenticatedMiddleware,
  ipMiddleware,
  turnstileMiddleware,
} from "../../middlewares";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  invalidateUserSessions,
  sessionCookieName,
  setSessionTokenCookie,
} from "$lib/server/auth";
import type { ServerCurrentUserInfo } from "$lib/common/sharedTypes";
import { ORPCError } from "@orpc/client";
import {
  loginIpLimiter,
  loginThrottler,
  registerIpLimiter,
  webauthnRatelimiter,
  passwordResetVerifyLimiter,
} from "$lib/server/ratelimit";
import { createWebAuthnChallenge } from "$lib/server/services/auth/webauthn";
import { encodeBase64 } from "@oslojs/encoding";
import z from "zod";
import {
  createUser,
  finishLogin,
  getUserByEmail,
  getUserById,
  setUserAsEmailVerifiedIfEmailMatches,
  updateUserEmailAndSetEmailAsVerified,
  updateUserPassword,
  UserAlreadyExistsError,
  type BackendUser,
} from "$lib/server/services/auth/user";
import { verifyPasswordHash } from "$lib/server/services/auth/password";
import { get2FARedirect, getPasswordReset2FARedirect } from "$lib/server/services/auth/2fa";
import {
  createEmailVerificationRequest,
  deleteEmailVerificationRequestCookie,
  deleteUserEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  setEmailVerificationRequestCookie,
} from "$lib/server/services/auth/emailVerification";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "$lib/server/services/email";
import { env } from "$env/dynamic/public";
import { isPast } from "date-fns";
import {
  createPasswordResetSession,
  deletePasswordResetSessionTokenCookie,
  invalidateUserPasswordResetSessions,
  setPasswordResetSessionAsEmailVerified,
  setPasswordResetSessionTokenCookie,
  validatePasswordResetSessionRequest,
} from "$lib/server/services/auth/passwordReset";
import { passwordSchema } from "$lib/common/validators/auth";
import * as Sentry from "@sentry/sveltekit";
import { constantTimeEquals } from "$lib/server/services/auth/utils";
import { verifyAnonymousSession } from "$lib/server/services/auth/anonymous";
import { isAnonymousUser } from "$lib/common/utils/anonymous";
import { db } from "$lib/server/db";

export const v1AuthRouter = osBase.router({
  getUser: osBase.handler(async ({ context }) => {
    const user = context.userCtx.user;
    if (!user) {
      return {
        authenticated: false,
        data: null,
        canSync: false,
      } satisfies ServerCurrentUserInfo;
    }
    return {
      authenticated: !isAnonymousUser(user),
      canSync: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        subscribedUntil: user.subscribedUntil,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
      },
    } satisfies ServerCurrentUserInfo;
  }),

  verifySession: osBase
    .use(ipMiddleware)
    .use(anonymousUserMiddleware)
    .input(
      z.object({
        turnstileToken: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const verified = await verifyAnonymousSession(
        context.userCtx.session,
        input.turnstileToken,
        context.clientIp,
      );

      if (!verified) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid turnstile token",
        });
      }

      return {
        success: true,
      };
    }),

  webauthnChallenge: osBase.use(ipMiddleware).handler(async ({ context }) => {
    const { clientIp } = context;

    const result = await webauthnRatelimiter.consume(clientIp);

    if (!result.success) {
      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the rate limit. Please, try again later.",
      });
    }

    const challenge = await createWebAuthnChallenge(clientIp);

    return {
      challenge: encodeBase64(challenge),
    };
  }),

  login: osBase
    .use(ipMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        // This is more light because it's login
        password: z.string().min(8).max(255),
      }),
    )
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const { clientIp } = context;

      const ipLimiterResult = await loginIpLimiter.consume(clientIp);

      if (!ipLimiterResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the rate limit. Please, try again later.",
        });
      }

      const user = await getUserByEmail(input.email);

      if (!user) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid email or password",
        });
      }

      const loginThrottlerResult = await loginThrottler.throttle(user.id);

      if (!loginThrottlerResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the rate limit. Please, try again later.",
        });
      }

      if (!user.passwordHash) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Please, login using oauth.",
        });
      }

      const validPassword = await verifyPasswordHash(user.passwordHash, input.password);

      if (!validPassword) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid email or password",
        });
      }

      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id, false);
      setSessionTokenCookie(context.cookies, sessionToken, session.expiresAt);

      await finishLogin(
        user.id,
        context.userCtx.user && isAnonymousUser(context.userCtx.user)
          ? context.userCtx.user.id
          : undefined,
      );

      const redirectTo = get2FARedirect(user);

      return {
        success: true,
        redirect: redirectTo ?? "/",
        done: redirectTo ? false : true,
      };
    }),

  register: osBase
    .use(ipMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(255),
        password: passwordSchema,
        turnstileToken: z.string().optional(),
      }),
    )
    .use(turnstileMiddleware)
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const ipLimiterResult = await registerIpLimiter.consume(context.clientIp);

      if (!ipLimiterResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the rate limit. Please, try again later.",
        });
      }

      // Disabled for now, we're already checking password strength in the schema
      // const strongPassword = await verifyPasswordStrength(input.password);

      // if (!strongPassword) {
      //   throw new ORPCError("BAD_REQUEST", {
      //     message: "Password is not strong enough. Please, try again.",
      //   });
      // }

      let user: BackendUser;

      try {
        user = await createUser(db, {
          email: input.email,
          name: input.name,
          password: input.password,
        });
      } catch (e) {
        if (e instanceof UserAlreadyExistsError) {
          throw new ORPCError("BAD_REQUEST", {
            message: "User already exists. Try logging in.",
          });
        }

        throw e;
      }

      if (!user) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user. Please, try again.",
        });
      }

      // Sending email verification email
      try {
        const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
        await sendEmailVerificationEmail(
          user.email,
          `${env.PUBLIC_URL}/auth/verify-email?code=${emailVerificationRequest.code}`,
          emailVerificationRequest.code,
        );
        setEmailVerificationRequestCookie(context.cookies, emailVerificationRequest);
      } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to send email verification email", e);
      }

      // Creating session
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id, false);
      setSessionTokenCookie(context.cookies, sessionToken, session.expiresAt);

      return {
        success: true,
        redirect: "/",
        done: true,
      };
    }),

  verifyEmail: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        code: z.string().min(8).max(8),
      }),
    )
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const backendUser = await getUserById(context.userCtx.user.id);

      if (!backendUser) {
        throw new ORPCError("BAD_REQUEST", {
          message: "User not found",
        });
      }

      const verificationRequest = await getUserEmailVerificationRequestFromRequest(
        backendUser,
        context.cookies,
      );

      if (!verificationRequest || isPast(verificationRequest.expiresAt)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid verification request",
        });
      }

      if (!constantTimeEquals(verificationRequest.code, input.code)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid verification code",
        });
      }

      await deleteUserEmailVerificationRequest(backendUser.id);
      await invalidateUserPasswordResetSessions(backendUser.id);
      await updateUserEmailAndSetEmailAsVerified(backendUser.id, verificationRequest.email);
      deleteEmailVerificationRequestCookie(context.cookies);

      return {
        success: true,
        redirect: "/?emailVerified=true",
      };
    }),

  requestPasswordReset: osBase
    .use(ipMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        turnstileToken: z.string().optional(),
      }),
    )
    .use(turnstileMiddleware)
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const cookies = context.cookies;

      const user = await getUserByEmail(input.email);

      if (!user) {
        throw new ORPCError("NOT_FOUND", {
          message: "User not found",
        });
      }

      await invalidateUserPasswordResetSessions(user.id);

      try {
        const sessionToken = generateSessionToken();
        const session = await createPasswordResetSession(sessionToken, user.id, user.email);
        await sendPasswordResetEmail(
          user.email,
          `${env.PUBLIC_URL}/auth/reset-password/verify-email?code=${session.code}`,
          session.code,
        );
        setPasswordResetSessionTokenCookie(cookies, sessionToken, session.expiresAt);
      } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to send password reset email", e);
        throw e;
      }

      return {
        success: true,
      };
    }),

  passwordResetVerifyEmail: osBase
    .use(ipMiddleware)
    .input(
      z.object({
        code: z.string().min(8).max(8),
      }),
    )
    .handler(async ({ context, input }) => {
      // Add rate limiting by IP
      const { clientIp } = context;
      const ipLimiterResult = await passwordResetVerifyLimiter.consume(clientIp);
      if (!ipLimiterResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the rate limit. Please, try again later.",
        });
      }

      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const { user, session } = await validatePasswordResetSessionRequest(context.cookies);

      if (!user || !session) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid password reset request",
        });
      }

      if (session.emailVerified) {
        throw new ORPCError("FORBIDDEN", {
          message: "Email already verified",
        });
      }

      if (session.code !== input.code) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid password reset code",
        });
      }

      await setPasswordResetSessionAsEmailVerified(session.id);
      const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(
        session.userId,
        session.email,
      );
      if (!emailMatches) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Please restart the process.",
        });
      }

      if (user.registered2FA) {
        return {
          success: true,
          redirect: getPasswordReset2FARedirect(user),
        };
      }

      return {
        success: true,
        redirect: "/auth/reset-password",
      };
    }),

  passwordReset: osBase
    .input(
      z.object({
        password: passwordSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const { user, session } = await validatePasswordResetSessionRequest(context.cookies);

      if (!user || !session) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid password reset request",
        });
      }

      if (user.registered2FA && !session.twoFactorVerified) {
        throw new ORPCError("FORBIDDEN", {
          message: "2FA not verified",
        });
      }

      // const strongPassword = await verifyPasswordStrength(input.password);

      // if (!strongPassword) {
      //   throw new ORPCError("BAD_REQUEST", {
      //     message: "Password is not strong enough. Please, try again.",
      //   });
      // }

      await Promise.all([
        invalidateUserPasswordResetSessions(user.id),
        invalidateUserSessions(user.id),
        updateUserPassword(user.id, input.password),
      ]);

      const userSessionToken = generateSessionToken();
      const userSession = await createSession(userSessionToken, user.id, session.twoFactorVerified);
      setSessionTokenCookie(context.cookies, userSessionToken, userSession.expiresAt);
      deletePasswordResetSessionTokenCookie(context.cookies);

      return {
        success: true,
        redirect: "/",
        done: true,
      };
    }),

  logout: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    await invalidateSession(context.userCtx.session.id);
    context.cookies?.delete(sessionCookieName, { path: "/" });
    return { success: true };
  }),

  // Authenticated user password reset endpoints
  requestPasswordResetAuthenticated: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const user = context.userCtx.user;
      const cookies = context.cookies;

      await invalidateUserPasswordResetSessions(user.id);

      try {
        const sessionToken = generateSessionToken();
        const session = await createPasswordResetSession(sessionToken, user.id, user.email);
        await sendPasswordResetEmail(
          user.email,
          `${env.PUBLIC_URL}/settings/authentication/reset-password/verify-email?code=${session.code}`,
          session.code,
        );
        setPasswordResetSessionTokenCookie(cookies, sessionToken, session.expiresAt);
      } catch (e) {
        Sentry.captureException(e);
        console.error("Failed to send password reset email", e);
        throw e;
      }

      return {
        success: true,
      };
    }),

  passwordResetAuthenticated: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        password: passwordSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      if (!context.cookies) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cookies not found",
        });
      }

      const { user, session } = await validatePasswordResetSessionRequest(context.cookies);
      const currentUser = context.userCtx.user;

      if (!user || !session) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid password reset request",
        });
      }

      // Ensure the password reset session belongs to the current authenticated user
      if (user.id !== currentUser.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Password reset session does not belong to current user",
        });
      }

      if (!session.emailVerified) {
        throw new ORPCError("FORBIDDEN", {
          message: "Email not verified",
        });
      }

      if (user.registered2FA && !session.twoFactorVerified) {
        throw new ORPCError("FORBIDDEN", {
          message: "2FA not verified",
        });
      }

      await Promise.all([
        invalidateUserPasswordResetSessions(user.id),
        updateUserPassword(user.id, input.password),
      ]);

      deletePasswordResetSessionTokenCookie(context.cookies);

      return {
        success: true,
        redirect: "/settings/authentication",
      };
    }),
});
