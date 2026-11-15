import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import CharacterForm from "@/components/character-form";
import ThemeToggle from "@/components/theme-toggle";
import { Flower2 } from "lucide-react";
import Link from "next/link";

async function CreateCharacter() {
  const { supabase, user, profile } = await requireProfile();

  const { data: existing, error } = await supabase
    .from("characters")
    .select("id")
    .eq("owner_id", user.id)
    .eq("character_type", "main")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (existing) {
    redirect(`/personajes/${existing.id}`);
  }

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-3xl mx-auto">
        <header
          className="flex justify-between
          items-center"
        >
          <Link
            href={profile.role === "master" ? "/" : "/cuenta"}
            className="text-sm text-(--accent)"
          >
            {profile.role === "master" ? "Volver" : "Configuración de cuenta"}
          </Link>

          <ThemeToggle />
        </header>

        <div className="text-center my-10">
          <Flower2
            size={42}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <p
            className="uppercase text-xs
            tracking-[0.3em] text-(--accent) mt-5"
          >
            Registro de estudiantes
          </p>

          <h1 className="text-5xl mt-4">Tu historia comienza aquí</h1>

          <div className="floral-divider my-5">❀</div>

          <p className="text-sm text-(--muted)">
            Antes de cruzar las puertas de la academia, debemos conocer quién
            eres.
          </p>
        </div>

        <CharacterForm characterType="main" />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <CreateCharacter />
    </Suspense>
  );
}
