import { Country } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  country: z.enum([Country.TR, Country.DE]),
  openness: z.number().int().min(1).max(10),
  conscientiousness: z.number().int().min(1).max(10),
  extraversion: z.number().int().min(1).max(10),
  agreeableness: z.number().int().min(1).max(10),
  neuroticism: z.number().int().min(1).max(10),
  interests: z.string().min(1),
  bio: z.string().max(500).optional().default(""),
  travelAfterProgram: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await requireUser();
    const profile = await prisma.profile.findUnique({ where: { userId: session.sub } });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireUser();
    const payload = profileSchema.parse(await request.json());

    const profile = await prisma.profile.upsert({
      where: { userId: session.sub },
      update: payload,
      create: {
        userId: session.sub,
        ...payload,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
