-- CreateEnum
CREATE TYPE "PlayoffRound" AS ENUM ('FIRST_ROUND', 'CONFERENCE_SEMIS', 'CONFERENCE_FINALS', 'NBA_FINALS', 'CHAMPION');

-- CreateTable
CREATE TABLE "player_season_ratings" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "offensive_rating" DOUBLE PRECISION NOT NULL,
    "defensive_rating" DOUBLE PRECISION NOT NULL,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "games_played" INTEGER NOT NULL,
    "minutes_per_game" DOUBLE PRECISION NOT NULL,
    "points_per_game" DOUBLE PRECISION NOT NULL,
    "rebounds_per_game" DOUBLE PRECISION NOT NULL,
    "assists_per_game" DOUBLE PRECISION NOT NULL,
    "steals_per_game" DOUBLE PRECISION NOT NULL,
    "blocks_per_game" DOUBLE PRECISION NOT NULL,
    "true_shooting_pct" DOUBLE PRECISION NOT NULL,
    "usage_rate" DOUBLE PRECISION NOT NULL,
    "box_plus_minus" DOUBLE PRECISION,
    "defensive_box_plus_minus" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_season_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_season_ratings" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "offensive_rating" DOUBLE PRECISION NOT NULL,
    "defensive_rating" DOUBLE PRECISION NOT NULL,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_season_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playoff_participation" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "conference" "Conference" NOT NULL,
    "seed" INTEGER NOT NULL,
    "round_reached" "PlayoffRound" NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playoff_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_season_ratings_season_id_idx" ON "player_season_ratings"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_ratings_player_id_season_id_key" ON "player_season_ratings"("player_id", "season_id");

-- CreateIndex
CREATE INDEX "team_season_ratings_season_id_idx" ON "team_season_ratings"("season_id");

-- CreateIndex
CREATE INDEX "team_season_ratings_overall_rating_idx" ON "team_season_ratings"("overall_rating");

-- CreateIndex
CREATE UNIQUE INDEX "team_season_ratings_team_id_season_id_key" ON "team_season_ratings"("team_id", "season_id");

-- CreateIndex
CREATE INDEX "playoff_participation_season_id_idx" ON "playoff_participation"("season_id");

-- CreateIndex
CREATE INDEX "playoff_participation_conference_season_id_idx" ON "playoff_participation"("conference", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "playoff_participation_team_id_season_id_key" ON "playoff_participation"("team_id", "season_id");

-- AddForeignKey
ALTER TABLE "player_season_ratings" ADD CONSTRAINT "player_season_ratings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_ratings" ADD CONSTRAINT "player_season_ratings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_ratings" ADD CONSTRAINT "team_season_ratings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_ratings" ADD CONSTRAINT "team_season_ratings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_participation" ADD CONSTRAINT "playoff_participation_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_participation" ADD CONSTRAINT "playoff_participation_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

