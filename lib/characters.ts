export type Character = {
  id: string;
  owner_id: string;

  name: string;
  handle: string | null;

  character_type: "main" | "npc";
  status: "pending" | "approved" | "rejected";

  age: number | null;
  pronouns: string | null;
  race: string | null;
  kingdom: string | null;
  lineage: string | null;
  academic_year: string | null;

  appearance: string | null;
  temperament: string | null;

  character_role: string | null;
  family_background: string | null;

  biography: string | null;
  magic: string | null;
  combat_skills: string | null;

  avatar_url: string | null;
  cover_url: string | null;
  favorite_quote: string | null;

  positive_reputation: string[];
  negative_reputation: string[];

  theme_color: string | null;
  created_at: string;
};

export const characterRoles = [
  "La figura social",
  "El heredero",
  "El dependiente",
  "El romántico",
  "El recién llegado",
  "El rival",
  "El rebelde",
  "El erudito",
  "El prodigio",
  "Otro",
];

export const familyBackgrounds = [
  "Realeza",
  "Alta nobleza",
  "Baja nobleza",
  "Vieja fortuna",
  "Nueva fortuna",
  "Linaje mágico",
  "Linaje militar",
  "Familia de comerciantes",
  "Orígenes humildes",
  "Origen desconocido",
  "Otro",
];

export function safeColor(color?: string | null) {
  return /^#[0-9a-fA-F]{6}$/.test(color || "")
    ? color!
    : "#EEE6F5";
}