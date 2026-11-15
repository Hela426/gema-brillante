import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import CharacterForm from "@/components/character-form";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";

async function CreateNPC() {
  await requireCharacter();

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between">
          <Link
            href="/npc"
            className="flex items-center gap-2 text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Mis NPC
          </Link>

          <ThemeToggle />
        </header>

        <div className="text-center my-10">
          <UsersRound
            size={42}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <h1 className="text-5xl mt-5">Una nueva historia</h1>

          <div className="floral-divider my-6">❀</div>

          <p className="text-sm text-(--muted)">
            Crea un personaje secundario para la academia. Rectoría deberá
            aprobarlo antes de que sea visible para los demás estudiantes.
          </p>
        </div>

        <CharacterForm characterType="npc" />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <CreateNPC />
    </Suspense>
  );
}
