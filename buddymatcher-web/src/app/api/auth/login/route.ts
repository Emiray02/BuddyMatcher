import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());

    const identifier = payload.identifier.trim().toLowerCase();
    const adminUsername = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Istkon2026admin";
    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@buddymatcher.local").trim().toLowerCase();

    let user = null;

    if (identifier === adminUsername) {
      if (payload.password !== adminPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      user = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!user) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        user = await prisma.user.create({
          data: {
            name: "Admin",
            email: adminEmail,
            passwordHash,
            role: "ADMIN",
          },
        });
      } else if (user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    } else {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isAdminUsernameLogin = identifier === adminUsername;
    const valid = isAdminUsernameLogin ? true : await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
