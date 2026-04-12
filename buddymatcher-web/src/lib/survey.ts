export type LikertValue = 1 | 2 | 3 | 4 | 5;

export const SECTION_QUESTION_IDS = {
  social: ["social_1", "social_2", "social_3", "social_4", "social_5", "social_6", "social_7", "social_8"],
  openness: ["open_1", "open_2", "open_3", "open_4", "open_5", "open_6", "open_7"],
  planning: ["plan_1", "plan_2", "plan_3", "plan_4", "plan_5", "plan_6", "plan_7"],
  party: ["party_1", "party_2", "party_3", "party_4", "party_5", "party_6"],
  daily: ["daily_1", "daily_2", "daily_3", "daily_4"],
  travelStyle: ["travel_2", "travel_3", "travel_4"],
  communication: ["comm_1", "comm_2", "comm_3", "comm_4"],
} as const;

export const LIKERT_QUESTION_IDS = [
  ...SECTION_QUESTION_IDS.social,
  ...SECTION_QUESTION_IDS.openness,
  ...SECTION_QUESTION_IDS.planning,
  ...SECTION_QUESTION_IDS.party,
  ...SECTION_QUESTION_IDS.daily,
  ...SECTION_QUESTION_IDS.travelStyle,
  ...SECTION_QUESTION_IDS.communication,
] as const;

const LIKERT_ID_SET = new Set<string>(LIKERT_QUESTION_IDS);

export type LikertQuestionId = (typeof LIKERT_QUESTION_IDS)[number];
export type LikertAnswers = Record<LikertQuestionId, LikertValue>;

export type PlanningStyle = "plan_flexible" | "spontaneous_plan";
export type BuddyPriority = "fun_social" | "calm_reliable";
export type IdealActivity = "party_social" | "cultural_museum" | "mixed";
export type TimeStyle = "early_bird" | "night_owl";

export type ForcedChoices = {
  planningStyle: PlanningStyle;
  buddyPriority: BuddyPriority;
  idealActivity: IdealActivity;
  timeStyle: TimeStyle;
};

export type SurveyScores = {
  socialScore: number;
  opennessScore: number;
  flexibilityScore: number;
  structureScore: number;
  partyScore: number;
  travelStyleScore: number;
  communicationScore: number;
  nightRhythmScore: number;
};

export type SurveyPayload = {
  version: 2;
  likertAnswers: LikertAnswers;
  travelAfterProgram: boolean;
  forcedChoices: ForcedChoices;
  scores: SurveyScores;
};

export type LegacyProfileSnapshot = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  interests: string;
  travelAfterProgram: boolean;
};

export const DEFAULT_FORCED_CHOICES: ForcedChoices = {
  planningStyle: "plan_flexible",
  buddyPriority: "calm_reliable",
  idealActivity: "mixed",
  timeStyle: "early_bird",
};

export const SURVEY_SECTIONS = [
  {
    id: "social",
    title: "1. Social Energy & Interaction",
    questions: [
      "I easily start conversations with new people.",
      "I enjoy being in large social groups.",
      "I feel energized after social interactions.",
      "I prefer spending time alone rather than with a group.",
      "I actively participate in group activities.",
      "I like meeting new people from different backgrounds.",
      "I feel comfortable being the center of attention.",
      "I usually wait for others to approach me first.",
    ],
    questionIds: SECTION_QUESTION_IDS.social,
  },
  {
    id: "openness",
    title: "2. Openness & Cultural Curiosity",
    questions: [
      "I am excited to experience new cultures.",
      "I enjoy trying unfamiliar foods.",
      "I like learning different perspectives.",
      "I feel uncomfortable in unfamiliar environments.",
      "I adapt quickly to new situations.",
      "I enjoy stepping outside my comfort zone.",
      "I am curious about how people live in other countries.",
    ],
    questionIds: SECTION_QUESTION_IDS.openness,
  },
  {
    id: "planning",
    title: "3. Planning & Lifestyle",
    questions: [
      "I prefer having a clear plan for the day.",
      "I get stressed when plans change suddenly.",
      "I like organizing activities in advance.",
      "I enjoy spontaneous decisions.",
      "Being on time is very important to me.",
      "I prefer structured schedules over flexible ones.",
      "I can easily adjust to unexpected changes.",
    ],
    questionIds: SECTION_QUESTION_IDS.planning,
  },
  {
    id: "party",
    title: "4. Social Activities & Party Style",
    questions: [
      "I enjoy nightlife and parties.",
      "I like high-energy social environments.",
      "I prefer calm and quiet activities.",
      "I enjoy dancing or active social events.",
      "I feel comfortable in loud environments.",
      "I prefer meaningful conversations over parties.",
    ],
    questionIds: SECTION_QUESTION_IDS.party,
  },
  {
    id: "daily",
    title: "5. Daily Rhythm",
    questions: [
      "I am more productive in the morning.",
      "I enjoy staying up late.",
      "I prefer starting the day early.",
      "I feel active during late hours.",
    ],
    questionIds: SECTION_QUESTION_IDS.daily,
  },
  {
    id: "travel",
    title: "6. Travel & Exploration",
    questions: [
      "I prefer fast-paced travel schedules.",
      "I enjoy exploring multiple places in one day.",
      "I prefer relaxed travel with fewer activities.",
    ],
    questionIds: SECTION_QUESTION_IDS.travelStyle,
  },
  {
    id: "communication",
    title: "7. Communication & Comfort",
    questions: [
      "I feel confident communicating in English.",
      "I enjoy deep conversations with new people.",
      "I can maintain conversations easily.",
      "I prefer listening rather than speaking.",
    ],
    questionIds: SECTION_QUESTION_IDS.communication,
  },
] as const;

