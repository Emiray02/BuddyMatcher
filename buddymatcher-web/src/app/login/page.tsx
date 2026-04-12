"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [playTransition, setPlayTransition] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = (await response.json()) as {
      errorCode?: string;
      role?: "USER" | "ADMIN";
      onboardingCompleted?: boolean;
    };

    if (!response.ok) {
      setLoading(false);
      const errorCode = data.errorCode as string | undefined;
      if (errorCode === "INVALID_CREDENTIALS") {
        setError(t.invalidCredentials);
      } else {
        setError(t.loginFailed);
      }
      return;
    }

    const targetRoute =
      data.role === "ADMIN"
        ? "/dashboard"
        : data.onboardingCompleted
          ? "/participants"
          : "/onboarding";

    void router.prefetch(targetRoute);

    setPlayTransition(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      router.push(targetRoute);
    }, 700);
  }

  return (
    <div className="app-shell">
      {playTransition ? <div className="login-transition-layer" /> : null}
      <div className="app-wrap flex min-h-screen items-center">
        <div className="panel fade-in mx-auto w-full max-w-lg p-7 sm:p-8">
          <div className="mb-6 flex justify-end">
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <h1 className="text-center text-3xl text-slate-900">{t.welcomeBack}</h1>

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
              disabled={loading || playTransition}
              className="btn-primary w-full px-4 py-3 disabled:opacity-50"
              type="submit"
            >
              {loading ? "..." : t.login}
            </button>
          </form>

          <p className="mt-4 text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-amber-700 hover:text-amber-800">
              {t.forgotPasswordLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
