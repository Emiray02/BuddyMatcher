import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await requireAdmin();

    const latestRound = await prisma.matchRound.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latestRound) {
      return NextResponse.json({ error: "Yayınlanacak bir round bulunamadı.", errorCode: "NO_ROUND" }, { status: 404 });
    }

    if (latestRound.published) {
      return NextResponse.json({ ok: true, alreadyPublished: true, roundId: latestRound.id });
    }

    await prisma.matchRound.update({
      where: { id: latestRound.id },
      data: { published: true, publishedAt: new Date() },
    });

    return NextResponse.json({ ok: true, roundId: latestRound.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json(
        { error: message, errorCode: message },
        { status: message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: message, errorCode: "PUBLISH_FAILED" }, { status: 500 });
  }
}