export const FORCED_CHOICE_TEXT = {
  planningStyle: {
    title: "Which describes you better?",
    options: {
      plan_flexible: "I plan ahead but can be flexible",
      spontaneous_plan: "I am spontaneous but can plan when needed",
    },
  },
  buddyPriority: {
    title: "Which matters more in a buddy?",
    options: {
      fun_social: "Fun and social",
      calm_reliable: "Calm and reliable",
    },
  },
  idealActivity: {
    title: "Ideal activity choice",
    options: {
      party_social: "Party / Social",
      cultural_museum: "Cultural / Museum",
      mixed: "Mixed",
    },
  },
  timeStyle: {
    title: "Preferred time style",
    options: {
      early_bird: "Early sleeper / early riser",
      night_owl: "Late sleeper / night active",
    },
  },
} as const;

export type SurveyLocale = "tr" | "de" | "en";

type SurveySectionId = (typeof SURVEY_SECTIONS)[number]["id"];

type LocalizedForcedChoiceText = {
  planningStyle: {
    title: string;
    options: Record<PlanningStyle, string>;
  };
  buddyPriority: {
    title: string;
    options: Record<BuddyPriority, string>;
  };
  idealActivity: {
    title: string;
    options: Record<IdealActivity, string>;
  };
  timeStyle: {
    title: string;
    options: Record<TimeStyle, string>;
  };
};

type SurveyUiText = {
  sectionTitles: Record<SurveySectionId, string>;
  sectionQuestions: Record<SurveySectionId, string[]>;
  forcedChoiceText: LocalizedForcedChoiceText;
  likertLabels: [string, string, string, string, string];
  likertTitle: string;
  likertLegend: string;
  forcedChoiceHeading: string;
  travelPrompt: string;
  yesLabel: string;
  noLabel: string;
  scoreLabels: {
    social: string;
    openness: string;
    flexStructure: string;
    partyCommunication: string;
  };
  wizard: {
    title: string;
    subtitle: string;
    back: string;
    next: string;
    continueToProfile: string;
    completeProfile: string;
    progress: string;
    profileTitle: string;
    profileSubtitle: string;
    profileCountry: string;
    answerAllInSection: string;
    completeForcedChoices: string;
    introTitle: string;
    introBody: string;
    introStepOne: string;
    introStepTwo: string;
    introStepThree: string;
    introAction: string;
  };
};

