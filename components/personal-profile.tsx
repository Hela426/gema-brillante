import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Palette, Images } from "lucide-react";
import ProfileAmbience from "@/components/profile-ambience";
import { profileFlowers } from "@/lib/flowers";

import {
  profileThemes,
  profileDecorations,
  type Customization,
} from "@/lib/customization";

export default function PersonalProfile({
  settings,
  children,
  characterId,
  canEdit = false,
  preview = false,
  hideActions = false,
  introPlacement = "end",
}: {
  settings: Customization;
  children: ReactNode;
  characterId: string;
  canEdit?: boolean;
  preview?: boolean;
  hideActions?: boolean;
  introPlacement?: "end" | "inline";
}) {
  const theme = profileThemes[settings.theme];

  const flower = profileFlowers[settings.flower] || profileFlowers.orchid;

  const accent = settings.accent_color || theme.accent;

  const styles = {
    "--background": theme.background,
    "--foreground": theme.text,
    "--surface": theme.surface,
    "--card": theme.surface,
    "--muted": theme.muted,
    "--heading": theme.text,
    "--border": theme.border,
    "--lavender": theme.lavender,
    "--pink": theme.pink,
    "--sage": theme.sage,
    "--ivory": theme.background,
    "--gold": theme.accent,
    "--accent": theme.muted,
    "--profile-accent": accent,
    "--profile-radius": settings.card_style === "square" ? "5px" : "22px",
  } as CSSProperties;

  return (
    <div
      className="personal-profile p-3 md:p-5 space-y-5"
      data-pattern={settings.background_pattern}
      data-frame={settings.avatar_frame}
      style={styles}
    >
      <ProfileAmbience
        flower={settings.flower}
        effect={settings.ambient_effect}
        density={settings.effect_density}
      />
      {canEdit && !preview && !hideActions && (
        <div className="flex justify-end">
          <Link
            href={`/personajes/${characterId}/personalizar`}
            className="academy-button flex items-center
              justify-center gap-2 text-sm"
          >
            <Palette size={17} />
            Personalizar perfil
          </Link>
        </div>
      )}

      {!preview && !hideActions && (
        <Link
          href={`/personajes/${characterId}/galeria`}
          className="academy-card p-4 flex
            items-center justify-center gap-3 text-sm"
        >
          <Images size={22} className="text-(--gold)" />
          Álbum de recuerdos
        </Link>
      )}

      {children}

      {introPlacement === "end" && settings.subtitle && (
        <p
          className="text-sm text-center
          italic text-(--accent) wrap-break-word"
        >
          {settings.subtitle}
        </p>
      )}

      <div className="profile-ornament" aria-hidden="true">
        {settings.decoration === "flowers"
          ? `${flower.symbol} ───── ${flower.symbol} ───── ${flower.symbol}`
          : profileDecorations[settings.decoration]}
      </div>

      {introPlacement === "end" && settings.welcome_message && (
        <div className="profile-welcome">{settings.welcome_message}</div>
      )}
    </div>
  );
}
