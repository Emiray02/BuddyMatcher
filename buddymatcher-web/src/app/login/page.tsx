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
        <div className="panel fade-in mx-auto w-full max-w-lg p-7 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="chip">{t.appName}</p>
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <h1 className="text-3xl text-slate-900">{t.welcomeBack}</h1>

          <form className="rise-in mt-6 space-y-4" onSubmit={onSubmit}>
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
        </div>
      </div>
    </div>
  );
}