const SURVEY_UI_TEXT: Record<SurveyLocale, SurveyUiText> = {
  en: {
    sectionTitles: {
      social: "1. Social Energy & Interaction",
      openness: "2. Openness & Cultural Curiosity",
      planning: "3. Planning & Lifestyle",
      party: "4. Social Activities & Party Style",
      daily: "5. Daily Rhythm",
      travel: "6. Travel & Exploration",
      communication: "7. Communication & Comfort",
    },
    sectionQuestions: {
      social: [
        "I easily start conversations with new people.",
        "I enjoy being in large social groups.",
        "I feel energized after social interactions.",
        "I prefer spending time alone rather than with a group.",
        "I actively participate in group activities.",
        "I like meeting new people from different backgrounds.",
        "I feel comfortable being the center of attention.",
        "I usually wait for others to approach me first.",
      ],
      openness: [
        "I am excited to experience new cultures.",
        "I enjoy trying unfamiliar foods.",
        "I like learning different perspectives.",
        "I feel uncomfortable in unfamiliar environments.",
        "I adapt quickly to new situations.",
        "I enjoy stepping outside my comfort zone.",
        "I am curious about how people live in other countries.",
      ],
      planning: [
        "I prefer having a clear plan for the day.",
        "I get stressed when plans change suddenly.",
        "I like organizing activities in advance.",
        "I enjoy spontaneous decisions.",
        "Being on time is very important to me.",
        "I prefer structured schedules over flexible ones.",
        "I can easily adjust to unexpected changes.",
      ],
      party: [
        "I enjoy nightlife and parties.",
        "I like high-energy social environments.",
        "I prefer calm and quiet activities.",
        "I enjoy dancing or active social events.",
        "I feel comfortable in loud environments.",
        "I prefer meaningful conversations over parties.",
      ],
      daily: [
        "I am more productive in the morning.",
        "I enjoy staying up late.",
        "I prefer starting the day early.",
        "I feel active during late hours.",
      ],
      travel: [
        "I prefer fast-paced travel schedules.",
        "I enjoy exploring multiple places in one day.",
        "I prefer relaxed travel with fewer activities.",
      ],
      communication: [
        "I feel confident communicating in English.",
        "I enjoy deep conversations with new people.",
        "I can maintain conversations easily.",
        "I prefer listening rather than speaking.",
      ],
    },
    forcedChoiceText: FORCED_CHOICE_TEXT,
    likertLabels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    likertTitle: "Likert Scale",
    likertLegend: "1 = Strongly disagree, 5 = Strongly agree",
    forcedChoiceHeading: "8. Forced Choice",
    travelPrompt: "I want to travel after the program.",
    yesLabel: "Yes",
    noLabel: "No",
    scoreLabels: {
      social: "Social",
      openness: "Openness",
      flexStructure: "Flexibility / Structure",
      partyCommunication: "Party / Communication",
    },
    wizard: {
      title: "Step 1: Buddy Matcher Questions",
      subtitle: "Answer all required questions to generate your compatibility profile.",
      back: "Back",
      next: "Next Section",
      continueToProfile: "Continue to Profile",
      completeProfile: "Complete Profile",
      progress: "Progress",
      profileTitle: "Step 2: Complete Public Profile",
      profileSubtitle: "Add your photo, bio and social links before joining participants.",
      profileCountry: "Country",
      answerAllInSection: "Please answer all questions in this section.",
      completeForcedChoices: "Please complete all forced-choice fields and travel selection.",
      introTitle: "Welcome, your Buddy journey starts now",
      introBody: "You are on the onboarding flow. Here is what happens next:",
      introStepOne: "Answer all matching questions.",
      introStepTwo: "Complete your public profile with photo and bio.",
      introStepThree: "Join Istkon'26 Participants and discover everyone.",
      introAction: "Start now",
    },
  },
  tr: {
    sectionTitles: {
      social: "1. Sosyal Enerji ve Etkileşim",
      openness: "2. Açıklık ve Kültürel Merak",
      planning: "3. Planlama ve Yaşam Tarzı",
      party: "4. Sosyal Aktivite ve Parti Tarzı",
      daily: "5. Günlük Ritim",
      travel: "6. Seyahat ve Keşif",
      communication: "7. İletişim ve Konfor",
    },
    sectionQuestions: {
      social: [
        "Yeni insanlarla kolayca konuşma başlatırım.",
        "Kalabalık sosyal gruplarda bulunmaktan hoşlanırım.",
        "Sosyal etkileşimlerden sonra enerji kazanırım.",
        "Grupla vakit geçirmek yerine yalnız kalmayı tercih ederim.",
        "Grup aktivitelerine aktif katılırım.",
        "Farklı geçmişlere sahip yeni insanlarla tanışmayı severim.",
        "İlgi odağı olmaktan rahatsız olmam.",
        "Genelde önce diğerlerinin yaklaşmasını beklerim.",
      ],
      openness: [
        "Yeni kültürleri deneyimlemek beni heyecanlandırır.",
        "Alışılmadık yemekleri denemeyi severim.",
        "Farklı bakış açılarını öğrenmekten hoşlanırım.",
        "Bilinmeyen ortamlarda rahatsız hissederim.",
        "Yeni durumlara hızlı uyum sağlarım.",
        "Konfor alanımın dışına çıkmaktan keyif alırım.",
        "Diğer ülkelerde insanların nasıl yaşadığını merak ederim.",
      ],
      planning: [
        "Günü net bir planla geçirmeyi tercih ederim.",
        "Planlar aniden değiştiğinde strese girerim.",
        "Aktiviteleri önceden organize etmeyi severim.",
        "Spontane kararlar almaktan keyif alırım.",
        "Dakik olmak benim için çok önemlidir.",
        "Esnek takvim yerine yapılandırılmış programları tercih ederim.",
        "Beklenmedik değişikliklere kolayca uyum sağlarım.",
      ],
      party: [
        "Gece hayatı ve partilerden hoşlanırım.",
        "Yüksek enerjili sosyal ortamları severim.",
        "Sakin ve sessiz aktiviteleri tercih ederim.",
        "Dans etmeyi veya hareketli sosyal etkinlikleri severim.",
        "Gürültülü ortamlarda rahat hissederim.",
        "Partiler yerine derin sohbetleri tercih ederim.",
      ],
      daily: [
        "Sabah saatlerinde daha verimli olurum.",
        "Geç saatlere kadar ayakta kalmaktan hoşlanırım.",
        "Güne erken başlamayı tercih ederim.",
        "Geç saatlerde daha aktif hissederim.",
      ],
      travel: [
        "Hızlı tempolu seyahat planlarını tercih ederim.",
        "Bir günde birden fazla yeri keşfetmekten hoşlanırım.",
        "Daha az aktiviteyle rahat tempoda gezmeyi tercih ederim.",
      ],
      communication: [
        "İngilizce iletişime girerken kendime güvenirim.",
        "Yeni insanlarla derin sohbetleri severim.",
        "Sohbeti kolayca sürdürebilirim.",
        "Konuşmaktan çok dinlemeyi tercih ederim.",
      ],
    },
    forcedChoiceText: {
      planningStyle: {
        title: "Seni hangisi daha iyi anlatır?",
        options: {
          plan_flexible: "Önceden plan yaparım ama esnek kalabilirim",
          spontaneous_plan: "Spontaneyim ama gerektiğinde plan yaparım",
        },
      },
      buddyPriority: {
        title: "Bir buddyde hangisi daha önemli?",
        options: {
          fun_social: "Eğlenceli ve sosyal",
          calm_reliable: "Sakin ve güvenilir",
        },
      },
      idealActivity: {
        title: "İdeal aktivite seçimi",
        options: {
          party_social: "Parti / Sosyal",
          cultural_museum: "Kültürel / Müze",
          mixed: "Karışık",
        },
      },
      timeStyle: {
        title: "Tercih edilen zaman düzeni",
        options: {
          early_bird: "Erken uyur / erken kalkar",
          night_owl: "Geç uyur / gece aktif",
        },
      },
    },
    likertLabels: ["Kesinlikle katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle katılıyorum"],
    likertTitle: "Likert Ölçeği",
    likertLegend: "1 = Kesinlikle katılmıyorum, 5 = Kesinlikle katılıyorum",
    forcedChoiceHeading: "8. Zorunlu Seçim",
    travelPrompt: "Program sonrasında seyahat etmek istiyorum.",
    yesLabel: "Evet",
    noLabel: "Hayır",
    scoreLabels: {
      social: "Sosyal",
      openness: "Açıklık",
      flexStructure: "Esneklik / Yapı",
      partyCommunication: "Parti / İletişim",
    },
    wizard: {
      title: "Adım 1: Buddy Matcher Soruları",
      subtitle: "Uyum profilini oluşturmak için tüm zorunlu soruları cevapla.",
      back: "Geri",
      next: "Sonraki Bölüm",
      continueToProfile: "Profile Geç",
      completeProfile: "Profili Tamamla",
      progress: "İlerleme",
      profileTitle: "Adım 2: Herkese Açık Profilini Tamamla",
      profileSubtitle: "Katılımcılara katılmadan önce fotoğrafın, bio'n ve sosyal linklerini ekle.",
      profileCountry: "Ülke",
      answerAllInSection: "Lütfen bu bölümdeki tüm soruları cevapla.",
      completeForcedChoices: "Lütfen tüm zorunlu seçimleri ve seyahat seçimini tamamla.",
      introTitle: "Hoş geldin, Buddy yolculuğun şimdi başlıyor",
      introBody: "Onboarding akışındasın. Sırada bunlar var:",
      introStepOne: "Tüm eşleştirme sorularını cevapla.",
      introStepTwo: "Fotoğraf ve bio ile herkese açık profilini tamamla.",
      introStepThree: "Istkon'26 Participants sayfasına katılıp herkesi keşfet.",
      introAction: "Hadi başlayalım",
    },
  },
  de: {
    sectionTitles: {
      social: "1. Soziale Energie und Interaktion",
      openness: "2. Offenheit und kulturelle Neugier",
      planning: "3. Planung und Lebensstil",
      party: "4. Soziale Aktivitaeten und Partystil",
      daily: "5. Tagesrhythmus",
      travel: "6. Reisen und Entdecken",
      communication: "7. Kommunikation und Komfort",
    },
    sectionQuestions: {
      social: [
        "Ich beginne leicht Gespraeche mit neuen Menschen.",
        "Ich bin gern in grossen sozialen Gruppen.",
        "Nach sozialen Interaktionen fuehle ich mich energievoll.",
        "Ich verbringe lieber Zeit allein als in einer Gruppe.",
        "Ich beteilige mich aktiv an Gruppenaktivitaeten.",
        "Ich lerne gern neue Menschen aus verschiedenen Hintergruenden kennen.",
        "Ich fuehle mich wohl im Mittelpunkt.",
        "Ich warte meistens, bis andere zuerst auf mich zugehen.",
      ],
      openness: [
        "Ich freue mich darauf, neue Kulturen zu erleben.",
        "Ich probiere gern ungewohnte Speisen.",
        "Ich lerne gern unterschiedliche Perspektiven kennen.",
        "In unbekannten Umgebungen fuehle ich mich unwohl.",
        "Ich passe mich schnell an neue Situationen an.",
        "Ich gehe gern aus meiner Komfortzone heraus.",
        "Ich bin neugierig, wie Menschen in anderen Laendern leben.",
      ],
      planning: [
        "Ich habe fuer den Tag gern einen klaren Plan.",
        "Ich bin gestresst, wenn sich Plaene ploetzlich aendern.",
        "Ich organisiere Aktivitaeten gern im Voraus.",
        "Ich mag spontane Entscheidungen.",
        "Puenktlichkeit ist mir sehr wichtig.",
        "Ich bevorzuge strukturierte Zeitplaene statt flexibler Plaene.",
        "Ich kann mich leicht an unerwartete Aenderungen anpassen.",
      ],
      party: [
        "Ich mag Nachtleben und Partys.",
        "Ich mag soziale Umgebungen mit hoher Energie.",
        "Ich bevorzuge ruhige und stille Aktivitaeten.",
        "Ich mag Tanzen oder aktive soziale Events.",
        "Ich fuehle mich in lauten Umgebungen wohl.",
        "Ich bevorzuge bedeutungsvolle Gespraeche statt Partys.",
      ],
      daily: [
        "Am Morgen bin ich produktiver.",
        "Ich bleibe gern lange wach.",
        "Ich beginne den Tag lieber frueh.",
        "In spaeten Stunden fuehle ich mich aktiver.",
      ],
      travel: [
        "Ich bevorzuge Reisen mit schnellem Tempo.",
        "Ich entdecke gern mehrere Orte an einem Tag.",
        "Ich bevorzuge entspanntes Reisen mit weniger Aktivitaeten.",
      ],
      communication: [
        "Ich kommuniziere sicher auf Englisch.",
        "Ich fuehre gern tiefe Gespraeche mit neuen Menschen.",
        "Ich kann Gespraeche leicht aufrechterhalten.",
        "Ich hoere lieber zu als selbst viel zu sprechen.",
      ],
    },
    forcedChoiceText: {
      planningStyle: {
        title: "Was beschreibt dich besser?",
        options: {
          plan_flexible: "Ich plane voraus, kann aber flexibel sein",
          spontaneous_plan: "Ich bin spontan, kann aber bei Bedarf planen",
        },
      },
      buddyPriority: {
        title: "Was ist bei einem Buddy wichtiger?",
        options: {
          fun_social: "Spassig und sozial",
          calm_reliable: "Ruhig und zuverlaessig",
        },
      },
      idealActivity: {
        title: "Ideale Aktivitaet",
        options: {
          party_social: "Party / Sozial",
          cultural_museum: "Kultur / Museum",
          mixed: "Gemischt",
        },
      },
      timeStyle: {
        title: "Bevorzugter Zeitstil",
        options: {
          early_bird: "Frueh schlafen / frueh aufstehen",
          night_owl: "Spaet schlafen / nachts aktiv",
        },
      },
    },
    likertLabels: ["Stimme gar nicht zu", "Stimme eher nicht zu", "Neutral", "Stimme zu", "Stimme voll zu"],
    likertTitle: "Likert-Skala",
    likertLegend: "1 = Stimme gar nicht zu, 5 = Stimme voll zu",
    forcedChoiceHeading: "8. Pflichtauswahl",
    travelPrompt: "Ich moechte nach dem Programm reisen.",
    yesLabel: "Ja",
    noLabel: "Nein",
    scoreLabels: {
      social: "Sozial",
      openness: "Offenheit",
      flexStructure: "Flexibilitaet / Struktur",
      partyCommunication: "Party / Kommunikation",
    },
    wizard: {
      title: "Schritt 1: Buddy-Matcher Fragen",
      subtitle: "Beantworte alle Pflichtfragen, um dein Kompatibilitaetsprofil zu erstellen.",
      back: "Zurueck",
      next: "Naechster Abschnitt",
      continueToProfile: "Weiter zum Profil",
      completeProfile: "Profil abschliessen",
      progress: "Fortschritt",
      profileTitle: "Schritt 2: Oeffentliches Profil ausfuellen",
      profileSubtitle: "Fuege Foto, Bio und Social Links hinzu, bevor du in der Teilnehmerliste erscheinst.",
      profileCountry: "Land",
      answerAllInSection: "Bitte beantworte alle Fragen in diesem Abschnitt.",
      completeForcedChoices: "Bitte alle Pflichtauswahlen und die Reiseauswahl abschliessen.",
      introTitle: "Willkommen, deine Buddy-Reise beginnt jetzt",
      introBody: "Du bist im Onboarding. Als Naechstes passiert:",
      introStepOne: "Beantworte alle Matching-Fragen.",
      introStepTwo: "Vervollstaendige dein oeffentliches Profil mit Foto und Bio.",
      introStepThree: "Wechsle zur Istkon'26 Participants Seite und entdecke alle.",
      introAction: "Jetzt starten",
    },
  },
};

