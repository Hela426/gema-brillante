"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CharacterImage from "@/components/character-image";
import type { Character } from "@/lib/characters";
import { Check, X, Crown, Plus } from "lucide-react";

export default function MasterCharacters({
  initialCharacters,
  initialFilter = "all",
}: {
  initialCharacters: Character[];
  initialFilter?: string;
}) {
  const [characters, setCharacters] = useState(initialCharacters);

  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [tag, setTag] = useState("");
  const [tagType, setTagType] = useState<
    "positive_reputation" | "negative_reputation"
  >("positive_reputation");

  const [selected, setSelected] = useState("");

  async function updateCharacter(id: string, changes: Partial<Character>) {
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("characters")
        .update(changes)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      setCharacters((previous) =>
        previous.map((person) =>
          person.id === id ? (data as Character) : person,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function addTag(person: Character) {
    if (!tag.trim()) return;

    await updateCharacter(person.id, {
      [tagType]: [...person[tagType], tag.trim()],
    });

    setTag("");
  }

  const visible = characters.filter((person) => {
    const matchesSearch = person.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "main" && person.character_type === "main") ||
      (filter === "npc" && person.character_type === "npc") ||
      (filter === "pending" && person.status === "pending");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="academy-card p-5">
        <input
          className="academy-input"
          placeholder="Buscar personaje..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mt-4">
          {[
            ["all", "Todos"],
            ["main", "Principales"],
            ["npc", "NPC"],
            ["pending", "Pendientes"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm ${
                filter === value ? "bg-(--lavender)" : "bg-(--surface)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="bg-(--pink) p-4 rounded-xl">
          {error}
        </p>
      )}

      {visible.map((person) => (
        <article key={person.id} className="academy-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <CharacterImage
              path={person.avatar_url}
              className="w-20 h-20 rounded-full"
            />

            <div className="flex-1">
              <h2 className="text-3xl">{person.name}</h2>

              <p className="text-sm text-(--muted)">
                {person.character_type === "main"
                  ? "Personaje principal"
                  : "NPC"}
                {" · "}
                {person.status === "approved"
                  ? "Aprobado"
                  : person.status === "pending"
                    ? "Pendiente"
                    : "Rechazado"}
              </p>
            </div>
          </div>

          {person.character_type === "npc" && (
            <div className="flex flex-wrap gap-3 mt-5">
              {person.status !== "approved" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    updateCharacter(person.id, {
                      status: "approved",
                    })
                  }
                  className="bg-(--sage) px-4 py-3
                    rounded-xl flex items-center gap-2 text-sm"
                >
                  <Check size={17} />
                  Aprobar
                </button>
              )}

              {person.status !== "rejected" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    updateCharacter(person.id, {
                      status: "rejected",
                    })
                  }
                  className="bg-(--pink) px-4 py-3
                    rounded-xl flex items-center gap-2 text-sm"
                >
                  <X size={17} />
                  Rechazar
                </button>
              )}
            </div>
          )}

          <div
            className="flex flex-wrap gap-3 mt-5 text-sm
            text-(--accent)"
          >
            <Link href={`/personajes/${person.id}`}>Ver perfil</Link>

            <Link href={`/personajes/${person.id}/editar`}>Editar ficha</Link>

            <Link href={`/personajes/${person.id}/secretos`}>
              Archivos privados
            </Link>
          </div>

          <div className="floral-divider my-5">✧</div>

          <h3 className="text-2xl flex items-center gap-2">
            <Crown size={20} className="text-(--gold)" />
            Reputación
          </h3>

          {(["positive_reputation", "negative_reputation"] as const).map(
            (type) => (
              <div key={type} className="flex flex-wrap gap-2 mt-3">
                {person[type].map((value, index) => (
                  <button
                    key={`${value}-${index}`}
                    disabled={busy}
                    title="Eliminar etiqueta"
                    onClick={() =>
                      updateCharacter(person.id, {
                        [type]: person[type].filter((_, i) => i !== index),
                      })
                    }
                    className={`flex items-center gap-2
                      rounded-full px-3 py-2 text-xs ${
                        type === "positive_reputation"
                          ? "bg-(--sage)"
                          : "bg-(--pink)"
                      }`}
                  >
                    {value}
                    <X size={12} />
                  </button>
                ))}
              </div>
            ),
          )}

          {selected === person.id ? (
            <div className="mt-4 space-y-3">
              <select
                className="academy-input"
                value={tagType}
                onChange={(e) => setTagType(e.target.value as typeof tagType)}
              >
                <option value="positive_reputation">Reputación positiva</option>
                <option value="negative_reputation">Reputación negativa</option>
              </select>

              <input
                className="academy-input"
                placeholder="Nueva etiqueta..."
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />

              <button
                disabled={busy || !tag.trim()}
                className="academy-button"
                onClick={() => addTag(person)}
              >
                Agregar reputación
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-2 mt-4
                text-sm text-(--accent)"
              onClick={() => {
                setSelected(person.id);
                setTag("");
              }}
            >
              <Plus size={16} />
              Agregar etiqueta
            </button>
          )}
        </article>
      ))}

      {!visible.length && (
        <p className="text-center p-8 text-(--muted)">
          No hay personajes en esta categoría.
        </p>
      )}
    </div>
  );
}
