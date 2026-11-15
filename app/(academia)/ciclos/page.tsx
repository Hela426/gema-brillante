import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import CampaignManager from "@/components/campaign-manager";
import { Hourglass } from "lucide-react";

import type { CampaignState, PhaseHistory } from "@/lib/campaign";

async function CyclesPage() {
  const { supabase, profile } = await requireCharacter();

  const [campaign, history] = await Promise.all([
    supabase.from("campaign_state").select("*").eq("id", 1).single(),

    supabase
      .from("campaign_phase_history")
      .select("*")
      .order("completed_at", { ascending: false }),
  ]);

  const error = campaign.error || history.error;

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <Hourglass size={42} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-4"
          >
            Academia Gema Brillante
          </p>

          <h1 className="text-5xl mt-3">Los ciclos del destino</h1>

          <p className="text-sm italic text-(--muted) mt-4">
            Cada decisión escribe una nueva página de nuestra historia.
          </p>
        </section>

        <CampaignManager
          campaign={campaign.data as CampaignState}
          history={(history.data || []) as PhaseHistory[]}
          isMaster={profile.role === "master"}
        />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-8">Consultando los ciclos del destino...</p>}
    >
      <CyclesPage />
    </Suspense>
  );
}
