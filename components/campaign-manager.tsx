"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  campaignPhases,
  campaignStatuses,
  upkeepTasks,
  type CampaignState,
  type PhaseHistory,
} from "@/lib/campaign";

import { socialDate } from "@/lib/social";

import {
  Crown,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Flag,
  History,
  Flower2,
} from "lucide-react";

export default function CampaignManager({
  campaign,
  history,
  isMaster,
}: {
  campaign: CampaignState;
  history: PhaseHistory[];
  isMaster: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(campaign.title);
  const [planned, setPlanned] = useState(campaign.planned_cycles);

  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const phase = campaignPhases[campaign.phase_number - 1];

  const upkeepDone = checked.length === upkeepTasks.length;

  const isUpkeep = campaign.phase_number === 8;

  const chapter =
    (campaign.cycle_number - 1) * 2 + (campaign.phase_number >= 5 ? 2 : 1);

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

  async function manage(action: string) {
    if (
      action === "finish" &&
      !window.confirm(
        "¿Finalizar la campaña? Esta acción cerrará el controlador.",
      )
    )
      return;

    await execute(async () => {
      const { error } = await createClient().rpc("manage_campaign", {
        p_action: action,
        p_title: title,
        p_cycles: planned,
      });

      if (error) throw new Error(error.message);
    }, "Estado de la campaña actualizado.");
  }

  async function resetCampaign() {
    if (resetConfirmation !== "REINICIAR") return;

    await execute(async () => {
      const { error } = await createClient().rpc("reset_campaign");

      if (error) throw new Error(error.message);

      setNote("");
      setChecked([]);
      setShowReset(false);
      setResetConfirmation("");
    }, "La campaña ha sido reiniciada.");
  }

  async function advance() {
    if (!window.confirm("¿Completar la fase actual?")) return;

    await execute(async () => {
      const { error } = await createClient().rpc("advance_campaign_phase", {
        p_version: campaign.version,
        p_note: note.trim(),
        p_upkeep_confirmed: isUpkeep && upkeepDone,
      });

      if (error) throw new Error(error.message);

      setNote("");
      setChecked([]);
    }, "La historia continúa.");
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Ciclo actual", campaign.cycle_number, "var(--lavender)"],
          ["Fase actual", `${campaign.phase_number}/8`, "var(--pink)"],
          ["Capítulo", chapter, "var(--sage)"],
          ["Ciclos previstos", campaign.planned_cycles, "var(--ivory)"],
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

      <section className="academy-card p-6 text-center">
        <Flower2
          size={35}
          className="mx-auto text-(--gold)"
          strokeWidth={1.2}
        />

        <p className="text-xs text-(--accent) mt-3">
          {campaignStatuses[campaign.status]}
        </p>

        <h2 className="text-4xl mt-3">{campaign.title}</h2>

        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-80 mx-auto mt-5"
          aria-label={`Fase ${campaign.phase_number} de 8`}
        >
          {campaignPhases.map((item, index) => {
            const start = ((index * 45 - 90 - 20) * Math.PI) / 180;

            const end = ((index * 45 - 90 + 20) * Math.PI) / 180;

            const middle = ((index * 45 - 90) * Math.PI) / 180;

            const current = index + 1 === campaign.phase_number;

            const complete = index + 1 < campaign.phase_number;

            return (
              <g key={item.name}>
                <path
                  d={`M ${160 + 116 * Math.cos(start)}
                    ${160 + 116 * Math.sin(start)}
                    A 116 116 0 0 1
                    ${160 + 116 * Math.cos(end)}
                    ${160 + 116 * Math.sin(end)}`}
                  stroke={
                    current
                      ? "var(--gold)"
                      : complete
                        ? "#A9B99D"
                        : "var(--lavender)"
                  }
                  strokeWidth={current ? 27 : 22}
                  strokeLinecap="round"
                  fill="none"
                />

                <text
                  x={160 + 116 * Math.cos(middle)}
                  y={165 + 116 * Math.sin(middle)}
                  textAnchor="middle"
                  fontSize="13"
                  fill={current ? "#FFFFFF" : "var(--foreground)"}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          <circle
            cx="160"
            cy="160"
            r="78"
            fill="var(--ivory)"
            stroke="var(--gold)"
          />

          <text
            x="160"
            y="145"
            textAnchor="middle"
            fontSize="28"
            fill="var(--gold)"
          >
            ❀
          </text>

          <text
            x="160"
            y="173"
            textAnchor="middle"
            fontSize="22"
            fill="var(--foreground)"
          >
            Ciclo {campaign.cycle_number}
          </text>

          <text
            x="160"
            y="193"
            textAnchor="middle"
            fontSize="12"
            fill="var(--accent)"
          >
            Fase {campaign.phase_number} de 8
          </text>
        </svg>

        <div className="rounded-2xl bg-(--lavender) p-5">
          <p className="text-xs uppercase tracking-widest">Fase actual</p>

          <h3 className="text-3xl mt-3">{phase.name}</h3>

          <p className="text-sm mt-3">{phase.description}</p>

          <Link href={phase.href} className="academy-button block mt-5">
            {phase.action}
          </Link>
        </div>
      </section>

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-3">
          <BookOpen className="text-(--gold)" />
          El ciclo de juego
        </h2>

        <div className="space-y-3 mt-5">
          {campaignPhases.map((item, index) => {
            const complete = index + 1 < campaign.phase_number;

            const current = index + 1 === campaign.phase_number;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3
                  p-4 rounded-xl ${
                    current ? "bg-(--lavender)" : "bg-(--surface)"
                  }`}
              >
                {complete ? (
                  <CheckCircle2 size={19} className="text-[#8DA783]" />
                ) : (
                  <Circle size={19} className="text-(--gold)" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {index + 1}. {item.name}
                  </p>
                  <p className="text-xs text-(--muted) mt-1">
                    {item.description}
                  </p>
                </div>

                <ArrowRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>

      {isMaster && (
        <section className="academy-card p-6 space-y-5">
          <h2 className="text-3xl flex items-center gap-3">
            <Crown className="text-(--gold)" />
            Control de Rectoría
          </h2>

          {campaign.status === "preparation" && (
            <>
              <label className="block text-sm">
                Nombre de la campaña
                <input
                  className="academy-input"
                  value={title}
                  maxLength={150}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                Número de ciclos previstos
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="academy-input"
                  value={planned}
                  onChange={(e) => setPlanned(Number(e.target.value))}
                />
              </label>

              <button
                disabled={busy}
                className="academy-button"
                onClick={() => manage("configure")}
              >
                Guardar configuración
              </button>

              <button
                disabled={busy}
                className="academy-button
                  flex items-center justify-center gap-2"
                onClick={() => manage("start")}
              >
                <Play size={18} />
                Iniciar campaña
              </button>
            </>
          )}

          {campaign.status === "running" && (
            <>
              {isUpkeep && (
                <div
                  className="bg-(--surface)
                  rounded-xl p-5 space-y-4"
                >
                  <h3 className="text-2xl">Mantenimiento del ciclo</h3>

                  <p className="text-xs text-(--muted)">
                    {checked.length} de {upkeepTasks.length} tareas completadas
                  </p>

                  {upkeepTasks.map((task, index) => (
                    <label
                      key={task}
                      className="flex items-start gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked.includes(index)}
                        onChange={(e) =>
                          setChecked((old) =>
                            e.target.checked
                              ? [...old, index]
                              : old.filter((i) => i !== index),
                          )
                        }
                      />
                      {task}
                    </label>
                  ))}

                  <div
                    className="flex flex-wrap gap-3
                    text-xs text-(--accent)"
                  >
                    <Link href="/tesoreria">Tesorería</Link>
                    <Link href="/deseos">Deseos</Link>
                    <Link href="/diario">Diario</Link>
                    <Link href="/master/personajes">Reputación</Link>
                  </div>
                </div>
              )}

              <label className="block text-sm">
                Resumen público de la fase (opcional)
                <textarea
                  className="academy-input min-h-24"
                  value={note}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="¿Qué sucedió durante esta fase?"
                />
              </label>

              <p className="text-xs text-(--muted)">
                Todos los jugadores podrán leer este resumen. No incluyas
                secretos ni planes de Rectoría.
              </p>

              <button
                disabled={busy || (isUpkeep && !upkeepDone)}
                onClick={advance}
                className="academy-button flex items-center
                  justify-center gap-2 disabled:opacity-50"
              >
                {isUpkeep
                  ? "Completar mantenimiento"
                  : "Completar fase y avanzar"}

                <ArrowRight size={18} />
              </button>

              <button
                disabled={busy}
                onClick={() => manage("pause")}
                className="flex items-center gap-2 text-sm"
              >
                <Pause size={17} /> Pausar campaña
              </button>
            </>
          )}

          {campaign.status === "paused" && (
            <button
              disabled={busy}
              className="academy-button"
              onClick={() => manage("resume")}
            >
              Reanudar campaña
            </button>
          )}

          {["running", "paused"].includes(campaign.status) && (
            <button
              disabled={busy}
              onClick={() => manage("finish")}
              className="flex items-center gap-2 text-sm
                text-(--accent)"
            >
              <Flag size={16} /> Finalizar campaña
            </button>
          )}

          <div className="border-t border-(--border) pt-5">
            <button
              disabled={busy}
              onClick={() => {
                setResetConfirmation("");
                setShowReset(true);
              }}
              className="w-full rounded-xl bg-(--pink)
      p-3 text-sm"
            >
              Reiniciar campaña
            </button>

            <p className="text-xs text-(--muted) mt-3">
              Reinicia los ciclos, fases e historial. Conserva los personajes y
              los demás datos.
            </p>

            {showReset && (
              <div
                className="mt-5 rounded-2xl
      border border-(--border)
      bg-(--surface) p-6 space-y-4"
              >
                <div className="text-center">
                  <Flower2
                    size={40}
                    strokeWidth={1.2}
                    className="mx-auto text-(--gold)"
                  />

                  <h3 className="text-3xl mt-4">¿Volver a comenzar?</h3>

                  <p className="text-sm mt-3 leading-6">
                    El historial de fases será eliminado y la campaña regresará
                    al primer ciclo.
                  </p>

                  <p className="text-xs text-(--muted) mt-3">
                    Tus personajes, publicaciones, fichas, cartas y rumores se
                    conservarán.
                  </p>
                </div>

                <label className="block text-sm">
                  Escribe REINICIAR para confirmar.
                  <input
                    className="academy-input mt-2"
                    value={resetConfirmation}
                    disabled={busy}
                    placeholder="REINICIAR"
                    onChange={(e) => setResetConfirmation(e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={busy}
                    onClick={() => {
                      setShowReset(false);
                      setResetConfirmation("");
                    }}
                    className="rounded-xl border
            border-(--border) p-3 text-sm"
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={busy || resetConfirmation !== "REINICIAR"}
                    onClick={resetCampaign}
                    className="rounded-xl bg-(--pink)
            p-3 text-sm disabled:opacity-40"
                  >
                    {busy ? "Reiniciando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {campaign.status === "finished" && (
            <p className="italic text-sm">
              Nuestra historia ha llegado a su fin.
            </p>
          )}
        </section>
      )}

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-3">
          <History className="text-(--gold)" />
          Crónica de los ciclos
        </h2>

        <div className="space-y-4 mt-5">
          {history.map((item) => (
            <article
              key={item.id}
              className="border-l-2 border-(--gold) pl-4 py-3"
            >
              <p className="text-xs text-(--accent)">
                Ciclo {item.cycle_number} · Fase {item.phase_number}
              </p>

              <h3 className="text-2xl mt-2">
                {campaignPhases[item.phase_number - 1]?.name}
              </h3>

              <p className="text-sm mt-3 whitespace-pre-wrap">
                {item.note || "Fase completada."}
              </p>

              <p className="text-xs text-(--muted) mt-3">
                {socialDate(item.completed_at)}
              </p>
            </article>
          ))}

          {!history.length && (
            <p className="text-sm text-(--muted)">
              Nuestra historia todavía está por escribirse.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
