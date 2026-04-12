import { Country } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePublicTagsFromAnswers } from "@/lib/tags";

const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  avatarUrl: z.string().min(1, "Profil fotografi zorunlu"),
  instagramUrl: z.string().max(200).optional().default(""),
  linkedinUrl: z.string().max(200).optional().default(""),
  xUrl: z.string().max(200).optional().default(""),
  bio: z.string().max(500).optional().default(""),
  country: z.enum([Country.TR, Country.DE]),
  openness: z.number().int().min(1).max(10),
  conscientiousness: z.number().int().min(1).max(10),
  extraversion: z.number().int().min(1).max(10),
  agreeableness: z.number().int().min(1).max(10),
  neuroticism: z.number().int().min(1).max(10),
  interests: z.string().min(1),
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
    const existing = await prisma.profile.findUnique({ where: { userId: session.sub } });

    const privateChanged =
      !!existing &&
      (
        existing.country !== payload.country ||
        existing.openness !== payload.openness ||
        existing.conscientiousness !== payload.conscientiousness ||
        existing.extraversion !== payload.extraversion ||
        existing.agreeableness !== payload.agreeableness ||
        existing.neuroticism !== payload.neuroticism ||
        existing.interests !== payload.interests ||
        existing.travelAfterProgram !== payload.travelAfterProgram
      );

    if (existing && session.role !== "ADMIN" && privateChanged && !existing.answersEditable) {
      return NextResponse.json(
        { error: "Buddy matcher yanitlari kilitli. Duzenleme icin admin izni gerekli." },
        { status: 403 },
      );
    }

    const tags = generatePublicTagsFromAnswers(payload);

    await prisma.user.update({
      where: { id: session.sub },
      data: { name: payload.fullName },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: session.sub },
      update: {
        avatarUrl: payload.avatarUrl,
        instagramUrl: payload.instagramUrl,
        linkedinUrl: payload.linkedinUrl,
        xUrl: payload.xUrl,
        bio: payload.bio,
        country: payload.country,
        openness: payload.openness,
        conscientiousness: payload.conscientiousness,
        extraversion: payload.extraversion,
        agreeableness: payload.agreeableness,
        neuroticism: payload.neuroticism,
        interests: payload.interests,
        travelAfterProgram: payload.travelAfterProgram,
        publicTags: tags,
        answersEditable:
          session.role === "ADMIN"
            ? existing?.answersEditable ?? false
            : privateChanged
              ? false
              : existing?.answersEditable ?? false,
      },
      create: {
        userId: session.sub,
        avatarUrl: payload.avatarUrl,
        instagramUrl: payload.instagramUrl,
        linkedinUrl: payload.linkedinUrl,
        xUrl: payload.xUrl,
        bio: payload.bio,
        country: payload.country,
        openness: payload.openness,
        conscientiousness: payload.conscientiousness,
        extraversion: payload.extraversion,
        agreeableness: payload.agreeableness,
        neuroticism: payload.neuroticism,
        interests: payload.interests,
        travelAfterProgram: payload.travelAfterProgram,
        publicTags: tags,
        answersEditable: false,
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
