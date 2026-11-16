import Link from "next/link";
import CharacterImage from "@/components/character-image";
import { Heart, LockKeyhole, Globe } from "lucide-react";

import {
  relationshipTypes,
  type Relationship,
  type RelationshipCharacter,
} from "@/lib/relationships";

export default function RelationshipList({
  relationships,
  characters,
}: {
  relationships: Relationship[];
  characters: RelationshipCharacter[];
}) {
  const charactersById = new Map(
    characters.map((character) => [character.id, character] as const),
  );

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {relationships.map((relation) => {
        const a = charactersById.get(relation.character_a_id);
        const b = charactersById.get(relation.character_b_id);

        const type = relationshipTypes[relation.relationship_type];

        if (!a || !b) return null;

        return (
          <article key={relation.id} className="academy-card overflow-hidden">
            <div className="h-1.5" style={{ background: type.color }} />

            <div className="p-5">
              <div className="flex justify-between gap-2">
                <span className="text-xs flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: type.color }}
                  />
                  {type.label}
                </span>

                <span
                  className="text-xs flex items-center gap-1
                  text-(--muted)"
                >
                  {relation.visibility === "secret" ? (
                    <LockKeyhole size={14} />
                  ) : (
                    <Globe size={14} />
                  )}

                  {relation.visibility === "secret" ? "Secreta" : "Pública"}
                </span>
              </div>

              <div
                className="grid grid-cols-[1fr_auto_1fr]
                items-center gap-3 my-6"
              >
                <Link
                  href={`/personajes/${a.id}`}
                  className="text-center min-w-0"
                >
                  <CharacterImage
                    path={a.avatar_url}
                    className="w-20 h-20 rounded-full
                      mx-auto border-2 border-(--gold)"
                  />

                  <p className="text-sm mt-3 wrap-break-word">{a.name}</p>
                </Link>

                <Heart
                  size={26}
                  style={{ color: type.color }}
                  strokeWidth={1.4}
                />

                <Link
                  href={`/personajes/${b.id}`}
                  className="text-center min-w-0"
                >
                  <CharacterImage
                    path={b.avatar_url}
                    className="w-20 h-20 rounded-full
                      mx-auto border-2 border-(--gold)"
                  />

                  <p className="text-sm mt-3 wrap-break-word">{b.name}</p>
                </Link>
              </div>

              <div className="floral-divider my-4">✧</div>

              <h3 className="text-2xl text-center">{relation.title}</h3>

              <p
                className="text-sm leading-7 mt-4
                whitespace-pre-wrap wrap-break-word"
              >
                {relation.description || "Sin descripción."}
              </p>
            </div>
          </article>
        );
      })}

      {!relationships.length && (
        <div
          className="academy-card p-8
          text-center md:col-span-2"
        >
          <Heart
            size={32}
            className="mx-auto text-(--gold)"
            strokeWidth={1.2}
          />

          <p className="text-sm mt-4 text-(--muted)">
            Todavía no hay relaciones disponibles.
          </p>
        </div>
      )}
    </div>
  );
}
