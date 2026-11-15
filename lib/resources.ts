export type Wallet = {
  id: string;
  owner_id: string;
  character_id: string | null;
  label: string;
  resolution: number;
  monologue: number;
};

export type Movement = {
  id: string;
  from_wallet: string | null;
  to_wallet: string | null;
  token_type: "resolution" | "monologue";
  movement_type: "grant" | "spend" | "transfer";
  amount: number;
  description: string | null;
  created_at: string;
};

export type ResourceCharacter = {
  id: string;
  name: string;
  owner_id: string;
  character_type: "main" | "npc";
};

export type DesireCard = {
  id: string;
  title: string;
  quote: string | null;
  description: string;
  starting_resolution: number;
};

export type DesireAssignment = {
  card_id: string;
  character_id: string;
  assigned_at: string;
};