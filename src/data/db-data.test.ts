import { describe, expect, it } from "vitest";
import { PLAYERS } from "@/data/db/player";
import { PLAYER_SEASONS } from "@/data/db/player_season";
import { PLAYER_SEASON_DATA } from "@/data/db/player_season_data";
import { PLAYER_SEASON_TEAMS } from "@/data/db/player_season_team";
import { PLAYOFF_PARTICIPATION } from "@/data/db/playoff_participation";
import { TEAMS } from "@/data/db/team";
import { TEAM_SEASONS } from "@/data/db/team_season";
import type { Position } from "@/generated/prisma/enums";

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

// Mirrors scripts/build-db-data.mts. Kept as an independent reimplementation so
// a change to the rating engine has to be made deliberately in both places.
const LINEUP_WEIGHTS = [0.32, 0.24, 0.19, 0.14, 0.11];
const RATING_FLOOR = 35;
const RATING_CEILING = 99;
const RATING_STEEPNESS = 1.15;

const playerSlugs = new Set(PLAYERS.map((player) => player.slug));
const teamSlugs = new Set(TEAMS.map((team) => team.slug));
const teamSeasonIds = new Set(TEAM_SEASONS.map((row) => row.id));
const playerSeasonIds = new Set(PLAYER_SEASONS.map((row) => row.id));

describe("generated db data", () => {
  it("has the expected row count per table", () => {
    expect(PLAYERS).toHaveLength(3755);
    expect(TEAMS).toHaveLength(40);
    expect(TEAM_SEASONS).toHaveLength(1292);
    expect(PLAYER_SEASONS).toHaveLength(20260);
    expect(PLAYER_SEASON_TEAMS).toHaveLength(22705);
    expect(PLAYER_SEASON_DATA).toHaveLength(20260);
    expect(PLAYOFF_PARTICIPATION).toHaveLength(0);
  });

  it("keys every table by a unique identifier", () => {
    expect(playerSlugs.size).toBe(PLAYERS.length);
    expect(teamSlugs.size).toBe(TEAMS.length);
    expect(teamSeasonIds.size).toBe(TEAM_SEASONS.length);
    expect(playerSeasonIds.size).toBe(PLAYER_SEASONS.length);
  });
});

describe("player.ts", () => {
  it("gives every player a non-empty name", () => {
    const unnamed = PLAYERS.filter((player) => player.fullName.trim() === "");
    expect(unnamed).toEqual([]);
  });
});

describe("team.ts", () => {
  it("assigns every team a name and a valid conference", () => {
    for (const team of TEAMS) {
      expect(team.name, team.slug).not.toBe("");
      expect(["EAST", "WEST"], team.slug).toContain(team.conference);
    }
  });

  it("keeps relocated franchises as separate rows", () => {
    for (const slug of ["SEA", "OKC", "VAN", "MEM", "WSB", "WAS"])
      expect(teamSlugs, slug).toContain(slug);
    expect(TEAMS.find((team) => team.slug === "SEA")?.name).toBe(
      "Seattle SuperSonics"
    );
  });
});

