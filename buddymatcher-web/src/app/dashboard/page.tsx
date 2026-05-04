"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AvatarCropper } from "@/components/avatar-cropper";
import { LanguageSelect } from "@/components/language-select";
import { SocialLinks } from "@/components/social-links";
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
    groupId: string;
    score: number;
    reason: string | null;
    buddies: Array<{
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
      country: "TR" | "DE";
      bio: string | null;
      publicTags: string[];
      instagramUrl: string | null;
      linkedinUrl: string | null;
      xUrl: string | null;
    }>;
  } | null;
};

type AdminPrivateAnswersResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    profile: {
      answersEditable: boolean;
      includedInMatching: boolean;
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

type AdminGroupMember = {
  id: string;
  name: string;
  email: string;
  country: "TR" | "DE" | null;
  avatarUrl: string | null;
};

type AdminGroup = {
  id: string;
  score: number;
  reason: string | null;
  members: AdminGroupMember[];
};

type AdminGroupsResponse = {
  round: {
    id: string;
    published: boolean;
    publishedAt: string | null;
    groups: AdminGroup[];
  } | null;
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
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [showPrivateAnswersModal, setShowPrivateAnswersModal] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [adminRound, setAdminRound] = useState<AdminGroupsResponse["round"]>(null);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [editGroupMemberIds, setEditGroupMemberIds] = useState<string[]>([]);

  const loadAdminAnswers = useCallback(async () => {
    const response = await fetch("/api/admin/private-answers");
    if (!response.ok) {
      setAdminUsers([]);
      return;
    }
    const data = (await response.json()) as AdminPrivateAnswersResponse;
    setAdminUsers(data.users ?? []);
  }, []);

  const loadAdminGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/groups");
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { error?: string };
        setMessage(`Gruplar yüklenemedi: ${err.error ?? response.status}`);
        return;
      }
      const data = (await response.json()) as AdminGroupsResponse;
      setAdminRound(data.round ?? null);
    } catch {
      setMessage("Gruplar yüklenirken ağ hatası oluştu.");
    }
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
      await loadAdminGroups();
    } else {
      setAdminUsers([]);
    }

    const matchResp = await fetch("/api/matches/me");
    if (matchResp.ok) {
      const match = (await matchResp.json()) as MatchResponse;
      setMatchData(match.match);
    }

    setLoading(false);
  }, [loadAdminAnswers, loadAdminGroups, t.pleaseLogin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showPrivateAnswersModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPrivateAnswersModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPrivateAnswersModal]);

  const surveyScores = useMemo(
    () => computeSurveyScores({ likertAnswers, travelAfterProgram }),
    [likertAnswers, travelAfterProgram],
  );
  const surveySections = useMemo(() => getSurveySections(locale), [locale]);
  const forcedChoiceText = useMemo(() => getForcedChoiceText(locale), [locale]);
  const likertLabels = useMemo(() => getLikertLabels(locale), [locale]);
  const surveyUi = useMemo(() => getSurveyUiText(locale), [locale]);
  const planningStyleOptions = useMemo(
    () => Object.entries(forcedChoiceText.planningStyle.options) as Array<[ForcedChoices["planningStyle"], string]>,
    [forcedChoiceText],
  );
  const buddyPriorityOptions = useMemo(
    () => Object.entries(forcedChoiceText.buddyPriority.options) as Array<[ForcedChoices["buddyPriority"], string]>,
    [forcedChoiceText],
  );
  const idealActivityOptions = useMemo(
    () => Object.entries(forcedChoiceText.idealActivity.options) as Array<[ForcedChoices["idealActivity"], string]>,
    [forcedChoiceText],
  );
  const timeStyleOptions = useMemo(
    () => Object.entries(forcedChoiceText.timeStyle.options) as Array<[ForcedChoices["timeStyle"], string]>,
    [forcedChoiceText],
  );

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
        setAvatarCropSource(reader.result);
        setAvatarCropOpen(true);
        setMessage("");
      }
    };
    reader.onerror = () => {
      setMessage(t.photoReadError);
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  }

  function closeAvatarCropper() {
    setAvatarCropOpen(false);
    setAvatarCropSource(null);
  }

  function applyAvatarCrop(croppedImageDataUrl: string) {
    setAvatarUrl(croppedImageDataUrl);
    setAvatarCropOpen(false);
    setAvatarCropSource(null);
    setMessage(t.photoSelected);
  }

  async function saveProfile(closePrivateAnswersModalOnSuccess = false) {
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

    await loadData();
    setMessage(t.saved);
    if (closePrivateAnswersModalOnSuccess) {
      setShowPrivateAnswersModal(false);
    }
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
      } else if (errorCode === "MATCHING_FAILED") {
        setMessage(data.error ?? t.matchingFailed);
      } else {
        setMessage(t.matchingFailed);
      }
      return;
    }

    setMessage(`${t.matchingDoneGroups}: ${data.count}`);
    await loadAdminGroups();
  }

  async function publishResults() {
    const response = await fetch("/api/admin/publish", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(t.publishFailed);
      return;
    }

    if (data.alreadyPublished) {
      setMessage(t.alreadyPublished);
    } else {
      setMessage(t.publishSuccess);
    }
    await loadAdminGroups();
    await loadData();
  }

  function openEditGroup(group: AdminGroup) {
    const trMembers = group.members.filter((m) => m.country === "TR");
    const deMembers = group.members.filter((m) => m.country === "DE");
    setEditGroupMemberIds([
      trMembers[0]?.id ?? "",
      trMembers[1]?.id ?? "",
      deMembers[0]?.id ?? "",
    ]);
    setEditingGroup(group);
  }

  async function saveGroupEdit() {
    if (!editingGroup) return;
    const memberIds = editGroupMemberIds.filter((id) => id !== "");
    if (memberIds.length < 2) {
      setMessage("En az 1 TR + 1 DE seçmelisiniz.");
      return;
    }
    const response = await fetch(`/api/admin/groups/${editingGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage((data.error as string | undefined) ?? t.groupEditFailed);
      return;
    }
    setMessage(t.groupSaved);
    setEditingGroup(null);
    await loadAdminGroups();
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

  async function toggleMatchingSelection(userId: string, includedInMatching: boolean) {
    const response = await fetch("/api/admin/matching-selection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, includedInMatching }),
    });

    if (!response.ok) {
      setMessage(t.permissionUpdateFailed);
      return;
    }

    await loadAdminAnswers();
  }

  if (loading && !user) {
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
              <button className="btn-ghost px-4 py-2" onClick={logout}>
                {t.logout}
              </button>
              <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          {user.role !== "ADMIN" ? (
          <section className="flex flex-col gap-5">
            <article className="panel p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.publicProfileSection}</h2>
              <p className="muted mt-1 text-sm">{t.publicProfileEnglishNotice}</p>
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
                  <p className="muted mt-2 text-xs italic">{t.bioExampleHint}</p>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl text-slate-900">{t.privateAnswersSection}</h2>
                  <p className="muted mt-1 text-sm">{answersLocked ? t.answerLockNotice : t.answerOpenNotice}</p>
                </div>
                <button
                  className="btn-primary px-4 py-2"
                  type="button"
                  onClick={() => setShowPrivateAnswersModal(true)}
                >
                  {t.openPrivateAnswersModal}
                </button>
              </div>
            </article>

            {showPrivateAnswersModal ? (
              <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/55 px-4 py-5 backdrop-blur-sm">
                <div className="panel w-full max-w-5xl max-h-[90vh] overflow-hidden p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl text-slate-900">{t.privateAnswersSection}</h2>
                      <p className="muted mt-1 text-sm">{answersLocked ? t.answerLockNotice : t.answerOpenNotice}</p>
                    </div>
                    <button
                      className="btn-ghost px-4 py-2"
                      type="button"
                      onClick={() => setShowPrivateAnswersModal(false)}
                    >
                      {t.closePrivateAnswersModal}
                    </button>
                  </div>

                  <div className="mt-4 max-h-[calc(90vh-9rem)] space-y-6 overflow-y-auto pr-1">
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
                              <p className="min-h-[2.75rem] text-sm text-slate-700">{section.questions[index]}</p>
                              <div className="mt-2 grid grid-cols-5 gap-2">
                                {likertScale.map((value) => (
                                  <button
                                    key={`${questionId}-${value}`}
                                    type="button"
                                    aria-pressed={likertAnswers[questionId] === value}
                                    className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs transition ${
                                      likertAnswers[questionId] === value
                                        ? "border-amber-500 bg-amber-100 text-amber-800"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                                    } ${answersLocked ? "pointer-events-none opacity-60" : ""}`}
                                    onClick={() => updateLikertAnswer(questionId as LikertQuestionId, value)}
                                    disabled={answersLocked}
                                  >
                                    <span className="font-semibold">{value}</span>
                                  </button>
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
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {planningStyleOptions.map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  forcedChoices.planningStyle === value
                                    ? "border-amber-500 bg-amber-100 text-amber-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                                }`}
                                onClick={() => updateForcedChoice("planningStyle", value)}
                                disabled={answersLocked}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">{forcedChoiceText.buddyPriority.title}</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {buddyPriorityOptions.map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  forcedChoices.buddyPriority === value
                                    ? "border-amber-500 bg-amber-100 text-amber-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                                }`}
                                onClick={() => updateForcedChoice("buddyPriority", value)}
                                disabled={answersLocked}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">{forcedChoiceText.idealActivity.title}</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {idealActivityOptions.map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  forcedChoices.idealActivity === value
                                    ? "border-amber-500 bg-amber-100 text-amber-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                                }`}
                                onClick={() => updateForcedChoice("idealActivity", value)}
                                disabled={answersLocked}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">{forcedChoiceText.timeStyle.title}</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {timeStyleOptions.map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  forcedChoices.timeStyle === value
                                    ? "border-amber-500 bg-amber-100 text-amber-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                                }`}
                                onClick={() => updateForcedChoice("timeStyle", value)}
                                disabled={answersLocked}
                              >
                                {label}
                              </button>
                            ))}
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

                    <button className="btn-primary w-full px-4 py-3" onClick={() => void saveProfile(true)}>{t.saveAll}</button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          ) : null}

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

            {user.role !== "ADMIN" ? (
            <article className="panel p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.yourBuddies}</h2>
              {!user.profile ? (
                <p className="muted mt-3">{t.noProfileMatch}</p>
              ) : matchData ? (
                <div className="mt-3 space-y-4">
                  {matchData.buddies.map((buddy) => (
                    <div key={buddy.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                      {buddy.avatarUrl ? <img src={buddy.avatarUrl} alt={buddy.name} className="h-20 w-20 rounded-xl object-cover" /> : null}
                      <p className="text-base font-semibold text-slate-900">{buddy.name}</p>
                      <p className="muted text-sm">{buddy.email}</p>
                      <p className="muted text-sm">{buddy.country}</p>
                      <p className="text-sm text-slate-700">{buddy.bio || "-"}</p>
                      <SocialLinks
                        className="pt-1"
                        instagramUrl={buddy.instagramUrl}
                        linkedinUrl={buddy.linkedinUrl}
                        xUrl={buddy.xUrl}
                      />
                      <div className="flex flex-wrap gap-2">
                        {buddy.publicTags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
                      </div>
                    </div>
                  ))}
                  <p className="status text-sm">{t.score}: {matchData.score.toFixed(1)}</p>
                  <p className="muted text-sm">{matchData.reason}</p>
                </div>
              ) : (
                <p className="muted mt-3">{t.noMatchYet}</p>
              )}
            </article>
            ) : null}

            {user.role === "ADMIN" ? (
              <article className="panel p-5 sm:p-6">
                <h3 className="text-xl text-slate-900">{t.adminPanel}</h3>
                <div className="mt-4 space-y-3">
                  <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} className="field" />
                  <button className="btn-ghost w-full px-4 py-3" onClick={importCsv}>{t.importCsv}</button>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 px-4 py-3" onClick={runMatching}>{t.matchPeople}</button>
                    <button
                      className="btn-ghost flex-1 px-4 py-3"
                      onClick={publishResults}
                      disabled={!adminRound || adminRound.published}
                    >
                      {t.publishResults}
                    </button>
                  </div>
                  {message ? <p className="status mt-2 text-sm">{message}</p> : null}
                  <p className="muted text-xs">{t.csvColumns}: name,email,country,openness,conscientiousness,extraversion,agreeableness,neuroticism,interests,bio,avatarUrl,instagramUrl,linkedinUrl,xUrl,travelAfterProgram,password</p>
                </div>
              </article>
            ) : null}

            {user.role === "ADMIN" ? (
              <article className="panel p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl text-slate-900">{t.adminGroups}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost px-3 py-1 text-xs"
                      onClick={() => { void loadAdminGroups(); }}
                      title="Yenile"
                    >
                      ↻
                    </button>
                    {adminRound ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${adminRound.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {adminRound.published ? t.publishedNote : t.unpublishedNote}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {!adminRound ? (
                    <p className="muted text-sm">{t.noMatchYet}</p>
                  ) : adminRound.groups.length === 0 ? (
                    <p className="muted text-sm">{t.noMatchYet}</p>
                  ) : (
                    adminRound.groups.map((group, idx) => (
                      <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800">Group {idx + 1} — {group.score.toFixed(1)} pts</p>
                          {!adminRound.published ? (
                            <button className="btn-ghost px-3 py-1 text-xs" onClick={() => openEditGroup(group)}>
                              {t.editGroup}
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.members.map((m) => (
                            <span key={m.id} className="chip text-xs">
                              {m.name} ({m.country ?? "?"})
                            </span>
                          ))}
                        </div>
                        {group.reason ? <p className="muted mt-1 text-xs">{group.reason}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </article>
            ) : null}

            {user.role === "ADMIN" ? (
              <article className="panel p-5 sm:p-6">
                <h3 className="text-xl text-slate-900">{t.adminAnswersTitle}</h3>
                <div className="mt-4 space-y-3">
                  {adminUsers.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="muted text-xs">{item.email}</p>
                          {item.profile ? (
                            <p className="muted mt-1 text-xs">{item.profile.country}</p>
                          ) : (
                            <p className="muted mt-1 text-xs">{t.profileMissing}</p>
                          )}
                        </div>
                        {item.profile ? (
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 select-none">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-amber-500"
                              checked={item.profile.includedInMatching}
                              onChange={(e) => void toggleMatchingSelection(item.id, e.target.checked)}
                            />
                            {t.addToBuddySelection}
                          </label>
                        ) : null}
                      </div>
                      {item.profile ? (
                        <button
                          className="btn-ghost mt-2 px-3 py-2 text-xs"
                          onClick={() => void toggleAnswerPermission(item.id, !item.profile?.answersEditable)}
                        >
                          {item.profile.answersEditable ? t.lockEdit : t.allowEdit}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        </div>

        <AvatarCropper
          open={avatarCropOpen}
          image={avatarCropSource}
          onCancel={closeAvatarCropper}
          onApply={applyAvatarCrop}
          text={{
            title: t.cropPhotoTitle,
            subtitle: t.cropPhotoSubtitle,
            zoomLabel: t.cropZoom,
            cancelLabel: t.cropCancel,
            applyLabel: t.cropApply,
            failedLabel: t.cropFailed,
          }}
        />

        {editingGroup ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-5 backdrop-blur-sm">
            <div className="panel w-full max-w-sm p-5 sm:p-6">
              <h3 className="text-xl text-slate-900">{t.editGroup} — Group</h3>
              <div className="mt-4 space-y-3">
                {([0, 1] as const).map((slot) => (
                  <div key={slot}>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      {t.trMember} {slot + 1}{slot === 1 ? " (isteğe bağlı)" : ""}
                    </label>
                    <select
                      className="field-select"
                      value={editGroupMemberIds[slot] ?? ""}
                      onChange={(e) => {
                        const updated = [...editGroupMemberIds];
                        updated[slot] = e.target.value;
                        setEditGroupMemberIds(updated);
                      }}
                    >
                      <option value="">— Boş</option>
                      {adminUsers
                        .filter((u) => u.profile?.country === "TR")
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    {t.deMember}
                  </label>
                  <select
                    className="field-select"
                    value={editGroupMemberIds[2] ?? ""}
                    onChange={(e) => {
                      const updated = [...editGroupMemberIds];
                      updated[2] = e.target.value;
                      setEditGroupMemberIds(updated);
                    }}
                  >
                    <option value="">—</option>
                    {adminUsers
                      .filter((u) => u.profile?.country === "DE")
                      .map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-primary flex-1 px-4 py-2" onClick={saveGroupEdit}>{t.saveGroup}</button>
                <button className="btn-ghost flex-1 px-4 py-2" onClick={() => setEditingGroup(null)}>{t.closePrivateAnswersModal}</button>
              </div>
            </div>
          </div>
        ) : null}

        {message ? <p className="status mt-4 text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
