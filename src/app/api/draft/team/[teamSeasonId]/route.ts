import { getTeamSeasonById } from "@/lib/db/draft";
import { parseTeamSeasonId } from "@/lib/draft-api";
import { apiFailure, apiSuccess } from "@/lib/api-response";

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

    return apiSuccess(team, { "Cache-Control": "public, max-age=31536000" });
  } catch (error) {
    console.error("[api/draft/team/:id] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
