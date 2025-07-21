import { osBase } from "../../context";
import { authenticatedMiddleware, ipMiddleware, turnstileMiddleware } from "../../middlewares";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  invalidateUserSessions,
  sessionCookieName,
  setSessionTokenCookie,
} from "$lib/server/auth";
import type { CurrentUserInfo } from "$lib/common/sharedTypes";
import { ORPCError } from "@orpc/client";
import {
  loginIpLimiter,
  loginThrottler,
  registerIpLimiter,
  webauthnRatelimiter,
} from "$lib/server/ratelimit";
import { createWebAuthnChallenge } from "$lib/server/services/auth/webauthn";
import { encodeBase64 } from "@oslojs/encoding";
import z from "zod";
import {
  createUser,
  getUserByEmail,
  getUserById,
  setUserAsEmailVerifiedIfEmailMatches,
  updateUserEmailAndSetEmailAsVerified,
  updateUserPassword,
  UserAlreadyExistsError,
  type BackendUser,
} from "$lib/server/services/auth/user";
import { verifyPasswordHash, verifyPasswordStrength } from "$lib/server/services/auth/password";
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

export const v1AuthRouter = osBase.router({
  getUser: osBase.handler(async ({ context }) => {
    const user = context.userCtx.user;
    if (!user) {
      return {
        authenticated: false,
        data: null,
      };
    }
    return {
      authenticated: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        subscribedUntil: user.subscribedUntil,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
      },
    } satisfies CurrentUserInfo;
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

      return {
        success: true,
        redirect: get2FARedirect(user) ?? "/",
      };
    }),

  register: osBase
    .use(ipMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(255),
        password: z.string().min(8).max(255),
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

      const strongPassword = await verifyPasswordStrength(input.password);

      if (!strongPassword) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Password is not strong enough. Please, try again.",
        });
      }

      let user: BackendUser;

      try {
        user = await createUser(input.email, input.name, input.password);
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
      const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
      await sendEmailVerificationEmail(
        user.email,
        `${env.PUBLIC_URL}/auth/verify-email?code=${emailVerificationRequest.code}`,
        emailVerificationRequest.code,
      );
      setEmailVerificationRequestCookie(context.cookies, emailVerificationRequest);

      // Creating session
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id, false);
      setSessionTokenCookie(context.cookies, sessionToken, session.expiresAt);

      return {
        success: true,
        redirect: "/",
      };
    }),

  verifyEmail: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        code: z.string().min(6).max(6),
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

      if (verificationRequest.code !== input.code) {
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

      const sessionToken = generateSessionToken();
      const session = await createPasswordResetSession(sessionToken, user.id, user.email);
      await sendPasswordResetEmail(
        user.email,
        `${env.PUBLIC_URL}/auth/reset-password?code=${session.code}`,
        session.code,
      );
      setPasswordResetSessionTokenCookie(cookies, sessionToken, session.expiresAt);

      return {
        success: true,
      };
    }),

  // TODO: Add rate limiting
  passwordResetVerifyEmail: osBase
    .input(
      z.object({
        code: z.string().min(1),
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
        password: z.string().min(8).max(255),
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

      const strongPassword = await verifyPasswordStrength(input.password);

      if (!strongPassword) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Password is not strong enough. Please, try again.",
        });
      }

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
      };
    }),

  logout: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    await invalidateSession(context.userCtx.session.id);
    context.cookies?.delete(sessionCookieName, { path: "/" });
    return { success: true };
  }),
});
