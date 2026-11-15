import { Suspense } from "react";
import { requireMaster } from "@/lib/auth";
import MasterCharacters from "@/components/master-characters";
import type { Character } from "@/lib/characters";
import Link from "next/link";

import { Crown, UsersRound, Clock, ArrowLeft } from "lucide-react";

type Props = {
  searchParams: Promise<{
    filtro?: string;
  }>;
};

async function Dashboard({ searchParams }: Props) {
  const { supabase } = await requireMaster();

  const { filtro } = await searchParams;

  const initialFilter = ["all", "main", "npc", "pending"].includes(filtro || "")
    ? filtro!
    : "all";

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const characters = (data || []) as Character[];

  const pending = characters.filter(
    (person) => person.character_type === "npc" && person.status === "pending",
  ).length;

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/master"
          className="flex items-center gap-2
            text-sm text-(--accent)"
        >
          <ArrowLeft size={18} />
          Volver a Rectoría
        </Link>

        <section
          className="academy-banner
          rounded-3xl border border-(--border)
          p-8 my-6"
        >
          <Crown size={40} className="text-(--gold)" />

          <h1 className="text-5xl mt-4">
            {initialFilter === "pending"
              ? "Solicitudes de NPC"
              : "Administración de personajes"}
          </h1>

          <p className="text-sm italic text-(--muted) mt-4">
            Cada historia permanece bajo nuestra custodia.
          </p>
        </section>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/master/personajes"
            className="rounded-2xl
              bg-(--lavender) p-5"
          >
            <UsersRound className="text-(--accent)" />

            <h2 className="text-4xl mt-3">{characters.length}</h2>

            <p className="text-sm mt-2">Personajes registrados</p>
          </Link>

          <Link
            href="/master/personajes?filtro=pending"
            className="rounded-2xl bg-(--ivory) p-5"
          >
            <Clock className="text-(--gold)" />

            <h2 className="text-4xl mt-3">{pending}</h2>

            <p className="text-sm mt-2">Solicitudes pendientes</p>
          </Link>
        </div>

        <MasterCharacters
          key={initialFilter}
          initialCharacters={characters}
          initialFilter={initialFilter}
        />
      </div>
    </main>
  );
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-8">Cargando...</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}
