import { prisma } from "@/lib/db";
import {
  anotherSeasonFilter,
  anotherTeamFilter,
  toDraftTeam,
} from "@/lib/draft-api";
import { drawIndex } from "@/lib/rng";
import type { TeamSeasonAnchor, TeamSeasonRosterRow } from "@/lib/draft-api";
import type { Rng } from "@/lib/rng";
import type { Prisma } from "@/generated/prisma/client";
import type { DraftTeam } from "@/types/game";

const rosterSelect = {
  id: true,
  teamSlug: true,
  seasonYear: true,
  rating: true,
  team: { select: { name: true } },
  playerSeasons: {
    select: {
      playerSeason: {
        select: {
          id: true,
          playerSlug: true,
          age: true,
          position: true,
          rating: true,
          player: { select: { fullName: true } },
        },
      },
    },
    orderBy: { playerSeason: { rating: "desc" } },
  },
} satisfies Prisma.TeamSeasonSelect;

const drawTeamSeason = async (
  where: Prisma.TeamSeasonWhereInput,
  rng: Rng
): Promise<TeamSeasonRosterRow | null> => {
  const total = await prisma.teamSeason.count({ where });

  if (total === 0) {
    return null;
  }

  const skip = drawIndex(total, rng);

  // `orderBy` is required for `skip` to address a stable row.
  const [row] = await prisma.teamSeason.findMany({
    where,
    select: rosterSelect,
    orderBy: { id: "asc" },
    skip,
    take: 1,
  });

  return row ?? null;
};

const anchorOf = async (
  teamSeasonId: string
): Promise<TeamSeasonAnchor | null> =>
  await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
    select: { teamSlug: true, seasonYear: true },
  });

export const getRandomTeamSeason = async (
  excludeSeasons: readonly string[] = [],
  rng: Rng = Math.random
): Promise<DraftTeam | null> => {
  const where: Prisma.TeamSeasonWhereInput =
    excludeSeasons.length > 0 ? { id: { notIn: [...excludeSeasons] } } : {};

  const row = await drawTeamSeason(where, rng);

  return row ? toDraftTeam(row) : null;
};

export const getRandomOtherTeam = async (
  excludeTeamSeasonId: string,
  rng: Rng = Math.random
): Promise<DraftTeam | null> => {
  const anchor = await anchorOf(excludeTeamSeasonId);

  if (!anchor) {
    return null;
  }

  const row = await drawTeamSeason(anotherTeamFilter(anchor), rng);

  return row ? toDraftTeam(row) : null;
};

export const getRandomOtherSeason = async (
  excludeTeamSeasonId: string,
  rng: Rng = Math.random
): Promise<DraftTeam | null> => {
  const anchor = await anchorOf(excludeTeamSeasonId);

  if (!anchor) {
    return null;
  }

  const row = await drawTeamSeason(
    anotherSeasonFilter(anchor, excludeTeamSeasonId),
    rng
  );

  return row ? toDraftTeam(row) : null;
};

export const getTeamSeasonById = async (
  teamSeasonId: string
): Promise<DraftTeam | null> => {
  const row = await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
    select: rosterSelect,
  });

  return row ? toDraftTeam(row) : null;
};
