"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Wallet, Movement, ResourceCharacter } from "@/lib/resources";
import {
  Gem,
  Feather,
  Crown,
  History,
  Wallet as WalletIcon,
} from "lucide-react";

export default function Treasury({
  wallets,
  movements,
  characters,
  userId,
  isMaster,
}: {
  wallets: Wallet[];
  movements: Movement[];
  characters: ResourceCharacter[];
  userId: string;
  isMaster: boolean;
}) {
  const router = useRouter();

  const [operation, setOperation] = useState(isMaster ? "grant" : "spend");

  const [token, setToken] = useState<"resolution" | "monologue">("resolution");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [connectionId, setConnectionId] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalResolution = wallets.reduce(
    (sum, wallet) => sum + wallet.resolution,
    0,
  );

  const totalMonologue = wallets.reduce(
    (sum, wallet) => sum + wallet.monologue,
    0,
  );

  const ownWallets = wallets.filter(
    (wallet) => isMaster || wallet.owner_id === userId,
  );

  const connections = characters.filter(
    (person) =>
      person.character_type === "npc" &&
      !wallets.some((w) => w.character_id === person.id),
  );

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

  async function initialize() {
    await execute(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("initialize_wallets");

      if (error) throw new Error(error.message);
    }, "Carteras inicializadas correctamente.");
  }

  async function addConnection() {
    if (!connectionId) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.rpc("create_connection_wallet", {
        p_character: connectionId,
      });

      if (error) throw new Error(error.message);

      setConnectionId("");
    }, "Reserva de conexión creada.");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if ((operation !== "grant" && !from) || (operation !== "spend" && !to)) {
      setError("Selecciona las carteras necesarias.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.rpc("move_tokens", {
        p_from: operation === "grant" ? null : from,
        p_to: operation === "spend" ? null : to,
        p_type: token,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw new Error(error.message);

      setReason("");
      setAmount(1);
    }, "Movimiento registrado correctamente.");
  }

  function walletName(id: string | null) {
    return wallets.find((w) => w.id === id)?.label || "Mesa";
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

      <div className="grid grid-cols-2 gap-4">
        <article className="bg-(--lavender) rounded-2xl p-6">
          <Gem className="text-(--accent)" />
          <h2 className="text-5xl mt-3">{totalResolution}</h2>
          <p className="text-sm mt-2">Resolución disponible</p>
        </article>

        <article className="bg-(--pink) rounded-2xl p-6">
          <Feather className="text-(--accent)" />
          <h2 className="text-5xl mt-3">{totalMonologue}</h2>
          <p className="text-sm mt-2">Monólogos disponibles</p>
        </article>
      </div>

      {isMaster && (
        <section className="academy-card p-6 space-y-4">
          <h2 className="text-3xl flex items-center gap-3">
            <Crown className="text-(--gold)" />
            Administración
          </h2>

          <button
            disabled={busy}
            onClick={initialize}
            className="academy-button"
          >
            Inicializar carteras de jugadores y máster
          </button>

          <select
            className="academy-input"
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
          >
            <option value="">Seleccionar conexión...</option>
            {connections.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>

          <button
            disabled={busy || !connectionId}
            onClick={addConnection}
            className="academy-button"
          >
            Crear reserva de conexión
          </button>
        </section>
      )}

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-3">
          <WalletIcon className="text-(--gold)" />
          Carteras de la mesa
        </h2>

        <div className="mt-5 divide-y divide-(--border)">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="flex flex-wrap items-center
                justify-between gap-4 py-5"
            >
              <div className="flex-1 min-w-32">
                <h3 className="text-2xl">{wallet.label}</h3>
                <p className="text-xs text-(--muted)">
                  {wallet.character_id ? "Conexión" : "Participante"}
                  {wallet.owner_id === userId ? " · Tu cartera" : ""}
                </p>
              </div>

              <span className="flex items-center gap-2">
                <Gem size={19} className="text-(--accent)" />
                {wallet.resolution}
              </span>

              <span className="flex items-center gap-2">
                <Feather size={19} className="text-(--gold)" />
                {wallet.monologue}
              </span>
            </div>
          ))}

          {!wallets.length && (
            <p className="py-5 text-sm text-(--muted)">
              Rectoría todavía no ha distribuido las fichas.
            </p>
          )}
        </div>
      </section>

      <section className="academy-card p-6">
        <h2 className="text-3xl">Realizar movimiento</h2>

        <form onSubmit={submit} className="mt-5">
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm">
              Operación
              <select
                className="academy-input"
                value={operation}
                onChange={(e) => {
                  setOperation(e.target.value);
                  setFrom("");
                  setTo("");

                  if (e.target.value === "transfer") {
                    setToken("resolution");
                  }
                }}
              >
                {isMaster && <option value="grant">Entregar fichas</option>}
                <option value="spend">Gastar fichas</option>
                <option value="transfer">Transferir fichas</option>
              </select>
            </label>

            <label className="block text-sm">
              Tipo de ficha
              <select
                className="academy-input"
                value={token}
                onChange={(e) => setToken(e.target.value as typeof token)}
              >
                <option value="resolution">Resolución</option>
                {operation !== "transfer" && (
                  <option value="monologue">Monólogo</option>
                )}
              </select>
            </label>

            {operation !== "grant" && (
              <label className="block text-sm">
                Cartera de origen
                <select
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="academy-input"
                >
                  <option value="">Seleccionar...</option>
                  {ownWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label} ({wallet[token]})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {operation !== "spend" && (
              <label className="block text-sm">
                Destinatario
                <select
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="academy-input"
                >
                  <option value="">Seleccionar...</option>
                  {wallets
                    .filter((wallet) => wallet.id !== from)
                    .map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label className="block text-sm">
              Cantidad
              <input
                required
                type="number"
                min={1}
                max={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="academy-input"
              />
            </label>

            <label className="block text-sm">
              Motivo público (opcional)
              <input
                className="academy-input"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Negociación durante el baile"
              />
            </label>

            <p className="text-xs text-(--muted)">
              No incluyas secretos en el motivo del movimiento.
            </p>

            <button type="submit" className="academy-button">
              {busy ? "Procesando..." : "Confirmar movimiento"}
            </button>
          </fieldset>
        </form>
      </section>

      <section className="academy-card p-6">
        <h2 className="text-3xl flex items-center gap-3">
          <History className="text-(--gold)" />
          Historial
        </h2>

        <div className="mt-5 space-y-3">
          {movements.map((movement) => (
            <article
              key={movement.id}
              className="bg-(--surface) rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                {movement.token_type === "resolution" ? (
                  <Gem size={18} />
                ) : (
                  <Feather size={18} />
                )}

                <p className="text-sm">
                  {movement.amount} ·{" "}
                  {movement.token_type === "resolution"
                    ? "Resolución"
                    : "Monólogo"}
                </p>
              </div>

              <p className="text-sm mt-2">
                {movement.movement_type === "grant"
                  ? `Entrega a ${walletName(movement.to_wallet)}`
                  : movement.movement_type === "spend"
                    ? `Gasto de ${walletName(movement.from_wallet)}`
                    : `${walletName(movement.from_wallet)} → ${walletName(movement.to_wallet)}`}
              </p>

              {movement.description && (
                <p className="text-xs mt-2 text-(--muted)">
                  {movement.description}
                </p>
              )}

              <p className="text-xs mt-2 text-(--muted)">
                {new Date(movement.created_at).toLocaleString("es-CO", {
                  timeZone: "America/Bogota",
                })}
              </p>
            </article>
          ))}

          {!movements.length && (
            <p className="text-sm text-(--muted)">
              Todavía no hay movimientos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
