"use client";

import { useMemo, useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import CharacterImage from "@/components/character-image";
import SocialImage from "@/components/social-image";

import {
  socialDate,
  type SocialPost,
  type SocialComment,
  type SocialCharacter,
  type SocialLike,
  type SocialBookmark,
} from "@/lib/social";

import {
  Heart,
  MessageCircle,
  Bookmark,
  ImagePlus,
  Send,
  Crown,
  Pin,
  Pencil,
  Trash2,
  X,
  Flower2,
} from "lucide-react";

type Props = {
  posts: SocialPost[];
  comments: SocialComment[];
  characters: SocialCharacter[];
  likes: SocialLike[];
  bookmarks: SocialBookmark[];
  userId: string;
  isMaster: boolean;
  allowCompose?: boolean;
};

export default function SocialFeed({
  posts,
  comments,
  characters,
  likes,
  bookmarks,
  userId,
  isMaster,
  allowCompose = true,
}: Props) {
  const router = useRouter();

  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character] as const)),
    [characters],
  );
  const commentsByPost = useMemo(() => {
    const grouped = new Map<string, SocialComment[]>();
    for (const comment of comments) {
      const group = grouped.get(comment.post_id);
      if (group) group.push(comment);
      else grouped.set(comment.post_id, [comment]);
    }
    return grouped;
  }, [comments]);
  const likesByPost = useMemo(() => {
    const grouped = new Map<string, SocialLike[]>();
    for (const like of likes) {
      const group = grouped.get(like.post_id);
      if (group) group.push(like);
      else grouped.set(like.post_id, [like]);
    }
    return grouped;
  }, [likes]);
  const likedPostIds = useMemo(
    () => new Set(likes.filter((like) => like.user_id === userId).map((like) => like.post_id)),
    [likes, userId],
  );
  const bookmarkedPostIds = useMemo(
    () => new Set(bookmarks.filter((item) => item.user_id === userId).map((item) => item.post_id)),
    [bookmarks, userId],
  );

  const identities = characters.filter(
    (person) =>
      person.status === "approved" && (isMaster || person.owner_id === userId),
  );

  const [identity, setIdentity] = useState(
    isMaster ? "rectoria" : identities[0]?.id || "",
  );

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const [editing, setEditing] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");

  const [editingComment, setEditingComment] = useState<string | null>(null);

  const [editCommentContent, setEditCommentContent] = useState("");

  const [opened, setOpened] = useState<Record<string, boolean>>({});

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasIdentity =
    (isMaster && identity === "rectoria") ||
    identities.some((p) => p.id === identity);

  function activeCharacter() {
    return identity === "rectoria" ? null : identity;
  }

  function personName(characterId: string | null) {
    if (!characterId) {
      return "Rectoría de Gema Brillante";
    }

    return charactersById.get(characterId)?.name || "Personaje desconocido";
  }

  function renderAvatar(characterId: string | null, small = false) {
    const person = characterId ? charactersById.get(characterId) : undefined;

    const size = small ? "w-9 h-9" : "w-12 h-12";

    if (!characterId) {
      return (
        <div
          className={`${size} rounded-full
          bg-(--ivory) flex items-center justify-center
          border border-(--gold) shrink-0`}
        >
          <Crown size={small ? 18 : 24} className="text-(--gold)" />
        </div>
      );
    }

    return (
      <CharacterImage
        path={person?.avatar_url}
        className={`${size} rounded-full shrink-0`}
      />
    );
  }

  function renderName(characterId: string | null) {
    return characterId ? (
      <Link
        href={`/personajes/${characterId}`}
        className="font-medium hover:underline"
      >
        {personName(characterId)}
      </Link>
    ) : (
      <span className="font-medium">{personName(null)}</span>
    );
  }

  async function execute(action: () => Promise<void>, success = "") {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(selected: File) {
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensions[selected.type];

    if (!extension) {
      throw new Error("La imagen debe ser JPG, PNG o WEBP.");
    }

    if (selected.size > 5 * 1024 * 1024) {
      throw new Error("La imagen no puede superar los 5 MB.");
    }

    const path = `${userId}/${crypto.randomUUID()}.${extension}`;

    const supabase = createClient();

    const { error } = await supabase.storage
      .from("social-images")
      .upload(path, selected, {
        contentType: selected.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (error) throw new Error(error.message);

    return path;
  }

  async function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasIdentity || (!content.trim() && !file)) {
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const imagePath = file ? await uploadImage(file) : null;

      const { error } = await supabase.from("social_posts").insert({
        character_id: activeCharacter(),
        content: content.trim(),
        image_path: imagePath,
      });

      if (error) throw new Error(error.message);

      setContent("");
      setFile(null);
      setFileKey((old) => old + 1);
    }, "Publicación compartida.");
  }

  async function toggleLike(postId: string) {
    await execute(async () => {
      const supabase = createClient();

      const alreadyLiked = likedPostIds.has(postId);

      const result = alreadyLiked
        ? await supabase
            .from("social_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await supabase.from("social_likes").insert({
            post_id: postId,
            user_id: userId,
          });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });
  }

  async function toggleBookmark(postId: string) {
    await execute(async () => {
      const supabase = createClient();

      const alreadySaved = bookmarkedPostIds.has(postId);

      const result = alreadySaved
        ? await supabase
            .from("social_bookmarks")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await supabase.from("social_bookmarks").insert({
            post_id: postId,
            user_id: userId,
          });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });
  }

  async function sendComment(e: FormEvent<HTMLFormElement>, postId: string) {
    e.preventDefault();

    const body = drafts[postId]?.trim();

    if (!body || !hasIdentity) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase.from("social_comments").insert({
        post_id: postId,
        character_id: activeCharacter(),
        content: body,
      });

      if (error) throw new Error(error.message);

      setDrafts((old) => ({
        ...old,
        [postId]: "",
      }));
    }, "Comentario publicado.");
  }

  async function saveEdit(post: SocialPost) {
    if (!editContent.trim() && !post.image_path) {
      setError("La publicación no puede quedar vacía.");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("social_posts")
        .update({
          content: editContent.trim(),
        })
        .eq("id", post.id);

      if (error) throw new Error(error.message);

      setEditing(null);
    }, "Publicación actualizada.");
  }

  async function saveCommentEdit(id: string) {
    if (!editCommentContent.trim()) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("social_comments")
        .update({
          content: editCommentContent.trim(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);

      setEditingComment(null);
    }, "Comentario actualizado.");
  }

  async function togglePin(post: SocialPost) {
    await execute(
      async () => {
        const supabase = createClient();

        const { error } = await supabase
          .from("social_posts")
          .update({ pinned: !post.pinned })
          .eq("id", post.id);

        if (error) throw new Error(error.message);
      },
      post.pinned ? "Publicación desfijada." : "Publicación fijada.",
    );
  }

  async function removePost(id: string) {
    if (!window.confirm("¿Eliminar esta publicación y sus comentarios?"))
      return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    }, "Publicación eliminada.");
  }

  async function removeComment(id: string) {
    if (!window.confirm("¿Eliminar este comentario?")) return;

    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("social_comments")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    }, "Comentario eliminado.");
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="bg-(--pink) p-4 rounded-xl">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="bg-(--sage) p-4 rounded-xl">
          {message}
        </p>
      )}

      <section className="academy-card p-5">
        <div className="flex items-center gap-3">
          {renderAvatar(activeCharacter())}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-(--accent)">Identidad de rol</p>

            <select
              value={identity}
              disabled={busy}
              onChange={(e) => setIdentity(e.target.value)}
              className="academy-input"
            >
              {!hasIdentity && <option value="">Elegir personaje...</option>}

              {isMaster && (
                <option value="rectoria">Rectoría de Gema Brillante</option>
              )}

              {identities.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {allowCompose && (
          <form onSubmit={publish} className="mt-4">
            <fieldset disabled={busy} className="space-y-4">
              <textarea
                maxLength={8000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué sucede hoy en la academia?"
                className="academy-input min-h-28 resize-y"
              />

              {file && (
                <div
                  className="flex items-center gap-3
                  rounded-xl bg-(--lavender) p-3"
                >
                  <ImagePlus size={20} />

                  <p className="flex-1 truncate text-xs">{file.name}</p>

                  <button
                    type="button"
                    title="Quitar imagen"
                    onClick={() => {
                      setFile(null);
                      setFileKey((old) => old + 1);
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label
                  className="cursor-pointer
                  flex items-center gap-2
                  text-(--accent) text-sm"
                >
                  <ImagePlus size={23} />

                  <span className="hidden sm:inline">Fotografía</span>

                  <input
                    key={fileKey}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                <span className="flex-1" />

                <button
                  type="submit"
                  disabled={busy || !hasIdentity || (!content.trim() && !file)}
                  className="rounded-xl px-5 py-3
                    bg-(--lavender) text-sm
                    disabled:opacity-50"
                >
                  {busy ? "Procesando..." : "Publicar"}
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </section>

      {posts.map((post) => {
        const postLikes = likesByPost.get(post.id) ?? [];
        const liked = likedPostIds.has(post.id);
        const saved = bookmarkedPostIds.has(post.id);
        const postComments = commentsByPost.get(post.id) ?? [];

        const canEdit = isMaster || post.author_id === userId;

        const person = post.character_id ? charactersById.get(post.character_id) : undefined;

        return (
          <article key={post.id} className="academy-card p-5 space-y-4">
            {post.pinned && (
              <p
                className="flex items-center gap-2
                text-xs text-(--gold)"
              >
                <Pin size={14} />
                Publicación fijada por Rectoría
              </p>
            )}

            <header className="flex items-start gap-3">
              {renderAvatar(post.character_id)}

              <div className="flex-1 min-w-0">
                <div className="text-sm wrap-break-word">
                  {renderName(post.character_id)}
                </div>

                <p className="text-xs text-(--muted)">
                  @
                  {person?.handle ||
                    (post.character_id ? "estudiante" : "rectoria")}
                </p>

                <p
                  className="text-[10px]
                  text-(--muted) mt-1"
                >
                  {socialDate(post.created_at)}
                </p>
              </div>

              <div className="flex gap-3 text-(--accent)">
                {isMaster && (
                  <button
                    title={post.pinned ? "Desfijar" : "Fijar publicación"}
                    disabled={busy}
                    onClick={() => togglePin(post)}
                  >
                    <Pin
                      size={17}
                      fill={post.pinned ? "currentColor" : "none"}
                    />
                  </button>
                )}

                {canEdit && (
                  <>
                    <button
                      title="Editar publicación"
                      disabled={busy}
                      onClick={() => {
                        setEditing(post.id);
                        setEditContent(post.content);
                      }}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      title="Eliminar publicación"
                      disabled={busy}
                      onClick={() => removePost(post.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
              </div>
            </header>

            {editing === post.id ? (
              <div className="space-y-3">
                <textarea
                  className="academy-input min-h-28"
                  value={editContent}
                  maxLength={8000}
                  onChange={(e) => setEditContent(e.target.value)}
                />

                <div className="flex gap-3">
                  <button
                    disabled={busy}
                    className="academy-button"
                    onClick={() => saveEdit(post)}
                  >
                    Guardar cambios
                  </button>

                  <button
                    onClick={() => setEditing(null)}
                    className="text-xs text-(--accent)"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm leading-7
                whitespace-pre-wrap wrap-break-word"
              >
                {post.content}
              </p>
            )}

            {post.image_path && <SocialImage path={post.image_path} />}

            <div
              className="flex items-center gap-6
              border-t border-(--border) pt-4"
            >
              <button
                disabled={busy}
                aria-label="Me gusta"
                aria-pressed={liked}
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-2 text-sm"
              >
                <Heart
                  size={21}
                  fill={liked ? "#D28EAA" : "none"}
                  color={liked ? "#D28EAA" : "currentColor"}
                />

                {postLikes.length}
              </button>

              <button
                aria-label="Abrir comentarios"
                onClick={() =>
                  setOpened((old) => ({
                    ...old,
                    [post.id]: !old[post.id],
                  }))
                }
                className="flex items-center gap-2 text-sm"
              >
                <MessageCircle size={21} />

                {postComments.length}
              </button>

              <span className="flex-1" />

              <button
                disabled={busy}
                aria-label="Guardar publicación"
                aria-pressed={saved}
                onClick={() => toggleBookmark(post.id)}
              >
                <Bookmark
                  size={21}
                  fill={saved ? "#C6AF83" : "none"}
                  color={saved ? "#C6AF83" : "currentColor"}
                />
              </button>
            </div>

            {opened[post.id] && (
              <section
                className="border-t
                border-(--border) pt-4 space-y-4"
              >
                {postComments.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    {renderAvatar(item.character_id, true)}

                    <div
                      className="flex-1 min-w-0
                      bg-(--surface) rounded-xl p-3"
                    >
                      <div
                        className="flex items-start
                        gap-2 text-xs"
                      >
                        <div className="flex-1">
                          {renderName(item.character_id)}
                        </div>

                        {(isMaster || item.author_id === userId) && (
                          <>
                            <button
                              disabled={busy}
                              title="Editar comentario"
                              onClick={() => {
                                setEditingComment(item.id);
                                setEditCommentContent(item.content);
                              }}
                            >
                              <Pencil size={13} />
                            </button>

                            <button
                              disabled={busy}
                              title="Eliminar comentario"
                              onClick={() => removeComment(item.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>

                      {editingComment === item.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={editCommentContent}
                            maxLength={2000}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            className="academy-input"
                          />

                          <div className="flex gap-3 text-xs">
                            <button
                              disabled={busy}
                              onClick={() => saveCommentEdit(item.id)}
                            >
                              Guardar
                            </button>

                            <button onClick={() => setEditingComment(null)}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-sm mt-2
                          whitespace-pre-wrap wrap-break-word"
                        >
                          {item.content}
                        </p>
                      )}

                      <p
                        className="text-[10px]
                        text-(--muted) mt-2"
                      >
                        {socialDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                {!postComments.length && (
                  <p className="text-xs text-(--muted)">
                    Sé el primero en comentar.
                  </p>
                )}

                <form
                  onSubmit={(e) => sendComment(e, post.id)}
                  className="flex items-center gap-2"
                >
                  <div className="shrink-0">
                    {renderAvatar(activeCharacter(), true)}
                  </div>

                  <input
                    value={drafts[post.id] || ""}
                    className="academy-input flex-1 min-w-0"
                    maxLength={2000}
                    placeholder="Escribir un comentario..."
                    onChange={(e) =>
                      setDrafts((old) => ({
                        ...old,
                        [post.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="submit"
                    title="Enviar comentario"
                    disabled={busy || !hasIdentity || !drafts[post.id]?.trim()}
                    className="text-(--accent)
                      disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </section>
            )}
          </article>
        );
      })}

      {!posts.length && (
        <div className="academy-card p-10 text-center">
          <Flower2
            size={38}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <p className="text-sm mt-4 text-(--muted)">
            Todavía no hay publicaciones aquí.
          </p>
        </div>
      )}
    </div>
  );
}
