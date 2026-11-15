import { Suspense } from "react";
import { requireMaster } from "@/lib/auth";
import RelationshipManager from "@/components/relationship-manager";
import { Heart } from "lucide-react";

import type {
  Relationship,
  RelationshipCharacter,
  RelationshipAccess,
  RelationshipMember,
} from "@/lib/relationships";

async function MasterRelationships() {
  const { supabase } = await requireMaster();

  const [relations, people, access, members] = await Promise.all([
    supabase
      .from("character_relationships")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("characters")
      .select("id, name, owner_id, avatar_url")
      .order("name"),

    supabase.from("relationship_access").select("*"),

    supabase
      .from("profiles")
      .select("id, username")
      .eq("role", "player")
      .order("username"),
  ]);

  const error =
    relations.error || people.error || access.error || members.error;

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8 mb-8"
        >
          <Heart size={40} className="text-(--gold)" strokeWidth={1.2} />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-5"
          >
            Archivos de Rectoría
          </p>

          <h1 className="text-5xl mt-3">Administración de relaciones</h1>

          <p className="italic text-sm text-(--muted) mt-4">
            Ningún vínculo escapa a nuestra mirada.
          </p>
        </section>

        <RelationshipManager
          relationships={(relations.data || []) as Relationship[]}
          characters={(people.data || []) as RelationshipCharacter[]}
          permissions={(access.data || []) as RelationshipAccess[]}
          members={(members.data || []) as RelationshipMember[]}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-8">Abriendo los archivos de Rectoría...</p>}
    >
      <MasterRelationships />
    </Suspense>
  );
}
