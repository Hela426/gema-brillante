import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import Treasury from "@/components/treasury";
import { Gem } from "lucide-react";

async function TreasuryPage() {
  const { supabase, user, profile } = await requireCharacter();

  const [wallets, movements, characters] = await Promise.all([
    supabase.from("token_wallets").select("*").order("label"),

    supabase
      .from("token_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("characters")
      .select("id, name, owner_id, character_type")
      .eq("status", "approved")
      .order("name"),
  ]);

  const error = wallets.error || movements.error || characters.error;

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <section
          className="academy-banner rounded-3xl
          border border-(--border) p-8 mb-8"
        >
          <Gem size={42} className="text-(--gold)" />

          <h1 className="text-5xl mt-4">Tesorería</h1>

          <p className="text-sm italic mt-3 text-(--muted)">
            Incluso el destino tiene su precio.
          </p>
        </section>

        <Treasury
          wallets={wallets.data || []}
          movements={movements.data || []}
          characters={characters.data || []}
          userId={user.id}
          isMaster={profile.role === "master"}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Abriendo la tesorería...</p>}>
      <TreasuryPage />
    </Suspense>
  );
}
