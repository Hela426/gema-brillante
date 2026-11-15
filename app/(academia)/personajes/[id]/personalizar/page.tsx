import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireCharacter } from "@/lib/auth";

import ProfileCustomizer from "@/components/profile-customizer";

import {
  defaultCustomization,
  type Customization,
  type CustomizableCharacter,
} from "@/lib/customization";

import { Palette } from "lucide-react";

async function CustomizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { supabase, user, profile } = await requireCharacter();

  const { data: character, error } = await supabase
    .from("characters")
    .select(
      `
      id,
      name,
      handle,
      owner_id,
      avatar_url,
      cover_url,
      favorite_quote
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!character) notFound();

  const canEdit = character.owner_id === user.id || profile.role === "master";

  if (!canEdit) {
    redirect(`/personajes/${id}`);
  }

  const settings = await supabase
    .from("character_customizations")
    .select(
      `
      theme,
      avatar_frame,
      decoration,
      card_style,
      background_pattern,
      accent_color,
      subtitle,
      welcome_message,
      flower,
      ambient_effect,
      effect_density
    `,
    )
    .eq("character_id", id)
    .maybeSingle();

  if (settings.error) {
    throw new Error(settings.error.message);
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header
          className="academy-banner rounded-3xl
          border border-(--border) p-8"
        >
          <Palette size={42} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-5"
          >
            Academia Gema Brillante
          </p>

          <h1 className="text-5xl mt-3">El alma de cada orquídea</h1>

          <p
            className="text-sm italic
            text-(--muted) mt-4"
          >
            No existen dos flores exactamente iguales.
          </p>
        </header>

        <ProfileCustomizer
          character={character as CustomizableCharacter}
          initialSettings={
            (settings.data as Customization | null) || defaultCustomization
          }
        />
      </div>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={<p className="p-8">Preparando tu jardín personal...</p>}
    >
      <CustomizePage params={params} />
    </Suspense>
  );
}
