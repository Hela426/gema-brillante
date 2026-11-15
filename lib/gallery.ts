export type GalleryAlbum = {
  id: string;
  character_id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  created_at: string;
};

export type GalleryPhoto = {
  id: string;
  character_id: string;
  album_id: string | null;
  image_path: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  favorite: boolean;
  created_at: string;
};

export type GalleryCharacter = {
  id: string;
  name: string;
  owner_id: string;
};

export const galleryVisibilities = {
  public: "Público",
  private: "Privado",
} as const;