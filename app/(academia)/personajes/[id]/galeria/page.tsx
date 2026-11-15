import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { requireCharacter } from "@/lib/auth";

import GalleryManager from "@/components/gallery-manager";

import PersonalProfile from "@/components/personal-profile";

import { defaultCustomization, type Customization } from "@/lib/customization";

import type {
  GalleryAlbum,
  GalleryPhoto,
  GalleryCharacter,
} from "@/lib/gallery";

import { ArrowLeft, Flower2 } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

async function GalleryPage({ params }: Props) {
  const { id } = await params;

  const { supabase, user, profile } = await requireCharacter();

  const { data: character, error } = await supabase
    .from("characters")
    .select("id, name, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!character) notFound();

  const canEdit = character.owner_id === user.id || profile.role === "master";

  const [albums, photos, customization] = await Promise.all([
    supabase
      .from("character_albums")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("character_photos")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),

    supabase
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
          effect_density, night_theme, night_accent_color
        `,
      )
      .eq("character_id", id)
      .maybeSingle(),
  ]);

  const problem = albums.error || photos.error || customization.error;

  if (problem) throw new Error(problem.message);

  const settings =
    (customization.data as Customization | null) || defaultCustomization;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={`/personajes/${id}`}
          className="flex items-center gap-2
            text-sm text-(--accent)"
        >
          <ArrowLeft size={18} />
          Volver al perfil de {character.name}
        </Link>

        <PersonalProfile settings={settings} characterId={id} preview>
          <header
            className="academy-card
            p-6 text-center"
          >
            <Flower2
              size={35}
              strokeWidth={1.2}
              className="mx-auto text-(--gold)"
            />

            <p
              className="text-xs uppercase
              tracking-widest mt-3 text-(--accent)"
            >
              Recuerdos de
            </p>

            <h1 className="text-4xl mt-3">{character.name}</h1>
          </header>

          <GalleryManager
            character={character as GalleryCharacter}
            albums={(albums.data || []) as GalleryAlbum[]}
            photos={(photos.data || []) as GalleryPhoto[]}
            userId={user.id}
            canEdit={canEdit}
          />
        </PersonalProfile>
      </div>
    </main>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense
      fallback={<p className="p-8">Abriendo el álbum de recuerdos...</p>}
    >
      <GalleryPage params={params} />
    </Suspense>
  );
}
