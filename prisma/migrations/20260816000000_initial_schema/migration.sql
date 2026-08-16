-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('PG', 'SG', 'SF', 'PF', 'C');

-- CreateEnum
CREATE TYPE "Conference" AS ENUM ('EAST', 'WEST');

-- CreateEnum
CREATE TYPE "PlayoffRound" AS ENUM ('FIRST_ROUND', 'CONFERENCE_SEMIS', 'CONFERENCE_FINALS', 'NBA_FINALS', 'CHAMPION');

-- CreateTable
CREATE TABLE "players" (
    "slug" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "teams" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conference" "Conference" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "team_seasons" (
    "id" TEXT NOT NULL,
    "team_slug" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_seasons" (
    "id" TEXT NOT NULL,
    "player_slug" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "player_season_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "games_played" INTEGER NOT NULL,
    "minutes_played" INTEGER NOT NULL,
    "player_efficiency_rating" DOUBLE PRECISION,
    "box_plus_minus" DOUBLE PRECISION,
    "vorp" DOUBLE PRECISION,
    "win_shares_per_48" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_season_data_pkey" PRIMARY KEY ("player_season_id")
);

-- CreateTable
CREATE TABLE "playoff_participation" (
    "id" TEXT NOT NULL,
    "team_slug" TEXT NOT NULL,
    "season_year" INTEGER NOT NULL,
    "conference" "Conference" NOT NULL,
    "seed" INTEGER NOT NULL,
    "round_reached" "PlayoffRound" NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playoff_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_seasons_season_year_idx" ON "team_seasons"("season_year");

-- CreateIndex
CREATE INDEX "team_seasons_rating_idx" ON "team_seasons"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "team_seasons_team_slug_season_year_key" ON "team_seasons"("team_slug", "season_year");

-- CreateIndex
CREATE INDEX "player_seasons_season_year_idx" ON "player_seasons"("season_year");

-- CreateIndex
CREATE UNIQUE INDEX "player_seasons_player_slug_season_year_key" ON "player_seasons"("player_slug", "season_year");

-- CreateIndex
CREATE INDEX "player_season_teams_team_season_id_idx" ON "player_season_teams"("team_season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_teams_player_season_id_team_season_id_key" ON "player_season_teams"("player_season_id", "team_season_id");

-- CreateIndex
CREATE INDEX "playoff_participation_season_year_idx" ON "playoff_participation"("season_year");

-- CreateIndex
CREATE INDEX "playoff_participation_conference_season_year_idx" ON "playoff_participation"("conference", "season_year");

-- CreateIndex
CREATE UNIQUE INDEX "playoff_participation_team_slug_season_year_key" ON "playoff_participation"("team_slug", "season_year");

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_team_slug_fkey" FOREIGN KEY ("team_slug") REFERENCES "teams"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_player_slug_fkey" FOREIGN KEY ("player_slug") REFERENCES "players"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_teams" ADD CONSTRAINT "player_season_teams_player_season_id_fkey" FOREIGN KEY ("player_season_id") REFERENCES "player_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_teams" ADD CONSTRAINT "player_season_teams_team_season_id_fkey" FOREIGN KEY ("team_season_id") REFERENCES "team_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_data" ADD CONSTRAINT "player_season_data_player_season_id_fkey" FOREIGN KEY ("player_season_id") REFERENCES "player_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_participation" ADD CONSTRAINT "playoff_participation_team_slug_fkey" FOREIGN KEY ("team_slug") REFERENCES "teams"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

