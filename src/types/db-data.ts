import type {
  PlayerModel,
  PlayerSeasonDataModel,
  PlayerSeasonModel,
  PlayerSeasonTeamModel,
  PlayoffParticipationModel,
  TeamModel,
  TeamSeasonModel,
} from "@/generated/prisma/models";

// Derived from the Prisma models so a schema change breaks the generator loudly.
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
