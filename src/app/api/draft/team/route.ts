import {
  getRandomOtherSeason,
  getRandomOtherTeam,
  getRandomTeamSeason,
} from "@/lib/db/draft";
import { fetchDraftTeam, parseDraftTeamQuery } from "@/lib/draft-api";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import type { DraftTeamFetchers } from "@/lib/draft-api";

export const dynamic = "force-dynamic";

const fetchers: DraftTeamFetchers = {
  random: getRandomTeamSeason,
  anotherTeam: getRandomOtherTeam,
  anotherSeason: getRandomOtherSeason,
};

export async function GET(request: Request) {
  const query = parseDraftTeamQuery(new URL(request.url).searchParams);

  if (!query) {
    return apiFailure("INVALID_REQUEST", 400);
  }

  try {
    const team = await fetchDraftTeam(query, fetchers);

    if (!team) {
      return apiFailure("NO_ELIGIBLE_TEAM", 404);
    }

    return apiSuccess(team, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("[api/draft/team] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
