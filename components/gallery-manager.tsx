"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GalleryImage from "@/components/gallery-image";

import type {
  GalleryAlbum,
  GalleryPhoto,
  GalleryCharacter,
} from "@/lib/gallery";

import {
  Images,
  Camera,
  FolderHeart,
  Heart,
  LockKeyhole,
  Pencil,
  Trash2,
  X,
  Flower2,
  Search,
  Grid2X2,
  LayoutGrid,
  List,
} from "lucide-react";

type Props = {
  character: GalleryCharacter;
  albums: GalleryAlbum[];
  photos: GalleryPhoto[];
  userId: string;
  canEdit: boolean;
};

export default function GalleryManager({
  character,
  albums,
  photos,
  userId,
  canEdit,
}: Props) {
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [albumFilter, setAlbumFilter] = useState("");
  const [search, setSearch] = useState("");

  const [layout, setLayout] = useState<"polaroid" | "grid" | "list">(
    "polaroid",
  );

  const [editor, setEditor] = useState<"album" | "photo" | null>(null);

  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [albumId, setAlbumId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [opened, setOpened] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<GalleryPhoto | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const openedPhoto = photos.find((photo) => photo.id === opened);

  const selectedAlbum = albums.find((album) => album.id === albumId);

  const visiblePhotos = photos.filter((photo) => {
    if (tab === "favorites" && !photo.favorite) {
      return false;
    }

    if (albumFilter && photo.album_id !== albumFilter) return false;

    const text = `${photo.title} ${photo.description}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  async function execute(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(success);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la operación.",
      );
    } finally {
      router.refresh();
      setBusy(false);
    }
  }

  function resetEditor() {
    setEditor(null);
    setEditingAlbum(null);
    setEditingPhoto(null);
    setTitle("");
    setDescription("");
    setVisibility("public");
    setAlbumId("");
    setFile(null);
  }

  function newAlbum() {
    resetEditor();
    setEditor("album");
  }

  function newPhoto() {
    resetEditor();
    setAlbumId(albumFilter);
    setEditor("photo");
  }

  function editAlbum(album: GalleryAlbum) {
    resetEditor();
    setEditingAlbum(album.id);
    setTitle(album.title);
    setDescription(album.description);
    setVisibility(album.visibility);
    setEditor("album");
  }

  function editPhoto(photo: GalleryPhoto) {
    resetEditor();
    setEditingPhoto(photo.id);
    setTitle(photo.title);
    setDescription(photo.description);
    setVisibility(photo.visibility);
    setAlbumId(photo.album_id || "");
    setEditor("photo");
    setOpened(null);
  }

  async function saveAlbum(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibility,
      };

      const result = editingAlbum
        ? await supabase
            .from("character_albums")
            .update(payload)
            .eq("id", editingAlbum)
        : await supabase.from("character_albums").insert({
            ...payload,
            character_id: character.id,
          });

      if (result.error) {
        throw new Error(result.error.message);
      }

      resetEditor();
      setTab("albums");
    }, "Álbum guardado correctamente.");
  }

  async function savePhoto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    await execute(async () => {
      const supabase = createClient();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibility,
        album_id: albumId || null,
      };

      if (editingPhoto) {
        const { error } = await supabase
          .from("character_photos")
          .update(payload)
          .eq("id", editingPhoto);

        if (error) throw new Error(error.message);
      } else {
        if (!file) {
          throw new Error("Selecciona una fotografía.");
        }

        const extensions: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };

        const extension = extensions[file.type];

        if (!extension) {
          throw new Error("Utiliza una imagen JPG, PNG o WebP.");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("La imagen supera los 5 MB.");
        }

        const path =
          `${userId}/${character.id}/` + `${crypto.randomUUID()}.${extension}`;

        const upload = await supabase.storage
          .from("gallery-images")
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: "60",
          });

        if (upload.error) {
          console.error("Error de almacenamiento:", upload.error);

          throw new Error("Error al subir la imagen: " + upload.error.message);
        }

        const { error } = await supabase.from("character_photos").insert({
          ...payload,
          character_id: character.id,
          image_path: path,
        });

        if (error) {
          console.error("Error al registrar fotografía:", error);

          await supabase.storage.from("gallery-images").remove([path]);

          throw new Error("Error al registrar la fotografía: " + error.message);
        }
      }

      resetEditor();
      setTab("all");
      setAlbumFilter("");
    }, "Recuerdo guardado correctamente.");
  }

  async function toggleFavorite(photo: GalleryPhoto) {
    await execute(async () => {
      const { error } = await createClient()
        .from("character_photos")
        .update({
          favorite: !photo.favorite,
        })
        .eq("id", photo.id);

      if (error) throw new Error(error.message);
    }, "Recuerdos favoritos actualizados.");
  }

  async function deletePhoto(photo: GalleryPhoto) {
    await execute(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("character_photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw new Error(error.message);

      setDeleting(null);
      setOpened(null);

      const cleanup = await supabase.storage
        .from("gallery-images")
        .remove([photo.image_path]);

      if (cleanup.error) {
        throw new Error(
          "El recuerdo se eliminó de la galería, " +
            "pero no se pudo retirar el archivo del almacenamiento.",
        );
      }
    }, "Recuerdo eliminado.");
  }

  const tabs = [
    ["all", "Todas"],
    ["albums", "Álbumes"],
    ["favorites", "Favoritas"],
  ];

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="bg-(--pink) rounded-xl p-4 text-sm">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="bg-(--sage) rounded-xl p-4 text-sm">
          {message}
        </p>
      )}

      <section className="academy-card p-6 text-center">
        <Images size={40} strokeWidth={1.2} className="mx-auto text-(--gold)" />

        <h2 className="text-4xl mt-4">Mi álbum de recuerdos</h2>

        <p
          className="italic text-sm
          text-(--muted) mt-3"
        >
          Hay momentos que merecen vivir para siempre.
        </p>

        <div className="floral-divider my-5">❀</div>

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Fotografías", photos.length],
            ["Álbumes", albums.length],
            ["Favoritas", photos.filter((p) => p.favorite).length],
          ].map(([label, count]) => (
            <div key={label} className="bg-(--surface) rounded-xl p-3">
              <p className="text-3xl">{count}</p>
              <p className="text-xs mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={newPhoto}
            className="academy-button flex
              items-center gap-2"
          >
            <Camera size={18} />
            Subir fotografía
          </button>

          <button
            disabled={busy}
            onClick={newAlbum}
            className="bg-(--surface) border
              border-(--border) rounded-xl px-5
              py-3 text-sm flex items-center gap-2"
          >
            <FolderHeart size={18} />
            Crear álbum
          </button>
        </div>
      )}

      {canEdit && editor && (
        <section className="academy-card p-6">
          <div
            className="flex items-center
            justify-between gap-3"
          >
            <h2 className="text-3xl">
              {editor === "album"
                ? editingAlbum
                  ? "Editar álbum"
                  : "Un nuevo álbum"
                : editingPhoto
                  ? "Editar recuerdo"
                  : "Capturar un recuerdo"}
            </h2>

            <button
              aria-label="Cerrar editor"
              disabled={busy}
              onClick={resetEditor}
            >
              <X size={22} />
            </button>
          </div>

          <form
            onSubmit={editor === "album" ? saveAlbum : savePhoto}
            className="mt-5"
          >
            <fieldset disabled={busy} className="space-y-4">
              {editor === "photo" && !editingPhoto && (
                <label className="block text-sm">
                  Fotografía
                  <input
                    required
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="academy-input"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-xs text-(--muted)">
                    JPG, PNG o WebP. Máximo 5 MB.
                  </span>
                </label>
              )}

              <label className="block text-sm">
                Título
                <input
                  required
                  maxLength={editor === "album" ? 100 : 150}
                  className="academy-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Un momento inolvidable..."
                />
              </label>

              <label className="block text-sm">
                Descripción
                <textarea
                  className="academy-input min-h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribe algo sobre este recuerdo..."
                />
              </label>

              {editor === "photo" && (
                <label className="block text-sm">
                  Álbum
                  <select
                    className="academy-input"
                    value={albumId}
                    onChange={(e) => setAlbumId(e.target.value)}
                  >
                    <option value="">Sin álbum</option>

                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-sm">
                Visibilidad
                <select
                  className="academy-input"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "public" | "private")
                  }
                >
                  <option value="public">Público</option>
                  <option value="private">Privado</option>
                </select>
              </label>

              {editor === "photo" &&
                selectedAlbum?.visibility === "private" && (
                  <p className="text-xs text-(--muted)">
                    Este álbum es privado. La fotografía también permanecerá
                    oculta a visitantes.
                  </p>
                )}

              <button type="submit" className="academy-button w-full">
                {busy ? "Guardando..." : "Guardar"}
              </button>
            </fieldset>
          </form>
        </section>
      )}

      <section className="academy-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setAlbumFilter("");
              }}
              className={`rounded-xl px-4 py-3 text-sm ${
                tab === id ? "bg-(--lavender)" : "bg-(--surface)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab !== "albums" && (
          <>
            <div className="flex items-center gap-3">
              <Search size={19} />

              <input
                className="academy-input flex-1 min-w-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar recuerdos..."
              />
            </div>

            <select
              className="academy-input"
              value={albumFilter}
              onChange={(e) => setAlbumFilter(e.target.value)}
            >
              <option value="">Todos los álbumes</option>

              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                title="Estilo polaroid"
                aria-pressed={layout === "polaroid"}
                onClick={() => setLayout("polaroid")}
                className="bg-(--surface) rounded-xl p-3"
              >
                <LayoutGrid size={19} />
              </button>

              <button
                title="Cuadrícula"
                aria-pressed={layout === "grid"}
                onClick={() => setLayout("grid")}
                className="bg-(--surface) rounded-xl p-3"
              >
                <Grid2X2 size={19} />
              </button>

              <button
                title="Lista"
                aria-pressed={layout === "list"}
                onClick={() => setLayout("list")}
                className="bg-(--surface) rounded-xl p-3"
              >
                <List size={19} />
              </button>
            </div>
          </>
        )}
      </section>

      {tab === "albums" ? (
        <div
          className="grid sm:grid-cols-2
          lg:grid-cols-3 gap-4"
        >
          {albums.map((album) => {
            const items = photos.filter((p) => p.album_id === album.id);

            return (
              <article key={album.id} className="academy-card overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => {
                    setTab("all");
                    setAlbumFilter(album.id);
                    setSearch("");
                  }}
                >
                  {items[0] ? (
                    <GalleryImage
                      path={items[0].image_path}
                      alt={album.title}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div
                      className="h-44 bg-(--lavender)
                      flex items-center justify-center"
                    >
                      <FolderHeart size={50} className="text-(--accent)" />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="text-2xl">{album.title}</h3>

                    <p className="text-xs text-(--muted) mt-2">
                      {items.length} fotografías
                    </p>

                    <p
                      className="text-xs mt-3
                      whitespace-pre-wrap wrap-break-word"
                    >
                      {album.description}
                    </p>

                    {album.visibility === "private" && (
                      <p
                        className="text-xs mt-3
                        flex items-center gap-1"
                      >
                        <LockKeyhole size={14} /> Privado
                      </p>
                    )}
                  </div>
                </button>

                {canEdit && (
                  <button
                    disabled={busy}
                    onClick={() => editAlbum(album)}
                    className="text-xs flex gap-2
                      items-center p-4"
                  >
                    <Pencil size={15} />
                    Editar álbum
                  </button>
                )}
              </article>
            );
          })}

          {!albums.length && (
            <p className="text-sm text-(--muted)">Todavía no hay álbumes.</p>
          )}
        </div>
      ) : (
        <div
          className={
            layout === "list"
              ? "space-y-4"
              : "grid grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {visiblePhotos.map((photo) => {
            const isPrivate =
              photo.visibility === "private" ||
              albums.some(
                (a) => a.id === photo.album_id && a.visibility === "private",
              );

            return (
              <article
                key={photo.id}
                className={`academy-card ${
                  layout === "polaroid" ? "gallery-polaroid" : "overflow-hidden"
                }`}
              >
                <button
                  className="block w-full"
                  onClick={() => setOpened(photo.id)}
                  aria-label={`Abrir ${photo.title}`}
                >
                  <GalleryImage
                    path={photo.image_path}
                    alt={photo.title}
                    className={
                      layout === "list"
                        ? "w-full max-h-80 object-contain"
                        : "w-full aspect-square object-cover"
                    }
                  />
                </button>

                <div className="p-3 space-y-2">
                  <h3 className="text-xl wrap-break-word">{photo.title}</h3>

                  <p
                    className="text-xs text-(--muted)
                    wrap-break-word"
                  >
                    {photo.description}
                  </p>

                  <div
                    className="flex items-center
                    justify-between gap-2 flex-wrap"
                  >
                    {isPrivate && (
                      <span
                        className="flex items-center
                        gap-1 text-xs"
                      >
                        <LockKeyhole size={13} /> Privado
                      </span>
                    )}

                    {canEdit ? (
                      <button
                        disabled={busy}
                        title="Marcar como favorita"
                        aria-pressed={photo.favorite}
                        onClick={() => toggleFavorite(photo)}
                      >
                        <Heart
                          size={19}
                          fill={photo.favorite ? "#B97D91" : "none"}
                          color="#B97D91"
                        />
                      </button>
                    ) : photo.favorite ? (
                      <Heart size={17} color="#B97D91" fill="#B97D91" />
                    ) : null}

                    {canEdit && (
                      <>
                        <button
                          disabled={busy}
                          title="Editar fotografía"
                          onClick={() => editPhoto(photo)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          disabled={busy}
                          title="Eliminar fotografía"
                          onClick={() => setDeleting(photo)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-(--muted)">
                    {photo.created_at
                      .slice(0, 10)
                      .split("-")
                      .reverse()
                      .join("/")}
                  </p>
                </div>
              </article>
            );
          })}

          {!visiblePhotos.length && (
            <div
              className="academy-card p-8
              text-center col-span-full"
            >
              <Flower2 size={35} className="mx-auto text-(--gold)" />
              <p className="text-sm text-(--muted) mt-4">
                Todavía no hay recuerdos para mostrar.
              </p>
            </div>
          )}
        </div>
      )}

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50
          bg-black/70 p-4 flex items-center
          justify-center overflow-y-auto"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={openedPhoto.title}
            className="academy-card w-full max-w-3xl
              max-h-[90vh] overflow-y-auto p-5"
          >
            <div
              className="flex justify-between
              items-center mb-4 gap-3"
            >
              <h2 className="text-2xl">{openedPhoto.title}</h2>

              <button
                aria-label="Cerrar fotografía"
                onClick={() => setOpened(null)}
              >
                <X size={24} />
              </button>
            </div>

            <GalleryImage
              path={openedPhoto.image_path}
              alt={openedPhoto.title}
              className="w-full max-h-[65vh] object-contain"
            />

            <p
              className="text-sm mt-4
              whitespace-pre-wrap wrap-break-word"
            >
              {openedPhoto.description}
            </p>
          </div>
        </div>
      )}

      {canEdit && deleting && (
        <div
          className="academy-card p-6
          border border-(--gold) space-y-4"
        >
          <h2 className="text-3xl">¿Despedir este recuerdo?</h2>

          <p className="text-sm">
            Se eliminará la fotografía «{deleting.title}».
          </p>

          <p className="text-xs text-(--muted)">
            Esta acción no puede deshacerse.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => setDeleting(null)}
              className="academy-button"
            >
              Cancelar
            </button>

            <button
              disabled={busy}
              onClick={() => deletePhoto(deleting)}
              className="bg-(--pink)
                rounded-xl px-5 py-3 text-sm"
            >
              Eliminar fotografía
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
