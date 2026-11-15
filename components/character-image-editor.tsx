"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { ImagePlus, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { FramedImage, useCharacterImageUrl } from "@/components/character-image";
import { clamp, defaultFrame, frameFromPath, framingStyle, imageTypes, normalizeFrame, validateImage, type ImageDraft, type ImageFrame } from "@/lib/image-framing";

type Kind = "avatar" | "cover";

function useFileUrl(file: File | null) {
  const [entry, setEntry] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEntry({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return entry?.file === file ? entry?.url || null : null;
}

function FrameDialog({ kind, src, initial, onApply, onCancel }: {
  kind: Kind; src: string | null; initial: ImageFrame; onApply: (frame: ImageFrame) => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const title = useId();
  const [frame, setFrame] = useState(initial);
  const [loaded, setLoaded] = useState<{ src: string; w: number; h: number } | null>(null);
  const [badSrc, setBadSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; frame: ImageFrame; overflowX: number; overflowY: number } | null>(null);
  const ready = !!src && loaded?.src === src && badSrc !== src;
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => { if (el?.open) el.close(); };
  }, []);

  function start(e: PointerEvent<HTMLDivElement>) {
    if (!ready || !loaded || !viewport.current || drag.current || e.button !== 0) return;
    const { width, height } = viewport.current.getBoundingClientRect();
    const scale = Math.max(width / loaded.w, height / loaded.h) * frame.zoom;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, frame, overflowX: Math.max(0, loaded.w * scale - width), overflowY: Math.max(0, loaded.h * scale - height) };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setFrame({ ...d.frame,
      x: d.overflowX > 0.01 ? clamp(d.frame.x - (e.clientX - d.x) / d.overflowX * 100, 0, 100) : d.frame.x,
      y: d.overflowY > 0.01 ? clamp(d.frame.y - (e.clientY - d.y) / d.overflowY * 100, 0, 100) : d.frame.y,
    });
  }
  function end(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  }
  return (
    <dialog ref={dialog} aria-labelledby={title} onCancel={e => { e.preventDefault(); onCancel(); }}
      className="fixed m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-(--border) bg-(--card) text-(--foreground) p-5 shadow-2xl backdrop:bg-black/60">
      <h2 id={title} className="text-3xl">{kind === "avatar" ? "Ajustar retrato" : "Ajustar portada"}</h2>
      <p className="mt-2 text-sm text-(--muted)">Arrastra la imagen para acomodarla. Usa la barra para acercar o alejar.</p>
      <div className="mt-5 rounded-2xl bg-black/80 p-4 flex justify-center overflow-hidden">
        <div ref={viewport} tabIndex={0} aria-label="Encuadre de imagen. También puedes usar las flechas del teclado para moverla."
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
          onKeyDown={e => {
            const directions: Record<string, [number, number]> = { ArrowLeft: [2, 0], ArrowRight: [-2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] };
            const delta = directions[e.key];
            if (!delta || !ready) return;
            e.preventDefault();
            setFrame(f => ({ ...f, x: clamp(f.x + delta[0], 0, 100), y: clamp(f.y + delta[1], 0, 100) }));
          }}
          className={`relative overflow-hidden outline-2 outline-white/70 select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"} ${kind === "avatar" ? "w-full max-w-64 aspect-square rounded-full" : "w-full aspect-[3/1] rounded-lg"}`}>
          {src && <img src={src} alt="Vista previa del encuadre" draggable={false}
            onLoad={e => setLoaded({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onError={() => setBadSrc(src)} className="w-full h-full pointer-events-none" style={framingStyle(frame)} />}
          {!ready && <div className="absolute inset-0 grid place-items-center text-white text-xs text-center p-3">{badSrc ? "No se pudo abrir la imagen." : "Cargando imagen…"}</div>}
        </div>
      </div>
      <label className="mt-5 flex items-center justify-between text-sm">Zoom <span>{Math.round(frame.zoom * 100)}%</span></label>
      <div className="flex items-center gap-3 mt-2">
        <ZoomOut size={19} className="shrink-0 text-(--accent)" />
        <input aria-label="Acercar o alejar" type="range" min={1} max={3} step={0.01} value={frame.zoom} disabled={!ready || dragging} onChange={e => setFrame(f => ({ ...f, zoom: Number(e.target.value) }))} className="w-full min-w-0 accent-(--gold)" />
        <ZoomIn size={19} className="shrink-0 text-(--accent)" />
      </div>
      <button type="button" onClick={() => setFrame({ ...defaultFrame })} disabled={dragging} className="mt-3 flex items-center gap-2 text-xs text-(--accent)"><RotateCcw size={15} /> Restablecer encuadre</button>
      {kind === "cover" && <p className="mt-3 text-xs text-(--muted)">Vista de referencia 3:1. La portada se adapta al tamaño de cada pantalla.</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" className="px-4 py-2 rounded-xl border border-(--border)" onClick={onCancel}>Cancelar</button>
        <button type="button" className="academy-button disabled:opacity-50" disabled={!ready || dragging} onClick={() => onApply(normalizeFrame(frame))}>Aplicar</button>
      </div>
    </dialog>
  );
}

export default function CharacterImageEditor({ kind, path, draft, onChange }: {
  kind: Kind; path?: string | null; draft: ImageDraft | null; onChange: (draft: ImageDraft | null) => void;
}) {
  const [editing, setEditing] = useState<{ file: File | null; initial: ImageFrame } | null>(null);
  const [error, setError] = useState("");
  const { url, failed } = useCharacterImageUrl(path);
  const draftUrl = useFileUrl(draft?.file || null);
  const editUrl = useFileUrl(editing?.file || null);
  const preview = draft?.file ? draftUrl : url;
  const currentFrame = draft?.frame || frameFromPath(path);
  const label = kind === "avatar" ? "Retrato del personaje" : "Imagen de portada";
  return (
    <div className="space-y-3">
      <FramedImage url={preview} kind={kind} frame={currentFrame} className={kind === "avatar" ? "w-28 h-28 rounded-full border-2 border-(--gold)" : "w-full aspect-[3/1] rounded-xl"} />
      <label className="block text-sm">
        <span className="flex items-center gap-2"><ImagePlus size={18} />{label}</span>
        <input type="file" accept={imageTypes.join(",")} className="academy-input text-xs" onChange={e => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (!file) return;
          try { validateImage(file); setError(""); setEditing({ file, initial: { ...defaultFrame } }); }
          catch (err) { setError(err instanceof Error ? err.message : "Imagen no válida."); }
        }} />
      </label>
      <div className="flex flex-wrap gap-3 items-center">
        {(draft?.file || path) && <button type="button" disabled={!preview} onClick={() => { setError(""); setEditing({ file: draft?.file || null, initial: currentFrame }); }} className="flex items-center gap-2 text-sm rounded-xl border border-(--border) px-3 py-2 disabled:opacity-50"><Move size={16} /> Ajustar imagen</button>}
        {draft && <button type="button" className="text-xs text-(--accent) underline" onClick={() => { onChange(null); setError(""); }}>Deshacer cambio</button>}
      </div>
      {draft && <p className="text-xs text-(--muted)">Encuadre pendiente de guardar. Pulsa «Guardar cambios» al final del formulario.</p>}
      <p className="text-xs text-(--muted)">JPG, PNG, WebP o GIF · máximo 5 MB.</p>
      {(error || (failed && !draft?.file)) && <p role="alert" className="text-sm text-red-600">{error || "No se pudo cargar la imagen guardada."}</p>}
      {editing && <FrameDialog kind={kind} src={editing.file ? editUrl : url} initial={editing.initial}
        onCancel={() => setEditing(null)} onApply={frame => { onChange({ file: editing.file, frame }); setEditing(null); }} />}
    </div>
  );
}