export function getSurveySections(locale: SurveyLocale) {
  const copy = SURVEY_UI_TEXT[locale];
  return SURVEY_SECTIONS.map((section) => ({
    ...section,
    title: copy.sectionTitles[section.id],
    questions: copy.sectionQuestions[section.id],
  }));
}

export function getForcedChoiceText(locale: SurveyLocale) {
  return SURVEY_UI_TEXT[locale].forcedChoiceText;
}

export function getLikertLabels(locale: SurveyLocale) {
  return SURVEY_UI_TEXT[locale].likertLabels;
}

export function getSurveyUiText(locale: SurveyLocale) {
  return SURVEY_UI_TEXT[locale];
}

function clampLikert(value: number): LikertValue {
  if (value <= 1) {
    return 1;
  }
  if (value >= 5) {
    return 5;
  }
  return Math.round(value) as LikertValue;
}

function reverseLikert(value: LikertValue): LikertValue {
  return (6 - value) as LikertValue;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 3;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toTenScale(valueFromFive: number): number {
  const normalized = ((valueFromFive - 1) / 4) * 9 + 1;
  return Math.max(1, Math.min(10, Math.round(normalized)));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asLikert(value: unknown): LikertValue | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return null;
  }
  return value as LikertValue;
}

function parseOption<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`Invalid forced choice for ${field}`);
  }
  return value as T;
}

