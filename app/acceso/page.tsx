"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/theme-toggle";
import { Flower2, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register" | "verify" | "forgot" | "recovery" | "reset";

const titles: Record<Mode, string> = {
  login: "Bienvenido a la academia",
  register: "Solicitar admisión",
  verify: "Confirma tu correo",
  forgot: "Recuperar acceso",
  recovery: "Código de seguridad",
  reset: "Nueva contraseña",
};

export default function AccessPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const needsPassword = ["login", "register", "reset"].includes(mode);

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
    setConfirm("");
    setCode("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if ((mode === "register" || mode === "reset") && password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const cleanEmail = email.trim();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        window.location.replace("/");
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.replace("/");
          return;
        }

        changeMode("verify");
        setMessage("Consulta el código enviado a tu correo.");
      }

      if (mode === "verify") {
        const { error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code.trim(),
          type: "email",
        });

        if (error) throw error;

        window.location.replace("/");
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

        if (error) throw error;

        changeMode("recovery");
        setMessage("Si la cuenta existe, recibirás un código de seguridad.");
      }

      if (mode === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code.trim(),
          type: "recovery",
        });

        if (error) throw error;

        changeMode("reset");
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        await supabase.auth.signOut();

        changeMode("login");
        setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Error inesperado";

      if (detail.includes("Invalid login credentials")) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else if (detail.includes("Email not confirmed")) {
        setError("Primero debes confirmar tu correo.");
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const result =
        mode === "verify"
          ? await supabase.auth.resend({
              type: "signup",
              email: email.trim(),
            })
          : await supabase.auth.resetPasswordForEmail(email.trim());

      if (result.error) throw result.error;

      setMessage("Solicitud de código enviada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section
        className="hidden lg:flex academy-banner
        items-end justify-center p-12 text-center"
      >
        <div className="academy-card p-8 max-w-lg">
          <Flower2 size={38} className="mx-auto text-(--gold)" />

          <h1 className="text-5xl mt-5">El Baile de las Orquídeas</h1>

          <p className="mt-4 italic text-(--muted)">
            Entre pétalos, promesas y secretos, solo una gema llevará la corona.
          </p>
        </div>
      </section>

      <section
        className="relative flex items-center
        justify-center p-6 md:p-12"
      >
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md py-10">
          <div className="text-center mb-8">
            <Flower2
              size={42}
              strokeWidth={1.2}
              className="mx-auto text-(--gold)"
            />

            <p
              className="uppercase tracking-[0.4em]
              text-xs mt-4 text-(--accent)"
            >
              Academia
            </p>

            <h1 className="text-5xl mt-3 font-semibold">Gema Brillante</h1>

            <div className="floral-divider my-6">❀</div>

            <h2 className="text-3xl">{titles[mode]}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={loading} className="space-y-4">
              {mode === "register" && (
                <label className="block text-sm">
                  Nombre de usuario
                  <input
                    className="academy-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={2}
                    maxLength={30}
                    autoComplete="username"
                  />
                </label>
              )}

              {mode !== "reset" && (
                <label className="block text-sm">
                  Correo electrónico
                  <input
                    className="academy-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </label>
              )}

              {needsPassword && (
                <label className="block text-sm">
                  Contraseña
                  <div className="relative">
                    <input
                      className="academy-input pr-12"
                      type={visible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={mode === "login" ? undefined : 8}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      required
                    />

                    <button
                      type="button"
                      aria-label="Mostrar u ocultar contraseña"
                      className="absolute right-4 top-5 text-(--accent)"
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}

              {(mode === "register" || mode === "reset") && (
                <label className="block text-sm">
                  Confirmar contraseña
                  <input
                    className="academy-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </label>
              )}

              {(mode === "verify" || mode === "recovery") && (
                <label className="block text-sm">
                  Código de verificación
                  <input
                    className="academy-input text-center
                    text-xl tracking-[0.4em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </label>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => changeMode("forgot")}
                  className="text-xs text-(--accent)"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl p-3
                  bg-(--pink) text-sm"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="rounded-xl p-3
                  bg-(--sage) text-sm"
                >
                  {message}
                </p>
              )}

              <button className="academy-button" type="submit">
                {loading
                  ? "Procesando..."
                  : {
                      login: "Ingresar a la academia",
                      register: "Crear mi cuenta",
                      verify: "Confirmar admisión",
                      forgot: "Enviar código",
                      recovery: "Verificar código",
                      reset: "Guardar contraseña",
                    }[mode]}
              </button>
            </fieldset>
          </form>

          <div className="mt-6 text-center space-y-4">
            {mode === "login" ? (
              <>
                <p className="text-sm">
                  ¿Todavía no tienes una cuenta?{" "}
                  <button
                    disabled={loading}
                    onClick={() => changeMode("register")}
                    className="text-(--accent)"
                  >
                    Regístrate
                  </button>
                </p>

                <button
                  disabled={loading}
                  onClick={() => changeMode("verify")}
                  className="text-xs text-(--accent)"
                >
                  Confirmar una cuenta pendiente
                </button>
              </>
            ) : (
              <button
                disabled={loading}
                onClick={() => changeMode("login")}
                className="text-sm text-(--accent)"
              >
                Volver al inicio de sesión
              </button>
            )}

            {(mode === "verify" || mode === "recovery") && (
              <p>
                <button
                  disabled={loading || !email}
                  onClick={resendCode}
                  className="text-xs text-(--accent)"
                >
                  Reenviar código
                </button>
              </p>
            )}
          </div>

          <div className="floral-divider my-8">✧</div>

          <p className="text-center text-xs italic text-(--muted)">
            La verdadera belleza florece en silencio.
          </p>
        </div>
      </section>
    </main>
  );
}
