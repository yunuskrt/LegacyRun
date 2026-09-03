import { z } from "zod";
import { splitIds } from "@/lib/query";
import { drawIndex, seededRng } from "@/lib/rng";
import { SQUAD_SIZE } from "@/types/game";
import type { Rng } from "@/lib/rng";
import type { Bracket, BracketMatchup, BracketSlot } from "@/types/bracket";
import type {
  GameResult,
  MatchData,
  MatchEvent,
  MatchPlayer,
  MatchSideId,
  MatchTeam,
  PeriodScore,
  ScoringLine,
  SeriesState,
} from "@/types/match";

// Rating the two sides ------------------------------------------------------
//
// Both reduce to a net rating in points per 100 possessions above average.
// team_seasons.rating is never read here — see context/docs/match-simulation.md
// §2. player_seasons.rating stays out of the math too; it is a card number.

export const SQUAD_WEIGHTS = [1.0, 0.8, 0.65, 0.52, 0.42] as const;

export const opponentNet = (players: readonly MatchPlayer[]): number => {
  let minutes = 0;
  let weighted = 0;

  for (const player of players) {
    // A null BPM is an MP = 0 row (Phase 7); it weighs nothing either way.
    if (player.boxPlusMinus === null || player.minutesPlayed <= 0) continue;

    minutes += player.minutesPlayed;
    weighted += player.boxPlusMinus * player.minutesPlayed;
  }

  // Five on-court BPMs sum to the team's net rating, so the ×5 is definitional.
  return minutes === 0 ? 0 : (5 * weighted) / minutes;
};

export const rawSquadScore = (players: readonly MatchPlayer[]): number =>
  players
    .map((player) => player.boxPlusMinus ?? 0)
    .sort((a, b) => b - a)
    .slice(0, SQUAD_WEIGHTS.length)
    .reduce((total, bpm, index) => total + SQUAD_WEIGHTS[index] * bpm, 0);

export const compressSquadNet = (raw: number): number =>
  26 / (1 + Math.exp(-(raw - 16) / 8)) - 8;

export const squadNet = (players: readonly MatchPlayer[]): number =>
  compressSquadNet(rawSquadScore(players));

export const netRatingOf = (team: MatchTeam): number =>
  team.kind === "SQUAD" ? squadNet(team.players) : opponentNet(team.players);

// Home court ----------------------------------------------------------------

export const HOME_COURT_NET = 2;

const HOME_COURT_PATTERN = [
  true,
  true,
  false,
  false,
  true,
  false,
  true,
] as const;

const otherSide = (side: MatchSideId): MatchSideId =>
  side === "HOME" ? "AWAY" : "HOME";

// The squad has no home city, so home court is earned rather than assigned.
// Ties go to the historical team.
export const homeCourtSide = (
  home: MatchTeam,
  away: MatchTeam,
  homeNet: number,
  awayNet: number
): MatchSideId => {
  if (homeNet !== awayNet) return homeNet > awayNet ? "HOME" : "AWAY";
  if (home.kind !== away.kind)
    return home.kind === "OPPONENT" ? "HOME" : "AWAY";

  return "HOME";
};

export const hostSideFor = (
  gameNumber: number,
  holder: MatchSideId
): MatchSideId =>
  HOME_COURT_PATTERN[gameNumber - 1] ? holder : otherSide(holder);

// The possession engine -----------------------------------------------------

// 1.05 × 100 possessions × 2 sides = 210 combined, mid-range for 1981-2026.
// The doc's 1.08 lands at 216 and misses its own 200-215 calibration target.
export const BASE_PPP = 1.05;
export const POSSESSIONS_PER_PERIOD = 25;
export const REGULATION_PERIODS = 4;
export const OVERTIME_POSSESSIONS = 11;
export const PERIOD_MINUTES = 12;
export const OVERTIME_MINUTES = 5;
export const MAX_OVERTIME_PERIODS = 12;

export const TURNOVER_RATE = 0.13;
export const THREE_RATE = 0.2;
export const AND_ONE_RATE = 0.08;
export const AND_ONE_FT_RATE = 0.75;

// Derived from the outcome table rather than written down, so the table and the
// points-per-possession target can never drift apart.
export const POINTS_PER_MADE =
  (1 - THREE_RATE - AND_ONE_RATE) * 2 +
  THREE_RATE * 3 +
  AND_ONE_RATE * (2 + AND_ONE_FT_RATE);

// Only total BPM was ingested, so the differential is halved onto each side.
// Over 100 possessions each, the expected margin is exactly that differential.
export const effectivePpp = (net: number, opposingNet: number): number =>
  BASE_PPP + (net - opposingNet) / 200;

export const makeProbability = (ppp: number): number =>
  Math.min(0.95, Math.max(0.05, ppp / ((1 - TURNOVER_RATE) * POINTS_PER_MADE)));

