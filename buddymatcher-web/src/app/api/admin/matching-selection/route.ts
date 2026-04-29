import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  userId: z.string().min(1),
  includedInMatching: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const payload = payloadSchema.parse(await request.json());
    const profile = await prisma.profile.findUnique({ where: { userId: payload.userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await prisma.profile.update({
      where: { userId: payload.userId },
      data: { includedInMatching: payload.includedInMatching },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Request failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
