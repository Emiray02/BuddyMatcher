type AnswersForTagging = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  interests: string;
  travelAfterProgram: boolean;
};

function parseInterests(interests: string) {
  return interests
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function includesAny(source: string[], keywords: string[]) {
  return keywords.some((keyword) => source.some((item) => item.includes(keyword)));
}

export function generatePublicTagsFromAnswers(input: AnswersForTagging): string[] {
  const interests = parseInterests(input.interests);

  const candidates: Array<{ tag: string; score: number }> = [
    { tag: "Explorer", score: input.openness * 1.2 },
    { tag: "Reliable Planner", score: input.conscientiousness * 1.25 },
    { tag: "Social Connector", score: (input.extraversion + input.agreeableness) / 2 * 1.2 },
    { tag: "Calm Mind", score: (11 - input.neuroticism) * 1.15 },
    {
      tag: "Culture Lover",
      score:
        (includesAny(interests, ["music", "muzik", "kunst", "art", "dance", "dans", "history", "culture", "kultur"]) ? 8 : 0) +
        input.openness * 0.4,
    },
    {
      tag: "Adventure Seeker",
      score:
        (input.travelAfterProgram ? 8 : 0) +
        (includesAny(interests, ["travel", "seyahat", "hiking", "nature", "camp", "trip"]) ? 6 : 0),
    },
    {
      tag: "Team Player",
      score: (input.agreeableness + input.conscientiousness) / 2,
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