export function createDefaultLikertAnswers(defaultValue: LikertValue = 3): LikertAnswers {
  const result = {} as LikertAnswers;
  for (const id of LIKERT_QUESTION_IDS) {
    result[id] = defaultValue;
  }
  return result;
}

export function parseLikertAnswers(raw: unknown): LikertAnswers {
  if (!isObjectRecord(raw)) {
    throw new Error("Likert answers must be an object");
  }

  const parsed = createDefaultLikertAnswers();
  for (const id of LIKERT_QUESTION_IDS) {
    const value = asLikert(raw[id]);
    if (!value) {
      throw new Error(`Missing or invalid answer for ${id}`);
    }
    parsed[id] = value;
  }

  for (const key of Object.keys(raw)) {
    if (!LIKERT_ID_SET.has(key)) {
      throw new Error(`Unknown question id ${key}`);
    }
  }

  return parsed;
}

export function parseForcedChoices(raw: unknown): ForcedChoices {
  if (!isObjectRecord(raw)) {
    throw new Error("Forced choices must be an object");
  }

  return {
    planningStyle: parseOption(raw.planningStyle, ["plan_flexible", "spontaneous_plan"], "planningStyle"),
    buddyPriority: parseOption(raw.buddyPriority, ["fun_social", "calm_reliable"], "buddyPriority"),
    idealActivity: parseOption(raw.idealActivity, ["party_social", "cultural_museum", "mixed"], "idealActivity"),
    timeStyle: parseOption(raw.timeStyle, ["early_bird", "night_owl"], "timeStyle"),
  };
}

