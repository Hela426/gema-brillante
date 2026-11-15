export const campaignPhases = [
  {
    name: "Capítulo de novela I",
    description: "Interpretar personajes y desarrollar la trama.",
    href: "/tablon",
    action: "Abrir tablón social",
  },
  {
    name: "Reputación I",
    description: "Revisar las consecuencias sociales de las escenas.",
    href: "/personajes",
    action: "Consultar personajes",
  },
  {
    name: "Rumores y escándalos",
    description: "Crear y propagar rumores de la sociedad.",
    href: "/rumores",
    action: "Abrir la gaceta",
  },
  {
    name: "Epistolar I",
    description: "Escribir cartas entre personajes.",
    href: "/correspondencia",
    action: "Abrir correspondencia",
  },
  {
    name: "Capítulo de novela II",
    description: "Continuar la historia y perseguir los deseos.",
    href: "/tablon",
    action: "Abrir tablón social",
  },
  {
    name: "Reputación II",
    description: "Revisar los cambios de reputación.",
    href: "/personajes",
    action: "Consultar personajes",
  },
  {
    name: "Epistolar II",
    description: "Completar la correspondencia del ciclo.",
    href: "/correspondencia",
    action: "Abrir correspondencia",
  },
  {
    name: "Mantenimiento",
    description: "Revisar conflictos, deseos y recursos.",
    href: "/tesoreria",
    action: "Abrir tesorería",
  },
] as const;

export const campaignStatuses = {
  preparation: "En preparación",
  running: "En curso",
  paused: "Pausada",
  finished: "Finalizada",
} as const;

export type CampaignState = {
  id: number;
  title: string;
  cycle_number: number;
  phase_number: number;
  planned_cycles: number;
  status: keyof typeof campaignStatuses;
  version: number;
  updated_at: string;
};

export type PhaseHistory = {
  id: string;
  cycle_number: number;
  phase_number: number;
  note: string;
  completed_at: string;
};

export const upkeepTasks = [
  "Utilizar los monólogos restantes en la partida.",
  "Revisar las fichas y carteras de los participantes.",
  "Establecer o desarrollar los conflictos internos.",
  "Entregar las recompensas de conflictos internos.",
  "Revisar los acuerdos de colaboración.",
  "Revisar o sustituir los deseos si corresponde.",
  "Resolver las acciones de trasfondo pendientes.",
] as const;