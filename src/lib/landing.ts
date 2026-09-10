import { pedigreeOf, ROUND_LABELS } from "@/lib/bracket";
import { difficultyBand } from "@/lib/tournament-view";
import type { BracketRoundId, PlayoffRound } from "@/types/bracket";
import type { Conference, Position } from "@/types/game";

// Counted from the committed files under src/data/db — never imported here, they are megabytes.
export const LANDING_STATS = [
  // src/data/db/player.ts
  { value: 3755, label: "Players" },
  // src/data/db/player_season.ts
  { value: 20260, label: "Rated player-seasons" },
  // src/data/db/team_season.ts
  { value: 1292, label: "Team-seasons in the pool" },
  // src/data/db/playoff_participation.ts
  { value: 724, label: "Real playoff appearances" },
  // 1981-2026 inclusive, the range of every table above
  { value: 46, label: "Seasons · 1981—2026" },
] as const;

export const FIRST_SEASON = 1981;
export const LAST_SEASON = 2026;

export type HeroSlot = {
  position: Position;
  name: string;
  seasonYear: number;
  teamName: string;
  teamSlug: string;
  rating: number;
};

// Every field checked against player.ts, player_season.ts and player_season_team.ts.
export const HERO_SLOTS: readonly HeroSlot[] = [
  {
    position: "PG",
    name: "Magic Johnson",
    seasonYear: 1991,
    teamName: "Los Angeles Lakers",
    teamSlug: "LAL",
    rating: 96,
  },
  {
    position: "SG",
    name: "Michael Jordan",
    seasonYear: 1996,
    teamName: "Chicago Bulls",
    teamSlug: "CHI",
    rating: 98,
  },
  {
    position: "SF",
    name: "LeBron James",
    seasonYear: 2012,
    teamName: "Miami Heat",
    teamSlug: "MIA",
    rating: 98,
  },
  {
    position: "PF",
    name: "Tim Duncan",
    seasonYear: 2003,
    teamName: "San Antonio Spurs",
    teamSlug: "SAS",
    rating: 96,
  },
  {
    position: "C",
    name: "Shaquille O'Neal",
    seasonYear: 2000,
    teamName: "Los Angeles Lakers",
    teamSlug: "LAL",
    rating: 98,
  },
];

// Same man, two seasons — the duplicate rule, shown rather than asserted.
export const DUPLICATE_EXAMPLE = {
  name: "LeBron James",
  teamName: "Cleveland Cavaliers",
  taken: { seasonYear: 2008, rating: 97 },
  blocked: { seasonYear: 2016, rating: 96 },
} as const;

type LadderRow = {
  round: BracketRoundId;
  teamSlug: string;
  teamName: string;
  seasonYear: number;
  conference: Conference;
  seed: number;
  roundReached: PlayoffRound;
  wins: number;
  losses: number;
};

// Rows copied from playoff_participation.ts. Pedigree is derived below, never written
// here, so the ladder cannot claim a difficulty the real generator would not produce.
const LADDER_ROWS: readonly LadderRow[] = [
  {
    round: "FIRST_ROUND",
    teamSlug: "IND",
    teamName: "Indiana Pacers",
    seasonYear: 2005,
    conference: "EAST",
    seed: 6,
    roundReached: "CONFERENCE_SEMIS",
    wins: 6,
    losses: 7,
  },
  {
    round: "CONFERENCE_SEMIS",
    teamSlug: "CHI",
    teamName: "Chicago Bulls",
    seasonYear: 1989,
    conference: "EAST",
    seed: 6,
    roundReached: "CONFERENCE_FINALS",
    wins: 9,
    losses: 8,
  },
  {
    round: "CONFERENCE_FINALS",
    teamSlug: "NYK",
    teamName: "New York Knicks",
    seasonYear: 1999,
    conference: "EAST",
    seed: 8,
    roundReached: "NBA_FINALS",
    wins: 12,
    losses: 8,
  },
  // The other conference — the Finals opponent never comes from the run's own path.
  {
    round: "NBA_FINALS",
    teamSlug: "GSW",
    teamName: "Golden State Warriors",
    seasonYear: 2017,
    conference: "WEST",
    seed: 1,
    roundReached: "CHAMPION",
    wins: 16,
    losses: 1,
  },
];

export const LADDER_ROUNDS = LADDER_ROWS.map((row) => {
  const pedigree = pedigreeOf({ ...row, team: { name: row.teamName } });

  return {
    ...row,
    label: ROUND_LABELS[row.round],
    pedigree,
    band: difficultyBand(pedigree),
  };
});
