import { describe, expect, it, vi } from "vitest";
import {
  drawIndex,
  fetchDraftTeam,
  parseDraftTeamQuery,
  parseTeamSeasonId,
  toDraftTeam,
} from "@/lib/draft-api";
import type { DraftTeamFetchers, TeamSeasonRosterRow } from "@/lib/draft-api";

const query = (search: string) =>
  parseDraftTeamQuery(new URLSearchParams(search));

const row: TeamSeasonRosterRow = {
  id: "CHI-1996",
  teamSlug: "CHI",
  seasonYear: 1996,
  rating: 91,
  team: { name: "Chicago Bulls" },
  playerSeasons: [
    {
      playerSeason: {
        id: "jordami01-1996",
        playerSlug: "jordami01",
        age: 32,
        position: "SG",
        rating: 99,
        player: { fullName: "Michael Jordan" },
      },
    },
    {
      playerSeason: {
        id: "pippesc01-1996",
        playerSlug: "pippesc01",
        age: 30,
        position: "SF",
        rating: 88,
        player: { fullName: "Scottie Pippen" },
      },
    },
  ],
};

describe("parseDraftTeamQuery", () => {
  it("defaults to random when mode is absent", () => {
    expect(query("")).toEqual({ mode: "random", excludeSeasons: [] });
  });

  it("treats an explicit mode=random the same as no mode", () => {
    expect(query("mode=random")).toEqual(query(""));
  });

  it("splits excludeSeasons into a list", () => {
    expect(query("excludeSeasons=CHI-1996,LAL-2020")).toEqual({
      mode: "random",
      excludeSeasons: ["CHI-1996", "LAL-2020"],
    });
  });

  it("drops blank entries and surrounding whitespace from excludeSeasons", () => {
    expect(query("excludeSeasons=CHI-1996,,%20LAL-2020%20,")).toEqual({
      mode: "random",
      excludeSeasons: ["CHI-1996", "LAL-2020"],
    });
  });

  it("accepts another-team with an exclude anchor", () => {
    expect(query("mode=another-team&exclude=CHI-1996")).toEqual({
      mode: "another-team",
      exclude: "CHI-1996",
    });
  });

  it("accepts another-season with an exclude anchor", () => {
    expect(query("mode=another-season&exclude=CHI-1996")).toEqual({
      mode: "another-season",
      exclude: "CHI-1996",
    });
  });

  it("rejects another-team without an exclude anchor", () => {
    expect(query("mode=another-team")).toBeNull();
  });

  it("rejects another-season without an exclude anchor", () => {
    expect(query("mode=another-season")).toBeNull();
  });

  it("rejects an unknown mode rather than falling back to random", () => {
    expect(query("mode=nonsense")).toBeNull();
  });

  it("rejects a blank exclude anchor", () => {
    expect(query("mode=another-team&exclude=%20%20")).toBeNull();
  });

  it("rejects exclude on the random mode instead of ignoring it", () => {
    expect(query("exclude=CHI-1996")).toBeNull();
    expect(query("mode=random&exclude=CHI-1996")).toBeNull();
  });

  it("rejects excludeSeasons on the anchored modes", () => {
    expect(
      query("mode=another-team&exclude=CHI-1996&excludeSeasons=LAL-2020")
    ).toBeNull();
  });
});

describe("parseTeamSeasonId", () => {
  it("accepts a team-season id", () => {
    expect(parseTeamSeasonId("CHI-1996")).toBe("CHI-1996");
  });

  it("trims surrounding whitespace", () => {
    expect(parseTeamSeasonId("  CHI-1996  ")).toBe("CHI-1996");
  });

  it("rejects an empty segment", () => {
    expect(parseTeamSeasonId("   ")).toBeNull();
  });

  it("rejects an over-long segment", () => {
    expect(parseTeamSeasonId("x".repeat(65))).toBeNull();
  });
});