export type PossessionOutcome = {
  points: 0 | 2 | 3;
  andOne: boolean;
};

export const resolvePossession = (
  makeProb: number,
  rng: Rng
): PossessionOutcome => {
  if (rng() < TURNOVER_RATE) return { points: 0, andOne: false };
  if (rng() >= makeProb) return { points: 0, andOne: false };

  const shot = rng();

  if (shot < THREE_RATE) return { points: 3, andOne: false };

  if (shot < THREE_RATE + AND_ONE_RATE) {
    return { points: rng() < AND_ONE_FT_RATE ? 3 : 2, andOne: true };
  }

  return { points: 2, andOne: false };
};

// Who scored ----------------------------------------------------------------

export const scoringWeights = (team: MatchTeam): number[] => {
  const { players } = team;

  if (players.length === 0) return [];

  // The squad plays every minute together, so its shares reduce to PER alone.
  const equalMinutes = team.kind === "SQUAD";
  const totalMinutes = players.reduce(
    (total, player) => total + Math.max(0, player.minutesPlayed),
    0
  );

  return players.map((player) => {
    const per = player.playerEfficiencyRating;

    if (per === null || per <= 0) return 0;
    if (equalMinutes) return per;
    if (player.minutesPlayed <= 0 || totalMinutes <= 0) return 0;

    return (per * player.minutesPlayed) / totalMinutes;
  });
};

export const pickScorer = (team: MatchTeam, rng: Rng): MatchPlayer => {
  const weights = scoringWeights(team);
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) return team.players[drawIndex(team.players.length, rng)];

  let threshold = rng() * total;

  for (let index = 0; index < weights.length; index += 1) {
    threshold -= weights[index];
    if (threshold < 0) return team.players[index];
  }

  return team.players[team.players.length - 1];
};

export const formatClock = (
  elapsedFraction: number,
  periodMinutes: number
): string => {
  const remaining = Math.max(
    0,
    Math.round(periodMinutes * 60 * (1 - elapsedFraction))
  );

  return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
};

// Points first, then name, so a tie resolves the same way everywhere a scoring
// list is shown — the finished box score and the replay's running leaders alike.
export const byPointsDesc = (a: ScoringLine, b: ScoringLine): number =>
  b.points - a.points || a.playerName.localeCompare(b.playerName);

const tallyScoring = (
  events: readonly MatchEvent[],
  home: MatchTeam,
  away: MatchTeam
): ScoringLine[] => {
  const lines = new Map<string, ScoringLine>();

  for (const side of ["HOME", "AWAY"] as const) {
    for (const player of side === "HOME" ? home.players : away.players) {
      lines.set(`${side}:${player.playerSeasonId}`, {
        side,
        playerSeasonId: player.playerSeasonId,
        playerName: player.playerName,
        points: 0,
      });
    }
  }

  for (const event of events) {
    const line = lines.get(`${event.side}:${event.playerSeasonId}`);
    if (line) line.points += event.points;
  }

  return [...lines.values()]
    .filter((line) => line.points > 0)
    .sort(byPointsDesc);
};

// One game ------------------------------------------------------------------

