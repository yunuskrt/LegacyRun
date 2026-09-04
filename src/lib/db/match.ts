import { prisma } from "@/lib/db";
import type { PlayerSeasonRow, RosterRow } from "@/lib/match";

// The one feature that reads the audit table, and only for the three sim inputs.
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
