import type { Flower, AmbientEffect } from "./flowers";

export const profileThemes = {
  orchid: {
    label: "Orquídea blanca",
    background: "#F8F5EF",
    surface: "#FFFFFF",
    text: "#635A68",
    muted: "#756C78",
    accent: "#B49B6C",
    border: "#DCD0BA",
    lavender: "#EEE6F5",
    pink: "#F4E3E8",
    sage: "#E4EBDF",
  },
  rose: {
    label: "Jardín de rosas",
    background: "#F4E3E8",
    surface: "#FFF8FA",
    text: "#704B5B",
    muted: "#805D6C",
    accent: "#B97D91",
    border: "#DFBEC9",
    lavender: "#F2DCE7",
    pink: "#EFD1DB",
    sage: "#E8EADB",
  },
  lavender: {
    label: "Sueño de lavanda",
    background: "#EEE6F5",
    surface: "#FAF7FF",
    text: "#63536E",
    muted: "#796989",
    accent: "#927BA8",
    border: "#D4C4E2",
    lavender: "#E2D5F0",
    pink: "#F4E3EE",
    sage: "#E2EBE0",
  },
  forest: {
    label: "Bosque encantado",
    background: "#E4EBDF",
    surface: "#F8FBF5",
    text: "#465840",
    muted: "#61725C",
    accent: "#819779",
    border: "#C1CFBA",
    lavender: "#DFE8D7",
    pink: "#F0E5DA",
    sage: "#D2E1CC",
  },
  winter: {
    label: "Luna de invierno",
    background: "#E3EDF6",
    surface: "#F5FAFF",
    text: "#465B73",
    muted: "#60758C",
    accent: "#7894B3",
    border: "#C1D3E5",
    lavender: "#DDE5F3",
    pink: "#E9E1ED",
    sage: "#DCEDEB",
  },
  midnight: {
    label: "Orquídea negra",
    background: "#25232E",
    surface: "#34303E",
    text: "#EAE1EF",
    muted: "#C0B3CA",
    accent: "#C6AF83",
    border: "#564C61",
    lavender: "#433A52",
    pink: "#503844",
    sage: "#36473F",
  },
} as const;

export const avatarFrames = {
  gold: "Dorado imperial",
  silver: "Plata lunar",
  floral: "Floral",
  none: "Sin marco",
} as const;

export const profileDecorations = {
  flowers: "❀ ───── ❀ ───── ❀",
  stars: "✧ ───── ✦ ───── ✧",
  hearts: "♡ ───── ♡ ───── ♡",
  none: "",
} as const;

export const backgroundPatterns = {
  plain: "Liso",
  dots: "Perlas",
  diamonds: "Diamantes",
  flowers: "Flores",
} as const;

export type Customization = {
  flower: Flower;
  ambient_effect: AmbientEffect;
  effect_density: number;
  theme: keyof typeof profileThemes;
  avatar_frame: keyof typeof avatarFrames;
  decoration: keyof typeof profileDecorations;
  card_style: "rounded" | "square";
  background_pattern: keyof typeof backgroundPatterns;
  accent_color: string | null;
  subtitle: string;
  welcome_message: string;
};

export const defaultCustomization: Customization = {
  theme: "orchid",
  avatar_frame: "gold",
  decoration: "flowers",
  card_style: "rounded",
  background_pattern: "plain",
  accent_color: null,
  subtitle: "",
  welcome_message: "",
  flower: "orchid",
  ambient_effect: "none",
  effect_density: 12,
};

export type CustomizableCharacter = {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  favorite_quote: string | null;
};