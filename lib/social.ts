export type SocialCharacter = {
  id: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  owner_id: string;
  status: string;
};

export type SocialPost = {
  id: string;
  author_id: string;
  character_id: string | null;
  content: string;
  image_path: string | null;
  pinned: boolean;
  created_at: string;
};

export type SocialComment = {
  id: string;
  post_id: string;
  author_id: string;
  character_id: string | null;
  content: string;
  created_at: string;
};

export type SocialLike = {
  post_id: string;
  user_id: string;
};

export type SocialBookmark = {
  post_id: string;
  user_id: string;
};

export function socialDate(value: string) {
  const date = new Date(value);

  const bogota = new Date(
    date.getTime() - 5 * 60 * 60 * 1000
  );

  const iso = bogota.toISOString();

  return (
    iso.slice(0, 10).split("-").reverse().join("/") +
    " · " +
    iso.slice(11, 16)
  );
}