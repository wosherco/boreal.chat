import { validatePasswordResetSessionRequest } from "$lib/server/services/auth/passwordReset";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getPasswordReset2FARedirect } from "$lib/server/services/auth/2fa";

export const load: PageServerLoad = async ({ cookies }) => {
  const { session, user } = await validatePasswordResetSessionRequest(cookies);

  if (!session || !user) {
    return redirect(302, "/auth/forgot-password");
  }

  if (!session.emailVerified) {
    return redirect(302, "/auth/reset-password/verify-email");
  }

  if (user.registered2FA && !session.twoFactorVerified) {
    const redirectUrl = getPasswordReset2FARedirect(user);
    if (redirectUrl) {
      return redirect(302, redirectUrl);
    }
  }

  return {};
};
