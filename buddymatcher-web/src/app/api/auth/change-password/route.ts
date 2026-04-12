import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const payload = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const validCurrent = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!validCurrent) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Change password failed" }, { status: 500 });
  }
}
