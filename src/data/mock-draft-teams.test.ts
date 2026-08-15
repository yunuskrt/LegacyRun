import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MOCK_DRAFT_TEAMS } from "@/data/mock-draft-teams";
import { teamLogoPath } from "@/lib/team-logo";

const ALL_PLAYERS = MOCK_DRAFT_TEAMS.flatMap((team) => team.players);

describe("MOCK_DRAFT_TEAMS", () => {
  it("has unique team-season ids", () => {
    const ids = MOCK_DRAFT_TEAMS.map((team) => team.teamSeasonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique player-season ids across the whole pool", () => {
    const ids = ALL_PLAYERS.map((player) => player.playerSeasonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not offer the same player twice within one team-season", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      const ids = team.players.map((player) => player.playerId);
      expect(new Set(ids).size, team.teamSeasonId).toBe(ids.length);
    }
  });

  it("derives playerSeasonId from playerId and seasonYear", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      for (const player of team.players) {
        expect(player.playerSeasonId).toBe(
          `${player.playerId}-${team.seasonYear}`
        );
      }
    }
  });

  it("keeps one identity per person across team-seasons", () => {
    const namesById = new Map<string, Set<string>>();
    for (const player of ALL_PLAYERS) {
      const names = namesById.get(player.playerId) ?? new Set<string>();
      names.add(player.name);
      namesById.set(player.playerId, names);
    }
    for (const [playerId, names] of namesById) {
      expect([...names], playerId).toHaveLength(1);
    }
  });

  it("includes at least one player in two different team-seasons", () => {
    const appearances = new Map<string, number>();
    for (const player of ALL_PLAYERS) {
      appearances.set(
        player.playerId,
        (appearances.get(player.playerId) ?? 0) + 1
      );
    }
    const repeated = [...appearances.values()].filter((count) => count > 1);
    expect(repeated.length).toBeGreaterThan(0);
  });

  it("keeps one team name and slug per franchise id", () => {
    const slugsById = new Map<string, Set<string>>();
    for (const team of MOCK_DRAFT_TEAMS) {
      const slugs = slugsById.get(team.teamId) ?? new Set<string>();
      slugs.add(`${team.teamSlug}|${team.teamName}`);
      slugsById.set(team.teamId, slugs);
    }
    for (const [teamId, slugs] of slugsById) {
      expect([...slugs], teamId).toHaveLength(1);
    }
  });

  it("builds every logo path from the team slug", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      expect(team.teamLogo).toBe(teamLogoPath(team.teamSlug));
    }
  });

  it("only uses season years the game covers", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      expect(team.seasonYear).toBeGreaterThanOrEqual(1980);
      expect(team.seasonYear).toBeLessThanOrEqual(2026);
    }
  });

  it("rates teams and players on the 0-100 band", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      expect(team.teamRating).toBeGreaterThanOrEqual(0);
      expect(team.teamRating).toBeLessThanOrEqual(100);
      for (const player of team.players) {
        expect(player.rating, player.playerSeasonId).toBeGreaterThanOrEqual(0);
        expect(player.rating, player.playerSeasonId).toBeLessThanOrEqual(100);
      }
    }
  });

  it("gives every player at least one position", () => {
    for (const player of ALL_PLAYERS) {
      expect(player.positions.length, player.playerSeasonId).toBeGreaterThan(0);
    }
  });

  it("can fill every formation slot from any offered team", () => {
    for (const team of MOCK_DRAFT_TEAMS) {
      for (const slot of TRADITIONAL_SLOTS) {
        const eligible = team.players.filter((player) =>
          player.positions.includes(slot)
        );
        expect(eligible.length, `${team.teamSeasonId} ${slot}`).toBeGreaterThan(
          0
        );
      }
    }
  });

  // "Another Season" can only ever fire if the offered franchise has a second
  // season in the pool, so every franchise carries at least two.
  it("gives every franchise at least two seasons", () => {
    const seasonsByTeamId = new Map<string, Set<number>>();
    for (const team of MOCK_DRAFT_TEAMS) {
      const seasons = seasonsByTeamId.get(team.teamId) ?? new Set<number>();
      seasons.add(team.seasonYear);
      seasonsByTeamId.set(team.teamId, seasons);
    }
    expect(seasonsByTeamId.size).toBeGreaterThanOrEqual(3);
    for (const [teamId, seasons] of seasonsByTeamId) {
      expect(seasons.size, teamId).toBeGreaterThanOrEqual(2);
    }
  });

  it("offers a deep enough roster to draft from", () => {
    expect(MOCK_DRAFT_TEAMS.length).toBeGreaterThanOrEqual(8);
    for (const team of MOCK_DRAFT_TEAMS) {
      expect(team.players.length, team.teamSeasonId).toBeGreaterThanOrEqual(8);
    }
  });
});
