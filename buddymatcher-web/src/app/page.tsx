"use client";

import Link from "next/link";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function Home() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];

  return (
    <div className="space-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <main className="card fade-in relative w-full max-w-5xl overflow-hidden rounded-3xl p-8 sm:p-12">
        <div className="aurora" />
        <div className="rise-in flex flex-wrap items-center justify-between gap-4">
          <p className="inline-flex rounded-full border border-cyan-200/35 bg-slate-900/70 px-3 py-1 text-xs tracking-[0.24em] uppercase text-cyan-100">
            {t.appName}
          </p>
          <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
        </div>
        <h1 className="rise-in stagger-1 mt-6 max-w-3xl text-4xl leading-tight text-cyan-50 sm:text-6xl">
          {t.heroTitle}
        </h1>
        <p className="rise-in stagger-2 mt-6 max-w-2xl text-base text-cyan-100/75 sm:text-lg">
          {t.heroBody}
        </p>
        <div className="rise-in stagger-3 mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="btn-primary px-6 py-3 text-center"
          >
            {t.register}
          </Link>
          <Link
            href="/login"
            className="btn-ghost px-6 py-3 text-center"
          >
            {t.launch}
          </Link>
          <Link
            href="/dashboard"
            className="btn-ghost px-6 py-3 text-center"
          >
            {t.dashboard}
          </Link>
        </div>
      </main>
    </div>
  );
}
