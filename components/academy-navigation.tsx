"use client";

import { useEffect, useState, type ReactNode } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import CharacterImage from "@/components/character-image";
import AcademyNotifications, { useAcademyNotices } from "@/components/academy-notifications";

import {
  Home,
  UsersRound,
  UserRound,
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
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Clock,
  LockKeyhole,
  LogOut,
  type LucideIcon,
  Hourglass,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SearchCharacter = {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
};

type MenuItem = {
  name: string;
  icon: LucideIcon;
  href: string;
};

type Props = {
  children: ReactNode;
  isMaster: boolean;
  username: string;
  character: SearchCharacter | null;
  characters: SearchCharacter[];
};

const academyMenu: MenuItem[] = [
  { name: "Inicio", icon: Home, href: "/" },
  { name: "Estudiantes", icon: UsersRound, href: "/personajes" },
  { name: "Mis NPC", icon: UsersRound, href: "/npc" },
  { name: "Relaciones", icon: Heart, href: "/relaciones" },
  { name: "Deseos", icon: Gem, href: "/deseos" },
  { name: "Tesorería", icon: Wallet, href: "/tesoreria" },
  { name: "Diario", icon: Feather, href: "/diario" },
  { name: "Correspondencia", icon: Mail, href: "/correspondencia" },
  { name: "Rumores", icon: Eye, href: "/rumores" },
  { name: "Eventos", icon: CalendarDays, href: "/eventos" },
  { name: "Biblioteca", icon: BookOpen, href: "/biblioteca" },
  { name: "Ciclos del destino", icon: Hourglass, href: "/ciclos" },
];

const masterMenu: MenuItem[] = [
  {
    name: "Panel de Rectoría",
    icon: Crown,
    href: "/master",
  },
  {
    name: "Administrar personajes",
    icon: UsersRound,
    href: "/master/personajes",
  },
  {
    name: "Solicitudes de NPC",
    icon: Clock,
    href: "/master/personajes?filtro=pending",
  },
  {
    name: "Administrar deseos",
    icon: Gem,
    href: "/deseos",
  },
  {
    name: "Administrar fichas",
    icon: Wallet,
    href: "/tesoreria",
  },
  {
    name: "Administrar relaciones",
    icon: Heart,
    href: "/master/relaciones",
  },
  {
    name: "Administrar sesiones",
    icon: BookOpen,
    href: "/master/sesiones",
  },
  {
    name: "Supervisar correspondencia",
    icon: Mail,
    href: "/correspondencia",
  },
  {
    name: "Administrar rumores",
    icon: Eye,
    href: "/rumores",
  },
  {
    name: "Administrar eventos",
    icon: CalendarDays,
    href: "/eventos",
  },
  {
    name: "Control de campaña",
    icon: Hourglass,
    href: "/ciclos",
  },
];

export default function AcademyNavigation({
  children,
  isMaster,
  username,
  character,
  characters,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const notices = useAcademyNotices(pathname);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function keyboard(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((previous) => !previous);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", keyboard);

    return () => {
      window.removeEventListener("keydown", keyboard);
    };
  }, []);

  const accountMenu: MenuItem[] = [
    {
      name: "Mi perfil",
      icon: UserRound,
      href: character ? `/personajes/${character.id}` : "/personajes/crear",
    },
    {
      name: "Configuración",
      icon: Settings,
      href: "/cuenta",
    },
  ];

  const groups = [
    { title: "La academia", items: academyMenu },
    ...(isMaster ? [{ title: "Rectoría", items: masterMenu }] : []),
    { title: "Mi cuenta", items: accountMenu },
  ];

  const allItems = groups.flatMap((group) => group.items);

  const currentPage = allItems
    .filter(
      (item) =>
        item.href &&
        !item.href.includes("?") &&
        (pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href + "/"))),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  const query = search.trim().toLowerCase();

  const foundPages = allItems.filter(
    (item) => item.href && item.name.toLowerCase().includes(query),
  );

  const foundCharacters = characters
    .filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        (person.handle || "").toLowerCase().includes(query),
    )
    .slice(0, 12);

  function navigate(href: string) {
    setSearchOpen(false);
    setMobileOpen(false);
    setSearch("");
    router.push(href);
  }

  async function logout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert("No se pudo cerrar la sesión.");
      return;
    }

    window.location.replace("/acceso");
  }

  function renderMenu(compact: boolean) {
    return (
      <>
        <div className="text-center py-6 px-2">
          <Flower2
            size={compact ? 27 : 38}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          {!compact && (
            <>
              <p
                className="text-[10px] uppercase
                tracking-[0.4em] text-(--accent) mt-3"
              >
                Academia
              </p>

              <h1 className="text-3xl font-semibold">Gema Brillante</h1>

              <div className="floral-divider mt-4">❀</div>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              {!compact && (
                <p
                  className="text-[10px] uppercase
                  tracking-widest text-(--accent)
                  px-3 mb-2"
                >
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.href === currentPage?.href;
                  const count = notices.unread.filter(n => n.section === item.href).length;

                  const className = `
                    flex items-center gap-3
                    rounded-xl py-2.5 px-3
                    text-sm w-full text-left
                    ${compact ? "justify-center" : ""}
                    ${active ? "bg-(--lavender)" : "hover:bg-(--surface)"}
                  `;

                  if (!item.href) {
                    return (
                      <button
                        key={item.name}
                        disabled
                        title="Próximamente"
                        className={className}
                      >
                        <item.icon size={18} className="text-(--accent)" />

                        {!compact && <span>{item.name}</span>}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={count > 0 ? `${item.name} · ${count} novedades` : item.name}
                      onClick={() => setMobileOpen(false)}
                      className={className}
                    >
                      <span className="relative shrink-0">
                        <item.icon size={18} strokeWidth={1.5} className="text-(--accent)" />
                        {compact && count > 0 && <span className="academy-notice-dot academy-notice-dot-compact" aria-hidden="true" />}
                      </span>
                      {!compact && <span>{item.name}</span>}
                      {!compact && count > 0 && <span className="academy-notice-dot ml-auto" aria-hidden="true" />}
                      {count > 0 && <span className="sr-only">{count} novedades sin leer</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-(--border) pt-4 mt-5">
          <Link
            href={accountMenu[0].href}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 p-2"
          >
            <CharacterImage
              path={character?.avatar_url}
              className="w-10 h-10 rounded-full shrink-0"
            />

            {!compact && (
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {character?.name || username}
                </p>

                <p className="text-[10px] text-(--accent)">
                  {isMaster ? "Rectoría" : "Estudiante"}
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className={`flex items-center gap-3 p-3
              rounded-xl text-sm w-full
              text-(--muted) hover:bg-(--pink)
              ${compact ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!compact && "Cerrar sesión"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen">
      {/* MENÚ DE ESCRITORIO */}

      <aside
        className={`academy-sidebar hidden lg:flex fixed
            top-0 left-0 bottom-0 z-40
            flex-col overflow-y-auto
            border-r border-(--border)
            bg-(--sidebar) p-3
            transition-[width] duration-300
            ${collapsed ? "w-20" : "w-64"}`}
      >
        {renderMenu(collapsed)}
      </aside>

      {/* MENÚ PARA CELULARES */}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          <aside
            className="absolute left-0 top-0 bottom-0
            w-72 max-w-[85vw] bg-(--sidebar)
            p-4 overflow-y-auto flex flex-col"
          >
            <button
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4"
            >
              <X size={20} />
            </button>

            {renderMenu(false)}
          </aside>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}

      <div
        className={`min-w-0 transition-[margin]
        duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <header
          className="sticky top-0 z-30
          bg-(--background) border-b border-(--border)
          flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-3"
        >
          <button
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={23} />
          </button>

          <button
            className="hidden lg:block text-(--accent)"
            aria-label="Plegar o expandir menú"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={22} />
            ) : (
              <PanelLeftClose size={22} />
            )}
          </button>

          <div
            className="flex items-center gap-3
            text-(--muted)"
          >
            <button
              title="Atrás"
              aria-label="Atrás"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} />
            </button>

            <button
              title="Adelante"
              aria-label="Adelante"
              onClick={() => router.forward()}
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div
            className="hidden md:flex items-center
            gap-2 text-xs text-(--accent)"
          >
            <Link href="/">Academia</Link>
            <ChevronRight size={14} />
            {currentPage?.name || "Perfil"}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3
              rounded-full bg-(--surface)
              border border-(--border)
              px-2 sm:px-4 py-2 text-sm text-(--muted)"
          >
            <Search size={18} />

            <span className="hidden md:inline">Buscar...</span>

            <kbd
              className="hidden xl:inline text-xs
              border border-(--border)
              rounded-md px-2 py-1"
            >
              Ctrl K
            </kbd>
          </button>

          <AcademyNotifications controller={notices} onNavigate={(href) => { navigate(href); if (href === pathname) router.refresh(); }} />
          <ThemeToggle />

          <Link href="/cuenta" aria-label="Mi cuenta">
            <CharacterImage
              path={character?.avatar_url}
              className="w-9 h-9 rounded-full"
            />
          </Link>
        </header>

        {children}
      </div>

      {/* BUSCADOR RÁPIDO */}

      {searchOpen && (
        <div
          className="fixed inset-0 z-[100]
          flex items-start justify-center
          p-4 pt-[12vh]"
        >
          <button
            aria-label="Cerrar buscador"
            className="absolute inset-0 bg-black/30
              backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Buscador de la academia"
            className="academy-card relative
              w-full max-w-xl overflow-hidden
              shadow-2xl"
          >
            <div
              className="flex items-center
              gap-3 p-5 border-b border-(--border)"
            >
              <Search size={24} className="text-(--gold)" />

              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar personajes o páginas..."
                className="w-full outline-none
                  bg-transparent text-sm"
              />

              <button onClick={() => setSearchOpen(false)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              <p
                className="text-xs uppercase tracking-widest
                text-(--accent) p-3"
              >
                Páginas
              </p>

              {foundPages.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="flex items-center gap-3
                    p-3 rounded-xl w-full text-left text-sm
                    hover:bg-(--lavender)"
                >
                  <item.icon size={18} className="text-(--accent)" />

                  {item.name}

                  <ChevronRight size={15} className="ml-auto text-(--muted)" />
                </button>
              ))}

              <div className="floral-divider my-4">❀</div>

              <p
                className="text-xs uppercase tracking-widest
                text-(--accent) p-3"
              >
                Personajes
              </p>

              {foundCharacters.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3
                    rounded-xl p-2 hover:bg-(--surface)"
                >
                  <button
                    onClick={() => navigate(`/personajes/${person.id}`)}
                    className="flex items-center gap-3
                      flex-1 text-left min-w-0"
                  >
                    <CharacterImage
                      path={person.avatar_url}
                      className="w-11 h-11 rounded-full shrink-0"
                    />

                    <div className="min-w-0">
                      <p className="text-sm truncate">{person.name}</p>

                      <p className="text-xs text-(--muted)">@{person.handle}</p>
                    </div>
                  </button>

                  <button
                    title="Anotaciones del personaje"
                    aria-label={`Anotaciones de ${person.name}`}
                    className="p-3 text-(--accent)"
                    onClick={() => navigate(`/diario?personaje=${person.id}`)}
                  >
                    <Feather size={18} />
                  </button>

                  {isMaster && (
                    <button
                      title="Archivos privados"
                      aria-label={`Archivos privados de ${person.name}`}
                      className="p-3 text-(--gold)"
                      onClick={() =>
                        navigate(`/personajes/${person.id}/secretos`)
                      }
                    >
                      <LockKeyhole size={18} />
                    </button>
                  )}
                </div>
              ))}

              {!foundPages.length && !foundCharacters.length && (
                <p
                  className="p-8 text-center
                    text-sm text-(--muted)"
                >
                  No encontramos resultados.
                </p>
              )}
            </div>

            <footer
              className="p-4 border-t
              border-(--border) text-xs text-(--muted)"
            >
              Esc para cerrar · Ctrl + K para buscar
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
