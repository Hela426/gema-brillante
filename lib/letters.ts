export const letterPapers = {
  ivory: {
    label: "Marfil",
    color: "#F8F5EF",
  },
  lavender: {
    label: "Lavanda",
    color: "#EEE6F5",
  },
  pink: {
    label: "Rosa",
    color: "#F4E3E8",
  },
  sage: {
    label: "Salvia",
    color: "#E4EBDF",
  },
  blue: {
    label: "Azul",
    color: "#E3EDF6",
  },
  midnight: { label: "Medianoche", color: "#292530" },
  rose: { label: "Jardín de rosas", color: "#F9E7EC" },
  wisteria: { label: "Glicinas", color: "#E7DDF5" },
  champagne: { label: "Champán", color: "#F5E5C9" },
  forest: { label: "Bosque encantado", color: "#D5E3CE" },
} as const;

export const letterSeals = {
  orchid: {
    label: "Orquídea",
    symbol: "❀",
    color: "#A18BAE",
  },
  heart: {
    label: "Corazón",
    symbol: "♥",
    color: "#B97D91",
  },
  crown: {
    label: "Corona",
    symbol: "♛",
    color: "#B49B6C",
  },
  moon: {
    label: "Luna",
    symbol: "☾",
    color: "#7184A3",
  },
  gem: {
    label: "Gema",
    symbol: "♦",
    color: "#71958B",
  },
  rose: { label: "Rosa", symbol: "✿", color: "#A64C68" },
  lily: { label: "Lirio", symbol: "⚜", color: "#AA8758" },
  butterfly: { label: "Mariposa", symbol: "🦋", color: "#8876A9" },
  star: { label: "Estrella", symbol: "✦", color: "#567995" },
  sakura: { label: "Sakura", symbol: "❀", color: "#CE7999" },
  lotus: { label: "Loto", symbol: "🪷", color: "#679488" },
} as const;

export type LetterPaper = keyof typeof letterPapers;
export type LetterSeal = keyof typeof letterSeals;

export type AcademyLetter = {
  id: string;
  sender_character_id: string | null;
  sender_name: string;
  recipient_character_id: string;
  recipient_name: string;
  subject: string;
  content: string;
  anonymous: boolean;
  paper: LetterPaper;
  seal: LetterSeal;
  status: "draft" | "sent";
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  is_sender: boolean;
  is_recipient: boolean;
  favorite: boolean;
  letter_kind: "personal" | "epistolary";
  thread_id: string | null;
  reply_to: string | null;
  epistolary_cycle: number | null;
  epistolary_phase: number | null;
};

export type LetterCharacter = {
  id: string;
  name: string;
  owner_id: string;
  avatar_url: string | null;
};
export type LetterPhase = { active: boolean; cycle: number; phase: number; used: number };
export function letterInk(paper: LetterPaper) { return paper === "midnight" ? "#F5E8D3" : "#544957"; }