describe("team_season.ts", () => {
  it("derives id from teamSlug and seasonYear", () => {
    for (const row of TEAM_SEASONS)
      expect(row.id).toBe(`${row.teamSlug}-${row.seasonYear}`);
  });

  it("references a known team", () => {
    for (const row of TEAM_SEASONS)
      expect(teamSlugs, row.id).toContain(row.teamSlug);
  });

  it("rates every team-season as an integer inside the band", () => {
    for (const row of TEAM_SEASONS) {
      expect(Number.isInteger(row.rating), row.id).toBe(true);
      expect(row.rating, row.id).toBeGreaterThanOrEqual(RATING_FLOOR);
      expect(row.rating, row.id).toBeLessThanOrEqual(RATING_CEILING);
    }
  });

  it("spans the band instead of clustering, and reaches the elite tier", () => {
    const ratings = TEAM_SEASONS.map((row) => row.rating);
    const elite = ratings.filter((rating) => rating >= 90);
    expect(elite.length).toBeGreaterThan(0);
    expect(Math.max(...ratings) - Math.min(...ratings)).toBeGreaterThan(50);
  });

  it("derives every rating from five distinct players, filling absent positions", () => {
    const seasonsById = new Map(PLAYER_SEASONS.map((row) => [row.id, row]));
    const rosters = new Map<string, typeof PLAYER_SEASONS>();
    for (const link of PLAYER_SEASON_TEAMS) {
      const player = seasonsById.get(link.playerSeasonId);
      if (!player)
        throw new Error(`unknown player-season ${link.playerSeasonId}`);
      const roster = rosters.get(link.teamSeasonId);
      if (roster) roster.push(player);
      else rosters.set(link.teamSeasonId, [player]);
    }

    const raw = TEAM_SEASONS.map((row) => {
      const ranked = [...(rosters.get(row.id) ?? [])].sort(
        (a, b) =>
          b.rating - a.rating || a.playerSlug.localeCompare(b.playerSlug)
      );
      const used = new Set<string>();
      const lineup: number[] = [];
      for (const position of POSITIONS) {
        const best = ranked.find(
          (player) =>
            player.position === position && !used.has(player.playerSlug)
        );
        if (best) {
          lineup.push(best.rating);
          used.add(best.playerSlug);
        }
      }
      for (const player of ranked) {
        if (lineup.length === 5) break;
        if (used.has(player.playerSlug)) continue;
        lineup.push(player.rating);
        used.add(player.playerSlug);
      }
      expect(lineup, row.id).toHaveLength(5);
      return lineup
        .sort((a, b) => b - a)
        .reduce(
          (sum, rating, index) => sum + rating * LINEUP_WEIGHTS[index],
          0
        );
    });

    const mean = raw.reduce((sum, value) => sum + value, 0) / raw.length;
    const deviation = Math.sqrt(
      raw.reduce((sum, value) => sum + (value - mean) ** 2, 0) / raw.length
    );

    TEAM_SEASONS.forEach((row, index) => {
      const z = (raw[index] - mean) / deviation;
      const expected = Math.round(
        RATING_FLOOR +
          (RATING_CEILING - RATING_FLOOR) /
            (1 + Math.exp(-RATING_STEEPNESS * z))
      );
      expect(row.rating, row.id).toBe(expected);
    });
  });

  it("covers the two rosters with no listed SF", () => {
    for (const id of ["LAL-2020", "MEM-2025"])
      expect(teamSeasonIds).toContain(id);
  });
});

describe("player_season.ts", () => {
  it("derives id from playerSlug and seasonYear", () => {
    for (const row of PLAYER_SEASONS)
      expect(row.id).toBe(`${row.playerSlug}-${row.seasonYear}`);
  });

  it("references a known player", () => {
    for (const row of PLAYER_SEASONS)
      expect(playerSlugs, row.id).toContain(row.playerSlug);
  });

  it("assigns only Position enum values", () => {
    const offenders = PLAYER_SEASONS.filter(
      (row) => !POSITIONS.includes(row.position)
    ).map((row) => `${row.id}:${row.position}`);
    expect(offenders).toEqual([]);
  });

  it("never repeats a player within one season", () => {
    const seen = new Set<string>();
    for (const row of PLAYER_SEASONS) {
      const key = `${row.seasonYear}:${row.playerSlug}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});

describe("player_season_team.ts", () => {
  it("resolves both sides of every join row", () => {
    for (const row of PLAYER_SEASON_TEAMS) {
      expect(playerSeasonIds, row.playerSeasonId).toContain(row.playerSeasonId);
      expect(teamSeasonIds, row.teamSeasonId).toContain(row.teamSeasonId);
    }
  });

  it("keeps each player-season/team-season pair unique", () => {
    const pairs = new Set(
      PLAYER_SEASON_TEAMS.map(
        (row) => `${row.playerSeasonId}|${row.teamSeasonId}`
      )
    );
    expect(pairs.size).toBe(PLAYER_SEASON_TEAMS.length);
  });

  it("links every player-season to at least one team-season", () => {
    const linked = new Set(
      PLAYER_SEASON_TEAMS.map((row) => row.playerSeasonId)
    );
    expect(linked.size).toBe(PLAYER_SEASONS.length);
  });

  it("has more rows than player-seasons, because traded players repeat", () => {
    expect(PLAYER_SEASON_TEAMS.length).toBeGreaterThan(PLAYER_SEASONS.length);
  });
});

describe("player_season_data.ts", () => {
  it("holds exactly one audit row per player-season", () => {
    const ids = new Set(PLAYER_SEASON_DATA.map((row) => row.playerSeasonId));
    expect(ids.size).toBe(PLAYER_SEASON_DATA.length);
    for (const row of PLAYER_SEASON_DATA)
      expect(playerSeasonIds, row.playerSeasonId).toContain(row.playerSeasonId);
  });

  it("always carries rank, games and minutes", () => {
    for (const row of PLAYER_SEASON_DATA) {
      expect(Number.isInteger(row.rank), row.playerSeasonId).toBe(true);
      expect(Number.isInteger(row.gamesPlayed), row.playerSeasonId).toBe(true);
      expect(Number.isInteger(row.minutesPlayed), row.playerSeasonId).toBe(
        true
      );
    }
  });
});
