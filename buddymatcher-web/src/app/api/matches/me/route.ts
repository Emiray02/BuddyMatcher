import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireUser();

    const latestRound = await prisma.matchRound.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        matches: {
          where: {
            OR: [{ personAId: session.sub }, { personBId: session.sub }],
          },
          include: {
            personA: { include: { profile: true } },
            personB: { include: { profile: true } },
          },
          take: 1,
        },
      },
    });

    const match = latestRound?.matches[0] ?? null;
    if (!match) {
      return NextResponse.json({ match: null });
    }

    const buddy = match.personAId === session.sub ? match.personB : match.personA;
    return NextResponse.json({
      match: {
        id: match.id,
        score: match.score,
        reason: match.reason,
        buddy: {
          name: buddy.name,
          email: buddy.email,
          country: buddy.profile?.country,
          interests: buddy.profile?.interests,
          bio: buddy.profile?.bio,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
