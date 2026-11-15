"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRound, Flower2 } from "lucide-react";
import { frameFromPath, framingStyle, type ImageFrame } from "@/lib/image-framing";

export function useCharacterImageUrl(path?: string | null) {
  const [image, setImage] = useState<{ path: string; url: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    async function loadImage() {
      try {
        const { data, error } = await createClient().storage.from("character-images").createSignedUrl(path!, 3600);
        if (!active) return;
        if (error || !data?.signedUrl) { setFailed(path!); return; }
        setImage({ path: path!, url: data.signedUrl });
        setFailed(null);
      } catch { if (active) setFailed(path!); }
    }
    void loadImage();
    const timer = window.setInterval(loadImage, 50 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [path]);
  return { url: image?.path === path ? image?.url || null : null, failed: !!path && failed === path };
}

export function FramedImage({ url, kind = "avatar", className = "", frame }: {
  url?: string | null; kind?: "avatar" | "cover"; className?: string; frame: ImageFrame;
}) {
  return (
    <div className={`overflow-hidden bg-(--lavender) flex items-center justify-center ${className}`}>
      {url ? <img src={url} alt={kind === "avatar" ? "Retrato del personaje" : "Portada del personaje"}
        className="w-full h-full" style={framingStyle(frame)} draggable={false} />
        : kind === "avatar" ? <UserRound size={42} strokeWidth={1.2} className="text-(--accent)" />
        : <Flower2 size={60} strokeWidth={0.8} className="text-(--gold)" />}
    </div>
  );
}

export default function CharacterImage({ path, kind = "avatar", className = "" }: {
  path?: string | null; kind?: "avatar" | "cover"; className?: string;
}) {
  const { url } = useCharacterImageUrl(path);
  return <FramedImage url={url} kind={kind} className={className} frame={frameFromPath(path)} />;
}
