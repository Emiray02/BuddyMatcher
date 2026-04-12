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
    const data = (await response.json()) as {
      errorCode?: string;
      role?: "USER" | "ADMIN";
    };

    setLoading(false);
    if (!response.ok) {
      const errorCode = data.errorCode as string | undefined;
      if (errorCode === "EMAIL_ALREADY_USED") {
        setError(t.emailAlreadyUsed);
      } else {
        setError(t.registrationFailed);
      }
      return;
    }
    router.push(data.role === "ADMIN" ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="app-shell">
      <div className="app-wrap flex min-h-screen items-center">
        <div className="panel fade-in w-full p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl text-slate-900">{t.register}</h1>
              <p className="muted mt-2 text-sm">{t.registerSubtitle}</p>
            </div>
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <form className="rise-in grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="sm:col-span-2">
              <input
                className="field"
                placeholder={t.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-1">
              <input
                className="field"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <input
                className="field"
                placeholder={t.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            {error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
            <button
              disabled={loading}
              className="btn-primary sm:col-span-2 w-full px-4 py-3 disabled:opacity-50"
              type="submit"
            >
              {loading ? "..." : t.register}
            </button>
          </form>

          <p className="muted mt-5 text-sm">
            {t.login} ?{" "}
            <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
