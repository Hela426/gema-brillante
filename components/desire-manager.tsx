"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import type {
  DesireCard,
  DesireAssignment,
  ResourceCharacter,
} from "@/lib/resources";

import { Flower2, LockKeyhole, Sparkles, Gem } from "lucide-react";

export default function DesireManager({
  cards,
  assignments,
  characters,
  isMaster,
}: {
  cards: DesireCard[];
  assignments: DesireAssignment[];
  characters: ResourceCharacter[];
  isMaster: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [description, setDescription] = useState("");
  const [resolution, setResolution] = useState(2);

  const [editing, setEditing] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<Record<string, string>>({});

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function resetForm() {
    setTitle("");
    setQuote("");
    setDescription("");
    setResolution(2);
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
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Completa el título y el deseo.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        title: title.trim(),
        quote: quote.trim(),
        description: description.trim(),
        starting_resolution: resolution,
      };

      const result = editing
        ? await supabase.from("desire_cards").update(payload).eq("id", editing)
        : await supabase.from("desire_cards").insert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      resetForm();
    }, "Carta guardada correctamente.");
  }

  async function assignCard(cardId: string) {
    const characterId = recipients[cardId];
    if (!characterId) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.from("desire_assignments").upsert({
        card_id: cardId,
        character_id: characterId,
        assigned_at: new Date().toISOString(),
      });

      if (error) throw new Error(error.message);
    }, "Deseo asignado correctamente.");
  }

  async function removeAssignment(cardId: string) {
    if (!window.confirm("¿Retirar este deseo del personaje?")) {
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("desire_assignments")
        .delete()
        .eq("card_id", cardId);

      if (error) throw new Error(error.message);
    }, "Deseo retirado.");
  }

  async function deleteCard(cardId: string) {
    if (!window.confirm("¿Eliminar esta carta definitivamente?")) {
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("desire_cards")
        .delete()
        .eq("id", cardId);

      if (error) throw new Error(error.message);
    }, "Carta eliminada.");
  }

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

      {isMaster && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Cartas creadas", cards.length],
              ["Asignadas", assignments.length],
              ["Disponibles", cards.length - assignments.length],
            ].map(([label, value]) => (
              <article key={label} className="bg-(--lavender) rounded-2xl p-4">
                <h2 className="text-4xl">{value}</h2>
                <p className="text-xs mt-2">{label}</p>
              </article>
            ))}
          </div>

          <section className="academy-card p-6">
            <h2 className="text-3xl">
              {editing ? "Editar deseo" : "Crear carta de deseo"}
            </h2>

            <form onSubmit={saveCard} className="mt-5">
              <fieldset disabled={busy} className="space-y-4">
                <label className="block text-sm">
                  Título de la carta
                  <input
                    required
                    className="academy-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>

                <label className="block text-sm">
                  Frase representativa
                  <input
                    className="academy-input"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                  />
                </label>

                <label className="block text-sm">
                  Deseo secreto
                  <textarea
                    required
                    className="academy-input min-h-32"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>

                <label className="block text-sm">
                  Resolución inicial indicada en la carta
                  <input
                    type="number"
                    min={0}
                    required
                    value={resolution}
                    onChange={(e) => setResolution(Number(e.target.value))}
                    className="academy-input"
                  />
                </label>

                <button type="submit" className="academy-button">
                  {editing ? "Guardar cambios" : "Crear deseo"}
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
        </>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => {
          const assignment = assignments.find((a) => a.card_id === card.id);

          const owner = characters.find(
            (person) => person.id === assignment?.character_id,
          );

          const opened = isMaster || revealed[card.id];

          return (
            <article key={card.id} className="academy-card p-4">
              <div
                className="border border-(--gold)
                rounded-xl p-5 bg-(--ivory) text-center"
              >
                <Flower2
                  size={44}
                  strokeWidth={1}
                  className="mx-auto text-(--gold)"
                />

                <p
                  className="text-[10px] tracking-widest
                  uppercase mt-4 text-(--accent)"
                >
                  Gema Brillante
                </p>

                <div className="floral-divider my-4">✧</div>

                <h2 className="text-3xl">
                  {opened ? card.title : "Un deseo del corazón"}
                </h2>

                {opened && (
                  <>
                    {card.quote && (
                      <p
                        className="italic text-sm
                        text-(--accent) leading-6 mt-4"
                      >
                        «{card.quote}»
                      </p>
                    )}

                    <div className="floral-divider my-5">❀</div>

                    <p
                      className="text-sm leading-7
                      whitespace-pre-wrap"
                    >
                      {card.description}
                    </p>

                    <div
                      className="flex justify-center
                      items-center gap-2 mt-5 text-sm"
                    >
                      <Gem size={18} />
                      Resolución inicial: {card.starting_resolution}
                    </div>
                  </>
                )}

                {!isMaster && (
                  <button
                    onClick={() =>
                      setRevealed((old) => ({
                        ...old,
                        [card.id]: !old[card.id],
                      }))
                    }
                    className="academy-button mt-5"
                  >
                    {opened ? "Cerrar carta" : "Revelar mi deseo"}
                  </button>
                )}

                <LockKeyhole size={16} className="mx-auto text-(--gold) mt-5" />
              </div>

              <p className="text-sm text-center mt-4">
                {owner ? `En posesión de ${owner.name}` : "Sin asignar"}
              </p>

              {isMaster && (
                <fieldset disabled={busy} className="mt-4 space-y-3">
                  <select
                    className="academy-input"
                    value={recipients[card.id] || ""}
                    onChange={(e) =>
                      setRecipients((old) => ({
                        ...old,
                        [card.id]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Asignar a...</option>
                    {characters.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!recipients[card.id]}
                    onClick={() => assignCard(card.id)}
                    className="academy-button"
                  >
                    {assignment ? "Reasignar" : "Asignar deseo"}
                  </button>

                  {assignment && (
                    <button
                      onClick={() => removeAssignment(card.id)}
                      className="academy-button"
                    >
                      Retirar deseo
                    </button>
                  )}

                  <div
                    className="flex justify-between
                    text-xs text-(--accent) py-2"
                  >
                    <button
                      onClick={() => {
                        setEditing(card.id);
                        setTitle(card.title);
                        setQuote(card.quote || "");
                        setDescription(card.description);
                        setResolution(card.starting_resolution);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Editar
                    </button>

                    <button onClick={() => deleteCard(card.id)}>
                      Eliminar
                    </button>
                  </div>
                </fieldset>
              )}
            </article>
          );
        })}
      </div>

      {!cards.length && (
        <div className="academy-card text-center p-10">
          <Sparkles size={36} className="mx-auto text-(--gold)" />
          <p className="mt-5">Todavía no hay deseos que revelar.</p>
        </div>
      )}
    </div>
  );
}
