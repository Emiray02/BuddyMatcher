"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import {
  LIKERT_QUESTION_IDS,
  computeSurveyScores,
  getForcedChoiceText,
  getLikertLabels,
  getSurveySections,
  getSurveyUiText,
  parseForcedChoices,
  parseLikertAnswers,
  type ForcedChoices,
  type LikertQuestionId,
} from "@/lib/survey";
import { useLocale } from "@/lib/use-locale";

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    profile: {
      id: string;
    } | null;
  } | null;
};

type PendingLikertAnswers = Partial<Record<LikertQuestionId, 1 | 2 | 3 | 4 | 5>>;
type PendingForcedChoices = Partial<ForcedChoices>;

const likertScale: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

export default function OnboardingPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];

  const surveySections = useMemo(() => getSurveySections(locale), [locale]);
  const forcedChoiceText = useMemo(() => getForcedChoiceText(locale), [locale]);
  const likertLabels = useMemo(() => getLikertLabels(locale), [locale]);
  const surveyUi = useMemo(() => getSurveyUiText(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"survey" | "profile">("survey");
  const [surveyStep, setSurveyStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showIntro, setShowIntro] = useState(false);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [country, setCountry] = useState<"TR" | "DE">("TR");

  const [likertAnswers, setLikertAnswers] = useState<PendingLikertAnswers>({});
  const [forcedChoices, setForcedChoices] = useState<PendingForcedChoices>({});
  const [travelAfterProgram, setTravelAfterProgram] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/me");
      if (!response.ok) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as MeResponse;
      const user = data.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (user.role === "ADMIN") {
        router.replace("/dashboard");
        return;
      }

      if (user.profile) {
        router.replace("/participants");
        return;
      }

      setFullName(user.name);
      setShowIntro(true);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!showIntro || stage !== "survey") {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [showIntro, stage]);

  const forcedStepIndex = surveySections.length;
  const isForcedStep = surveyStep === forcedStepIndex;
  const currentSection = !isForcedStep ? surveySections[surveyStep] : null;

  const isCurrentSectionComplete =
    currentSection !== null &&
    currentSection.questionIds.every((questionId) => Boolean(likertAnswers[questionId]));

  const isForcedComplete =
    Boolean(forcedChoices.planningStyle) &&
    Boolean(forcedChoices.buddyPriority) &&
    Boolean(forcedChoices.idealActivity) &&
    Boolean(forcedChoices.timeStyle) &&
    travelAfterProgram !== null;

  const answeredLikertCount = useMemo(
    () => LIKERT_QUESTION_IDS.reduce((count, questionId) => count + (likertAnswers[questionId] ? 1 : 0), 0),
    [likertAnswers],
  );

  const answeredForcedCount =
    Number(Boolean(forcedChoices.planningStyle)) +
    Number(Boolean(forcedChoices.buddyPriority)) +
    Number(Boolean(forcedChoices.idealActivity)) +
    Number(Boolean(forcedChoices.timeStyle)) +
    Number(travelAfterProgram !== null);

  const totalAnswerableCount = LIKERT_QUESTION_IDS.length + 5;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((answeredLikertCount + answeredForcedCount) / totalAnswerableCount) * 100)),
  );

  const validatedLikertAnswers = useMemo(() => {
    try {
      return parseLikertAnswers(likertAnswers as unknown);
    } catch {
      return null;
    }
  }, [likertAnswers]);

  const surveyPreview = useMemo(() => {
    if (!validatedLikertAnswers) {
      return null;
    }

    return computeSurveyScores({
      likertAnswers: validatedLikertAnswers,
      travelAfterProgram: travelAfterProgram ?? false,
    });
  }, [travelAfterProgram, validatedLikertAnswers]);

  function updateLikertAnswer(questionId: LikertQuestionId, value: 1 | 2 | 3 | 4 | 5) {
    setLikertAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function updateForcedChoice<K extends keyof ForcedChoices>(key: K, value: ForcedChoices[K]) {
    setForcedChoices((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function goBack() {
    setError("");

    if (stage === "profile") {
      setStage("survey");
      setSurveyStep(forcedStepIndex);
      return;
    }

    setSurveyStep((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    setError("");

    if (isForcedStep) {
      if (!isForcedComplete) {
        setError(surveyUi.wizard.completeForcedChoices);
        return;
      }

      setStage("profile");
      return;
    }

    if (!isCurrentSectionComplete) {
      setError(surveyUi.wizard.answerAllInSection);
      return;
    }

    setSurveyStep((prev) => Math.min(prev + 1, forcedStepIndex));
  }

  function onAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t.invalidPhotoType);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError(t.photoTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setError(t.photoReadError);
    };
    reader.readAsDataURL(file);
  }

  async function completeOnboarding() {
    setError("");

    if (!avatarUrl.trim()) {
      setError(t.profilePhotoRequired);
      return;
    }

    if (travelAfterProgram === null) {
      setError(surveyUi.wizard.completeForcedChoices);
      return;
    }

    setSaving(true);

    try {
      const validLikertAnswers = parseLikertAnswers(likertAnswers as unknown);
      const validForcedChoices = parseForcedChoices(forcedChoices as unknown);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          avatarUrl,
          bio,
          instagramUrl,
          linkedinUrl,
          xUrl,
          country,
          surveyLikertAnswers: validLikertAnswers,
          surveyForcedChoices: validForcedChoices,
          travelAfterProgram,
        }),
      });

      const data = (await response.json()) as { errorCode?: string };
      if (!response.ok) {
        if (data.errorCode === "PROFILE_PHOTO_REQUIRED") {
          setError(t.profilePhotoRequired);
        } else {
          setError(t.saveFailed);
        }
        return;
      }

      router.push("/participants");
    } catch {
      setError(t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-wrap flex min-h-screen items-center justify-center">
          <div className="panel p-6 text-slate-700">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-wrap">
        {stage === "survey" && showIntro ? (
          <div className="onboarding-intro fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="onboarding-intro-card panel fade-in w-full max-w-xl overflow-hidden p-6 sm:p-7">
              <div className="intro-glow intro-glow-a" />
              <div className="intro-glow intro-glow-b" />

              <div className="relative">
                <div className="intro-badges mb-4">
                  <span className="intro-badge">01</span>
                  <span className="intro-badge">02</span>
                  <span className="intro-badge">03</span>
                </div>

                <h2 className="text-2xl text-slate-900 sm:text-3xl">{surveyUi.wizard.introTitle}</h2>
                <p className="muted mt-2 text-sm sm:text-base">{surveyUi.wizard.introBody}</p>

                <ul className="mt-4 space-y-2 text-sm text-slate-700 sm:text-base">
                  <li className="intro-step">{surveyUi.wizard.introStepOne}</li>
                  <li className="intro-step">{surveyUi.wizard.introStepTwo}</li>
                  <li className="intro-step">{surveyUi.wizard.introStepThree}</li>
                </ul>

                <div className="mt-5 flex justify-end">
                  <button className="btn-primary px-4 py-2" type="button" onClick={() => setShowIntro(false)}>
                    {surveyUi.wizard.introAction}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <header className="panel mb-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl text-slate-900">{stage === "survey" ? surveyUi.wizard.title : surveyUi.wizard.profileTitle}</h1>
              <p className="muted mt-1 text-sm">{stage === "survey" ? surveyUi.wizard.subtitle : surveyUi.wizard.profileSubtitle}</p>
            </div>
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>
        </header>

        {stage === "survey" ? (
          <section className="panel p-5 sm:p-6">
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                <span>{surveyUi.wizard.progress}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {isForcedStep ? (
              <div className="space-y-4">
                <h2 className="text-xl text-slate-900">{surveyUi.forcedChoiceHeading}</h2>

                <div>
                  <p className="text-sm font-medium text-slate-700">{forcedChoiceText.planningStyle.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.planningStyle === "plan_flexible"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("planningStyle", "plan_flexible")}
                    >
                      {forcedChoiceText.planningStyle.options.plan_flexible}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.planningStyle === "spontaneous_plan"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("planningStyle", "spontaneous_plan")}
                    >
                      {forcedChoiceText.planningStyle.options.spontaneous_plan}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">{forcedChoiceText.buddyPriority.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.buddyPriority === "fun_social"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("buddyPriority", "fun_social")}
                    >
                      {forcedChoiceText.buddyPriority.options.fun_social}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.buddyPriority === "calm_reliable"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("buddyPriority", "calm_reliable")}
                    >
                      {forcedChoiceText.buddyPriority.options.calm_reliable}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">{forcedChoiceText.idealActivity.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.idealActivity === "party_social"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("idealActivity", "party_social")}
                    >
                      {forcedChoiceText.idealActivity.options.party_social}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.idealActivity === "cultural_museum"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("idealActivity", "cultural_museum")}
                    >
                      {forcedChoiceText.idealActivity.options.cultural_museum}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.idealActivity === "mixed"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("idealActivity", "mixed")}
                    >
                      {forcedChoiceText.idealActivity.options.mixed}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">{forcedChoiceText.timeStyle.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.timeStyle === "early_bird"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("timeStyle", "early_bird")}
                    >
                      {forcedChoiceText.timeStyle.options.early_bird}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        forcedChoices.timeStyle === "night_owl"
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => updateForcedChoice("timeStyle", "night_owl")}
                    >
                      {forcedChoiceText.timeStyle.options.night_owl}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">{surveyUi.travelPrompt}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        travelAfterProgram === true
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => setTravelAfterProgram(true)}
                    >
                      {surveyUi.yesLabel}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        travelAfterProgram === false
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => setTravelAfterProgram(false)}
                    >
                      {surveyUi.noLabel}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl text-slate-900">{currentSection?.title}</h2>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-slate-700">{surveyUi.likertLegend}</p>
                </div>

                {currentSection?.questionIds.map((questionId, index) => (
                  <div key={questionId} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-800">{currentSection.questions[index]}</p>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {likertScale.map((value) => (
                        <label
                          key={`${questionId}-${value}`}
                          className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs transition ${
                            likertAnswers[questionId] === value
                              ? "border-amber-500 bg-amber-100 text-amber-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name={questionId}
                            value={value}
                            checked={likertAnswers[questionId] === value}
                            onChange={() => updateLikertAnswer(questionId, value)}
                          />
                          <span className="font-semibold">{value}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-1 hidden grid-cols-5 gap-2 text-[11px] text-slate-500 sm:grid">
                      {likertLabels.map((label) => (
                        <span key={`${questionId}-${label}`} className="text-center">{label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button className="btn-ghost px-4 py-2" type="button" onClick={goBack} disabled={surveyStep === 0}>
                {surveyUi.wizard.back}
              </button>
              <button className="btn-primary px-5 py-2" type="button" onClick={goNext}>
                {isForcedStep ? surveyUi.wizard.continueToProfile : surveyUi.wizard.next}
              </button>
            </div>
          </section>
        ) : (
          <section className="panel p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.social}</p>
                <p className="text-2xl font-semibold text-slate-900">{surveyPreview?.socialScore ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.openness}</p>
                <p className="text-2xl font-semibold text-slate-900">{surveyPreview?.opennessScore ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.flexStructure}</p>
                <p className="text-2xl font-semibold text-slate-900">{surveyPreview ? `${surveyPreview.flexibilityScore} / ${surveyPreview.structureScore}` : "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.partyCommunication}</p>
                <p className="text-2xl font-semibold text-slate-900">{surveyPreview ? `${surveyPreview.partyScore} / ${surveyPreview.communicationScore}` : "-"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <input className="field" placeholder={t.name} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {t.profilePhoto}
                  <input className="field mt-2" type="file" accept="image/*" onChange={onAvatarFileChange} />
                </label>
                <p className="muted mt-2 text-xs">{t.photoHint}</p>
              </div>

              <div className="md:col-span-2">
                {avatarUrl ? <img src={avatarUrl} alt={fullName || "Profile"} className="h-32 w-32 rounded-xl object-cover" /> : null}
              </div>

              <div className="md:col-span-2">
                <textarea className="field-textarea" placeholder={t.bio} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{surveyUi.wizard.profileCountry}</label>
                <select className="field-select" value={country} onChange={(e) => setCountry(e.target.value as "TR" | "DE")}>
                  <option value="TR">TR</option>
                  <option value="DE">DE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-semibold text-slate-700">{t.socialLinks}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <input className="field" placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                  <input className="field" placeholder="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <input className="field" placeholder="X / Twitter URL" value={xUrl} onChange={(e) => setXUrl(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button className="btn-ghost px-4 py-2" type="button" onClick={goBack}>
                {surveyUi.wizard.back}
              </button>
              <button className="btn-primary px-5 py-2" type="button" onClick={completeOnboarding} disabled={saving}>
                {saving ? "..." : surveyUi.wizard.completeProfile}
              </button>
            </div>
          </section>
        )}

        {error ? <p className="status mt-4 text-sm">{error}</p> : null}
      </div>
    </div>
  );
}
