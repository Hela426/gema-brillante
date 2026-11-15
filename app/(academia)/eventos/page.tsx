import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import EventCalendar from "@/components/event-calendar";

import type {
  AcademyEvent,
  EventCharacter,
  EventInvitation,
  EventRsvp,
} from "@/lib/events";

import { CalendarDays, Flower2 } from "lucide-react";

async function EventsPage() {
  const { supabase, user, profile } = await requireCharacter();

  const [events, characters, invitations, responses] = await Promise.all([
    supabase.from("academy_events").select("*").order("starts_at"),

    supabase
      .from("characters")
      .select("id, name, owner_id, status")
      .eq("status", "approved")
      .order("name"),

    supabase.from("event_invitations").select("event_id, character_id"),

    supabase.from("event_rsvps").select("event_id, character_id, response"),
  ]);

  const error =
    events.error || characters.error || invitations.error || responses.error;

  if (error) throw new Error(error.message);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section
          className="academy-banner rounded-3xl
          border border-(--border) p-8"
        >
          <Flower2 size={42} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="text-xs uppercase tracking-widest
            text-(--accent) mt-4"
          >
            Academia Gema Brillante
          </p>

          <h1 className="text-5xl mt-3">El calendario de la alta sociedad</h1>

          <p className="text-sm italic text-(--muted) mt-4">
            Toda gran historia merece una ocasión inolvidable.
          </p>
        </section>

        <EventCalendar
          events={(events.data || []) as AcademyEvent[]}
          characters={(characters.data || []) as EventCharacter[]}
          invitations={(invitations.data || []) as EventInvitation[]}
          responses={(responses.data || []) as EventRsvp[]}
          userId={user.id}
          isMaster={profile.role === "master"}
        />

        <footer
          className="text-center py-6
          text-xs italic text-(--muted)"
        >
          <CalendarDays size={20} className="mx-auto mb-3 text-(--gold)" />
          Entre pétalos, promesas y celebraciones.
        </footer>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Consultando el calendario...</p>}>
      <EventsPage />
    </Suspense>
  );
}
