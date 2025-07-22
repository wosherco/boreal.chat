import { validatePasswordResetSessionRequest } from "$lib/server/services/auth/passwordReset";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getPasswordReset2FARedirect } from "$lib/server/services/auth/2fa";

export const load: PageServerLoad = async ({ cookies }) => {
  const { session, user } = await validatePasswordResetSessionRequest(cookies);

  if (!session || !user) {
    return redirect(302, "/auth/forgot-password");
  }

  if (session.emailVerified) {
    if (!session.twoFactorVerified && user.registered2FA) {
      const redirectUrl = getPasswordReset2FARedirect(user);
      if (redirectUrl) {
        return redirect(302, redirectUrl);
      }
      return redirect(302, "/auth/reset-password");
    }
  }

  return {
    email: session.email,
  };
};
