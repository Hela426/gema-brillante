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

export const nightProfileThemes = {
  "orchid": {
    "label": "Orquídea blanca · Noche",
    "background": "#19171F",
    "surface": "#25212C",
    "text": "#E8DFF1",
    "muted": "#C3B8CD",
    "accent": "#C8AD82",
    "border": "#50465A",
    "lavender": "#393043",
    "pink": "#49313D",
    "sage": "#31443B"
  },
  "rose": {
    "label": "Jardín de rosas · Noche",
    "background": "#24171E",
    "surface": "#31212B",
    "text": "#F1D6E0",
    "muted": "#D2B2C0",
    "accent": "#DA9CB2",
    "border": "#654252",
    "lavender": "#52303D",
    "pink": "#58313F",
    "sage": "#364539"
  },
  "lavender": {
    "label": "Sueño de lavanda · Noche",
    "background": "#1D192D",
    "surface": "#29233D",
    "text": "#E5D9F7",
    "muted": "#C7B8E2",
    "accent": "#B7A0E1",
    "border": "#55486F",
    "lavender": "#403659",
    "pink": "#50364E",
    "sage": "#33483F"
  },
  "forest": {
    "label": "Bosque encantado · Noche",
    "background": "#151E19",
    "surface": "#202D25",
    "text": "#DAEBDC",
    "muted": "#B7CDBB",
    "accent": "#92B59A",
    "border": "#435B4C",
    "lavender": "#304638",
    "pink": "#4D3540",
    "sage": "#35513E"
  },
  "winter": {
    "label": "Luna de invierno · Noche",
    "background": "#141E2B",
    "surface": "#202E40",
    "text": "#DAE9F9",
    "muted": "#B7CDE3",
    "accent": "#92BADD",
    "border": "#435C75",
    "lavender": "#30455D",
    "pink": "#48364D",
    "sage": "#2D4B4C"
  },
  "midnight": {
    "label": "Medianoche",
    "background": "#101019",
    "surface": "#1B1B2B",
    "text": "#E1E0F5",
    "muted": "#BDBAD7",
    "accent": "#A3A0CF",
    "border": "#46465D",
    "lavender": "#303047",
    "pink": "#403044",
    "sage": "#2D433D"
  },
  "cherry": {
    "label": "Licor de cerezas",
    "background": "#200F18",
    "surface": "#321923",
    "text": "#F5D7DE",
    "muted": "#D8B5C1",
    "accent": "#D28B9C",
    "border": "#663747",
    "lavender": "#542630",
    "pink": "#632C40",
    "sage": "#3E4540"
  },
  "amethyst": {
    "label": "Amatista lunar",
    "background": "#1B1228",
    "surface": "#30203F",
    "text": "#EAD4FF",
    "muted": "#CDB5E4",
    "accent": "#BA91E2",
    "border": "#65477E",
    "lavender": "#4B3063",
    "pink": "#50334F",
    "sage": "#344A43"
  },
  "abyss": {
    "label": "Abismo celestial",
    "background": "#0D1726",
    "surface": "#172638",
    "text": "#D5EDFF",
    "muted": "#AFCBDF",
    "accent": "#81BEDA",
    "border": "#365972",
    "lavender": "#243C54",
    "pink": "#43344B",
    "sage": "#234946"
  },
  "velvet": {
    "label": "Oro y terciopelo",
    "background": "#191615",
    "surface": "#2A2420",
    "text": "#F5E5CD",
    "muted": "#D0BFA7",
    "accent": "#D5AF70",
    "border": "#5F4D39",
    "lavender": "#403329",
    "pink": "#4D3335",
    "sage": "#39473B"
  },
  "jade": {
    "label": "Jade nocturno",
    "background": "#0E201F",
    "surface": "#18332F",
    "text": "#D6F1E8",
    "muted": "#AFD3C7",
    "accent": "#80C2AE",
    "border": "#39675C",
    "lavender": "#245047",
    "pink": "#4A3540",
    "sage": "#285449"
  },
  "black_orchid": {
    "label": "Orquídea negra",
    "background": "#111014",
    "surface": "#201D24",
    "text": "#F1E6F4",
    "muted": "#D1BDD7",
    "accent": "#C79ACD",
    "border": "#514358",
    "lavender": "#362A3E",
    "pink": "#492C43",
    "sage": "#30423B"
  }
} as const;

export type NightProfileTheme = keyof typeof nightProfileThemes;

// Null inherits the night version of the current daytime palette.
export function resolveNightTheme(settings: Pick<Customization, "theme" | "night_theme">): NightProfileTheme {
  const preferred = settings.night_theme ?? settings.theme;
  return Object.prototype.hasOwnProperty.call(nightProfileThemes, preferred)
    ? preferred as NightProfileTheme
    : "orchid";
}

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
  night_theme?: NightProfileTheme | null;
  night_accent_color?: string | null;
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
  night_theme: null,
  night_accent_color: null,
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