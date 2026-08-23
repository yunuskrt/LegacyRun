import { apiFailure, apiSuccess } from "@/lib/api-response";
import { buildMatchData, parseMatchDataQuery } from "@/lib/match";
import { getOpponentRosters, getSquadPlayers } from "@/lib/db/match";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    // Frozen history and a pure function of the query, so it never goes stale.
    // Errors are not cached.
    return apiSuccess(data, { "Cache-Control": "max-age=31536000" });
  } catch (error) {
    console.error("[api/tournament/match-data] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
