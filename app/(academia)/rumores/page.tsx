import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import RumorManager from "@/components/rumor-manager";

import { Newspaper, Flower2 } from "lucide-react";

import type { AcademyRumor, RumorCharacter, RumorWallet } from "@/lib/rumors";

async function RumorsPage() {
  const { supabase, user, profile, character } = await requireCharacter();

  const isMaster = profile.role === "master";

  const walletsRequest = isMaster
    ? supabase.from("token_wallets").select("id, label").order("label")
    : Promise.resolve({ data: [] as RumorWallet[], error: null });

  const [rumors, people, walletsResult] = await Promise.all([
    supabase.rpc("list_academy_rumors"),
    supabase
      .from("characters")
      .select("id, name, owner_id")
      .eq("status", "approved")
      .order("name"),
    walletsRequest,
  ]);

  const error = rumors.error || people.error || walletsResult.error;

  if (error) throw new Error(error.message);

  const wallets = (walletsResult.data || []) as RumorWallet[];

  const characters = [...((people.data || []) as RumorCharacter[])].sort(
    (a, b) => Number(b.id === character?.id) - Number(a.id === character?.id),
  );

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header
          className="academy-card p-6 md:p-12
          text-center"
        >
          <Flower2
            size={50}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <p
            className="text-xs uppercase
            tracking-[0.3em] text-(--accent) mt-5"
          >
            Academia Gema Brillante
          </p>

          <h1
            className="text-5xl md:text-7xl
            font-semibold mt-4"
          >
            La Gaceta de las Orquídeas
          </h1>

          <div className="floral-divider my-6">❦</div>

          <div
            className="flex items-center justify-center
            gap-3 text-(--accent)"
          >
            <Newspaper size={19} />

            <p className="text-xs uppercase tracking-widest">
              Crónicas de la alta sociedad
            </p>
          </div>

          <p
            className="italic text-sm
            leading-7 text-(--muted) mt-5"
          >
            La sociedad habla. Nosotros escribimos.
          </p>
        </header>

        <RumorManager
          rumors={(rumors.data || []) as AcademyRumor[]}
          characters={characters}
          wallets={wallets}
          userId={user.id}
          isMaster={isMaster}
        />

        <footer
          className="text-center py-6
          text-xs italic text-(--muted)"
        >
          Incluso las flores más hermosas esconden secretos.
          <div className="floral-divider mt-4">❀</div>
        </footer>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Imprimiendo la gaceta...</p>}>
      <RumorsPage />
    </Suspense>
  );
}
