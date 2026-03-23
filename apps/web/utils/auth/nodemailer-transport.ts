import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import MagicLinkEmail from "../../../../packages/resend/emails/magic-link";
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("nodemailer-transport");

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: port ? Number.parseInt(port, 10) : 587,
    secure: port === "465",
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

export function isSmtpConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

export async function sendMagicLinkViaSMTP({
  to,
  url,
  from,
  baseUrl,
}: {
  to: string;
  url: string;
  from: string;
  baseUrl: string;
}) {
  const transport = getSmtpTransport();
  if (!transport) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST in your environment.",
    );
  }

  const react = MagicLinkEmail({ url, baseUrl });
  const html = await render(react);
  const text = await render(react, { plainText: true });

  const result = await transport.sendMail({
    from,
    to,
    subject: "Sign in to Inbox Zero",
    html,
    text,
  });

  logger.info("Magic link email sent via SMTP", {
    to,
    messageId: result.messageId,
  });

  return result;
}
