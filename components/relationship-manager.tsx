"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import RelationshipList from "@/components/relationship-list";

import {
  relationshipTypes,
  type Relationship,
  type RelationshipType,
  type RelationshipCharacter,
  type RelationshipAccess,
  type RelationshipMember,
} from "@/lib/relationships";

import { Heart, LockKeyhole, Pencil, Trash2 } from "lucide-react";

export default function RelationshipManager({
  relationships,
  characters,
  permissions,
  members,
}: {
  relationships: Relationship[];
  characters: RelationshipCharacter[];
  permissions: RelationshipAccess[];
  members: RelationshipMember[];
}) {
  const router = useRouter();

  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState<RelationshipType>("friendship");

  const [visibility, setVisibility] = useState<"public" | "secret">("public");

  const [editing, setEditing] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setA("");
    setB("");
    setTitle("");
    setDescription("");
    setType("friendship");
    setVisibility("public");
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

    if (!a || !b || a === b || !title.trim()) {
      setError("Selecciona dos personajes diferentes y un título.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        character_a_id: a,
        character_b_id: b,
        title: title.trim(),
        description: description.trim(),
        relationship_type: type,
        visibility,
      };

      const result = editing
        ? await supabase
            .from("character_relationships")
            .update(payload)
            .eq("id", editing)
        : await supabase.from("character_relationships").insert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      reset();
    }, "Relación guardada correctamente.");
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta relación?")) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("character_relationships")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);

      if (editing === id) reset();
    }, "Relación eliminada.");
  }

  async function grantAccess(id: string) {
    const recipient = recipients[id];
    if (!recipient) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.from("relationship_access").insert({
        relationship_id: id,
        user_id: recipient,
      });

      if (error) throw new Error(error.message);

      setRecipients((old) => ({
        ...old,
        [id]: "",
      }));
    }, "Acceso concedido.");
  }

  async function revokeAccess(id: string, userId: string) {
    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("relationship_access")
        .delete()
        .eq("relationship_id", id)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    }, "Acceso revocado.");
  }

  function edit(relation: Relationship) {
    setEditing(relation.id);
    setA(relation.character_a_id);
    setB(relation.character_b_id);
    setTitle(relation.title);
    setDescription(relation.description);
    setType(relation.relationship_type);
    setVisibility(relation.visibility);

    document
      .getElementById("relationship-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  const visible = relationships.filter((relation) => {
    const names = characters
      .filter(
        (p) =>
          p.id === relation.character_a_id || p.id === relation.character_b_id,
      )
      .map((p) => p.name)
      .join(" ");

    const text = `${relation.title} ${names}`.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (filter === "all" || filter === relation.visibility)
    );
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Relaciones", relationships.length],
          [
            "Públicas",
            relationships.filter((r) => r.visibility === "public").length,
          ],
          [
            "Secretas",
            relationships.filter((r) => r.visibility === "secret").length,
          ],
        ].map(([label, value]) => (
          <article key={label} className="bg-(--lavender) rounded-2xl p-4">
            <h2 className="text-4xl">{value}</h2>
            <p className="text-xs mt-2">{label}</p>
          </article>
        ))}
      </div>

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

      <section id="relationship-form" className="academy-card p-6 scroll-mt-24">
        <h2 className="text-3xl flex items-center gap-2">
          <Heart className="text-(--gold)" />

          {editing ? "Editar relación" : "Crear una relación"}
        </h2>

        <form onSubmit={save} className="mt-6">
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block text-sm">
                Primer personaje
                <select
                  required
                  className="academy-input"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {characters
                    .filter((p) => p.id !== b)
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block text-sm">
                Segundo personaje
                <select
                  required
                  className="academy-input"
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                >
                  <option value="">Seleccionar...</option>

                  {characters
                    .filter((p) => p.id !== a)
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              Nombre de la relación
              <input
                required
                className="academy-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Una promesa en secreto"
              />
            </label>

            <label className="block text-sm">
              Tipo de vínculo
              <select
                className="academy-input"
                value={type}
                onChange={(e) => setType(e.target.value as RelationshipType)}
              >
                {Object.entries(relationshipTypes).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Visibilidad
              <select
                className="academy-input"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "public" | "secret")
                }
              >
                <option value="public">Pública</option>
                <option value="secret">Secreta</option>
              </select>
            </label>

            <label className="block text-sm">
              Historia de la relación
              <textarea
                className="academy-input min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <p className="text-xs text-(--muted)">
              {visibility === "public"
                ? "Todos los jugadores podrán consultar esta relación."
                : "Solo Rectoría y las cuentas autorizadas podrán leerla."}
            </p>

            <button type="submit" className="academy-button">
              {busy
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear vínculo"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={reset}
                className="w-full text-sm text-(--accent)"
              >
                Cancelar edición
              </button>
            )}
          </fieldset>
        </form>
      </section>

      <section className="academy-card p-5">
        <input
          className="academy-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por personaje o relación..."
        />

        <div className="flex flex-wrap gap-2 mt-4">
          {[
            ["all", "Todas"],
            ["public", "Públicas"],
            ["secret", "Secretas"],
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
      </section>

      {visible.map((relation) => {
        const grants = permissions.filter(
          (p) => p.relationship_id === relation.id,
        );

        const available = members.filter(
          (member) => !grants.some((grant) => grant.user_id === member.id),
        );

        return (
          <section key={relation.id} className="academy-card p-5 space-y-4">
            <RelationshipList
              relationships={[relation]}
              characters={characters}
            />

            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => edit(relation)}
                className="flex-1 flex justify-center
                  items-center gap-2 bg-(--lavender)
                  rounded-xl p-3 text-sm"
              >
                <Pencil size={16} />
                Editar
              </button>

              <button
                disabled={busy}
                onClick={() => remove(relation.id)}
                className="flex-1 flex justify-center
                  items-center gap-2 bg-(--pink)
                  rounded-xl p-3 text-sm"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>

            {relation.visibility === "secret" && (
              <div className="bg-(--surface) p-4 rounded-xl">
                <h3 className="text-xl flex items-center gap-2">
                  <LockKeyhole size={19} />
                  Cuentas autorizadas
                </h3>

                <p className="text-xs text-(--muted) mt-2">
                  Rectoría siempre tiene acceso.
                </p>

                {grants.map((grant) => (
                  <div
                    key={grant.user_id}
                    className="flex items-center justify-between
                      gap-3 py-3 border-b border-(--border)"
                  >
                    <span className="text-sm">
                      {members.find((m) => m.id === grant.user_id)?.username ||
                        "Cuenta autorizada"}
                    </span>

                    <button
                      disabled={busy}
                      onClick={() => revokeAccess(relation.id, grant.user_id)}
                      className="text-xs text-(--accent)"
                    >
                      Revocar
                    </button>
                  </div>
                ))}

                <select
                  className="academy-input"
                  value={recipients[relation.id] || ""}
                  onChange={(e) =>
                    setRecipients((old) => ({
                      ...old,
                      [relation.id]: e.target.value,
                    }))
                  }
                >
                  <option value="">Autorizar jugador...</option>

                  {available.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
                </select>

                <button
                  disabled={busy || !recipients[relation.id]}
                  onClick={() => grantAccess(relation.id)}
                  className="academy-button mt-3"
                >
                  Revelar relación
                </button>
              </div>
            )}
          </section>
        );
      })}

      {!visible.length && (
        <p className="text-center p-8 text-(--muted)">
          No hay relaciones en esta categoría.
        </p>
      )}
    </div>
  );
}
