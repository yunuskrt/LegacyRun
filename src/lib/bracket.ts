import { z } from "zod";
import { drawIndex, seededRng } from "@/lib/rng";
import { teamLogoPath } from "@/lib/team-logo";
import type { Rng } from "@/lib/rng";
import type {
  Bracket,
  BracketMatchup,
  BracketOpponent,
  BracketRound,
  BracketRoundId,
  BracketSlot,
  PlayoffRound,
} from "@/types/bracket";
import type { Conference } from "@/types/game";

export type PlayoffTeamRow = {
  teamSlug: string;
  seasonYear: number;
  conference: Conference;
  seed: number;
  roundReached: PlayoffRound;
  wins: number;
  losses: number;
  team: { name: string };
};

export type BracketQuery = {
  conference: Conference;
  squadRating: number;
  exclude: string[];
  runSeed?: string;
};

export type PedigreeBand = { min: number; max: number };

const ROUND_BASE: Record<PlayoffRound, number> = {
  FIRST_ROUND: 30,
  CONFERENCE_SEMIS: 48,
  CONFERENCE_FINALS: 64,
  NBA_FINALS: 80,
  CHAMPION: 92,
};

const SEED_BONUS_MAX = 12;
const RECORD_BONUS_MAX = 6;

// 1981-83 ran 12-team brackets seeded 1-6; every later season is 1-8.
export const maxSeedFor = (seasonYear: number): number =>
  seasonYear <= 1983 ? 6 : 8;

