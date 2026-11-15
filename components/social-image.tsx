"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageOff } from "lucide-react";

export default function SocialImage({ path }: { path: string }) {
  const [result, setResult] = useState<{
    path: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("social-images")
        .createSignedUrl(path, 3600);

      if (!active) return;

      setResult({
        path,
        url: error ? null : data?.signedUrl || null,
      });
    }

    load();

    const timer = window.setInterval(load, 50 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [path]);

  if (!result || result.path !== path) {
    return (
      <div
        className="h-48 rounded-2xl
        bg-(--lavender) animate-pulse"
      />
    );
  }

  if (!result.url) {
    return (
      <div
        className="bg-(--surface) rounded-xl
        p-8 text-center text-(--muted)"
      >
        <ImageOff className="mx-auto mb-3" />
        <p className="text-xs">Imagen no disponible.</p>
      </div>
    );
  }

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.url}
        alt="Fotografía de la publicación"
        loading="lazy"
        className="w-full max-h-/[650px]
          object-contain rounded-2xl
          bg-(--surface)"
      />
    </a>
  );
}
