import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import AcademyHome from "@/components/academy-home";
import SocialPanel from "@/components/social-panel";

async function ProtectedHome() {
  const { supabase, profile, character } = await requireCharacter();

  const [campaign, events] = await Promise.all([
    supabase.from("campaign_state").select("title").eq("id", 1).single(),
    supabase.from("academy_events")
      .select("id, title, starts_at")
      .eq("published", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
  ]);
  const error = campaign.error || events.error;
  if (error) throw new Error(error.message);

  return (
    <AcademyHome
      isMaster={profile.role === "master"}
      character={character}
      campaignTitle={campaign.data?.title || "El Baile de las Orquídeas"}
      upcomingEvents={events.data || []}
      socialFeed={<SocialPanel />}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-(--accent) animate-pulse">
            Abriendo las puertas de la academia...
          </p>
        </main>
      }
    >
      <ProtectedHome />
    </Suspense>
  );
}
