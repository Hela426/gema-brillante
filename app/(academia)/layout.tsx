import { Suspense, type ReactNode } from "react";
import { requireProfile } from "@/lib/auth";
import AcademyNavigation from "@/components/academy-navigation";

async function AcademyLayout({ children }: { children: ReactNode }) {
  const { supabase, user, profile } = await requireProfile();

  const isMaster = profile.role === "master";

  const { data: character, error: characterError } = await supabase
    .from("characters")
    .select("id, name, handle, avatar_url")
    .eq("owner_id", user.id)
    .eq("character_type", "main")
    .eq("status", "approved")
    .maybeSingle();

  if (characterError) {
    throw new Error(characterError.message);
  }

  let query = supabase
    .from("characters")
    .select("id, name, handle, avatar_url")
    .order("name");

  if (!isMaster) {
    query = query.eq("status", "approved");
  }

  const { data: characters, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (
    <AcademyNavigation
      key={user.id}
      isMaster={isMaster}
      username={profile.username}
      character={character}
      characters={characters || []}
    >
      {children}
    </AcademyNavigation>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-(--accent) animate-pulse">
            Abriendo los corredores de Gema Brillante...
          </p>
        </div>
      }
    >
      <AcademyLayout>{children}</AcademyLayout>
    </Suspense>
  );
}
