import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import CharacterImage from "@/components/character-image";
import ThemeToggle from "@/components/theme-toggle";
import { safeColor, type Character } from "@/lib/characters";
import Link from "next/link";

import { ArrowLeft, Flower2, UsersRound } from "lucide-react";

async function Directory() {
  const { supabase, character } = await requireCharacter();

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "approved")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  const characters = (data || []) as Character[];

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header
          className="flex items-center
          justify-between"
        >
          <Link
            href="/"
            className="flex items-center gap-2
              text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Volver a la academia
          </Link>

          <ThemeToggle />
        </header>

        <section
          className="academy-banner
          rounded-3xl border border-(--border)
          p-8 md:p-12 mt-8"
        >
          <UsersRound size={40} strokeWidth={1.2} className="text-(--gold)" />

          <h1 className="text-5xl mt-5">Estudiantes de Gema Brillante</h1>

          <p className="italic text-(--muted) mt-3">
            Cada rostro esconde una historia.
          </p>

          <p className="text-sm mt-5">
            {characters.length} personajes registrados
          </p>
        </section>

        {character && (
          <Link
            href={`/personajes/${character.id}`}
            className="inline-block mt-6
              bg-(--lavender) rounded-xl px-5 py-3 text-sm"
          >
            Mi perfil
          </Link>
        )}

        <div
          className="grid sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
        >
          {characters.map((person) => (
            <article key={person.id} className="academy-card overflow-hidden">
              <CharacterImage
                path={person.cover_url}
                kind="cover"
                className="h-28"
              />

              <div className="p-5 text-center">
                <div
                  className="w-28 h-28 rounded-full
                    p-1 mx-auto -mt-16 relative"
                  style={{
                    background: safeColor(person.theme_color),
                  }}
                >
                  <CharacterImage
                    path={person.avatar_url}
                    className="w-full h-full rounded-full"
                  />
                </div>

                <h2 className="text-2xl font-semibold mt-4">{person.name}</h2>

                <p className="text-xs text-(--accent) mt-1">@{person.handle}</p>

                <div className="floral-divider my-4">✧</div>

                <p className="text-sm">
                  {person.character_role || "Estudiante"}
                </p>

                <p className="text-xs text-(--muted) mt-2">
                  {person.lineage || "Linaje desconocido"}
                </p>

                <Link
                  href={`/personajes/${person.id}`}
                  className="academy-button block mt-5"
                >
                  Ver perfil
                </Link>
              </div>
            </article>
          ))}
        </div>

        {characters.length === 0 && (
          <div
            className="academy-card p-10
            text-center mt-8"
          >
            <Flower2 size={38} className="mx-auto text-(--gold)" />

            <p className="mt-4">La academia aún no tiene estudiantes.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <Directory />
    </Suspense>
  );
}
