"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Feather, Pencil, Trash2, Eye, X } from "lucide-react";

type Secret = {
  id: string;
  character_id: string;
  title: string;
  content: string;
  category: string;
};

type Recipient = {
  owner_id: string;
  name: string;
};

type Permission = {
  secret_id: string;
  user_id: string;
};

const categories: Record<string, string> = {
  secret: "Secreto personal",
  desire: "Deseo oculto",
  backstory: "Historia privada",
  inner_conflict: "Conflicto interno",
  note: "Diario o nota personal",
};

export default function SecretManager({
  characterId,
  ownerId,
  currentUserId,
  secrets,
  recipients,
  permissions,
}: {
  characterId: string;
  ownerId: string;
  currentUserId: string;
  secrets: Secret[];
  recipients: Recipient[];
  permissions: Permission[];
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("secret");

  const [editing, setEditing] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function execute(action: () => Promise<void>) {
    setBusy(true);
    setError("");

    try {
      await action();
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la operación.",
      );
      setBusy(false);
    }
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategory("secret");
  }

  async function saveSecret(e: FormEvent<HTMLFormElement>) {
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
        category,
      };

      const result = editing
        ? await supabase
            .from("character_secrets")
            .update(payload)
            .eq("id", editing)
        : await supabase.from("character_secrets").insert({
            ...payload,
            character_id: characterId,
          });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });
  }

  async function deleteSecret(id: string) {
    if (!window.confirm("¿Eliminar este secreto?")) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("character_secrets")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    });
  }

  async function shareSecret(secretId: string) {
    if (!recipient) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.from("secret_access").insert({
        secret_id: secretId,
        user_id: recipient,
        granted_by: currentUserId,
      });

      if (error) throw new Error(error.message);
    });
  }

  async function revokeAccess(secretId: string, userId: string) {
    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("secret_access")
        .delete()
        .eq("secret_id", secretId)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="bg-(--pink) p-4 rounded-xl">
          {error}
        </p>
      )}

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-2">
          <Feather size={24} className="text-(--gold)" />
          {editing ? "Editar archivo" : "Escribir un nuevo archivo"}
        </h2>

        <form onSubmit={saveSecret} className="space-y-5 mt-6">
          <fieldset disabled={busy} className="space-y-5">
            <label className="block text-sm">
              Categoría
              <select
                className="academy-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(categories).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Título
              <input
                required
                className="academy-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              Contenido privado
              <textarea
                required
                className="academy-input min-h-40 resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </label>

            <p className="text-xs italic text-(--muted)">
              Por defecto, solo el propietario y Rectoría pueden consultar esta
              información.
            </p>

            <button type="submit" className="academy-button">
              {busy ? "Guardando..." : "Guardar archivo privado"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full text-sm text-(--accent)"
              >
                Cancelar edición
              </button>
            )}
          </fieldset>
        </form>
      </section>

      {secrets.map((secret) => {
        const grants = permissions.filter((p) => p.secret_id === secret.id);

        const available = recipients.filter(
          (r) =>
            r.owner_id !== ownerId &&
            !grants.some((p) => p.user_id === r.owner_id),
        );

        return (
          <article key={secret.id} className="academy-card p-6">
            <div className="flex items-start gap-3">
              <LockKeyhole size={25} className="text-(--gold)" />

              <div className="flex-1">
                <p className="text-xs text-(--accent)">
                  {categories[secret.category]}
                </p>

                <h3 className="text-3xl mt-1">{secret.title}</h3>
              </div>

              <button
                disabled={busy}
                title="Editar"
                onClick={() => {
                  setEditing(secret.id);
                  setTitle(secret.title);
                  setContent(secret.content);
                  setCategory(secret.category);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Pencil size={18} />
              </button>

              <button
                disabled={busy}
                title="Eliminar"
                onClick={() => deleteSecret(secret.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <p
              className="text-sm leading-7 mt-5
              whitespace-pre-wrap wrap-break-word"
            >
              {secret.content}
            </p>

            <div className="floral-divider my-6">✧</div>

            <h4 className="text-xl flex items-center gap-2">
              <Eye size={18} />
              Personas autorizadas
            </h4>

            <div className="text-xs text-(--muted) mt-3">
              Propietario y Rectoría
            </div>

            {grants.map((grant) => (
              <div
                key={grant.user_id}
                className="flex items-center justify-between
                  bg-(--surface) rounded-xl p-3 mt-3"
              >
                <span className="text-sm">
                  {recipients.find((r) => r.owner_id === grant.user_id)?.name ||
                    "Cuenta autorizada"}
                </span>

                <button
                  disabled={busy}
                  title="Revocar acceso"
                  onClick={() => revokeAccess(secret.id, grant.user_id)}
                >
                  <X size={17} />
                </button>
              </div>
            ))}

            {selected === secret.id ? (
              <div className="mt-4 space-y-3">
                <select
                  className="academy-input"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                >
                  <option value="">Selecciona un personaje</option>

                  {available.map((person) => (
                    <option key={person.owner_id} value={person.owner_id}>
                      {person.name}
                    </option>
                  ))}
                </select>

                <button
                  disabled={busy || !recipient}
                  className="academy-button"
                  onClick={() => shareSecret(secret.id)}
                >
                  Revelar secreto
                </button>
              </div>
            ) : (
              <button
                disabled={busy}
                className="academy-button mt-5"
                onClick={() => {
                  setSelected(secret.id);
                  setRecipient("");
                }}
              >
                Compartir secreto
              </button>
            )}
          </article>
        );
      })}

      {!secrets.length && (
        <div className="academy-card p-8 text-center">
          <LockKeyhole size={32} className="mx-auto text-(--gold)" />

          <p className="text-sm mt-4">Todavía no hay archivos privados.</p>
        </div>
      )}
    </div>
  );
}
