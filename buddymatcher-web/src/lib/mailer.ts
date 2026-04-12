import nodemailer from "nodemailer";

type PasswordResetCodeMail = {
  to: string;
  code: string;
};

function getMailConfig() {
  const rawHost = process.env.SMTP_HOST?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();
  const rawUser = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();

  const inferredGmailHost = rawUser?.toLowerCase().endsWith("@gmail.com") ? "smtp.gmail.com" : undefined;
  const host = rawHost || inferredGmailHost;
  const user = rawUser;
  const pass = rawHost?.toLowerCase().includes("gmail") || inferredGmailHost
    ? rawPass?.replace(/\s+/g, "")
    : rawPass;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(rawPort || (host === "smtp.gmail.com" ? "587" : "587"));
  const secureEnv = process.env.SMTP_SECURE?.trim();
  const secure = secureEnv ? secureEnv.toLowerCase() === "true" : port === 465;
  const from = process.env.SMTP_FROM?.trim() || user;

  return {
    host,
    port,
    secure,
    from,
    auth: { user, pass },
  };
}

export async function sendPasswordResetCodeMail({ to, code }: PasswordResetCodeMail) {
  const config = getMailConfig();
  if (!config) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.verify();

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Istkon'26 sifre sifirlama kodu",
    text: `Sifre sifirlama kodunuz: ${code}\nKod 10 dakika boyunca gecerlidir.`,
    html: `<p>Sifre sifirlama kodunuz: <strong>${code}</strong></p><p>Kod 10 dakika boyunca gecerlidir.</p>`,
  });
}
