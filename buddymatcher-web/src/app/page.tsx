"use client";

import Link from "next/link";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function Home() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];

  return (
    <div className="app-shell">
      <div className="app-wrap flex min-h-screen items-center justify-center">
        <main className="panel fade-in relative w-full max-w-2xl overflow-hidden p-8 text-center sm:p-10">
          <div className="orb orb-a" />
          <div className="orb orb-b" />

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-left">
            <p className="chip">{t.appName}</p>
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
          </div>

          <h1 className="rise-in text-4xl text-slate-900 sm:text-5xl">{t.welcomeTitle}</h1>
          <p className="rise-in delay-1 muted mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
            {t.welcomeSubtitle}
          </p>

          <div className="rise-in delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary px-6 py-3 text-center">
              {t.launch}
            </Link>
            <Link href="/register" className="btn-ghost px-6 py-3 text-center">
              {t.register}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
