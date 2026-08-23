import { allMatchups } from "@/lib/match";
import type { FetchLike } from "@/lib/bracket-client";
import type { ApiError, ApiResponse } from "@/types/api";
import type { Bracket } from "@/types/bracket";
import type { MatchData } from "@/types/match";
import type { Squad } from "@/types/game";

export const MATCH_DATA_ENDPOINT = "/api/tournament/match-data";

export type MatchDataRequest = {
  squad: string[];
  opponents: string[];
};

export type MatchFetchFailure = ApiError | "UNREACHABLE";

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

const isApiError = (value: unknown): value is ApiError =>
  value === "INVALID_REQUEST" ||
  value === "NO_ELIGIBLE_TEAM" ||
  value === "QUERY_FAILED";

export const requestMatchData = async (
  request: MatchDataRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<MatchDataFetchResult> => {
  let body: ApiResponse<MatchData>;

  try {
    const response = await fetchImpl(matchDataUrl(request), { signal });
    body = (await response.json()) as ApiResponse<MatchData>;
  } catch {
    return { ok: false, error: "UNREACHABLE" };
  }

  if (body?.success) return { ok: true, data: body.data };

  return {
    ok: false,
    error: isApiError(body?.error) ? body.error : "UNREACHABLE",
  };
};