describe("fetchDraftTeam", () => {
  const stubs = (): DraftTeamFetchers => ({
    random: vi.fn().mockResolvedValue(null),
    anotherTeam: vi.fn().mockResolvedValue(null),
    anotherSeason: vi.fn().mockResolvedValue(null),
  });

  it("routes random to the random fetcher with the excluded seasons", async () => {
    const fetchers = stubs();

    await fetchDraftTeam(
      { mode: "random", excludeSeasons: ["CHI-1996"] },
      fetchers
    );

    expect(fetchers.random).toHaveBeenCalledWith(["CHI-1996"]);
    expect(fetchers.anotherTeam).not.toHaveBeenCalled();
    expect(fetchers.anotherSeason).not.toHaveBeenCalled();
  });

  it("routes another-team to the other-franchise fetcher with the anchor", async () => {
    const fetchers = stubs();

    await fetchDraftTeam(
      { mode: "another-team", exclude: "CHI-1996" },
      fetchers
    );

    expect(fetchers.anotherTeam).toHaveBeenCalledWith("CHI-1996");
    expect(fetchers.random).not.toHaveBeenCalled();
    expect(fetchers.anotherSeason).not.toHaveBeenCalled();
  });

  it("routes another-season to the other-season fetcher with the anchor", async () => {
    const fetchers = stubs();

    await fetchDraftTeam(
      { mode: "another-season", exclude: "CHI-1996" },
      fetchers
    );

    expect(fetchers.anotherSeason).toHaveBeenCalledWith("CHI-1996");
    expect(fetchers.random).not.toHaveBeenCalled();
    expect(fetchers.anotherTeam).not.toHaveBeenCalled();
  });

  it("passes the fetcher result straight through", async () => {
    const team = toDraftTeam(row);
    const fetchers = stubs();
    fetchers.random = vi.fn().mockResolvedValue(team);

    await expect(
      fetchDraftTeam({ mode: "random", excludeSeasons: [] }, fetchers)
    ).resolves.toBe(team);
  });
});

describe("drawIndex", () => {
  it("returns the first row when the draw lands at zero", () => {
    expect(drawIndex(1292, () => 0)).toBe(0);
  });

  it("returns the last row when the draw lands just short of one", () => {
    expect(drawIndex(1292, () => 0.9999999)).toBe(1291);
  });

  it("wraps rather than indexing past the end when the draw returns one", () => {
    expect(drawIndex(1292, () => 1)).toBe(0);
  });

  it("stays inside the range across the whole unit interval", () => {
    for (let step = 0; step <= 1000; step += 1) {
      const index = drawIndex(7, () => step / 1000);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(7);
    }
  });

  it("returns zero for an empty pool", () => {
    expect(drawIndex(0, () => 0.5)).toBe(0);
  });
});

describe("toDraftTeam", () => {
  it("maps a team-season row onto the DraftTeam shape", () => {
    expect(toDraftTeam(row)).toEqual({
      teamSeasonId: "CHI-1996",
      teamName: "Chicago Bulls",
      teamSlug: "CHI",
      teamLogo: "/logos/CHI.png",
      teamRating: 91,
      seasonYear: 1996,
      players: [
        {
          playerId: "jordami01",
          playerSeasonId: "jordami01-1996",
          name: "Michael Jordan",
          age: 32,
          position: "SG",
          rating: 99,
        },
        {
          playerId: "pippesc01",
          playerSeasonId: "pippesc01-1996",
          name: "Scottie Pippen",
          age: 30,
          position: "SF",
          rating: 88,
        },
      ],
    });
  });

  it("derives the logo path rather than reading a stored value", () => {
    expect(toDraftTeam({ ...row, teamSlug: "UTA" }).teamLogo).toBe(
      "/logos/UTA.png"
    );
  });

  it("preserves the roster order the query returned", () => {
    const reversed = {
      ...row,
      playerSeasons: [...row.playerSeasons].reverse(),
    };

    expect(toDraftTeam(reversed).players.map((player) => player.name)).toEqual([
      "Scottie Pippen",
      "Michael Jordan",
    ]);
  });

  it("maps an empty roster to an empty player list", () => {
    expect(toDraftTeam({ ...row, playerSeasons: [] }).players).toEqual([]);
  });
});
