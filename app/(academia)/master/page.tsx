import { Suspense } from "react";
import { requireMaster } from "@/lib/auth";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";

import {
  Crown,
  UsersRound,
  UserRound,
  Clock,
  LockKeyhole,
  ArrowLeft,
  Flower2,
} from "lucide-react";

async function MasterDashboard() {
  const { supabase, profile } = await requireMaster();

  const [users, characters, pending, secrets, members] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),

    supabase.from("characters").select("id", { count: "exact", head: true }),

    supabase
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("character_type", "npc")
      .eq("status", "pending"),

    supabase
      .from("character_secrets")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("profiles")
      .select("id, username, role, created_at")
      .order("created_at", { ascending: true }),
  ]);

  if ([users, characters, pending, secrets].some((result) => result.error)) {
    throw new Error("No se pudo cargar Rectoría.");
  }

  if (members.error) {
    throw new Error("No se pudieron cargar los usuarios.");
  }

  const stats = [
    {
      name: "Usuarios registrados",
      value: users.count ?? 0,
      icon: UsersRound,
      color: "var(--lavender)",
    },
    {
      name: "Personajes",
      value: characters.count ?? 0,
      icon: UserRound,
      color: "var(--pink)",
    },
    {
      name: "NPC pendientes",
      value: pending.count ?? 0,
      icon: Clock,
      color: "var(--ivory)",
    },
    {
      name: "Secretos registrados",
      value: secrets.count ?? 0,
      icon: LockKeyhole,
      color: "var(--sage)",
    },
  ];

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header
          className="flex items-center
          justify-between mb-8"
        >
          <Link
            href="/"
            className="flex items-center gap-2
            text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Volver a la academia
          </Link>

          <ThemeToggle />
        </header>

        <section
          className="academy-banner rounded-3xl
          border border-(--border) p-8 md:p-12"
        >
          <Crown size={45} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="uppercase tracking-[0.3em]
            text-xs text-(--accent) mt-5"
          >
            Área administrativa
          </p>

          <h1 className="text-6xl mt-3">Rectoría</h1>

          <p className="mt-4 text-(--muted)">Bienvenido, {profile.username}.</p>

          <p className="text-sm italic mt-2">
            Los secretos de la academia descansan bajo tu custodia.
          </p>
        </section>

        <section
          className="grid grid-cols-2
          lg:grid-cols-4 gap-4 mt-8"
        >
          {stats.map((stat) => (
            <article
              key={stat.name}
              className="rounded-2xl p-6"
              style={{ background: stat.color }}
            >
              <stat.icon
                size={25}
                className="text-(--accent)"
                strokeWidth={1.4}
              />

              <h2 className="text-5xl mt-3">{stat.value}</h2>

              <p className="text-xs mt-2">{stat.name}</p>
            </article>
          ))}
        </section>

        <section className="grid sm:grid-cols-2 gap-5 mt-8">
          <Link
            href="/master/personajes"
            className="academy-card p-6 hover:bg-(--lavender)"
          >
            <UsersRound size={30} className="text-(--gold)" />

            <h2 className="text-3xl mt-4">Administrar personajes</h2>

            <p className="text-sm text-(--muted) mt-3">
              Consulta las fichas, aprueba NPC y administra la reputación de los
              estudiantes.
            </p>
          </Link>

          <Link href="/npc" className="academy-card p-6 hover:bg-(--lavender)">
            <Crown size={30} className="text-(--gold)" />

            <h2 className="text-3xl mt-4">Mis NPC</h2>

            <p className="text-sm text-(--muted) mt-3">
              Crea y administra tus propios personajes secundarios.
            </p>
          </Link>
        </section>

        <section className="academy-card p-6 mt-8">
          <h2 className="text-3xl">Registro de usuarios</h2>

          <p className="text-sm text-(--muted) mt-2">
            Miembros de la Academia Gema Brillante.
          </p>

          <div className="mt-5 divide-y divide-(--border)">
            {members.data?.map((member) => (
              <div
                key={member.id}
                className="flex items-center
                justify-between gap-3 py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full
                    bg-(--lavender) flex items-center
                    justify-center"
                  >
                    {member.role === "master" ? (
                      <Crown size={21} className="text-(--gold)" />
                    ) : (
                      <UserRound size={21} className="text-(--accent)" />
                    )}
                  </div>

                  <p>{member.username}</p>
                </div>

                <span
                  className="rounded-full text-xs
                  bg-(--ivory) px-4 py-2"
                >
                  {member.role === "master" ? "Máster" : "Jugador"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center mt-10">
          <Flower2 size={30} className="mx-auto text-(--gold)" />
          <p
            className="text-xs italic
            text-(--muted) mt-3"
          >
            La verdadera belleza florece en silencio.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function MasterPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex
        items-center justify-center"
        >
          <p className="text-(--accent) animate-pulse">
            Abriendo los archivos de Rectoría...
          </p>
        </main>
      }
    >
      <MasterDashboard />
    </Suspense>
  );
}
