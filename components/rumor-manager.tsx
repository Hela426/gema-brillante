"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import {
  rumorCategories,
  rumorLifecycle,
  rumorTruth,
  rumorStatus,
  type AcademyRumor,
  type RumorCategory,
  type RumorCharacter,
  type RumorWallet,
} from "@/lib/rumors";

import { socialDate } from "@/lib/social";

import {
  Newspaper,
  Feather,
  Gem,
  Crown,
  LockKeyhole,
  Megaphone,
  Pin,
  Search,
  X,
  TrendingDown,
} from "lucide-react";

export default function RumorManager({
  rumors,
  characters,
  wallets,
  userId,
  isMaster,
}: {
  rumors: AcademyRumor[];
  characters: RumorCharacter[];
  wallets: RumorWallet[];
  userId: string;
  isMaster: boolean;
}) {
  const router = useRouter();

  const identities = characters.filter(
    (p) => isMaster || p.owner_id === userId,
  );

  const defaultIdentity = isMaster ? "rectoria" : identities[0]?.id || "";

  const [tab, setTab] = useState("gazette");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [writing, setWriting] = useState(false);
  const [identity, setIdentity] = useState(defaultIdentity);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [category, setCategory] = useState<RumorCategory>("rumor");

  const [anonymous, setAnonymous] = useState(true);

  const [usingToken, setUsingToken] = useState<string | null>(null);

  const [recipientWallet, setRecipientWallet] = useState("");

  const [reason, setReason] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const published = rumors.filter((r) => r.status === "published");

  const active = published.filter(
    (r) => r.category !== "news" && !["spent", "expired"].includes(r.lifecycle),
  );

  const pending = rumors.filter((r) => r.status === "pending");

  const tokenCount = published.filter((r) => r.has_token).length;

  const visible = rumors.filter((r) => {
    const person = characters.find((p) => p.id === r.subject_character_id);

    const text = [r.title, r.content, person?.name || ""]
      .join(" ")
      .toLowerCase();

    if (!text.includes(search.toLowerCase())) return false;

    if (filter !== "all" && r.category !== filter) {
      return false;
    }

    if (tab === "gazette") {
      return (
        r.status === "published" && !["spent", "expired"].includes(r.lifecycle)
      );
    }

    if (tab === "mine") return r.is_author;

    if (tab === "history") {
      return (
        r.status === "archived" ||
        (r.status === "published" && ["spent", "expired"].includes(r.lifecycle))
      );
    }

    return (
      tab === "master" &&
      isMaster &&
      ["pending", "published", "rejected", "archived"].includes(r.status)
    );
  });

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

  function resetForm() {
    setTitle("");
    setContent("");
    setSubject("");
    setCategory("rumor");
    setAnonymous(true);
    setWriting(false);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!identity || !title.trim() || !content.trim()) {
      setError("Completa el autor, titular y contenido.");
      return;
    }

    await execute(
      async () => {
        const supabase = createClient();

        const { error } = await supabase.rpc("submit_academy_rumor", {
          p_character: identity === "rectoria" ? null : identity,
          p_subject: subject || null,
          p_title: title.trim(),
          p_content: content.trim(),
          p_category: category,
          p_anonymous: anonymous,
        });

        if (error) throw new Error(error.message);

        resetForm();
        setTab(isMaster ? "gazette" : "mine");
      },
      isMaster
        ? "Noticia publicada en la gaceta."
        : "Propuesta enviada a Rectoría.",
    );
  }

  async function act(id: string, action: string, success: string, note = "") {
    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.rpc("academy_rumor_action", {
        p_id: id,
        p_action: action,
        p_note: note,
      });

      if (error) throw new Error(error.message);
    }, success);
  }

  async function reject(id: string) {
    const note = window.prompt(
      "Motivo del rechazo (visible para el autor):",
      "",
    );

    if (note === null) return;

    await act(id, "reject", "Rumor rechazado.", note);
  }

  async function spread(id: string) {
    if (!window.confirm("¿Propagar este rumor? Solo puede propagarse una vez."))
      return;

    await act(id, "spread", "El rumor ahora tiene una ficha de resolución.");
  }

  async function applyRumorToken(id: string) {
    if (!reason.trim()) {
      setError("Describe el efecto narrativo.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.rpc("use_rumor_token", {
        p_rumor: id,
        p_wallet: recipientWallet || null,
        p_reason: reason.trim(),
      });

      if (error) throw new Error(error.message);

      setUsingToken(null);
      setRecipientWallet("");
      setReason("");
    }, "Efecto narrativo registrado.");
  }

  const tabs = [
    ["gazette", "La Gaceta"],
    ["mine", "Mis propuestas"],
    ["history", "Archivo histórico"],
    ...(isMaster ? [["master", "Rectoría"]] : []),
  ];

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Rumores activos", active.length, "var(--lavender)"],
          ["Fichas de rumores", tokenCount, "var(--pink)"],
          [
            "Mis propuestas",
            rumors.filter((r) => r.is_author).length,
            "var(--sage)",
          ],
          [
            isMaster ? "Pendientes" : "Noticias",
            isMaster
              ? pending.length
              : published.filter((r) => r.category === "news").length,
            "var(--ivory)",
          ],
        ].map(([label, value, color]) => (
          <article
            key={label}
            className="rounded-2xl p-5"
            style={{ background: String(color) }}
          >
            <h2 className="text-4xl">{value}</h2>
            <p className="text-xs mt-2">{label}</p>
          </article>
        ))}
      </div>

      <button
        disabled={busy}
        onClick={() => setWriting(!writing)}
        className="academy-button flex
          items-center justify-center gap-2"
      >
        <Feather size={19} />
        {writing ? "Cerrar editor" : "Escribir un rumor"}
      </button>

      {writing && (
        <section className="academy-card p-6">
          <h2 className="text-3xl">Un nuevo susurro</h2>

          <form onSubmit={submit} className="mt-5">
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm">
                Autor
                <select
                  required
                  className="academy-input"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                >
                  <option value="">Seleccionar personaje</option>

                  {isMaster && (
                    <option value="rectoria">Rectoría de Gema Brillante</option>
                  )}

                  {identities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Personaje relacionado (opcional)
                <select
                  value={subject}
                  className="academy-input"
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">Ninguno</option>

                  {characters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Categoría
                <select
                  value={category}
                  className="academy-input"
                  onChange={(e) => setCategory(e.target.value as RumorCategory)}
                >
                  <option value="rumor">Rumor</option>
                  <option value="scandal">Escándalo</option>

                  {isMaster && <option value="news">Noticia</option>}
                </select>
              </label>

              <label className="block text-sm">
                Titular
                <input
                  required
                  maxLength={150}
                  value={title}
                  className="academy-input"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lo que nadie se atreve a decir..."
                />
              </label>

              <label className="block text-sm">
                Contenido
                <textarea
                  required
                  maxLength={12000}
                  value={content}
                  className="academy-input min-h-40 resize-y"
                  onChange={(e) => setContent(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                <LockKeyhole size={17} />
                Publicar de forma anónima
              </label>

              <p className="text-xs text-(--muted)">
                Rectoría podrá conocer el autor de cualquier rumor. Las
                propuestas de jugadores requieren aprobación antes de
                publicarse.
              </p>

              <button type="submit" className="academy-button">
                {busy
                  ? "Procesando..."
                  : isMaster
                    ? "Publicar en la gaceta"
                    : "Enviar propuesta"}
              </button>
            </fieldset>
          </form>
        </section>
      )}

      <section className="academy-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-3 text-xs ${
                tab === id ? "bg-(--lavender)" : "bg-(--surface)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Search size={20} className="text-(--accent)" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="academy-input flex-1 min-w-0"
            placeholder="Buscar entre los susurros..."
          />

          <select
            className="academy-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las categorías</option>

            {Object.entries(rumorCategories).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isMaster && tab === "master" && (
        <section className="academy-card p-5 space-y-4">
          <h2 className="text-3xl flex items-center gap-3">
            <Crown className="text-(--gold)" />
            Control de la fase
          </h2>

          <p className="text-sm">
            Finaliza la fase cuando todos los participantes hayan completado sus
            turnos de creación y propagación.
          </p>

          <Link
            href="/ciclos"
            className="academy-button flex
              items-center justify-center gap-2"
          >
            <TrendingDown size={18} />
            Gestionar fase desde el controlador
          </Link>

          <div
            className="flex flex-wrap gap-4 text-sm
            text-(--accent)"
          >
            <Link href="/tesoreria">Abrir tesorería</Link>

            <Link href="/master/personajes">Administrar reputaciones</Link>
          </div>
        </section>
      )}

      <div className="space-y-5">
        {visible.map((rumor) => {
          const person = characters.find(
            (p) => p.id === rumor.subject_character_id,
          );

          const color =
            rumor.category === "scandal"
              ? "var(--pink)"
              : rumor.category === "news"
                ? "var(--sage)"
                : "var(--lavender)";

          return (
            <article
              key={rumor.id}
              className="academy-card p-5 md:p-8 space-y-4"
            >
              {rumor.pinned && (
                <p
                  className="text-xs text-(--gold)
                  flex items-center gap-2"
                >
                  <Pin size={15} />
                  Destacado por Rectoría
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  style={{ background: color }}
                  className="rounded-full px-3 py-2"
                >
                  {rumorCategories[rumor.category]}
                </span>

                <span
                  className="rounded-full
                  bg-(--surface) px-3 py-2"
                >
                  {rumorTruth[rumor.truth_status]}
                </span>

                {rumor.category !== "news" && (
                  <span
                    className="rounded-full
                    bg-(--ivory) px-3 py-2"
                  >
                    {rumorLifecycle[rumor.lifecycle]}
                  </span>
                )}

                {(isMaster || rumor.status !== "published") && (
                  <span
                    className="rounded-full
                      bg-(--surface) px-3 py-2"
                  >
                    {rumorStatus[rumor.status]}
                  </span>
                )}
              </div>

              <h2
                className="text-4xl font-semibold
                wrap-break-word"
              >
                {rumor.title}
              </h2>

              <div className="floral-divider">❦</div>

              <p
                className="text-base leading-8
                whitespace-pre-wrap wrap-break-word"
              >
                {rumor.content}
              </p>

              <p className="text-sm italic text-(--accent)">
                —{" "}
                {rumor.anonymous && !isMaster && tab !== "mine"
                  ? "Una orquídea anónima"
                  : rumor.author_name}
                {rumor.anonymous && (isMaster || tab === "mine")
                  ? " (Anónimo)"
                  : ""}
              </p>

              <p className="text-xs text-(--muted)">
                {socialDate(rumor.published_at || rumor.created_at)}
              </p>

              {person && (
                <Link
                  href={`/personajes/${person.id}`}
                  className="text-xs text-(--accent)
                    hover:underline"
                >
                  Personaje relacionado: {person.name}
                </Link>
              )}

              {rumor.status === "rejected" && rumor.moderation_note && (
                <p
                  className="bg-(--pink) p-3
                    rounded-xl text-sm"
                >
                  Rectoría: {rumor.moderation_note}
                </p>
              )}

              {rumor.has_token && (
                <div
                  className="flex items-center gap-3
                  bg-(--lavender) p-4 rounded-xl"
                >
                  <Gem size={25} className="text-(--accent)" />

                  <div className="flex-1">
                    <p className="text-sm">
                      Una ficha de resolución disponible
                    </p>

                    <p className="text-xs text-(--muted)">
                      Pertenece al rumor, no a su autor.
                    </p>
                  </div>
                </div>
              )}

              {rumor.status === "published" &&
                rumor.category !== "news" &&
                ["fresh", "fading"].includes(rumor.lifecycle) && (
                  <button
                    disabled={busy}
                    className="academy-button flex
                      items-center justify-center gap-2"
                    onClick={() => spread(rumor.id)}
                  >
                    <Megaphone size={18} />
                    Propagar rumor
                  </button>
                )}

              {isMaster && rumor.has_token && (
                <button
                  disabled={busy}
                  className="academy-button"
                  onClick={() => {
                    setUsingToken(rumor.id);
                    setRecipientWallet("");
                    setReason("");
                  }}
                >
                  Utilizar ficha del rumor
                </button>
              )}

              {isMaster && usingToken === rumor.id && (
                <div
                  className="bg-(--surface)
                  rounded-xl p-4 space-y-4"
                >
                  <h3 className="text-2xl">Efecto narrativo</h3>

                  <label className="block text-sm">
                    Destino de la ficha
                    <select
                      className="academy-input"
                      value={recipientWallet}
                      onChange={(e) => setRecipientWallet(e.target.value)}
                    >
                      <option value="">Descartar ficha</option>

                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          Transferir a {w.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <textarea
                    className="academy-input min-h-24"
                    value={reason}
                    maxLength={2000}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="¿Cómo cambió la historia?"
                  />

                  <div className="flex gap-3">
                    <button
                      disabled={busy}
                      className="academy-button"
                      onClick={() => applyRumorToken(rumor.id)}
                    >
                      Confirmar utilización
                    </button>

                    <button disabled={busy} onClick={() => setUsingToken(null)}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}

              {isMaster && (
                <div
                  className="border-t border-(--border)
                  pt-4 space-y-3"
                >
                  <h3 className="text-sm flex items-center gap-2">
                    <Crown size={16} />
                    Acciones de Rectoría
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {rumor.status === "pending" && (
                      <>
                        <button
                          disabled={busy}
                          className="bg-(--sage) rounded-xl
                            px-4 py-2 text-xs"
                          onClick={() =>
                            act(rumor.id, "approve", "Rumor aprobado.")
                          }
                        >
                          Aprobar
                        </button>

                        <button
                          disabled={busy}
                          className="bg-(--pink) rounded-xl
                            px-4 py-2 text-xs"
                          onClick={() => reject(rumor.id)}
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {["published", "archived"].includes(rumor.status) && (
                      <>
                        <button
                          disabled={busy}
                          className="bg-(--sage) rounded-xl
                            px-4 py-2 text-xs"
                          onClick={() =>
                            act(rumor.id, "confirm", "Rumor confirmado.")
                          }
                        >
                          Confirmar
                        </button>

                        <button
                          disabled={busy}
                          className="bg-(--pink) rounded-xl
                            px-4 py-2 text-xs"
                          onClick={() =>
                            act(rumor.id, "deny", "Rumor desmentido.")
                          }
                        >
                          Desmentir
                        </button>
                      </>
                    )}

                    {rumor.status === "published" && (
                      <>
                        <button
                          disabled={busy}
                          className="bg-(--ivory) rounded-xl
                            px-4 py-2 text-xs"
                          onClick={() =>
                            act(rumor.id, "pin", "Destacado actualizado.")
                          }
                        >
                          {rumor.pinned ? "Desfijar" : "Destacar"}
                        </button>

                        {!rumor.has_token && (
                          <button
                            disabled={busy}
                            className="bg-(--surface)
                              rounded-xl px-4 py-2 text-xs"
                            onClick={() =>
                              act(rumor.id, "archive", "Rumor archivado.")
                            }
                          >
                            Archivar
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {person && (
                    <Link
                      href="/master/personajes"
                      className="text-xs text-(--accent)"
                    >
                      Gestionar consecuencias de reputación
                    </Link>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!visible.length && (
        <div className="academy-card p-10 text-center">
          <Newspaper
            size={40}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <p className="text-sm mt-4 text-(--muted)">
            Por ahora, la sociedad guarda silencio.
          </p>
        </div>
      )}
    </div>
  );
}
