import { requireCharacter } from "@/lib/auth";
import SocialFeed from "@/components/social-feed";

import type {
  SocialPost,
  SocialComment,
  SocialCharacter,
  SocialLike,
  SocialBookmark,
} from "@/lib/social";

export default async function SocialPanel({
  characterId,
  savedOnly = false,
  allowCompose = true,
}: {
  characterId?: string;
  savedOnly?: boolean;
  allowCompose?: boolean;
}) {
  const { supabase, profile, user, character } = await requireCharacter();

  const isMaster = profile.role === "master";

  const [people, saved] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, handle, avatar_url, owner_id, status")
      .order("name"),

    supabase
      .from("social_bookmarks")
      .select("post_id, user_id")
      .eq("user_id", user.id),
  ]);

  if (people.error || saved.error) {
    throw new Error(people.error?.message || saved.error?.message);
  }

  const characters = (people.data || []) as SocialCharacter[];

  // Colocar el personaje principal al inicio.
  const orderedCharacters = [...characters].sort(
    (a, b) => Number(b.id === character?.id) - Number(a.id === character?.id),
  );

  const bookmarks = (saved.data || []) as SocialBookmark[];

  let query = supabase
    .from("social_posts")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (characterId) {
    query = query.eq("character_id", characterId);
  }

  if (savedOnly && bookmarks.length === 0) {
    return (
      <SocialFeed
        posts={[]}
        comments={[]}
        characters={orderedCharacters}
        likes={[]}
        bookmarks={[]}
        userId={user.id}
        isMaster={isMaster}
        allowCompose={false}
      />
    );
  }

  if (savedOnly) {
    query = query.in(
      "id",
      bookmarks.map((item) => item.post_id),
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const posts = (data || []) as SocialPost[];

  const postIds = posts.map((post) => post.id);

  let comments: SocialComment[] = [];
  let likes: SocialLike[] = [];

  if (postIds.length > 0) {
    const [commentResult, likeResult] = await Promise.all([
      supabase
        .from("social_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at"),

      supabase
        .from("social_likes")
        .select("post_id, user_id")
        .in("post_id", postIds),
    ]);

    if (commentResult.error || likeResult.error) {
      throw new Error(
        commentResult.error?.message || likeResult.error?.message,
      );
    }

    comments = (commentResult.data || []) as SocialComment[];

    likes = (likeResult.data || []) as SocialLike[];
  }

  return (
    <SocialFeed
      key={`${characterId || "all"}-${savedOnly}`}
      posts={posts}
      comments={comments}
      characters={orderedCharacters}
      likes={likes}
      bookmarks={bookmarks}
      userId={user.id}
      isMaster={isMaster}
      allowCompose={allowCompose && !savedOnly}
    />
  );
}
