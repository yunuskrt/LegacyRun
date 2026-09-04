import { allMatchups, isSquadMatchup } from "@/lib/match";
import type {
  Bracket,
  BracketMatchup,
  BracketOpponent,
  BracketRound,
  BracketRoundId,
  BracketSlot,
} from "@/types/bracket";
import type { Conference, Squad } from "@/types/game";
import type { GameResult, MatchSideId, SeriesState } from "@/types/match";

export const SQUAD_FALLBACK_NAME = "YOUR SQUAD";

// A literal, not derived from the squad's name — the name is optional.
export const SQUAD_SHORT_CODE = "YOU";

export const hasSquadName = ({ name }: Squad): boolean =>
  (name?.trim().length ?? 0) > 0;

export const squadDisplayName = (squad: Squad): string =>
  hasSquadName(squad) ? (squad.name as string).trim() : SQUAD_FALLBACK_NAME;

export const CONFERENCE_NAME: Record<Conference, string> = {
  EAST: "Eastern",
  WEST: "Western",
};

export const PLAY_CTA: Record<BracketRoundId, string> = {
  FIRST_ROUND: "Play first round",
  CONFERENCE_SEMIS: "Play conference semifinals",
  CONFERENCE_FINALS: "Play conference finals",
  NBA_FINALS: "Play the NBA Finals",
};

// "Round 1" takes no article where the others do, so copy can't concatenate one.
export const ROUND_PHRASE: Record<BracketRoundId, string> = {
  FIRST_ROUND: "Round 1",
  CONFERENCE_SEMIS: "the Conference Semifinals",
  CONFERENCE_FINALS: "the Conference Finals",
  NBA_FINALS: "the NBA Finals",
};

export const ROUND_ORDER: readonly BracketRoundId[] = [
  "FIRST_ROUND",
  "CONFERENCE_SEMIS",
  "CONFERENCE_FINALS",
  "NBA_FINALS",
];

export const roundIndexOf = (round: BracketRoundId): number =>
  ROUND_ORDER.indexOf(round);

export type DifficultyBand = "CONTENDER" | "ELITE" | "LEGENDARY";

// Split against the generator's draw bands so all three are reachable in one run.
export const ELITE_FLOOR = 64;
export const LEGENDARY_FLOOR = 84;

export const difficultyBand = (pedigree: number): DifficultyBand => {
  if (pedigree >= LEGENDARY_FLOOR) return "LEGENDARY";
  if (pedigree >= ELITE_FLOOR) return "ELITE";
  return "CONTENDER";
};

export const BAND_DOTS: Record<DifficultyBand, number> = {
  CONTENDER: 1,
  ELITE: 2,
  LEGENDARY: 3,
};

export const squadSideOf = (matchup: BracketMatchup): MatchSideId =>
  matchup.home?.side === "SQUAD" ? "HOME" : "AWAY";

export const nextSquadMatchup = (bracket: Bracket): BracketMatchup | null =>
  allMatchups(bracket).find(
    (matchup) =>
      isSquadMatchup(matchup) &&
      !matchup.winner &&
      matchup.home !== null &&
      matchup.away !== null
  ) ?? null;

export type SquadPathEntry = {
  round: BracketRoundId;
  label: string;
  matchup: BracketMatchup | null;
};

export const squadPath = (bracket: Bracket): SquadPathEntry[] =>
  bracket.rounds.map((round) => ({
    round: round.id,
    label: round.label,
    matchup: round.matchups.find(isSquadMatchup) ?? null,
  }));

export const squadRoundId = (bracket: Bracket): BracketRoundId | null => {
  const next = nextSquadMatchup(bracket);
  if (next) return next.round;

  const reached = squadPath(bracket).filter((entry) => entry.matchup !== null);

  return reached.length > 0 ? reached[reached.length - 1].round : null;
};

export const roundsUntilFinals = (bracket: Bracket): number => {
  const round = squadRoundId(bracket);
  const finals = roundIndexOf("NBA_FINALS");

  return round === null ? finals : finals - roundIndexOf(round);
};

// The squad reaching the Conference Finals unlocks the champion stub.
export const isFinalsOpponentRevealed = (bracket: Bracket): boolean =>
  bracket.rounds.some(
    (round) =>
      round.id === "CONFERENCE_FINALS" && round.matchups.some(isSquadMatchup)
  );

