"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import CharacterImage from "@/components/character-image";
import PersonalProfile from "@/components/personal-profile";

import {
  profileThemes,
  nightProfileThemes,
  resolveNightTheme,
  type NightProfileTheme,
  avatarFrames,
  profileDecorations,
  backgroundPatterns,
  defaultCustomization,
  type Customization,
  type CustomizableCharacter,
} from "@/lib/customization";

import {
  profileFlowers,
  ambientEffects,
  type Flower,
  type AmbientEffect,
} from "@/lib/flowers";

import {
  Palette,
  Save,
  RotateCcw,
  ArrowLeft,
  Flower2,
  Eye,
} from "lucide-react";

export default function ProfileCustomizer({
  character,
  initialSettings,
  embedded = false,
}: {
  character: CustomizableCharacter;
  initialSettings: Customization;
  embedded?: boolean;
}) {
  const router = useRouter();

  const [settings, setSettings] = useState<Customization>(() => ({
    ...defaultCustomization,
    ...initialSettings,
  }));
  const nightTheme = resolveNightTheme(settings);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function change<K extends keyof Customization>(
    key: K,
    value: Customization[K],
  ) {
    setSettings((old) => ({
      ...old,
      [key]: value,
    }));
    setMessage("");
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await createClient()
        .from("character_customizations")
        .upsert(
          {
            ...settings,
            character_id: character.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "character_id",
          },
        );

      if (error) throw new Error(error.message);

      setMessage("Tu perfil ha sido personalizado.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setBusy(false);
    }
  }

  function restore() {
    setSettings({ ...defaultCustomization });
    setMessage("");
    setError("");
  }

  return (
    <div className="space-y-5">
      {!embedded && (
      <Link
        href={`/personajes/${character.id}`}
        className="flex items-center gap-2
          text-sm text-(--accent)"
      >
        <ArrowLeft size={17} />
        Volver a mi perfil
      </Link>
      )}

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

      <div
        className="grid xl:grid-cols-2 gap-6
        items-start"
      >
        {/* ───── EDITOR ───── */}

        <section className="academy-card p-5 space-y-6">
          <h2 className="text-3xl flex items-center gap-3">
            <Palette className="text-(--gold)" />
            Mi estética
          </h2>

          <fieldset disabled={busy} className="space-y-5">
            <div className="profile-palette-day space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">☀ Tema diurno</h3>
                <p className="text-xs text-(--muted)">Elige los colores de tu perfil durante el día. Cambia el tema general de la academia para editar los colores nocturnos.</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(profileThemes).map(([id, theme]) => (
                    <button key={id} type="button"
                      aria-pressed={settings.theme === id}
                      className="profile-theme-option p-2"
                      onClick={() => change("theme", id as Customization["theme"])}>
                      <div className="flex gap-1 h-12">
                        {[theme.background, theme.surface, theme.accent].map((color, index) => (
                          <div key={index} className="flex-1 rounded-md" style={{ background: color }} />
                        ))}
                      </div>
                      <p className="text-xs mt-2">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm">
                Color decorativo diurno
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <input type="color" className="w-12 h-12 cursor-pointer"
                    value={settings.accent_color || profileThemes[settings.theme].accent}
                    onChange={(e) => change("accent_color", e.target.value)} />
                  <span className="text-sm">{settings.accent_color || profileThemes[settings.theme].accent}</span>
                  <button type="button" className="text-xs text-(--accent)"
                    onClick={() => change("accent_color", null)}>Usar color del tema</button>
                </div>
              </label>
            </div>

            <div className="profile-palette-night space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">☾ Tema nocturno</h3>
                <p className="text-xs text-(--muted)">Tu perfil se adapta al modo de quien lo visita. La elección nocturna no modifica el tema diurno.</p>
                <button type="button" className="profile-theme-option w-full p-3 text-left"
                  aria-pressed={!settings.night_theme}
                  onClick={() => change("night_theme", null)}>
                  <span className="block text-sm">✧ Automático · Variante de mi tema diurno</span>
                  <span className="block text-xs text-(--muted) mt-1">{nightProfileThemes[resolveNightTheme({ theme: settings.theme, night_theme: null })].label}</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(nightProfileThemes).map(([id, theme]) => (
                    <button key={id} type="button"
                      aria-pressed={settings.night_theme === id}
                      className="profile-theme-option p-2"
                      onClick={() => change("night_theme", id as NightProfileTheme)}>
                      <div className="flex gap-1 h-12">
                        {[theme.background, theme.surface, theme.accent].map((color, index) => (
                          <div key={index} className="flex-1 rounded-md" style={{ background: color }} />
                        ))}
                      </div>
                      <p className="text-xs mt-2">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm">
                Color decorativo nocturno
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <input type="color" className="w-12 h-12 cursor-pointer"
                    value={settings.night_accent_color || nightProfileThemes[nightTheme].accent}
                    onChange={(e) => change("night_accent_color", e.target.value)} />
                  <span className="text-sm">{settings.night_accent_color || nightProfileThemes[nightTheme].accent}</span>
                  <button type="button" className="text-xs text-(--accent)"
                    onClick={() => change("night_accent_color", null)}>Usar color del tema</button>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl">Mi jardín personal</h3>

              <p className="text-xs text-(--muted)">
                Cada flor tiene una historia. Elige aquella que represente tu
                esencia.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(profileFlowers).map(([id, flower]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={settings.flower === id}
                    className={`botanical-option relative ${
                      settings.flower === id ? "botanical-selected" : ""
                    }`}
                    onClick={() => change("flower", id as Flower)}
                  >
                    {settings.flower === id && (
                      <span
                        className="absolute top-2 right-2
          text-(--gold) text-sm"
                      >
                        ✓
                      </span>
                    )}

                    <div className="text-4xl" style={{ color: flower.color }}>
                      {flower.symbol}
                    </div>

                    <p className="text-xs mt-3">{flower.name}</p>

                    <p className="text-xs mt-2 text-(--accent)">
                      {settings.flower === id ? "Seleccionada" : "\u00A0"}
                    </p>
                  </button>
                ))}
              </div>

              <label className="block text-sm">
                Efectos ambientales
                <select
                  className="academy-input"
                  value={settings.ambient_effect}
                  onChange={(e) =>
                    change("ambient_effect", e.target.value as AmbientEffect)
                  }
                >
                  {Object.entries(ambientEffects).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {settings.ambient_effect !== "none" && (
                <label className="block text-sm">
                  Intensidad de las animaciones
                  <input
                    type="range"
                    min={4}
                    max={24}
                    step={1}
                    value={settings.effect_density}
                    onChange={(e) =>
                      change("effect_density", Number(e.target.value))
                    }
                    className="w-full mt-4 accent-(--gold)"
                  />
                  <div
                    className="flex justify-between
        text-xs text-(--muted) mt-2"
                  >
                    <span>Sutil</span>

                    <span>{settings.effect_density}</span>

                    <span>Abundante</span>
                  </div>
                </label>
              )}
            </div>

            <label className="block text-sm">
              Marco del avatar
              <select
                className="academy-input"
                value={settings.avatar_frame}
                onChange={(e) =>
                  change(
                    "avatar_frame",
                    e.target.value as Customization["avatar_frame"],
                  )
                }
              >
                {Object.entries(avatarFrames).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Decoración
              <select
                className="academy-input"
                value={settings.decoration}
                onChange={(e) =>
                  change(
                    "decoration",
                    e.target.value as Customization["decoration"],
                  )
                }
              >
                {Object.entries(profileDecorations).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label || "Sin decoración"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Patrón de fondo
              <select
                className="academy-input"
                value={settings.background_pattern}
                onChange={(e) =>
                  change(
                    "background_pattern",
                    e.target.value as Customization["background_pattern"],
                  )
                }
              >
                {Object.entries(backgroundPatterns).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Estilo de las tarjetas
              <select
                className="academy-input"
                value={settings.card_style}
                onChange={(e) =>
                  change(
                    "card_style",
                    e.target.value as Customization["card_style"],
                  )
                }
              >
                <option value="rounded">Redondeadas</option>

                <option value="square">Clásicas</option>
              </select>
            </label>

            <label className="block text-sm">
              Lema personal
              <input
                className="academy-input"
                maxLength={100}
                value={settings.subtitle}
                onChange={(e) => change("subtitle", e.target.value)}
                placeholder="La orquídea de la noche..."
              />
              <span className="text-xs text-(--muted)">
                {settings.subtitle.length}/100
              </span>
            </label>

            <label className="block text-sm">
              Mensaje de bienvenida
              <textarea
                className="academy-input min-h-32"
                value={settings.welcome_message}
                maxLength={500}
                onChange={(e) => change("welcome_message", e.target.value)}
                placeholder="Bienvenido a mi pequeño jardín..."
              />
              <span className="text-xs text-(--muted)">
                {settings.welcome_message.length}/500
              </span>
            </label>

            <p className="text-xs text-(--muted)">
              El lema y el mensaje de bienvenida serán visibles para quienes
              puedan consultar este perfil.
            </p>

            <button
              type="button"
              onClick={restore}
              className="flex items-center gap-2
                text-sm text-(--accent)"
            >
              <RotateCcw size={17} />
              Restaurar diseño original (día y noche)
            </button>

            <button
              type="button"
              onClick={save}
              className="academy-button w-full flex
                items-center justify-center gap-2"
            >
              <Save size={18} />

              {busy ? "Guardando..." : "Guardar personalización"}
            </button>
          </fieldset>
        </section>

        {/* ───── VISTA PREVIA ───── */}

        <section
          className="space-y-3
          xl:sticky xl:top-24"
        >
          <h2 className="text-2xl flex items-center gap-2">
            <Eye size={20} />
            Vista previa
          </h2>

          <PersonalProfile
            settings={settings}
            characterId={character.id}
            preview
          >
            <div className="academy-card overflow-hidden">
              {character.cover_url ? (
                <CharacterImage
                  path={character.cover_url}
                  kind="cover"
                  className="profile-cover w-full h-40 object-cover"
                />
              ) : (
                <div className="academy-banner h-40" />
              )}

              <div className="p-5 text-center">
                <CharacterImage
                  path={character.avatar_url}
                  className="profile-avatar-frame
                    w-28 h-28 mx-auto object-cover"
                />

                <h2
                  className="text-3xl mt-5
                  wrap-break-word"
                >
                  {character.name}
                </h2>

                {character.handle && (
                  <p className="text-xs text-(--muted) mt-2">
                    @{character.handle}
                  </p>
                )}

                {character.favorite_quote && (
                  <p
                    className="italic text-sm
                    mt-4 wrap-break-word"
                  >
                    «{character.favorite_quote}»
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <article className="academy-card p-4">
                <Flower2 className="text-(--gold)" size={22} />

                <h3 className="text-xl mt-3">Sobre mí</h3>

                <p className="text-xs mt-3">
                  Mi pequeño rincón de la academia.
                </p>
              </article>

              <article className="academy-card p-4">
                <h3 className="text-xl">Recuerdos</h3>

                <p className="text-xs mt-3">
                  Cada día guarda una nueva historia.
                </p>
              </article>
            </div>
          </PersonalProfile>

          <p className="text-xs text-(--muted)">
            Los cambios de esta vista no se publicarán hasta que presiones
            Guardar personalización.
          </p>
        </section>
      </div>
    </div>
  );
}
