"use client";

import { useEffect, useMemo, useState } from "react";

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

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const meResp = await fetch("/api/me");
    if (!meResp.ok) {
      setLoading(false);
      setMessage("Please login first.");
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

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
      setMessage("CSV dosyasi secin");
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
    setMessage(`CSV import tamamlandi: ${data.processed}`);
  }

  async function runMatching() {
    const response = await fetch("/api/admin/match", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Matching failed");
      return;
    }
    setMessage(`Eslestirme bitti. Cift sayisi: ${data.count}`);
    await loadData();
  }

  if (loading) {
    return <div className="p-8 text-cyan-100">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8 text-cyan-100">Please login at /login</div>;
  }

  return (
    <div className="space-shell mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl text-cyan-50">{t.dashboard}</h1>
          <p className="text-cyan-100/70">{user.name} - {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          <button className="btn-primary px-4 py-2" onClick={logout}>
            {t.logout}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card rounded-2xl p-6">
          <h2 className="mb-4 text-2xl">Profile</h2>
          <div className="space-y-3">
            <select
              className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
              value={country}
              onChange={(e) => setCountry(e.target.value as "TR" | "DE")}
            >
              <option value="TR">TR</option>
              <option value="DE">DE</option>
            </select>

            {bigFiveFields.map((field) => (
              <label className="block" key={field}>
                <span className="mb-1 block text-sm capitalize">{field}</span>
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
                  className="w-full"
                />
              </label>
            ))}

            <textarea
              className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
              placeholder={t.interests}
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              rows={3}
            />
            <textarea
              className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
              placeholder={t.bio}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={travelAfterProgram}
                onChange={(e) => setTravelAfterProgram(e.target.checked)}
              />
              {t.travelAfter}
            </label>

            <button className="w-full rounded-xl bg-black px-4 py-3 text-white" onClick={saveProfile}>
              {t.saveProfile}
            </button>
          </div>
        </section>

        <section className="card rounded-2xl p-6">
          <h2 className="mb-4 text-2xl">{t.yourBuddy}</h2>
          {!profileReady ? (
            <p className="text-cyan-100/70">Profilini kaydetmeden eslesme cikmaz.</p>
          ) : matchData ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">{matchData.buddy.name}</p>
              <p className="text-sm text-cyan-100/70">{matchData.buddy.email}</p>
              <p className="text-sm text-cyan-100/70">{matchData.buddy.country}</p>
              <p className="text-sm">{matchData.buddy.interests}</p>
              <p className="text-sm">{matchData.buddy.bio}</p>
              <p className="rounded-lg bg-cyan-500/10 p-2 text-sm">
                {t.score}: {matchData.score.toFixed(1)}
              </p>
              <p className="text-sm text-cyan-100/70">{matchData.reason}</p>
            </div>
          ) : (
            <p className="text-cyan-100/70">Henuz eslesme uretilmedi.</p>
          )}

          {user.role === "ADMIN" ? (
            <div className="mt-8 space-y-3 border-t border-black/10 pt-6">
              <h3 className="text-xl">{t.adminPanel}</h3>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-black/20 bg-white/90 p-3"
              />
              <button
                className="w-full rounded-xl border border-black/30 px-4 py-3"
                onClick={importCsv}
              >
                {t.importCsv}
              </button>
              <button className="w-full rounded-xl bg-black px-4 py-3 text-white" onClick={runMatching}>
                {t.runMatching}
              </button>
              <p className="text-xs text-cyan-100/60">
                CSV kolonlari: name,email,country,openness,conscientiousness,extraversion,agreeableness,neuroticism,interests,bio,travelAfterProgram,password
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {message ? <p className="mt-4 rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-100">{message}</p> : null}
    </div>
  );
}
