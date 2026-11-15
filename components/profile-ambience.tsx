"use client";

import type { CSSProperties } from "react";

import { profileFlowers, type Flower, type AmbientEffect } from "@/lib/flowers";

export default function ProfileAmbience({
  flower = "orchid",
  effect = "none",
  density = 12,
}: {
  flower?: Flower;
  effect?: AmbientEffect;
  density?: number;
}) {
  if (effect === "none") return null;

  const selected = profileFlowers[flower] || profileFlowers.orchid;

  const count = Math.max(4, Math.min(24, density));

  const symbol =
    effect === "stars"
      ? "✦"
      : effect === "butterflies"
        ? "🦋"
        : effect === "hearts"
          ? "♡"
          : selected.symbol;

  return (
    <div className="profile-ambience" data-effect={effect} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={`${effect}-${flower}-${i}`}
          className="ambient-particle"
          style={
            {
              left: `${(i * 37 + 5) % 100}%`,
              top: effect === "stars" ? `${(i * 19) % 95}%` : "-50px",
              color: selected.color,
              fontSize: `${17 + (i % 5) * 5}px`,
              "--duration": `${6 + (i % 6) * 2}s`,
              "--delay": `${-i * 1.7}s`,
              "--drift": `${i % 2 === 0 ? 90 : -90}px`,
            } as CSSProperties
          }
        >
          {symbol}
        </span>
      ))}
    </div>
  );
}
