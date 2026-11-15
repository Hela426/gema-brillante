"use client";

import type { ReactNode } from "react";

import { Flower2, CalendarDays } from "lucide-react";

import Link from "next/link";
import CharacterImage from "@/components/character-image";
import type { Character } from "@/lib/characters";

export type HomeEvent = { id: string; title: string; starts_at: string };

const eventDate = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota",
});

export default function HomePage({
  isMaster = false,
  character = null,
  campaignTitle = "El Baile de las Orquídeas",
  upcomingEvents = [],
  socialFeed,
}: {
  isMaster?: boolean;
  character?: Character | null;
  campaignTitle?: string;
  upcomingEvents?: HomeEvent[];
  socialFeed?: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="min-w-0">
        <main
          className="max-w-[1500px] mx-auto
          p-4 md:p-8 pb-28 lg:pb-8"
        >
          {/* PORTADA */}

          <section
            className="academy-banner
            rounded-3xl min-h-72
            flex items-center p-7 md:p-12
            border border-(--border)"
          >
            <div className="max-w-xl">
              <p
                className="text-xs uppercase
                tracking-[0.3em] text-(--accent)"
              >
                Academia Gema Brillante
              </p>

              <h1
                className="text-4xl md:text-6xl
                font-semibold mt-3"
              >
                {campaignTitle}
              </h1>

              <p
                className="mt-4 italic
                text-(--muted) leading-relaxed"
              >
                Entre pétalos, promesas y secretos, solo una gema llevará la
                corona.
              </p>

              <div className="text-(--gold) mt-5">────── ✧ ──────</div>
            </div>
          </section>

          {/* BIENVENIDA */}

          <section className="mt-8">
            <h2 className="text-4xl font-semibold">Bienvenido a la academia</h2>

            <p className="text-sm text-(--muted) mt-1">
              Un nuevo capítulo está a punto de escribirse.
            </p>

          </section>

          <div
            className="grid grid-cols-1 xl:grid-cols-3
            gap-6 mt-8"
          >
            {/* PUBLICACIONES REALES */}

            <section className="min-w-0 xl:col-span-2 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-3xl font-semibold">Ecos de la sociedad</h2>
                <Link href="/tablon" className="text-xs text-(--accent)">
                  Ver todas
                </Link>
              </div>
              {socialFeed}
            </section>

            {/* COLUMNA DERECHA */}

            <aside className="space-y-5">
              <article className="academy-card p-5">
                <h3 className="text-2xl font-semibold">Mi personaje</h3>

                <div className="floral-divider my-5">❀</div>

                <CharacterImage
                  path={character?.avatar_url}
                  className="w-28 h-28 rounded-full mx-auto
                    border-2 border-(--gold)"
                />

                <h3 className="text-2xl text-center mt-4">
                  {character?.name || (isMaster ? "Rectoría" : "Sin personaje")}
                </h3>

                <p
                  className="text-xs text-center
                  text-(--muted) mt-2"
                >
                  {character
                    ? `@${character.handle}`
                    : "Tu historia todavía no ha comenzado."}
                </p>

                <Link
                  href={
                    character
                      ? `/personajes/${character.id}`
                      : isMaster ? "/master" : "/personajes/crear"
                  }
                  className="academy-button block text-center mt-5"
                >
                  {character ? "Ver mi perfil" : isMaster ? "Abrir Rectoría" : "Crear personaje"}
                </Link>
              </article>

              <article className="academy-card p-5">
                <h3
                  className="text-2xl font-semibold
                  flex items-center gap-2"
                >
                  <CalendarDays className="text-(--gold)" size={21} />
                  Próximos eventos
                </h3>

                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-b border-(--border) py-4 last:border-b-0">
                    <p className="text-sm break-words">{event.title}</p>
                    <time dateTime={event.starts_at} className="block text-xs text-(--muted) mt-1">
                      {eventDate.format(new Date(event.starts_at))} · hora Colombia
                    </time>
                  </div>
                ))}
                {!upcomingEvents.length && (
                  <p className="text-sm leading-6 text-(--muted) mt-4">Por ahora no hay eventos próximos disponibles para ti.</p>
                )}
                <Link href="/eventos" className="academy-button block text-center mt-4">Abrir calendario</Link>
              </article>

              <article
                className="rounded-2xl p-6
                bg-(--ivory) text-center"
              >
                <Flower2
                  size={32}
                  className="mx-auto text-(--gold)"
                  strokeWidth={1.2}
                />

                <h3 className="text-2xl mt-3">La flor de la academia</h3>

                <p className="text-sm italic leading-6 mt-3">
                  La orquídea blanca representa la elegancia, la gracia y las
                  promesas que todavía están por cumplirse.
                </p>
              </article>
            </aside>
          </div>

          <footer
            className="text-center mt-12
            text-xs text-(--muted)"
          >
            <div className="floral-divider mb-4">❀</div>
            Academia Gema Brillante · Good Society RPG
          </footer>
        </main>
      </div>
    </div>
  );
}
