import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
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
}
