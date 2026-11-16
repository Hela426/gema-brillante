import { Suspense } from "react";
import ProfileTabs, { ProfileTabLink } from "@/components/profile-tabs";
import GalleryManager from "@/components/gallery-manager";
import GalleryImage from "@/components/gallery-image";
import type { GalleryAlbum, GalleryPhoto } from "@/lib/gallery";
import { notFound } from "next/navigation";
import { requireCharacter } from "@/lib/auth";
import CharacterImage from "@/components/character-image";
import RelationshipList from "@/components/relationship-list";
import SocialPanel from "@/components/social-panel";
import ProfileComposer from "@/components/profile-composer";
import PersonalProfile from "@/components/personal-profile";
import PersonalityWidgets from "@/components/personality-widgets";
import type { Personality } from "@/lib/personality";
import MusicPlayer from "@/components/music-player";

import type { MusicSettings, MusicTrack } from "@/lib/music";

import { defaultCustomization, type Customization } from "@/lib/customization";

import type { Relationship, RelationshipCharacter } from "@/lib/relationships";

import { safeColor, type Character } from "@/lib/characters";
import Link from "next/link";

import {
  ArrowLeft,
  Crown,
  Settings,
  Images,
  BookOpen,
  Sparkles,
  LockKeyhole,
  Flower2,
  Feather,
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

async function CharacterProfile({ params }: Props) {
  const { supabase, user, profile } = await requireCharacter();

  const { id } = await params;

  const { data, error } = await supabase
    .from("characters")
    .select(`
      id, owner_id, name, handle, character_type, status,
      age, pronouns, race, kingdom, lineage, academic_year,
      appearance, temperament, character_role, family_background,
      biography, magic, combat_skills, avatar_url, cover_url,
      favorite_quote, positive_reputation, negative_reputation,
      theme_color, created_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) notFound();

  const person = data as Character;

  // Consultas independientes: todas conservan la sesión y las políticas RLS del visitante.
  const [
    rectoryResult,
    personalityResult,
    musicResult,
    musicTracksResult,
    secretsResult,
    relationsResult,
    customizationResult,
    albumsResult,
    photosResult,
    notesResult,
  ] = await Promise.all([
    supabase.rpc("is_rectory_character", { p_character: person.id }),
    supabase.rpc("get_character_personality", { p_character: person.id }),
    supabase
      .from("character_music")
      .select("playlist_name, player_style, visible")
      .eq("character_id", person.id)
      .maybeSingle(),
    supabase
      .from("character_tracks")
      .select("id, character_id, title, artist, source_type, source, audio_path, cover_url, position, created_at")
      .eq("character_id", person.id)
      .order("position", { ascending: true }),
    supabase
      .from("character_secrets")
      .select("id, title, content, category")
      .eq("character_id", person.id),
    supabase
      .from("character_relationships")
      .select("id, character_a_id, character_b_id, title, relationship_type, description, visibility, created_at")
      .or(`character_a_id.eq.${person.id},character_b_id.eq.${person.id}`),
    supabase
      .from("character_customizations")
      .select(`
        theme, avatar_frame, decoration, card_style, background_pattern,
        accent_color, subtitle, welcome_message, flower, ambient_effect,
        effect_density, night_theme, night_accent_color
      `)
      .eq("character_id", person.id)
      .maybeSingle(),
    supabase
      .from("character_albums")
      .select("id, character_id, title, description, visibility, created_at")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("character_photos")
      .select("id, character_id, album_id, image_path, title, description, visibility, favorite, created_at")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("journal_entries")
      .select("id, title, content, created_at, visibility")
      .eq("character_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const requestError =
    rectoryResult.error ||
    personalityResult.error ||
    musicResult.error ||
    musicTracksResult.error ||
    secretsResult.error ||
    relationsResult.error ||
    customizationResult.error ||
    albumsResult.error ||
    photosResult.error ||
    notesResult.error;

  if (requestError) throw new Error(requestError.message);

  const isRectory = rectoryResult.data === true;
  const canEdit = person.owner_id === user.id || profile.role === "master";
  const personality = personalityResult.data;
  const music = musicResult;
  const musicTracks = musicTracksResult;
  const secrets = secretsResult.data;
  const relationships = (relationsResult.data || []) as Relationship[];
  const customization = customizationResult.data;
  const albums = (albumsResult.data || []) as GalleryAlbum[];
  const photos = (photosResult.data || []) as GalleryPhoto[];
  const notes = (notesResult.data || []) as {
    id: string;
    title: string;
    content: string;
    created_at: string;
    visibility: string;
  }[];

  const relatedIds = [
    ...new Set(
      relationships.flatMap((relation) => [
        relation.character_a_id,
        relation.character_b_id,
      ]),
    ),
  ];

  let relatedPeople: RelationshipCharacter[] = [];

  if (relatedIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from("characters")
      .select("id, name, owner_id, avatar_url")
      .in("id", relatedIds);

    if (peopleError) throw new Error(peopleError.message);
    relatedPeople = (people || []) as RelationshipCharacter[];
  }

  const profileSettings =
    (customization as Customization | null) || defaultCustomization;

  // Solo se muestran miniaturas públicas, incluidas las protegidas por álbum privado.
  const publicAlbumIds = new Set(
    albums
      .filter((album) => album.visibility === "public")
      .map((album) => album.id),
  );
  const thumbnails = photos
    .filter(
      (photo) =>
        photo.visibility === "public" &&
        (!photo.album_id || publicAlbumIds.has(photo.album_id)),
    )
    .slice(0, 6);

  const information = [
    ["Edad", person.age?.toString()],
    ["Pronombres", person.pronouns],
    ["Raza", person.race],
    ["Procedencia", person.kingdom],
    ["Linaje", person.lineage],
    ["Año académico", person.academic_year],
    ["Rol social", person.character_role],
    ["Trasfondo", person.family_background],
  ];

  return (
    <main className="min-h-screen p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header
          className="flex items-center
          justify-between mb-6"
        >
          <Link
            href="/personajes"
            className="flex items-center gap-2
              text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Estudiantes
          </Link>
        </header>

        <PersonalProfile
          settings={profileSettings}
          characterId={person.id}
          canEdit={canEdit}
          hideActions
          introPlacement="inline"
        >
          {/* ───── PORTADA Y AVATAR ───── */}

          <section className="academy-card overflow-hidden relative">
            {canEdit && (
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <Link href={`/personajes/${id}/secretos`} title="Administrar archivos privados" aria-label="Administrar archivos privados" className="profile-icon-action">
                  <LockKeyhole size={17} />
                </Link>
                <Link href={`/personajes/${id}/configurar`} title="Editar y personalizar perfil" aria-label="Editar y personalizar perfil" className="profile-icon-action">
                  <Settings size={18} />
                </Link>
              </div>
            )}
            <CharacterImage
              path={person.cover_url}
              kind="cover"
              className="profile-cover w-full h-52 md:h-80 object-cover"
            />

            <div className="px-6 md:px-10 pb-7">
              <div
                className="flex flex-wrap
                items-end gap-5"
              >
                <div
                  className="profile-avatar-frame w-32 h-32 md:w-44 md:h-44
                    rounded-full -mt-16 md:-mt-20 relative"
                >
                  <CharacterImage
                    path={person.avatar_url}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-40 pt-4">
                  <h1 className="text-4xl md:text-5xl">{person.name}</h1>

                  <p className="text-sm text-(--accent) mt-2">
                    @{person.handle}
                  </p>

                  <p className="text-xs text-(--muted) mt-2">
                    {isRectory ? "♛ Rectoría · Academia Gema Brillante" : person.character_type === "main"
                      ? "Personaje principal"
                      : "NPC"}
                  </p>
                </div>

              </div>

              {person.favorite_quote && (
                <p className="italic text-(--muted) mt-6">
                  «{person.favorite_quote}»
                </p>
              )}

              {person.status !== "approved" && (
                <p
                  className="bg-(--ivory) rounded-xl
                  text-sm p-4 mt-5"
                >
                  Estado:{" "}
                  {person.status === "pending"
                    ? "Pendiente de aprobación"
                    : "Solicitud rechazada"}
                </p>
              )}
            </div>

            <div
              className="h-2"
              style={{
                background: customization
                  ? "var(--profile-accent)"
                  : safeColor(person.theme_color),
              }}
            />
          </section>

          {profileSettings.subtitle && <p className="text-center text-sm italic text-(--accent) wrap-break-word">{profileSettings.subtitle}</p>}
          {profileSettings.welcome_message && <div className="profile-welcome">{profileSettings.welcome_message}</div>}
          <ProfileTabs key={id}
            sidebar={<aside className="space-y-5 min-w-0">
              <MusicPlayer
                key={`music-${person.id}`}
                characterId={person.id}
                settings={music.data as MusicSettings | null}
                tracks={(musicTracks.data || []) as MusicTrack[]}
                canEdit={canEdit}
                compact
              />
              <PersonalityWidgets
                key={`personality-${person.id}`}
                characterId={person.id}
                initialPersonality={personality as Personality | null}
                canEdit={canEdit}
              />

              {isRectory ? (
                <section className="academy-card p-6 space-y-4">
                  <h2 className="text-3xl flex items-center gap-2">
                    <BookOpen size={22} className="text-(--gold)" />
                    Historia de la academia
                  </h2>
                  <div className="floral-divider">❀</div>
                  <p className="text-sm leading-7 whitespace-pre-wrap wrap-break-word">
                    {person.biography || "La historia de Gema Brillante está por escribirse."}
                  </p>
                  {canEdit && <Link href={`/personajes/${id}/configurar`} className="text-xs text-(--accent) underline">Editar historia</Link>}
                </section>
              ) : (<>
                <section className="academy-card p-6">
                <h2 className="text-3xl">Sobre mí</h2>

                <div className="floral-divider my-5">❀</div>

                <div className="space-y-4">
                  {information.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-(--accent)">{label}</p>

                      <p className="text-sm mt-1">
                        {value || "Sin especificar"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="academy-card p-6">
                <h2 className="text-3xl flex items-center gap-2">
                  <Crown size={22} className="text-(--gold)" />
                  Reputación
                </h2>

                <div className="flex flex-wrap gap-2 mt-5">
                  {person.positive_reputation.map((tag, i) => (
                    <span
                      key={`positive-${i}`}
                      className="bg-(--sage) rounded-full
                        px-3 py-2 text-xs"
                    >
                      ✧ {tag}
                    </span>
                  ))}

                  {person.negative_reputation.map((tag, i) => (
                    <span
                      key={`negative-${i}`}
                      className="bg-(--pink) rounded-full
                        px-3 py-2 text-xs"
                    >
                      ✧ {tag}
                    </span>
                  ))}
                </div>

                {!person.positive_reputation.length &&
                  !person.negative_reputation.length && (
                    <p className="text-xs text-(--muted) mt-4">
                      Su reputación aún está por escribirse.
                    </p>
                  )}
              </section>
              </>)}

              <section
                className="bg-(--ivory)
                rounded-2xl text-center p-6"
              >
                <Flower2 size={36} className="mx-auto text-(--gold)" />

                <p className="text-sm italic mt-4">
                  La verdadera belleza florece en silencio.
                </p>
              </section>
            </aside>}
                profilePanel={<div className="space-y-5">
              <section className="academy-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-2xl flex items-center gap-2"><Images size={20} className="text-(--gold)" /> Mi galería</h2>
                  <ProfileTabLink target="recuerdos" className="text-xs text-(--accent) underline underline-offset-4">Ver todas</ProfileTabLink>
                </div>
                {thumbnails.length ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {thumbnails.map(photo => (
                      <ProfileTabLink key={photo.id} target="recuerdos" title={photo.title} className="block w-full overflow-hidden rounded-lg aspect-square">
                        <GalleryImage path={photo.image_path} alt={photo.title} className="w-full h-full object-cover" />
                      </ProfileTabLink>
                    ))}
                  </div>
                ) : <p className="text-xs text-(--muted)">Aún no hay recuerdos públicos.</p>}
              </section>
              <section className="space-y-5">
                {canEdit && person.status === "approved" && (
                  <ProfileComposer key={person.id} characterId={person.id} name={person.name} avatar={person.avatar_url} />
                )}
                <div className="academy-card p-5">
                  <h2 className="text-3xl">{isRectory ? "Comunicados de Rectoría" : "Publicaciones"}</h2>

                  <p className="text-xs text-(--muted) mt-3">
                    {isRectory ? "Noticias y comunicados oficiales de la academia." : "Los pensamientos y momentos compartidos por este personaje."}
                  </p>
                </div>

                <SocialPanel characterId={person.id} allowCompose={false} />
              </section>

                </div>}
                characterPanel={<div className="space-y-5">
              <article className="academy-card p-6">
                <h2 className="text-3xl flex items-center gap-3">
                  <BookOpen size={23} className="text-(--gold)" />
                  {isRectory ? "Historia de la academia" : "Mi historia"}
                </h2>

                <p
                  className="text-sm leading-7 mt-5
                  whitespace-pre-wrap wrap-break-word"
                >
                  {person.biography ||
                    "Esta historia todavía no ha sido escrita."}
                </p>
              </article>

              <article className="academy-card p-6">
                <h2 className="text-3xl">Apariencia</h2>

                <p
                  className="text-sm leading-7 mt-4
                  whitespace-pre-wrap wrap-break-word"
                >
                  {person.appearance || "Sin especificar"}
                </p>

                <div className="floral-divider my-6">✧</div>

                <h2 className="text-3xl">Personalidad</h2>

                <p
                  className="text-sm leading-7 mt-4
                  whitespace-pre-wrap wrap-break-word"
                >
                  {person.temperament || "Sin especificar"}
                </p>
              </article>

              <article className="academy-card p-6">
                <h2 className="text-3xl flex items-center gap-3">
                  <Sparkles size={23} className="text-(--gold)" />
                  Dones y habilidades
                </h2>

                <h3 className="text-2xl mt-6">Magia</h3>

                <p
                  className="text-sm leading-7 mt-3
                  whitespace-pre-wrap wrap-break-word"
                >
                  {person.magic || "Sin especificar"}
                </p>

                <h3 className="text-2xl mt-6">Combate</h3>

                <p
                  className="text-sm leading-7 mt-3
                  whitespace-pre-wrap wrap-break-word"
                >
                  {person.combat_skills || "Sin especificar"}
                </p>
              </article>

                </div>}
                relationsPanel={<div className="space-y-5">
              <section className="academy-card p-6">
                <h2 className="text-3xl">Mis vínculos</h2>

                <p className="text-xs text-(--muted) mt-3">
                  Relaciones conocidas de este personaje.
                </p>

                <div className="mt-5">
                  <RelationshipList
                    relationships={relationships}
                    characters={relatedPeople}
                  />
                </div>

                {profile.role === "master" && (
                  <Link
                    href="/master/relaciones"
                    className="academy-button block text-center mt-5"
                  >
                    Administrar relaciones
                  </Link>
                )}
              </section>

                </div>}
                galleryPanel={<GalleryManager character={{ id: person.id, name: person.name, owner_id: person.owner_id }} albums={albums} photos={photos} userId={user.id} canEdit={canEdit} />}
                notesPanel={
              <section className="academy-card p-5 space-y-4">
                <h2 className="text-2xl flex items-center gap-2"><Feather size={20} className="text-(--gold)" /> Anotaciones y recuerdos</h2>
                <p className="text-xs text-(--muted)">Solo aparecen las anotaciones que tus permisos permiten consultar.</p>
                <Link href={`/diario?personaje=${id}`} className="academy-button inline-block text-sm">Abrir diario</Link>
                {!notes.length && <p className="text-sm text-(--muted)">No hay anotaciones disponibles.</p>}
                {notes.map(note => (
                  <article key={note.id} className="rounded-xl bg-(--surface) border border-(--border) p-4 space-y-2">
                    <h3 className="text-xl wrap-break-word">{note.title}</h3>
                    <p className="text-xs text-(--muted)">{note.created_at.slice(0,10).split("-").reverse().join("/")}{note.visibility !== "public" ? " · Acceso restringido" : ""}</p>
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{note.content}</p>
                  </article>
                ))}
              </section>
                }
                privatePanel={(canEdit || Boolean(secrets?.length)) ? <div className="space-y-5">
              {(canEdit || Boolean(secrets?.length)) && (
                <article className="academy-card p-6">
                  <h2
                    className="text-3xl
                    flex items-center gap-3"
                  >
                    <LockKeyhole size={23} className="text-(--gold)" />
                    Archivo privado
                  </h2>

                  <p className="text-xs text-(--muted) mt-3">
                    Información visible según tus permisos.
                  </p>

                  {secrets?.map((secret) => (
                    <div
                      key={secret.id}
                      className="bg-(--lavender)
                        rounded-xl p-5 mt-4"
                    >
                      <h3 className="text-2xl">{secret.title}</h3>

                      <p
                        className="text-sm leading-7 mt-3
                        whitespace-pre-wrap wrap-break-word"
                      >
                        {secret.content}
                      </p>
                    </div>
                  ))}

                  {!secrets?.length && (
                    <p className="text-sm text-(--muted) mt-5">
                      No hay secretos disponibles.
                    </p>
                  )}
                </article>
              )}
                </div> : null}
          />
        </PersonalProfile>
      </div>
    </main>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8">Abriendo el perfil...</p>}>
      <CharacterProfile params={params} />
    </Suspense>
  );
}
