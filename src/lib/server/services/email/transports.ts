import { createTransport } from "nodemailer";
import { env } from "$env/dynamic/private";

export const emailTransport = env.SMTP_HOST
  ? createTransport({
      host: env.SMTP_HOST,
      secure: env.SMTP_SECURE === "true",
      port: env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    })
  : null;
