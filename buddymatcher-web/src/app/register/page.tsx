"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Locale, text } from "@/lib/i18n";

export default function RegisterPage() {
  const [locale, setLocale] = useState<Locale>("tr");
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
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <div className="card w-full rounded-2xl p-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl">{t.register}</h1>
          <button
            className="rounded-lg border border-black/20 px-3 py-1 text-sm"
            onClick={() => setLocale(locale === "tr" ? "de" : "tr")}
          >
            {locale.toUpperCase()}
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
            placeholder={t.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="w-full rounded-xl border border-black/20 bg-white/90 px-4 py-3"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
            type="submit"
          >
            {loading ? "..." : t.register}
          </button>
        </form>

        <p className="mt-4 text-sm text-black/70">
          <Link href="/login" className="underline">
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
