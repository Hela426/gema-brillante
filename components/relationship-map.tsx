"use client";

import { useState } from "react";
import Link from "next/link";
import {
  relationshipTypes,
  type Relationship,
  type RelationshipCharacter,
} from "@/lib/relationships";

export default function RelationshipMap({
  relationships,
  characters,
}: {
  relationships: Relationship[];
  characters: RelationshipCharacter[];
}) {
  const [selected, setSelected] = useState("");
  const [showSecrets, setShowSecrets] = useState(true);

  const visible = relationships.filter(
    (relation) =>
      (showSecrets || relation.visibility === "public") &&
      (!selected ||
        relation.character_a_id === selected ||
        relation.character_b_id === selected),
  );

  const ids = new Set(
    visible.flatMap((relation) => [
      relation.character_a_id,
      relation.character_b_id,
    ]),
  );

  const people = characters.filter((person) => ids.has(person.id));

  const size = Math.max(640, people.length * 45);
  const center = size / 2;
  const radius = center - 95;

  const nodes = people.map((person, index) => {
    const angle =
      (index / Math.max(people.length, 1)) * Math.PI * 2 - Math.PI / 2;

    return {
      ...person,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });

  const nodesById = new Map(nodes.map((node) => [node.id, node] as const));
  const nodeIds = new Set(nodesById.keys());

  const connections = visible.filter(
    (relation) =>
      nodeIds.has(relation.character_a_id) &&
      nodeIds.has(relation.character_b_id),
  );

  const connectionsByPair = new Map<string, Relationship[]>();
  for (const relation of connections) {
    const pair = [relation.character_a_id, relation.character_b_id].sort();
    const key = JSON.stringify(pair);
    const siblings = connectionsByPair.get(key);
    if (siblings) siblings.push(relation);
    else connectionsByPair.set(key, [relation]);
  }

  const relationOffsets = new Map<string, number>();
  for (const siblings of connectionsByPair.values()) {
    siblings.forEach((relation, index) => {
      relationOffsets.set(
        relation.id,
        (index - (siblings.length - 1) / 2) * 42,
      );
    });
  }

  return (
    <section className="academy-card p-5">
      <h2 className="text-3xl">Constelación de vínculos</h2>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <select
          className="academy-input flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Todos los personajes</option>

          {characters.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showSecrets}
            onChange={(e) => setShowSecrets(e.target.checked)}
          />
          Mostrar secretos autorizados
        </label>
      </div>

      {nodes.length > 0 ? (
        <div className="overflow-auto mt-5">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full"
            style={{ minWidth: Math.min(size, 560) }}
            aria-label="Mapa de relaciones"
          >
            {connections.map((relation) => {
              const a = nodesById.get(relation.character_a_id)!;

              const b = nodesById.get(relation.character_b_id)!;

              const type = relationshipTypes[relation.relationship_type];

              const offset = relationOffsets.get(relation.id) ?? 0;

              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const distance = Math.hypot(dx, dy) || 1;
              const direction = a.id < b.id ? 1 : -1;

              const mx = (a.x + b.x) / 2 - (dy / distance) * offset * direction;

              const my = (a.y + b.y) / 2 + (dx / distance) * offset * direction;

              return (
                <g key={relation.id}>
                  <title>{relation.title}</title>

                  <path
                    d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                    fill="none"
                    stroke={type.color}
                    strokeWidth={2.5}
                    strokeDasharray={
                      relation.visibility === "secret" ? "7 5" : undefined
                    }
                  />

                  <text
                    x={(a.x + b.x) / 4 + mx / 2}
                    y={(a.y + b.y) / 4 + my / 2 - 5}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--foreground)"
                    stroke="var(--card)"
                    strokeWidth="4"
                    paintOrder="stroke"
                  >
                    {type.label}
                  </text>
                </g>
              );
            })}

            {nodes.map((person) => (
              <g key={person.id}>
                <circle
                  cx={person.x}
                  cy={person.y}
                  r="28"
                  fill="var(--lavender)"
                  stroke="var(--gold)"
                  strokeWidth={selected === person.id ? 3 : 1.5}
                />

                <text
                  x={person.x}
                  y={person.y + 8}
                  textAnchor="middle"
                  fontSize="22"
                  fill="var(--foreground)"
                >
                  {person.name.charAt(0)}
                </text>

                <text
                  x={person.x}
                  y={person.y + 46}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--foreground)"
                >
                  {person.name.length > 22
                    ? person.name.slice(0, 21) + "…"
                    : person.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <p
          className="text-center py-12
          text-sm text-(--muted)"
        >
          No hay vínculos para mostrar.
        </p>
      )}

      <div className="flex flex-wrap gap-4 mt-5">
        {Object.entries(relationshipTypes).map(([key, type]) => (
          <span key={key} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: type.color }}
            />
            {type.label}
          </span>
        ))}
      </div>

      {selected && (
        <Link
          href={`/personajes/${selected}`}
          className="academy-button block text-center mt-5"
        >
          Abrir perfil seleccionado
        </Link>
      )}

      <p className="text-xs text-(--muted) mt-5">
        Las líneas discontinuas indican relaciones secretas que tienes permiso
        para consultar.
      </p>
    </section>
  );
}
