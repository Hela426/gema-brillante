import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import CharacterImage from "@/components/character-image";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeft, Plus, UsersRound } from "lucide-react";

async function MyNPCs() {
  const { supabase, user } = await requireCharacter();

  const { data: characters, error } = await supabase
    .from("characters")
    .select("*")
    .eq("owner_id", user.id)
    .eq("character_type", "npc")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const statusNames: Record<string, string> = {
    pending: "Pendiente de aprobación",
    approved: "Aprobado",
    rejected: "Rechazado",
  };

  const statusColors: Record<string, string> = {
    pending: "var(--ivory)",
    approved: "var(--sage)",
    rejected: "var(--pink)",
  };

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center">
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
          className="academy-banner rounded-3xl
          border border-(--border) p-8 mt-8"
        >
          <UsersRound size={40} className="text-(--gold)" strokeWidth={1.2} />

          <h1 className="text-5xl mt-4">Mis NPC</h1>

          <p className="text-sm italic text-(--muted) mt-3">
            Toda gran historia necesita personajes inolvidables.
          </p>
        </section>

        <Link
          href="/npc/crear"
          className="inline-flex items-center gap-2
            bg-(--lavender) rounded-xl px-5 py-3 mt-6 text-sm"
        >
          <Plus size={18} />
          Crear NPC
        </Link>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3
          gap-6 mt-8"
        >
          {characters?.map((person) => (
            <article key={person.id} className="academy-card overflow-hidden">
              <CharacterImage
                path={person.cover_url}
                kind="cover"
                className="h-32"
              />

              <div className="p-5 text-center">
                <CharacterImage
                  path={person.avatar_url}
                  className="w-24 h-24 rounded-full
                    mx-auto -mt-14 relative
                    border-2 border-(--gold)"
                />

                <h2 className="text-3xl mt-4">{person.name}</h2>

                <p className="text-xs text-(--accent) mt-2">@{person.handle}</p>

                <div
                  className="rounded-xl p-3 text-xs mt-5"
                  style={{
                    background: statusColors[person.status],
                  }}
                >
                  {statusNames[person.status]}
                </div>

                <Link
                  href={`/personajes/${person.id}`}
                  className="academy-button block mt-4"
                >
                  Ver personaje
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!characters?.length && (
          <div className="academy-card text-center p-10 mt-8">
            Todavía no tienes personajes secundarios.
          </div>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <MyNPCs />
    </Suspense>
  );
}
