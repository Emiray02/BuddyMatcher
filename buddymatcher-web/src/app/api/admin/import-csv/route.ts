import bcrypt from "bcryptjs";
import { Country } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePublicTagsFromAnswers } from "@/lib/tags";

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
  avatarUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
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
      const answers = {
        openness: toInt(row.openness),
        conscientiousness: toInt(row.conscientiousness),
        extraversion: toInt(row.extraversion),
        agreeableness: toInt(row.agreeableness),
        neuroticism: toInt(row.neuroticism),
        interests: row.interests || "",
        travelAfterProgram: toBool(row.travelAfterProgram),
      };
      const tags = generatePublicTagsFromAnswers(answers);
      const avatarUrl = row.avatarUrl?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name?.trim() || email)}&background=1f74ff&color=fff`;

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
          openness: answers.openness,
          conscientiousness: answers.conscientiousness,
          extraversion: answers.extraversion,
          agreeableness: answers.agreeableness,
          neuroticism: answers.neuroticism,
          interests: answers.interests,
          bio: row.bio || "",
          travelAfterProgram: answers.travelAfterProgram,
          avatarUrl,
          instagramUrl: row.instagramUrl?.trim() || "",
          linkedinUrl: row.linkedinUrl?.trim() || "",
          xUrl: row.xUrl?.trim() || "",
          publicTags: tags,
          answersEditable: false,
        },
        update: {
          country: toCountry(row.country),
          openness: answers.openness,
          conscientiousness: answers.conscientiousness,
          extraversion: answers.extraversion,
          agreeableness: answers.agreeableness,
          neuroticism: answers.neuroticism,
          interests: answers.interests,
          bio: row.bio || "",
          travelAfterProgram: answers.travelAfterProgram,
          avatarUrl,
          instagramUrl: row.instagramUrl?.trim() || "",
          linkedinUrl: row.linkedinUrl?.trim() || "",
          xUrl: row.xUrl?.trim() || "",
          publicTags: tags,
          answersEditable: false,
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
