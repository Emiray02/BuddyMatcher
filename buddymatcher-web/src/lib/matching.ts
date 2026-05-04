import { Country, Profile, User } from "@prisma/client";

import { getSurveyScoresFromLegacyProfile, parseSurveyPayload } from "@/lib/survey";

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

type ForcedChoicesFromSurvey = NonNullable<ReturnType<typeof parseSurveyPayload>>["forcedChoices"];

const planningVectors: Record<ForcedChoicesFromSurvey["planningStyle"], [number, number]> = {
  plan_flexible: [0.7, 0.6],
  spontaneous_plan: [0.35, 0.9],
  structured_planner: [0.95, 0.2],
  flow_with_changes: [0.25, 0.95],
};

const buddyVectors: Record<ForcedChoicesFromSurvey["buddyPriority"], [number, number]> = {
  fun_social: [0.9, 0.45],
  calm_reliable: [0.35, 0.9],
  curious_deep_talks: [0.55, 0.85],
  action_oriented: [0.85, 0.7],
};

const activityVectors: Record<ForcedChoicesFromSurvey["idealActivity"], [number, number, number, number]> = {
  party_social: [0.95, 0.2, 0.3, 0.4],
  cultural_museum: [0.25, 0.95, 0.3, 0.45],
  mixed: [0.65, 0.65, 0.55, 0.55],
  outdoor_nature: [0.45, 0.35, 0.95, 0.5],
  food_coffee_walk: [0.55, 0.6, 0.45, 0.95],
};

const timeStyleScale: Record<ForcedChoicesFromSurvey["timeStyle"], number> = {
  early_bird: 1,
  late_morning_start: 2,
  balanced_mix: 2.5,
  night_owl: 4,
};

function vectorSimilarity(a: number[], b: number[]) {
  const avgDiff = a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) / a.length;
  return Math.max(0, Math.min(1, 1 - avgDiff));
}

function forcedChoiceSimilarity(a: ForcedChoicesFromSurvey, b: ForcedChoicesFromSurvey) {
  const planning = vectorSimilarity(planningVectors[a.planningStyle], planningVectors[b.planningStyle]);
  const buddy = vectorSimilarity(buddyVectors[a.buddyPriority], buddyVectors[b.buddyPriority]);
  const activity = vectorSimilarity(activityVectors[a.idealActivity], activityVectors[b.idealActivity]);
  const timeDiff = Math.abs(timeStyleScale[a.timeStyle] - timeStyleScale[b.timeStyle]);
  const time = Math.max(0, 1 - timeDiff / 3);

  return planning * 0.28 + buddy * 0.28 + activity * 0.26 + time * 0.18;
}

function compatibilityScore(a: Profile, b: Profile) {
  const aScores = getSurveyScoresFromLegacyProfile(a);
  const bScores = getSurveyScoresFromLegacyProfile(b);
  const aSurvey = parseSurveyPayload(a.interests);
  const bSurvey = parseSurveyPayload(b.interests);

  const weightedDimensions: Array<[keyof typeof aScores, number]> = [
    ["socialScore", 18],
    ["opennessScore", 16],
    ["flexibilityScore", 14],
    ["structureScore", 10],
    ["partyScore", 14],
    ["travelStyleScore", 12],
    ["communicationScore", 16],
  ];

  let totalWeight = 0;
  let weightedSimilarity = 0;
  for (const [field, weight] of weightedDimensions) {
    const diff = Math.abs(aScores[field] - bScores[field]);
    const similarity = 1 - diff / 9;
    weightedSimilarity += similarity * weight;
    totalWeight += weight;
  }

  const coreScore = (weightedSimilarity / totalWeight) * 76;
  const opennessBridgeScore = ((aScores.opennessScore + bScores.opennessScore) / 20) * 8;
  const rhythmDiff = Math.abs(aScores.nightRhythmScore - bScores.nightRhythmScore);
  const rhythmScore = (1 - rhythmDiff / 9) * 4;
  const travelAlignmentScore = (a.travelAfterProgram === b.travelAfterProgram ? 1 : 0) * 4;
  const forcedChoiceScore =
    aSurvey && bSurvey
      ? forcedChoiceSimilarity(aSurvey.forcedChoices, bSurvey.forcedChoices) * 8
      : 4.4;

  return clampScore(coreScore + opennessBridgeScore + rhythmScore + travelAlignmentScore + forcedChoiceScore);
}