// `bracketSlot === null` marks a slot outside the 8-slot bracket, never the round id.
export const finalsOpponent = (bracket: Bracket): BracketOpponent | null => {
  const drawn = allMatchups(bracket)
    .flatMap((matchup) => [matchup.home, matchup.away])
    .find((slot) => slot?.side === "OPPONENT" && slot.bracketSlot === null);

  return drawn?.side === "OPPONENT" ? drawn.opponent : null;
};

// Returns the first historical side, which only the far half ever has two of.
export const opponentOf = (matchup: BracketMatchup): BracketOpponent | null => {
  for (const slot of [matchup.home, matchup.away]) {
    if (slot?.side === "OPPONENT") return slot.opponent;
  }

  return null;
};

export type SeriesSideView = {
  id: MatchSideId;
  name: string;
  code: string;
  isSquad: boolean;
  teamLogo: string | null;
};

const sideView = (
  id: MatchSideId,
  slot: BracketSlot | null,
  squad: Squad
): SeriesSideView =>
  slot === null || slot.side === "SQUAD"
    ? {
        id,
        name: squadDisplayName(squad),
        code: SQUAD_SHORT_CODE,
        isSquad: true,
        teamLogo: null,
      }
    : {
        id,
        name: `${slot.opponent.seasonYear} ${slot.opponent.teamName}`,
        code: slot.opponent.teamSlug,
        isSquad: false,
        teamLogo: slot.opponent.teamLogo,
      };

// Sides are labelled by matchup slot, not squad/opponent — the far half has neither.
export const seriesSides = (
  matchup: BracketMatchup,
  squad: Squad
): { home: SeriesSideView; away: SeriesSideView } => ({
  home: sideView("HOME", matchup.home, squad),
  away: sideView("AWAY", matchup.away, squad),
});

// Shared by BracketLadder (above md) and BracketSpine (below) so the two cannot drift.
export type BracketDisplayProps = {
  rounds: BracketRound[];
  squad: Squad;
  series: readonly SeriesState[];
  nextMatchupId: string | null;
  farConference: Conference;
  finalsOpponent: BracketOpponent | null;
  roundsUntilFinals: number;
  revealedThrough: BracketRoundId | null;
  // The archive: nothing is next, nothing is an affordance, nothing is revealing.
  readOnly?: boolean;
};

export type MatchupCardState = "UPCOMING" | "NEXT" | "RESOLVED";

export const matchupCardState = (
  matchup: BracketMatchup,
  nextMatchupId: string | null
): MatchupCardState => {
  if (matchup.winner) return "RESOLVED";
  return matchup.id === nextMatchupId ? "NEXT" : "UPCOMING";
};

export const revealedThroughFor = (bracket: Bracket): BracketRoundId | null => {
  const completed = squadPath(bracket).filter((entry) => entry.matchup?.winner);

  return completed.length > 0 ? completed[completed.length - 1].round : null;
};

// Far-half results stay hidden until the squad completes the same round.
export const visibleRounds = (
  bracket: Bracket,
  revealedThrough: BracketRoundId | null
): BracketRound[] => {
  const revealed =
    revealedThrough === null ? -1 : roundIndexOf(revealedThrough);
  const finalsRevealed = isFinalsOpponentRevealed(bracket);

  return bracket.rounds.map((round) => {
    const index = roundIndexOf(round.id);

    const mask = (slot: BracketSlot | null): BracketSlot | null => {
      if (!slot) return null;
      if (slot.side === "OPPONENT" && slot.bracketSlot === null) {
        return finalsRevealed ? slot : null;
      }
      if (index === 0) return slot;
      return index - 1 <= revealed ? slot : null;
    };

    return {
      ...round,
      matchups: round.matchups.map((matchup) =>
        isSquadMatchup(matchup)
          ? matchup
          : {
              ...matchup,
              home: mask(matchup.home),
              away: mask(matchup.away),
              winner: index <= revealed ? matchup.winner : null,
            }
      ),
    };
  });
};

