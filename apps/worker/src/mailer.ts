import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST ?? "localhost";
const port = Number(process.env.SMTP_PORT ?? "1025");
const user = process.env.SMTP_USER;
const password = process.env.SMTP_PASSWORD;

export const mailFrom =
  process.env.SMTP_FROM ?? "Powerhouse 360 <no-reply@powerhouse360.de>";
export const leadNotifyTo =
  process.env.LEAD_NOTIFY_TO ?? "vertrieb@powerhouse360.de";
export const appBaseUrl = process.env.AUTH_URL ?? "http://localhost:3100";

export const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user ? { user, pass: password } : undefined,
});

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  await transport.sendMail({
    from: mailFrom,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
}
