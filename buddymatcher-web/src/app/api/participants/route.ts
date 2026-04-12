import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireUser();

    const participants = await prisma.user.findMany({
      where: {
        role: "USER",
        profile: {
          isNot: null,
        },
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            instagramUrl: true,
            linkedinUrl: true,
            xUrl: true,
            publicTags: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ participants });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
