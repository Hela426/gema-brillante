"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type AcademyNotice = {
  id: string;
  title: string;
  description: string;
  href: string;
  section: string;
  created_at: string;
  is_read: boolean;
};

const noticeDate = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Bogota",
});

function errorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object" && "message" in value) return String(value.message);
  return "No se pudieron consultar las novedades.";
}

export function useAcademyNotices(pathname: string) {
  const [items, setItems] = useState<AcademyNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ count: number; initial: boolean } | null>(null);
  const mounted = useRef(false);
  const request = useRef(0);
  const marking = useRef(false);
  const loaded = useRef(false);
  const known = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current += 1; };
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!mounted.current || marking.current) return;
    const ticket = ++request.current;
    try {
      const { data, error: rpcError } = await createClient().rpc("list_academy_notifications");
      if (rpcError) throw rpcError;
      if (!Array.isArray(data)) throw new Error("La respuesta de notificaciones no es válida.");
      if (!mounted.current || ticket !== request.current) return;
      const next = data as AcademyNotice[];
      const unread = next.filter(n => !n.is_read);
      const first = !loaded.current;
      const fresh = first ? unread.length : unread.filter(n => !known.current.has(n.id)).length;
      loaded.current = true;
      known.current = new Set(next.map(n => n.id));
      setItems(next);
      setError("");
      if (!silent && fresh > 0) setToast({ count: fresh, initial: first });
    } catch (cause) {
      if (mounted.current && ticket === request.current) {
        setError(errorMessage(cause));
        // No conservamos datos de una consulta cuya autorización ya no puede comprobarse.
        setItems([]);
        setToast(null);
      }
    } finally {
      if (mounted.current && ticket === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [pathname, refresh]);

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(onFocus, 20000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mark = useCallback(async (ids: string[]) => {
    if (!ids.length) return true;
    if (marking.current || !mounted.current) return false;
    marking.current = true;
    request.current += 1; // una lectura antigua en vuelo no puede restaurar el aviso
    setBusy(true);
    setError("");
    const done = new Set<string>();
    try {
      const client = createClient();
      for (let i = 0; i < ids.length; i += 500) {
        const batch = ids.slice(i, i + 500);
        const { error: rpcError } = await client.rpc("mark_academy_notifications", { p_ids: batch });
        if (rpcError) throw rpcError;
        batch.forEach(id => done.add(id));
      }
      if (!mounted.current) return false;
      setItems(old => old.map(n => done.has(n.id) ? { ...n, is_read: true } : n));
      setToast(null);
      return true;
    } catch (cause) {
      if (mounted.current) {
        setItems(old => old.map(n => done.has(n.id) ? { ...n, is_read: true } : n));
        setError(errorMessage(cause));
      }
      return false;
    } finally {
      marking.current = false;
      if (mounted.current) {
        setBusy(false);
        setLoading(false);
        // El siguiente ciclo de consulta confirmará las lecturas y las revocaciones.
      }
    }
  }, []);

  const unread = items.filter(n => !n.is_read);
  return { items, unread, loading, error, busy, toast, refresh, mark, dismissToast: () => setToast(null) };
}

type NoticeController = ReturnType<typeof useAcademyNotices>;

export default function AcademyNotifications({
  controller, onNavigate,
}: {
  controller: NoticeController;
  onNavigate: (href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const bell = useRef<HTMLButtonElement | null>(null);
  const { items, unread, loading, error, busy, toast, refresh, mark, dismissToast } = controller;
  const visible = unreadOnly ? unread : items;

  useEffect(() => {
    if (!open) return;
    function outside(e: PointerEvent) {
      if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false);
    }
    function keyboard(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); bell.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);

  function show() {
    setOpen(true);
    dismissToast();
    void refresh();
  }

  async function visit(n: AcademyNotice) {
    if (busy) return;
    if (!n.is_read && !(await mark([n.id]))) return;
    setOpen(false);
    onNavigate(n.href);
  }

  return (
    <div ref={root} className="academy-notice-root">
      <button ref={bell} type="button" className="academy-notice-bell" aria-label={`Notificaciones: ${unread.length} sin leer`} aria-expanded={open} title="Notificaciones" onClick={() => open ? setOpen(false) : show()}>
        <Bell size={19} strokeWidth={1.6} />
        {unread.length > 0 && <span className="academy-notice-count">{unread.length > 99 ? "99+" : unread.length}</span>}
        {error && unread.length === 0 && <span className="academy-notice-error-dot" title="No se pudieron consultar los avisos">!</span>}
      </button>

      {open && (
        <section className="academy-card academy-notice-panel" aria-label="Notificaciones de la academia">
          <div className="flex items-center gap-3 p-4 border-b border-(--border)">
            <Bell size={21} className="text-(--gold) shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl leading-tight">Notificaciones</h2>
              <p className="text-xs text-(--muted) mt-1">{unread.length} sin leer</p>
            </div>
            <button type="button" aria-label="Cerrar notificaciones" onClick={() => { setOpen(false); bell.current?.focus(); }}><X size={19}/></button>
          </div>
          <div className="p-3 flex flex-wrap items-center justify-between gap-2 border-b border-(--border)">
            <div className="flex gap-1">
              <button type="button" className="academy-notice-filter" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>Todas</button>
              <button type="button" className="academy-notice-filter" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Sin leer</button>
            </div>
            <button type="button" disabled={busy || !unread.length} className="text-xs text-(--accent) inline-flex items-center gap-1" onClick={() => void mark(unread.map(n => n.id))}>
              <CheckCheck size={15}/> Marcar todas
            </button>
          </div>
          {error && <div role="alert" className="text-xs p-3 bg-(--pink) leading-5">No se pudieron actualizar las notificaciones. {error}<button type="button" className="block underline mt-2" onClick={() => void refresh()}>Reintentar</button></div>}
          <div className="academy-notice-list" aria-busy={loading || busy}>
            {loading && <p className="p-7 text-center text-sm text-(--muted)">Consultando las novedades...</p>}
            {!loading && !error && !visible.length && <div className="text-center p-8"><Bell size={28} strokeWidth={1.2} className="mx-auto text-(--gold)"/><p className="text-sm mt-3">{unreadOnly ? "No tienes avisos sin leer." : "No hay novedades por ahora."}</p><p className="text-xs text-(--muted) mt-2">Las noticias de la academia llegarán aquí.</p></div>}
            {visible.map(n => (
              <div key={n.id} className={`academy-notice-item ${n.is_read ? "" : "academy-notice-unread"}`}>
                <button type="button" disabled={busy} className="min-w-0 flex-1 text-left p-3" onClick={() => void visit(n)}>
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="academy-notice-dot" aria-hidden="true"/>}
                    <p className="text-sm font-medium break-words flex-1">{n.title}</p><ChevronRight size={16} className="text-(--muted) shrink-0"/>
                  </div>
                  <p className="text-xs leading-5 mt-1 text-(--muted) break-words">{n.description}</p>
                  <time dateTime={n.created_at} className="text-[10px] block text-(--muted) mt-2">{noticeDate.format(new Date(n.created_at))}</time>
                </button>
                {!n.is_read && <button type="button" disabled={busy} className="academy-notice-mark-one" title="Marcar como leída" aria-label={`Marcar como leída: ${n.title}`} onClick={() => void mark([n.id])}><CheckCheck size={17}/></button>}
              </div>
            ))}
          </div>
          <footer className="p-3 text-[10px] text-(--muted) border-t border-(--border)">Los avisos son privados para cada cuenta. Abrir un aviso no modifica el contenido del juego.</footer>
        </section>
      )}

      {toast && !open && (
        <div className="academy-card academy-notice-toast" role="status">
          <Bell size={22} className="text-(--gold) shrink-0"/>
          <button type="button" onClick={show} className="flex-1 text-left min-w-0">
            <p className="font-medium text-sm">{toast.initial ? "Bienvenido a Gema Brillante" : "Novedades de la academia"}</p>
            <p className="text-xs text-(--muted) leading-5">{toast.count === 1 ? "Tienes una notificación nueva o sin leer." : `Tienes ${toast.count} notificaciones ${toast.initial ? "sin leer" : "nuevas"}.`}</p>
          </button>
          <button type="button" aria-label="Cerrar aviso" onClick={dismissToast}><X size={17}/></button>
        </div>
      )}
    </div>
  );
}