export const pedigreeOf = (row: PlayoffTeamRow): number => {
  const maxSeed = maxSeedFor(row.seasonYear);
  const seedBonus = (SEED_BONUS_MAX * (maxSeed + 1 - row.seed)) / maxSeed;
  const games = row.wins + row.losses;
  const recordBonus = games > 0 ? (RECORD_BONUS_MAX * row.wins) / games : 0;
  const score = ROUND_BASE[row.roundReached] + seedBonus + recordBonus;

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const teamSeasonIdOf = (row: PlayoffTeamRow): string =>
  `${row.teamSlug}-${row.seasonYear}`;

export const toBracketOpponent = (row: PlayoffTeamRow): BracketOpponent => ({
  teamSeasonId: teamSeasonIdOf(row),
  teamSlug: row.teamSlug,
  teamName: row.team.name,
  teamLogo: teamLogoPath(row.teamSlug),
  seasonYear: row.seasonYear,
  conference: row.conference,
  seed: row.seed,
  roundReached: row.roundReached,
  wins: row.wins,
  losses: row.losses,
  pedigree: pedigreeOf(row),
});

export const BANDS = {
  FIRST_ROUND: { min: 30, max: 56 },
  CONFERENCE_SEMIS: { min: 50, max: 72 },
  CONFERENCE_FINALS: { min: 64, max: 88 },
  NBA_FINALS: { min: 80, max: 100 },
} as const satisfies Record<BracketRoundId, PedigreeBand>;

// The Finals opponent must be a team that actually reached the Finals. The band
// alone doesn't guarantee it — a conference finalist can score 82.
export const FINALS_ROUNDS: readonly PlayoffRound[] = [
  "NBA_FINALS",
  "CHAMPION",
];

export const ROUND_LABELS: Record<BracketRoundId, string> = {
  FIRST_ROUND: "Round 1",
  CONFERENCE_SEMIS: "Conference Semifinals",
  CONFERENCE_FINALS: "Conference Finals",
  NBA_FINALS: "NBA Finals",
};

// A bracket slot is a structural position, not a strength seed: strength-ordered
// seeding would put the best opponent in round 2, which the escalating-difficulty
// constraint forbids. An opponent's real seed lives on `BracketOpponent.seed`.
const SQUAD_SLOT_FLOORS: readonly (readonly [number, number])[] = [
  [88, 1],
  [82, 2],
  [76, 3],
  [70, 4],
  [64, 5],
  [58, 6],
  [52, 7],
];

export const squadSlotFor = (squadRating: number): number =>
  SQUAD_SLOT_FLOORS.find(([floor]) => squadRating >= floor)?.[1] ?? 8;

const FIRST_ROUND_PAIRS: readonly (readonly [number, number])[] = [
  [1, 8],
  [4, 5],
  [3, 6],
  [2, 7],
];

const BRACKET_HALVES: readonly (readonly number[])[] = [
  [1, 8, 4, 5],
  [2, 7, 3, 6],
];

export const oppositeConference = (conference: Conference): Conference =>
  conference === "EAST" ? "WEST" : "EAST";

// Deterministic candidate order so the same runSeed always draws the same team.
const compareOpponents = (a: BracketOpponent, b: BracketOpponent): number =>
  a.seed - b.seed ||
  a.teamSlug.localeCompare(b.teamSlug) ||
  a.seasonYear - b.seasonYear;

type DrawState = {
  pool: readonly BracketOpponent[];
  usedSlugs: Set<string>;
  rng: Rng;
};

const drawGroup = (
  state: DrawState,
  band: PedigreeBand,
  floor: number,
  count: number
): BracketOpponent[] | null => {
  const drawn: BracketOpponent[] = [];

  for (let index = 0; index < count; index += 1) {
    const eligible = state.pool.filter(
      (opponent) =>
        opponent.pedigree >= band.min &&
        opponent.pedigree <= band.max &&
        opponent.pedigree > floor &&
        !state.usedSlugs.has(opponent.teamSlug)
    );

    if (eligible.length === 0) return null;

    const picked = eligible[drawIndex(eligible.length, state.rng)];
    state.usedSlugs.add(picked.teamSlug);
    drawn.push(picked);
  }

  return drawn;
};

const highestPedigree = (opponents: readonly BracketOpponent[]): number =>
  opponents.reduce((max, opponent) => Math.max(max, opponent.pedigree), 0);

const opponentSlot = (
  opponent: BracketOpponent,
  bracketSlot: number | null
): BracketSlot => ({ side: "OPPONENT", bracketSlot, opponent });

const emptyMatchup = (id: string, round: BracketRoundId): BracketMatchup => ({
  id,
  round,
  home: null,
  away: null,
  winner: null,
});

export const generateBracket = (
  rows: readonly PlayoffTeamRow[],
  query: BracketQuery,
  runSeed: string
): Bracket | null => {
  const excluded = new Set(query.exclude);
  const opponents = rows
    .filter((row) => !excluded.has(teamSeasonIdOf(row)))
    .map(toBracketOpponent)
    .sort(compareOpponents);

  const rng = seededRng(runSeed);
  const usedSlugs = new Set<string>();
  const home: DrawState = {
    pool: opponents.filter((o) => o.conference === query.conference),
    usedSlugs,
    rng,
  };
  const away: DrawState = {
    pool: opponents.filter(
      (o) =>
        o.conference === oppositeConference(query.conference) &&
        FINALS_ROUNDS.includes(o.roundReached)
    ),
    usedSlugs,
    rng,
  };

  // Each group must clear the previous group's highest pedigree, so every path
  // through the bracket escalates no matter who wins.
  const firstRound = drawGroup(home, BANDS.FIRST_ROUND, -1, 1);
  if (!firstRound) return null;

  const semis = drawGroup(
    home,
    BANDS.CONFERENCE_SEMIS,
    highestPedigree(firstRound),
    2
  );
  if (!semis) return null;

  const conferenceFinals = drawGroup(
    home,
    BANDS.CONFERENCE_FINALS,
    highestPedigree(semis),
    4
  );
  if (!conferenceFinals) return null;

  const finals = drawGroup(
    away,
    BANDS.NBA_FINALS,
    highestPedigree(conferenceFinals),
    1
  );
  if (!finals) return null;

  const squadSlot = squadSlotFor(query.squadRating);
  const squadHalf =
    BRACKET_HALVES.find((half) => half.includes(squadSlot)) ??
    BRACKET_HALVES[0];
  const farHalf =
    BRACKET_HALVES.find((half) => !half.includes(squadSlot)) ??
    BRACKET_HALVES[1];
  const semisSeeds = squadHalf.filter(
    (seed) => seed !== squadSlot && seed !== 9 - squadSlot
  );

  const slotBySeed = new Map<number, BracketSlot>();
  slotBySeed.set(squadSlot, { side: "SQUAD", bracketSlot: squadSlot });
  slotBySeed.set(9 - squadSlot, opponentSlot(firstRound[0], 9 - squadSlot));
  semisSeeds.forEach((seed, index) =>
    slotBySeed.set(seed, opponentSlot(semis[index], seed))
  );
  farHalf.forEach((seed, index) =>
    slotBySeed.set(seed, opponentSlot(conferenceFinals[index], seed))
  );

  const rounds: BracketRound[] = [
    {
      id: "FIRST_ROUND",
      label: ROUND_LABELS.FIRST_ROUND,
      matchups: FIRST_ROUND_PAIRS.map(([high, low], index) => ({
        id: `r1-m${index + 1}`,
        round: "FIRST_ROUND" as const,
        home: slotBySeed.get(high) ?? null,
        away: slotBySeed.get(low) ?? null,
        winner: null,
      })),
    },
    {
      id: "CONFERENCE_SEMIS",
      label: ROUND_LABELS.CONFERENCE_SEMIS,
      matchups: [
        emptyMatchup("semis-m1", "CONFERENCE_SEMIS"),
        emptyMatchup("semis-m2", "CONFERENCE_SEMIS"),
      ],
    },
    {
      id: "CONFERENCE_FINALS",
      label: ROUND_LABELS.CONFERENCE_FINALS,
      matchups: [emptyMatchup("conf-finals", "CONFERENCE_FINALS")],
    },
    {
      id: "NBA_FINALS",
      label: ROUND_LABELS.NBA_FINALS,
      matchups: [
        {
          id: "finals",
          round: "NBA_FINALS",
          home: null,
          away: opponentSlot(finals[0], null),
          winner: null,
        },
      ],
    },
  ];

  return { runSeed, conference: query.conference, squadSlot, rounds };
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
  .pipe(z.array(teamSeasonId).max(8));

const bracketQuerySchema = z.object({
  conference: z.enum(["EAST", "WEST"]),
  squadRating: z.coerce.number().int().min(0).max(100),
  exclude: idList.optional(),
  runSeed: z
    .string()
    .trim()
    .regex(/^[a-z0-9]{1,32}$/)
    .optional(),
});

export const parseBracketQuery = (
  params: URLSearchParams
): BracketQuery | null => {
  const parsed = bracketQuerySchema.safeParse({
    conference: params.get("conference") ?? undefined,
    squadRating: params.get("squadRating") ?? undefined,
    exclude: params.get("exclude") ?? undefined,
    runSeed: params.get("runSeed") ?? undefined,
  });

  if (!parsed.success) return null;

  return {
    conference: parsed.data.conference,
    squadRating: parsed.data.squadRating,
    exclude: parsed.data.exclude ?? [],
    runSeed: parsed.data.runSeed,
  };
};
