"use client";

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
      country: "TR" | "DE";
      interests: string;
      bio: string;
    };
  } | null;
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
  const [message, setMessage] = useState("");

  const [country, setCountry] = useState<"TR" | "DE">("TR");
  const [openness, setOpenness] = useState(5);
  const [conscientiousness, setConscientiousness] = useState(5);
  const [extraversion, setExtraversion] = useState(5);
  const [agreeableness, setAgreeableness] = useState(5);
  const [neuroticism, setNeuroticism] = useState(5);
  const [interests, setInterests] = useState("");
  const [bio, setBio] = useState("");
  const [travelAfterProgram, setTravelAfterProgram] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

    if (me.user?.profile) {
      setCountry(me.user.profile.country);
      setOpenness(me.user.profile.openness);
      setConscientiousness(me.user.profile.conscientiousness);
      setExtraversion(me.user.profile.extraversion);
      setAgreeableness(me.user.profile.agreeableness);
      setNeuroticism(me.user.profile.neuroticism);
      setInterests(me.user.profile.interests);
      setBio(me.user.profile.bio ?? "");
      setTravelAfterProgram(me.user.profile.travelAfterProgram);
    }

    const matchResp = await fetch("/api/matches/me");
    if (matchResp.ok) {
      const match = (await matchResp.json()) as MatchResponse;
      setMatchData(match.match);
    }

    setLoading(false);
  }, [t.pleaseLogin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const profileReady = useMemo(() => !!user?.profile, [user]);

  async function saveProfile() {
    setMessage("");
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country,
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        interests,
        bio,
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

  const labels = bigFiveLabels[locale];

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="panel fade-in mb-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="chip mb-2">{t.appName}</p>
              <h1 className="text-3xl text-slate-900 sm:text-4xl">{t.dashboard}</h1>
              <p className="muted mt-1 text-sm">
                {user.name} - {user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
              <button className="btn-ghost px-4 py-2" onClick={logout}>
                {t.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.85fr]">
          <section className="panel rise-in p-5 sm:p-6">
            <h2 className="text-2xl text-slate-900">{t.profileSection}</h2>
            <div className="mt-4 space-y-4">
              <select
                className="field-select"
                value={country}
                onChange={(e) => setCountry(e.target.value as "TR" | "DE")}
              >
                <option value="TR">TR</option>
                <option value="DE">DE</option>
              </select>

              <div className="grid gap-3">
                {bigFiveFields.map((field) => (
                  <label className="block" key={field}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                      <span>{labels[field]}</span>
                      <span className="font-semibold text-blue-700">
                        {
                          {
                            openness,
                            conscientiousness,
                            extraversion,
                            agreeableness,
                            neuroticism,
                          }[field]
                        }
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={
                        {
                          openness,
                          conscientiousness,
                          extraversion,
                          agreeableness,
                          neuroticism,
                        }[field]
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (field === "openness") setOpenness(val);
                        if (field === "conscientiousness") setConscientiousness(val);
                        if (field === "extraversion") setExtraversion(val);
                        if (field === "agreeableness") setAgreeableness(val);
                        if (field === "neuroticism") setNeuroticism(val);
                      }}
                      className="w-full accent-blue-600"
                    />
                  </label>
                ))}
              </div>

              <textarea
                className="field-textarea"
                placeholder={t.interests}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
              />
              <textarea
                className="field-textarea"
                placeholder={t.bio}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={travelAfterProgram}
                  onChange={(e) => setTravelAfterProgram(e.target.checked)}
                />
                {t.travelAfter}
              </label>

              <button className="btn-primary w-full px-4 py-3" onClick={saveProfile}>
                {t.saveProfile}
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="panel rise-in delay-1 p-5 sm:p-6">
              <h2 className="text-2xl text-slate-900">{t.yourBuddy}</h2>
              {!profileReady ? (
                <p className="muted mt-3">{t.noProfileMatch}</p>
              ) : matchData ? (
                <div className="mt-3 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">{matchData.buddy.name}</p>
                  <p className="muted text-sm">{matchData.buddy.email}</p>
                  <p className="muted text-sm">{matchData.buddy.country}</p>
                  <p className="text-sm text-slate-800">{matchData.buddy.interests}</p>
                  <p className="text-sm text-slate-700">{matchData.buddy.bio}</p>
                  <p className="status text-sm">
                    {t.score}: {matchData.score.toFixed(1)}
                  </p>
                  <p className="muted text-sm">{matchData.reason}</p>
                </div>
              ) : (
                <p className="muted mt-3">{t.noMatchYet}</p>
              )}
            </div>

            {user.role === "ADMIN" ? (
              <div className="panel rise-in delay-2 p-5 sm:p-6">
                <h3 className="text-xl text-slate-900">{t.adminPanel}</h3>
                <div className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                    className="field"
                  />
                  <button className="btn-ghost w-full px-4 py-3" onClick={importCsv}>
                    {t.importCsv}
                  </button>
                  <button className="btn-primary w-full px-4 py-3" onClick={runMatching}>
                    {t.runMatching}
                  </button>
                  <p className="muted text-xs">
                    {t.csvColumns}: name,email,country,openness,conscientiousness,extraversion,agreeableness,neuroticism,interests,bio,travelAfterProgram,password
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
        {message ? <p className="status mt-4 text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
