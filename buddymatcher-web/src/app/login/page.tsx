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
    <div className="space-shell mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <div className="card fade-in w-full rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl text-cyan-50">{t.login}</h1>
          <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
        </div>

        <form className="space-y-4 rise-in" onSubmit={onSubmit}>
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
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
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
  );
}
