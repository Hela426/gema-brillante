import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import DesireManager from "@/components/desire-manager";
import { Sparkles } from "lucide-react";

async function DesiresPage() {
  const { supabase, profile, user } = await requireCharacter();

  const isMaster = profile.role === "master";

  let characterQuery = supabase
    .from("characters")
    .select("id, name, owner_id, character_type")
    .order("name");

  if (isMaster) {
    characterQuery = characterQuery.eq("status", "approved");
  } else {
    characterQuery = characterQuery.eq("owner_id", user.id);
  }

  const [cards, assignments, characters] = await Promise.all([
    supabase
      .from("desire_cards")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase.from("desire_assignments").select("*"),

    characterQuery,
  ]);

  const error = cards.error || assignments.error || characters.error;

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <section
          className="academy-banner rounded-3xl
          border border-(--border) p-8 mb-8"
        >
          <Sparkles size={42} className="text-(--gold)" />

          <h1 className="text-5xl mt-4">Los deseos del corazón</h1>

          <p className="text-sm italic mt-3 text-(--muted)">
            Toda alma guarda un deseo que no se atreve a pronunciar.
          </p>
        </section>

        <DesireManager
          cards={cards.data || []}
          assignments={assignments.data || []}
          characters={characters.data || []}
          isMaster={isMaster}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Abriendo las cartas...</p>}>
      <DesiresPage />
    </Suspense>
  );
}
