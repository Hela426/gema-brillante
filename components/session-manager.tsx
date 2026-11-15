"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CampaignSession } from "@/lib/journal";

import { CalendarDays, Pencil, Trash2, BookOpen } from "lucide-react";

export default function SessionManager({
  sessions,
}: {
  sessions: CampaignSession[];
}) {
  const router = useRouter();

  const nextNumber = Math.max(0, ...sessions.map((s) => s.session_number)) + 1;

  const [number, setNumber] = useState(nextNumber);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [published, setPublished] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset(newNumber = nextNumber) {
    setNumber(newNumber);
    setTitle("");
    setDate("");
    setSummary("");
    setPublished(false);
    setEditing(null);
  }

  async function execute(action: () => Promise<void>, success: string) {
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

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !date) {
      setError("Completa el título y la fecha.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        session_number: number,
        title: title.trim(),
        session_date: date,
        summary: summary.trim(),
        published,
      };

      const result = editing
        ? await supabase
            .from("campaign_sessions")
            .update(payload)
            .eq("id", editing)
        : await supabase.from("campaign_sessions").insert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      reset(Math.max(nextNumber, number + 1));
    }, "Sesión guardada correctamente.");
  }

  function edit(session: CampaignSession) {
    setEditing(session.id);
    setNumber(session.session_number);
    setTitle(session.title);
    setDate(session.session_date);
    setSummary(session.summary);
    setPublished(session.published);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublish(session: CampaignSession) {
    await execute(
      async () => {
        const supabase = createClient();

        const { error } = await supabase
          .from("campaign_sessions")
          .update({ published: !session.published })
          .eq("id", session.id);

        if (error) throw new Error(error.message);
      },
      session.published
        ? "Sesión convertida en borrador."
        : "Sesión publicada.",
    );
  }

  async function remove(id: string) {
    if (
      !window.confirm(
        "¿Eliminar sesión? Las notas vinculadas perderán su referencia a esta sesión.",
      )
    )
      return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("campaign_sessions")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);

      if (editing === id) reset();
    }, "Sesión eliminada.");
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="bg-(--pink) p-4 rounded-xl">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="bg-(--sage) p-4 rounded-xl">
          {message}
        </p>
      )}

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-3">
          <BookOpen className="text-(--gold)" />
          {editing ? "Editar capítulo" : "Crear un capítulo"}
        </h2>

        <form onSubmit={save} className="mt-6">
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block text-sm">
                Número de sesión
                <input
                  type="number"
                  min={1}
                  required
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                  className="academy-input"
                />
              </label>

              <label className="block text-sm">
                Fecha
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="academy-input"
                />
              </label>
            </div>

            <label className="block text-sm">
              Título del capítulo
              <input
                required
                className="academy-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              Resumen
              <textarea
                className="academy-input min-h-40"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publicar en la cronología de la academia
            </label>

            <p className="text-xs text-(--muted)">
              No incluyas información secreta en un resumen que vayas a
              publicar.
            </p>

            <button type="submit" className="academy-button">
              {busy ? "Guardando..." : "Guardar capítulo"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => reset()}
                className="w-full text-sm text-(--accent)"
              >
                Cancelar edición
              </button>
            )}
          </fieldset>
        </form>
      </section>

      {sessions.map((session) => (
        <article key={session.id} className="academy-card p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-(--gold)" />

            <span className="flex-1 text-xs text-(--accent)">
              Sesión {session.session_number}
            </span>

            <span
              className={`text-xs px-3 py-2 rounded-full ${
                session.published ? "bg-(--sage)" : "bg-(--ivory)"
              }`}
            >
              {session.published ? "Publicada" : "Borrador"}
            </span>
          </div>

          <h2 className="text-3xl mt-4">{session.title}</h2>

          <p className="text-xs text-(--muted) mt-2">
            {session.session_date.split("-").reverse().join("/")}
          </p>

          <p
            className="text-sm leading-7 mt-4
            whitespace-pre-wrap wrap-break-word"
          >
            {session.summary || "Sin resumen."}
          </p>

          <div className="flex flex-wrap gap-4 mt-5">
            <button
              disabled={busy}
              className="bg-(--lavender) px-4 py-2
                rounded-xl text-sm"
              onClick={() => togglePublish(session)}
            >
              {session.published ? "Volver a borrador" : "Publicar capítulo"}
            </button>

            <button
              disabled={busy}
              onClick={() => edit(session)}
              className="flex items-center gap-2 text-sm"
            >
              <Pencil size={16} />
              Editar
            </button>

            <button
              disabled={busy}
              onClick={() => remove(session.id)}
              className="flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