function sectionValues(questionIds: readonly LikertQuestionId[], likertAnswers: LikertAnswers, reverseIds: Set<LikertQuestionId>) {
  return questionIds.map((id) => {
    const value = likertAnswers[id];
    return reverseIds.has(id) ? reverseLikert(value) : value;
  });
}

export function computeSurveyScores(input: { likertAnswers: LikertAnswers; travelAfterProgram: boolean }): SurveyScores {
  const socialValues = sectionValues(SECTION_QUESTION_IDS.social, input.likertAnswers, new Set(["social_4", "social_8"]));
  const opennessValues = sectionValues(SECTION_QUESTION_IDS.openness, input.likertAnswers, new Set(["open_4"]));

  const structureValues = sectionValues(
    SECTION_QUESTION_IDS.planning,
    input.likertAnswers,
    new Set<LikertQuestionId>(["plan_4", "plan_7"]),
  );

  const flexibilityValues = sectionValues(
    SECTION_QUESTION_IDS.planning,
    input.likertAnswers,
    new Set<LikertQuestionId>(["plan_1", "plan_2", "plan_3", "plan_5", "plan_6"]),
  );

  const partyValues = sectionValues(SECTION_QUESTION_IDS.party, input.likertAnswers, new Set(["party_3", "party_6"]));

  const nightRhythmValues = sectionValues(SECTION_QUESTION_IDS.daily, input.likertAnswers, new Set(["daily_1", "daily_3"]));

  const travelValues = sectionValues(SECTION_QUESTION_IDS.travelStyle, input.likertAnswers, new Set(["travel_4"]));

  const communicationValues = sectionValues(SECTION_QUESTION_IDS.communication, input.likertAnswers, new Set(["comm_4"]));

  const travelBase = toTenScale(mean(travelValues));
  const travelStyleScore = input.travelAfterProgram ? Math.min(10, travelBase + 1) : Math.max(1, travelBase - 1);

  return {
    socialScore: toTenScale(mean(socialValues)),
    opennessScore: toTenScale(mean(opennessValues)),
    flexibilityScore: toTenScale(mean(flexibilityValues)),
    structureScore: toTenScale(mean(structureValues)),
    partyScore: toTenScale(mean(partyValues)),
    travelStyleScore,
    communicationScore: toTenScale(mean(communicationValues)),
    nightRhythmScore: toTenScale(mean(nightRhythmValues)),
  };
}

