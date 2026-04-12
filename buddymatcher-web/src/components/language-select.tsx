"use client";

import { Locale } from "@/lib/i18n";

type LanguageSelectProps = {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label?: string;
};

export function LanguageSelect({ locale, onChange, label = "Language" }: LanguageSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>{label}</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-amber-400"
      >
        <option value="tr">Turkce</option>
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
