export const journalCategories = {
  note: "Nota personal",
  diary: "Diario del personaje",
  investigation: "Investigación",
  session: "Nota de sesión",
  event: "Acontecimiento",
  task: "Pendiente",
} as const;

export const journalColors = {
  lavender: "var(--lavender)",
  pink: "var(--pink)",
  sage: "var(--sage)",
  ivory: "var(--ivory)",
  blue: "var(--journal-blue)",
} as const;

export type JournalCategory =
  keyof typeof journalCategories;

export type JournalColor =
  keyof typeof journalColors;

export type JournalEntry = {
  id: string;
  author_id: string;
  character_id: string | null;
  session_id: string | null;
  title: string;
  content: string;
  category: JournalCategory;
  visibility: "private" | "master" | "public";
  color: JournalColor;
  favorite: boolean;
  created_at: string;
};

export type CampaignSession = {
  id: string;
  session_number: number;
  title: string;
  session_date: string;
  summary: string;
  published: boolean;
};

export type JournalCharacter = {
  id: string;
  name: string;
};