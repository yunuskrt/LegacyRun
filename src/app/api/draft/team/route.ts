import {
  getRandomOtherSeason,
  getRandomOtherTeam,
  getRandomTeamSeason,
} from "@/lib/db/draft";
import { fetchDraftTeam, parseDraftTeamQuery } from "@/lib/draft-api";
import {
  apiFailure,
  apiRateLimited,
  apiSuccess,
  NO_STORE_HEADERS,
} from "@/lib/api-response";
import { DATA_ROUTE_BUDGET, rateLimit } from "@/lib/rate-limit";
import type { DraftTeamFetchers } from "@/lib/draft-api";

export const dynamic = "force-dynamic";

const fetchers: DraftTeamFetchers = {
  random: getRandomTeamSeason,
  anotherTeam: getRandomOtherTeam,
  anotherSeason: getRandomOtherSeason,
};

export async function GET(request: Request) {
  const limit = rateLimit(request.headers, DATA_ROUTE_BUDGET);

  if (!limit.allowed) {
    return apiRateLimited(limit.retryAfterSeconds);
  }

  const query = parseDraftTeamQuery(new URL(request.url).searchParams);

  if (!query) {
    return apiFailure("INVALID_REQUEST", 400);
  }

  try {
    const team = await fetchDraftTeam(query, fetchers);

    if (!team) {
      return apiFailure("NO_ELIGIBLE_TEAM", 404);
    }

    return apiSuccess(team, NO_STORE_HEADERS);
  } catch (error) {
    console.error("[api/draft/team] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
