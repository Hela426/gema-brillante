"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Gem,
  Flower2,
  Search,
  ChevronLeft,
  ChevronRight,
  Feather,
  ArrowRight,
} from "lucide-react";
import { guides } from "@/lib/library-guides";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const groups = [...new Set(guides.map((g) => g.group))];
const questions = [
  {
    q: "Invitas a un estudiante a bailar. ¿Gastas resolución?",
    answers: [
      "Sí, siempre",
      "No, es una acción ordinaria",
      "Solo si es de otra casa",
    ],
    correct: 1,
    why: "La invitación es libre; la respuesta pertenece a su jugador.",
  },
  {
    q: "Quieres garantizar que tu rival acepte la invitación. ¿Qué haces?",
    answers: [
      "Lo decides sin preguntar",
      "Gastas sin negociar",
      "Ofreces una ficha y negocias",
    ],
    correct: 2,
    why: "Determinar acciones ajenas exige negociación; si se acepta, transfieres la ficha.",
  },
  {
    q: "Tu propuesta se rechaza. ¿Qué sucede?",
    answers: [
      "Conservas la ficha",
      "Pierdes la ficha",
      "La propuesta sucede igualmente",
    ],
    correct: 0,
    why: "Sin acuerdo, el efecto propuesto no ocurre y no se gasta la ficha.",
  },
  {
    q: "Tu conexión usa resolución. ¿De dónde sale?",
    answers: [
      "De tu protagonista",
      "De su propia reserva",
      "De cualquier jugador",
    ],
    correct: 1,
    why: "Las conexiones tienen una reserva independiente.",
  },
];
function Practice() {
  const [own, setOwn] = useState(2);
  const [other, setOther] = useState(2);
  const [log, setLog] = useState("Elige una acción para practicar.");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <section className="academy-card p-5 md:p-6 space-y-5">
      <h3 className="text-2xl flex items-center gap-2">
        <Gem size={22} className="text-(--gold)" /> Laboratorio de resolución
      </h3>
      <p className="text-sm text-(--muted)">
        Ejercicio ficticio. No se conecta a Tesorería ni guarda movimientos.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Tu reserva", own],
          ["Otra persona", other],
        ].map(([label, n]) => (
          <div
            key={label}
            className="bg-(--lavender) rounded-xl p-4 text-center"
          >
            <p className="text-xs">{label}</p>
            <p className="text-4xl mt-2">{n}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={!own}
          onClick={() => {
            setOwn(own - 1);
            setLog(
              "Descartaste una ficha para un cambio significativo que no requiere negociación.",
            );
          }}
          className="academy-button disabled:opacity-40"
        >
          Gastar
        </button>
        <button
          disabled={!own}
          onClick={() => {
            setOwn(own - 1);
            setOther(other + 1);
            setLog(
              "La negociación fue aceptada: la ficha pasó a la reserva afectada.",
            );
          }}
          className="academy-button disabled:opacity-40"
        >
          Transferir tras acuerdo
        </button>
        <button
          onClick={() =>
            setLog(
              "La propuesta fue rechazada. No se modifica ninguna reserva.",
            )
          }
          className="border border-(--border) rounded-xl p-3 text-sm"
        >
          Rechazo
        </button>
        <button
          onClick={() => {
            setOwn(2);
            setOther(2);
            setLog("Reservas restauradas.");
            setAnswers({});
          }}
          className="text-sm underline"
        >
          Reiniciar práctica
        </button>
      </div>
      <p role="status" className="bg-(--surface) p-3 rounded-xl text-sm">
        {log}
      </p>
      <div className="floral-divider">❀</div>
      <h3 className="text-2xl">¿Qué harías tú?</h3>
      <p className="text-xs text-(--muted)">
        Aciertos: {questions.filter((q, i) => answers[i] === q.correct).length}{" "}
        de {questions.length}
      </p>
      {questions.map((q, i) => (
        <fieldset
          key={q.q}
          className="border border-(--border) rounded-xl p-4 space-y-2"
        >
          <legend className="text-sm px-2">{q.q}</legend>
          {q.answers.map((a, j) => (
            <label key={a} className="flex gap-2 items-start text-sm p-1">
              <input
                type="radio"
                name={`practice-${i}`}
                checked={answers[i] === j}
                onChange={() => setAnswers((old) => ({ ...old, [i]: j }))}
              />
              {a}
            </label>
          ))}
          {answers[i] !== undefined && (
            <p role="status" className="text-sm bg-(--surface) p-3 rounded-lg">
              {answers[i] === q.correct ? "Correcto. " : "Intenta otra vez. "}
              {q.why}
            </p>
          )}
        </fieldset>
      ))}
    </section>
  );
}
export default function LibraryReader() {
  const [selected, setSelected] = useState("inicio");
  const [query, setQuery] = useState("");
  const matches = guides.filter((g) =>
    normalize(
      [
        g.title,
        g.intro,
        g.group,
        g.example,
        g.platform,
        ...g.sections.flatMap((s) => [s.title, s.text]),
      ].join(" "),
    ).includes(normalize(query.trim())),
  );
  const current = matches.find((g) => g.id === selected) || matches[0];
  const index = guides.findIndex((g) => g.id === current?.id);
  function navigate(id: string) {
    setSelected(id);
    setQuery("");
  }
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="academy-banner rounded-3xl border border-(--border) p-6 md:p-10">
          <BookOpen size={42} strokeWidth={1.2} className="text-(--gold)" />
          <p className="text-xs uppercase tracking-widest mt-5 text-(--muted)">
            Academia Gema Brillante · Manual de juego
          </p>
          <h1 className="text-4xl md:text-5xl mt-3">
            Biblioteca de las Orquídeas
          </h1>
          <p className="italic text-sm mt-4 text-(--muted)">
            El conocimiento es la primera llave del destino.
          </p>
        </header>
        <div className="academy-card p-4 flex items-center gap-3">
          <Search size={20} className="shrink-0 text-(--accent)" />
          <input
            aria-label="Buscar reglas"
            className="academy-input min-w-0 flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: resolución, cartas, monólogo..."
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs underline shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
          <nav
            aria-label="Capítulos de la biblioteca"
            className="academy-card p-4 space-y-4 lg:sticky lg:top-20"
          >
            <h2 className="text-xl">Índice</h2>
            {groups.map((group) => {
              const entries = matches.filter((g) => g.group === group);
              return (
                entries.length > 0 && (
                  <div key={group} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-(--muted) px-2">
                      {group}
                    </p>
                    {entries.map((g) => (
                      <button
                        type="button"
                        key={g.id}
                        aria-current={current?.id === g.id ? "page" : undefined}
                        onClick={() => setSelected(g.id)}
                        className={`w-full text-left text-sm rounded-xl px-3 py-2 border ${current?.id === g.id ? "bg-(--lavender) border-(--gold)" : "border-transparent hover:bg-(--surface)"}`}
                      >
                        {g.title}
                      </button>
                    ))}
                  </div>
                )
              );
            })}
            <p className="text-xs text-(--muted)">
              {matches.length} capítulos disponibles
            </p>
          </nav>
          <div className="min-w-0 space-y-5">
            {current ? (
              <>
                <article
                  key={`chapter-${current.id}`}
                  className="academy-card p-5 md:p-8 space-y-6"
                >
                  <p className="text-xs uppercase tracking-widest text-(--muted)">
                    Capítulo {index + 1} · {current.group}
                  </p>
                  <h2 className="text-3xl md:text-4xl">{current.title}</h2>
                  <div className="floral-divider text-(--gold)">❀</div>
                  <p className="text-sm md:text-base leading-7">
                    {current.intro}
                  </p>
                  {current.sections.map((s) => (
                    <section key={s.title} className="space-y-2">
                      <h3 className="text-2xl">{s.title}</h3>
                      <p className="text-sm leading-7 whitespace-pre-wrap">
                        {s.text}
                      </p>
                    </section>
                  ))}
                  <section className="rounded-xl bg-(--lavender) p-5 space-y-2">
                    <h3 className="text-xl flex gap-2 items-center">
                      <Feather size={19} /> En Gema Brillante: un ejemplo
                    </h3>
                    <p className="text-sm leading-7">{current.example}</p>
                  </section>
                  <section className="rounded-xl border border-(--border) p-5 space-y-3">
                    <h3 className="text-xl">Cómo aplicarlo en la página</h3>
                    <p className="text-sm leading-7">{current.platform}</p>
                    <div className="flex flex-wrap gap-2">
                      {current.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="academy-button text-sm inline-flex gap-2 items-center"
                        >
                          {l.label}
                          <ArrowRight size={15} />
                        </Link>
                      ))}
                    </div>
                  </section>
                  <p className="text-xs text-(--muted)">
                    Referencia: {current.source}
                  </p>
                </article>
                {(current.id === "resolucion" ||
                  current.id === "negociacion") && (
                  <Practice key={`practice-${current.id}`} />
                )}
                <div className="flex justify-between gap-3">
                  <button
                    disabled={index <= 0}
                    onClick={() => navigate(guides[index - 1].id)}
                    className="academy-button flex items-center gap-1 disabled:opacity-40"
                  >
                    <ChevronLeft size={17} /> Anterior
                  </button>
                  <button
                    disabled={index >= guides.length - 1}
                    onClick={() => navigate(guides[index + 1].id)}
                    className="academy-button flex items-center gap-1 disabled:opacity-40"
                  >
                    Siguiente <ChevronRight size={17} />
                  </button>
                </div>
              </>
            ) : (
              <section className="academy-card p-8 text-center">
                <Flower2 className="mx-auto text-(--gold)" />
                <p className="mt-4">
                  No encontramos capítulos para esa búsqueda.
                </p>
                <button
                  className="academy-button mt-4"
                  onClick={() => setQuery("")}
                >
                  Ver todos
                </button>
              </section>
            )}
          </div>
        </div>
        <footer className="text-center py-8 text-xs text-(--muted)">
          <Flower2 size={25} className="mx-auto mb-3 text-(--gold)" />
          Guía original en español para Gema Brillante · Basada en Good Society
          RPG, de Storybrewers Roleplaying. Resumen de consulta, no reemplaza el
          reglamento original.
        </footer>
      </div>
    </main>
  );
}
