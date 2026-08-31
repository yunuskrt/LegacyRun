import type { Position } from "@/types/game";

// Tailwind can't build class names at runtime, so every position colour that
// reaches the DOM has to be written out here as a literal.
export const POSITION_TEXT: Record<Position, string> = {
  PG: "text-pos-pg",
  SG: "text-pos-sg",
  SF: "text-pos-sf",
  PF: "text-pos-pf",
  C: "text-pos-c",
};

export const POSITION_BORDER: Record<Position, string> = {
  PG: "border-pos-pg",
  SG: "border-pos-sg",
  SF: "border-pos-sf",
  PF: "border-pos-pf",
  C: "border-pos-c",
};

export const POSITION_BG: Record<Position, string> = {
  PG: "bg-pos-pg",
  SG: "bg-pos-sg",
  SF: "bg-pos-sf",
  PF: "bg-pos-pf",
  C: "bg-pos-c",
};

export const POSITION_SOFT_BG: Record<Position, string> = {
  PG: "bg-pos-pg/20",
  SG: "bg-pos-sg/20",
  SF: "bg-pos-sf/20",
  PF: "bg-pos-pf/20",
  C: "bg-pos-c/20",
};

export const POSITION_GLOW: Record<Position, string> = {
  PG: "shadow-[0_0_1.25rem_-0.65rem_var(--pos-pg)]",
  SG: "shadow-[0_0_1.25rem_-0.65rem_var(--pos-sg)]",
  SF: "shadow-[0_0_1.25rem_-0.65rem_var(--pos-sf)]",
  PF: "shadow-[0_0_1.25rem_-0.65rem_var(--pos-pf)]",
  C: "shadow-[0_0_1.25rem_-0.65rem_var(--pos-c)]",
};
