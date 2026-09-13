import { getTeamSeasonById } from "@/lib/db/draft";
import { parseTeamSeasonId } from "@/lib/draft-api";
import {
  apiFailure,
  apiRateLimited,
  apiSuccess,
  FROZEN_HISTORY_HEADERS,
} from "@/lib/api-response";
import { DATA_ROUTE_BUDGET, rateLimit } from "@/lib/rate-limit";

// Route Handlers are uncached by default, so the other three's force-dynamic is redundant.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamSeasonId: string }> }
) {
  const limit = rateLimit(request.headers, DATA_ROUTE_BUDGET);

  if (!limit.allowed) {
    return apiRateLimited(limit.retryAfterSeconds);
  }

  const { teamSeasonId } = await params;
  const id = parseTeamSeasonId(teamSeasonId);

  if (!id) {
    return apiFailure("INVALID_REQUEST", 400);
  }

  try {
    const team = await getTeamSeasonById(id);

    if (!team) {
      return apiFailure("NO_ELIGIBLE_TEAM", 404);
    }

    return apiSuccess(team, FROZEN_HISTORY_HEADERS);
  } catch (error) {
    console.error("[api/draft/team/[teamSeasonId]] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
