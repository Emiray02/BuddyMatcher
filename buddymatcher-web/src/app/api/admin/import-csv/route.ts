import bcrypt from "bcryptjs";
import { Country } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CsvRow = {
  name: string;
  email: string;
  country: string;
  openness: string;
  conscientiousness: string;
  extraversion: string;
  agreeableness: string;
  neuroticism: string;
  interests: string;
  bio?: string;
  travelAfterProgram?: string;
  password?: string;
};

function toCountry(value: string) {
  const upper = value.trim().toUpperCase();
  if (upper === "TR") {
    return Country.TR;
  }
  if (upper === "DE") {
    return Country.DE;
  }
  throw new Error("country must be TR or DE");
}

function toInt(value: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    throw new Error("Big Five values must be integer between 1-10");
  }
  return n;
}

function toBool(value: string | undefined) {
  if (!value) {
    return false;
  }
  return ["true", "1", "evet", "yes", "ja"].includes(value.trim().toLowerCase());
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file required" }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    const defaultPassword = process.env.DEFAULT_IMPORT_PASSWORD ?? "ChangeMe123!";

    let processed = 0;
    for (const row of rows) {
      const email = row.email?.trim().toLowerCase();
      if (!email) {
        continue;
      }

      const plainPassword = row.password?.trim() || defaultPassword;
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      const user = await prisma.user.upsert({
        where: { email },
        create: {
          name: row.name?.trim() || email,
          email,
          passwordHash,
          role: "USER",
        },
        update: {
          name: row.name?.trim() || email,
          passwordHash,
        },
      });

      await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          country: toCountry(row.country),
          openness: toInt(row.openness),
          conscientiousness: toInt(row.conscientiousness),
          extraversion: toInt(row.extraversion),
          agreeableness: toInt(row.agreeableness),
          neuroticism: toInt(row.neuroticism),
          interests: row.interests || "",
          bio: row.bio || "",
          travelAfterProgram: toBool(row.travelAfterProgram),
        },
        update: {
          country: toCountry(row.country),
          openness: toInt(row.openness),
          conscientiousness: toInt(row.conscientiousness),
          extraversion: toInt(row.extraversion),
          agreeableness: toInt(row.agreeableness),
          neuroticism: toInt(row.neuroticism),
          interests: row.interests || "",
          bio: row.bio || "",
          travelAfterProgram: toBool(row.travelAfterProgram),
        },
      });
      processed += 1;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    if (["UNAUTHORIZED", "FORBIDDEN"].includes(message)) {
      return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
