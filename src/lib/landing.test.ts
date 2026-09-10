import { describe, expect, it } from "vitest";
import { PLAYERS } from "@/data/db/player";
import { PLAYER_SEASONS } from "@/data/db/player_season";
import { PLAYER_SEASON_TEAMS } from "@/data/db/player_season_team";
import { PLAYOFF_PARTICIPATION } from "@/data/db/playoff_participation";
import { TEAMS } from "@/data/db/team";
import { TEAM_SEASONS } from "@/data/db/team_season";
import { BANDS, ROUND_LABELS } from "@/lib/bracket";
import {
  DUPLICATE_EXAMPLE,
  FIRST_SEASON,
  HERO_SLOTS,
  LADDER_ROUNDS,
  LANDING_STATS,
  LAST_SEASON,
} from "@/lib/landing";
import { SQUAD_SIZE } from "@/types/game";
import type { Position } from "@/types/game";

// The landing page hardcodes what the frozen data holds; these pin it to the source.

const [PLAYER_COUNT, PLAYER_SEASON_COUNT, TEAM_SEASON_COUNT, PLAYOFF_COUNT] =
  LANDING_STATS.map((stat) => stat.value);

const teamSeasonIdOf = (slug: string, year: number) => `${slug}-${year}`;

describe("LANDING_STATS", () => {
  it("counts every table it claims to count", () => {
    expect(PLAYER_COUNT).toBe(PLAYERS.length);
    expect(PLAYER_SEASON_COUNT).toBe(PLAYER_SEASONS.length);
    expect(TEAM_SEASON_COUNT).toBe(TEAM_SEASONS.length);
    expect(PLAYOFF_COUNT).toBe(PLAYOFF_PARTICIPATION.length);
  });

  it("spans the seasons the data actually covers", () => {
    const years = TEAM_SEASONS.map((row) => row.seasonYear);

    expect(Math.min(...years)).toBe(FIRST_SEASON);
    expect(Math.max(...years)).toBe(LAST_SEASON);
    expect(LANDING_STATS[4].value).toBe(LAST_SEASON - FIRST_SEASON + 1);
  });
});

describe("HERO_SLOTS", () => {
  it("fills each of the five formation slots exactly once", () => {
    const positions: Position[] = ["PG", "SG", "SF", "PF", "C"];

    expect(HERO_SLOTS).toHaveLength(SQUAD_SIZE);
    expect(HERO_SLOTS.map((slot) => slot.position)).toEqual(positions);
  });

  it("obeys the one-player-once rule the draft enforces", () => {
    const names = HERO_SLOTS.map((slot) => slot.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it.each(HERO_SLOTS)(
    "shows $name's real $seasonYear position, rating and team",
    (slot) => {
      const player = PLAYERS.find((row) => row.fullName === slot.name);
      expect(player).toBeDefined();

      const season = PLAYER_SEASONS.find(
        (row) =>
          row.playerSlug === player?.slug && row.seasonYear === slot.seasonYear
      );
      expect(season).toMatchObject({
        position: slot.position,
        rating: slot.rating,
      });

      const teamSeasonIds = PLAYER_SEASON_TEAMS.filter(
        (row) => row.playerSeasonId === season?.id
      ).map((row) => row.teamSeasonId);
      expect(teamSeasonIds).toContain(
        teamSeasonIdOf(slot.teamSlug, slot.seasonYear)
      );

      expect(
        TEAMS.find((team) => team.slug === slot.teamSlug)?.name
      ).toBe(slot.teamName);
    }
  );
});

describe("DUPLICATE_EXAMPLE", () => {
  it("is one real player on one real team in both seasons", () => {
    const player = PLAYERS.find(
      (row) => row.fullName === DUPLICATE_EXAMPLE.name
    );
    const team = TEAMS.find(
      (row) => row.name === DUPLICATE_EXAMPLE.teamName
    );
    expect(player).toBeDefined();
    expect(team).toBeDefined();

    for (const entry of [
      DUPLICATE_EXAMPLE.taken,
      DUPLICATE_EXAMPLE.blocked,
    ]) {
      const season = PLAYER_SEASONS.find(
        (row) =>
          row.playerSlug === player?.slug &&
          row.seasonYear === entry.seasonYear
      );

      expect(season?.rating).toBe(entry.rating);
      expect(
        PLAYER_SEASON_TEAMS.some(
          (row) =>
            row.playerSeasonId === season?.id &&
            row.teamSeasonId ===
              teamSeasonIdOf(team?.slug ?? "", entry.seasonYear)
        )
      ).toBe(true);
    }
  });
});

describe("LADDER_ROUNDS", () => {
  it.each(LADDER_ROUNDS)(
    "$label shows the real $seasonYear $teamName playoff row",
    (round) => {
      const row = PLAYOFF_PARTICIPATION.find(
        (entry) => entry.id === teamSeasonIdOf(round.teamSlug, round.seasonYear)
      );

      expect(row).toMatchObject({
        conference: round.conference,
        seed: round.seed,
        roundReached: round.roundReached,
        wins: round.wins,
        losses: round.losses,
      });
      expect(
        TEAMS.find((team) => team.slug === round.teamSlug)?.name
      ).toBe(round.teamName);
    }
  );

  // The mockup's own ladder failed this — a 80-pedigree team in a band that stops at 72.
  it.each(LADDER_ROUNDS)(
    "$label opponent is actually drawable in that round",
    (round) => {
      const band = BANDS[round.round];

      expect(round.pedigree).toBeGreaterThanOrEqual(band.min);
      expect(round.pedigree).toBeLessThanOrEqual(band.max);
    }
  );

  it("gets harder every round", () => {
    const pedigrees = LADDER_ROUNDS.map((round) => round.pedigree);
    const ascending = [...pedigrees].sort((a, b) => a - b);

    expect(pedigrees).toEqual(ascending);
    expect(new Set(pedigrees).size).toBe(pedigrees.length);
  });

  it("labels each round the way the bracket does", () => {
    expect(LADDER_ROUNDS.map((round) => round.label)).toEqual(
      LADDER_ROUNDS.map((round) => ROUND_LABELS[round.round])
    );
  });

  it("walks the four rounds in bracket order, once each", () => {
    expect(LADDER_ROUNDS.map((round) => round.round)).toEqual(
      Object.keys(ROUND_LABELS)
    );
  });

  it("draws the Finals opponent from the other conference", () => {
    const path = LADDER_ROUNDS.slice(0, -1);
    const finals = LADDER_ROUNDS[LADDER_ROUNDS.length - 1];

    expect(new Set(path.map((round) => round.conference)).size).toBe(1);
    expect(finals.conference).not.toBe(path[0].conference);
  });
});
