export const playerStyles = {
  classic: "Clásico",
  vinyl: "Vinilo",
  cassette: "Casete",
} as const;

export type MusicSettings = {
  playlist_name: string;
  player_style: keyof typeof playerStyles;
  visible: boolean;
};

export type MusicTrack = {
  id: string;
  character_id: string;
  title: string;
  artist: string;
  source_type: "youtube" | "mp3";
  source: string;
  audio_path?: string | null;
  cover_url: string;
  position: number;
  created_at: string;
};

export const defaultMusicSettings: MusicSettings = {
  playlist_name: "Mi banda sonora",
  player_style: "vinyl",
  visible: true,
};

export function youtubeId(value: string): string | null {
  const input = value.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) return null;

    let id: string | null = null;

    if (url.hostname === "youtu.be") {
      id = url.pathname.split("/")[1];
    }

    if ([
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
    ].includes(url.hostname)) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (
        /^\/(embed|shorts|live)\//.test(url.pathname)
      ) {
        id = url.pathname.split("/")[2];
      }
    }

    return id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? id
      : null;

  } catch {
    return null;
  }
}

export function safeHttps(value: string) {
  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" &&
      !url.username && !url.password
        ? url.href
        : null;

  } catch {
    return null;
  }
}

export function mp3Url(value: string) {
  const safe = safeHttps(value);

  if (!safe) return null;

  const url = new URL(safe);

  return /\.mp3$/i.test(url.pathname) &&
    !url.hash
      ? safe
      : null;
}
export const musicAudioBucket = "character-audio";
export const musicAudioMaxBytes = 10 * 1024 * 1024;
export function validateMusicFile(file: File) {
  if (!/\.mp3$/i.test(file.name) || (file.type && !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(file.type))) {
    throw new Error("Selecciona un archivo MP3 válido.");
  }
  if (!file.size || file.size > musicAudioMaxBytes) throw new Error("El MP3 debe pesar entre 1 byte y 10 MB.");
}
