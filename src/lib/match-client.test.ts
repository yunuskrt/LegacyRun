import { describe, expect, it } from "vitest";
import {
  MATCH_DATA_ENDPOINT,
  MATCH_FETCH_MESSAGE,
  bracketOpponentIds,
  matchDataRequestFor,
  matchDataUrl,
  requestMatchData,
} from "@/lib/match-client";
import type { FetchLike } from "@/lib/api-client";
import type { Bracket, BracketRoundId, BracketSlot } from "@/types/bracket";
import type { Position, Squad, SquadMember } from "@/types/game";

const member = (position: Position, teamSlug: string): SquadMember => ({
  playerSlug: `${teamSlug}${position}`.toLowerCase(),
  playerSeasonId: `${teamSlug}${position}-1996`.toLowerCase(),
  name: `${position} Player`,
  teamName: `${teamSlug} Team`,
  teamSlug,
  teamLogo: `/logos/${teamSlug}.png`,
  seasonYear: 1996,
  position,
  rating: 80,
});

const squad: Squad = {
  formation: "TRADITIONAL",
  players: [
    member("PG", "CHI"),
    member("SG", "LAL"),
    member("SF", "BOS"),
    member("PF", "MIA"),
    member("C", "SAS"),
  ],
};

const opponentSlot = (teamSeasonId: string): BracketSlot => ({
  side: "OPPONENT",
  bracketSlot: 1,
  opponent: {
    teamSeasonId,
    teamSlug: teamSeasonId.split("-")[0],
    teamName: teamSeasonId,
    teamLogo: "",
    seasonYear: Number(teamSeasonId.split("-")[1]),
    conference: "EAST",
    seed: 1,
    roundReached: "CHAMPION",
    wins: 15,
    losses: 3,
    pedigree: 95,
  },
});

const round = (
  id: BracketRoundId,
  matchups: { id: string; home: BracketSlot | null; away: BracketSlot | null }[]
) => ({
  id,
  label: id,
  matchups: matchups.map((matchup) => ({
    ...matchup,
    round: id,
    winner: null,
  })),
});

const bracket: Bracket = {
  runSeed: "abc12345",
  conference: "EAST",
  squadSlot: 1,
  rounds: [
    round("FIRST_ROUND", [
      {
        id: "r1-m1",
        home: { side: "SQUAD", bracketSlot: 1 },
        away: opponentSlot("CHI-1996"),
      },
      { id: "r1-m2", home: opponentSlot("LAL-1987"), away: null },
    ]),
    round("NBA_FINALS", [
      { id: "finals", home: null, away: opponentSlot("DET-1989") },
    ]),
  ],
};

const jsonResponse = (body: unknown): Response =>
  ({ json: async () => body }) as Response;

describe("bracketOpponentIds", () => {
  it("collects every historical team in the bracket, Finals included", () => {
    expect(bracketOpponentIds(bracket)).toEqual([
      "CHI-1996",
      "LAL-1987",
      "DET-1989",
    ]);
  });

  it("skips the squad and unfilled slots", () => {
    expect(bracketOpponentIds(bracket)).not.toContain(undefined);
    expect(bracketOpponentIds(bracket)).toHaveLength(3);
  });

  it("does not repeat a team that appears in two slots", () => {
    const repeated: Bracket = {
      ...bracket,
      rounds: [
        round("FIRST_ROUND", [
          {
            id: "r1-m1",
            home: opponentSlot("CHI-1996"),
            away: opponentSlot("CHI-1996"),
          },
        ]),
      ],
    };

    expect(bracketOpponentIds(repeated)).toEqual(["CHI-1996"]);
  });
});

describe("matchDataRequestFor", () => {
  it("asks for the five drafted player-seasons and every opponent", () => {
    expect(matchDataRequestFor(squad, bracket)).toEqual({
      squad: [
        "chipg-1996",
        "lalsg-1996",
        "bossf-1996",
        "miapf-1996",
        "sasc-1996",
      ],
      opponents: ["CHI-1996", "LAL-1987", "DET-1989"],
    });
  });
});

describe("matchDataUrl", () => {
  it("builds the endpoint query string", () => {
    expect(
      matchDataUrl({
        squad: ["a-1", "b-2", "c-3", "d-4", "e-5"],
        opponents: ["CHI-1996", "LAL-1987"],
      })
    ).toBe(
      `${MATCH_DATA_ENDPOINT}?squad=a-1%2Cb-2%2Cc-3%2Cd-4%2Ce-5&opponents=CHI-1996%2CLAL-1987`
    );
  });

  // Why this is a GET: 5 player-seasons and 8 team-seasons never near a URL limit.
  it("stays far short of any URL length limit at full bracket size", () => {
    const url = matchDataUrl(matchDataRequestFor(squad, bracket));

    expect(url.length).toBeLessThan(2000);
  });
});

describe("requestMatchData", () => {
  const request = {
    squad: ["a-1", "b-2", "c-3", "d-4", "e-5"],
    opponents: ["CHI-1996"],
  };

  it("returns the match data on success", async () => {
    const data = { squad: [], opponents: [] };
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: true, data });

    await expect(requestMatchData(request, fetchImpl)).resolves.toEqual({
      ok: true,
      data,
    });
  });

  it("passes a known api error through", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: false, error: "NO_ELIGIBLE_TEAM" });

    await expect(requestMatchData(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "NO_ELIGIBLE_TEAM",
    });
  });

  it("reports an unknown error shape as unreachable", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ success: false, error: "SOMETHING_ELSE" });

    await expect(requestMatchData(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("resolves rather than throwing when the request fails", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error("aborted");
    };

    await expect(requestMatchData(request, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "UNREACHABLE",
    });
  });

  it("passes the abort signal through to fetch", async () => {
    const controller = new AbortController();
    let seen: AbortSignal | undefined;
    const fetchImpl: FetchLike = async (_url, init) => {
      seen = init?.signal ?? undefined;
      return jsonResponse({
        success: true,
        data: { squad: [], opponents: [] },
      });
    };

    await requestMatchData(request, fetchImpl, controller.signal);

    expect(seen).toBe(controller.signal);
  });
});

describe("MATCH_FETCH_MESSAGE", () => {
  it("covers every failure the fetcher can return", () => {
    expect(Object.keys(MATCH_FETCH_MESSAGE).sort()).toEqual([
      "INVALID_REQUEST",
      "NO_ELIGIBLE_TEAM",
      "QUERY_FAILED",
      "UNREACHABLE",
    ]);

    for (const message of Object.values(MATCH_FETCH_MESSAGE)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
