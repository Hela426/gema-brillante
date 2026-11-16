"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  eventCategories,
  eventColors,
  eventDate,
  eventLocalValue,
  eventUtcValue,
  type AcademyEvent,
  type EventCategory,
  type EventCharacter,
  type EventInvitation,
  type EventRsvp,
} from "@/lib/events";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  LockKeyhole,
  MapPin,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";

type Props = {
  events: AcademyEvent[];
  characters: EventCharacter[];
  invitations: EventInvitation[];
  responses: EventRsvp[];
  userId: string;
  isMaster: boolean;
};

export default function EventCalendar({
  events,
  characters,
  invitations,
  responses,
  userId,
  isMaster,
}: Props) {
  const router = useRouter();

  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character] as const)),
    [characters],
  );
  const invitationsByEvent = useMemo(() => {
    const grouped = new Map<string, EventInvitation[]>();
    for (const invitation of invitations) {
      const group = grouped.get(invitation.event_id);
      if (group) group.push(invitation);
      else grouped.set(invitation.event_id, [invitation]);
    }
    return grouped;
  }, [invitations]);
  const responsesByEvent = useMemo(() => {
    const grouped = new Map<string, EventRsvp[]>();
    for (const response of responses) {
      const group = grouped.get(response.event_id);
      if (group) group.push(response);
      else grouped.set(response.event_id, [response]);
    }
    return grouped;
  }, [responses]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, AcademyEvent[]>();
    for (const event of events) {
      const date = eventLocalValue(event.starts_at).slice(0, 10);
      const group = grouped.get(date);
      if (group) group.push(event);
      else grouped.set(date, [event]);
    }
    return grouped;
  }, [events]);

  const current = eventLocalValue(new Date().toISOString());
  const [year, setYear] = useState(Number(current.slice(0, 4)));
  const [month, setMonth] = useState(Number(current.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState(current.slice(0, 10));

  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EventCategory>("ball");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [visibility, setVisibility] =
    useState<AcademyEvent["visibility"]>("public");
  const [published, setPublished] = useState(false);
  const [inviting, setInviting] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const myCharacters = characters.filter(
    (c) => c.status === "approved" && (isMaster || c.owner_id === userId),
  );

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

  const cells = Array.from(
    { length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 },
    (_, index) => index - firstWeekday + 1,
  );

  const monthTitle = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));

  function dayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function moveMonth(delta: number) {
    const target = new Date(Date.UTC(year, month + delta, 1));
    const y = target.getUTCFullYear();
    const m = target.getUTCMonth();
    setYear(y);
    setMonth(m);
    setSelectedDate(`${y}-${String(m + 1).padStart(2, "0")}-01`);
  }

  function eventsForDay(date: string) {
    return eventsByDate.get(date) ?? [];
  }

  function reset() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("ball");
    setStart("");
    setEnd("");
    setVisibility("public");
    setPublished(false);
  }

  function editEvent(event: AcademyEvent) {
    setEditing(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    setCategory(event.category);
    setStart(eventLocalValue(event.starts_at));
    setEnd(eventLocalValue(event.ends_at));
    setVisibility(event.visibility);
    setPublished(event.published);
    document
      .getElementById("event-editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function execute(fn: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !title.trim() ||
      !start ||
      !end ||
      eventUtcValue(end) <= eventUtcValue(start)
    ) {
      setError("Comprueba el título y el horario.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        starts_at: eventUtcValue(start),
        ends_at: eventUtcValue(end),
        visibility,
        published,
      };

      const result = editing
        ? await supabase
            .from("academy_events")
            .update(payload)
            .eq("id", editing)
        : await supabase
            .from("academy_events")
            .insert({ ...payload, created_by: userId });

      if (result.error) throw new Error(result.error.message);
      reset();
    }, "Evento guardado correctamente.");
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("¿Eliminar el evento y sus invitaciones?")) {
      return;
    }
    await execute(async () => {
      const { error } = await createClient()
        .from("academy_events")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    }, "Evento eliminado.");
  }

  async function invite(eventId: string) {
    const characterId = inviting[eventId];
    if (!characterId) return;

    await execute(async () => {
      const { error } = await createClient()
        .from("event_invitations")
        .insert({ event_id: eventId, character_id: characterId });

      if (error) throw new Error(error.message);
      setInviting((old) => ({ ...old, [eventId]: "" }));
    }, "Invitación enviada.");
  }

  async function removeInvitation(eventId: string, characterId: string) {
    await execute(async () => {
      const { error } = await createClient().rpc("revoke_academy_invitation", {
        p_event: eventId,
        p_character: characterId,
      });

      if (error) throw new Error(error.message);
    }, "Invitación y asistencia retiradas.");
  }

  async function respond(
    eventId: string,
    characterId: string,
    response: EventRsvp["response"],
  ) {
    await execute(async () => {
      const { error } = await createClient().rpc("respond_to_academy_event", {
        p_event: eventId,
        p_character: characterId,
        p_response: response,
      });
      if (error) throw new Error(error.message);
    }, "Asistencia actualizada.");
  }

  const selectedEvents = eventsForDay(selectedDate);

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

      <section className="academy-card p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => moveMonth(-1)}
            aria-label="Mes anterior"
            className="p-2 rounded-xl bg-(--surface)"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl capitalize">{monthTitle}</h2>
          <button
            onClick={() => moveMonth(1)}
            aria-label="Mes siguiente"
            className="p-2 rounded-xl bg-(--surface)"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <span key={d} className="text-xs text-center text-(--muted) py-2">
              {d}
            </span>
          ))}

          {cells.map((day, index) => {
            const valid = day >= 1 && day <= daysInMonth;
            const date = valid ? dayKey(day) : "";
            const items = valid ? eventsForDay(date) : [];

            return (
              <button
                key={index}
                type="button"
                disabled={!valid}
                onClick={() => setSelectedDate(date)}
                className={`min-h-16 rounded-xl p-1
                  border text-sm flex flex-col items-center gap-1
                  ${
                    date === selectedDate
                      ? "border-(--gold) bg-(--lavender)"
                      : "border-(--border) bg-(--surface)"
                  }`}
              >
                {valid && <span>{day}</span>}
                <div className="flex gap-1 flex-wrap justify-center">
                  {items.slice(0, 4).map((ev) => (
                    <span
                      key={ev.id}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: eventColors[ev.category],
                        border: "1px solid #B49B6C",
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-(--muted) mt-4">
          Selecciona un día para consultar sus acontecimientos.
        </p>
      </section>

      {isMaster && (
        <section id="event-editor" className="academy-card p-6 scroll-mt-24">
          <h2 className="text-3xl flex items-center gap-2">
            <Crown className="text-(--gold)" />
            {editing ? "Editar evento" : "Crear un evento"}
          </h2>

          <form onSubmit={saveEvent} className="mt-5">
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm">
                Título
                <input
                  required
                  maxLength={150}
                  className="academy-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                Descripción
                <textarea
                  className="academy-input min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                Lugar
                <input
                  className="academy-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  Categoría
                  <select
                    className="academy-input"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as EventCategory)
                    }
                  >
                    {Object.entries(eventCategories).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  Visibilidad
                  <select
                    className="academy-input"
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(
                        e.target.value as AcademyEvent["visibility"],
                      )
                    }
                  >
                    <option value="public">Público</option>
                    <option value="invitation">Solo invitados</option>
                  </select>
                </label>

                <label className="block text-sm">
                  Comienza
                  <input
                    required
                    type="datetime-local"
                    className="academy-input"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>

                <label className="block text-sm">
                  Termina
                  <input
                    required
                    type="datetime-local"
                    className="academy-input"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Publicar evento
              </label>

              <p className="text-xs text-(--muted)">
                Los borradores solo son visibles para Rectoría. Puedes agregar
                invitados después de crear el evento.
              </p>

              <div className="flex gap-3 flex-wrap">
                <button className="academy-button" type="submit">
                  Guardar evento
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-sm text-(--accent)"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-3xl flex items-center gap-2">
          <CalendarDays className="text-(--gold)" />
          Eventos del {selectedDate.split("-").reverse().join("/")}
        </h2>

        {!selectedEvents.length && (
          <div
            className="academy-card p-8 text-center
            text-sm text-(--muted)"
          >
            No hay acontecimientos para este día.
          </div>
        )}

        {selectedEvents.map((event) => {
          const invited = invitationsByEvent.get(event.id) ?? [];
          const invitedCharacterIds = new Set(
            invited.map((invitation) => invitation.character_id),
          );

          const eligible = myCharacters.filter(
            (character) =>
              event.visibility === "public" ||
              isMaster ||
              invitedCharacterIds.has(character.id),
          );

          const attendees = responsesByEvent.get(event.id) ?? [];
          const responsesByCharacter = new Map<string, EventRsvp>();
          const responseCounts: Record<EventRsvp["response"], number> = {
            going: 0,
            maybe: 0,
            declined: 0,
          };

          for (const response of attendees) {
            if (!responsesByCharacter.has(response.character_id)) {
              responsesByCharacter.set(response.character_id, response);
            }
            responseCounts[response.response] += 1;
          }

          const existingInvites = invitedCharacterIds;

          return (
            <article key={event.id} className="academy-card overflow-hidden">
              <div
                className="h-2"
                style={{
                  background: eventColors[event.category],
                }}
              />

              <div className="p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full bg-(--lavender)
                    px-3 py-2 text-xs"
                  >
                    {eventCategories[event.category]}
                  </span>

                  {event.visibility === "invitation" && (
                    <span className="flex items-center gap-1 text-xs">
                      <LockKeyhole size={14} /> Invitación privada
                    </span>
                  )}

                  {!event.published && (
                    <span
                      className="rounded-full bg-(--pink)
                      px-3 py-2 text-xs"
                    >
                      Borrador
                    </span>
                  )}
                </div>

                <h3 className="text-3xl">{event.title}</h3>

                <p
                  className="text-sm whitespace-pre-wrap
                  leading-7"
                >
                  {event.description}
                </p>

                <p className="text-sm flex items-center gap-2">
                  <CalendarDays size={17} />
                  {eventDate(event.starts_at)} —{eventDate(event.ends_at)}
                </p>

                {event.location && (
                  <p className="text-sm flex items-center gap-2">
                    <MapPin size={17} />
                    {event.location}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Asistirán", "going"],
                    ["Tal vez", "maybe"],
                    ["No asistirán", "declined"],
                  ].map(([label, status]) => (
                    <div key={status} className="bg-(--surface) rounded-xl p-3">
                      <p className="text-2xl">
                        {responseCounts[status as EventRsvp["response"]]}
                      </p>
                      <p className="text-xs text-(--muted)">{label}</p>
                    </div>
                  ))}
                </div>

                {event.published &&
                  eligible.map((person) => {
                    const currentResponse = responsesByCharacter.get(person.id)?.response;

                    return (
                      <div
                        key={person.id}
                        className="border-t border-(--border) pt-3"
                      >
                        <p className="text-sm mb-2">
                          Responder como <strong>{person.name}</strong>
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {[
                            ["going", "Asistiré"],
                            ["maybe", "Tal vez"],
                            ["declined", "No asistiré"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              disabled={busy}
                              onClick={() =>
                                respond(
                                  event.id,
                                  person.id,
                                  value as EventRsvp["response"],
                                )
                              }
                              className={`rounded-xl px-3 py-2 text-xs
                              ${
                                currentResponse === value
                                  ? "bg-(--lavender) border border-(--gold)"
                                  : "bg-(--surface)"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                {isMaster && (
                  <div
                    className="border-t border-(--border)
                    pt-4 space-y-3"
                  >
                    <h4 className="text-lg flex items-center gap-2">
                      <UserPlus size={18} /> Invitaciones
                    </h4>

                    <div className="flex gap-2 flex-wrap">
                      {invited.map((i) => {
                        const person = charactersById.get(i.character_id);

                        return (
                          <button
                            key={i.character_id}
                            disabled={busy}
                            onClick={() =>
                              removeInvitation(event.id, i.character_id)
                            }
                            className="rounded-xl bg-(--lavender)
                              px-3 py-2 text-xs"
                            title="Retirar invitación"
                          >
                            {person?.name || "Personaje"} ×
                          </button>
                        );
                      })}
                    </div>

                    <select
                      className="academy-input"
                      value={inviting[event.id] || ""}
                      onChange={(e) =>
                        setInviting((old) => ({
                          ...old,
                          [event.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Seleccionar invitado...</option>
                      {characters
                        .filter(
                          (c) =>
                            c.status === "approved" &&
                            !existingInvites.has(c.id),
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>

                    <button
                      disabled={busy || !inviting[event.id]}
                      className="academy-button"
                      onClick={() => invite(event.id)}
                    >
                      Enviar invitación
                    </button>

                    <div className="flex gap-3">
                      <button
                        disabled={busy}
                        className="flex items-center gap-1 text-xs"
                        onClick={() => editEvent(event)}
                      >
                        <Pencil size={16} /> Editar
                      </button>
                      <button
                        disabled={busy}
                        className="flex items-center gap-1 text-xs"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
