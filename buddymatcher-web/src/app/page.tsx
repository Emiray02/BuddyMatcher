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
      <div className="app-wrap">
        <header className="rise-in flex flex-wrap items-center justify-between gap-4">
          <p className="chip">{t.appName}</p>
          <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
        </header>

        <section className="hero-grid mt-5">
          <article className="panel fade-in relative overflow-hidden p-7 sm:p-10">
            <div className="orb orb-a" />
            <div className="orb orb-b" />

            <h1 className="rise-in max-w-3xl text-4xl leading-tight sm:text-6xl">{t.heroTitle}</h1>
            <p className="rise-in delay-1 mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t.heroBody}
            </p>

            <div className="rise-in delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary px-6 py-3 text-center">
                {t.register}
              </Link>
              <Link href="/login" className="btn-ghost px-6 py-3 text-center">
                {t.launch}
              </Link>
              <Link href="/dashboard" className="btn-ghost px-6 py-3 text-center">
                {t.dashboard}
              </Link>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <div className="info-card rise-in delay-1">
              <h3 className="text-lg font-semibold text-slate-800">{t.heroFeatureOne}</h3>
              <p className="muted mt-2 text-sm">{t.heroFeatureOneDesc}</p>
            </div>
            <div className="info-card rise-in delay-2">
              <h3 className="text-lg font-semibold text-slate-800">{t.heroFeatureTwo}</h3>
              <p className="muted mt-2 text-sm">{t.heroFeatureTwoDesc}</p>
            </div>
            <div className="info-card rise-in delay-3">
              <h3 className="text-lg font-semibold text-slate-800">{t.heroFeatureThree}</h3>
              <p className="muted mt-2 text-sm">{t.heroFeatureThreeDesc}</p>
            </div>
          </aside>
        </section>

        <section className="panel rise-in delay-2 mt-4 p-6 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-semibold text-slate-900">1:1</p>
              <p className="muted mt-1 text-sm">{t.metricOneLabel}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900">5 Faktor</p>
              <p className="muted mt-1 text-sm">{t.metricTwoLabel}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900">Tek Panel</p>
              <p className="muted mt-1 text-sm">{t.metricThreeLabel}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
