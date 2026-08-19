import { describe, expect, it } from "vitest";
import {
  BRACKET_ENDPOINT,
  BRACKET_FETCH_MESSAGE,
  bracketRequestFor,
  bracketUrl,
  requestBracket,
  squadRatingOf,
  squadTeamSeasonIds,
} from "@/lib/bracket-client";
import type { FetchLike } from "@/lib/bracket-client";
import type { Position, Squad, SquadMember } from "@/types/game";

const member = (
  position: Position,
  rating: number,
  teamSlug: string,
  seasonYear: number
): SquadMember => ({
  playerSlug: `${teamSlug}${seasonYear}${position}`.toLowerCase(),
  playerSeasonId: `${teamSlug}${seasonYear}${position}-${seasonYear}`,
  name: `${position} Player`,
  teamName: `${teamSlug} Team`,
  teamSlug,
  teamLogo: `/logos/${teamSlug}.png`,
  seasonYear,
  position,
  rating,
});

const squad: Squad = {
  formation: "TRADITIONAL",
  players: [
    member("PG", 90, "CHI", 1996),
    member("SG", 80, "CHI", 1996),
    member("SF", 70, "LAL", 2020),
    member("PF", 61, "BOS", 2008),
    member("C", 60, "MIA", 2013),
  ],
};

const jsonResponse = (body: unknown): Response =>
  ({ json: async () => body }) as Response;

describe("squadRatingOf", () => {
  it("averages the five ratings and rounds", () => {
    expect(squadRatingOf(squad)).toBe(72);
  });

  it("survives an empty squad", () => {
    expect(squadRatingOf({ formation: "TRADITIONAL", players: [] })).toBe(0);
  });
});

describe("squadTeamSeasonIds", () => {
  it("collects the drafted team-seasons without duplicates", () => {
    expect(squadTeamSeasonIds(squad)).toEqual([
      "CHI-1996",
      "LAL-2020",
      "BOS-2008",
      "MIA-2013",
    ]);
  });
});

describe("bracketRequestFor", () => {
  it("carries the run's conference, rating, and exclusions", () => {
    expect(bracketRequestFor(squad, "WEST")).toEqual({
      conference: "WEST",
      squadRating: 72,
      exclude: ["CHI-1996", "LAL-2020", "BOS-2008", "MIA-2013"],
      runSeed: undefined,
    });
  });
});

describe("bracketUrl", () => {
  it("builds the endpoint query string", () => {
    expect(
      bracketUrl({
        conference: "EAST",
        squadRating: 78,
        exclude: ["CHI-1996", "LAL-2020"],
      })
    ).toBe(
      `${BRACKET_ENDPOINT}?conference=EAST&squadRating=78&exclude=CHI-1996%2CLAL-2020`
    );
  });

  it("omits empty exclusions and an absent run seed", () => {
    expect(
      bracketUrl({ conference: "WEST", squadRating: 60, exclude: [] })
    ).toBe(`${BRACKET_ENDPOINT}?conference=WEST&squadRating=60`);
  });

  it("includes the run seed when one is pinned", () => {
    expect(
      bracketUrl({
        conference: "WEST",
        squadRating: 60,
        exclude: [],
        runSeed: "k3f9qv1p",
      })
    ).toContain("runSeed=k3f9qv1p");
  });
});

describe("requestBracket", () => {
  const request = { conference: "EAST" as const, squadRating: 70, exclude: [] };

  it("returns the bracket on success", async () => {
    const bracket = {
      runSeed: "abc",
      conference: "EAST",
      squadSlot: 4,
      rounds: [],
    };
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: true, data: bracket });

    await expect(requestBracket(request, fetchImpl)).resolves.toEqual({
      ok: true,
      bracket,
    });
  });

  it("passes a known api error through", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: false, error: "NO_ELIGIBLE_TEAM" });

    await expect(requestBracket(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "NO_ELIGIBLE_TEAM",
    });
  });

  it("reports an unknown error shape as unreachable", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: false, error: "SOMETHING_ELSE" });

    await expect(requestBracket(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("resolves rather than throwing when the request fails", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error("aborted");
    };

    await expect(requestBracket(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });
});

describe("BRACKET_FETCH_MESSAGE", () => {
  it("covers every failure the fetcher can return", () => {
    expect(Object.keys(BRACKET_FETCH_MESSAGE).sort()).toEqual([
      "INVALID_REQUEST",
      "NO_ELIGIBLE_TEAM",
      "QUERY_FAILED",
      "UNREACHABLE",
    ]);

    for (const message of Object.values(BRACKET_FETCH_MESSAGE)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
