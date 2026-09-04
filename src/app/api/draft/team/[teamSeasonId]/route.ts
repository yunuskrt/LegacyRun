import { getTeamSeasonById } from "@/lib/db/draft";
import { parseTeamSeasonId } from "@/lib/draft-api";
import { apiFailure, apiSuccess } from "@/lib/api-response";

// Route Handlers are uncached by default, so the force-dynamic the other three
// carry is redundant and its absence here changes nothing.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamSeasonId: string }> }
) {
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

    // Frozen history and a pure function of the id, so it never goes stale.
    // Errors are not cached.
    return apiSuccess(team, { "Cache-Control": "max-age=31536000" });
  } catch (error) {
    console.error("[api/draft/team/[teamSeasonId]] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
