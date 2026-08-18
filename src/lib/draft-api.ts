import { z } from "zod";
import { teamLogoPath } from "@/lib/team-logo";
import type { DraftTeam, Position } from "@/types/game";

export const DRAFT_TEAM_MODES = [
  "random",
  "another-team",
  "another-season",
] as const;

export type DraftTeamMode = (typeof DRAFT_TEAM_MODES)[number];

export type Rng = () => number;

export type DraftTeamQuery =
  | { mode: "random"; excludeSeasons: string[] }
  | { mode: "another-team" | "another-season"; exclude: string };

export type TeamSeasonRosterRow = {
  id: string;
  teamSlug: string;
  seasonYear: number;
  rating: number;
  team: { name: string };
  playerSeasons: {
    playerSeason: {
      id: string;
      playerSlug: string;
      age: number;
      position: Position;
      rating: number;
      player: { fullName: string };
    };
  }[];
};

const teamSeasonId = z.string().trim().min(1).max(64);

const idList = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  )
  .pipe(z.array(teamSeasonId));

const draftTeamQuerySchema = z
  .object({
    mode: z.enum(DRAFT_TEAM_MODES).default("random"),
    exclude: teamSeasonId.optional(),
    excludeSeasons: idList.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "random") {
      if (value.exclude) {
        ctx.addIssue({
          code: "custom",
          path: ["exclude"],
          message: "exclude does not apply to mode=random",
        });
      }

      return;
    }

    if (!value.exclude) {
      ctx.addIssue({
        code: "custom",
        path: ["exclude"],
        message: `exclude is required when mode is ${value.mode}`,
      });
    }

    if (value.excludeSeasons) {
      ctx.addIssue({
        code: "custom",
        path: ["excludeSeasons"],
        message: `excludeSeasons does not apply to mode=${value.mode}`,
      });
    }
  });

export const parseDraftTeamQuery = (
  params: URLSearchParams
): DraftTeamQuery | null => {
  const parsed = draftTeamQuerySchema.safeParse(
    Object.fromEntries(params.entries())
  );

  if (!parsed.success) {
    return null;
  }

  const { mode, exclude, excludeSeasons } = parsed.data;

  if (mode === "random") {
    return { mode, excludeSeasons: excludeSeasons ?? [] };
  }

  return exclude ? { mode, exclude } : null;
};

export const parseTeamSeasonId = (value: string): string | null => {
  const parsed = teamSeasonId.safeParse(value);

  return parsed.success ? parsed.data : null;
};

export type TeamSeasonAnchor = { teamSlug: string; seasonYear: number };

// The two anchored rerolls are symmetric: Another Team holds the season and
// changes the franchise, Another Season holds the franchise and changes the year.
export const anotherTeamFilter = (anchor: TeamSeasonAnchor) => ({
  teamSlug: { not: anchor.teamSlug },
  seasonYear: anchor.seasonYear,
});

export const anotherSeasonFilter = (
  anchor: TeamSeasonAnchor,
  anchorId: string
) => ({
  teamSlug: anchor.teamSlug,
  id: { not: anchorId },
});

export type DraftTeamFetchers = {
  random: (excludeSeasons: readonly string[]) => Promise<DraftTeam | null>;
  anotherTeam: (excludeTeamSeasonId: string) => Promise<DraftTeam | null>;
  anotherSeason: (excludeTeamSeasonId: string) => Promise<DraftTeam | null>;
};

export const fetchDraftTeam = (
  query: DraftTeamQuery,
  fetchers: DraftTeamFetchers
): Promise<DraftTeam | null> => {
  switch (query.mode) {
    case "another-team":
      return fetchers.anotherTeam(query.exclude);
    case "another-season":
      return fetchers.anotherSeason(query.exclude);
    default:
      return fetchers.random(query.excludeSeasons);
  }
};

// Modulo guards the `rng() === 1` case, which would otherwise index past the end.
export const drawIndex = (total: number, rng: Rng): number =>
  total <= 0 ? 0 : Math.floor(rng() * total) % total;

export const toDraftTeam = (row: TeamSeasonRosterRow): DraftTeam => ({
  teamSeasonId: row.id,
  teamName: row.team.name,
  teamSlug: row.teamSlug,
  teamLogo: teamLogoPath(row.teamSlug),
  teamRating: row.rating,
  seasonYear: row.seasonYear,
  players: row.playerSeasons.map(({ playerSeason }) => ({
    playerId: playerSeason.playerSlug,
    playerSeasonId: playerSeason.id,
    name: playerSeason.player.fullName,
    age: playerSeason.age,
    position: playerSeason.position,
    rating: playerSeason.rating,
  })),
});
