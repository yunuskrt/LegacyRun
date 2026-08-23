import { prisma } from "@/lib/db";
import type { PlayerSeasonRow, RosterRow } from "@/lib/match";

// player_season_data is an audit table everywhere else; this is the one feature
// that reads it, and it reads only the three simulation inputs.
const PLAYER_SELECT = {
  id: true,
  player: { select: { fullName: true } },
  data: {
    select: {
      minutesPlayed: true,
      boxPlusMinus: true,
      playerEfficiencyRating: true,
    },
  },
} as const;

export const getSquadPlayers = async (
  playerSeasonIds: readonly string[]
): Promise<PlayerSeasonRow[]> =>
  await prisma.playerSeason.findMany({
    where: { id: { in: [...playerSeasonIds] } },
    select: PLAYER_SELECT,
  });

export const getOpponentRosters = async (
  teamSeasonIds: readonly string[]
): Promise<RosterRow[]> =>
  await prisma.playerSeasonTeam.findMany({
    where: { teamSeasonId: { in: [...teamSeasonIds] } },
    select: {
      teamSeasonId: true,
      playerSeason: { select: PLAYER_SELECT },
    },
  });