// TournamentStage remounts the bracket, so every entrance is a mount animation.
export type RoundMotion = "NONE" | "RESOLVING" | "REVEALING";

// Anchored on `revealedThroughFor`, so a far-half result can never animate anything.
export const roundMotionFor = (
  round: BracketRoundId,
  revealedThrough: BracketRoundId | null,
  readOnly = false
): RoundMotion => {
  if (readOnly) return "NONE";
  if (revealedThrough === round) return "RESOLVING";

  const revealing =
    ROUND_ORDER[
      (revealedThrough === null ? -1 : roundIndexOf(revealedThrough)) + 1
    ] ?? null;

  return revealing === round ? "REVEALING" : "NONE";
};

// A null opponent is the lock — the caller resolves it, nothing here reaches past it.
export const isChampionUnlocking = (
  revealedThrough: BracketRoundId | null,
  opponent: BracketOpponent | null,
  readOnly = false
): boolean =>
  opponent !== null &&
  roundMotionFor("CONFERENCE_FINALS", revealedThrough, readOnly) ===
    "REVEALING";

export const seriesFor = (
  series: readonly SeriesState[],
  matchupId: string
): SeriesState | null =>
  series.find((entry) => entry.matchupId === matchupId) ?? null;

// Scores must read through the masked matchup, never the unmasked log.
export const visibleSeriesFor = (
  matchup: BracketMatchup,
  series: readonly SeriesState[]
): SeriesState | null =>
  matchup.winner ? seriesFor(series, matchup.id) : null;

// The series score sits on the winner's row only, highest first.
export const seriesScoreLabel = (
  series: SeriesState | null,
  side: MatchSideId
): string | null => {
  if (!series || series.winner !== side) return null;

  const [high, low] =
    series.homeWins >= series.awayWins
      ? [series.homeWins, series.awayWins]
      : [series.awayWins, series.homeWins];

  return `${high}-${low}`;
};

// Series scores read from the squad's side, not the home slot's.
export const squadSeriesScore = (
  matchup: BracketMatchup,
  series: SeriesState
): { squadWins: number; opponentWins: number } =>
  squadSideOf(matchup) === "HOME"
    ? { squadWins: series.homeWins, opponentWins: series.awayWins }
    : { squadWins: series.awayWins, opponentWins: series.homeWins };

// The same rule one game down: a squad-facing score never reads the home slot.
export const squadGameScore = (
  squadSide: MatchSideId,
  game: Pick<GameResult, "homeScore" | "awayScore">
): { squadPoints: number; opponentPoints: number } =>
  squadSide === "HOME"
    ? { squadPoints: game.homeScore, opponentPoints: game.awayScore }
    : { squadPoints: game.awayScore, opponentPoints: game.homeScore };

export type RunOutcome =
  | { kind: "IN_PROGRESS" }
  | { kind: "CHAMPION" }
  | { kind: "ELIMINATED"; round: BracketRoundId };

export const runOutcome = (
  bracket: Bracket,
  series: readonly SeriesState[]
): RunOutcome => {
  for (const entry of squadPath(bracket)) {
    const played = entry.matchup ? seriesFor(series, entry.matchup.id) : null;

    if (!entry.matchup || !played?.winner) continue;

    if (played.winner !== squadSideOf(entry.matchup)) {
      return { kind: "ELIMINATED", round: entry.round };
    }

    if (entry.round === "NBA_FINALS") return { kind: "CHAMPION" };
  }

  return { kind: "IN_PROGRESS" };
};

export type PostSeriesView = {
  stage: "BRACKET" | "RESULT";
  ctaLabel: string;
};

// One rule, not two — the label and the stage it hands back to must never disagree.
export const postSeriesView = (
  outcome: RunOutcome,
  nextMatchup: BracketMatchup | null
): PostSeriesView => {
  if (outcome.kind === "CHAMPION") {
    return { stage: "RESULT", ctaLabel: "See the result" };
  }

  if (outcome.kind === "ELIMINATED") {
    return { stage: "RESULT", ctaLabel: "See how the run ended" };
  }

  return {
    stage: "BRACKET",
    ctaLabel: nextMatchup
      ? `Continue to ${ROUND_PHRASE[nextMatchup.round]}`
      : "Back to the bracket",
  };
};
