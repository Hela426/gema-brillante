export const eventCategories = {
  ball: "Baile",
  ceremony: "Ceremonia",
  competition: "Competencia",
  class: "Clase",
  meeting: "Reunión",
  celebration: "Celebración",
  other: "Otro",
} as const;

export type EventCategory = keyof typeof eventCategories;

export type AcademyEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: EventCategory;
  starts_at: string;
  ends_at: string;
  visibility: "public" | "invitation";
  published: boolean;
  created_at: string;
};

export type EventCharacter = {
  id: string;
  name: string;
  owner_id: string;
  status: string;
};

export type EventInvitation = {
  event_id: string;
  character_id: string;
};

export type EventRsvp = {
  event_id: string;
  character_id: string;
  response: "going" | "maybe" | "declined";
};

export const eventColors: Record<EventCategory, string> = {
  ball: "#F4E3E8",
  ceremony: "#F8F5EF",
  competition: "#EEE6F5",
  class: "#E3EDF6",
  meeting: "#E4EBDF",
  celebration: "#F7E6D6",
  other: "#ECE9EF",
};

// La campaña utiliza el horario de Colombia (UTC-5).
// Convertimos fechas sin depender de la zona horaria
// configurada en el computador del jugador.
export function eventLocalValue(iso: string) {
  return new Date(
    new Date(iso).getTime() - 5 * 60 * 60 * 1000
  ).toISOString().slice(0, 16);
}

export function eventUtcValue(local: string) {
  return new Date(`${local}:00-05:00`).toISOString();
}

export function eventDate(iso: string) {
  const value = eventLocalValue(iso);
  const [date, time] = value.split("T");
  return `${date.split("-").reverse().join("/")} · ${time}`;
}