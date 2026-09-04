import { prisma } from "@/lib/db";
import { oppositeConference } from "@/lib/bracket";
import type { PlayoffTeamRow } from "@/lib/bracket";
import type { Conference } from "@/types/game";

// The pool is ~408 rows at most, so selection happens in the pure module, not here.
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
