"use client";

import { Locale } from "@/lib/i18n";

type LanguageSelectProps = {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label?: string;
};

export function LanguageSelect({ locale, onChange, label = "Language" }: LanguageSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-100/80">
      <span>{label}</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="rounded-lg border border-cyan-300/40 bg-slate-950/70 px-2 py-1 text-xs text-cyan-100 outline-none transition focus:border-cyan-200"
      >
        <option value="tr">Turkce</option>
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