export function mapScoresToLegacyProfile(scores: SurveyScores) {
  return {
    openness: scores.opennessScore,
    conscientiousness: scores.structureScore,
    extraversion: scores.socialScore,
    agreeableness: scores.communicationScore,
    neuroticism: Math.max(1, Math.min(10, 11 - scores.flexibilityScore)),
  };
}

export function serializeSurveyPayload(input: {
  likertAnswers: LikertAnswers;
  travelAfterProgram: boolean;
  forcedChoices: ForcedChoices;
}) {
  const payload: SurveyPayload = {
    version: 2,
    likertAnswers: input.likertAnswers,
    travelAfterProgram: input.travelAfterProgram,
    forcedChoices: input.forcedChoices,
    scores: computeSurveyScores({
      likertAnswers: input.likertAnswers,
      travelAfterProgram: input.travelAfterProgram,
    }),
  };

  return JSON.stringify(payload);
}

export function parseSurveyPayload(rawInterests: string | null | undefined): SurveyPayload | null {
  if (!rawInterests) {
    return null;
  }

  const text = rawInterests.trim();
  if (!text.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!isObjectRecord(parsed) || parsed.version !== 2) {
      return null;
    }

    const likertAnswers = parseLikertAnswers(parsed.likertAnswers);
    const travelAfterProgram = Boolean(parsed.travelAfterProgram);
    const forcedChoices = parseForcedChoices(parsed.forcedChoices);

    return {
      version: 2,
      likertAnswers,
      travelAfterProgram,
      forcedChoices,
      scores: computeSurveyScores({ likertAnswers, travelAfterProgram }),
    };
  } catch {
    return null;
  }
}

