"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRound, Flower2 } from "lucide-react";

export default function CharacterImage({
  path,
  kind = "avatar",
  className = "",
}: {
  path?: string | null;
  kind?: "avatar" | "cover";
  className?: string;
}) {
  const [image, setImage] = useState<{
    path: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!path) return;

    let active = true;

    async function loadImage() {
      const supabase = createClient();

      const { data } = await supabase.storage
        .from("character-images")
        .createSignedUrl(path!, 3600);

      if (active && data?.signedUrl) {
        setImage({
          path: path!,
          url: data.signedUrl,
        });
      }
    }

    void loadImage();

    return () => {
      active = false;
    };
  }, [path]);

  const url = image?.path === path ? image?.url : null;

  return (
    <div
      className={`overflow-hidden bg-(--lavender)
        flex items-center justify-center ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt={
            kind === "avatar"
              ? "Retrato del personaje"
              : "Portada del personaje"
          }
          className="w-full h-full object-cover"
        />
      ) : kind === "avatar" ? (
        <UserRound size={42} strokeWidth={1.2} className="text-(--accent)" />
      ) : (
        <Flower2 size={60} strokeWidth={0.8} className="text-(--gold)" />
      )}
    </div>
  );
}
