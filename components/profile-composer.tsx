"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CharacterImage from "@/components/character-image";
import { Send } from "lucide-react";

export default function ProfileComposer({ characterId, name, avatar }: {
  characterId: string; name: string; avatar: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (busy || !text || text.length > 8000) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Inicia sesión nuevamente.");
      const { error: insertError } = await supabase.from("social_posts").insert({
        author_id: user.id,
        character_id: characterId,
        content: text,
      });
      if (insertError) throw new Error(insertError.message);
      setContent("");
      setMessage("Publicación compartida.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={publish} className="academy-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <CharacterImage path={avatar} className="w-11 h-11 rounded-full shrink-0 object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-medium wrap-break-word">{name}</p>
          <p className="text-xs text-(--muted)">Publicar como {name}</p>
        </div>
      </div>
      <textarea aria-label="Escribir publicación" className="academy-input min-h-24 w-full resize-y" placeholder="¿Qué estás pensando?" maxLength={8000} value={content} disabled={busy} onChange={event => { setContent(event.target.value); setMessage(""); }} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-(--muted)">{content.length}/8000</span>
        <button type="submit" disabled={busy || !content.trim()} className="academy-button flex items-center gap-2 disabled:opacity-50">
          <Send size={16} /> {busy ? "Publicando..." : "Publicar"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm bg-(--pink) rounded-lg p-3">{error}</p>}
      {message && <p role="status" className="text-sm text-(--muted)">{message}</p>}
    </form>
  );
}
