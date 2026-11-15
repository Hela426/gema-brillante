export const profileFlowers = {
  orchid: {
    name: "Orquídea blanca",
    symbol: "❀",
    color: "#E8DFCC",
  },
  rose: {
    name: "Rosa",
    symbol: "🌹",
    color: "#D78EAA",
  },
  lily: {
    name: "Lirio",
    symbol: "⚜",
    color: "#E8D5A0",
  },
  lycoris: {
    name: "Lycoris roja",
    symbol: "✾",
    color: "#C34158",
  },
  sakura: {
    name: "Sakura",
    symbol: "🌸",
    color: "#EAA8C5",
  },
  lavender: {
    name: "Lavanda",
    symbol: "✿",
    color: "#B5A0D5",
  },
  forgetmenot: {
    name: "Nomeolvides",
    symbol: "✽",
    color: "#8FB9E5",
  },
  camellia: {
    name: "Camelia",
    symbol: "❁",
    color: "#CB587D",
  },
  blackrose: {
    name: "Rosa negra",
    symbol: "❋",
    color: "#514256",
  },
  hydrangea: {
    name: "Hortensia",
    symbol: "✿",
    color: "#A4A6DE",
  },
  peony: {
    name: "Peonía",
    symbol: "❀",
    color: "#E5A0B9",
  },
  lotus: {
    name: "Loto",
    symbol: "🪷",
    color: "#E9BAD2",
  },
} as const;

export const ambientEffects = {
  none: "Sin animaciones",
  petals: "Flores cayendo",
  stars: "Estrellas brillantes",
  butterflies: "Mariposas flotando",
  hearts: "Corazones flotando",
} as const;

export type Flower = keyof typeof profileFlowers;

export type AmbientEffect =
  keyof typeof ambientEffects;