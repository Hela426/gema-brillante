export const personalityMoods = {
  none: { label: "Sin estado", symbol: "－" },
  happy: { label: "Feliz", symbol: "🌸" },
  dreamy: { label: "Soñando", symbol: "☾" },
  love: { label: "Enamoramiento", symbol: "♡" },
  sad: { label: "Melancolía", symbol: "☁" },
  inspired: { label: "Inspiración", symbol: "✦" },
  tired: { label: "Cansancio", symbol: "☕" },
  ambitious: { label: "Ambición", symbol: "♛" },
  mysterious: { label: "Misterio", symbol: "♠" },
} as const;

export type PersonalityMood =
  keyof typeof personalityMoods;

export type Personality = {
  mood: PersonalityMood;
  status_text: string;
  likes: string;
  dislikes: string;
  hobbies: string;
  obsessions: string;
  favorite_quote: string;

  show_status: boolean;
  show_likes: boolean;
  show_dislikes: boolean;
  show_hobbies: boolean;
  show_obsessions: boolean;
  show_quote: boolean;
};

export const defaultPersonality: Personality = {
  mood: "none",
  status_text: "",
  likes: "",
  dislikes: "",
  hobbies: "",
  obsessions: "",
  favorite_quote: "",

  show_status: true,
  show_likes: true,
  show_dislikes: true,
  show_hobbies: true,
  show_obsessions: true,
  show_quote: true,
};

export const personalityFields = [
  {
    key: "likes",
    visible: "show_likes",
    label: "Me encanta",
    symbol: "♡",
    placeholder: "Las flores\nEl té\nLa poesía",
  },
  {
    key: "dislikes",
    visible: "show_dislikes",
    label: "No me gusta",
    symbol: "♠",
    placeholder: "Las mentiras\nEl ruido",
  },
  {
    key: "hobbies",
    visible: "show_hobbies",
    label: "Mis aficiones",
    symbol: "✧",
    placeholder: "Pintura\nPiano\nJardinería",
  },
  {
    key: "obsessions",
    visible: "show_obsessions",
    label: "Mis pequeñas obsesiones",
    symbol: "❀",
    placeholder: "Las novelas románticas\nLas mariposas",
  },
] as const;