function toLikertFromTen(value: number): LikertValue {
  const normalized = ((value - 1) / 9) * 4 + 1;
  return clampLikert(normalized);
}

export function buildSurveyStateFromLegacy(profile: LegacyProfileSnapshot): {
  likertAnswers: LikertAnswers;
  travelAfterProgram: boolean;
  forcedChoices: ForcedChoices;
} {
  const fromStored = parseSurveyPayload(profile.interests);
  if (fromStored) {
    return {
      likertAnswers: fromStored.likertAnswers,
      travelAfterProgram: fromStored.travelAfterProgram,
      forcedChoices: fromStored.forcedChoices,
    };
  }

  const likertAnswers = createDefaultLikertAnswers(3);

  const social = toLikertFromTen(profile.extraversion);
  const openness = toLikertFromTen(profile.openness);
  const structure = toLikertFromTen(profile.conscientiousness);
  const flexibility = toLikertFromTen(Math.max(1, Math.min(10, 11 - profile.neuroticism)));
  const communication = toLikertFromTen(profile.agreeableness);
  const party = clampLikert((social + (6 - communication)) / 2);
  const travel = toLikertFromTen(profile.travelAfterProgram ? 7 : 4);

  for (const id of SECTION_QUESTION_IDS.social) {
    likertAnswers[id] = social;
  }
  for (const id of SECTION_QUESTION_IDS.openness) {
    likertAnswers[id] = openness;
  }
  for (const id of SECTION_QUESTION_IDS.planning) {
    likertAnswers[id] = clampLikert((structure + flexibility) / 2);
  }
  for (const id of SECTION_QUESTION_IDS.party) {
    likertAnswers[id] = party;
  }
  for (const id of SECTION_QUESTION_IDS.daily) {
    likertAnswers[id] = 3;
  }
  for (const id of SECTION_QUESTION_IDS.travelStyle) {
    likertAnswers[id] = travel;
  }
  for (const id of SECTION_QUESTION_IDS.communication) {
    likertAnswers[id] = communication;
  }

  return {
    likertAnswers,
    travelAfterProgram: profile.travelAfterProgram,
    forcedChoices: DEFAULT_FORCED_CHOICES,
  };
}

export function getSurveyScoresFromLegacyProfile(profile: LegacyProfileSnapshot): SurveyScores {
  const fromSurvey = parseSurveyPayload(profile.interests);
  if (fromSurvey) {
    return fromSurvey.scores;
  }

  return {
    socialScore: profile.extraversion,
    opennessScore: profile.openness,
    flexibilityScore: Math.max(1, Math.min(10, 11 - profile.neuroticism)),
    structureScore: profile.conscientiousness,
    partyScore: Math.max(1, Math.min(10, Math.round((profile.extraversion + (11 - profile.agreeableness)) / 2))),
    travelStyleScore: profile.travelAfterProgram ? 7 : 4,
    communicationScore: profile.agreeableness,
    nightRhythmScore: 5,
  };
}
