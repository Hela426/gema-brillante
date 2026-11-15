import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { requireCharacter } from "@/lib/auth";
import CharacterForm from "@/components/character-form";
import ProfileCustomizer from "@/components/profile-customizer";
import PersonalityWidgets from "@/components/personality-widgets";
import MusicPlayer from "@/components/music-player";
import PersonalProfile from "@/components/personal-profile";
import { ProfileSettingsTabs } from "@/components/profile-tabs";
import { defaultCustomization, type Customization } from "@/lib/customization";
import type { Personality } from "@/lib/personality";
import type { MusicSettings, MusicTrack } from "@/lib/music";
import type { Character } from "@/lib/characters";
import "@/components/profile-redesign.css";

type Props = { params: Promise<{ id: string }> };

async function SettingsPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, profile } = await requireCharacter();
  const { data, error } = await supabase.from("characters").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const person = data as Character;
  // Se consulta el personaje visitado, no el rango del visitante.
  const { data: rectoryFlag, error: rectoryError } = await supabase.rpc(
    "is_rectory_character", { p_character: person.id },
  );
  if (rectoryError) throw new Error(rectoryError.message);
  const isRectory = rectoryFlag === true;
  if (person.owner_id !== user.id && profile.role !== "master") redirect(`/personajes/${id}`);

  const [customization, personality, music, tracks] = await Promise.all([
    supabase.from("character_customizations").select("theme, avatar_frame, decoration, card_style, background_pattern, accent_color, subtitle, welcome_message, flower, ambient_effect, effect_density, night_theme, night_accent_color").eq("character_id", id).maybeSingle(),
    supabase.rpc("get_character_personality", { p_character: id }),
    supabase.from("character_music").select("playlist_name, player_style, visible").eq("character_id", id).maybeSingle(),
    supabase.from("character_tracks").select("*").eq("character_id", id).order("position", { ascending: true }),
  ]);
  const problem = customization.error || personality.error || music.error || tracks.error;
  if (problem) throw new Error(problem.message);
  const settings: Customization = { ...defaultCustomization, ...(customization.data as Customization | null) };

  return <main className="min-h-screen p-4 md:p-8">
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href={`/personajes/${id}`} className="flex items-center gap-2 text-sm text-(--accent)"><ArrowLeft size={17}/> Volver al perfil</Link>
      <header className="academy-card p-6 space-y-2">
        <h1 className="text-4xl flex items-center gap-3"><Settings size={30} className="text-(--gold)"/> Personalizar perfil</h1>
        <p className="text-sm text-(--muted)">{person.name} · Edita cada sección y guarda sus cambios por separado.</p>
      </header>
      <ProfileSettingsTabs key={id}
        identity={<CharacterForm character={person} returnToSettings isRectory={isRectory} />}
        appearance={<ProfileCustomizer character={person} initialSettings={settings} embedded />}
        personality={<PersonalProfile settings={settings} characterId={id} preview introPlacement="inline"><PersonalityWidgets characterId={id} initialPersonality={personality.data as Personality | null} canEdit /></PersonalProfile>}
        music={<PersonalProfile settings={settings} characterId={id} preview introPlacement="inline"><MusicPlayer characterId={id} settings={music.data as MusicSettings | null} tracks={(tracks.data || []) as MusicTrack[]} canEdit /></PersonalProfile>}
      />
    </div>
  </main>;
}
export default function Page({ params }: Props) {
  return <Suspense fallback={<p className="p-8">Preparando tu perfil...</p>}><SettingsPage params={params}/></Suspense>;
}
