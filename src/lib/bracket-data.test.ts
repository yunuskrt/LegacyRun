import { describe, expect, it } from "vitest";
import { PLAYOFF_PARTICIPATION } from "@/data/db/playoff_participation";
import { TEAMS } from "@/data/db/team";
import {
  BANDS,
  FINALS_ROUNDS,
  generateBracket,
  pedigreeOf,
} from "@/lib/bracket";
import type { BracketOpponent } from "@/types/bracket";
import type { PlayoffTeamRow } from "@/lib/bracket";
import type { Conference } from "@/types/game";

// The committed playoff table, shaped exactly as src/lib/db/bracket.ts returns
// it. Nothing here touches the database.
const TEAM_NAMES = new Map(TEAMS.map((team) => [team.slug, team.name]));

const ROWS: PlayoffTeamRow[] = PLAYOFF_PARTICIPATION.map((row) => ({
  teamSlug: row.teamSlug,
  seasonYear: row.seasonYear,
  conference: row.conference,
  seed: row.seed,
  roundReached: row.roundReached,
  wins: row.wins,
  losses: row.losses,
  team: { name: TEAM_NAMES.get(row.teamSlug) ?? "" },
}));

const CONFERENCES: Conference[] = ["EAST", "WEST"];

const opponentsOf = (
  bracket: NonNullable<ReturnType<typeof generateBracket>>
): BracketOpponent[] =>
  bracket.rounds
    .flatMap((round) => round.matchups)
    .flatMap((matchup) => [matchup.home, matchup.away])
    .filter((slot) => slot?.side === "OPPONENT")
    .map((slot) => slot.opponent);

const pathOf = (bracket: NonNullable<ReturnType<typeof generateBracket>>) => {
  const bySlot = new Map(
    bracket.rounds[0].matchups
      .flatMap((matchup) => [matchup.home, matchup.away])
      .filter((slot) => slot?.side === "OPPONENT")
      .map((slot) => [slot.bracketSlot, slot.opponent])
  );

  const squadSlot = bracket.squadSlot;
  const half = [1, 8, 4, 5].includes(squadSlot) ? [1, 8, 4, 5] : [2, 7, 3, 6];
  const pedigrees = (slots: number[]) =>
    slots.map((slot) => bySlot.get(slot)?.pedigree ?? 0);

  const finals = bracket.rounds[3].matchups[0].away;

  return {
    firstRound: pedigrees([9 - squadSlot]),
    semis: pedigrees(
      half.filter((slot) => slot !== squadSlot && slot !== 9 - squadSlot)
    ),
    conferenceFinals: pedigrees(
      [1, 2, 3, 4, 5, 6, 7, 8].filter((slot) => !half.includes(slot))
    ),
    finals: finals?.side === "OPPONENT" ? finals.opponent : null,
  };
};

describe("the real playoff table", () => {
  it("covers all 46 postseasons in both conferences", () => {
    expect(ROWS).toHaveLength(724);
    expect(ROWS.every((row) => row.team.name.length > 0)).toBe(true);
  });

  it("fills every band in both conferences", () => {
    for (const conference of CONFERENCES) {
      const scored = ROWS.filter((row) => row.conference === conference).map(
        pedigreeOf
      );

      for (const band of Object.values(BANDS)) {
        const inBand = scored.filter(
          (pedigree) => pedigree >= band.min && pedigree <= band.max
        );

        // Four teams come out of the Conference Finals band in one bracket.
        expect(inBand.length).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("has enough real finalists on both sides", () => {
    for (const conference of CONFERENCES) {
      const finalists = ROWS.filter(
        (row) =>
          row.conference === conference &&
          FINALS_ROUNDS.includes(row.roundReached) &&
          pedigreeOf(row) >= BANDS.NBA_FINALS.min
      );

      expect(finalists.length).toBeGreaterThanOrEqual(40);
    }
  });
});

describe("generateBracket over the real playoff table", () => {
  const runs = CONFERENCES.flatMap((conference) =>
    Array.from({ length: 60 }, (_, index) => ({
      conference,
      squadRating: 45 + ((index * 7) % 55),
      seed: `real-${conference}-${index}`,
    }))
  );

  it("never fails to build a bracket", () => {
    for (const run of runs) {
      const bracket = generateBracket(
        ROWS,
        {
          conference: run.conference,
          squadRating: run.squadRating,
          exclude: [],
        },
        run.seed
      );

      expect(bracket, `${run.seed} produced no bracket`).not.toBeNull();
    }
  });

  it("escalates every path and keeps the field legal", () => {
    for (const run of runs) {
      const bracket = generateBracket(
        ROWS,
        {
          conference: run.conference,
          squadRating: run.squadRating,
          exclude: [],
        },
        run.seed
      );
      if (!bracket) throw new Error(`${run.seed} produced no bracket`);

      const path = pathOf(bracket);
      const opponents = opponentsOf(bracket);

      expect(Math.min(...path.semis)).toBeGreaterThan(
        Math.max(...path.firstRound)
      );
      expect(Math.min(...path.conferenceFinals)).toBeGreaterThan(
        Math.max(...path.semis)
      );
      expect(path.finals?.pedigree).toBeGreaterThan(
        Math.max(...path.conferenceFinals)
      );

      expect(opponents).toHaveLength(8);
      expect(new Set(opponents.map((o) => o.teamSlug)).size).toBe(8);
      expect(
        opponents.filter((o) => o.conference === run.conference)
      ).toHaveLength(7);
    }
  });

  it("only ever puts a real finalist in the Finals", () => {
    for (const run of runs) {
      const bracket = generateBracket(
        ROWS,
        {
          conference: run.conference,
          squadRating: run.squadRating,
          exclude: [],
        },
        run.seed
      );
      if (!bracket) throw new Error(`${run.seed} produced no bracket`);

      const finals = bracket.rounds[3].matchups[0].away;
      if (finals?.side !== "OPPONENT") throw new Error("no finals opponent");

      // The band alone would admit a conference finalist scoring 82.
      expect(FINALS_ROUNDS).toContain(finals.opponent.roundReached);
      expect(finals.opponent.conference).not.toBe(run.conference);
      expect(finals.bracketSlot).toBeNull();
    }
  });

  it("honours exclusions drawn from the real table", () => {
    const exclude = [
      "CHI-1996",
      "LAL-2020",
      "BOS-2008",
      "MIA-2013",
      "GSW-2017",
    ];

    for (const run of runs.slice(0, 20)) {
      const bracket = generateBracket(
        ROWS,
        {
          conference: run.conference,
          squadRating: run.squadRating,
          exclude,
        },
        run.seed
      );
      if (!bracket) throw new Error(`${run.seed} produced no bracket`);

      for (const opponent of opponentsOf(bracket)) {
        expect(exclude).not.toContain(opponent.teamSeasonId);
      }
    }
  });
});