export const simulateGame = (
  home: MatchTeam,
  away: MatchTeam,
  gameNumber: number,
  holder: MatchSideId,
  seed: string
): GameResult => {
  const rng = seededRng(seed);
  const hostSide = hostSideFor(gameNumber, holder);
  const homeNet =
    netRatingOf(home) + (hostSide === "HOME" ? HOME_COURT_NET : 0);
  const awayNet =
    netRatingOf(away) + (hostSide === "AWAY" ? HOME_COURT_NET : 0);
  const homeMake = makeProbability(effectivePpp(homeNet, awayNet));
  const awayMake = makeProbability(effectivePpp(awayNet, homeNet));

  const events: MatchEvent[] = [];
  const periodScores: PeriodScore[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let possession = 0;
  let period = 0;

  const playPeriod = (possessionsPerSide: number, minutes: number) => {
    period += 1;
    const openingHome = homeScore;
    const openingAway = awayScore;

    for (let index = 0; index < possessionsPerSide; index += 1) {
      const elapsed = (index + 1) / possessionsPerSide;

      for (const side of ["HOME", "AWAY"] as const) {
        possession += 1;

        const team = side === "HOME" ? home : away;
        const outcome = resolvePossession(
          side === "HOME" ? homeMake : awayMake,
          rng
        );

        if (outcome.points === 0) continue;

        const scorer = pickScorer(team, rng);

        if (side === "HOME") homeScore += outcome.points;
        else awayScore += outcome.points;

        events.push({
          possession,
          period,
          clock: formatClock(elapsed, minutes),
          side,
          playerSeasonId: scorer.playerSeasonId,
          playerName: scorer.playerName,
          points: outcome.points,
          andOne: outcome.andOne,
          homeScore,
          awayScore,
        });
      }
    }

    periodScores.push({
      period,
      home: homeScore - openingHome,
      away: awayScore - openingAway,
    });
  };

  for (let index = 0; index < REGULATION_PERIODS; index += 1) {
    playPeriod(POSSESSIONS_PER_PERIOD, PERIOD_MINUTES);
  }

  let overtimes = 0;

  while (homeScore === awayScore) {
    // Unreachable in practice — consecutive tied overtimes fall off a cliff.
    // Throwing beats looping forever or inventing a tiebreak nobody specced.
    if (overtimes >= MAX_OVERTIME_PERIODS) {
      throw new Error(`game ${seed} stayed tied after ${overtimes} overtimes`);
    }

    playPeriod(OVERTIME_POSSESSIONS, OVERTIME_MINUTES);
    overtimes += 1;
  }

  return {
    gameNumber,
    seed,
    hostSide,
    homeScore,
    awayScore,
    periodScores,
    winner: homeScore > awayScore ? "HOME" : "AWAY",
    events,
    scoring: tallyScoring(events, home, away),
  };
};

// One series ----------------------------------------------------------------

export const SERIES_WINS_NEEDED = 4;
export const MAX_SERIES_GAMES = 7;

export const gameSeed = (
  runSeed: string,
  matchupId: string,
  gameNumber: number
): string => `${runSeed}:${matchupId}:g${gameNumber}`;

export const simulateSeries = (
  matchupId: string,
  home: MatchTeam,
  away: MatchTeam,
  runSeed: string
): SeriesState => {
  const holder = homeCourtSide(
    home,
    away,
    netRatingOf(home),
    netRatingOf(away)
  );
  const games: GameResult[] = [];
  let homeWins = 0;
  let awayWins = 0;

  for (
    let gameNumber = 1;
    gameNumber <= MAX_SERIES_GAMES &&
    homeWins < SERIES_WINS_NEEDED &&
    awayWins < SERIES_WINS_NEEDED;
    gameNumber += 1
  ) {
    const game = simulateGame(
      home,
      away,
      gameNumber,
      holder,
      gameSeed(runSeed, matchupId, gameNumber)
    );

    games.push(game);

    if (game.winner === "HOME") homeWins += 1;
    else awayWins += 1;
  }

  return {
    matchupId,
    homeWins,
    awayWins,
    winner:
      homeWins === SERIES_WINS_NEEDED
        ? "HOME"
        : awayWins === SERIES_WINS_NEEDED
          ? "AWAY"
          : null,
    games,
  };
};

// Driving the bracket -------------------------------------------------------

type Advancement = {
  matchupId: string;
  into: string;
  slot: "home" | "away";
};

export const ADVANCEMENTS: readonly Advancement[] = [
  { matchupId: "r1-m1", into: "semis-m1", slot: "home" },
  { matchupId: "r1-m2", into: "semis-m1", slot: "away" },
  { matchupId: "r1-m3", into: "semis-m2", slot: "home" },
  { matchupId: "r1-m4", into: "semis-m2", slot: "away" },
  { matchupId: "semis-m1", into: "conf-finals", slot: "home" },
  { matchupId: "semis-m2", into: "conf-finals", slot: "away" },
  { matchupId: "conf-finals", into: "finals", slot: "home" },
];

export const allMatchups = (bracket: Bracket): BracketMatchup[] =>
  bracket.rounds.flatMap((round) => round.matchups);

export const findMatchup = (
  bracket: Bracket,
  matchupId: string
): BracketMatchup | null =>
  allMatchups(bracket).find((matchup) => matchup.id === matchupId) ?? null;

export const advanceBracket = (
  bracket: Bracket,
  matchupId: string,
  winner: MatchSideId
): Bracket => {
  const matchup = findMatchup(bracket, matchupId);
  const winnerSlot = winner === "HOME" ? matchup?.home : matchup?.away;

  if (!matchup || !winnerSlot) return bracket;

  const advancement = ADVANCEMENTS.find(
    (entry) => entry.matchupId === matchupId
  );

  return {
    ...bracket,
    rounds: bracket.rounds.map((round) => ({
      ...round,
      matchups: round.matchups.map((current) => {
        if (current.id === matchupId) return { ...current, winner: winnerSlot };

        if (advancement && current.id === advancement.into) {
          return advancement.slot === "home"
            ? { ...current, home: winnerSlot }
            : { ...current, away: winnerSlot };
        }

        return current;
      }),
    })),
  };
};

export const SQUAD_TEAM_ID = "SQUAD";

export const teamForSlot = (
  slot: BracketSlot | null,
  data: MatchData,
  squadName: string
): MatchTeam | null => {
  if (!slot) return null;

  if (slot.side === "SQUAD") {
    return {
      kind: "SQUAD",
      id: SQUAD_TEAM_ID,
      name: squadName,
      players: data.squad,
    };
  }

  const roster = data.opponents.find(
    (opponent) => opponent.teamSeasonId === slot.opponent.teamSeasonId
  );

  if (!roster || roster.players.length === 0) return null;

  return {
    kind: "OPPONENT",
    id: slot.opponent.teamSeasonId,
    name: slot.opponent.teamName,
    players: roster.players,
  };
};

export const isSquadMatchup = (matchup: BracketMatchup): boolean =>
  matchup.home?.side === "SQUAD" || matchup.away?.side === "SQUAD";

export type PlayedMatchup = {
  bracket: Bracket;
  series: SeriesState;
};

export const playMatchup = (
  bracket: Bracket,
  matchupId: string,
  data: MatchData,
  squadName: string,
  runSeed: string
): PlayedMatchup | null => {
  const matchup = findMatchup(bracket, matchupId);

  if (!matchup || matchup.winner) return null;

  const home = teamForSlot(matchup.home, data, squadName);
  const away = teamForSlot(matchup.away, data, squadName);

  if (!home || !away) return null;

  const series = simulateSeries(matchupId, home, away, runSeed);

  if (!series.winner) return null;

  return { bracket: advanceBracket(bracket, matchupId, series.winner), series };
};

// The far half resolves itself so the bracket can show who is coming. These are
// never the player's games and are never presented as live.
export const resolveOpponentMatchups = (
  bracket: Bracket,
  data: MatchData,
  squadName: string,
  runSeed: string
): { bracket: Bracket; series: SeriesState[] } => {
  let current = bracket;
  const series: SeriesState[] = [];

  for (let pass = 0; pass <= ADVANCEMENTS.length; pass += 1) {
    const next = allMatchups(current).find(
      (matchup) =>
        !matchup.winner &&
        matchup.home &&
        matchup.away &&
        !isSquadMatchup(matchup)
    );

    if (!next) break;

    const played = playMatchup(current, next.id, data, squadName, runSeed);

    if (!played) break;

    current = played.bracket;
    series.push(played.series);
  }

  return { bracket: current, series };
};

// Query parsing -------------------------------------------------------------

export type MatchDataQuery = {
  squad: string[];
  opponents: string[];
};

const idList = (max: number) =>
  z
    .string()
    .transform(splitIds)
    .pipe(z.array(z.string().min(1).max(64)).min(1).max(max))
    // A duplicate would silently double-count a player's BPM.
    .refine((ids) => new Set(ids).size === ids.length);

const matchDataQuerySchema = z.object({
  squad: idList(SQUAD_SIZE).refine((ids) => ids.length === SQUAD_SIZE),
  opponents: idList(8),
});

export const parseMatchDataQuery = (
  params: URLSearchParams
): MatchDataQuery | null => {
  const parsed = matchDataQuerySchema.safeParse({
    squad: params.get("squad") ?? undefined,
    opponents: params.get("opponents") ?? undefined,
  });

  return parsed.success ? parsed.data : null;
};

// Shaping the query results -------------------------------------------------

export type PlayerSeasonRow = {
  id: string;
  player: { fullName: string };
  data: {
    minutesPlayed: number;
    boxPlusMinus: number | null;
    playerEfficiencyRating: number | null;
  } | null;
};

export type RosterRow = {
  teamSeasonId: string;
  playerSeason: PlayerSeasonRow;
};

export const toMatchPlayer = (row: PlayerSeasonRow): MatchPlayer => ({
  playerSeasonId: row.id,
  playerName: row.player.fullName,
  minutesPlayed: row.data?.minutesPlayed ?? 0,
  boxPlusMinus: row.data?.boxPlusMinus ?? null,
  playerEfficiencyRating: row.data?.playerEfficiencyRating ?? null,
});

export const buildMatchData = (
  query: MatchDataQuery,
  squadRows: readonly PlayerSeasonRow[],
  rosterRows: readonly RosterRow[]
): MatchData | null => {
  const squadById = new Map(
    squadRows.map((row) => [row.id, toMatchPlayer(row)])
  );
  const squad = query.squad.map((id) => squadById.get(id));

  if (squad.some((player) => player === undefined)) return null;

  const rosters = new Map<string, MatchPlayer[]>(
    query.opponents.map((id) => [id, []])
  );

  for (const row of rosterRows) {
    rosters.get(row.teamSeasonId)?.push(toMatchPlayer(row.playerSeason));
  }

  const opponents = query.opponents.map((teamSeasonId) => ({
    teamSeasonId,
    players: rosters.get(teamSeasonId) ?? [],
  }));

  if (opponents.some((roster) => roster.players.length === 0)) return null;

  return { squad: squad as MatchPlayer[], opponents };
};
