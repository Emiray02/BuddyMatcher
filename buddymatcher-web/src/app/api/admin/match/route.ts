import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { generateOptimalBuddyMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await requireAdmin();

    const participants = await prisma.user.findMany({
      where: { role: "USER" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    });

    const missingProfiles = participants.filter((p) => !p.profile).length;
    if (missingProfiles > 0) {
      return NextResponse.json(
        { error: `${missingProfiles} kullanicinin profili eksik.` },
        { status: 400 },
      );
    }

    const missingPhotos = participants.filter((p) => !p.profile?.avatarUrl).length;
    if (missingPhotos > 0) {
      return NextResponse.json(
        { error: `${missingPhotos} kullanicinin profil fotografi eksik.` },
        { status: 400 },
      );
    }

    const generated = generateOptimalBuddyMatches(participants);

    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.matchRound.create({
        data: {
          createdById: session.sub,
        },
      });

      await tx.match.createMany({
        data: generated.map((item) => ({
          roundId: round.id,
          personAId: item.personAId,
          personBId: item.personBId,
          score: item.score,
          reason: item.reason,
        })),
      });

      return {
        roundId: round.id,
        count: generated.length,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Matching failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
