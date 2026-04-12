"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
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

const bigFiveFields = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
] as const;

const bigFiveLabels = {
  tr: {
    openness: "Aciklik",
    conscientiousness: "Sorumluluk",
    extraversion: "Disadonukluk",
    agreeableness: "Uyumluluk",
    neuroticism: "Duygusal Denge",
  },
  de: {
    openness: "Offenheit",
    conscientiousness: "Gewissenhaftigkeit",
    extraversion: "Extraversion",
    agreeableness: "Vertraeglichkeit",
    neuroticism: "Emotionale Stabilitaet",
  },
  en: {
    openness: "Openness",
    conscientiousness: "Conscientiousness",
    extraversion: "Extraversion",
    agreeableness: "Agreeableness",
    neuroticism: "Emotional Stability",
  },
} as const;

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
  const [openness, setOpenness] = useState(5);
  const [conscientiousness, setConscientiousness] = useState(5);
  const [extraversion, setExtraversion] = useState(5);
  const [agreeableness, setAgreeableness] = useState(5);
  const [neuroticism, setNeuroticism] = useState(5);
  const [interests, setInterests] = useState("");
  const [travelAfterProgram, setTravelAfterProgram] = useState(false);
  const [answersEditable, setAnswersEditable] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      setOpenness(me.user.profile.openness);
      setConscientiousness(me.user.profile.conscientiousness);
      setExtraversion(me.user.profile.extraversion);
      setAgreeableness(me.user.profile.agreeableness);
      setNeuroticism(me.user.profile.neuroticism);
      setInterests(me.user.profile.interests);
      setTravelAfterProgram(me.user.profile.travelAfterProgram);
      setAnswersEditable(me.user.profile.answersEditable);
    } else {
      setPublicTags([]);
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

  const labels = bigFiveLabels[locale];
  const answersLocked = useMemo(
    () => !!user?.profile && user.role !== "ADMIN" && !answersEditable,
    [answersEditable, user],
  );

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
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        interests,
        travelAfterProgram,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Save failed");
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
      const apiError = data.error as string | undefined;
      if (apiError === "Current password is incorrect") {
        setMessage(t.currentPasswordWrong);
      } else if (apiError === "New password must be different from current password") {
        setMessage(t.newPasswordMustDiffer);
      } else {
        setMessage(apiError ?? "Change password failed");
      }
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
      setMessage(data.error ?? "Import failed");
      return;
    }

    setMessage(`${t.importDone}: ${data.processed}`);
    await loadData();
  }

  async function runMatching() {
    const response = await fetch("/api/admin/match", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Matching failed");
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
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Permission update failed");
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
              <p className="muted mt-1 text-sm">{user.name} - {user.email}</p>
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
                  <input className="field" placeholder="Photo URL (required)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
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
              <div className="mt-4 space-y-4">
                <select className="field-select" value={country} onChange={(e) => setCountry(e.target.value as "TR" | "DE")} disabled={answersLocked}>
                  <option value="TR">TR</option>
                  <option value="DE">DE</option>
                </select>

                <div className="grid gap-3">
                  {bigFiveFields.map((field) => (
                    <label className="block" key={field}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                        <span>{labels[field]}</span>
                        <span className="font-semibold text-amber-700">{{ openness, conscientiousness, extraversion, agreeableness, neuroticism }[field]}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={{ openness, conscientiousness, extraversion, agreeableness, neuroticism }[field]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (field === "openness") setOpenness(val);
                          if (field === "conscientiousness") setConscientiousness(val);
                          if (field === "extraversion") setExtraversion(val);
                          if (field === "agreeableness") setAgreeableness(val);
                          if (field === "neuroticism") setNeuroticism(val);
                        }}
                        disabled={answersLocked}
                        className="w-full accent-amber-600"
                      />
                    </label>
                  ))}
                </div>

                <textarea className="field-textarea" placeholder={t.interests} value={interests} onChange={(e) => setInterests(e.target.value)} rows={3} disabled={answersLocked} />

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={travelAfterProgram} onChange={(e) => setTravelAfterProgram(e.target.checked)} disabled={answersLocked} />
                  {t.travelAfter}
                </label>

                <p className="muted text-sm">{answersLocked ? t.answerLockNotice : t.answerOpenNotice}</p>
                <button className="btn-primary w-full px-4 py-3" onClick={saveProfile}>{t.saveAll}</button>
              </div>
            </article>
          </section>

          <section className="flex flex-col gap-5">
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
                        <>
                          <p className="muted mt-2 text-xs">{item.profile.country} | O:{item.profile.openness} C:{item.profile.conscientiousness} E:{item.profile.extraversion} A:{item.profile.agreeableness} N:{item.profile.neuroticism}</p>
                          <p className="muted text-xs">{item.profile.interests}</p>
                          <button className="btn-ghost mt-2 px-3 py-2 text-sm" onClick={() => toggleAnswerPermission(item.id, !item.profile?.answersEditable)}>
                            {item.profile.answersEditable ? t.lockEdit : t.allowEdit}
                          </button>
                        </>
                      ) : (
                        <p className="muted mt-2 text-xs">Profile yok</p>
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
