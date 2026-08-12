import type { FormationId, Position } from "@/types/game";

// Slot order is display order — the draft board and the team review render
// slots in this sequence.
export const FORMATION_SLOTS = {
  TRADITIONAL: ["PG", "SG", "SF", "PF", "C"],
} as const satisfies Record<FormationId, readonly Position[]>;

export const TRADITIONAL_SLOTS = FORMATION_SLOTS.TRADITIONAL;
