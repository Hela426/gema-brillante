"use client";

import { useEffect, useState } from "react";
import YouTube from "react-youtube";

import {
  ExternalLink,
  RefreshCw,
  Music2,
} from "lucide-react";

export default function YouTubePlayer({
  videoId,
}: {
  videoId: string;
}) {
  const [origin, setOrigin] = useState("");
  const [attempt, setAttempt] = useState(0);

  const [status, setStatus] =
    useState("Conectando con YouTube...");

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setOrigin(window.location.origin);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!origin || ready || error) return;

    const timer = window.setTimeout(() => {
      setError(
        "YouTube no respondió después de 15 segundos. " +
        "Comprueba tu conexión y las extensiones del navegador."
      );
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [origin, ready, error, attempt]);

  const errors: Record<number, string> = {
    2: "El identificador del video no es válido.",
    5: "No se pudo reproducir el video.",
    100: "El video es privado o fue eliminado.",
    101: "El propietario no permite integrar este video.",
    150: "Este video no permite reproducción externa.",
    153: "YouTube no reconoce la página de origen.",
  };

  function retry() {
    setReady(false);
    setError("");
    setStatus("Reconectando con YouTube...");
    setAttempt(old => old + 1);
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-2 text-sm">

        <Music2
          size={18}
          className="text-(--gold)"
        />

        <span aria-live="polite">
          {error
            ? "Reproducción no disponible"
            : status}
        </span>

      </div>

      {origin && (
        <YouTube
          key={`${videoId}-${attempt}`}
          videoId={videoId}
          className="youtube-container"
          iframeClassName="youtube-video"
          opts={{
            width: "100%",
            height: "315",
            playerVars: {
              autoplay: 0,
              controls: 1,
              playsinline: 1,
              rel: 0,
              origin,
            },
          }}
          onReady={() => {
            setReady(true);
            setError("");
            setStatus("Listo para reproducir");
          }}
          onPlay={() => {
            setStatus("Reproduciendo ♫");
          }}
          onPause={() => {
            setStatus("En pausa");
          }}
          onEnd={() => {
            setStatus("Canción finalizada");
          }}
          onStateChange={event => {
            if (event.data === 3) {
              setStatus("Cargando canción...");
            }
          }}
          onError={event => {
            setError(
              `Error ${event.data}: ` +
              (errors[event.data] ||
                "Error desconocido de YouTube.")
            );
          }}
        />
      )}

      {error && (
        <div
          role="alert"
          className="bg-(--pink)
            rounded-xl p-4 space-y-3"
        >

          <p className="text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={retry}
            className="academy-button
              flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Intentar nuevamente
          </button>

        </div>
      )}

      <a
        href={
          `https://www.youtube.com/watch?v=${videoId}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center
          justify-center gap-2 text-xs
          text-(--accent)"
      >
        <ExternalLink size={14} />
        Escuchar directamente en YouTube
      </a>

    </div>
  );
}