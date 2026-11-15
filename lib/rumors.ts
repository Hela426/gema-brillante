export const rumorCategories = {
  rumor: "Rumor",
  scandal: "Escándalo",
  news: "Noticia",
} as const;

export const rumorLifecycle = {
  fresh: "Reciente",
  fading: "Perdiendo fuerza",
  spread: "Propagado",
  spent: "Utilizado",
  expired: "Desvanecido",
} as const;

export const rumorTruth = {
  unconfirmed: "Sin confirmar",
  confirmed: "Confirmado",
  denied: "Desmentido",
} as const;

export const rumorStatus = {
  pending: "Pendiente",
  published: "Publicado",
  rejected: "Rechazado",
  archived: "Archivado",
} as const;

export type RumorCategory = keyof typeof rumorCategories;

export type AcademyRumor = {
  id: string;
  author_name: string;
  subject_character_id: string | null;
  title: string;
  content: string;
  category: RumorCategory;
  anonymous: boolean;
  status: keyof typeof rumorStatus;
  truth_status: keyof typeof rumorTruth;
  lifecycle: keyof typeof rumorLifecycle;
  pinned: boolean;
  moderation_note: string;
  created_at: string;
  published_at: string | null;
  is_author: boolean;
  has_token: boolean;
};

export type RumorCharacter = {
  id: string;
  name: string;
  owner_id: string;
};

export type RumorWallet = {
  id: string;
  label: string;
};