function buildReason(a: Profile, b: Profile, score: number) {
  const aScores = getSurveyScoresFromLegacyProfile(a);
  const bScores = getSurveyScoresFromLegacyProfile(b);

  const socialDiff = Math.abs(aScores.socialScore - bScores.socialScore);
  const communicationDiff = Math.abs(aScores.communicationScore - bScores.communicationScore);
  const opennessAvg = (aScores.opennessScore + bScores.opennessScore) / 2;
  const travelAligned = a.travelAfterProgram === b.travelAfterProgram;

  const aSurvey = parseSurveyPayload(a.interests);
  const bSurvey = parseSurveyPayload(b.interests);
  const forcedChoiceAlignment =
    aSurvey && bSurvey
      ? (forcedChoiceSimilarity(aSurvey.forcedChoices, bSurvey.forcedChoices) * 100).toFixed(0)
      : "55";
  const activityHint =
    aSurvey && bSurvey
      ? aSurvey.forcedChoices.idealActivity === bSurvey.forcedChoices.idealActivity
        ? "Ideal activity preference aligned"
        : "Activity style offers healthy contrast"
      : "Activity preference from legacy profile";

  return `Survey-based compatibility: ${score.toFixed(1)} points. Social gap ${socialDiff.toFixed(0)}/9, communication gap ${communicationDiff.toFixed(0)}/9, openness average ${opennessAvg.toFixed(1)}/10. Travel plan alignment: ${travelAligned ? "yes" : "no"}. Forced-choice alignment: ${forcedChoiceAlignment}%. ${activityHint}.`;
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
    throw new Error("Eşleştirme için hem TR hem DE katılımcı gerekli.");
  }

  if (tr.length !== de.length) {
    throw new Error("1-1 zorunlu eşleştirme için TR ve DE sayıları eşit olmalı.");
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

// ── Flexible group matching (min 2, max 3 per group, 1 DE per group) ──────────

export type GroupMatchResult = {
  memberIds: string[]; // [TR1, (TR2 optional), DE]
  score: number;
  reason: string;
};

export function generateGroupMatches(participants: Participant[]): GroupMatchResult[] {
  const withProfile = participants.filter((p) => p.profile);

  const tr = withProfile.filter((p) => p.profile?.country === Country.TR);
  const de = withProfile.filter((p) => p.profile?.country === Country.DE);

  if (tr.length === 0 || de.length === 0) {
    throw new Error("Eşleştirme için hem TR hem DE katılımcı gerekli.");
  }

  if (tr.length < de.length) {
    throw new Error(
      `TR sayısı (${tr.length}) DE sayısından (${de.length}) az. Her DE için en az 1 TR gerekli.`,
    );
  }

  if (tr.length > de.length * 2) {
    throw new Error(
      `TR sayısı (${tr.length}) DE sayısının 2 katından (${de.length * 2}) fazla. Grup başına en fazla 2 TR.`,
    );
  }

  // Phase 1: Hungarian on (numDE rows) × (numTR cols) — each DE gets 1 TR
  const phase1Cost: number[][] = de.map((deUser) =>
    tr.map((trUser) => 100 - compatibilityScore(deUser.profile as Profile, trUser.profile as Profile)),
  );
  const phase1Assignment = hungarian(phase1Cost); // phase1Assignment[deIdx] = trIdx

  const assignedTRIndices = new Set(phase1Assignment);

  // Build initial groups (1 TR per group)
  const groupMap = new Map<string, { trs: Participant[]; de: Participant }>();
  phase1Assignment.forEach((trIdx, deIdx) => {
    groupMap.set(de[deIdx].id, { trs: [tr[trIdx]], de: de[deIdx] });
  });

  // Phase 2: greedily assign remaining TR to best-fit group with capacity < 2
  const remainingTR = tr.filter((_, i) => !assignedTRIndices.has(i));
  for (const trUser of remainingTR) {
    let bestDEId = "";
    let bestScore = -1;
    for (const deUser of de) {
      const group = groupMap.get(deUser.id)!;
      if (group.trs.length < 2) {
        const score = compatibilityScore(trUser.profile as Profile, deUser.profile as Profile);
        if (score > bestScore) {
          bestScore = score;
          bestDEId = deUser.id;
        }
      }
    }
    if (bestDEId) groupMap.get(bestDEId)!.trs.push(trUser);
  }

  return Array.from(groupMap.values()).map(({ trs, de: deUser }) => {
    const scores = trs.map((t) => compatibilityScore(t.profile as Profile, deUser.profile as Profile));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const scoreText = scores.map((s, i) => `TR${i + 1}↔DE: ${s.toFixed(1)}`).join(", ");
    const reason = `Group avg: ${clampScore(avgScore).toFixed(1)}. ${scoreText}.`;

    return {
      memberIds: [...trs.map((t) => t.id), deUser.id],
      score: clampScore(avgScore),
      reason,
    };
  });
}
