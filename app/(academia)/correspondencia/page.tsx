import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import LetterManager from "@/components/letter-manager";

import { Mail } from "lucide-react";

import type { AcademyLetter, LetterCharacter, LetterPhase } from "@/lib/letters";

async function CorrespondencePage() {
  const { supabase, user, profile, character } = await requireCharacter();

  const [letters, people, phase] = await Promise.all([
    supabase.rpc("list_academy_letters_v2"),

    supabase
      .from("characters")
      .select("id, name, owner_id, avatar_url")
      .eq("status", "approved")
      .order("name"),
    supabase.rpc("academy_letter_phase"),
  ]);

  const error = letters.error || people.error || phase.error;

  if (error) throw new Error(error.message);

  const characters = [...((people.data || []) as LetterCharacter[])].sort(
    (a, b) => Number(b.id === character?.id) - Number(a.id === character?.id),
  );

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <Mail size={44} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-5"
          >
            Oficina de correspondencia
          </p>

          <h1 className="text-5xl mt-3">
            Cartas bajo el sello de una orquídea
          </h1>

          <p
            className="italic text-sm
            text-(--muted) mt-4"
          >
            Hay palabras que solo el papel se atreve a guardar.
          </p>
        </section>

        <LetterManager
          letters={(letters.data || []) as AcademyLetter[]}
          characters={characters}
          userId={user.id}
          phase={phase.data as LetterPhase | null}
          isMaster={profile.role === "master"}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-8">Preparando la correspondencia...</p>}
    >
      <CorrespondencePage />
    </Suspense>
  );
}
