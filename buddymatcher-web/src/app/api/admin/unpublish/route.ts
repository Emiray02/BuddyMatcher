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
      return NextResponse.json({ error: "Herhangi bir round bulunamadı.", errorCode: "NO_ROUND" }, { status: 404 });
    }

    if (!latestRound.published) {
      return NextResponse.json({ ok: true, alreadyUnpublished: true, roundId: latestRound.id });
    }

    await prisma.matchRound.update({
      where: { id: latestRound.id },
      data: { published: false, publishedAt: null },
    });

    return NextResponse.json({ ok: true, roundId: latestRound.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unpublish failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json(
        { error: message, errorCode: message },
        { status: message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: message, errorCode: "UNPUBLISH_FAILED" }, { status: 500 });
  }
}
