import { requestJson } from "@/lib/api-client";
import type { ApiFetchFailure, FetchLike } from "@/lib/api-client";
import type { RerollKind } from "@/lib/draft";
import type { DraftTeam } from "@/types/game";

export const DRAFT_TEAM_ENDPOINT = "/api/draft/team";

export type DraftRequest =
  | { mode: "random" }
  | { mode: "another-team" | "another-season"; exclude: string };

// Skip Round differs from Get Random Team only in costing a reroll, which is client state.
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

export type DraftFetchFailure = ApiFetchFailure;

export type DraftFetchResult =
  { ok: true; team: DraftTeam } | { ok: false; error: DraftFetchFailure };

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

export const requestDraftTeam = async (
  request: DraftRequest,
  fetchImpl: FetchLike,
  signal?: AbortSignal
): Promise<DraftFetchResult> => {
  const result = await requestJson<DraftTeam>(
    draftTeamUrl(request),
    fetchImpl,
    signal
  );

  return result.ok ? { ok: true, team: result.data } : result;
};
