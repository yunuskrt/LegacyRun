import type {
  PlayerModel,
  PlayerSeasonDataModel,
  PlayerSeasonModel,
  PlayerSeasonTeamModel,
  PlayoffParticipationModel,
  TeamModel,
  TeamSeasonModel,
} from "@/generated/prisma/models";

// Rows are derived from the Prisma models so a schema change breaks the
// generator rather than silently producing unloadable data. `createdAt` is
// database-defaulted and never emitted; `PlayerSeasonTeam.id` keeps its cuid
// default, unlike the deterministic ids on the two season-scoped tables.
export type PlayerRow = Omit<PlayerModel, "createdAt">;
export type TeamRow = Omit<TeamModel, "createdAt">;
export type TeamSeasonRow = Omit<TeamSeasonModel, "createdAt">;
export type PlayerSeasonRow = Omit<PlayerSeasonModel, "createdAt">;
export type PlayerSeasonTeamRow = Omit<
  PlayerSeasonTeamModel,
  "createdAt" | "id"
>;
export type PlayerSeasonDataRow = Omit<PlayerSeasonDataModel, "createdAt">;
export type PlayoffParticipationRow = Omit<
  PlayoffParticipationModel,
  "createdAt"
>;
