import { Suspense } from "react";
import Link from "next/link";
import { requireCharacter } from "@/lib/auth";
import JournalManager from "@/components/journal-manager";

import { Feather, Crown, CalendarDays } from "lucide-react";

import type {
  JournalEntry,
  JournalCharacter,
  CampaignSession,
} from "@/lib/journal";

type Props = {
  searchParams: Promise<{
    personaje?: string;
  }>;
};

async function JournalPage({ searchParams }: Props) {
  const { supabase, user, profile } = await requireCharacter();

  const isMaster = profile.role === "master";

  const { personaje } = await searchParams;

  const [entries, people, sessions] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase.from("characters").select("id, name").order("name"),

    supabase
      .from("campaign_sessions")
      .select("*")
      .order("session_number", { ascending: false }),
  ]);

  const error = entries.error || people.error || sessions.error;

  if (error) throw new Error(error.message);

  const characters = (people.data || []) as JournalCharacter[];

  const campaignSessions = (sessions.data || []) as CampaignSession[];

  const initialCharacterId = characters.some((p) => p.id === personaje)
    ? personaje!
    : "";

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <Feather size={42} className="text-(--gold)" strokeWidth={1.2} />

          <h1 className="text-5xl mt-4">Memorias entre pétalos</h1>

          <p
            className="italic text-sm
            text-(--muted) mt-4"
          >
            Hay recuerdos que merecen permanecer incluso cuando las flores se
            marchitan.
          </p>

          {isMaster && (
            <Link
              href="/master/sesiones"
              className="inline-flex items-center gap-2
                bg-(--ivory) px-5 py-3 rounded-xl
                text-sm mt-6"
            >
              <Crown size={18} />
              Administrar sesiones
            </Link>
          )}
        </section>

        <JournalManager
          key={initialCharacterId || "all"}
          entries={(entries.data || []) as JournalEntry[]}
          characters={characters}
          sessions={campaignSessions}
          userId={user.id}
          isMaster={isMaster}
          initialCharacterId={initialCharacterId}
        />

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <CalendarDays className="text-(--gold)" />
            Cronología de la academia
          </h2>

          <p className="text-xs text-(--muted) mt-3">
            Registro de los capítulos de nuestra historia.
          </p>

          <div className="mt-6 space-y-5">
            {campaignSessions.map((session) => (
              <article
                key={session.id}
                className="border-l-2 border-(--gold)
                  pl-5 py-3"
              >
                <p className="text-xs text-(--accent)">
                  Sesión {session.session_number}
                  {" · "}
                  {session.session_date.split("-").reverse().join("/")}
                </p>

                <h3 className="text-3xl mt-2">{session.title}</h3>

                {!session.published && (
                  <span
                    className="inline-block
                    text-xs bg-(--pink)
                    rounded-full px-3 py-1 mt-2"
                  >
                    Borrador privado
                  </span>
                )}

                <p
                  className="text-sm leading-7 mt-4
                  whitespace-pre-wrap wrap-break-word"
                >
                  {session.summary || "Sin resumen todavía."}
                </p>
              </article>
            ))}

            {!campaignSessions.length && (
              <p className="text-sm text-(--muted)">
                Nuestra historia todavía no ha comenzado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-8">Abriendo el diario...</p>}>
      <JournalPage searchParams={searchParams} />
    </Suspense>
  );
}
