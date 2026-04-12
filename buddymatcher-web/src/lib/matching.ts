import { Country, Profile, User } from "@prisma/client";

type Participant = User & { profile: Profile | null };

type MatchResult = {
  personAId: string;
  personBId: string;
  score: number;
  reason: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function normalizedBigFiveDistance(a: Profile, b: Profile) {
  const fields: Array<keyof Pick<Profile, "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism">> = [
    "openness",
    "conscientiousness",
    "extraversion",
    "agreeableness",
    "neuroticism",
  ];

  let sumSq = 0;
  for (const field of fields) {
    const delta = a[field] - b[field];
    sumSq += delta * delta;
  }

  const maxDistance = Math.sqrt(fields.length * 9 * 9);
  return Math.sqrt(sumSq) / maxDistance;
}

function parseInterests(value: string) {
  return new Set(
    value
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}

function jaccardOverlap(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) {
    return 0.5;
  }

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function compatibilityScore(a: Profile, b: Profile) {
  const personalityDistance = normalizedBigFiveDistance(a, b);
  const personalityScore = (1 - personalityDistance) * 70;

  const interestsScore = jaccardOverlap(parseInterests(a.interests), parseInterests(b.interests)) * 20;
  const travelScore = (a.travelAfterProgram === b.travelAfterProgram ? 1 : 0) * 10;

  return clampScore(personalityScore + interestsScore + travelScore);
}

function buildReason(a: Profile, b: Profile, score: number) {
  const overlap = jaccardOverlap(parseInterests(a.interests), parseInterests(b.interests));
  const travelAligned = a.travelAfterProgram === b.travelAfterProgram;
  return `Big Five uyumu ve ilgi alani ortusmesiyle ${score.toFixed(1)} puan. Ilgi ortusmesi: ${(overlap * 100).toFixed(0)}%. Seyahat plani uyumu: ${travelAligned ? "evet" : "hayir"}.`;
}

function hungarian(costs: number[][]) {
  const n = costs.length;
  const m = costs[0].length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i += 1) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= m; j += 1) {
        if (used[j]) {
          continue;
        }
        const cur = costs[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (let j = 0; j <= m; j += 1) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= m; j += 1) {
    if (p[j] > 0) {
      assignment[p[j] - 1] = j - 1;
    }
  }
  return assignment;
}

export function generateOptimalBuddyMatches(participants: Participant[]): MatchResult[] {
  const withProfile = participants.filter((p) => p.profile);

  const tr = withProfile.filter((p) => p.profile?.country === Country.TR);
  const de = withProfile.filter((p) => p.profile?.country === Country.DE);

  if (tr.length === 0 || de.length === 0) {
    throw new Error("Eslestirme icin hem TR hem DE katilimci gerekli.");
  }

  if (tr.length !== de.length) {
    throw new Error("1-1 zorunlu eslestirme icin TR ve DE sayilari esit olmali.");
  }

  const costMatrix: number[][] = tr.map((trUser) =>
    de.map((deUser) => {
      const score = compatibilityScore(trUser.profile as Profile, deUser.profile as Profile);
      return 100 - score;
    }),
  );

  const assignment = hungarian(costMatrix);

  return assignment.map((deIndex, trIndex) => {
    const trUser = tr[trIndex];
    const deUser = de[deIndex];
    const score = 100 - costMatrix[trIndex][deIndex];
    return {
      personAId: trUser.id,
      personBId: deUser.id,
      score,
      reason: buildReason(trUser.profile as Profile, deUser.profile as Profile, score),
    };
  });
}
