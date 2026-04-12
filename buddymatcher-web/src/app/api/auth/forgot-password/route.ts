import { createHash, randomInt } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetCodeMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const payload = forgotPasswordSchema.parse(await request.json());
    const identifier = payload.identifier.trim().toLowerCase();

    const adminUsername = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@buddymatcher.local").trim().toLowerCase();

    const emailToLookup = identifier === adminUsername ? adminEmail : identifier;
    const user = await prisma.user.findUnique({ where: { email: emailToLookup } });

    // Return same shape even if account does not exist to avoid user enumeration.
    if (!user) {
      return NextResponse.json({ ok: true, message: "If this account exists, a verification code has been sent." });
    }

    const verificationCode = String(randomInt(100000, 1000000));
    const tokenHash = createHash("sha256").update(`${user.id}:${verificationCode}`).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    try {
      await sendPasswordResetCodeMail({
        to: user.email,
        code: verificationCode,
      });
    } catch (mailError) {
      if (mailError instanceof Error && mailError.message === "SMTP_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error: "Mail servisi ayarlı değil. SMTP ortam değişkenlerini girin.",
            errorCode: "SMTP_NOT_CONFIGURED",
          },
          { status: 500 },
        );
      }

      const smtpCode =
        typeof mailError === "object" && mailError !== null && "code" in mailError
          ? String((mailError as { code?: unknown }).code ?? "")
          : "";

      if (smtpCode === "EAUTH") {
        return NextResponse.json(
          {
            error: "SMTP kimlik doğrulaması başarısız. SMTP_USER ve SMTP_PASS değerlerini kontrol edin.",
            errorCode: "SMTP_AUTH_FAILED",
          },
          { status: 500 },
        );
      }

      if (smtpCode === "ECONNECTION" || smtpCode === "ETIMEDOUT" || smtpCode === "ESOCKET") {
        return NextResponse.json(
          {
            error: "SMTP sunucusuna bağlanılamadı. SMTP_HOST, SMTP_PORT ve SMTP_SECURE ayarlarını kontrol edin.",
            errorCode: "SMTP_CONNECTION_FAILED",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "Doğrulama kodu gönderilemedi", errorCode: "VERIFICATION_SEND_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If this account exists, a verification code has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed", errorCode: "VALIDATION_FAILED" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Forgot password failed", errorCode: "FORGOT_PASSWORD_FAILED" }, { status: 500 });
  }
}
