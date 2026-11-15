"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import {
  defaultPersonality,
  personalityMoods,
  personalityFields,
  type Personality,
  type PersonalityMood,
} from "@/lib/personality";

import {
  Heart,
  Pencil,
  Save,
  X,
  Flower2,
  LockKeyhole,
  Quote,
} from "lucide-react";

type Props = {
  characterId: string;
  initialPersonality: Personality | null;
  canEdit: boolean;
};

export default function PersonalityWidgets({
  characterId,
  initialPersonality,
  canEdit,
}: Props) {
  const router = useRouter();

  const [saved, setSaved] = useState<Personality>({
    ...defaultPersonality,
    ...initialPersonality,
  });

  const [draft, setDraft] = useState<Personality>({
    ...defaultPersonality,
    ...initialPersonality,
  });

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function change<K extends keyof Personality>(key: K, value: Personality[K]) {
    setDraft((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function beginEdit() {
    setDraft({ ...saved });
    setError("");
    setMessage("");
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...saved });
    setEditing(false);
    setError("");
  }

  async function save() {
    if (!canEdit || busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload: Personality = {
        mood: draft.mood,
        status_text: draft.status_text.trim(),
        likes: draft.likes.trim(),
        dislikes: draft.dislikes.trim(),
        hobbies: draft.hobbies.trim(),
        obsessions: draft.obsessions.trim(),
        favorite_quote: draft.favorite_quote.trim(),
        show_status: draft.show_status,
        show_likes: draft.show_likes,
        show_dislikes: draft.show_dislikes,
        show_hobbies: draft.show_hobbies,
        show_obsessions: draft.show_obsessions,
        show_quote: draft.show_quote,
      };

      const { error } = await createClient()
        .from("character_personality")
        .upsert(
          {
            ...payload,
            character_id: characterId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "character_id" },
        );

      if (error) throw new Error(error.message);

      setSaved(payload);
      setDraft(payload);
      setEditing(false);

      setMessage("Tu pequeño universo ha sido actualizado.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setBusy(false);
    }
  }

  const current = editing ? draft : saved;

  const mood = personalityMoods[current.mood] || personalityMoods.none;

  const hasContent =
    (current.show_status && (current.status_text || current.mood !== "none")) ||
    personalityFields.some(
      (field) => current[field.visible] && current[field.key].trim(),
    ) ||
    (current.show_quote && current.favorite_quote.trim());

  if (!canEdit && !hasContent) return null;

  return (
    <section className="space-y-5">
      <header
        className="flex items-center
        justify-between flex-wrap gap-3"
      >
        <h2 className="text-3xl flex items-center gap-3">
          <Heart size={24} className="text-(--gold)" />
          Mi pequeño universo
        </h2>

        {canEdit && !editing && (
          <button
            onClick={beginEdit}
            className="academy-button flex
              items-center gap-2 text-sm"
          >
            <Pencil size={16} />
            Editar mi universo
          </button>
        )}
      </header>

      {error && (
        <p role="alert" className="bg-(--pink) rounded-xl p-4">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="bg-(--sage) rounded-xl p-4">
          {message}
        </p>
      )}

      {/* EDITOR */}

      {canEdit && editing && (
        <div className="academy-card p-5 space-y-5">
          <div
            className="flex justify-between
            items-center"
          >
            <h3 className="text-2xl">Las cosas que me definen</h3>

            <button
              disabled={busy}
              aria-label="Cerrar editor"
              onClick={cancelEdit}
            >
              <X size={21} />
            </button>
          </div>

          <fieldset disabled={busy} className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg">¿Cómo me siento hoy?</h4>

              <div
                className="grid grid-cols-3
                sm:grid-cols-4 gap-2"
              >
                {Object.entries(personalityMoods).map(([id, item]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={draft.mood === id}
                    className={`botanical-option ${
                      draft.mood === id ? "botanical-selected" : ""
                    }`}
                    onClick={() => change("mood", id as PersonalityMood)}
                  >
                    <span className="text-3xl">{item.symbol}</span>

                    <p className="text-xs mt-2">{item.label}</p>

                    {draft.mood === id && (
                      <p
                        className="text-xs
                          text-(--accent) mt-2"
                      >
                        ✓ Elegido
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              Mi estado actual
              <input
                className="academy-input"
                maxLength={160}
                value={draft.status_text}
                onChange={(e) => change("status_text", e.target.value)}
                placeholder="Hoy las estrellas..."
              />
              <span className="text-xs text-(--muted)">
                {draft.status_text.length}/160
              </span>
            </label>

            <label
              className="flex items-center gap-2
              text-sm"
            >
              <input
                type="checkbox"
                checked={draft.show_status}
                onChange={(e) => change("show_status", e.target.checked)}
              />
              Mostrar estado a los visitantes
            </label>

            {personalityFields.map((field) => (
              <div key={field.key} className="space-y-3">
                <label className="block text-sm">
                  {field.symbol} {field.label}
                  <textarea
                    className="academy-input min-h-24"
                    maxLength={500}
                    value={draft[field.key]}
                    placeholder={field.placeholder}
                    onChange={(e) => change(field.key, e.target.value)}
                  />
                  <span
                    className="text-xs
                    text-(--muted)"
                  >
                    Escribe un elemento por línea.
                  </span>
                </label>

                <label
                  className="flex items-center
                  gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={draft[field.visible]}
                    onChange={(e) => change(field.visible, e.target.checked)}
                  />
                  Mostrar este widget
                </label>
              </div>
            ))}

            <label className="block text-sm">
              Cita del momento
              <textarea
                className="academy-input min-h-24"
                maxLength={300}
                value={draft.favorite_quote}
                onChange={(e) => change("favorite_quote", e.target.value)}
                placeholder="Las flores también guardan secretos..."
              />
            </label>

            <label
              className="flex items-center
              gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={draft.show_quote}
                onChange={(e) => change("show_quote", e.target.checked)}
              />
              Mostrar mi cita
            </label>

            <div
              className="bg-(--surface)
              rounded-xl p-4 flex gap-3"
            >
              <LockKeyhole size={20} className="shrink-0 text-(--gold)" />

              <p className="text-xs">
                Los widgets ocultos solamente podrán ser consultados por ti y
                Rectoría.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-(--surface)
                  rounded-xl px-5 py-3 text-sm
                  border border-(--border)"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={save}
                className="academy-button flex
                  items-center gap-2"
              >
                <Save size={17} />
                {busy ? "Guardando..." : "Guardar mi universo"}
              </button>
            </div>
          </fieldset>
        </div>
      )}

      {editing && (
        <p className="text-xs text-(--muted)">Vista previa de tus widgets</p>
      )}

      {/* ESTADO PERSONAL */}

      {current.show_status &&
        (current.status_text || current.mood !== "none") && (
          <article className="academy-card p-5">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{mood.symbol}</span>

              <div className="min-w-0">
                <p
                  className="text-xs text-(--accent)
                uppercase tracking-widest"
                >
                  Mi estado actual
                </p>

                <h3 className="text-2xl mt-1">{mood.label}</h3>

                <p
                  className="text-sm italic mt-2
                whitespace-pre-wrap wrap-break-word"
                >
                  {current.status_text}
                </p>
              </div>
            </div>
          </article>
        )}

      {/* GUSTOS Y AFICIONES */}

      <div className="grid sm:grid-cols-2 gap-4">
        {personalityFields.map((field) => {
          if (!current[field.visible]) return null;

          const items = current[field.key]
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);

          if (!items.length) return null;

          return (
            <article key={field.key} className="academy-card p-5">
              <h3 className="text-2xl">
                <span className="text-(--gold) mr-2">{field.symbol}</span>
                {field.label}
              </h3>

              <div className="floral-divider my-4">✧</div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <p
                    key={index}
                    className="text-sm flex
                      items-start gap-2 wrap-break-word"
                  >
                    <span className="text-(--gold)">❀</span>
                    <span className="min-w-0">{item}</span>
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* CITA PERSONAL */}

      {current.show_quote && current.favorite_quote.trim() && (
        <blockquote
          className="academy-card
          p-6 text-center"
        >
          <Quote size={28} className="mx-auto text-(--gold)" />

          <p
            className="italic text-lg
            leading-7 mt-4 whitespace-pre-wrap
            wrap-break-word"
          >
            «{current.favorite_quote}»
          </p>
        </blockquote>
      )}

      {!hasContent && canEdit && !editing && (
        <div
          className="academy-card p-7
          text-center"
        >
          <Flower2 size={35} className="mx-auto text-(--gold)" />

          <p
            className="text-sm
            text-(--muted) mt-4"
          >
            Tu pequeño universo aún está por descubrirse.
          </p>
        </div>
      )}
    </section>
  );
}
