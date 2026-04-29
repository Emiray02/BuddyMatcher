import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const round = await prisma.matchRound.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        groups: {
          include: {
            members: {
              include: {
                user: {
                  include: { profile: true },
                },
              },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ round: null });
    }

    return NextResponse.json({
      round: {
        id: round.id,
        published: round.published,
        publishedAt: round.publishedAt,
        groups: round.groups.map((g) => ({
          id: g.id,
          score: g.score,
          reason: g.reason,
          members: g.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            country: m.user.profile?.country ?? null,
            avatarUrl: m.user.profile?.avatarUrl ?? null,
          })),
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json(
        { error: message, errorCode: message },
        { status: message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: message, errorCode: "FETCH_FAILED" }, { status: 500 });
  }
}
