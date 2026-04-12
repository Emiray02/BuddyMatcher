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

function compatibilityScore(a: Profile, b: Profile) {
  const aScores = getSurveyScoresFromLegacyProfile(a);
  const bScores = getSurveyScoresFromLegacyProfile(b);

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

  const coreScore = (weightedSimilarity / totalWeight) * 84;
  const opennessBridgeScore = ((aScores.opennessScore + bScores.opennessScore) / 20) * 8;
  const rhythmDiff = Math.abs(aScores.nightRhythmScore - bScores.nightRhythmScore);
  const rhythmScore = (1 - rhythmDiff / 9) * 4;
  const travelAlignmentScore = (a.travelAfterProgram === b.travelAfterProgram ? 1 : 0) * 4;

  return clampScore(coreScore + opennessBridgeScore + rhythmScore + travelAlignmentScore);
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
  const activityHint =
    aSurvey && bSurvey
      ? aSurvey.forcedChoices.idealActivity === bSurvey.forcedChoices.idealActivity
        ? "Ideal activity preference aligned"
        : "Activity style offers healthy contrast"
      : "Activity preference from legacy profile";

  return `Survey-based compatibility: ${score.toFixed(1)} points. Social gap ${socialDiff.toFixed(0)}/9, communication gap ${communicationDiff.toFixed(0)}/9, openness average ${opennessAvg.toFixed(1)}/10. Travel plan alignment: ${travelAligned ? "yes" : "no"}. ${activityHint}.`;
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
