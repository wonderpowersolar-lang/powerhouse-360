import nodemailer from "nodemailer";

/** SMTP-Transport (aus apps/worker/mailer.ts hierher gezogen — WP-1.4). */

export type MailTransport = {
  sendMail: (opts: { from: string; to: string; subject: string; text: string }) => Promise<unknown>;
};

export const mailFrom = process.env.SMTP_FROM ?? "Powerhouse 360 <no-reply@powerhouse360.de>";
export const leadNotifyTo = process.env.LEAD_NOTIFY_TO ?? "vertrieb@powerhouse360.de";

export function createSmtpTransport(): MailTransport {
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = Number(process.env.SMTP_PORT ?? "1025");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: password } : undefined,
  });
}
