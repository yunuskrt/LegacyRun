import { prisma } from "@/lib/db";
import { oppositeConference } from "@/lib/bracket";
import type { PlayoffTeamRow } from "@/lib/bracket";
import type { Conference } from "@/types/game";

// The whole eligible pool is at most ~408 rows, so selection happens in the
// pure module rather than in the query — see context/docs/bracket-generation.md.
export const getPlayoffCandidates = async (
  conference: Conference
): Promise<PlayoffTeamRow[]> =>
  await prisma.playoffParticipation.findMany({
    where: {
      OR: [
        { conference },
        {
          conference: oppositeConference(conference),
          roundReached: { in: ["NBA_FINALS", "CHAMPION"] },
        },
      ],
    },
    select: {
      teamSlug: true,
      seasonYear: true,
      conference: true,
      seed: true,
      roundReached: true,
      wins: true,
      losses: true,
      team: { select: { name: true } },
    },
  });
