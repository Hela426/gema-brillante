import { Suspense } from "react";
import { requireMaster } from "@/lib/auth";
import SessionManager from "@/components/session-manager";
import type { CampaignSession } from "@/lib/journal";
import { BookOpen } from "lucide-react";

async function MasterSessions() {
  const { supabase } = await requireMaster();

  const { data, error } = await supabase
    .from("campaign_sessions")
    .select("*")
    .order("session_number", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <BookOpen size={42} className="text-(--gold)" strokeWidth={1.2} />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-4"
          >
            Archivos de Rectoría
          </p>

          <h1 className="text-5xl mt-3">Crónicas de Gema Brillante</h1>

          <p
            className="italic text-sm
            text-(--muted) mt-4"
          >
            Cada capítulo es una pequeña pieza del destino.
          </p>
        </section>

        <SessionManager sessions={(data || []) as CampaignSession[]} />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Abriendo las crónicas...</p>}>
      <MasterSessions />
    </Suspense>
  );
}
