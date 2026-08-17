import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PLAYERS } from "../src/data/db/player.ts";
import { TEAMS } from "../src/data/db/team.ts";
import { TEAM_SEASONS } from "../src/data/db/team_season.ts";
import { PLAYER_SEASONS } from "../src/data/db/player_season.ts";
import { PLAYER_SEASON_TEAMS } from "../src/data/db/player_season_team.ts";
import { PLAYER_SEASON_DATA } from "../src/data/db/player_season_data.ts";
import { PLAYOFF_PARTICIPATION } from "../src/data/db/playoff_participation.ts";

const CHUNK_SIZE = 1000;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string."
  );
  process.exit(1);
}

// Node strips types but doesn't resolve the `@/` alias, so this script can't
// import the `@/lib/db` singleton and constructs its own client instead.
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const insertAll = async <T,>(
  label: string,
  rows: readonly T[],
  insert: (chunk: T[]) => Promise<{ count: number }>
) => {
  let inserted = 0;
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    const { count } = await insert(rows.slice(start, start + CHUNK_SIZE));
    inserted += count;
  }
  console.log(`  ${label.padEnd(22)} ${inserted} rows`);
};

const clear = async () => {
  // Children first — every foreign key is `onDelete: Cascade`, but deleting in
  // dependency order keeps the runner honest about what it owns.
  await prisma.playerSeasonData.deleteMany();
  await prisma.playerSeasonTeam.deleteMany();
  await prisma.playoffParticipation.deleteMany();
  await prisma.playerSeason.deleteMany();
  await prisma.teamSeason.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
};

const load = async () => {
  await insertAll("players", PLAYERS, (data) =>
    prisma.player.createMany({ data })
  );
  await insertAll("teams", TEAMS, (data) => prisma.team.createMany({ data }));
  await insertAll("team_seasons", TEAM_SEASONS, (data) =>
    prisma.teamSeason.createMany({ data })
  );
  await insertAll("player_seasons", PLAYER_SEASONS, (data) =>
    prisma.playerSeason.createMany({ data })
  );
  await insertAll("player_season_teams", PLAYER_SEASON_TEAMS, (data) =>
    prisma.playerSeasonTeam.createMany({ data })
  );
  await insertAll("player_season_data", PLAYER_SEASON_DATA, (data) =>
    prisma.playerSeasonData.createMany({ data })
  );
  await insertAll("playoff_participation", PLAYOFF_PARTICIPATION, (data) =>
    prisma.playoffParticipation.createMany({ data })
  );
};

const verify = async () => {
  const expected: [string, number, () => Promise<number>][] = [
    ["players", PLAYERS.length, () => prisma.player.count()],
    ["teams", TEAMS.length, () => prisma.team.count()],
    ["team_seasons", TEAM_SEASONS.length, () => prisma.teamSeason.count()],
    [
      "player_seasons",
      PLAYER_SEASONS.length,
      () => prisma.playerSeason.count(),
    ],
    [
      "player_season_teams",
      PLAYER_SEASON_TEAMS.length,
      () => prisma.playerSeasonTeam.count(),
    ],
    [
      "player_season_data",
      PLAYER_SEASON_DATA.length,
      () => prisma.playerSeasonData.count(),
    ],
    [
      "playoff_participation",
      PLAYOFF_PARTICIPATION.length,
      () => prisma.playoffParticipation.count(),
    ],
  ];

  const mismatches: string[] = [];
  for (const [table, count, read] of expected) {
    const actual = await read();
    if (actual !== count)
      mismatches.push(
        `${table}: expected ${count} rows, database has ${actual}`
      );
  }

  if (mismatches.length > 0) {
    console.error("\nRow count verification failed:\n");
    for (const mismatch of mismatches) console.error(`  - ${mismatch}`);
    process.exit(1);
  }

  const total = expected.reduce((sum, [, count]) => sum + count, 0);
  console.log(`\nVerified ${total} rows across ${expected.length} tables.`);
};

const main = async () => {
  console.log("Clearing existing rows…");
  await clear();
  console.log("Loading src/data/db/…");
  await load();
  await verify();
};

try {
  await main();
} catch (error) {
  console.error("\nIngestion failed — the database may be partially loaded.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
