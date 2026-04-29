import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireUser();

    const latestPublishedRound = await prisma.matchRound.findFirst({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      include: {
        groups: {
          where: {
            members: { some: { userId: session.sub } },
          },
          include: {
            members: {
              include: {
                user: { include: { profile: true } },
              },
            },
          },
          take: 1,
        },
      },
    });

    const group = latestPublishedRound?.groups[0] ?? null;
    if (!group) {
      return NextResponse.json({ match: null });
    }

    const buddies = group.members
      .filter((m) => m.userId !== session.sub)
      .map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.profile?.avatarUrl ?? null,
        country: m.user.profile?.country ?? null,
        bio: m.user.profile?.bio ?? null,
        publicTags: m.user.profile?.publicTags ?? [],
        instagramUrl: m.user.profile?.instagramUrl ?? null,
        linkedinUrl: m.user.profile?.linkedinUrl ?? null,
        xUrl: m.user.profile?.xUrl ?? null,
      }));

    return NextResponse.json({
      match: {
        groupId: group.id,
        score: group.score,
        reason: group.reason,
        buddies,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
