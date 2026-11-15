"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  letterPapers,
  letterSeals,
  letterInk,
  type LetterPhase,
  type AcademyLetter,
  type LetterCharacter,
  type LetterPaper,
  type LetterSeal,
} from "@/lib/letters";

import { socialDate } from "@/lib/social";

import {
  Mail,
  MailOpen,
  Send,
  Feather,
  Star,
  Crown,
  LockKeyhole,
  Trash2,
  Reply,
  X,
  Search,
  MessagesSquare,
  Hourglass,
} from "lucide-react";

export default function LetterManager({
  letters,
  characters,
  userId,
  isMaster,
  phase,
}: {
  letters: AcademyLetter[];
  characters: LetterCharacter[];
  userId: string;
  isMaster: boolean;
  phase: LetterPhase | null;
}) {
  const router = useRouter();

  const identities = characters.filter(
    (person) => isMaster || person.owner_id === userId,
  );

  const defaultSender = isMaster ? "rectoria" : identities[0]?.id || "";

  const [tab, setTab] = useState("inbox");
  const [search, setSearch] = useState("");

  const [writing, setWriting] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);

  const [sender, setSender] = useState(defaultSender);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [anonymous, setAnonymous] = useState(false);

  const [paper, setPaper] = useState<LetterPaper>("ivory");

  const [seal, setSeal] = useState<LetterSeal>("orchid");

  const [kind, setKind] = useState<"personal" | "epistolary">("personal");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AcademyLetter | null>(null);
  const available = !!phase?.active && (isMaster || phase.used < 2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const unread = letters.filter(
    (letter) =>
      letter.is_recipient && letter.status === "sent" && !letter.read_at,
  ).length;

  const tabs = [
    {
      id: "inbox",
      label: "Recibidas",
      icon: Mail,
      count: unread,
    },
    {
      id: "sent",
      label: "Enviadas",
      icon: Send,
      count: null,
    },
    {
      id: "drafts",
      label: "Borradores",
      icon: Feather,
      count: null,
    },
    {
      id: "favorites",
      label: "Favoritas",
      icon: Star,
      count: null,
    },
    { id: "threads", label: "Conversaciones", icon: MessagesSquare, count: null },
    ...(isMaster
      ? [
          {
            id: "master",
            label: "Archivos de Rectoría",
            icon: Crown,
            count: null,
          },
        ]
      : []),
  ];

  const visible = letters.filter((letter) => {
    const matches =
      `${letter.subject} ${letter.sender_name} ${letter.recipient_name}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!matches) return false;

    if (tab === "inbox") {
      return letter.is_recipient && letter.status === "sent";
    }

    if (tab === "sent") {
      return letter.is_sender && letter.status === "sent";
    }

    if (tab === "drafts") {
      return letter.is_sender && letter.status === "draft";
    }

    if (tab === "favorites") {
      return letter.favorite;
    }

    if (tab === "threads") return letter.status === "sent" && (letter.is_sender || letter.is_recipient);
    return tab === "master" && isMaster;
  });

  const opened = letters.find((letter) => letter.id === selected);
  const threadKey = (l: AcademyLetter) => l.thread_id || l.id;
  const conversation = opened && opened.status === "sent" && !opened.anonymous
    ? letters.filter(l => l.status === "sent" && !l.anonymous && threadKey(l) === threadKey(opened) && (isMaster || l.is_sender || l.is_recipient))
      .sort((a,b) => (a.sent_at || a.created_at).localeCompare(b.sent_at || b.created_at)) : [];
  const seenThreads = new Set<string>();
  const threadCards = tab === "threads" ? visible.filter(l => {
    const key = threadKey(l);
    if (seenThreads.has(key)) return false;
    seenThreads.add(key);
    return true;
  }) : visible;

  async function execute(action: () => Promise<void>, success = "") {
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

  function reset() {
    setEditing(null);
    setSender(defaultSender);
    setRecipient("");
    setSubject("");
    setContent("");
    setAnonymous(false);
    setPaper("ivory");
    setSeal("orchid");
    setWriting(false);
    setKind("personal");
    setReplyTo(null);
    setConfirmSend(false);
  }

  function newLetter() {
    reset();
    setSelected(null);
    setWriting(true);
  }

  async function save(send: boolean, confirmed = false) {
    if (!recipient || !sender) {
      setError("Selecciona un remitente y un destinatario.");
      return;
    }

    if (send && (!subject.trim() || !content.trim())) {
      setError("Completa el asunto y la carta.");
      return;
    }

    if (send && kind === "epistolary" && !available) {
      setError("No tienes una fase epistolar activa o ya utilizaste las dos cartas."); return;
    }
    if (send && !confirmed) { setConfirmSend(true); return; }
    setConfirmSend(false);

    await execute(
      async () => {
        const supabase = createClient();

        const { error } = await supabase.rpc("save_academy_letter_v2", {
          p_id: editing,
          p_sender: sender === "rectoria" ? null : sender,
          p_recipient: recipient,
          p_subject: subject.trim(),
          p_content: content.trim(),
          p_anonymous: anonymous,
          p_paper: paper,
          p_seal: seal,
          p_send: send,
          p_kind: kind,
          p_reply_to: anonymous ? null : replyTo,
        });

        if (error) throw new Error(error.message);

        reset();
        setTab(send ? "sent" : "drafts");
      },
      send ? "La carta ha sido enviada." : "Borrador guardado.",
    );
  }

  function editDraft(letter: AcademyLetter) {
    setEditing(letter.id);
    setSender(letter.sender_character_id || defaultSender);
    setRecipient(letter.recipient_character_id);
    setSubject(letter.subject);
    setContent(letter.content);
    setAnonymous(letter.anonymous);
    setPaper(letter.paper);
    setSeal(letter.seal);
    setKind(letter.letter_kind || "personal");
    setReplyTo(letter.reply_to || null);
    setConfirmSend(false);
    setSelected(null);
    setWriting(true);
  }

  async function action(
    id: string,
    type: "read" | "favorite" | "delete_draft",
  ) {
    const supabase = createClient();

    const { error } = await supabase.rpc("academy_letter_action", {
      p_id: id,
      p_action: type,
    });

    if (error) throw new Error(error.message);
  }

  async function openLetter(letter: AcademyLetter) {
    setWriting(false);
    setSelected(letter.id);

    if (letter.is_recipient && !letter.read_at) {
      await execute(() => action(letter.id, "read"));
    }
  }

  async function favorite(letter: AcademyLetter) {
    await execute(
      () => action(letter.id, "favorite"),
      "Favoritos actualizados.",
    );
  }

  async function deleteDraft(letter: AcademyLetter) {
    setConfirmDelete(null);

    await execute(async () => {
      await action(letter.id, "delete_draft");
      setSelected(null);
      if (editing === letter.id) reset();
    }, "Borrador eliminado.");
  }

  function reply(letter: AcademyLetter) {
    if (!letter.sender_character_id) return;

    reset();

    setSender(letter.recipient_character_id);
    setRecipient(letter.sender_character_id);
    setSubject((/^Re: /i.test(letter.subject) ? letter.subject : "Re: " + letter.subject).slice(0, 150));
    setReplyTo(letter.id);
    setKind(letter.letter_kind === "epistolary" && available ? "epistolary" : "personal");

    setSelected(null);
    setWriting(true);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void save(true);
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

      <section className="academy-card p-5 flex flex-wrap items-center gap-4">
        <Hourglass size={28} className="text-(--gold)" />
        <div className="flex-1 min-w-0"><h2 className="text-2xl">Fase epistolar</h2>
          <p className="text-sm text-(--muted)">{phase?.active ? `Ciclo ${phase.cycle} · Fase ${phase.phase}` : "No hay una fase epistolar activa."}</p>
          <p className="text-xs mt-2">La correspondencia personal no consume turnos de juego.</p></div>
        {phase?.active && <div className="text-center"><p className="text-3xl">{isMaster ? "∞" : `${Math.max(0, 2-phase.used)}/2`}</p><p className="text-xs">{isMaster ? "Rectoría" : "cartas disponibles"}</p></div>}
      </section>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            title: "Sin leer",
            value: unread,
            color: "var(--lavender)",
          },
          {
            title: "Enviadas",
            value: letters.filter((l) => l.is_sender && l.status === "sent")
              .length,
            color: "var(--pink)",
          },
          {
            title: "Borradores",
            value: letters.filter((l) => l.is_sender && l.status === "draft")
              .length,
            color: "var(--sage)",
          },
        ].map((stat) => (
          <article
            key={stat.title}
            className="rounded-2xl p-5"
            style={{ background: stat.color }}
          >
            <h2 className="text-4xl">{stat.value}</h2>
            <p className="text-xs mt-2">{stat.title}</p>
          </article>
        ))}
      </div>

      <button
        onClick={newLetter}
        disabled={busy}
        className="academy-button flex
          items-center justify-center gap-3"
      >
        <Feather size={20} />
        Escribir una carta
      </button>

      {writing && (
        <section className="academy-card p-5 md:p-7">
          <div className="flex items-center gap-3">
            <Feather className="text-(--gold)" />

            <h2 className="text-3xl flex-1">
              {editing ? "Editar borrador" : "Una nueva misiva"}
            </h2>

            <button disabled={busy} onClick={reset} aria-label="Cerrar editor">
              <X size={21} />
            </button>
          </div>

          <form onSubmit={submit} className="mt-6">
            <fieldset disabled={busy} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  Remitente
                  <select
                    required
                    value={sender}
                    className="academy-input"
                    onChange={(e) => {setSender(e.target.value); setReplyTo(null); setConfirmSend(false);}}
                  >
                    <option value="">Elegir personaje...</option>

                    {isMaster && (
                      <option value="rectoria">
                        Rectoría de Gema Brillante
                      </option>
                    )}

                    {identities.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  Destinatario
                  <select
                    required
                    value={recipient}
                    className="academy-input"
                    onChange={(e) => {setRecipient(e.target.value); setReplyTo(null); setConfirmSend(false);}}
                  >
                    <option value="">Elegir destinatario...</option>

                    {characters.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => {setAnonymous(e.target.checked); if(e.target.checked) setReplyTo(null); setConfirmSend(false);}}
                />
                <LockKeyhole size={16} />
                Enviar como remitente anónimo
              </label>

              <label className="block text-sm">Tipo de correspondencia
                <select className="academy-input" value={kind} onChange={e => { setKind(e.target.value as "personal" | "epistolary"); setConfirmSend(false); }}>
                  <option value="personal">Personal · sin consumir turno</option>
                  <option value="epistolary">De juego · fase epistolar</option>
                </select>
              </label>
              {kind === "epistolary" && <p className="text-xs text-(--muted)">{available ? "Al enviar, se registrará una carta de esta fase." : "Puedes guardar un borrador, pero no enviarlo hasta disponer de un turno."}</p>}
              {replyTo && <p className="text-xs text-(--accent)">Respuesta vinculada a la conversación. Si cambias las identidades o activas el anonimato, se desvinculará.</p>}
              <p className="text-sm">Papel de la carta · {letterPapers[paper].label}</p>

              <div className="flex flex-wrap gap-3">
                {Object.entries(letterPapers).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    aria-pressed={paper === key}
                    onClick={() => setPaper(key as LetterPaper)}
                    className={`letter-swatch w-14 h-14 rounded-lg
                        border-2 ${
                          paper === key
                            ? "border-(--gold)"
                            : "border-(--border)"
                        }`}
                    style={{ background: item.color, color: letterInk(key as LetterPaper) }}
                  >{paper === key ? "✓" : "❀"}</button>
                ))}
              </div>

              <p className="text-sm">Sello de cera · {letterSeals[seal].label}</p>

              <div className="flex flex-wrap gap-3">
                {Object.entries(letterSeals).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    aria-pressed={seal === key}
                    onClick={() => setSeal(key as LetterSeal)}
                    className={`letter-seal ${
                      seal === key ? "ring-2 ring-(--gold) ring-offset-2" : ""
                    }`}
                    style={{ background: item.color }}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>

              <div
                className="letter-paper letter-decorated space-y-5"
                data-paper={paper}
                style={{
                  backgroundColor: letterPapers[paper].color,
                  color: letterInk(paper),
                }}
              >
                <div
                  className="text-center text-[#B49B6C]
                  text-3xl"
                >
                  {letterSeals[seal].symbol}
                </div>

                <input
                  required
                  maxLength={150}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto de la carta"
                  className="w-full bg-transparent
                    border-b border-[#C6AF83]
                    text-2xl pb-3 outline-none"
                />

                <textarea
                  required
                  maxLength={20000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Mi estimado..."
                  className="w-full bg-transparent
                    min-h-64 resize-y outline-none
                    leading-8 italic text-base"
                />

                <div className="text-right text-[#927BA8]">────── ✧ ──────</div>
              </div>

              <div className="letter-envelope letter-decorated letter-preview" data-paper={paper} style={{backgroundColor:letterPapers[paper].color,color:letterInk(paper)}}>
                <div className="letter-seal" style={{background:letterSeals[seal].color}}>{letterSeals[seal].symbol}</div>
                <p className="text-sm">Para: {characters.find(c=>c.id===recipient)?.name || "Destinatario"}</p>
                <p className="text-xs">De: {anonymous ? "Remitente anónimo" : sender === "rectoria" ? "Rectoría" : identities.find(c=>c.id===sender)?.name || "Remitente"}</p>
              </div>
              <p className="text-xs text-(--muted)">
                Las cartas privadas pueden ser supervisadas por Rectoría. Una
                carta enviada no podrá modificarse.
              </p>

              {confirmSend && <div className="rounded-xl border border-(--gold) p-4 space-y-3">
                <p className="text-sm">¿Enviar esta carta? No podrás modificarla después.</p>
                <div className="flex gap-2"><button type="button" className="academy-button" onClick={()=>setConfirmSend(false)}>Cancelar</button><button type="button" className="academy-button" onClick={()=>void save(true,true)}>Confirmar envío</button></div>
              </div>}
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => save(false)}
                  className="rounded-xl
                    bg-(--surface) border border-(--border)
                    p-3 text-sm"
                >
                  Guardar borrador
                </button>

                <button
                  type="submit"
                  disabled={confirmSend || (kind === "epistolary" && !available)}
                  className="academy-button flex
                    items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {busy ? "Procesando..." : "Enviar carta"}
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      <section className="academy-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSelected(null);
              }}
              className={`flex items-center gap-2
                rounded-xl px-4 py-3 text-xs ${
                  tab === item.id ? "bg-(--lavender)" : "bg-(--surface)"
                }`}
            >
              <item.icon size={17} />
              {item.label}

              {item.count !== null && item.count > 0 && (
                <span
                  className="rounded-full
                  bg-(--pink) px-2 py-1"
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Search size={20} className="text-(--accent)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar correspondencia..."
            className="academy-input"
          />
        </div>
      </section>

      {opened && (
        <section className="academy-card p-5 space-y-5">
          <div className="flex items-center gap-3">
            <MailOpen className="text-(--gold)" />

            <h2 className="text-2xl flex-1">Correspondencia privada</h2>

            <button
              disabled={busy}
              onClick={() => favorite(opened)}
              aria-label="Marcar favorita"
              aria-pressed={opened.favorite}
            >
              <Star
                size={22}
                className="text-(--gold)"
                fill={opened.favorite ? "currentColor" : "none"}
              />
            </button>

            <button onClick={() => setSelected(null)} aria-label="Cerrar carta">
              <X size={22} />
            </button>
          </div>

          <article
            className="letter-paper letter-decorated"
            data-paper={opened.paper}
            style={{
              backgroundColor: letterPapers[opened.paper].color,
              color: letterInk(opened.paper),
            }}
          >
            <div className="text-center">
              <p
                className="text-[10px]
                tracking-[0.25em] text-[#A18BAE]"
              >
                ACADEMIA GEMA BRILLANTE
              </p>

              <p
                className="text-3xl
                text-[#B49B6C] mt-5"
              >
                {letterSeals[opened.seal].symbol}
              </p>

              <h2
                className="text-4xl
                mt-4 wrap-break-word"
              >
                {opened.subject || "Sin asunto"}
              </h2>

              <div className="text-[#B49B6C] my-5">────── ✧ ──────</div>
            </div>

            <p className="text-xs">Para: {opened.recipient_name}</p>

            <p className="text-xs mt-2">
              De: {opened.sender_name}
              {opened.anonymous && (isMaster || opened.is_sender)
                ? " (Anónimo)"
                : ""}
            </p>

            <p
              className="text-base leading-8 italic mt-8
              whitespace-pre-wrap wrap-break-word"
            >
              {opened.content || "Carta sin contenido."}
            </p>

            <div
              className="letter-seal ml-auto mt-8"
              style={{
                background: letterSeals[opened.seal].color,
              }}
            >
              {letterSeals[opened.seal].symbol}
            </div>

            <p className="text-[10px] mt-6 text-center">
              {socialDate(opened.sent_at || opened.created_at)}
            </p>
          </article>

          {opened.letter_kind === "epistolary" && <p className="text-xs text-(--muted)">Carta de juego · Ciclo {opened.epistolary_cycle} · Fase {opened.epistolary_phase}</p>}
          {conversation.length > 1 && <section className="space-y-2"><h3 className="text-xl">Hilo de correspondencia</h3>{conversation.map(l=><button key={l.id} type="button" disabled={busy} onClick={()=>void openLetter(l)} aria-pressed={l.id===opened.id} className="letter-thread-row"><span>{l.sender_name} → {l.recipient_name}<small className="block text-(--muted)">{l.subject}</small></span><small>{socialDate(l.sent_at || l.created_at)}</small></button>)}</section>}
          {opened.status === "sent" &&
            !opened.anonymous &&
            opened.is_recipient &&
            opened.sender_character_id &&
            identities.some((p) => p.id === opened.recipient_character_id) &&
            characters.some((p) => p.id === opened.sender_character_id) && (
              <button
                onClick={() => reply(opened)}
                className="academy-button flex
                  items-center justify-center gap-2"
              >
                <Reply size={18} />
                Responder carta
              </button>
            )}

          {opened.is_sender && opened.status === "sent" && (
            <p className="text-xs text-(--muted)">
              {opened.read_at
                ? "Leída por el destinatario."
                : "Todavía no ha sido leída."}
            </p>
          )}
        </section>
      )}

      <div
        className="grid sm:grid-cols-2
        xl:grid-cols-3 gap-5 items-start"
      >
        {threadCards.map((letter) => (
          <article key={letter.id} className="academy-card p-3">
            <button
              disabled={busy}
              onClick={() => {
                if (letter.status === "draft" && letter.is_sender) {
                  editDraft(letter);
                } else {
                  void openLetter(letter);
                }
              }}
              data-paper={letter.paper}
              className="letter-envelope letter-decorated w-full
                flex flex-col items-center
                justify-center gap-3 p-5"
              style={{
                backgroundColor: letterPapers[letter.paper].color,
                color: letterInk(letter.paper),
              }}
            >
              <span
                className="text-[10px]
                tracking-widest text-[#927BA8]"
              >
                {letter.status === "draft"
                  ? "BORRADOR"
                  : "CORRESPONDENCIA PRIVADA"}
              </span>

              <div
                className="letter-seal"
                style={{
                  background: letterSeals[letter.seal].color,
                }}
              >
                {letterSeals[letter.seal].symbol}
              </div>

              <h3
                className="text-2xl
                wrap-break-word max-w-full"
              >
                {letter.subject || "Sin asunto"}
              </h3>

              <p
                className="text-xs wrap-break-word
                max-w-full"
              >
                {tab === "sent" || tab === "drafts"
                  ? `Para: ${letter.recipient_name}`
                  : `De: ${letter.sender_name}`}
              </p>

              {letter.letter_kind === "epistolary" && <span className="text-xs">✧ Carta de juego</span>}
              {tab === "threads" && <span className="text-xs">{letters.filter(l=>l.status==="sent" && (l.is_sender || l.is_recipient) && threadKey(l)===threadKey(letter)).length} cartas en el hilo</span>}
              {letter.is_recipient && !letter.read_at && (
                <span
                  className="text-[10px]
                    bg-[#EEE6F5] rounded-full px-3 py-1"
                >
                  Nueva carta
                </span>
              )}
            </button>

            <div
              className="flex items-center gap-3
              px-2 pt-3 pb-1"
            >
              <span
                className="flex-1 text-[10px]
                text-(--muted)"
              >
                {socialDate(letter.sent_at || letter.created_at)}
              </span>

              <button
                disabled={busy}
                onClick={() => favorite(letter)}
                aria-label="Marcar favorita"
                aria-pressed={letter.favorite}
              >
                <Star
                  size={18}
                  className="text-(--gold)"
                  fill={letter.favorite ? "currentColor" : "none"}
                />
              </button>

              {letter.status === "draft" && letter.is_sender && (
                <button
                  disabled={busy}
                  title="Eliminar borrador"
                  onClick={() => setConfirmDelete(letter)}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {confirmDelete && <section className="academy-card p-5 space-y-3" role="alert"><h3 className="text-xl">¿Eliminar borrador?</h3><p>{confirmDelete.subject || "Sin asunto"}</p><div className="flex gap-2"><button disabled={busy} className="academy-button" onClick={()=>setConfirmDelete(null)}>Cancelar</button><button disabled={busy} className="academy-button" onClick={()=>void deleteDraft(confirmDelete)}>Eliminar</button></div></section>}
      {!visible.length && (
        <div className="academy-card p-10 text-center">
          <Mail size={40} strokeWidth={1.2} className="mx-auto text-(--gold)" />

          <p className="text-sm mt-5 text-(--muted)">
            No hay cartas en esta bandeja.
          </p>
        </div>
      )}
    </div>
  );
}
