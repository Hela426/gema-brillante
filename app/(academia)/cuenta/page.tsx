"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";

import { ArrowLeft, Flower2, LockKeyhole, LogOut } from "lucide-react";

export default function AccountPage() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
        current_password: current,
      });

      if (error) throw error;

      setMessage("Tu contraseña se ha actualizado.");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    window.location.replace("/acceso");
  }

  return (
    <main className="min-h-screen p-5 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2
            text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>

          <ThemeToggle />
        </header>

        <div className="text-center my-10">
          <Flower2 size={40} className="mx-auto text-(--gold)" />

          <h1 className="text-5xl mt-4">Mi cuenta</h1>

          <p className="text-sm mt-2 text-(--muted)">
            Configuración y seguridad personal
          </p>
        </div>

        <section className="academy-card p-6 md:p-8">
          <h2 className="text-3xl flex items-center gap-3">
            <LockKeyhole size={23} className="text-(--gold)" />
            Cambiar contraseña
          </h2>

          <form onSubmit={changePassword} className="mt-6 space-y-5">
            <label className="block text-sm">
              Contraseña actual
              <input
                className="academy-input"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm">
              Nueva contraseña
              <input
                className="academy-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm">
              Confirmar nueva contraseña
              <input
                className="academy-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>

            {error && (
              <p
                role="alert"
                className="bg-(--pink)
                rounded-xl p-3 text-sm"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="bg-(--sage)
                rounded-xl p-3 text-sm"
              >
                {message}
              </p>
            )}

            <button className="academy-button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </section>

        <section className="academy-card p-6 mt-6">
          <h2 className="text-3xl">Sesión</h2>

          <button
            onClick={logout}
            className="flex items-center gap-3
            bg-(--pink) rounded-xl px-5 py-3
            mt-5 text-sm w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </section>

        <div className="floral-divider my-10">❀</div>
      </div>
    </main>
  );
}
