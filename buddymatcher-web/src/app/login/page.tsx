"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function LoginPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();

    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="app-shell">
      <div className="app-wrap flex min-h-screen items-center">
        <div className="panel fade-in grid w-full overflow-hidden lg:grid-cols-2">
          <aside className="relative hidden bg-gradient-to-br from-blue-700 to-blue-500 p-10 text-white lg:block">
            <div className="absolute -top-8 -left-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-orange-300/35 blur-2xl" />
            <p className="chip border-white/35 bg-white/20 text-white">BuddyMatcher</p>
            <h2 className="mt-6 max-w-sm text-4xl leading-tight">{t.heroTitle}</h2>
            <p className="mt-4 max-w-sm text-white/85">{t.heroBody}</p>
          </aside>

          <section className="p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <h1 className="text-3xl text-slate-900">{t.login}</h1>
                <p className="muted mt-2 text-sm">{t.loginSubtitle}</p>
              </div>
              <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
            </div>

            <form className="rise-in space-y-4" onSubmit={onSubmit}>
              <input
                className="field"
                placeholder={t.identifier}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                type="text"
                required
              />
              <input
                className="field"
                placeholder={t.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                disabled={loading}
                className="btn-primary w-full px-4 py-3 disabled:opacity-50"
                type="submit"
              >
                {loading ? "..." : t.login}
              </button>
            </form>

          </section>
        </div>
      </div>
    </div>
  );
}
