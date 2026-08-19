import { apiFailure, apiSuccess } from "@/lib/api-response";
import { generateBracket, parseBracketQuery } from "@/lib/bracket";
import { getPlayoffCandidates } from "@/lib/db/bracket";
import { mintSeed } from "@/lib/rng";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = parseBracketQuery(new URL(request.url).searchParams);

  if (!query) {
    return apiFailure("INVALID_REQUEST", 400);
  }

  try {
    const candidates = await getPlayoffCandidates(query.conference);
    const bracket = generateBracket(
      candidates,
      query,
      query.runSeed ?? mintSeed()
    );

    if (!bracket) {
      return apiFailure("NO_ELIGIBLE_TEAM", 404);
    }

    return apiSuccess(bracket, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("[api/tournament/bracket] query failed", error);

    return apiFailure("QUERY_FAILED", 500);
  }
}
