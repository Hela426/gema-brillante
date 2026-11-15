"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import CharacterImageEditor from "@/components/character-image-editor";
import { frameSuffix, imageExtension, imageTypeFromPath, validateImage, type ImageDraft } from "@/lib/image-framing";
import {
  characterRoles,
  familyBackgrounds,
  safeColor,
  type Character,
} from "@/lib/characters";

import {
  Flower2,
  UserRound,
  Crown,
  BookOpen,
  Sparkles,
  Palette,
} from "lucide-react";

type Props = {
  character?: Character;
  characterType?: "main" | "npc";
  returnToSettings?: boolean;
};

export default function CharacterForm({
  character,
  characterType = "main",
  returnToSettings = false,
}: Props) {
  const [form, setForm] = useState({
    name: character?.name || "",
    handle: character?.handle || "",
    age: character?.age?.toString() || "",
    pronouns: character?.pronouns || "",
    race: character?.race || "",
    kingdom: character?.kingdom || "",
    lineage: character?.lineage || "",
    academic_year: character?.academic_year || "",
    appearance: character?.appearance || "",
    temperament: character?.temperament || "",
    character_role: character?.character_role || "",
    family_background: character?.family_background || "",
    biography: character?.biography || "",
    magic: character?.magic || "",
    combat_skills: character?.combat_skills || "",
    favorite_quote: character?.favorite_quote || "",
    theme_color: safeColor(character?.theme_color),
  });

  const [avatar, setAvatar] = useState<ImageDraft | null>(null);
  const [cover, setCover] = useState<ImageDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  type Field = keyof typeof form;

  function update(field: Field, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function field(key: Field, label: string, required = false, type = "text") {
    return (
      <label className="block text-sm">
        {label}
        <input
          className="academy-input"
          type={type}
          value={form[key]}
          required={required}
          min={type === "number" ? 0 : undefined}
          onChange={(e) => update(key, e.target.value)}
        />
      </label>
    );
  }

  function area(key: Field, label: string) {
    return (
      <label className="block text-sm">
        {label}
        <textarea
          className="academy-input min-h-32 resize-y"
          value={form[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      </label>
    );
  }

  async function saveCharacter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/acceso");
        return;
      }

      async function upload(draft: ImageDraft | null, kind: "avatar" | "cover") {
        if (!draft) return null;
        const owner = character?.owner_id || user!.id;
        if (owner !== user!.id) {
          throw new Error("Solo el propietario puede subir o reajustar imágenes.");
        }
        let file: Blob;
        if (draft.file) {
          file = draft.file;
        } else {
          const oldPath = kind === "avatar" ? character?.avatar_url : character?.cover_url;
          if (!oldPath) throw new Error("No se encuentra la imagen original.");
          const { data, error } = await supabase.storage.from("character-images").download(oldPath);
          if (error || !data) throw new Error(`No se pudo recuperar la imagen original (${kind}).`);
          file = data.type && data.type !== "application/octet-stream" ? data : new Blob([data], { type: imageTypeFromPath(oldPath) });
        }
        validateImage(file);
        const extension = imageExtension(file.type);
        const path = `${owner}/${kind}-${crypto.randomUUID()}${frameSuffix(draft.frame)}.${extension}`;
        const { error } = await supabase.storage.from("character-images").upload(path, file, {
          upsert: false, contentType: file.type, cacheControl: "3600",
        });
        if (error) throw new Error(`No se pudo subir la imagen (${kind}): ${error.message}`);
        return path;
      }

      const cleanHandle = form.handle.trim().toLowerCase().replace(/^@/, "");

      if (!/^[a-z0-9_.]{3,30}$/.test(cleanHandle)) {
        throw new Error(
          "El usuario debe tener entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.",
        );
      }

      if (!form.name.trim()) {
        throw new Error("Escribe el nombre del personaje.");
      }

      const avatarPath = await upload(avatar, "avatar");
      const coverPath = await upload(cover, "cover");

      const payload = {
        ...form,
        name: form.name.trim(),
        handle: cleanHandle,
        age: form.age === "" ? null : Number(form.age),
        avatar_url: avatarPath || character?.avatar_url || null,
        cover_url: coverPath || character?.cover_url || null,
      };

      const query = character
        ? supabase.from("characters").update(payload).eq("id", character.id)
        : supabase.from("characters").insert({
            ...payload,
            owner_id: user.id,
            character_type: characterType,
            status: characterType === "main" ? "approved" : "pending",
          });

      const { data, error } = await query.select("id").single();

      if (error) throw error;

      window.location.replace(`/personajes/${data.id}${returnToSettings && character ? "/configurar" : ""}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "No se pudo guardar el personaje.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={saveCharacter} className="space-y-6">
      <fieldset disabled={loading} className="space-y-6">
        {/* IMÁGENES */}

        <section className="academy-card overflow-hidden p-6 space-y-6">
          <CharacterImageEditor kind="cover" path={character?.cover_url} draft={cover} onChange={setCover} />
          <div className="border-t border-(--border) pt-5">
            <CharacterImageEditor kind="avatar" path={character?.avatar_url} draft={avatar} onChange={setAvatar} />
          </div>
        </section>

        {/* IDENTIDAD */}

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <UserRound size={23} className="text-(--gold)" />
            Identidad
          </h2>

          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {field("name", "Nombre completo", true)}
            {field("handle", "Nombre de usuario", true)}
            {field("age", "Edad", false, "number")}
            {field("pronouns", "Pronombres")}
            {field("race", "Raza o especie")}
            {field("academic_year", "Año académico")}
          </div>
        </section>

        {/* LINAJE */}

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <Crown size={23} className="text-(--gold)" />
            Linaje y procedencia
          </h2>

          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {field("kingdom", "Reino o plano de origen")}
            {field("lineage", "Casa o linaje")}

            <label className="block text-sm">
              Trasfondo familiar
              <input
                className="academy-input"
                list="family-backgrounds"
                value={form.family_background}
                onChange={(e) => update("family_background", e.target.value)}
              />
              <datalist id="family-backgrounds">
                {familyBackgrounds.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm">
              Rol social
              <input
                className="academy-input"
                list="character-roles"
                value={form.character_role}
                onChange={(e) => update("character_role", e.target.value)}
              />
              <datalist id="character-roles">
                {characterRoles.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </label>
          </div>
        </section>

        {/* HISTORIA */}

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <BookOpen size={23} className="text-(--gold)" />
            Historia pública
          </h2>

          <p className="text-xs text-(--muted) mt-3">
            Esta información podrá ser consultada por los demás jugadores. No
            escribas aquí los secretos de tu personaje.
          </p>

          <div className="space-y-5 mt-6">
            {area("appearance", "Apariencia")}
            {area("temperament", "Personalidad")}
            {area("biography", "Biografía pública")}
          </div>
        </section>

        {/* HABILIDADES */}

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <Sparkles size={23} className="text-(--gold)" />
            Dones y habilidades
          </h2>

          <div className="space-y-5 mt-6">
            {area("magic", "Habilidades mágicas públicas")}
            {area("combat_skills", "Habilidades de combate públicas")}
          </div>
        </section>

        {/* PERSONALIZACIÓN */}

        <section className="academy-card p-6">
          <h2 className="text-3xl flex items-center gap-3">
            <Palette size={23} className="text-(--gold)" />
            Personalización
          </h2>

          <div className="space-y-6 mt-6">
            {field("favorite_quote", "Frase favorita")}

            <label className="block text-sm">
              Color del perfil
              <div className="flex items-center gap-4 mt-3">
                <input
                  type="color"
                  value={form.theme_color}
                  onChange={(e) => update("theme_color", e.target.value)}
                  className="w-16 h-12 cursor-pointer"
                />

                <span>{form.theme_color}</span>
              </div>
            </label>

            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: form.theme_color }}
            >
              <Flower2 size={32} className="mx-auto text-[#635a68]" />

              <p
                className="font-serif text-3xl
                text-[#635a68] mt-3"
              >
                {form.name || "Tu personaje"}
              </p>

              <p className="text-xs text-[#635a68] mt-2">Vista previa</p>
            </div>
          </div>
        </section>

        {error && (
          <p role="alert" className="bg-(--pink) rounded-xl p-4 text-sm">
            {error}
          </p>
        )}

        <button type="submit" className="academy-button">
          {loading
            ? "Guardando..."
            : character
              ? "Guardar cambios"
              : characterType === "npc"
                ? "Enviar solicitud a Rectoría"
                : "Comenzar mi historia"}
        </button>
      </fieldset>
    </form>
  );
}
