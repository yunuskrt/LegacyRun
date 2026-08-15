import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MOCK_DRAFT_TEAMS } from "@/data/mock-draft-teams";
import { MOCK_SQUAD } from "@/data/mock-squad";
import { teamLogoPath } from "@/lib/team-logo";
import { SQUAD_SIZE } from "@/types/game";

describe("MOCK_SQUAD", () => {
  it("is exactly one full formation", () => {
    expect(MOCK_SQUAD.players).toHaveLength(SQUAD_SIZE);
    expect(MOCK_SQUAD.formation).toBe("TRADITIONAL");
  });

  it("fills each formation slot once", () => {
    const slots = MOCK_SQUAD.players.map((player) => player.position);
    expect([...slots].sort()).toEqual([...TRADITIONAL_SLOTS].sort());
  });

  it("never repeats a player identity", () => {
    const ids = MOCK_SQUAD.players.map((player) => player.playerSlug);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("drafts only player-seasons that exist in the draft pool", () => {
    for (const player of MOCK_SQUAD.players) {
      const source = MOCK_DRAFT_TEAMS.find(
        (team) =>
          team.teamSlug === player.teamSlug &&
          team.seasonYear === player.seasonYear
      );
      expect(source, player.playerSeasonId).toBeDefined();
      const offered = source?.players.find(
        (candidate) => candidate.playerSeasonId === player.playerSeasonId
      );
      expect(offered, player.playerSeasonId).toBeDefined();
      expect(offered?.rating).toBe(player.rating);
      expect(offered?.position).toBe(player.position);
    }
  });

  it("builds every logo path from the team slug", () => {
    for (const player of MOCK_SQUAD.players) {
      expect(player.teamLogo).toBe(teamLogoPath(player.teamSlug));
    }
  });

  it("rates the squad and its members on the 0-100 band", () => {
    expect(MOCK_SQUAD.rating).toBeGreaterThanOrEqual(0);
    expect(MOCK_SQUAD.rating).toBeLessThanOrEqual(100);
    for (const player of MOCK_SQUAD.players) {
      expect(player.rating, player.playerSeasonId).toBeGreaterThanOrEqual(0);
      expect(player.rating, player.playerSeasonId).toBeLessThanOrEqual(100);
    }
  });

  it("only uses season years the game covers", () => {
    for (const player of MOCK_SQUAD.players) {
      expect(player.seasonYear).toBeGreaterThanOrEqual(1980);
      expect(player.seasonYear).toBeLessThanOrEqual(2026);
    }
  });
});
