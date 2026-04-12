import nodemailer from "nodemailer";

type PasswordResetCodeMail = {
  to: string;
  code: string;
};

function getMailConfig() {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portValue || !user || !pass) {
    return null;
  }

  const port = Number(portValue);
  const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
  const from = process.env.SMTP_FROM ?? "noreply@istkon26.com";

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

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Istkon'26 sifre sifirlama kodu",
    text: `Sifre sifirlama kodunuz: ${code}\nKod 10 dakika boyunca gecerlidir.`,
    html: `<p>Sifre sifirlama kodunuz: <strong>${code}</strong></p><p>Kod 10 dakika boyunca gecerlidir.</p>`,
  });
}
