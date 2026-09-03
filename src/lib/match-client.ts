import { requestJson } from "@/lib/api-client";
import { allMatchups } from "@/lib/match";
import type { ApiFetchFailure, FetchLike } from "@/lib/api-client";
import type { Bracket } from "@/types/bracket";
import type { MatchData } from "@/types/match";
import type { Squad } from "@/types/game";

export const MATCH_DATA_ENDPOINT = "/api/tournament/match-data";

export type MatchDataRequest = {
  squad: string[];
  opponents: string[];
};

export type MatchFetchFailure = ApiFetchFailure;

export type MatchDataFetchResult =
  { ok: true; data: MatchData } | { ok: false; error: MatchFetchFailure };

export const MATCH_FETCH_MESSAGE: Record<MatchFetchFailure, string> = {
  INVALID_REQUEST: "That match request wasn't valid.",
  NO_ELIGIBLE_TEAM: "Some rosters are missing from the archive.",
  QUERY_FAILED: "Couldn't reach the player archive. Try again.",
  UNREACHABLE: "Couldn't reach the player archive. Try again.",
};

// Every historical team in the bracket, including the drawn Finals opponent.
export const bracketOpponentIds = (bracket: Bracket): string[] => [
  ...new Set(
    allMatchups(bracket)
      .flatMap((matchup) => [matchup.home, matchup.away])
      .filter((slot) => slot?.side === "OPPONENT")
      .map((slot) => slot.opponent.teamSeasonId)
  ),
];

export const matchDataRequestFor = (
  squad: Squad,
  bracket: Bracket
): MatchDataRequest => ({
  squad: squad.players.map((player) => player.playerSeasonId),
  opponents: bracketOpponentIds(bracket),
});

export const matchDataUrl = (request: MatchDataRequest): string => {
  const params = new URLSearchParams({
    squad: request.squad.join(","),
    opponents: request.opponents.join(","),
  });

  return `${MATCH_DATA_ENDPOINT}?${params.toString()}`;
};

export const requestMatchData = (
  request: MatchDataRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<MatchDataFetchResult> =>
  requestJson<MatchData>(matchDataUrl(request), fetchImpl, signal);
