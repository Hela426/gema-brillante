"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mp3Url, musicAudioBucket, type MusicTrack } from "@/lib/music";

function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function AudioTrackPlayer({ track, onPrevious, onNext }: {
  track: MusicTrack;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeMenu = useRef<HTMLDivElement>(null);
  const volumeButton = useRef<HTMLButtonElement>(null);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState("");
  const path = track.audio_path || null;
  const source = path ? (signed?.path === path ? signed.url : null) : mp3Url(track.source);

  // Solicitar la URL antes del clic: play() se ejecuta dentro del gesto del usuario.
  useEffect(() => {
    if (!path) return;
    let alive = true;
    async function sign() {
      try {
        const { data, error } = await createClient().storage.from(musicAudioBucket).createSignedUrl(path!, 900);
        if (!alive) return;
        if (error || !data?.signedUrl) throw new Error("No pudimos acceder a este archivo de música.");
        setSigned({ path: path!, url: data.signedUrl });
      } catch {
        if (alive) setError("No pudimos preparar el MP3. Comprueba tu sesión o los permisos.");
      }
    }
    void sign();
    return () => { alive = false; };
  }, [path, attempt]);

  // Desmontar o cambiar la pista debe detener el audio anterior.
  useEffect(() => {
    const player = audio.current;
    return () => { player?.pause(); };
  }, [source, attempt]);

  useEffect(() => {
    if (!volumeOpen) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !volumeMenu.current?.contains(event.target)) setVolumeOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setVolumeOpen(false);
        volumeButton.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [volumeOpen]);

  function retry() {
    audio.current?.pause();
    setSigned(null);
    setPlaying(false);
    setWaiting(false);
    setCurrent(0);
    setDuration(0);
    setError("");
    setAttempt(n => n + 1);
  }
  async function toggle() {
    const player = audio.current;
    if (!player || !source) return;
    if (!player.paused) { player.pause(); return; }
    setError("");
    setWaiting(true);
    try {
      player.volume = volume;
      await player.play();
    } catch {
      setWaiting(false);
      setError("No se pudo iniciar el audio. Intenta de nuevo o comprueba el archivo y la conexión.");
    }
  }
  function seek(value: number) {
    const player = audio.current;
    if (!player || !Number.isFinite(player.duration) || !player.duration) return;
    player.currentTime = Math.max(0, Math.min(value, player.duration));
    setCurrent(player.currentTime);
  }
  function changeVolume(value: number) {
    setVolume(value);
    if (audio.current) audio.current.volume = value;
  }
  return <div className="space-y-3">
    {source && <audio key={attempt} ref={audio} src={source} preload="metadata" loop={repeat}
      onLoadedMetadata={e => { const a = e.currentTarget; setDuration(Number.isFinite(a.duration) ? a.duration : 0); a.volume = volume; }}
      onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPlaying={() => { setPlaying(true); setWaiting(false); }}
      onWaiting={() => setWaiting(true)}
      onPause={() => { setPlaying(false); setWaiting(false); }}
      onEnded={() => { setPlaying(false); setWaiting(false); }}
      onError={() => { setPlaying(false); setWaiting(false); setError("No se pudo cargar el MP3. El enlace puede haber caducado o el archivo no estar disponible."); }}
    />}
    <div className="space-y-1">
      <input type="range" aria-label="Avanzar o retroceder en la canción" min={0} max={duration || 1} step={0.1} value={Math.min(current, duration || 0)} disabled={!duration} onChange={e => seek(Number(e.target.value))} className="w-full accent-(--gold)" />
      <div className="flex justify-between text-xs text-(--muted) tabular-nums"><span>{timeLabel(current)}</span><span>{timeLabel(duration)}</span></div>
    </div>
    <div className="flex justify-center items-center gap-4 flex-wrap">
      <button type="button" title="Canción anterior" aria-label="Canción anterior" onClick={onPrevious}><SkipBack size={23}/></button>
      <button type="button" className="music-play-button" aria-label={playing ? "Pausar" : "Reproducir"} disabled={!source} onClick={() => void toggle()}>{playing ? <Pause size={23}/> : <Play size={23}/>}</button>
      <button type="button" title="Siguiente canción" aria-label="Siguiente canción" onClick={onNext}><SkipForward size={23}/></button>
      <button type="button" aria-pressed={repeat} title="Repetir canción" aria-label="Repetir canción" className={repeat ? "text-(--gold)" : "text-(--muted)"} onClick={() => setRepeat(old => !old)}><Repeat size={18}/></button>
      <div ref={volumeMenu} className="relative shrink-0">
        <button ref={volumeButton} type="button" title="Volumen" aria-label={`Volumen: ${Math.round(volume * 100)}%`} aria-expanded={volumeOpen} onClick={() => setVolumeOpen(old => !old)} className="flex items-center justify-center rounded-lg p-1 text-(--accent) hover:bg-(--surface) focus-visible:outline-2 focus-visible:outline-(--gold)">
          {volume === 0 ? <VolumeX size={19}/> : volume < 0.5 ? <Volume1 size={19}/> : <Volume2 size={19}/>}
        </button>
        {volumeOpen && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex w-16 flex-col items-center gap-2 rounded-xl border border-(--border) bg-(--surface) p-2 text-(--foreground) shadow-lg" role="group" aria-label="Ajustar volumen">
          <span className="text-xs tabular-nums">{Math.round(volume * 100)}%</span>
          <input type="range" aria-label="Nivel de volumen" aria-valuetext={`${Math.round(volume * 100)}%`} min={0} max={1} step={0.01} value={volume} onChange={e => changeVolume(Number(e.target.value))} className="accent-(--gold) cursor-pointer" style={{ writingMode: "vertical-lr", direction: "rtl", width: 24, height: 108, touchAction: "none" }}/>
        </div>}
      </div>
    </div>
    <p role="status" className="text-center text-xs text-(--muted)">{!path && !source ? "Enlace MP3 inválido" : error ? "Audio no disponible" : !source ? "Preparando canción…" : waiting ? "Cargando audio…" : playing ? "Reproduciendo ♫" : "Solo audio · pulsa reproducir"}</p>
    {error && <div className="bg-(--pink) rounded-xl p-3 space-y-2"><p role="alert" className="text-xs">{error}</p><button type="button" className="text-xs flex items-center gap-2" onClick={retry}><RefreshCw size={15}/> Recargar canción</button></div>}
  </div>;
}
