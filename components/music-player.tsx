"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import YouTubePlayer from "@/components/youtube-player";
import AudioTrackPlayer from "@/components/audio-track-player";

import {
  playerStyles,
  defaultMusicSettings,
  youtubeId,
  safeHttps,
  mp3Url,
  musicAudioBucket,
  validateMusicFile,
  type MusicSettings,
  type MusicTrack,
} from "@/lib/music";

import {
  Music2,
  Disc3,
  Plus,
  Pencil,
  Trash2,
  SkipBack,
  SkipForward,
  Play,
  Square,
  Upload,
  Settings2,
  X,
  Flower2,
  ExternalLink,
} from "lucide-react";

type Props = {
  characterId: string;
  settings: MusicSettings | null;
  tracks: MusicTrack[];
  canEdit: boolean;
  compact?: boolean;
};

export default function MusicPlayer({
  characterId,
  settings,
  tracks,
  canEdit,
  compact = false,
}: Props) {
  const router = useRouter();

  const [preferences, setPreferences] = useState<MusicSettings>({
    ...defaultMusicSettings,
    ...settings,
  });

  const [config, setConfig] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [source, setSource] = useState("");
  const [cover, setCover] = useState("");
  const [position, setPosition] = useState(1);

  const [sourceType, setSourceType] = useState<"youtube" | "mp3" | "upload">("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<MusicTrack | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const ordered = [...tracks].sort(
    (a, b) =>
      a.position - b.position ||
      a.created_at.localeCompare(b.created_at) ||
      a.id.localeCompare(b.id),
  );

  const active = ordered.find((t) => t.id === selected) || ordered[0];

  const activeIndex = ordered.findIndex((t) => t.id === active?.id);

  const style = settings?.player_style || "vinyl";

  async function execute(action: () => Promise<void>, success: string) {
    if (!canEdit || busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function savePreferences() {
    await execute(async () => {
      const { error } = await createClient()
        .from("character_music")
        .upsert(
          {
            character_id: characterId,
            ...preferences,
            playlist_name:
              preferences.playlist_name.trim() || "Mi banda sonora",
          },
          {
            onConflict: "character_id",
          },
        );

      if (error) throw new Error(error.message);

      setConfig(false);
    }, "Preferencias musicales guardadas.");
  }

  function openConfig() {
    setPreferences({
      ...defaultMusicSettings,
      ...settings,
    });

    setConfig(true);
    setError("");
  }

  function newTrack() {
    setEditingId(null);
    setTitle("");
    setArtist("");
    setSource("");
    setCover("");
    setSourceType("upload");
    setAudioFile(null);
    setAudioPath(null);

    setPosition(
      ordered.length ? Math.max(...ordered.map((t) => t.position)) + 1 : 1,
    );

    setEditing(true);
    setError("");
  }

  function editTrack(track: MusicTrack) {
    setEditingId(track.id);
    setTitle(track.title ?? "");
    setArtist(track.artist ?? "");
    setSource(track.source ?? "");
    setCover(track.cover_url ?? "");
    setSourceType(track.audio_path ? "upload" : track.source_type);
    setAudioPath(track.audio_path || null);
    setAudioFile(null);
    setPosition(track.position ?? 1);
    setEditing(true);
    setError("");
  }

  async function saveTrack() {
    await execute(async () => {
      if (!title.trim()) {
        throw new Error("Escribe el título de la canción.");
      }

      let validSource = sourceType === "youtube" ? youtubeId(source) : sourceType === "mp3" ? mp3Url(source) : null;
      if (sourceType === "upload") {
        if (!audioFile && !audioPath) throw new Error("Selecciona un archivo MP3.");
        if (audioFile) validateMusicFile(audioFile);
      }
      if (sourceType !== "upload" && !validSource) {
        throw new Error(
          sourceType === "youtube"
            ? "Introduce un enlace válido de YouTube."
            : "Introduce una URL HTTPS directa a un MP3.",
        );
      }

      const validCover = cover.trim() ? safeHttps(cover) : "";

      if (validCover === null) {
        throw new Error("La portada necesita una URL HTTPS válida.");
      }

      if (!Number.isInteger(position) || position < 0) {
        throw new Error("Introduce una posición válida.");
      }

      const supabase = createClient();

      // Inicialización de la lista de reproducción.
      const playlist = await supabase.from("character_music").upsert(
        {
          character_id: characterId,
          ...defaultMusicSettings,
        },
        {
          onConflict: "character_id",
          ignoreDuplicates: true,
        },
      );

      if (playlist.error) {
        throw new Error(playlist.error.message);
      }

      const previousPath = editingId ? tracks.find(t => t.id === editingId)?.audio_path : null;
      let newPath: string | null = sourceType === "upload" ? audioPath : null;
      let uploadedPath: string | null = null;
      try {
        if (sourceType === "upload") {
          if (audioFile) {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("Inicia sesión de nuevo para subir música.");
            const path = `${user.id}/${characterId}/${crypto.randomUUID()}.mp3`;
            const { error: uploadError } = await supabase.storage.from(musicAudioBucket).upload(path, audioFile, { contentType: "audio/mpeg", upsert: false });
            if (uploadError) throw new Error(uploadError.message);
            uploadedPath = path;
            newPath = path;
          }
          if (!newPath) throw new Error("No se encuentra el archivo MP3.");
          // Audio privado: reproducción mediante URL firmada de la sesión.
          validSource = supabase.storage.from(musicAudioBucket).getPublicUrl(newPath).data.publicUrl.replace("/object/public/", "/object/authenticated/");
        }
        if (!validSource) throw new Error("El origen de la canción no es válido.");
        const payload = {
          title: title.trim(), artist: artist.trim(),
          source_type: sourceType === "youtube" ? "youtube" : "mp3",
          source: validSource, audio_path: newPath, cover_url: validCover, position,
        };
        const result = editingId
          ? await supabase.from("character_tracks").update(payload).eq("id", editingId).eq("character_id", characterId).select("id").single()
          : await supabase.from("character_tracks").insert({ ...payload, character_id: characterId }).select("id").single();
        if (result.error) throw new Error(result.error.message);
      } catch (problem) {
        // La política de borrado impide eliminar archivos que todavía estén referenciados.
        if (uploadedPath) await supabase.storage.from(musicAudioBucket).remove([uploadedPath]);
        throw problem;
      }
      if (previousPath && previousPath !== newPath) {
        const { error: cleanupError } = await supabase.storage.from(musicAudioBucket).remove([previousPath]);
        if (cleanupError) console.warn("No se pudo retirar un archivo musical anterior.");
      }
      setAudioFile(null);
      setLoaded(false);
      setEditing(false);
    }, "Canción guardada correctamente.");
  }

  async function deleteTrack(track: MusicTrack) {
    await execute(async () => {
      const { error } = await createClient()
        .from("character_tracks")
        .delete()
        .eq("id", track.id)
        .eq("character_id", characterId);

      if (error) throw new Error(error.message);

      if (track.audio_path) {
        const { error: cleanupError } = await createClient().storage.from(musicAudioBucket).remove([track.audio_path]);
        if (cleanupError) console.warn("No se pudo retirar el archivo musical.");
      }
      setDeleting(null);

      if (active?.id === track.id) {
        setSelected(null);
        setLoaded(false);
      }
    }, "Canción eliminada.");
  }

  function selectTrack(id: string) {
    setSelected(id);
    setLoaded(false);
  }

  function skip(direction: number) {
    if (!ordered.length) return;

    const next = (activeIndex + direction + ordered.length) % ordered.length;

    selectTrack(ordered[next].id);
  }

  const coverUrl = active?.cover_url ? safeHttps(active.cover_url) : null;

  const playableSource = active
    ? active.source_type === "youtube"
      ? youtubeId(active.source)
      : mp3Url(active.source)
    : null;

  if (!canEdit && (!settings?.visible || !tracks.length)) {
    return null;
  }

  return (
    <section className={`academy-card ${compact ? "profile-music-compact p-3 space-y-3" : "p-5 space-y-5"}`}>
      <header
        className="flex items-center
        justify-between flex-wrap gap-3"
      >
        <h2 className="text-3xl flex items-center gap-2">
          <Music2 size={23} className="text-(--gold)" />
          {settings?.playlist_name || "Mi banda sonora"}
        </h2>

        {canEdit && !compact && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              title="Configurar reproductor"
              onClick={openConfig}
              className="bg-(--lavender)
                rounded-xl p-3"
            >
              <Settings2 size={18} />
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={newTrack}
              className="academy-button flex
                items-center gap-2 text-sm"
            >
              <Plus size={17} />
              Canción
            </button>
          </div>
        )}
      </header>

      {canEdit && settings && !settings.visible && (
        <p
          className="text-xs bg-(--pink)
            rounded-xl p-3"
        >
          Tu playlist está oculta para los visitantes.
        </p>
      )}

      {error && (
        <p role="alert" className="bg-(--pink) rounded-xl p-3">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="bg-(--sage) rounded-xl p-3">
          {message}
        </p>
      )}

      {/* ───── CONFIGURACIÓN ───── */}

      {canEdit && !compact && config && (
        <fieldset disabled={busy} className="music-editor space-y-4">
          <div
            className="flex items-center
            justify-between"
          >
            <h3 className="text-2xl">Mi reproductor</h3>

            <button
              aria-label="Cerrar configuración"
              onClick={() => setConfig(false)}
            >
              <X size={20} />
            </button>
          </div>

          <label className="block text-sm">
            Nombre de mi playlist
            <input
              className="academy-input"
              maxLength={100}
              value={preferences.playlist_name}
              onChange={(e) =>
                setPreferences((old) => ({
                  ...old,
                  playlist_name: e.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm">
            Diseño
            <select
              className="academy-input"
              value={preferences.player_style}
              onChange={(e) =>
                setPreferences((old) => ({
                  ...old,
                  player_style: e.target.value as MusicSettings["player_style"],
                }))
              }
            >
              {Object.entries(playerStyles).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex items-center gap-2
            text-sm"
          >
            <input
              type="checkbox"
              checked={preferences.visible}
              onChange={(e) =>
                setPreferences((old) => ({
                  ...old,
                  visible: e.target.checked,
                }))
              }
            />
            Mostrar playlist a los visitantes
          </label>

          <button onClick={savePreferences} className="academy-button w-full">
            Guardar preferencias
          </button>
        </fieldset>
      )}

      {/* ───── EDITOR DE CANCIONES ───── */}

      {canEdit && !compact && editing && (
        <fieldset disabled={busy} className="music-editor space-y-4">
          <div
            className="flex items-center
            justify-between"
          >
            <h3 className="text-2xl">
              {editingId ? "Editar canción" : "Una nueva melodía"}
            </h3>

            <button
              aria-label="Cerrar editor"
              onClick={() => setEditing(false)}
            >
              <X size={20} />
            </button>
          </div>

          <label className="block text-sm">
            Título
            <input
              className="academy-input"
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            Artista
            <input
              className="academy-input"
              maxLength={150}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            Origen de la canción
            <select
              className="academy-input"
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value as "youtube" | "mp3" | "upload");
                setSource("");
                setAudioFile(null);
              }}
            >
              <option value="upload">Subir archivo MP3 (solo audio)</option>
              <option value="mp3">URL directa a MP3 (solo audio)</option>
              <option value="youtube">YouTube (vídeo oficial)</option>
            </select>
          </label>

          {sourceType === "upload" ? (
            <label key="source-upload" className="block text-sm space-y-2">
              <span className="flex items-center gap-2"><Upload size={16}/> Archivo MP3</span>
              <input key="audio-file" type="file" accept=".mp3,audio/mpeg,audio/mp3" className="academy-input text-xs" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
              <span className="block text-xs text-(--muted)">{audioFile ? audioFile.name : audioPath ? "Se conservará el archivo actual si no eliges otro." : "Máximo 10 MB. Usa únicamente música que tengas permiso de compartir."}</span>
            </label>
          ) : (
            <label key={`source-link-${sourceType}`} className="block text-sm">
            Enlace de la canción
            <input
              className="academy-input"
              maxLength={2000}
              value={source ?? ""}
              onChange={(e) => setSource(e.target.value)}
              placeholder={
                sourceType === "youtube"
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://ejemplo.com/cancion.mp3"
              }
            />
          </label>
          )}
          {sourceType === "youtube" && <p className="text-xs text-(--muted)">YouTube requiere su vídeo oficial visible. Para escuchar sin vídeo, usa un archivo MP3 autorizado o una URL directa.</p>}

          <label className="block text-sm">
            Portada (opcional)
            <input
              className="academy-input"
              maxLength={2000}
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label className="block text-sm">
            Posición dentro de la playlist
            <input
              type="number"
              min={0}
              step={1}
              className="academy-input"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
            />
          </label>

          <button onClick={saveTrack} className="academy-button w-full">
            {busy ? "Guardando..." : "Guardar canción"}
          </button>
        </fieldset>
      )}

      {/* ───── REPRODUCTOR ───── */}

      {active && (
        <div className="personal-music-player space-y-5" data-player={style}>
          <div className="music-artwork">
            <div className="music-artwork-inner relative">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={`Portada de ${active.title}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 180px, 260px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              ) : (
                <Disc3 size={46} strokeWidth={1.1} className="text-(--gold)" />
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-3xl wrap-break-word">{active.title}</h3>

            <p className="text-xs text-(--muted) mt-2">
              {active.artist || "Artista desconocido"}
            </p>
          </div>

          {active.source_type === "mp3" ? (
            <AudioTrackPlayer key={`${active.id}-${active.audio_path || active.source}`} track={active} onPrevious={() => skip(-1)} onNext={() => skip(1)} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-5">
                <button type="button" aria-label="Canción anterior" onClick={() => skip(-1)}><SkipBack size={24}/></button>
                <button type="button" title={loaded ? "Cerrar vídeo de YouTube" : "Ver vídeo de YouTube"} aria-label={loaded ? "Cerrar vídeo de YouTube" : "Ver vídeo de YouTube (no solo audio)"} onClick={() => setLoaded(old => !old)} className="music-play-button" disabled={!playableSource}>{loaded ? <Square size={20}/> : <Play size={22}/>}</button>
                <button type="button" aria-label="Siguiente canción" onClick={() => skip(1)}><SkipForward size={24}/></button>
              </div>
              <p className="text-xs text-center text-(--muted)">{loaded ? "Reproduce desde el vídeo oficial." : "YouTube · vídeo opcional. Para solo audio, selecciona una pista MP3."}</p>
              {loaded && playableSource && <YouTubePlayer key={active.id} videoId={playableSource}/>}
              {!loaded && playableSource && <a href={`https://www.youtube.com/watch?v=${playableSource}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-xs text-(--accent)"><ExternalLink size={13}/> Abrir en YouTube</a>}
            </div>
          )}
          <p className="text-xs text-center text-(--muted)">{activeIndex + 1} de {ordered.length}</p>
        </div>
      )}

      {/* ───── PLAYLIST ───── */}

      <details open={!compact} className="music-track-list">
        <summary className="cursor-pointer text-xs text-(--accent) mb-2">Lista de canciones ({ordered.length})</summary>
        <div className="space-y-2 max-h-72 overflow-y-auto">
        {ordered.map((track) => (
          <div
            key={track.id}
            className={`music-track ${
              active?.id === track.id ? "music-track-selected" : ""
            }`}
          >
            <button
              aria-pressed={active?.id === track.id}
              onClick={() => selectTrack(track.id)}
              className="flex flex-1 min-w-0
                text-left items-center gap-3"
            >
              <Music2 size={18} className="shrink-0 text-(--gold)" />

              <div className="min-w-0">
                <p className="text-sm wrap-break-word">{track.title}</p>

                <p
                  className="text-xs
                  text-(--muted) wrap-break-word"
                >
                  {[track.artist, track.source_type === "youtube" ? "YouTube" : "MP3"].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>

            {canEdit && !compact && (
              <>
                <button
                  disabled={busy}
                  title="Editar canción"
                  onClick={() => editTrack(track)}
                >
                  <Pencil size={16} />
                </button>

                <button
                  disabled={busy}
                  title="Eliminar canción"
                  onClick={() => setDeleting(track)}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}
        </div>
      </details>

      {!ordered.length && (
        <div className="text-center p-6">
          <Flower2 size={34} className="mx-auto text-(--gold)" />

          <p className="text-sm text-(--muted) mt-4">
            Mi historia todavía no tiene banda sonora.
          </p>
        </div>
      )}

      {canEdit && !compact && deleting && (
        <div className="music-editor space-y-3">
          <h3 className="text-2xl">¿Eliminar esta melodía?</h3>

          <p className="text-sm">
            «{deleting.title}» desaparecerá de tu playlist.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => setDeleting(null)}
              className="academy-button"
            >
              Cancelar
            </button>

            <button
              disabled={busy}
              onClick={() => deleteTrack(deleting)}
              className="bg-(--pink)
                rounded-xl px-5 py-3 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
