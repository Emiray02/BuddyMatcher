import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { generateGroupMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await requireAdmin();

    const participants = await prisma.user.findMany({
      where: {
        role: "USER",
        profile: { includedInMatching: true },
      },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    });

    const missingProfiles = participants.filter((p) => !p.profile).length;
    if (missingProfiles > 0) {
      return NextResponse.json(
        {
          error: `${missingProfiles} kullanıcının profili eksik.`,
          errorCode: "MISSING_PROFILES",
          count: missingProfiles,
        },
        { status: 400 },
      );
    }

    const missingPhotos = participants.filter((p) => !p.profile?.avatarUrl).length;
    if (missingPhotos > 0) {
      return NextResponse.json(
        {
          error: `${missingPhotos} kullanıcının profil fotoğrafı eksik.`,
          errorCode: "MISSING_PHOTOS",
          count: missingPhotos,
        },
        { status: 400 },
      );
    }

    const generated = generateGroupMatches(participants);

    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.matchRound.create({
        data: {
          createdById: session.sub,
          published: false,
        },
      });

      for (const group of generated) {
        await tx.matchGroup.create({
          data: {
            roundId: round.id,
            score: group.score,
            reason: group.reason,
            members: {
              create: group.memberIds.map((uid) => ({ userId: uid })),
            },
          },
        });
      }

      return {
        roundId: round.id,
        count: generated.length,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Matching failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json(
        { error: message, errorCode: message },
        { status: message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: message, errorCode: "MATCHING_FAILED" }, { status: 400 });
  }
}
