import { parseSurveyPayload } from "@/lib/survey";

type AnswersForTagging = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  interests: string;
  travelAfterProgram: boolean;
  socialScore?: number;
  opennessScore?: number;
  flexibilityScore?: number;
  structureScore?: number;
  partyScore?: number;
  travelStyleScore?: number;
  communicationScore?: number;
};

function parseInterests(interests: string) {
  if (interests.trim().startsWith("{")) {
    return [];
  }

  return interests
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function includesAny(source: string[], keywords: string[]) {
  return keywords.some((keyword) => source.some((item) => item.includes(keyword)));
}

export function generatePublicTagsFromAnswers(input: AnswersForTagging): string[] {
  const survey = parseSurveyPayload(input.interests);
  const socialScore = input.socialScore ?? survey?.scores.socialScore ?? input.extraversion;
  const opennessScore = input.opennessScore ?? survey?.scores.opennessScore ?? input.openness;
  const flexibilityScore = input.flexibilityScore ?? survey?.scores.flexibilityScore ?? Math.max(1, 11 - input.neuroticism);
  const structureScore = input.structureScore ?? survey?.scores.structureScore ?? input.conscientiousness;
  const partyScore = input.partyScore ?? survey?.scores.partyScore ?? Math.round((input.extraversion + (11 - input.agreeableness)) / 2);
  const travelStyleScore = input.travelStyleScore ?? survey?.scores.travelStyleScore ?? (input.travelAfterProgram ? 7 : 4);
  const communicationScore = input.communicationScore ?? survey?.scores.communicationScore ?? input.agreeableness;

  const interests = parseInterests(input.interests);

  const candidates: Array<{ tag: string; score: number }> = [
    { tag: "Explorer", score: opennessScore * 1.2 },
    { tag: "Reliable Planner", score: structureScore * 1.25 },
    { tag: "Social Connector", score: (socialScore + communicationScore) / 2 * 1.2 },
    { tag: "Calm Mind", score: flexibilityScore * 1.15 },
    { tag: "Adaptive Buddy", score: ((flexibilityScore + communicationScore) / 2) * 1.1 },
    { tag: "Party Spark", score: partyScore * 1.05 },
    {
      tag: "Culture Lover",
      score:
        (includesAny(interests, ["music", "muzik", "kunst", "art", "dance", "dans", "history", "culture", "kultur"]) ? 8 : 0) +
        opennessScore * 0.4,
    },
    {
      tag: "Adventure Seeker",
      score:
        (input.travelAfterProgram ? 6 : 0) +
        travelStyleScore * 0.6 +
        (includesAny(interests, ["travel", "seyahat", "hiking", "nature", "camp", "trip"]) ? 6 : 0),
    },
    {
      tag: "Team Player",
      score: (communicationScore + structureScore) / 2,
    },
  ];

  const sorted = candidates
    .sort((a, b) => b.score - a.score)
    .map((x) => x.tag);

  const unique: string[] = [];
  for (const tag of sorted) {
    if (!unique.includes(tag)) {
      unique.push(tag);
    }
    if (unique.length === 3) {
      break;
    }
  }

  while (unique.length < 3) {
    unique.push(["Open-Minded", "Collaborative", "Curious"][unique.length]);
  }

  return unique;
}
