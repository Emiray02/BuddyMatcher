"use client";

import { useEffect, useState } from "react";

import { Locale } from "@/lib/i18n";

const STORAGE_KEY = "bm_locale";

export function useLocale(initial: Locale = "tr") {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return initial;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "tr" || saved === "de" || saved === "en") {
      return saved;
    }
    return initial;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return { locale, setLocale };
}
