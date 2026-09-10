import { describe, expect, it } from "vitest";
import {
  COURT_SHELL,
  COURT_SLOT_PLACEMENT,
  COURT_SLOT_WIDTH,
} from "@/lib/court-layout";
import type { Position } from "@/types/game";

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

const percentIn = (className: string, prefix: string): number => {
  const match = className.match(new RegExp(`${prefix}-\\[(\\d+(?:\\.\\d+)?)%\\]`));
  if (!match) throw new Error(`no ${prefix}-[n%] in "${className}"`);
  return Number(match[1]);
};

const slotWidth = percentIn(COURT_SLOT_WIDTH, "w");

describe("COURT_SLOT_PLACEMENT", () => {
  it("places every formation slot", () => {
    expect(Object.keys(COURT_SLOT_PLACEMENT).sort()).toEqual(
      [...POSITIONS].sort()
    );
  });

  it.each(POSITIONS)("keeps %s inside the court box", (position) => {
    const className = COURT_SLOT_PLACEMENT[position];
    const left = percentIn(className, "left");
    const top = percentIn(className, "top");

    // Slots are centred on their left-%, so half the width hangs off each side.
    expect(left - slotWidth / 2).toBeGreaterThanOrEqual(0);
    expect(left + slotWidth / 2).toBeLessThanOrEqual(100);
    expect(top).toBeGreaterThan(0);
    expect(top).toBeLessThan(100);
  });

  it("gives every slot its own spot", () => {
    const spots = POSITIONS.map((position) => COURT_SLOT_PLACEMENT[position]);

    expect(new Set(spots).size).toBe(spots.length);
  });

  // The widest the outermost slots allow; anything more hangs over the edge.
  it("uses the widest slot the placements allow", () => {
    const outermost = POSITIONS.map((position) =>
      percentIn(COURT_SLOT_PLACEMENT[position], "left")
    ).reduce((tightest, left) => Math.min(tightest, left, 100 - left), 100);

    expect(slotWidth).toBe(outermost * 2);
  });
});

describe("COURT_SHELL", () => {
  // Percentage placement only holds if the box keeps the SVG's 100x110 ratio.
  it("locks the court to the court.svg viewBox ratio", () => {
    expect(COURT_SHELL).toContain("aspect-[100/110]");
    expect(COURT_SHELL).toContain("/assets/court.svg");
  });

  // The Draft Ergonomics bug: a height cap overrides the ratio and spreads the slots.
  it("caps nothing by height", () => {
    expect(COURT_SHELL).not.toMatch(/\bmax-h-/);
    expect(COURT_SHELL).not.toMatch(/\bh-\[/);
  });

  it("is a container, so slot contents can size in cqw", () => {
    expect(COURT_SHELL).toContain("@container");
  });
});
