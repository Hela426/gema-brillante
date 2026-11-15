"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageOff } from "lucide-react";

export default function GalleryImage({
  path,
  alt,
  className = "",
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [result, setResult] = useState<{
    path: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await createClient()
        .storage.from("gallery-images")
        .createSignedUrl(path, 300);

      if (!active) return;

      setResult({
        path,
        url: error ? null : data.signedUrl,
      });
    }

    void load();

    const timer = window.setInterval(load, 240000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [path]);

  if (!result || result.path !== path) {
    return (
      <div
        className={`bg-(--lavender)
          animate-pulse ${className}`}
      />
    );
  }

  if (!result.url) {
    return (
      <div
        className={`bg-(--surface)
          flex items-center justify-center ${className}`}
      >
        <ImageOff size={30} className="text-(--muted)" />
      </div>
    );
  }

  return (
    <img src={result.url} alt={alt} loading="lazy" className={className} />
  );
}
