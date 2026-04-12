"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function RegisterPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
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
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl text-cyan-50">{t.register}</h1>
          <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
        </div>

        <form className="space-y-4 rise-in" onSubmit={onSubmit}>
          <input
            className="field"
            placeholder={t.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="field"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
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
            {loading ? "..." : t.register}
          </button>
        </form>

        <p className="mt-4 text-sm text-cyan-100/70">
          <Link href="/login" className="underline underline-offset-4">
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
