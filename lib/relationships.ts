export const relationshipTypes = {
  friendship: {
    label: "Amistad",
    color: "#8DA783",
  },
  romance: {
    label: "Romance",
    color: "#D28EAA",
  },
  rivalry: {
    label: "Rivalidad",
    color: "#C77C7C",
  },
  alliance: {
    label: "Alianza",
    color: "#B8A06E",
  },
  family: {
    label: "Familia",
    color: "#86AAC9",
  },
  mentorship: {
    label: "Mentoría",
    color: "#B39BCB",
  },
  enmity: {
    label: "Enemistad",
    color: "#A698AF",
  },
  other: {
    label: "Otra",
    color: "#C5AD99",
  },
} as const;

export type RelationshipType =
  keyof typeof relationshipTypes;

export type Relationship = {
  id: string;
  character_a_id: string;
  character_b_id: string;
  title: string;
  relationship_type: RelationshipType;
  description: string;
  visibility: "public" | "secret";
  created_at: string;
};

export type RelationshipCharacter = {
  id: string;
  name: string;
  owner_id: string;
  avatar_url: string | null;
};

export type RelationshipAccess = {
  relationship_id: string;
  user_id: string;
};

export type RelationshipMember = {
  id: string;
  username: string;
};