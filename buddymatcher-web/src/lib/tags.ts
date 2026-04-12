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
  const forcedChoices = survey?.forcedChoices;
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
    { tag: "Social Connector", score: ((socialScore + communicationScore) / 2) * 1.2 },
    { tag: "Calm Mind", score: flexibilityScore * 1.15 },
    { tag: "Adaptive Buddy", score: ((flexibilityScore + communicationScore) / 2) * 1.1 },
    { tag: "Party Spark", score: partyScore * 1.05 },
    { tag: "Conversation Pro", score: communicationScore * 1.12 },
    { tag: "Bridge Builder", score: ((opennessScore + communicationScore) / 2) * 1.08 },
    { tag: "Global Mindset", score: ((opennessScore + travelStyleScore) / 2) * 1.08 },
    { tag: "Steady Rhythm", score: ((structureScore + communicationScore) / 2) * 1.05 },
    {
      tag: "Culture Lover",
      score:
        (includesAny(interests, ["music", "muzik", "kunst", "art", "dance", "dans", "history", "culture", "kultur"]) ? 8 : 0) +
        opennessScore * 0.45,
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
    {
      tag: "Structured Strategist",
      score: forcedChoices?.planningStyle === "structured_planner" ? 11 : structureScore * 0.7,
    },
    {
      tag: "Flow Navigator",
      score:
        forcedChoices?.planningStyle === "flow_with_changes" || forcedChoices?.planningStyle === "spontaneous_plan"
          ? 10.5
          : flexibilityScore * 0.65,
    },
    {
      tag: "Deep Talk Enthusiast",
      score: forcedChoices?.buddyPriority === "curious_deep_talks" ? 11 : communicationScore * 0.6,
    },
    {
      tag: "Action Buddy",
      score:
        forcedChoices?.buddyPriority === "action_oriented"
          ? 11
          : (partyScore + travelStyleScore) * 0.35,
    },
    {
      tag: "Outdoor Explorer",
      score:
        forcedChoices?.idealActivity === "outdoor_nature"
          ? 10.8
          : includesAny(interests, ["nature", "hiking", "camp", "outdoor", "trek"]) ? 8 : 0,
    },
    {
      tag: "City Walker",
      score:
        forcedChoices?.idealActivity === "food_coffee_walk"
          ? 10.8
          : includesAny(interests, ["coffee", "kafe", "city", "urban", "food", "gastronomy"]) ? 8 : 0,
    },
    {
      tag: "Night Energy",
      score:
        forcedChoices?.timeStyle === "night_owl"
          ? 10.8
          : partyScore * 0.6,
    },
    {
      tag: "Morning Momentum",
      score:
        forcedChoices?.timeStyle === "early_bird"
          ? 10.8
          : structureScore * 0.62,
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
    if (unique.length === 5) {
      break;
    }
  }

  while (unique.length < 5) {
    unique.push(["Open-Minded", "Collaborative", "Curious", "Friendly", "Motivated"][unique.length]);
  }

  return unique;
}
