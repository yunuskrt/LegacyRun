import type { RerollKind } from "@/lib/draft";
import type { ApiError, ApiResponse } from "@/types/api";
import type { DraftTeam } from "@/types/game";

export const DRAFT_TEAM_ENDPOINT = "/api/draft/team";

export type DraftRequest =
  | { mode: "random" }
  | { mode: "another-team" | "another-season"; exclude: string };

// Skip Round is an unanchored random draw — it differs from Get Random Team
// only in costing a reroll, which is client state.
export const rerollRequest = (
  kind: RerollKind,
  currentTeamSeasonId: string
): DraftRequest => {
  switch (kind) {
    case "ANOTHER_TEAM":
      return { mode: "another-team", exclude: currentTeamSeasonId };
    case "ANOTHER_SEASON":
      return { mode: "another-season", exclude: currentTeamSeasonId };
    case "SKIP_ROUND":
      return { mode: "random" };
  }
};

export type DraftFetchFailure = ApiError | "UNREACHABLE";

export type DraftFetchResult =
  { ok: true; team: DraftTeam } | { ok: false; error: DraftFetchFailure };

export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export const DRAFT_FETCH_MESSAGE: Record<DraftFetchFailure, string> = {
  INVALID_REQUEST: "That draft request wasn't valid.",
  NO_ELIGIBLE_TEAM: "No other team available.",
  QUERY_FAILED: "Couldn't reach the draft pool. Try again.",
  UNREACHABLE: "Couldn't reach the draft pool. Try again.",
};

export const draftTeamUrl = (request: DraftRequest): string => {
  if (request.mode === "random") return DRAFT_TEAM_ENDPOINT;

  const params = new URLSearchParams({
    mode: request.mode,
    exclude: request.exclude,
  });

  return `${DRAFT_TEAM_ENDPOINT}?${params.toString()}`;
};

const isApiError = (value: unknown): value is ApiError =>
  value === "INVALID_REQUEST" ||
  value === "NO_ELIGIBLE_TEAM" ||
  value === "QUERY_FAILED";

export const requestDraftTeam = async (
  request: DraftRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<DraftFetchResult> => {
  let body: ApiResponse<DraftTeam>;

  try {
    const response = await fetchImpl(draftTeamUrl(request), { signal });
    body = (await response.json()) as ApiResponse<DraftTeam>;
  } catch {
    // Covers transport failure and a non-JSON body alike — either way the
    // caller can only retry.
    return { ok: false, error: "UNREACHABLE" };
  }

  if (body?.success) return { ok: true, team: body.data };

  return {
    ok: false,
    error: isApiError(body?.error) ? body.error : "UNREACHABLE",
  };
};
