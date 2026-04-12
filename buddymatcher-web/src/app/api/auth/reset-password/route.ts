import { createHash } from "crypto";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const resetPasswordSchema = z.object({
  identifier: z.string().min(2),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = resetPasswordSchema.parse(await request.json());
    const identifier = payload.identifier.trim().toLowerCase();

    const adminUsername = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@buddymatcher.local").trim().toLowerCase();
    const emailToLookup = identifier === adminUsername ? adminEmail : identifier;

    const user = await prisma.user.findUnique({ where: { email: emailToLookup } });
    if (!user) {
      return NextResponse.json({ error: "Invalid code or account" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(`${user.id}:${payload.code}`).digest("hex");

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid code or account" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          id: { not: resetToken.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    return NextResponse.json({ error: "Reset password failed" }, { status: 500 });
  }
}
