"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

type ResetPasswordResponse = {
  ok?: boolean;
  error?: string;
};

function ResetPasswordContent() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") ?? "";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!identifier.trim()) {
      setError(t.identifierRequired);
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setError(t.invalidVerificationCode);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        code,
        newPassword,
      }),
    });

    const data = (await response.json()) as ResetPasswordResponse;
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }

    setSuccess(t.resetPasswordSuccess);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="app-shell">
      <div className="app-wrap flex min-h-screen items-center">
        <div className="panel fade-in mx-auto w-full max-w-lg p-7 sm:p-8">
          <div className="mb-6 flex justify-end">
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <h1 className="text-3xl text-slate-900">{t.resetPasswordTitle}</h1>
          <p className="muted mt-2 text-sm">{t.resetPasswordSubtitle}</p>

          <form className="rise-in mt-6 space-y-4" onSubmit={onSubmit}>
            <input
              className="field"
              placeholder={t.forgotPasswordIdentifier}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type="text"
              required
            />
            <input
              className="field"
              placeholder={t.verificationCode}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
            />
            <input
              className="field"
              placeholder={t.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              minLength={8}
              required
            />
            <input
              className="field"
              placeholder={t.confirmPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              minLength={8}
              required
            />

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="status text-sm">{success}</p> : null}

            <button disabled={loading} className="btn-primary w-full px-4 py-3 disabled:opacity-50" type="submit">
              {loading ? "..." : t.resetPasswordAction}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <div className="app-wrap flex min-h-screen items-center justify-center">
            <div className="panel p-6 text-slate-700">Loading...</div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
