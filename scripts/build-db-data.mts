import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RATED_PLAYER_SEASONS } from "../src/data/rating/season_players.ts";
import type { RatedPlayerSeason } from "../src/types/rating.ts";
import type {
  PlayerRow,
  PlayerSeasonDataRow,
  PlayerSeasonRow,
  PlayerSeasonTeamRow,
  PlayoffParticipationRow,
  TeamRow,
  TeamSeasonRow,
} from "../src/types/db-data.ts";

const OUT_DIR = path.join(process.cwd(), "src", "data", "db");
const PLAYOFF_CSV = path.join(
  process.cwd(),
  "src",
  "data",
  "raw",
  "playoffs",
  "playoff_teams.csv"
);

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type KnownPosition = (typeof POSITIONS)[number];

const POSITION_SET: ReadonlySet<string> = new Set(POSITIONS);

// Hand-authored: the source data carries only Basketball-Reference codes. Each
// code is its own franchise row with the name it played under, so relocations
// (SEA/OKC, VAN/MEM, WSB/WAS) stay distinct rather than folding into a successor.
const TEAM_DIRECTORY: Record<string, Omit<TeamRow, "slug">> = {
  ATL: { name: "Atlanta Hawks", conference: "EAST" },
  BOS: { name: "Boston Celtics", conference: "EAST" },
  BRK: { name: "Brooklyn Nets", conference: "EAST" },
  CHA: { name: "Charlotte Bobcats", conference: "EAST" },
  CHH: { name: "Charlotte Hornets", conference: "EAST" },
  CHI: { name: "Chicago Bulls", conference: "EAST" },
  CHO: { name: "Charlotte Hornets", conference: "EAST" },
  CLE: { name: "Cleveland Cavaliers", conference: "EAST" },
  DAL: { name: "Dallas Mavericks", conference: "WEST" },
  DEN: { name: "Denver Nuggets", conference: "WEST" },
  DET: { name: "Detroit Pistons", conference: "EAST" },
  GSW: { name: "Golden State Warriors", conference: "WEST" },
  HOU: { name: "Houston Rockets", conference: "WEST" },
  IND: { name: "Indiana Pacers", conference: "EAST" },
  KCK: { name: "Kansas City Kings", conference: "WEST" },
  LAC: { name: "Los Angeles Clippers", conference: "WEST" },
  LAL: { name: "Los Angeles Lakers", conference: "WEST" },
  MEM: { name: "Memphis Grizzlies", conference: "WEST" },
  MIA: { name: "Miami Heat", conference: "EAST" },
  MIL: { name: "Milwaukee Bucks", conference: "EAST" },
  MIN: { name: "Minnesota Timberwolves", conference: "WEST" },
  NJN: { name: "New Jersey Nets", conference: "EAST" },
  NOH: { name: "New Orleans Hornets", conference: "WEST" },
  NOK: { name: "New Orleans/Oklahoma City Hornets", conference: "WEST" },
  NOP: { name: "New Orleans Pelicans", conference: "WEST" },
  NYK: { name: "New York Knicks", conference: "EAST" },
  OKC: { name: "Oklahoma City Thunder", conference: "WEST" },
  ORL: { name: "Orlando Magic", conference: "EAST" },
  PHI: { name: "Philadelphia 76ers", conference: "EAST" },
  PHO: { name: "Phoenix Suns", conference: "WEST" },
  POR: { name: "Portland Trail Blazers", conference: "WEST" },
  SAC: { name: "Sacramento Kings", conference: "WEST" },
  SAS: { name: "San Antonio Spurs", conference: "WEST" },
  SDC: { name: "San Diego Clippers", conference: "WEST" },
  SEA: { name: "Seattle SuperSonics", conference: "WEST" },
  TOR: { name: "Toronto Raptors", conference: "EAST" },
  UTA: { name: "Utah Jazz", conference: "WEST" },
  VAN: { name: "Vancouver Grizzlies", conference: "WEST" },
  WAS: { name: "Washington Wizards", conference: "EAST" },
  WSB: { name: "Washington Bullets", conference: "EAST" },
};

