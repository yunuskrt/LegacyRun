-- DropForeignKey
ALTER TABLE "rosters" DROP CONSTRAINT "rosters_team_id_fkey";

-- DropForeignKey
ALTER TABLE "rosters" DROP CONSTRAINT "rosters_season_id_fkey";

-- DropForeignKey
ALTER TABLE "rosters" DROP CONSTRAINT "rosters_player_id_fkey";

-- DropForeignKey
ALTER TABLE "player_season_ratings" DROP CONSTRAINT "player_season_ratings_player_id_fkey";

-- DropForeignKey
ALTER TABLE "player_season_ratings" DROP CONSTRAINT "player_season_ratings_season_id_fkey";

-- DropForeignKey
ALTER TABLE "team_season_ratings" DROP CONSTRAINT "team_season_ratings_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_season_ratings" DROP CONSTRAINT "team_season_ratings_season_id_fkey";

-- DropForeignKey
ALTER TABLE "playoff_participation" DROP CONSTRAINT "playoff_participation_season_id_fkey";

-- DropIndex
DROP INDEX "playoff_participation_season_id_idx";

-- DropIndex
DROP INDEX "playoff_participation_conference_season_id_idx";

-- DropIndex
DROP INDEX "playoff_participation_team_id_season_id_key";

-- AlterTable
ALTER TABLE "playoff_participation" DROP COLUMN "season_id",
ADD COLUMN     "season_year" INTEGER NOT NULL;

-- DropTable
DROP TABLE "seasons";

-- DropTable
DROP TABLE "rosters";

-- DropTable
DROP TABLE "player_season_ratings";

-- DropTable
DROP TABLE "team_season_ratings";

-- CreateTable
CREATE TABLE "team_seasons" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_seasons" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "positions" "Position"[],
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_season_teams" (
    "id" TEXT NOT NULL,
    "player_season_id" TEXT NOT NULL,
    "team_season_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_season_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_season_data" (
    "id" TEXT NOT NULL,
    "player_season_id" TEXT NOT NULL,
    "games_played" INTEGER NOT NULL,
    "minutes_played" INTEGER NOT NULL,
    "player_efficiency_rating" DOUBLE PRECISION,
    "box_plus_minus" DOUBLE PRECISION,
    "offensive_box_plus_minus" DOUBLE PRECISION,
    "defensive_box_plus_minus" DOUBLE PRECISION,
    "vorp" DOUBLE PRECISION,
    "win_shares_per_48" DOUBLE PRECISION,
    "true_shooting_pct" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_season_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_seasons_season_year_idx" ON "team_seasons"("season_year");

-- CreateIndex
CREATE INDEX "team_seasons_overall_rating_idx" ON "team_seasons"("overall_rating");

-- CreateIndex
CREATE UNIQUE INDEX "team_seasons_team_id_season_year_key" ON "team_seasons"("team_id", "season_year");

-- CreateIndex
CREATE INDEX "player_seasons_season_year_idx" ON "player_seasons"("season_year");

-- CreateIndex
CREATE UNIQUE INDEX "player_seasons_player_id_season_year_key" ON "player_seasons"("player_id", "season_year");

-- CreateIndex
CREATE INDEX "player_season_teams_team_season_id_idx" ON "player_season_teams"("team_season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_teams_player_season_id_team_season_id_key" ON "player_season_teams"("player_season_id", "team_season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_data_player_season_id_key" ON "player_season_data"("player_season_id");

-- CreateIndex
CREATE INDEX "playoff_participation_season_year_idx" ON "playoff_participation"("season_year");

-- CreateIndex
CREATE INDEX "playoff_participation_conference_season_year_idx" ON "playoff_participation"("conference", "season_year");

-- CreateIndex
CREATE UNIQUE INDEX "playoff_participation_team_id_season_year_key" ON "playoff_participation"("team_id", "season_year");

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_teams" ADD CONSTRAINT "player_season_teams_player_season_id_fkey" FOREIGN KEY ("player_season_id") REFERENCES "player_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_teams" ADD CONSTRAINT "player_season_teams_team_season_id_fkey" FOREIGN KEY ("team_season_id") REFERENCES "team_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_data" ADD CONSTRAINT "player_season_data_player_season_id_fkey" FOREIGN KEY ("player_season_id") REFERENCES "player_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

