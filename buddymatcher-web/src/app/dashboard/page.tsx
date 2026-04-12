"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import {
  buildSurveyStateFromLegacy,
  computeSurveyScores,
  createDefaultLikertAnswers,
  DEFAULT_FORCED_CHOICES,
  getForcedChoiceText,
  getLikertLabels,
  getSurveySections,
  getSurveyScoresFromLegacyProfile,
  getSurveyUiText,
  type ForcedChoices,
  type LikertAnswers,
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
      avatarUrl: string;
      instagramUrl: string;
      linkedinUrl: string;
      xUrl: string;
      publicTags: string[];
      answersEditable: boolean;
      country: "TR" | "DE";
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
      interests: string;
      bio: string | null;
      travelAfterProgram: boolean;
    } | null;
  } | null;
};

type MatchResponse = {
  match: {
    score: number;
    reason: string;
    buddy: {
      name: string;
      email: string;
      avatarUrl: string | null;
      country: "TR" | "DE";
      bio: string | null;
      publicTags: string[];
      instagramUrl: string | null;
      linkedinUrl: string | null;
      xUrl: string | null;
    };
  } | null;
};

type AdminPrivateAnswersResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    profile: {
      answersEditable: boolean;
      country: "TR" | "DE";
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
      interests: string;
      travelAfterProgram: boolean;
    } | null;
  }>;
};

const likertScale: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

