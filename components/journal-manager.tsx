"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  journalCategories,
  journalColors,
  type JournalEntry,
  type JournalCategory,
  type JournalColor,
  type JournalCharacter,
  type CampaignSession,
} from "@/lib/journal";

import {
  Feather,
  Star,
  Pencil,
  Trash2,
  LockKeyhole,
  Globe,
  Crown,
  Plus,
} from "lucide-react";

export default function JournalManager({
  entries,
  characters,
  sessions,
  userId,
  isMaster,
  initialCharacterId = "",
}: {
  entries: JournalEntry[];
  characters: JournalCharacter[];
  sessions: CampaignSession[];
  userId: string;
  isMaster: boolean;
  initialCharacterId?: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [characterId, setCharacterId] = useState(initialCharacterId);

  const [sessionId, setSessionId] = useState("");

  const [category, setCategory] = useState<JournalCategory>("note");

  const [color, setColor] = useState<JournalColor>("lavender");

  const [visibility, setVisibility] = useState<JournalEntry["visibility"]>(
    isMaster ? "master" : "private",
  );

  const [editing, setEditing] = useState<string | null>(null);

  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [personFilter, setPersonFilter] = useState(initialCharacterId);

  const [sessionFilter, setSessionFilter] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setTitle("");
    setContent("");
    setCharacterId(initialCharacterId);
    setSessionId("");
    setCategory("note");
    setColor("lavender");
    setVisibility(isMaster ? "master" : "private");
    setEditing(null);
    setOpened(false);
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

    if (!title.trim() || !content.trim()) {
      setError("Completa el título y el contenido.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        title: title.trim(),
        content: content.trim(),
        character_id: characterId || null,
        session_id: sessionId || null,
        category,
        color,
        visibility: isMaster ? visibility : "private",
      };

      const result = editing
        ? await supabase
            .from("journal_entries")
            .update(payload)
            .eq("id", editing)
        : await supabase.from("journal_entries").insert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      reset();
    }, "Recuerdo guardado.");
  }

  function edit(note: JournalEntry) {
    setEditing(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setColor(note.color);
    setVisibility(note.visibility);
    setCharacterId(note.character_id || "");
    setSessionId(note.session_id || "");
    setOpened(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function favorite(note: JournalEntry) {
    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("journal_entries")
        .update({ favorite: !note.favorite })
        .eq("id", note.id);

      if (error) throw new Error(error.message);
    }, "Favoritos actualizados.");
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta anotación?")) {
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
      if (editing === id) reset();
    }, "Anotación eliminada.");
  }

  const visible = entries.filter((note) => {
    const person = characters.find((p) => p.id === note.character_id);

    const searchable = [note.title, note.content, person?.name || ""]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (!personFilter || note.character_id === personFilter) &&
      (!sessionFilter || note.session_id === sessionFilter) &&
      (filter === "all" ||
        (filter === "favorites" &&
          note.favorite &&
          note.author_id === userId) ||
        (filter === "mine" && note.author_id === userId) ||
        (filter === "public" && note.visibility === "public") ||
        (filter === "master" && note.visibility === "master") ||
        note.category === filter)
    );
  });

  return (
    <div className="space-y-6">
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

      <button
        onClick={() => {
          if (opened) reset();
          else setOpened(true);
        }}
        className="flex items-center justify-center
          gap-2 academy-button"
      >
        <Plus size={18} />
        {opened ? "Cerrar formulario" : "Escribir una nota"}
      </button>

      {opened && (
        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <Feather className="text-(--gold)" />
            {editing ? "Editar recuerdo" : "Un nuevo recuerdo"}
          </h2>

          <form onSubmit={save} className="mt-5">
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm">
                Título
                <input
                  required
                  maxLength={150}
                  className="academy-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  Categoría
                  <select
                    className="academy-input"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as JournalCategory)
                    }
                  >
                    {Object.entries(journalCategories).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  Personaje relacionado
                  <select
                    className="academy-input"
                    value={characterId}
                    onChange={(e) => setCharacterId(e.target.value)}
                  >
                    <option value="">Sin personaje</option>
                    {characters.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  Sesión relacionada
                  <select
                    className="academy-input"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                  >
                    <option value="">Sin sesión</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.session_number} · {session.title}
                      </option>
                    ))}
                  </select>
                </label>

                {isMaster && (
                  <label className="block text-sm">
                    Privacidad
                    <select
                      className="academy-input"
                      value={visibility}
                      onChange={(e) =>
                        setVisibility(
                          e.target.value as JournalEntry["visibility"],
                        )
                      }
                    >
                      <option value="master">Exclusivo de Rectoría</option>
                      <option value="private">Privado</option>
                      <option value="public">Público</option>
                    </select>
                  </label>
                )}
              </div>

              <label className="block text-sm">
                Contenido
                <textarea
                  required
                  maxLength={20000}
                  className="academy-input min-h-48 resize-y"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Querido diario..."
                />
              </label>

              <p className="text-sm">Color de la anotación</p>

              <div className="flex gap-3 flex-wrap">
                {Object.entries(journalColors).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Color ${key}`}
                    aria-pressed={color === key}
                    onClick={() => setColor(key as JournalColor)}
                    className={`w-10 h-10 rounded-full
                        border-2 ${
                          color === key
                            ? "border-(--gold)"
                            : "border-(--border)"
                        }`}
                    style={{ background: value }}
                  />
                ))}
              </div>

              <p className="text-xs text-(--muted)">
                {isMaster && visibility === "public"
                  ? "Esta nota será visible para la academia cuando sus referencias sean públicas."
                  : "Esta anotación no será visible para otros jugadores."}
              </p>

              <button className="academy-button" type="submit">
                {busy ? "Guardando..." : "Guardar recuerdo"}
              </button>
            </fieldset>
          </form>
        </section>
      )}

      <section className="academy-card p-5 space-y-4">
        <input
          className="academy-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar entre mis recuerdos..."
        />

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Todas"],
            ["mine", "Mis notas"],
            ["diary", "Diario"],
            ["investigation", "Investigaciones"],
            ["session", "Sesiones"],
            ["event", "Acontecimientos"],
            ["task", "Pendientes"],
            ["favorites", "Favoritos"],
            ["public", "Públicas"],
            ...(isMaster ? [["master", "Rectoría"]] : []),
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-xl text-xs ${
                filter === value ? "bg-(--lavender)" : "bg-(--surface)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <select
            className="academy-input"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="">Todos los personajes</option>
            {characters.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>

          <select
            className="academy-input"
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="">Todas las sesiones</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                Sesión {session.session_number}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div
        className="grid md:grid-cols-2 xl:grid-cols-3
        gap-5 items-start"
      >
        {visible.map((note) => {
          const canEdit =
            isMaster ||
            (note.author_id === userId && note.visibility === "private");

          const person = characters.find((p) => p.id === note.character_id);

          const session = sessions.find((s) => s.id === note.session_id);

          return (
            <article
              key={note.id}
              className="rounded-2xl border
                border-(--border) p-5"
              style={{
                background: journalColors[note.color],
              }}
            >
              <div className="flex items-center gap-3">
                <Feather size={21} className="text-(--accent)" />

                <span className="flex-1 text-xs">
                  {journalCategories[note.category]}
                </span>

                {note.author_id === userId && canEdit && (
                  <button
                    title="Marcar favorito"
                    disabled={busy}
                    onClick={() => favorite(note)}
                  >
                    <Star
                      size={19}
                      className="text-(--gold)"
                      fill={note.favorite ? "currentColor" : "none"}
                    />
                  </button>
                )}
              </div>

              <h2
                className="text-3xl mt-4
                wrap-break-word"
              >
                {note.title}
              </h2>

              <div className="floral-divider my-4">✧</div>

              <p
                className="text-sm leading-7
                whitespace-pre-wrap wrap-break-word"
              >
                {note.content}
              </p>

              {person && (
                <p className="text-xs mt-4">Personaje: {person.name}</p>
              )}

              {session && (
                <p className="text-xs mt-2">
                  Sesión {session.session_number} · {session.title}
                </p>
              )}

              <p className="text-xs text-(--muted) mt-4">
                {new Date(note.created_at).toLocaleDateString("es-CO", {
                  timeZone: "America/Bogota",
                })}
              </p>

              <div
                className="flex items-center gap-3 mt-5
                border-t border-(--border) pt-4"
              >
                {note.visibility === "public" ? (
                  <Globe size={15} />
                ) : note.visibility === "master" ? (
                  <Crown size={15} />
                ) : (
                  <LockKeyhole size={15} />
                )}

                <span className="flex-1 text-xs">
                  {note.visibility === "public"
                    ? "Público"
                    : note.visibility === "master"
                      ? "Rectoría"
                      : "Privado"}
                </span>

                {canEdit && (
                  <>
                    <button
                      title="Editar"
                      disabled={busy}
                      onClick={() => edit(note)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      title="Eliminar"
                      disabled={busy}
                      onClick={() => remove(note.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!visible.length && (
        <div className="academy-card p-10 text-center">
          <Feather size={36} className="mx-auto text-(--gold)" />
          <p className="mt-4 text-sm text-(--muted)">
            No hay recuerdos en esta categoría.
          </p>
        </div>
      )}
    </div>
  );
}
