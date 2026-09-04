import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import {
  buildRun,
  MAX_SQUAD_NAME_LENGTH,
  normalizeSquadName,
  orderMembersBySlots,
  squadRatingOf,
} from "@/lib/run";
import type { Position, Squad, SquadMember } from "@/types/game";

const memberOf = (position: Position): SquadMember => ({
  playerSlug: `slug-${position}`,
  playerSeasonId: `slug-${position}-1996`,
  name: `Player ${position}`,
  teamName: "Chicago Bulls",
  teamSlug: "CHI",
  teamLogo: "/logos/CHI.png",
  seasonYear: 1996,
  position,
  rating: 90,
});

const drafted: SquadMember[] = [
  memberOf("C"),
  memberOf("PG"),
  memberOf("PF"),
  memberOf("SG"),
  memberOf("SF"),
];

const squadOf = (ratings: number[]): Squad => ({
  formation: "TRADITIONAL",
  players: ratings.map((rating, index) => ({
    ...memberOf(TRADITIONAL_SLOTS[index]),
    rating,
  })),
});

describe("squadRatingOf", () => {
  it("means the five ratings and rounds half up", () => {
    expect(squadRatingOf(squadOf([90, 91, 92, 93, 94]))).toBe(92);
    expect(squadRatingOf(squadOf([90, 91, 91, 91, 91]))).toBe(91);
    expect(squadRatingOf(squadOf([90, 91, 92, 92, 92]))).toBe(91);
  });

  it("averages a mixed squad", () => {
    expect(squadRatingOf(squadOf([98, 71, 70, 61, 60]))).toBe(72);
  });

  it("returns zero rather than NaN for an empty squad", () => {
    expect(squadRatingOf(squadOf([]))).toBe(0);
  });
});

describe("normalizeSquadName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeSquadName("  Dynasty Five  ")).toBe("Dynasty Five");
  });

  it("returns undefined for an empty name", () => {
    expect(normalizeSquadName("")).toBeUndefined();
  });

  it("treats a whitespace-only name as empty", () => {
    expect(normalizeSquadName("   \t \n ")).toBeUndefined();
  });

  // Spelled out on purpose — asserting the constant lets the cap move silently.
  it("caps a long name at 40 characters", () => {
    expect(MAX_SQUAD_NAME_LENGTH).toBe(40);
    expect(normalizeSquadName("x".repeat(45))).toBe("x".repeat(40));
  });

  it("caps the name at the maximum length", () => {
    const long = "a".repeat(MAX_SQUAD_NAME_LENGTH + 10);
    expect(normalizeSquadName(long)).toHaveLength(MAX_SQUAD_NAME_LENGTH);
  });

  it("trims before capping, so padding never eats real characters", () => {
    const name = `  ${"b".repeat(MAX_SQUAD_NAME_LENGTH)}  `;
    expect(normalizeSquadName(name)).toBe("b".repeat(MAX_SQUAD_NAME_LENGTH));
  });
});

describe("orderMembersBySlots", () => {
  it("reorders draft order into formation order", () => {
    const ordered = orderMembersBySlots(drafted, TRADITIONAL_SLOTS);
    expect(ordered.map((member) => member.position)).toEqual([
      ...TRADITIONAL_SLOTS,
    ]);
  });

  it("keeps every member", () => {
    const ordered = orderMembersBySlots(drafted, TRADITIONAL_SLOTS);
    expect(ordered).toHaveLength(drafted.length);
    expect(new Set(ordered)).toEqual(new Set(drafted));
  });

  it("does not mutate the input", () => {
    const input = [...drafted];
    orderMembersBySlots(input, TRADITIONAL_SLOTS);
    expect(input).toEqual(drafted);
  });

  it("appends members whose position is not a slot", () => {
    const partial: Position[] = ["PG", "SG"];
    const ordered = orderMembersBySlots(drafted, partial);
    expect(ordered.slice(0, 2).map((member) => member.position)).toEqual(
      partial
    );
    expect(ordered).toHaveLength(drafted.length);
  });
});

describe("buildRun", () => {
  it("carries every member and the conference through", () => {
    const run = buildRun(drafted, TRADITIONAL_SLOTS, "Dynasty Five", "EAST");
    expect(run.conference).toBe("EAST");
    expect(run.squad.players).toHaveLength(5);
    expect(run.squad.players.map((member) => member.position)).toEqual([
      ...TRADITIONAL_SLOTS,
    ]);
  });

  it("normalizes the squad name", () => {
    const run = buildRun(drafted, TRADITIONAL_SLOTS, "  Dynasty Five ", "WEST");
    expect(run.squad.name).toBe("Dynasty Five");
  });

  it("leaves the name undefined when none was given", () => {
    const run = buildRun(drafted, TRADITIONAL_SLOTS, "   ", "WEST");
    expect(run.squad.name).toBeUndefined();
  });

  it("leaves the squad rating undefined", () => {
    const run = buildRun(drafted, TRADITIONAL_SLOTS, "", "EAST");
    expect(run.squad.rating).toBeUndefined();
    expect(run.squad.formation).toBe("TRADITIONAL");
  });
});
