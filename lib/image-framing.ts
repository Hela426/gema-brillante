import type { CSSProperties } from "react";

export type ImageFrame = { x: number; y: number; zoom: number };
export type ImageDraft = { file: File | null; frame: ImageFrame };
export const defaultFrame: ImageFrame = { x: 50, y: 50, zoom: 1 };
export const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const maxImageBytes = 5 * 1024 * 1024;
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function normalizeFrame(frame: ImageFrame): ImageFrame {
  return {
    x: Math.round(clamp(Number.isFinite(frame.x) ? frame.x : 50, 0, 100) * 100) / 100,
    y: Math.round(clamp(Number.isFinite(frame.y) ? frame.y : 50, 0, 100) * 100) / 100,
    zoom: Math.round(clamp(Number.isFinite(frame.zoom) ? frame.zoom : 1, 1, 3) * 100) / 100,
  };
}

// El encuadre forma parte del nombre real del objeto, no de una URL con parámetros.
// Así los consumidores que solo reciben avatar_url/cover_url no necesitan otra consulta.
export function frameFromPath(path?: string | null): ImageFrame {
  const match = path?.match(/-f(\d{1,5})-(\d{1,5})-(\d{1,3})\.(?:jpg|jpeg|png|webp|gif)$/i);
  return match ? normalizeFrame({ x: Number(match[1]) / 100, y: Number(match[2]) / 100, zoom: Number(match[3]) / 100 }) : { ...defaultFrame };
}

export function frameSuffix(frame: ImageFrame): string {
  const f = normalizeFrame(frame);
  return `-f${Math.round(f.x * 100)}-${Math.round(f.y * 100)}-${Math.round(f.zoom * 100)}`;
}

export function framingStyle(frame: ImageFrame): CSSProperties {
  const f = normalizeFrame(frame);
  const pos = `${f.x}% ${f.y}%`;
  return { objectFit: "cover", objectPosition: pos, transform: `scale(${f.zoom})`, transformOrigin: pos };
}

export function validateImage(file: Blob) {
  if (!imageTypes.includes(file.type)) throw new Error("Solo puedes subir imágenes JPG, PNG, WebP o GIF.");
  if (file.size > maxImageBytes) throw new Error("La imagen no puede superar los 5 MB.");
  if (!file.size) throw new Error("La imagen está vacía.");
}

export function imageExtension(type: string) {
  return type === "image/gif" ? "gif" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export function imageTypeFromPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext === "gif" ? "image/gif" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
}
