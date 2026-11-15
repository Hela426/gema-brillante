import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireCharacter } from "@/lib/auth";
import CharacterForm from "@/components/character-form";
import ThemeToggle from "@/components/theme-toggle";
import type { Character } from "@/lib/characters";
import Link from "next/link";
import { ArrowLeft, Flower2 } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

async function EditCharacter({ params }: Props) {
  const { supabase, user, profile } = await requireCharacter();

  const { id } = await params;

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) notFound();

  if (data.owner_id !== user.id && profile.role !== "master") {
    redirect(`/personajes/${id}`);
  }

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-3xl mx-auto">
        <header
          className="flex items-center
          justify-between"
        >
          <Link
            href={`/personajes/${id}`}
            className="flex items-center gap-2
              text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Volver al perfil
          </Link>

          <ThemeToggle />
        </header>

        <div className="text-center my-10">
          <Flower2 size={40} className="mx-auto text-(--gold)" />

          <h1 className="text-5xl mt-4">Editar personaje</h1>

          <p className="text-(--muted) text-sm mt-3">{data.name}</p>

          <div className="floral-divider my-6">✧</div>
        </div>

        <CharacterForm character={data as Character} />
      </div>
    </main>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8">Cargando ficha...</p>}>
      <EditCharacter params={params} />
    </Suspense>
  );
}
