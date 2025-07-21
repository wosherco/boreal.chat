import { emailTransport } from "./transports";
import { env } from "$env/dynamic/private";
import { render } from "svelty-email";
import EmailVerificationEmail from "$lib/server/emails/EmailVerificationEmail.svelte";
import PasswordResetEmail from "$lib/server/emails/PasswordResetEmail.svelte";

async function sendEmail(email: string, subject: string, html: string) {
  if (!emailTransport) {
    console.log(`Tried sending email "${subject}" to ${email} but no email transport was found`);
    return;
  }

  await emailTransport.sendMail({
    from: env.SMTP_FROM || "no-reply@boreal.chat",
    to: email,
    subject,
    html,
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationUrl: string,
  verificationCode: string,
) {
  const emailHTML = await render(EmailVerificationEmail, {
    verificationUrl,
    userEmail: email,
    verificationCode,
  });
  return sendEmail(email, "boreal.chat - Email Verification", emailHTML.html);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, resetCode: string) {
  const emailHTML = await render(PasswordResetEmail, {
    resetUrl,
    userEmail: email,
    resetCode,
  });
  return sendEmail(email, "boreal.chat - Password Reset", emailHTML.html);
}
