"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { text } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

type Participant = {
  id: string;
  name: string;
  profile: {
    avatarUrl: string;
    bio: string;
    instagramUrl: string;
    linkedinUrl: string;
    xUrl: string;
    publicTags: string[];
  } | null;
};

export default function ParticipantsPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/participants");
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setParticipants([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setParticipants(data.participants ?? []);
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="panel mb-5 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h1 className="text-3xl text-slate-900">{t.participantsNav}</h1>
            <p className="muted mt-1 text-sm">Istkon&apos;26 programına katılan herkesin herkese açık profili</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelect locale={locale} onChange={setLocale} label={t.language} />
            <Link href="/dashboard" className="btn-ghost px-4 py-2">
              {t.dashboard}
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="panel p-6 text-slate-700">{t.loading}</div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <article key={participant.id} className="panel p-5">
                <img
                  src={participant.profile?.avatarUrl || "https://ui-avatars.com/api/?name=Participant"}
                  alt={participant.name}
                  className="h-28 w-28 rounded-2xl object-cover"
                />
                <h3 className="mt-4 text-xl text-slate-900">{participant.name}</h3>
                <p className="muted mt-2 text-sm">{participant.profile?.bio || "-"}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(participant.profile?.publicTags ?? []).map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  {participant.profile?.instagramUrl ? (
                    <a className="text-amber-700 hover:underline" href={participant.profile.instagramUrl} target="_blank" rel="noreferrer">
                      Instagram
                    </a>
                  ) : null}
                  {participant.profile?.linkedinUrl ? (
                    <a className="block text-amber-700 hover:underline" href={participant.profile.linkedinUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  ) : null}
                  {participant.profile?.xUrl ? (
                    <a className="block text-amber-700 hover:underline" href={participant.profile.xUrl} target="_blank" rel="noreferrer">
                      X / Twitter
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