const EXPECTED_ROW_COUNTS = {
  "player.ts": 3_755,
  "team.ts": 40,
  "team_season.ts": 1_292,
  "player_season.ts": 20_260,
  "player_season_team.ts": 22_705,
  "player_season_data.ts": 20_260,
  "playoff_participation.ts": 724,
} as const;

const errors: string[] = [];

const fail = (message: string) => {
  errors.push(message);
};

const seasonYearOf = (season: string): number => {
  const match = /^(\d{4})-(\d{4})$/.exec(season);
  if (!match) throw new Error(`unparseable Season value: ${season}`);
  return Number(match[2]);
};

const teamSeasonIdOf = (teamSlug: string, seasonYear: number) =>
  `${teamSlug}-${seasonYear}`;

const playerSeasonIdOf = (playerSlug: string, seasonYear: number) =>
  `${playerSlug}-${seasonYear}`;

type SourceRow = RatedPlayerSeason & { seasonYear: number };

const sourceRows: SourceRow[] = RATED_PLAYER_SEASONS.map((row) => ({
  ...row,
  seasonYear: seasonYearOf(row.Season),
}));

const buildPlayers = (): PlayerRow[] => {
  const bySlug = new Map<string, string>();
  for (const row of sourceRows) {
    const existing = bySlug.get(row.PlayerSlug);
    if (existing === undefined) {
      bySlug.set(row.PlayerSlug, row.PlayerName);
      continue;
    }
    if (existing !== row.PlayerName)
      fail(
        `player ${row.PlayerSlug} has conflicting names: "${existing}" vs "${row.PlayerName}"`
      );
  }
  return [...bySlug]
    .map(([slug, fullName]) => ({ slug, fullName }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
};

const buildTeams = (): TeamRow[] => {
  const slugs = new Set<string>();
  for (const row of sourceRows)
    for (const slug of row.TeamSlug) slugs.add(slug);

  for (const slug of slugs)
    if (!(slug in TEAM_DIRECTORY))
      fail(
        `team slug ${slug} appears in the source but has no directory entry`
      );
  for (const slug of Object.keys(TEAM_DIRECTORY))
    if (!slugs.has(slug))
      fail(
        `team slug ${slug} is in the directory but never appears in the source`
      );

  return [...slugs]
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => ({ slug, ...TEAM_DIRECTORY[slug] }));
};

type TeamRoster = {
  seasonYear: number;
  teamSlug: string;
  players: SourceRow[];
};

// Season → team → players. A traded player lands in every team array he
// appeared for that season, carrying the same combined-line rating.
const buildRosters = (): TeamRoster[] => {
  const rosters = new Map<string, TeamRoster>();
  for (const row of sourceRows) {
    for (const teamSlug of row.TeamSlug) {
      const key = teamSeasonIdOf(teamSlug, row.seasonYear);
      const roster = rosters.get(key);
      if (roster) roster.players.push(row);
      else
        rosters.set(key, {
          seasonYear: row.seasonYear,
          teamSlug,
          players: [row],
        });
    }
  }
  return [...rosters.values()].sort(
    (a, b) =>
      a.seasonYear - b.seasonYear || a.teamSlug.localeCompare(b.teamSlug)
  );
};

const byRatingThenSlug = (a: SourceRow, b: SourceRow) =>
  b.Rating - a.Rating || a.PlayerSlug.localeCompare(b.PlayerSlug);

// Best player at each of the five positions. A roster with no player at some
// position falls back to the highest-rated player not already counted, so the
// average is always over exactly five distinct players.
const lineupOf = (players: SourceRow[]): SourceRow[] => {
  const ranked = [...players].sort(byRatingThenSlug);
  const lineup: SourceRow[] = [];
  const used = new Set<string>();

  for (const position of POSITIONS) {
    const best = ranked.find(
      (player) => player.Position === position && !used.has(player.PlayerSlug)
    );
    if (best) {
      lineup.push(best);
      used.add(best.PlayerSlug);
    }
  }
  for (const player of ranked) {
    if (lineup.length === POSITIONS.length) break;
    if (used.has(player.PlayerSlug)) continue;
    lineup.push(player);
    used.add(player.PlayerSlug);
  }
  return lineup;
};

// Applied to the lineup sorted by rating, so a team's best player carries the
// most weight. A flat mean would rank five balanced 80s above a 99 plus four
// 75s, which is the opposite of how the sim will play.
const LINEUP_WEIGHTS = [0.32, 0.24, 0.19, 0.14, 0.11];

// The weighted lineup value is standardized over all team-seasons, then mapped
// through a logistic — the same shape Phase 8 uses for players. Without this the
// output band is just wherever a five-man average happens to land (55-87, no
// team above 90). The floor is 35 rather than 0 because the worst roster in NBA
// history is still an NBA roster.
const RATING_FLOOR = 35;
const RATING_CEILING = 99;
const RATING_STEEPNESS = 1.15;

const weightedLineupValue = (
  roster: TeamRoster
): { value: number; size: number } => {
  const lineup = lineupOf(roster.players);
  const ratings = lineup.map((player) => player.Rating).sort((a, b) => b - a);
  return {
    value: ratings.reduce(
      (sum, rating, index) => sum + rating * LINEUP_WEIGHTS[index],
      0
    ),
    size: lineup.length,
  };
};

const buildTeamSeasons = (rosters: TeamRoster[]): TeamSeasonRow[] => {
  const raw = rosters.map((roster) => {
    const { value, size } = weightedLineupValue(roster);
    if (size !== POSITIONS.length)
      fail(
        `${teamSeasonIdOf(roster.teamSlug, roster.seasonYear)} has only ${roster.players.length} players — cannot fill a five-man lineup`
      );
    return value;
  });

  const mean = raw.reduce((sum, value) => sum + value, 0) / raw.length;
  const variance =
    raw.reduce((sum, value) => sum + (value - mean) ** 2, 0) / raw.length;
  const deviation = Math.sqrt(variance);
  if (deviation === 0) fail("every team-season scored identically");

  return rosters.map(({ seasonYear, teamSlug }, index) => {
    const z = (raw[index] - mean) / deviation;
    const scaled =
      RATING_FLOOR +
      (RATING_CEILING - RATING_FLOOR) / (1 + Math.exp(-RATING_STEEPNESS * z));
    return {
      id: teamSeasonIdOf(teamSlug, seasonYear),
      teamSlug,
      seasonYear,
      rating: Math.round(scaled),
    };
  });
};

const buildPlayerSeasons = (): PlayerSeasonRow[] =>
  sourceRows.map((row) => {
    if (!POSITION_SET.has(row.Position))
      fail(
        `${playerSeasonIdOf(row.PlayerSlug, row.seasonYear)} has position "${row.Position}", which is not a Position enum value`
      );
    return {
      id: playerSeasonIdOf(row.PlayerSlug, row.seasonYear),
      playerSlug: row.PlayerSlug,
      seasonYear: row.seasonYear,
      age: row.Age,
      position: row.Position as KnownPosition,
      rating: row.Rating,
    };
  });

const buildPlayerSeasonTeams = (rosters: TeamRoster[]): PlayerSeasonTeamRow[] =>
  rosters.flatMap(({ seasonYear, teamSlug, players }) =>
    [...players]
      .sort((a, b) => a.PlayerSlug.localeCompare(b.PlayerSlug))
      .map((player) => ({
        playerSeasonId: playerSeasonIdOf(player.PlayerSlug, seasonYear),
        teamSeasonId: teamSeasonIdOf(teamSlug, seasonYear),
      }))
  );

const buildPlayerSeasonData = (): PlayerSeasonDataRow[] =>
  sourceRows.map((row) => ({
    playerSeasonId: playerSeasonIdOf(row.PlayerSlug, row.seasonYear),
    rank: row.Rank,
    gamesPlayed: row.GamesPlayed,
    minutesPlayed: row.MinutesPlayed,
    playerEfficiencyRating: row.PlayerEfficiencyRating,
    boxPlusMinus: row.BoxPlusMinus,
    vorp: row.ValueOverReplacementPlayer,
    winSharesPer48: row.WinSharesPer48Min,
  }));

type Conference = PlayoffParticipationRow["conference"];
type PlayoffRound = PlayoffParticipationRow["roundReached"];

const CONFERENCES: ReadonlySet<string> = new Set<Conference>(["EAST", "WEST"]);

// Deepest series a team appears in becomes its roundReached. A Finals winner is
// promoted to CHAMPION — the only value that depends on the outcome rather than
// the appearance.
const ROUND_BY_DEPTH: Record<number, PlayoffRound> = {
  1: "FIRST_ROUND",
  2: "CONFERENCE_SEMIS",
  3: "CONFERENCE_FINALS",
  4: "NBA_FINALS",
};

const PLAYOFF_ROUNDS: ReadonlySet<string> = new Set<PlayoffRound>([
  ...Object.values(ROUND_BY_DEPTH),
  "CHAMPION",
]);

// 1981-1983 ran 12-team brackets — the top two seeds in each conference had a
// first-round bye, so those seasons have four fewer participants.
const BYE_SEASON_TEAM_COUNT = 12;
const BYE_SEASONS: ReadonlySet<number> = new Set([1981, 1982, 1983]);
const STANDARD_SEASON_TEAM_COUNT = 16;

// The one franchise name in TEAM_DIRECTORY that maps to two codes. Playoff
// appearances run 1993-2002 under CHH and 2015-2016 under CHO, so the split is
// unambiguous.
const CHARLOTTE_HORNETS = "Charlotte Hornets";
const CHARLOTTE_HORNETS_SPLIT_YEAR = 2002;

const TEAM_SLUGS_BY_NAME = (() => {
  const byName = new Map<string, string[]>();
  for (const [slug, { name }] of Object.entries(TEAM_DIRECTORY)) {
    const slugs = byName.get(name);
    if (slugs) slugs.push(slug);
    else byName.set(name, [slug]);
  }
  return byName;
})();

const playoffTeamSlugOf = (name: string, seasonYear: number): string | null => {
  const slugs = TEAM_SLUGS_BY_NAME.get(name) ?? [];
  if (slugs.length === 1) return slugs[0];
  if (name === CHARLOTTE_HORNETS)
    return seasonYear <= CHARLOTTE_HORNETS_SPLIT_YEAR ? "CHH" : "CHO";
  fail(
    slugs.length === 0
      ? `playoff team "${name}" (${seasonYear}) has no TEAM_DIRECTORY entry`
      : `playoff team "${name}" (${seasonYear}) is ambiguous across ${slugs.join(", ")}`
  );
  return null;
};

const seriesDepthOf = (series: string): number | null => {
  if (series === "Finals") return 4;
  if (series.endsWith("First Round")) return 1;
  if (series.endsWith("Semifinals")) return 2;
  if (series.endsWith("Conf Finals")) return 3;
  return null;
};

// Finals rows carry no conference, but both finalists also appear in their own
// Conference Finals row, so every team still resolves.
const seriesConferenceOf = (series: string): Conference | null => {
  if (series.startsWith("Eastern")) return "EAST";
  if (series.startsWith("Western")) return "WEST";
  return null;
};

type PlayoffAppearance = {
  teamSlug: string;
  seasonYear: number;
  conference: Conference | null;
  seed: number;
  depth: number;
  wins: number;
  losses: number;
  wonFinals: boolean;
};

const PLAYOFF_CSV_COLUMNS = 13;
const TEAM_NAME_PATTERN = /^(.+) \((\d+)\)$/;

// Series-level source (one row per series, both teams on it) folded into
// team-level rows. Full derivation: context/docs/playoff-participation-derivation.md
const buildPlayoffParticipation = async (): Promise<
  PlayoffParticipationRow[]
> => {
  const csv = await readFile(PLAYOFF_CSV, "utf8");
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const appearances = new Map<string, PlayoffAppearance>();

  for (const [index, line] of lines.slice(1).entries()) {
    const cells = line.split(",");
    if (cells.length !== PLAYOFF_CSV_COLUMNS) {
      fail(
        `playoff CSV line ${index + 2} has ${cells.length} columns, expected ${PLAYOFF_CSV_COLUMNS}`
      );
      continue;
    }

    const seasonYear = Number(cells[0]);
    const series = cells[2];
    const depth = seriesDepthOf(series);
    if (!Number.isInteger(seasonYear) || depth === null) {
      fail(`playoff CSV line ${index + 2} has an unrecognized year or series`);
      continue;
    }
    const conference = seriesConferenceOf(series);

    for (const [self, opponent] of [
      [5, 8],
      [8, 5],
    ]) {
      const match = TEAM_NAME_PATTERN.exec(cells[self]);
      if (!match) {
        fail(
          `playoff CSV line ${index + 2} has an unparseable team cell "${cells[self]}"`
        );
        continue;
      }
      const teamSlug = playoffTeamSlugOf(match[1], seasonYear);
      if (teamSlug === null) continue;

      const seed = Number(match[2]);
      const wins = Number(cells[self + 1]);
      const losses = Number(cells[opponent + 1]);
      const key = teamSeasonIdOf(teamSlug, seasonYear);
      const existing = appearances.get(key);

      if (!existing) {
        appearances.set(key, {
          teamSlug,
          seasonYear,
          conference,
          seed,
          depth,
          wins,
          losses,
          wonFinals: depth === 4 && wins > losses,
        });
        continue;
      }
      if (existing.seed !== seed)
        fail(
          `${key} is seeded ${existing.seed} in one series and ${seed} in another`
        );
      if (conference !== null) existing.conference = conference;
      existing.depth = Math.max(existing.depth, depth);
      existing.wins += wins;
      existing.losses += losses;
      if (depth === 4 && wins > losses) existing.wonFinals = true;
    }
  }

  return [...appearances.values()]
    .sort(
      (a, b) =>
        a.seasonYear - b.seasonYear || a.teamSlug.localeCompare(b.teamSlug)
    )
    .map((appearance) => {
      if (appearance.conference === null)
        fail(
          `${teamSeasonIdOf(appearance.teamSlug, appearance.seasonYear)} appears only in Finals rows, so its conference is unresolvable`
        );
      return {
        id: teamSeasonIdOf(appearance.teamSlug, appearance.seasonYear),
        teamSlug: appearance.teamSlug,
        seasonYear: appearance.seasonYear,
        conference: appearance.conference as Conference,
        seed: appearance.seed,
        roundReached: appearance.wonFinals
          ? "CHAMPION"
          : ROUND_BY_DEPTH[appearance.depth],
        wins: appearance.wins,
        losses: appearance.losses,
      };
    });
};

const validate = (data: {
  players: PlayerRow[];
  teams: TeamRow[];
  teamSeasons: TeamSeasonRow[];
  playerSeasons: PlayerSeasonRow[];
  playerSeasonTeams: PlayerSeasonTeamRow[];
  playerSeasonData: PlayerSeasonDataRow[];
  playoffParticipation: PlayoffParticipationRow[];
}) => {
  const {
    players,
    teams,
    teamSeasons,
    playerSeasons,
    playerSeasonTeams,
    playerSeasonData,
    playoffParticipation,
  } = data;

  const playerSlugs = new Set(players.map((player) => player.slug));
  if (playerSlugs.size !== players.length)
    fail("player.ts has duplicate slugs");
  for (const player of players)
    if (player.fullName.trim() === "")
      fail(`player ${player.slug} has an empty fullName`);

  const teamSlugs = new Set(teams.map((team) => team.slug));
  if (teamSlugs.size !== teams.length) fail("team.ts has duplicate slugs");
  for (const team of teams) {
    if (team.name.trim() === "") fail(`team ${team.slug} has an empty name`);
    if (team.conference !== "EAST" && team.conference !== "WEST")
      fail(`team ${team.slug} has an invalid conference`);
  }

  const teamSeasonIds = new Set(teamSeasons.map((row) => row.id));
  if (teamSeasonIds.size !== teamSeasons.length)
    fail("team_season.ts has duplicate ids");
  for (const row of teamSeasons) {
    if (row.id !== teamSeasonIdOf(row.teamSlug, row.seasonYear))
      fail(`team-season ${row.id} does not match its teamSlug and seasonYear`);
    if (!teamSlugs.has(row.teamSlug))
      fail(`team-season ${row.id} references unknown team ${row.teamSlug}`);
    if (!Number.isInteger(row.rating))
      fail(`team-season ${row.id} has a non-integer rating`);
    if (row.rating < RATING_FLOOR || row.rating > RATING_CEILING)
      fail(`team-season ${row.id} rating ${row.rating} is outside the band`);
  }

  const playerSeasonIds = new Set(playerSeasons.map((row) => row.id));
  if (playerSeasonIds.size !== playerSeasons.length)
    fail("player_season.ts has duplicate ids");
  const seenPerSeason = new Set<string>();
  for (const row of playerSeasons) {
    if (row.id !== playerSeasonIdOf(row.playerSlug, row.seasonYear))
      fail(
        `player-season ${row.id} does not match its playerSlug and seasonYear`
      );
    if (!playerSlugs.has(row.playerSlug))
      fail(
        `player-season ${row.id} references unknown player ${row.playerSlug}`
      );
    if (!Number.isInteger(row.age) || !Number.isInteger(row.seasonYear))
      fail(`player-season ${row.id} has a non-integer age or seasonYear`);
    const key = `${row.seasonYear}:${row.playerSlug}`;
    if (seenPerSeason.has(key))
      fail(
        `player ${row.playerSlug} appears twice in season ${row.seasonYear}`
      );
    seenPerSeason.add(key);
  }

  const pairs = new Set<string>();
  const linkedPlayerSeasons = new Set<string>();
  for (const row of playerSeasonTeams) {
    const pair = `${row.playerSeasonId}|${row.teamSeasonId}`;
    if (pairs.has(pair))
      fail(`duplicate player-season/team-season pair ${pair}`);
    pairs.add(pair);
    if (!playerSeasonIds.has(row.playerSeasonId))
      fail(`join row references unknown player-season ${row.playerSeasonId}`);
    if (!teamSeasonIds.has(row.teamSeasonId))
      fail(`join row references unknown team-season ${row.teamSeasonId}`);
    linkedPlayerSeasons.add(row.playerSeasonId);
  }
  for (const id of playerSeasonIds)
    if (!linkedPlayerSeasons.has(id))
      fail(`player-season ${id} is not linked to any team-season`);

  const dataIds = new Set<string>();
  for (const row of playerSeasonData) {
    if (dataIds.has(row.playerSeasonId))
      fail(`player_season_data has duplicate row for ${row.playerSeasonId}`);
    dataIds.add(row.playerSeasonId);
    if (!playerSeasonIds.has(row.playerSeasonId))
      fail(`audit row references unknown player-season ${row.playerSeasonId}`);
    if (
      !Number.isInteger(row.rank) ||
      !Number.isInteger(row.gamesPlayed) ||
      !Number.isInteger(row.minutesPlayed)
    )
      fail(`audit row ${row.playerSeasonId} is missing rank/games/minutes`);
  }
  if (dataIds.size !== playerSeasonIds.size)
    fail("player_season_data row count does not match player_season");

  const participationIds = new Set(playoffParticipation.map((row) => row.id));
  if (participationIds.size !== playoffParticipation.length)
    fail("playoff_participation.ts has duplicate ids");
  const championsBySeason = new Map<number, number>();
  const teamsBySeason = new Map<number, number>();
  for (const row of playoffParticipation) {
    if (row.id !== teamSeasonIdOf(row.teamSlug, row.seasonYear))
      fail(
        `participation ${row.id} does not match its teamSlug and seasonYear`
      );
    if (!teamSlugs.has(row.teamSlug))
      fail(`participation ${row.id} references unknown team ${row.teamSlug}`);
    if (!teamSeasonIds.has(row.id))
      fail(`participation ${row.id} has no matching team-season`);
    if (!CONFERENCES.has(row.conference))
      fail(`participation ${row.id} has an invalid conference`);
    if (!PLAYOFF_ROUNDS.has(row.roundReached))
      fail(`participation ${row.id} has an invalid roundReached`);
    if (!Number.isInteger(row.seed) || row.seed < 1 || row.seed > 8)
      fail(`participation ${row.id} has seed ${row.seed}, outside 1-8`);
    if (!Number.isInteger(row.wins) || row.wins < 0)
      fail(`participation ${row.id} has an invalid wins value`);
    if (!Number.isInteger(row.losses) || row.losses < 0)
      fail(`participation ${row.id} has an invalid losses value`);

    teamsBySeason.set(
      row.seasonYear,
      (teamsBySeason.get(row.seasonYear) ?? 0) + 1
    );
    if (row.roundReached === "CHAMPION")
      championsBySeason.set(
        row.seasonYear,
        (championsBySeason.get(row.seasonYear) ?? 0) + 1
      );
  }
  for (const [seasonYear, count] of teamsBySeason) {
    const expected = BYE_SEASONS.has(seasonYear)
      ? BYE_SEASON_TEAM_COUNT
      : STANDARD_SEASON_TEAM_COUNT;
    if (count !== expected)
      fail(
        `season ${seasonYear} has ${count} playoff teams, expected ${expected}`
      );
    if (championsBySeason.get(seasonYear) !== 1)
      fail(
        `season ${seasonYear} has ${championsBySeason.get(seasonYear) ?? 0} champions, expected exactly 1`
      );
  }
};

const serializeRow = (row: object): string => {
  const fields = Object.entries(row).map(
    ([key, value]) => `${key}: ${JSON.stringify(value)}`
  );
  return `{ ${fields.join(", ")} }`;
};

const renderFile = (
  typeName: string,
  constName: string,
  rows: readonly object[]
): string => {
  const body = rows.map((row) => `  ${serializeRow(row)},`).join("\n");
  return [
    "// Generated by scripts/build-db-data.mts — do not edit by hand.",
    "// Regenerate with `npm run build:db-data`.",
    "",
    `import type { ${typeName} } from "@/types/db-data";`,
    "",
    `export const ${constName}: ${typeName}[] = [`,
    ...(body ? [body] : []),
    "];",
    "",
  ].join("\n");
};

const main = async () => {
  const players = buildPlayers();
  const teams = buildTeams();
  const rosters = buildRosters();
  const teamSeasons = buildTeamSeasons(rosters);
  const playerSeasons = buildPlayerSeasons();
  const playerSeasonTeams = buildPlayerSeasonTeams(rosters);
  const playerSeasonData = buildPlayerSeasonData();
  const playoffParticipation = await buildPlayoffParticipation();

  validate({
    players,
    teams,
    teamSeasons,
    playerSeasons,
    playerSeasonTeams,
    playerSeasonData,
    playoffParticipation,
  });

  const files = [
    ["player.ts", "PlayerRow", "PLAYERS", players],
    ["team.ts", "TeamRow", "TEAMS", teams],
    ["team_season.ts", "TeamSeasonRow", "TEAM_SEASONS", teamSeasons],
    ["player_season.ts", "PlayerSeasonRow", "PLAYER_SEASONS", playerSeasons],
    [
      "player_season_team.ts",
      "PlayerSeasonTeamRow",
      "PLAYER_SEASON_TEAMS",
      playerSeasonTeams,
    ],
    [
      "player_season_data.ts",
      "PlayerSeasonDataRow",
      "PLAYER_SEASON_DATA",
      playerSeasonData,
    ],
    [
      "playoff_participation.ts",
      "PlayoffParticipationRow",
      "PLAYOFF_PARTICIPATION",
      playoffParticipation,
    ],
  ] as const;

  for (const [filename, , , rows] of files) {
    const expected = EXPECTED_ROW_COUNTS[filename];
    if (rows.length !== expected)
      fail(
        `${filename}: expected ${expected} rows, built ${rows.length} — the source data changed, so confirm the difference before committing`
      );
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} validation error(s):\n`);
    for (const error of errors.slice(0, 25)) console.error(`  - ${error}`);
    if (errors.length > 25) console.error(`  … and ${errors.length - 25} more`);
    console.error("\nNo files written.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  for (const [filename, typeName, constName, rows] of files) {
    await writeFile(
      path.join(OUT_DIR, filename),
      renderFile(typeName, constName, rows),
      "utf8"
    );
    console.log(`  ${filename.padEnd(26)} ${rows.length} rows`);
  }
  console.log(`\nWrote ${files.length} files to src/data/db/`);
};

await main();
