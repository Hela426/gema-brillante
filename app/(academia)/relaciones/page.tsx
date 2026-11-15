import { Suspense } from "react";
import Link from "next/link";
import { requireCharacter } from "@/lib/auth";

import RelationshipList from "@/components/relationship-list";
import RelationshipMap from "@/components/relationship-map";

import { Heart, Crown } from "lucide-react";

import type { Relationship, RelationshipCharacter } from "@/lib/relationships";

async function RelationshipsPage() {
  const { supabase, profile } = await requireCharacter();

  const isMaster = profile.role === "master";

  let peopleQuery = supabase
    .from("characters")
    .select("id, name, owner_id, avatar_url")
    .order("name");

  if (!isMaster) {
    peopleQuery = peopleQuery.eq("status", "approved");
  }

  const [relations, people] = await Promise.all([
    supabase
      .from("character_relationships")
      .select("*")
      .order("created_at", { ascending: false }),

    peopleQuery,
  ]);

  const error = relations.error || people.error;

  if (error) throw new Error(error.message);

  const relationships = (relations.data || []) as Relationship[];

  const characters = (people.data || []) as RelationshipCharacter[];

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <Heart size={42} strokeWidth={1.2} className="text-(--gold)" />

          <h1 className="text-5xl mt-4">El jardín de los vínculos</h1>

          <p className="text-sm italic text-(--muted) mt-4">
            Algunos lazos florecen bajo el sol. Otros solo existen en la
            oscuridad.
          </p>

          {isMaster && (
            <Link
              href="/master/relaciones"
              className="inline-flex items-center gap-2
                rounded-xl bg-(--ivory) px-5 py-3 mt-6 text-sm"
            >
              <Crown size={18} />
              Administrar relaciones
            </Link>
          )}
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              name: "Amistades",
              value: relationships.filter(
                (r) => r.relationship_type === "friendship",
              ).length,
              color: "var(--sage)",
            },
            {
              name: "Romances",
              value: relationships.filter(
                (r) => r.relationship_type === "romance",
              ).length,
              color: "var(--pink)",
            },
            {
              name: "Rivalidades",
              value: relationships.filter(
                (r) => r.relationship_type === "rivalry",
              ).length,
              color: "var(--ivory)",
            },
            {
              name: "Secretos conocidos",
              value: relationships.filter((r) => r.visibility === "secret")
                .length,
              color: "var(--lavender)",
            },
          ].map((stat) => (
            <article
              key={stat.name}
              className="rounded-2xl p-5"
              style={{ background: stat.color }}
            >
              <h2 className="text-5xl">{stat.value}</h2>
              <p className="text-xs mt-3">{stat.name}</p>
            </article>
          ))}
        </div>

        <RelationshipMap
          relationships={relationships}
          characters={characters}
        />

        <div className="floral-divider my-6">❀</div>

        <h2 className="text-3xl">Vínculos conocidos</h2>

        <RelationshipList
          relationships={relationships}
          characters={characters}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Abriendo el jardín...</p>}>
      <RelationshipsPage />
    </Suspense>
  );
}
