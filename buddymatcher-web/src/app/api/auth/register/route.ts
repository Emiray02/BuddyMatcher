import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

function isAdminEmail(email: string) {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const whitelist = raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return whitelist.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already used" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: isAdminEmail(payload.email) ? "ADMIN" : "USER",
      },
    });

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