export default function DashboardPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [matchData, setMatchData] = useState<MatchResponse["match"]>(null);
  const [adminUsers, setAdminUsers] = useState<AdminPrivateAnswersResponse["users"]>([]);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [publicTags, setPublicTags] = useState<string[]>([]);

  const [country, setCountry] = useState<"TR" | "DE">("TR");
  const [likertAnswers, setLikertAnswers] = useState<LikertAnswers>(() => createDefaultLikertAnswers());
  const [forcedChoices, setForcedChoices] = useState<ForcedChoices>(DEFAULT_FORCED_CHOICES);
  const [travelAfterProgram, setTravelAfterProgram] = useState(false);
  const [answersEditable, setAnswersEditable] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const loadAdminAnswers = useCallback(async () => {
    const response = await fetch("/api/admin/private-answers");
    if (!response.ok) {
      setAdminUsers([]);
      return;
    }
    const data = (await response.json()) as AdminPrivateAnswersResponse;
    setAdminUsers(data.users ?? []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const meResp = await fetch("/api/me");
    if (!meResp.ok) {
      setLoading(false);
      setMessage(t.pleaseLogin);
      return;
    }

    const me = (await meResp.json()) as MeResponse;
    setUser(me.user);

    if (me.user?.role === "USER" && !me.user.profile) {
      window.location.href = "/onboarding";
      return;
    }

    if (me.user) {
      setFullName(me.user.name);
    }

    if (me.user?.profile) {
      setAvatarUrl(me.user.profile.avatarUrl || "");
      setBio(me.user.profile.bio ?? "");
      setInstagramUrl(me.user.profile.instagramUrl || "");
      setLinkedinUrl(me.user.profile.linkedinUrl || "");
      setXUrl(me.user.profile.xUrl || "");
      setPublicTags(me.user.profile.publicTags ?? []);

      setCountry(me.user.profile.country);
      const surveyState = buildSurveyStateFromLegacy({
        openness: me.user.profile.openness,
        conscientiousness: me.user.profile.conscientiousness,
        extraversion: me.user.profile.extraversion,
        agreeableness: me.user.profile.agreeableness,
        neuroticism: me.user.profile.neuroticism,
        interests: me.user.profile.interests,
        travelAfterProgram: me.user.profile.travelAfterProgram,
      });
      setLikertAnswers(surveyState.likertAnswers);
      setForcedChoices(surveyState.forcedChoices);
      setTravelAfterProgram(surveyState.travelAfterProgram);
      setAnswersEditable(me.user.profile.answersEditable);
    } else {
      setPublicTags([]);
      setLikertAnswers(createDefaultLikertAnswers());
      setForcedChoices(DEFAULT_FORCED_CHOICES);
      setTravelAfterProgram(false);
      setAnswersEditable(true);
    }

    if (me.user?.role === "ADMIN") {
      await loadAdminAnswers();
    } else {
      setAdminUsers([]);
    }

    const matchResp = await fetch("/api/matches/me");
    if (matchResp.ok) {
      const match = (await matchResp.json()) as MatchResponse;
      setMatchData(match.match);
    }

    setLoading(false);
  }, [loadAdminAnswers, t.pleaseLogin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const surveyScores = useMemo(
    () => computeSurveyScores({ likertAnswers, travelAfterProgram }),
    [likertAnswers, travelAfterProgram],
  );
  const surveySections = useMemo(() => getSurveySections(locale), [locale]);
  const forcedChoiceText = useMemo(() => getForcedChoiceText(locale), [locale]);
  const likertLabels = useMemo(() => getLikertLabels(locale), [locale]);
  const surveyUi = useMemo(() => getSurveyUiText(locale), [locale]);

  const answersLocked = useMemo(
    () => !!user?.profile && user.role !== "ADMIN" && !answersEditable,
    [answersEditable, user],
  );

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

  function onAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(t.invalidPhotoType);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage(t.photoTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setMessage(t.photoSelected);
      }
    };
    reader.onerror = () => {
      setMessage(t.photoReadError);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
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
        surveyLikertAnswers: likertAnswers,
        surveyForcedChoices: forcedChoices,
        travelAfterProgram,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorCode = data.errorCode as string | undefined;
      if (errorCode === "ANSWERS_LOCKED") {
        setMessage(t.answerLockNotice);
      } else if (errorCode === "PROFILE_PHOTO_REQUIRED") {
        setMessage(t.profilePhotoRequired);
      } else {
        setMessage(t.saveFailed);
      }
      return;
    }

    setMessage(t.saved);
    await loadData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setMessage(t.passwordMismatch);
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data.errorCode as string | undefined;
      if (errorCode === "CURRENT_PASSWORD_INCORRECT") {
        setMessage(t.currentPasswordWrong);
      } else if (errorCode === "NEW_PASSWORD_SAME") {
        setMessage(t.newPasswordMustDiffer);
      } else {
        setMessage(t.changePasswordFailed);
      }
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(false);
    setMessage(t.passwordChanged);
  }

  async function importCsv() {
    if (!csvFile) {
      setMessage(t.selectCsv);
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    const response = await fetch("/api/admin/import-csv", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(t.importFailed);
      return;
    }

    setMessage(`${t.importDone}: ${data.processed}`);
    await loadData();
  }

  async function runMatching() {
    const response = await fetch("/api/admin/match", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      const errorCode = data.errorCode as string | undefined;
      const count = Number(data.count ?? 0);
      if (errorCode === "MISSING_PROFILES") {
        setMessage(`${count} ${t.usersMissingProfile}`);
      } else if (errorCode === "MISSING_PHOTOS") {
        setMessage(`${count} ${t.usersMissingPhoto}`);
      } else {
        setMessage(t.matchingFailed);
      }
      return;
    }

    setMessage(`${t.matchingDone}: ${data.count}`);
    await loadData();
  }

  async function toggleAnswerPermission(userId: string, allowEditAnswers: boolean) {
    const response = await fetch("/api/admin/answers-permission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, allowEditAnswers }),
    });
    await response.json();

    if (!response.ok) {
      setMessage(t.permissionUpdateFailed);
      return;
    }

    setMessage(allowEditAnswers ? t.allowEdit : t.lockEdit);
    await loadData();
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

  if (!user) {
    return (
      <div className="app-shell">
        <div className="app-wrap flex min-h-screen items-center justify-center">
          <div className="panel p-6 text-slate-700">{t.pleaseLogin}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="panel mb-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl text-slate-900 sm:text-4xl">{t.dashboard}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <p className="muted">{user.name} - {user.email}</p>
                <button
                  className="btn-ghost px-3 py-1 text-xs"
                  type="button"
                  onClick={() => setShowChangePassword((prev) => !prev)}
                >
                  {showChangePassword ? t.hideChangePasswordLink : t.changePasswordLink}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/participants" className="btn-ghost px-4 py-2">
                {t.participantsNav}
              </Link>
              <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
              <button className="btn-ghost px-4 py-2" onClick={logout}>
                {t.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col gap-5">
            <article className="panel p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.publicProfileSection}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{t.socialLinks}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input className="field" placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                    <input className="field" placeholder="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                    <input className="field" placeholder="X / Twitter URL" value={xUrl} onChange={(e) => setXUrl(e.target.value)} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-slate-700">{t.tagsTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {publicTags.length > 0 ? publicTags.map((tag) => <span className="chip" key={tag}>{tag}</span>) : <p className="muted text-sm">-</p>}
                  </div>
                </div>
              </div>
            </article>

            <article className="panel p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.privateAnswersSection}</h2>
              <div className="mt-4 space-y-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="field-select" value={country} onChange={(e) => setCountry(e.target.value as "TR" | "DE")} disabled={answersLocked}>
                    <option value="TR">TR</option>
                    <option value="DE">DE</option>
                  </select>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{surveyUi.likertTitle}</p>
                    <p className="mt-1 text-sm text-slate-700">{surveyUi.likertLegend}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.social}</p>
                    <p className="text-2xl font-semibold text-slate-900">{surveyScores.socialScore}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.openness}</p>
                    <p className="text-2xl font-semibold text-slate-900">{surveyScores.opennessScore}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.flexStructure}</p>
                    <p className="text-2xl font-semibold text-slate-900">{surveyScores.flexibilityScore} / {surveyScores.structureScore}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{surveyUi.scoreLabels.partyCommunication}</p>
                    <p className="text-2xl font-semibold text-slate-900">{surveyScores.partyScore} / {surveyScores.communicationScore}</p>
                  </div>
                </div>

                {surveySections.map((section) => (
                  <section key={section.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                    <div className="mt-3 space-y-3">
                      {section.questionIds.map((questionId, index) => (
                        <div key={questionId} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                          <p className="text-sm text-slate-700">{section.questions[index]}</p>
                          <div className="mt-2 grid grid-cols-5 gap-2">
                            {likertScale.map((value) => (
                              <label
                                key={`${questionId}-${value}`}
                                className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs transition ${
                                  likertAnswers[questionId] === value
                                    ? "border-amber-500 bg-amber-100 text-amber-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                                } ${answersLocked ? "pointer-events-none opacity-60" : ""}`}
                              >
                                <input
                                  type="radio"
                                  className="sr-only"
                                  name={questionId}
                                  value={value}
                                  checked={likertAnswers[questionId] === value}
                                  onChange={() => updateLikertAnswer(questionId as LikertQuestionId, value)}
                                  disabled={answersLocked}
                                />
                                <span className="font-semibold">{value}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-1 hidden grid-cols-5 gap-2 text-[11px] text-slate-500 sm:grid">
                            {likertLabels.map((label) => (
                              <span key={`${questionId}-${label}`} className="text-center">
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{surveyUi.forcedChoiceHeading}</h3>
                  <div className="mt-4 space-y-4">
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
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
                          disabled={answersLocked}
                        >
                          {forcedChoiceText.timeStyle.options.night_owl}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-sm font-medium text-slate-700">{surveyUi.travelPrompt}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        travelAfterProgram
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => setTravelAfterProgram(true)}
                      disabled={answersLocked}
                    >
                      {surveyUi.yesLabel}
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        !travelAfterProgram
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                      }`}
                      onClick={() => setTravelAfterProgram(false)}
                      disabled={answersLocked}
                    >
                      {surveyUi.noLabel}
                    </button>
                  </div>
                </section>

                <p className="muted text-sm">{answersLocked ? t.answerLockNotice : t.answerOpenNotice}</p>
                <button className="btn-primary w-full px-4 py-3" onClick={saveProfile}>{t.saveAll}</button>
              </div>
            </article>
          </section>

          <section className="flex flex-col gap-5">
            {showChangePassword ? (
              <article className="panel p-5 sm:p-6">
                <h2 className="text-2xl text-slate-900">{t.changePasswordSection}</h2>
                <div className="mt-4 space-y-3">
                  <input
                    className="field"
                    type="password"
                    minLength={8}
                    placeholder={t.currentPassword}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <input
                    className="field"
                    type="password"
                    minLength={8}
                    placeholder={t.newPassword}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    className="field"
                    type="password"
                    minLength={8}
                    placeholder={t.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button className="btn-ghost w-full px-4 py-3" onClick={changePassword}>
                    {t.changePasswordAction}
                  </button>
                </div>
              </article>
            ) : null}

            <article className="panel p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.yourBuddy}</h2>
              {!user.profile ? (
                <p className="muted mt-3">{t.noProfileMatch}</p>
              ) : matchData ? (
                <div className="mt-3 space-y-2">
                  {matchData.buddy.avatarUrl ? <img src={matchData.buddy.avatarUrl} alt={matchData.buddy.name} className="h-24 w-24 rounded-xl object-cover" /> : null}
                  <p className="text-lg font-semibold text-slate-900">{matchData.buddy.name}</p>
                  <p className="muted text-sm">{matchData.buddy.email}</p>
                  <p className="muted text-sm">{matchData.buddy.country}</p>
                  <p className="text-sm text-slate-700">{matchData.buddy.bio || "-"}</p>
                  <div className="flex flex-wrap gap-2">
                    {matchData.buddy.publicTags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
                  </div>
                  <p className="status text-sm">{t.score}: {matchData.score.toFixed(1)}</p>
                  <p className="muted text-sm">{matchData.reason}</p>
                </div>
              ) : (
                <p className="muted mt-3">{t.noMatchYet}</p>
              )}
            </article>

            {user.role === "ADMIN" ? (
              <article className="panel p-5 sm:p-6">
                <h3 className="text-xl text-slate-900">{t.adminPanel}</h3>
                <div className="mt-4 space-y-3">
                  <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} className="field" />
                  <button className="btn-ghost w-full px-4 py-3" onClick={importCsv}>{t.importCsv}</button>
                  <button className="btn-primary w-full px-4 py-3" onClick={runMatching}>{t.runMatching}</button>
                  <p className="muted text-xs">{t.csvColumns}: name,email,country,openness,conscientiousness,extraversion,agreeableness,neuroticism,interests,bio,avatarUrl,instagramUrl,linkedinUrl,xUrl,travelAfterProgram,password</p>
                </div>
              </article>
            ) : null}

            {user.role === "ADMIN" ? (
              <article className="panel p-5 sm:p-6">
                <h3 className="text-xl text-slate-900">{t.adminAnswersTitle}</h3>
                <div className="mt-4 space-y-3">
                  {adminUsers.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="muted text-xs">{item.email}</p>
                      {item.profile ? (
                        (() => {
                          const adminScores = getSurveyScoresFromLegacyProfile({
                            openness: item.profile.openness,
                            conscientiousness: item.profile.conscientiousness,
                            extraversion: item.profile.extraversion,
                            agreeableness: item.profile.agreeableness,
                            neuroticism: item.profile.neuroticism,
                            interests: item.profile.interests,
                            travelAfterProgram: item.profile.travelAfterProgram,
                          });

                          return (
                            <>
                              <p className="muted mt-2 text-xs">{item.profile.country} | Social:{adminScores.socialScore} Open:{adminScores.opennessScore} Flex:{adminScores.flexibilityScore} Structure:{adminScores.structureScore}</p>
                              <p className="muted text-xs">Party:{adminScores.partyScore} Travel:{adminScores.travelStyleScore} Comm:{adminScores.communicationScore}</p>
                              <button className="btn-ghost mt-2 px-3 py-2 text-sm" onClick={() => toggleAnswerPermission(item.id, !item.profile?.answersEditable)}>
                                {item.profile.answersEditable ? t.lockEdit : t.allowEdit}
                              </button>
                            </>
                          );
                        })()
                      ) : (
                        <p className="muted mt-2 text-xs">{t.profileMissing}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        </div>

        {message ? <p className="status mt-4 text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
