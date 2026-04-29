import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    await requireAdmin();

    const { groupId } = await params;
    const body = (await request.json()) as { memberIds: string[] };
    const { memberIds } = body;

    if (!Array.isArray(memberIds) || memberIds.length !== 3) {
      return NextResponse.json({ error: "3 üye gerekli.", errorCode: "INVALID_MEMBERS" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      include: { profile: true },
    });

    if (users.length !== 3) {
      return NextResponse.json({ error: "Kullanıcılar bulunamadı.", errorCode: "USERS_NOT_FOUND" }, { status: 400 });
    }

    const trCount = users.filter((u) => u.profile?.country === "TR").length;
    const deCount = users.filter((u) => u.profile?.country === "DE").length;

    if (trCount !== 2 || deCount !== 1) {
      return NextResponse.json(
        { error: "Grup 2 TR + 1 DE üyeden oluşmalı.", errorCode: "INVALID_COMPOSITION" },
        { status: 400 },
      );
    }

    const group = await prisma.matchGroup.findUnique({
      where: { id: groupId },
      include: { round: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Grup bulunamadı.", errorCode: "NOT_FOUND" }, { status: 404 });
    }

    if (group.round.published) {
      return NextResponse.json(
        { error: "Yayınlanmış round düzenlenemez.", errorCode: "ALREADY_PUBLISHED" },
        { status: 400 },
      );
    }

    const roundId = group.roundId;

    await prisma.$transaction(async (tx) => {
      // Remove these users from other groups in the same round (swap support)
      await tx.matchGroupMember.deleteMany({
        where: {
          userId: { in: memberIds },
          group: { roundId, id: { not: groupId } },
        },
      });

      // Replace all members of this group
      await tx.matchGroupMember.deleteMany({ where: { groupId } });
      await tx.matchGroupMember.createMany({
        data: memberIds.map((uid) => ({ groupId, userId: uid })),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json(
        { error: message, errorCode: message },
        { status: message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: message, errorCode: "UPDATE_FAILED" }, { status: 500 });
  }
}
