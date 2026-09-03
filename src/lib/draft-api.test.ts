import { describe, expect, it, vi } from "vitest";
import {
  anotherSeasonFilter,
  anotherTeamFilter,
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

describe("anotherTeamFilter", () => {
  const anchor = { teamSlug: "CHI", seasonYear: 1996 };

  it("changes the franchise but pins the anchor's season", () => {
    expect(anotherTeamFilter(anchor)).toEqual({
      teamSlug: { not: "CHI" },
      seasonYear: 1996,
    });
  });

  it("never lets the anchor's own franchise back in", () => {
    expect(anotherTeamFilter(anchor).teamSlug).toEqual({ not: "CHI" });
  });
});

describe("anotherSeasonFilter", () => {
  const anchor = { teamSlug: "CHI", seasonYear: 1996 };

  it("keeps the franchise and excludes the anchor itself", () => {
    expect(anotherSeasonFilter(anchor, "CHI-1996")).toEqual({
      teamSlug: "CHI",
      id: { not: "CHI-1996" },
    });
  });

  it("leaves the season open — that is the axis it varies", () => {
    expect(anotherSeasonFilter(anchor, "CHI-1996")).not.toHaveProperty(
      "seasonYear"
    );
  });
});

describe("the two anchored rerolls", () => {
  const anchor = { teamSlug: "CHI", seasonYear: 1996 };

  it("vary opposite axes, so neither can return the anchor", () => {
    const byTeam = anotherTeamFilter(anchor);
    const bySeason = anotherSeasonFilter(anchor, "CHI-1996");

    // Another Team pins the season and frees the franchise.
    expect(byTeam.seasonYear).toBe(1996);
    expect(byTeam).not.toHaveProperty("id");

    // Another Season pins the franchise and frees the season.
    expect(bySeason.teamSlug).toBe("CHI");
    expect(bySeason).not.toHaveProperty("seasonYear");
  });
});

// Applying the filters to a pool pins what they select, not how they are
// spelled — the shape assertions above would survive a wrong axis being
// pinned under a different representation.
describe("what the anchored filters select", () => {
  type Row = { id: string; teamSlug: string; seasonYear: number };

  const pool: Row[] = ["CHI", "LAL", "BOS"].flatMap((teamSlug) =>
    [1996, 1997].map((seasonYear) => ({
      id: `${teamSlug}-${seasonYear}`,
      teamSlug,
      seasonYear,
    }))
  );

  const anchor = { teamSlug: "CHI", seasonYear: 1996 };

  const select = (filter: {
    id?: { not: string };
    teamSlug?: string | { not: string };
    seasonYear?: number;
  }) =>
    pool
      .filter((row) => {
        if (filter.id && row.id === filter.id.not) return false;
        if (typeof filter.teamSlug === "string") {
          if (row.teamSlug !== filter.teamSlug) return false;
        } else if (filter.teamSlug && row.teamSlug === filter.teamSlug.not) {
          return false;
        }
        if (filter.seasonYear !== undefined) {
          return row.seasonYear === filter.seasonYear;
        }
        return true;
      })
      .map((row) => row.id);

  it("Another Team yields every other franchise in the anchor's season only", () => {
    expect(select(anotherTeamFilter(anchor)).sort()).toEqual([
      "BOS-1996",
      "LAL-1996",
    ]);
  });

  it("Another Season yields every other season of the anchor's franchise", () => {
    expect(select(anotherSeasonFilter(anchor, "CHI-1996")).sort()).toEqual([
      "CHI-1997",
    ]);
  });

  it("neither can ever select the anchor itself", () => {
    expect(select(anotherTeamFilter(anchor))).not.toContain("CHI-1996");
    expect(select(anotherSeasonFilter(anchor, "CHI-1996"))).not.toContain(
      "CHI-1996"
    );
  });

  it("the two selections never overlap", () => {
    const byTeam = new Set(select(anotherTeamFilter(anchor)));
    const bySeason = select(anotherSeasonFilter(anchor, "CHI-1996"));

    expect(bySeason.filter((id) => byTeam.has(id))).toEqual([]);
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
