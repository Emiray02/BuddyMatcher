import { Country } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeSurveyScores,
  mapScoresToLegacyProfile,
  parseForcedChoices,
  parseLikertAnswers,
  serializeSurveyPayload,
} from "@/lib/survey";
import { generatePublicTagsFromAnswers } from "@/lib/tags";

const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  avatarUrl: z.string().min(1, "Profil fotoğrafı zorunlu"),
  instagramUrl: z.string().max(200).optional().default(""),
  linkedinUrl: z.string().max(200).optional().default(""),
  xUrl: z.string().max(200).optional().default(""),
  bio: z.string().max(500).optional().default(""),
  country: z.enum([Country.TR, Country.DE]),
  surveyLikertAnswers: z.record(z.string(), z.number().int().min(1).max(5)),
  surveyForcedChoices: z.object({
    planningStyle: z.enum(["plan_flexible", "spontaneous_plan"]),
    buddyPriority: z.enum(["fun_social", "calm_reliable"]),
    idealActivity: z.enum(["party_social", "cultural_museum", "mixed"]),
    timeStyle: z.enum(["early_bird", "night_owl"]),
  }),
  travelAfterProgram: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await requireUser();
    const profile = await prisma.profile.findUnique({ where: { userId: session.sub } });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized", errorCode: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireUser();
    const payload = profileSchema.parse(await request.json());

    const likertAnswers = parseLikertAnswers(payload.surveyLikertAnswers);
    const forcedChoices = parseForcedChoices(payload.surveyForcedChoices);
    const scores = computeSurveyScores({
      likertAnswers,
      travelAfterProgram: payload.travelAfterProgram,
    });
    const mappedLegacy = mapScoresToLegacyProfile(scores);
    const serializedSurvey = serializeSurveyPayload({
      likertAnswers,
      travelAfterProgram: payload.travelAfterProgram,
      forcedChoices,
    });

    const existing = await prisma.profile.findUnique({ where: { userId: session.sub } });

    const privateChanged =
      !!existing &&
      (
        existing.country !== payload.country ||
        existing.openness !== mappedLegacy.openness ||
        existing.conscientiousness !== mappedLegacy.conscientiousness ||
        existing.extraversion !== mappedLegacy.extraversion ||
        existing.agreeableness !== mappedLegacy.agreeableness ||
        existing.neuroticism !== mappedLegacy.neuroticism ||
        existing.interests !== serializedSurvey ||
        existing.travelAfterProgram !== payload.travelAfterProgram
      );

    if (existing && session.role !== "ADMIN" && privateChanged && !existing.answersEditable) {
      return NextResponse.json(
        {
          error: "Buddy matcher yanıtları kilitli. Düzenleme için admin izni gerekli.",
          errorCode: "ANSWERS_LOCKED",
        },
        { status: 403 },
      );
    }

    const tags = generatePublicTagsFromAnswers({
      openness: mappedLegacy.openness,
      conscientiousness: mappedLegacy.conscientiousness,
      extraversion: mappedLegacy.extraversion,
      agreeableness: mappedLegacy.agreeableness,
      neuroticism: mappedLegacy.neuroticism,
      interests: serializedSurvey,
      travelAfterProgram: payload.travelAfterProgram,
      socialScore: scores.socialScore,
      opennessScore: scores.opennessScore,
      flexibilityScore: scores.flexibilityScore,
      structureScore: scores.structureScore,
      partyScore: scores.partyScore,
      travelStyleScore: scores.travelStyleScore,
      communicationScore: scores.communicationScore,
    });

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
        openness: mappedLegacy.openness,
        conscientiousness: mappedLegacy.conscientiousness,
        extraversion: mappedLegacy.extraversion,
        agreeableness: mappedLegacy.agreeableness,
        neuroticism: mappedLegacy.neuroticism,
        interests: serializedSurvey,
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
        openness: mappedLegacy.openness,
        conscientiousness: mappedLegacy.conscientiousness,
        extraversion: mappedLegacy.extraversion,
        agreeableness: mappedLegacy.agreeableness,
        neuroticism: mappedLegacy.neuroticism,
        interests: serializedSurvey,
        travelAfterProgram: payload.travelAfterProgram,
        publicTags: tags,
        answersEditable: false,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const field = String(firstIssue?.path?.[0] ?? "");
      const errorCode = field === "avatarUrl" ? "PROFILE_PHOTO_REQUIRED" : "VALIDATION_FAILED";
      return NextResponse.json(
        { error: firstIssue?.message ?? "Validation failed", errorCode },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      ["invalid", "missing", "unknown"].some((token) => error.message.toLowerCase().includes(token))
    ) {
      return NextResponse.json({ error: "Validation failed", errorCode: "VALIDATION_FAILED" }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed", errorCode: "SAVE_FAILED" }, { status: 500 });
  }
}
