import { createHash, randomBytes } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

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
      return NextResponse.json({ ok: true, message: "If this account exists, a reset link has been created." });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    return NextResponse.json({
      ok: true,
      message: "If this account exists, a reset link has been created.",
      resetUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    return NextResponse.json({ error: "Forgot password failed" }, { status: 500 });
  }
}
