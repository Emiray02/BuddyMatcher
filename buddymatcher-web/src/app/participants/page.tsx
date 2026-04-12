"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LanguageSelect } from "@/components/language-select";
import { SocialLinks } from "@/components/social-links";
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

type MeResponse = {
  user: {
    role: "USER" | "ADMIN";
    profile: { id: string } | null;
  } | null;
};

type MatchResponse = {
  match: {
    buddy: {
      id: string;
    };
  } | null;
};

export default function ParticipantsPage() {
  const { locale, setLocale } = useLocale("tr");
  const t = text[locale];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [buddyUserId, setBuddyUserId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const meResponse = await fetch("/api/me");
      if (meResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (!meResponse.ok) {
        setLoading(false);
        return;
      }

      const meData = (await meResponse.json()) as MeResponse;
      if (meData.user?.role === "USER" && !meData.user.profile) {
        router.replace("/onboarding");
        return;
      }

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

      const matchResponse = await fetch("/api/matches/me");
      if (matchResponse.ok) {
        const matchData = (await matchResponse.json()) as MatchResponse;
        setBuddyUserId(matchData.match?.buddy?.id ?? null);
      } else {
        setBuddyUserId(null);
      }

      setLoading(false);
    })();
  }, [router]);

  const orderedParticipants = useMemo(() => {
    if (!buddyUserId) {
      return participants;
    }

    const buddyIndex = participants.findIndex((participant) => participant.id === buddyUserId);
    if (buddyIndex <= 0) {
      return participants;
    }

    const next = [...participants];
    const [buddyParticipant] = next.splice(buddyIndex, 1);
    next.unshift(buddyParticipant);
    return next;
  }, [buddyUserId, participants]);

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="panel mb-5 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h1 className="text-3xl text-slate-900">{t.participantsNav}</h1>
            <p className="muted mt-1 text-sm">{t.participantsSubtitle}</p>
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
            {orderedParticipants.map((participant) => (
              <article key={participant.id} className="panel relative p-5">
                {participant.id === buddyUserId ? (
                  <span className="buddy-glow-link absolute left-4 top-4 text-xs">My Buddy</span>
                ) : null}
                <img
                  src={participant.profile?.avatarUrl || "https://ui-avatars.com/api/?name=Participant"}
                  alt={participant.name}
                  className={`h-28 w-28 rounded-2xl object-cover ${participant.id === buddyUserId ? "mt-8" : ""}`}
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

                <SocialLinks
                  className="mt-4"
                  instagramUrl={participant.profile?.instagramUrl}
                  linkedinUrl={participant.profile?.linkedinUrl}
                  xUrl={participant.profile?.xUrl}
                />
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
