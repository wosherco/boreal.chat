import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  createEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  setEmailVerificationRequestCookie,
} from "$lib/server/services/auth/emailVerification";
import { sendEmailVerificationEmail } from "$lib/server/services/email";
import { env } from "$env/dynamic/public";
import { isPast } from "date-fns";

export const load: PageServerLoad = async ({ cookies, locals }) => {
  if (locals.user === null) {
    return redirect(302, "/auth");
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(locals.user, cookies);
  let justSentEmail = Promise.resolve(false);

  if (verificationRequest === null || isPast(verificationRequest.expiresAt)) {
    if (locals.user.emailVerified) {
      return redirect(302, "/");
    }

    // Note: We don't need rate limiting since it takes time before requests expire
    verificationRequest = await createEmailVerificationRequest(locals.user.id, locals.user.email);
    justSentEmail = sendEmailVerificationEmail(
      verificationRequest.email,
      `${env.PUBLIC_URL}/auth/verify-email?code=${verificationRequest.code}`,
      verificationRequest.code,
    ).then(() => true);
    setEmailVerificationRequestCookie(cookies, verificationRequest);
  }

  return {
    email: verificationRequest.email,
    justSentEmail,
  };
};
