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

// ── 2 TR + 1 DE group matching ────────────────────────────────────────────────

export type GroupMatchResult = {
  memberIds: string[]; // [TR1, TR2, DE]
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

  if (tr.length !== de.length * 2) {
    throw new Error(
      `Grup eşleştirme için TR katılımcı sayısı DE sayısının tam 2 katı olmalı. (TR: ${tr.length}, DE: ${de.length})`,
    );
  }

  // Duplicate DE entries → 2 slots per DE person (indices 0..N-1 and N..2N-1)
  const deSlots = [...de, ...de];

  const costMatrix: number[][] = tr.map((trUser) =>
    deSlots.map((deUser) => 100 - compatibilityScore(trUser.profile as Profile, deUser.profile as Profile)),
  );

  const assignment = hungarian(costMatrix);

  // Group TR members by their assigned DE person
  const groupMap = new Map<string, { trs: Array<{ user: Participant; score: number }>; de: Participant }>();

  assignment.forEach((deSlotIdx, trIdx) => {
    const trUser = tr[trIdx];
    const deUser = deSlots[deSlotIdx];
    const score = 100 - costMatrix[trIdx][deSlotIdx];

    if (!groupMap.has(deUser.id)) {
      groupMap.set(deUser.id, { trs: [], de: deUser });
    }
    groupMap.get(deUser.id)!.trs.push({ user: trUser, score });
  });

  return Array.from(groupMap.values()).map(({ trs, de: deUser }) => {
    const avgScore = trs.reduce((s, t) => s + t.score, 0) / trs.length;
    const tr1deScore = trs[0]?.score.toFixed(1) ?? "?";
    const tr2deScore = trs[1]?.score.toFixed(1) ?? "?";
    const tr1tr2Score = trs.length >= 2
      ? compatibilityScore(trs[0].user.profile as Profile, trs[1].user.profile as Profile).toFixed(1)
      : "?";
    const reason = `Group compatibility: ${clampScore(avgScore).toFixed(1)}. TR1↔DE: ${tr1deScore}, TR2↔DE: ${tr2deScore}, TR1↔TR2: ${tr1tr2Score}.`;

    return {
      memberIds: [trs[0].user.id, trs[1].user.id, deUser.id],
      score: clampScore(avgScore),
      reason,
    };
  });
}
