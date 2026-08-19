import type { Bracket } from "@/types/bracket";
import type { ApiError, ApiResponse } from "@/types/api";
import type { Conference, Squad } from "@/types/game";

export const BRACKET_ENDPOINT = "/api/tournament/bracket";

export type BracketRequest = {
  conference: Conference;
  squadRating: number;
  exclude: string[];
  runSeed?: string;
};

export type BracketFetchFailure = ApiError | "UNREACHABLE";

export type BracketFetchResult =
  { ok: true; bracket: Bracket } | { ok: false; error: BracketFetchFailure };

export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export const BRACKET_FETCH_MESSAGE: Record<BracketFetchFailure, string> = {
  INVALID_REQUEST: "That bracket request wasn't valid.",
  NO_ELIGIBLE_TEAM: "No bracket could be built for this squad.",
  QUERY_FAILED: "Couldn't reach the playoff archive. Try again.",
  UNREACHABLE: "Couldn't reach the playoff archive. Try again.",
};

export const squadRatingOf = (squad: Squad): number =>
  squad.players.length === 0
    ? 0
    : Math.round(
        squad.players.reduce((total, player) => total + player.rating, 0) /
          squad.players.length
      );

// The team-seasons the squad drafted from — a run never plays the roster it
// picked its own players off.
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

const isApiError = (value: unknown): value is ApiError =>
  value === "INVALID_REQUEST" ||
  value === "NO_ELIGIBLE_TEAM" ||
  value === "QUERY_FAILED";

export const requestBracket = async (
  request: BracketRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<BracketFetchResult> => {
  let body: ApiResponse<Bracket>;

  try {
    const response = await fetchImpl(bracketUrl(request), { signal });
    body = (await response.json()) as ApiResponse<Bracket>;
  } catch {
    return { ok: false, error: "UNREACHABLE" };
  }

  if (body?.success) return { ok: true, bracket: body.data };

  return {
    ok: false,
    error: isApiError(body?.error) ? body.error : "UNREACHABLE",
  };
};
