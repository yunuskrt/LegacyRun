import { requestJson } from "@/lib/api-client";
import { squadRatingOf } from "@/lib/run";
import type { ApiFetchFailure, FetchLike } from "@/lib/api-client";
import type { Bracket } from "@/types/bracket";
import type { Conference, Squad } from "@/types/game";

export const BRACKET_ENDPOINT = "/api/tournament/bracket";

export type BracketRequest = {
  conference: Conference;
  squadRating: number;
  exclude: string[];
  runSeed?: string;
};

export type BracketFetchFailure = ApiFetchFailure;

export type BracketFetchResult =
  { ok: true; bracket: Bracket } | { ok: false; error: BracketFetchFailure };

export const BRACKET_FETCH_MESSAGE: Record<BracketFetchFailure, string> = {
  INVALID_REQUEST: "That bracket request wasn't valid.",
  NO_ELIGIBLE_TEAM: "No bracket could be built for this squad.",
  QUERY_FAILED: "Couldn't reach the playoff archive. Try again.",
  UNREACHABLE: "Couldn't reach the playoff archive. Try again.",
};

// A run never plays the team-seasons it drafted its own players off.
export const squadTeamSeasonIds = (squad: Squad): string[] => [
  ...new Set(
    squad.players.map((player) => `${player.teamSlug}-${player.seasonYear}`)
  ),
];

export const bracketRequestFor = (
  squad: Squad,
  conference: Conference,
  runSeed?: string
): BracketRequest => ({
  conference,
  squadRating: squadRatingOf(squad),
  exclude: squadTeamSeasonIds(squad),
  runSeed,
});

export const bracketUrl = (request: BracketRequest): string => {
  const params = new URLSearchParams({
    conference: request.conference,
    squadRating: String(request.squadRating),
  });

  if (request.exclude.length > 0) {
    params.set("exclude", request.exclude.join(","));
  }

  if (request.runSeed) {
    params.set("runSeed", request.runSeed);
  }

  return `${BRACKET_ENDPOINT}?${params.toString()}`;
};

export const requestBracket = async (
  request: BracketRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<BracketFetchResult> => {
  const result = await requestJson<Bracket>(
    bracketUrl(request),
    fetchImpl,
    signal
  );

  return result.ok ? { ok: true, bracket: result.data } : result;
};
