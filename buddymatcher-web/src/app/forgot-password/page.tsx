"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

type ForgotPasswordResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export default function ForgotPasswordPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    const data = (await response.json()) as ForgotPasswordResponse;
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }

    setMessage(t.forgotPasswordSuccess);
    router.push(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}`);
  }

  return (
    <div className="app-shell">
      <div className="app-wrap flex min-h-screen items-center">
        <div className="panel fade-in mx-auto w-full max-w-lg p-7 sm:p-8">
          <div className="mb-6 flex justify-end">
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <h1 className="text-3xl text-slate-900">{t.forgotPasswordTitle}</h1>
          <p className="muted mt-2 text-sm">{t.forgotPasswordSubtitle}</p>

          <form className="rise-in mt-6 space-y-4" onSubmit={onSubmit}>
            <input
              className="field"
              placeholder={t.forgotPasswordIdentifier}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type="text"
              required
            />

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {message ? <p className="status text-sm">{message}</p> : null}

            <button disabled={loading} className="btn-primary w-full px-4 py-3 disabled:opacity-50" type="submit">
              {loading ? "..." : t.sendResetCode}
            </button>
          </form>

          <p className="muted mt-5 text-sm">
            <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">
              {t.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
