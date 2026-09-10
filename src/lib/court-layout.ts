import type { Position } from "@/types/game";

// Percentages of the court box, locked to the SVG's 100x110 viewBox, so slots can't drift.
export const COURT_SLOT_PLACEMENT: Record<Position, string> = {
  PG: "left-[50%] top-[78%]",
  SG: "left-[15%] top-[60%]",
  SF: "left-[85%] top-[58%]",
  PF: "left-[27%] top-[27%]",
  C: "left-[62%] top-[15%]",
};

// Shared because it has to agree with the placements above: a slot is centred on its
// left-%, so anything wider than 30% hangs the 15% and 85% slots over the court's edges.
export const COURT_SLOT_WIDTH = "w-[30%]";

// Capped on width by the caller, never height — a height cap spreads the slots.
export const COURT_SHELL =
  "bg-court @container relative aspect-[100/110] w-full rounded-2xl bg-no-repeat [background-image:url(/assets/court.svg)] [background-size:100%_100%]";
