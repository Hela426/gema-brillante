"use client";

import {
  Home,
  UsersRound,
  Heart,
  Gem,
  Wallet,
  Feather,
  Mail,
  Eye,
  CalendarDays,
  BookOpen,
  Settings,
  Crown,
  Flower2,
} from "lucide-react";

import Link from "next/link";

const menu = [
  { name: "Inicio", icon: Home, href: "/" },
  { name: "Estudiantes", icon: UsersRound, href: "/personajes" },
  { name: "Mis NPC", icon: UsersRound, href: "/npc" },
  { name: "Relaciones", icon: Heart, href: "" },
  { name: "Deseos", icon: Gem, href: "" },
  { name: "Tesorería", icon: Wallet, href: "" },
  { name: "Diario", icon: Feather, href: "" },
  { name: "Correspondencia", icon: Mail, href: "" },
  { name: "Rumores", icon: Eye, href: "" },
  { name: "Eventos", icon: CalendarDays, href: "" },
  { name: "Biblioteca", icon: BookOpen, href: "" },
];

export default function Sidebar({ isMaster = false }: { isMaster?: boolean }) {
  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0
      h-screen w-64 flex-col
      bg-/[var(--sidebar)]
      border-r border-/[var(--border)]
      px-5 py-7 overflow-y-auto z-30"
    >
      <div className="text-center mb-8">
        <Flower2
          size={36}
          className="mx-auto mb-3 text-/[var(--gold)]"
          strokeWidth={1.2}
        />

        <p
          className="text-[10px] tracking-[0.4em] uppercase
        text-/[var(--accent)]"
        >
          Academia
        </p>

        <h1 className="text-3xl font-semibold">Gema Brillante</h1>

        <p className="text-[10px] text-/[var(--muted)] mt-2">
          EST. ✧ SOCIETAS ORCHIDIS
        </p>
      </div>

      <div className="floral-divider mb-6">❀</div>

      <p
        className="text-[10px] uppercase tracking-widest
      text-/[var(--muted)] mb-3 px-3"
      >
        La academia
      </p>

      <nav className="space-y-1">
        {menu.map((item) => {
          const className =
            "w-full flex items-center gap-3 px-4 py-3 " +
            "rounded-xl text-left text-sm hover:bg-(--lavender)";

          const content = (
            <>
              <item.icon
                size={18}
                strokeWidth={1.5}
                className="text-(--accent)"
              />
              {item.name}
            </>
          );

          return item.href ? (
            <Link key={item.name} href={item.href} className={className}>
              {content}
            </Link>
          ) : (
            <button key={item.name} type="button" className={className}>
              {content}
            </button>
          );
        })}
      </nav>

      <Link
        href="/cuenta"
        className="flex items-center gap-3 px-4 py-3
        rounded-xl text-sm hover:bg-(--lavender)"
      >
        <Settings size={18} className="text-(--accent)" />
        Configuración
      </Link>

      <div className="floral-divider my-6">✧</div>

      {isMaster && (
        <Link
          href="/master"
          className="flex items-center gap-3 px-4 py-3
          rounded-xl bg-(--ivory) text-sm
          hover:opacity-80"
        >
          <Crown size={19} className="text-(--gold)" />
          Rectoría
        </Link>
      )}

      <div className="mt-auto pt-8 text-center">
        <div
          className="h-32 bg-contain bg-center
          bg-no-repeat opacity-80"
          style={{
            backgroundImage: "url('/images/orquideas.png')",
          }}
        />

        <p className="text-xs italic text-/[var(--muted)]">
          La verdadera belleza florece en silencio.
        </p>
      </div>
    </aside>
  );
}
