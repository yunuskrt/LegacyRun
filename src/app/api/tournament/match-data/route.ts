import {
  apiFailure,
  apiRateLimited,
  apiSuccess,
  FROZEN_HISTORY_HEADERS,
} from "@/lib/api-response";
import { buildMatchData, parseMatchDataQuery } from "@/lib/match";
import { getOpponentRosters, getSquadPlayers } from "@/lib/db/match";
import { DATA_ROUTE_BUDGET, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = rateLimit(request.headers, DATA_ROUTE_BUDGET);

  if (!limit.allowed) {
    return apiRateLimited(limit.retryAfterSeconds);
  }

  const query = parseMatchDataQuery(new URL(request.url).searchParams);

  if (!query) {
    return apiFailure("INVALID_REQUEST", 400);
  }

  try {
    const [squadRows, rosterRows] = await Promise.all([
      getSquadPlayers(query.squad),
      getOpponentRosters(query.opponents),
    ]);

    const data = buildMatchData(query, squadRows, rosterRows);

    if (!data) {
      return apiFailure("NO_ELIGIBLE_TEAM", 404);
    }

    return apiSuccess(data, FROZEN_HISTORY_HEADERS);
  } catch (error) {
    console.error("[api/tournament/match-data] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
