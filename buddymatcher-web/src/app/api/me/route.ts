import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: {
        profile: {
          select: {
            avatarUrl: true,
            instagramUrl: true,
            linkedinUrl: true,
            xUrl: true,
            publicTags: true,
            answersEditable: true,
            country: true,
            openness: true,
            conscientiousness: true,
            extraversion: true,
            agreeableness: true,
            neuroticism: true,
            interests: true,
            bio: true,
            travelAfterProgram: true,
          },
        },
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
