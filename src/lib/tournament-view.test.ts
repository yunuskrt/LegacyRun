import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BANDS, generateBracket, oppositeConference } from "@/lib/bracket";
import { advanceBracket } from "@/lib/match";
import {
  BAND_DOTS,
  ELITE_FLOOR,
  LEGENDARY_FLOOR,
  PLAY_CTA,
  ROUND_PHRASE,
  SQUAD_FALLBACK_NAME,
  difficultyBand,
  finalsOpponent,
  hasSquadName,
  isChampionUnlocking,
  isFinalsOpponentRevealed,
  matchupCardState,
  nextSquadMatchup,
  opponentOf,
  postSeriesView,
  revealedThroughFor,
  roundMotionFor,
  roundsUntilFinals,
  runOutcome,
  SQUAD_SHORT_CODE,
  seriesScoreLabel,
  seriesSides,
  squadDisplayName,
  squadGameScore,
  squadPath,
  squadSeriesScore,
  squadSideOf,
  visibleRounds,
  visibleSeriesFor,
} from "@/lib/tournament-view";
import type { RunOutcome } from "@/lib/tournament-view";
import type { PlayoffTeamRow } from "@/lib/bracket";
import type {
  Bracket,
  BracketMatchup,
  BracketOpponent,
  BracketRoundId,
} from "@/types/bracket";
import type { Squad } from "@/types/game";
import type { SeriesState } from "@/types/match";

const squad = (name?: string): Squad => ({
  name,
  formation: "TRADITIONAL",
  players: [],
});

const row = (
  overrides: Partial<PlayoffTeamRow> & { teamSlug: string }
): PlayoffTeamRow => ({
  seasonYear: 1990,
  conference: "EAST",
  seed: 4,
  roundReached: "FIRST_ROUND",
  wins: 2,
  losses: 3,
  team: { name: `${overrides.teamSlug} Team` },
  ...overrides,
});

// One row per pedigree the generator needs, so a bracket can be built without
// touching the database.
const pool = (): PlayoffTeamRow[] => [
  row({ teamSlug: "R1A", seed: 8, wins: 1, losses: 4 }),
  row({ teamSlug: "R1B", seed: 7, wins: 2, losses: 4 }),
  row({
    teamSlug: "S1",
    seed: 5,
    roundReached: "CONFERENCE_SEMIS",
    wins: 5,
    losses: 6,
  }),
  row({
    teamSlug: "S2",
    seed: 4,
    roundReached: "CONFERENCE_SEMIS",
    wins: 6,
    losses: 5,
  }),
  row({
    teamSlug: "C1",
    seed: 2,
    roundReached: "CONFERENCE_FINALS",
    wins: 9,
    losses: 6,
  }),
  row({
    teamSlug: "C2",
    seed: 3,
    roundReached: "CONFERENCE_FINALS",
    wins: 8,
    losses: 7,
  }),
  row({
    teamSlug: "C3",
    seed: 1,
    roundReached: "CONFERENCE_FINALS",
    wins: 10,
    losses: 5,
  }),
  row({
    teamSlug: "C4",
    seed: 2,
    roundReached: "CONFERENCE_FINALS",
    wins: 9,
    losses: 5,
  }),
  row({
    teamSlug: "W1",
    conference: "WEST",
    seed: 1,
    roundReached: "CHAMPION",
    wins: 15,
    losses: 3,
  }),
  row({
    teamSlug: "W2",
    conference: "WEST",
    seed: 2,
    roundReached: "NBA_FINALS",
    wins: 12,
    losses: 8,
  }),
];

const buildBracket = (squadRating = 70): Bracket => {
  const bracket = generateBracket(
    pool(),
    { conference: "EAST", squadRating, exclude: [] },
    "seedone"
  );

  if (!bracket) throw new Error("fixture pool could not build a bracket");

  return bracket;
};

const buildResolvedBracket = (squadRating = 70): Bracket =>
  resolveFarHalf(buildBracket(squadRating));

// The far half resolves itself in the app; the tests need the same, or the
// squad's next matchup never gets a second slot.
const resolveFarHalf = (bracket: Bracket): Bracket => {
  let current = bracket;

  for (let pass = 0; pass < 8; pass += 1) {
    const next = current.rounds
      .flatMap((round) => round.matchups)
      .find(
        (matchup) =>
          !matchup.winner &&
          matchup.home !== null &&
          matchup.away !== null &&
          matchup.home.side !== "SQUAD" &&
          matchup.away.side !== "SQUAD"
      );

    if (!next) return current;

    current = advanceBracket(current, next.id, "HOME");
  }

  return current;
};

const winSquadMatchup = (bracket: Bracket): Bracket => {
  const matchup = nextSquadMatchup(bracket);
  if (!matchup) throw new Error("no squad matchup to win");
  return resolveFarHalf(
    advanceBracket(bracket, matchup.id, squadSideOf(matchup))
  );
};

const seriesRow = (
  matchup: BracketMatchup,
  squadWins: boolean
): SeriesState => {
  const squadSide = squadSideOf(matchup);
  const winner = squadWins ? squadSide : squadSide === "HOME" ? "AWAY" : "HOME";

  return {
    matchupId: matchup.id,
    homeWins: winner === "HOME" ? 4 : 2,
    awayWins: winner === "AWAY" ? 4 : 2,
    winner,
    games: [],
  };
};

describe("seriesSides", () => {
  const matchupWithSquad = (): BracketMatchup =>
    nextSquadMatchup(buildBracket())!;

  it("labels the sides by matchup slot, not by squad and opponent", () => {
    const sides = seriesSides(matchupWithSquad(), squad("Dynasty Five"));

    expect(sides.home.id).toBe("HOME");
    expect(sides.away.id).toBe("AWAY");
    expect([sides.home.isSquad, sides.away.isSquad]).toContain(true);
  });

  it("names a historical side by season and franchise, with its slug as the code", () => {
    const sides = seriesSides(matchupWithSquad(), squad());
    const opponent = sides.home.isSquad ? sides.away : sides.home;

    expect(opponent.name).toMatch(/^\d{4} /);
    expect(opponent.code).not.toBe(SQUAD_SHORT_CODE);
    expect(opponent.teamLogo).not.toBeNull();
  });

  // The crest code can't come from the name, because the name is optional.
  it("gives the squad a fixed code whether or not it is named", () => {
    const named = seriesSides(matchupWithSquad(), squad("Dynasty Five"));
    const unnamed = seriesSides(matchupWithSquad(), squad());
    const squadOf = (sides: ReturnType<typeof seriesSides>) =>
      sides.home.isSquad ? sides.home : sides.away;

    expect(squadOf(named).code).toBe(SQUAD_SHORT_CODE);
    expect(squadOf(unnamed).code).toBe(SQUAD_SHORT_CODE);
    expect(squadOf(named).name).toBe("Dynasty Five");
    expect(squadOf(unnamed).name).toBe(SQUAD_FALLBACK_NAME);
    expect(squadOf(unnamed).teamLogo).toBeNull();
  });
});

describe("opponentOf", () => {
  it("finds the historical side whichever slot the squad took", () => {
    const matchup = nextSquadMatchup(buildResolvedBracket())!;
    const opponent = opponentOf(matchup);

    expect(opponent).not.toBeNull();
    expect(opponent!.teamSlug).not.toBe(SQUAD_SHORT_CODE);

    const squadSlot =
      squadSideOf(matchup) === "HOME" ? matchup.home : matchup.away;
    const otherSlot =
      squadSideOf(matchup) === "HOME" ? matchup.away : matchup.home;

    expect(squadSlot?.side).toBe("SQUAD");
    expect(otherSlot?.side).toBe("OPPONENT");
    expect(opponent).toBe(
      otherSlot?.side === "OPPONENT" ? otherSlot.opponent : null
    );
  });

  it("returns null when neither slot is filled", () => {
    expect(
      opponentOf({
        id: "empty",
        round: "NBA_FINALS",
        home: null,
        away: null,
        winner: null,
      })
    ).toBeNull();
  });

  // The Finals matchup's historical side is the drawn champion itself, which is
  // what lets a screen holding `finalsOpponent` reuse it rather than reading the
  // matchup's slots a second way.
  it("finds the drawn champion in the Finals matchup", () => {
    let bracket = buildResolvedBracket();

    for (let round = 0; round < 3; round += 1) {
      bracket = winSquadMatchup(bracket);
    }

    const finals = nextSquadMatchup(bracket) as BracketMatchup;

    expect(finals.round).toBe("NBA_FINALS");
    expect(opponentOf(finals)).not.toBeNull();
    expect(opponentOf(finals)).toEqual(finalsOpponent(bracket));
  });
});

describe("squadDisplayName", () => {
  it("returns the squad's name when it is set", () => {
    expect(squadDisplayName(squad("Dynasty Five"))).toBe("Dynasty Five");
  });

  it("falls back to YOUR SQUAD when the name is unset", () => {
    expect(squadDisplayName(squad())).toBe("YOUR SQUAD");
    expect(SQUAD_FALLBACK_NAME).toBe("YOUR SQUAD");
  });

  it("falls back when the name is only whitespace", () => {
    expect(squadDisplayName(squad("   "))).toBe("YOUR SQUAD");
  });

  it("never invents a name", () => {
    expect(squadDisplayName(squad())).not.toMatch(/dynasty/i);
  });

  it("reports whether a name is set, so the badge can be dropped", () => {
    expect(hasSquadName(squad("Dynasty Five"))).toBe(true);
    expect(hasSquadName(squad())).toBe(false);
    expect(hasSquadName(squad("  "))).toBe(false);
  });
});

describe("difficultyBand", () => {
  it("splits on the documented floors", () => {
    expect(difficultyBand(ELITE_FLOOR - 1)).toBe("CONTENDER");
    expect(difficultyBand(ELITE_FLOOR)).toBe("ELITE");
    expect(difficultyBand(LEGENDARY_FLOOR - 1)).toBe("ELITE");
    expect(difficultyBand(LEGENDARY_FLOOR)).toBe("LEGENDARY");
  });

  it("pins the floors themselves, not just their relationship", () => {
    expect(ELITE_FLOOR).toBe(64);
    expect(LEGENDARY_FLOOR).toBe(84);
  });

  // Every band has to be reachable inside the generator's draw bands, or the
  // meter reads the same all run.
  it("keeps all three bands reachable across the generator's bands", () => {
    const reached = new Set(
      [
        BANDS.FIRST_ROUND,
        BANDS.CONFERENCE_SEMIS,
        BANDS.CONFERENCE_FINALS,
        BANDS.NBA_FINALS,
      ].flatMap((band) => [difficultyBand(band.min), difficultyBand(band.max)])
    );

    expect(reached).toEqual(new Set(["CONTENDER", "ELITE", "LEGENDARY"]));
  });

  it("keeps a first-round draw a CONTENDER and a conference-finals draw reachable at LEGENDARY", () => {
    expect(difficultyBand(BANDS.FIRST_ROUND.max)).toBe("CONTENDER");
    expect(difficultyBand(BANDS.CONFERENCE_FINALS.max)).toBe("LEGENDARY");
  });
});

describe("squadPath", () => {
  it("returns one entry per round, in bracket order", () => {
    const path = squadPath(buildBracket());

    expect(path.map((entry) => entry.round)).toEqual([
      "FIRST_ROUND",
      "CONFERENCE_SEMIS",
      "CONFERENCE_FINALS",
      "NBA_FINALS",
    ]);
  });

  it("only carries a matchup for rounds the squad occupies", () => {
    const bracket = buildBracket();
    const path = squadPath(bracket);

    expect(path[0].matchup).not.toBeNull();
    expect(path[1].matchup).toBeNull();
    expect(squadPath(winSquadMatchup(bracket))[1].matchup).not.toBeNull();
  });
});

describe("matchupCardState", () => {
  it("marks the next squad matchup NEXT and the rest UPCOMING", () => {
    const bracket = buildBracket();
    const next = nextSquadMatchup(bracket);

    expect(next).not.toBeNull();
    expect(matchupCardState(next as BracketMatchup, next?.id ?? null)).toBe(
      "NEXT"
    );
    expect(matchupCardState(next as BracketMatchup, "other")).toBe("UPCOMING");
  });

  it("marks a decided matchup RESOLVED even when it is next", () => {
    const bracket = winSquadMatchup(buildBracket());
    const played = squadPath(bracket)[0].matchup as BracketMatchup;

    expect(matchupCardState(played, played.id)).toBe("RESOLVED");
  });
});

describe("isFinalsOpponentRevealed", () => {
  it("stays locked until the squad reaches the Conference Finals", () => {
    let bracket = buildBracket();
    expect(isFinalsOpponentRevealed(bracket)).toBe(false);
    expect(roundsUntilFinals(bracket)).toBe(3);

    bracket = winSquadMatchup(bracket);
    expect(isFinalsOpponentRevealed(bracket)).toBe(false);
    expect(roundsUntilFinals(bracket)).toBe(2);

    bracket = winSquadMatchup(bracket);
    expect(isFinalsOpponentRevealed(bracket)).toBe(true);
    expect(roundsUntilFinals(bracket)).toBe(1);
  });

  it("names an opponent from the far conference", () => {
    const bracket = buildBracket();
    const opponent = finalsOpponent(bracket);

    expect(opponent).not.toBeNull();
    expect(opponent?.conference).toBe(oppositeConference(bracket.conference));
  });
});

// `revealedThroughFor` is the trigger the whole masking scheme hangs off, and
// the far half resolving must never move it.
describe("revealedThroughFor", () => {
  it("reveals nothing until the squad has completed a round", () => {
    expect(revealedThroughFor(buildResolvedBracket())).toBeNull();
  });

  it("does not advance when only the far half has resolved", () => {
    const bracket = buildBracket();
    const farMatchup = bracket.rounds[0].matchups.find(
      (matchup) =>
        matchup.home?.side === "OPPONENT" && matchup.away?.side === "OPPONENT"
    ) as BracketMatchup;

    expect(
      revealedThroughFor(advanceBracket(bracket, farMatchup.id, "HOME"))
    ).toBeNull();
  });

  it("advances one round at a time as the squad wins", () => {
    let bracket = buildResolvedBracket();
    const seen: (string | null)[] = [revealedThroughFor(bracket)];

    for (let round = 0; round < 3; round += 1) {
      bracket = winSquadMatchup(bracket);
      seen.push(revealedThroughFor(bracket));
    }

    expect(seen).toEqual([
      null,
      "FIRST_ROUND",
      "CONFERENCE_SEMIS",
      "CONFERENCE_FINALS",
    ]);
  });

  it("holds at the round the squad went out in", () => {
    const bracket = buildResolvedBracket();
    const matchup = nextSquadMatchup(bracket) as BracketMatchup;
    const lost = advanceBracket(
      bracket,
      matchup.id,
      squadSideOf(matchup) === "HOME" ? "AWAY" : "HOME"
    );

    expect(revealedThroughFor(lost)).toBe("FIRST_ROUND");
    // The squad has no live matchup left, so the countdown falls back to the
    // deepest round it reached rather than throwing.
    expect(roundsUntilFinals(lost)).toBe(3);
  });
});

describe("visibleRounds", () => {
  it("shows the first round's teams but none of its results on arrival", () => {
    const bracket = buildBracket();
    const rounds = visibleRounds(bracket, revealedThroughFor(bracket));

    for (const matchup of rounds[0].matchups) {
      expect(matchup.home).not.toBeNull();
      expect(matchup.away).not.toBeNull();
      expect(matchup.winner).toBeNull();
    }
  });

  it("hides far-half slots that only exist because a later round resolved", () => {
    const bracket = buildBracket();
    const resolved = bracket.rounds[0].matchups
      .filter((matchup) => matchup.home?.side !== "SQUAD")
      .filter((matchup) => matchup.away?.side !== "SQUAD")
      .reduce(
        (current, matchup) => advanceBracket(current, matchup.id, "HOME"),
        bracket
      );

    const rounds = visibleRounds(resolved, null);
    const semis = rounds[1].matchups.filter(
      (matchup) => matchup.home?.side !== "SQUAD"
    );

    for (const matchup of semis) {
      expect(matchup.home).toBeNull();
      expect(matchup.away).toBeNull();
    }
  });

  it("reveals a far-half result once the squad completes the same round", () => {
    const bracket = buildBracket();
    const farMatchup = bracket.rounds[0].matchups.find(
      (matchup) =>
        matchup.home?.side === "OPPONENT" && matchup.away?.side === "OPPONENT"
    ) as BracketMatchup;
    const resolved = advanceBracket(bracket, farMatchup.id, "HOME");

    const winnerOf = (through: "FIRST_ROUND" | null) =>
      visibleRounds(resolved, through)[0].matchups.find(
        (matchup) => matchup.id === farMatchup.id
      )?.winner ?? null;

    expect(winnerOf(null)).toBeNull();
    expect(winnerOf("FIRST_ROUND")).not.toBeNull();
  });

  it("masks nothing once the run is complete", () => {
    let bracket = buildResolvedBracket();

    for (let round = 0; round < 4; round += 1) {
      bracket = winSquadMatchup(bracket);
    }

    const rounds = visibleRounds(bracket, "NBA_FINALS");
    const original = bracket.rounds.flatMap((round) => round.matchups);

    expect(rounds.flatMap((round) => round.matchups)).toEqual(original);
  });

  it("never masks the squad's own matchup", () => {
    const bracket = winSquadMatchup(buildBracket());
    const rounds = visibleRounds(bracket, null);
    const squadMatchup = rounds[0].matchups.find(
      (matchup) =>
        matchup.home?.side === "SQUAD" || matchup.away?.side === "SQUAD"
    );

    expect(squadMatchup?.winner).not.toBeNull();
  });

  it("hides the drawn Finals opponent until the Conference Finals", () => {
    const bracket = buildBracket();
    const finalsSlot = (target: Bracket) =>
      visibleRounds(target, revealedThroughFor(target))[3].matchups[0].away;

    expect(finalsSlot(bracket)).toBeNull();

    const reached = winSquadMatchup(winSquadMatchup(bracket));
    expect(finalsSlot(reached)).not.toBeNull();
  });
});

// A4 is the hardest state to reach by play — three series wins — so the values
// its heading, banner and CTA read are pinned here.
describe("the NBA Finals state", () => {
  it("names the Finals round, its opponent and its CTA once the squad arrives", () => {
    let bracket = buildResolvedBracket();

    for (let round = 0; round < 3; round += 1) {
      bracket = winSquadMatchup(bracket);
    }

    const next = nextSquadMatchup(bracket) as BracketMatchup;
    expect(next.round).toBe("NBA_FINALS");
    expect(PLAY_CTA[next.round]).toBe("Play the NBA Finals");
    expect(isFinalsOpponentRevealed(bracket)).toBe(true);
    expect(roundsUntilFinals(bracket)).toBe(0);

    // The banner names the other-conference champion sitting in the live
    // matchup, not the stub read separately.
    const opponentSlot = next.home?.side === "OPPONENT" ? next.home : next.away;
    expect(opponentSlot?.side).toBe("OPPONENT");
    expect(opponentSlot?.side === "OPPONENT" && opponentSlot.opponent).toEqual(
      finalsOpponent(bracket)
    );
  });
});

describe("round copy and squad-side scores", () => {
  it("gives Round 1 no article and every later round one", () => {
    expect(ROUND_PHRASE.FIRST_ROUND).toBe("Round 1");
    expect(`Eliminated in ${ROUND_PHRASE.FIRST_ROUND}.`).toBe(
      "Eliminated in Round 1."
    );
    expect(`Continue to ${ROUND_PHRASE.CONFERENCE_SEMIS}`).toBe(
      "Continue to the Conference Semifinals"
    );
  });

  it("reads a series score from the squad's side, not the home slot's", () => {
    const bracket = buildBracket();
    const matchup = nextSquadMatchup(bracket) as BracketMatchup;
    const series = seriesRow(matchup, false);
    const score = squadSeriesScore(matchup, series);

    expect(score).toEqual({ squadWins: 2, opponentWins: 4 });
    expect(squadSeriesScore(matchup, seriesRow(matchup, true))).toEqual({
      squadWins: 4,
      opponentWins: 2,
    });
  });
});

describe("squadGameScore", () => {
  const game = (homeScore: number, awayScore: number) => ({
    homeScore,
    awayScore,
  });

  // Swapping the slots puts the squad on the other side of a real matchup, so
  // both orientations are exercised without a second fixture.
  const mirrored = (matchup: BracketMatchup): BracketMatchup => ({
    ...matchup,
    home: matchup.away,
    away: matchup.home,
  });

  it("reads a game score from the squad's side, not the home slot's", () => {
    expect(squadGameScore("HOME", game(109, 108))).toEqual({
      squadPoints: 109,
      opponentPoints: 108,
    });
    expect(squadGameScore("AWAY", game(109, 108))).toEqual({
      squadPoints: 108,
      opponentPoints: 109,
    });
  });

  it("mirrors exactly between the two sides", () => {
    const home = squadGameScore("HOME", game(97, 111));
    const away = squadGameScore("AWAY", game(97, 111));

    expect(home.squadPoints).toBe(away.opponentPoints);
    expect(home.opponentPoints).toBe(away.squadPoints);
  });

  // Game and series scores must resolve the squad to the same slot. A run whose
  // bracket row reads 1-4 cannot list its one win on the other side game by
  // game, which is the defect this shares a rule with `squadSeriesScore` to
  // prevent.
  it("agrees with squadSeriesScore about which slot is the squad's", () => {
    const real = nextSquadMatchup(buildBracket()) as BracketMatchup;

    for (const matchup of [real, mirrored(real)]) {
      for (const squadWins of [true, false]) {
        const series = seriesRow(matchup, squadWins);
        const seriesScore = squadSeriesScore(matchup, series);
        const gameScore = squadGameScore(squadSideOf(matchup), {
          homeScore: series.homeWins,
          awayScore: series.awayWins,
        });

        expect(gameScore.squadPoints).toBe(seriesScore.squadWins);
        expect(gameScore.opponentPoints).toBe(seriesScore.opponentWins);
      }
    }
  });

  it("covers both squad sides across the two matchups", () => {
    const real = nextSquadMatchup(buildBracket()) as BracketMatchup;

    expect([squadSideOf(real), squadSideOf(mirrored(real))].sort()).toEqual([
      "AWAY",
      "HOME",
    ]);
  });
});

describe("visibleSeriesFor", () => {
  // The far half is simulated on arrival, so its scores sit in the log long
  // before the bracket may show them.
  it("withholds a score until the masked matchup carries a winner", () => {
    const bracket = buildBracket();
    const farMatchup = bracket.rounds[0].matchups.find(
      (matchup) =>
        matchup.home?.side === "OPPONENT" && matchup.away?.side === "OPPONENT"
    ) as BracketMatchup;

    const resolved = advanceBracket(bracket, farMatchup.id, "HOME");
    const log = [seriesRow(farMatchup, false)];

    const masked = (through: "FIRST_ROUND" | null) =>
      visibleRounds(resolved, through)[0].matchups.find(
        (matchup) => matchup.id === farMatchup.id
      ) as BracketMatchup;

    expect(visibleSeriesFor(masked(null), log)).toBeNull();
    expect(visibleSeriesFor(masked("FIRST_ROUND"), log)).not.toBeNull();
  });
});

describe("seriesScoreLabel", () => {
  it("labels the winner's side only, highest first", () => {
    const series: SeriesState = {
      matchupId: "r1-m1",
      homeWins: 2,
      awayWins: 4,
      winner: "AWAY",
      games: [],
    };

    expect(seriesScoreLabel(series, "AWAY")).toBe("4-2");
    expect(seriesScoreLabel(series, "HOME")).toBeNull();
    expect(seriesScoreLabel(null, "HOME")).toBeNull();
  });

  // A series still being played has a running tally but no winner, and must
  // not print a score on either row.
  it("prints nothing for a series that has not been decided", () => {
    const undecided: SeriesState = {
      matchupId: "r1-m1",
      homeWins: 3,
      awayWins: 2,
      winner: null,
      games: [],
    };

    expect(seriesScoreLabel(undecided, "HOME")).toBeNull();
    expect(seriesScoreLabel(undecided, "AWAY")).toBeNull();
  });
});

describe("BAND_DOTS", () => {
  it("fills more of the meter as the band rises", () => {
    expect(BAND_DOTS.CONTENDER).toBeLessThan(BAND_DOTS.ELITE);
    expect(BAND_DOTS.ELITE).toBeLessThan(BAND_DOTS.LEGENDARY);
    expect(BAND_DOTS.LEGENDARY).toBe(3);
  });
});

describe("runOutcome", () => {
  it("reports IN_PROGRESS while the squad is still alive", () => {
    expect(runOutcome(buildBracket(), []).kind).toBe("IN_PROGRESS");
  });

  it("stays IN_PROGRESS while the squad's series is undecided", () => {
    const bracket = buildBracket();
    const matchup = nextSquadMatchup(bracket) as BracketMatchup;
    const undecided: SeriesState = {
      matchupId: matchup.id,
      homeWins: 3,
      awayWins: 3,
      winner: null,
      games: [],
    };

    expect(runOutcome(bracket, [undecided]).kind).toBe("IN_PROGRESS");
  });

  it("reports the round the squad was eliminated in", () => {
    const bracket = buildBracket();
    const matchup = nextSquadMatchup(bracket) as BracketMatchup;
    const outcome = runOutcome(bracket, [seriesRow(matchup, false)]);

    expect(outcome).toEqual({ kind: "ELIMINATED", round: "FIRST_ROUND" });
  });

  it("reports CHAMPION only after the NBA Finals are won", () => {
    let bracket = buildResolvedBracket();
    const played: SeriesState[] = [];

    for (let round = 0; round < 4; round += 1) {
      const matchup = nextSquadMatchup(bracket) as BracketMatchup;
      played.push(seriesRow(matchup, true));
      bracket = winSquadMatchup(bracket);

      const outcome = runOutcome(bracket, played);
      expect(outcome.kind).toBe(round === 3 ? "CHAMPION" : "IN_PROGRESS");
    }
  });
});

describe("postSeriesView", () => {
  const nextMatchup = (round: BracketRoundId): BracketMatchup => ({
    id: `next-${round}`,
    round,
    home: null,
    away: null,
    winner: null,
  });

  const outcomes: RunOutcome[] = [
    { kind: "IN_PROGRESS" },
    { kind: "CHAMPION" },
    { kind: "ELIMINATED", round: "FIRST_ROUND" },
  ];

  const everyView = () =>
    outcomes.flatMap((outcome) =>
      [null, nextMatchup("CONFERENCE_SEMIS")].map((matchup) =>
        postSeriesView(outcome, matchup)
      )
    );

  it("returns to the bracket only while the run is unfinished", () => {
    expect(postSeriesView({ kind: "IN_PROGRESS" }, null).stage).toBe("BRACKET");
    expect(postSeriesView({ kind: "CHAMPION" }, null).stage).toBe("RESULT");
    expect(
      postSeriesView({ kind: "ELIMINATED", round: "FIRST_ROUND" }, null).stage
    ).toBe("RESULT");
  });

  // Spelled out rather than built from ROUND_PHRASE: the article belongs to the
  // round, and a label composed from the constant would pass however it changed.
  it("names the round the squad is continuing to", () => {
    const label = (round: BracketRoundId) =>
      postSeriesView({ kind: "IN_PROGRESS" }, nextMatchup(round)).ctaLabel;

    expect(label("FIRST_ROUND")).toBe("Continue to Round 1");
    expect(label("NBA_FINALS")).toBe("Continue to the NBA Finals");
  });

  // The rule this function exists for. Splitting the stage and the label across
  // two hand-written expressions let an in-progress run reach the bracket under
  // a button reading "See how the run ended"; no label may sit on both stages.
  it("never puts one label on both stages", () => {
    const labelStages = new Map<string, Set<string>>();

    everyView().forEach(({ stage, ctaLabel }) => {
      const stages = labelStages.get(ctaLabel) ?? new Set<string>();

      stages.add(stage);
      labelStages.set(ctaLabel, stages);
    });

    labelStages.forEach((stages) => expect(stages.size).toBe(1));
  });

  it("keeps an in-progress run on the bracket when no matchup is ready", () => {
    const view = postSeriesView({ kind: "IN_PROGRESS" }, null);
    const ended = postSeriesView(
      { kind: "ELIMINATED", round: "FIRST_ROUND" },
      null
    );

    expect(view.stage).toBe("BRACKET");
    expect(view.ctaLabel).not.toBe(ended.ctaLabel);
    // No round to name, so it must not promise one either.
    expect(view.ctaLabel).not.toContain("Continue to");
  });
});

// `bracketSlot` is a layout position that reads as a seed. Only
// `BracketOpponent.seed` may reach the screen as a number.
describe("bracketSlot never renders", () => {
  const components = [
    "src/components/tournament/MatchupCard.tsx",
    "src/components/tournament/TeamSlotRow.tsx",
    "src/components/tournament/BracketLadder.tsx",
    "src/components/tournament/BracketSpine.tsx",
    "src/components/tournament/BracketStageView.tsx",
    "src/components/tournament/FinalsChampionStub.tsx",
    "src/components/tournament/SeriesResultCard.tsx",
  ];

  it.each(components)("%s does not read bracketSlot", (path) => {
    expect(readFileSync(path, "utf8")).not.toContain("bracketSlot");
  });

  it.each(components)("%s does not read a team rating", (path) => {
    const source = readFileSync(path, "utf8");

    expect(source).not.toContain("teamRating");
    expect(source).not.toContain("pedigree}");
  });
});

// The bracket remounts between stages, so every entrance is a mount animation
// and this is what a freshly-mounted card is told to play.
describe("roundMotionFor", () => {
  const ROUNDS: BracketRoundId[] = [
    "FIRST_ROUND",
    "CONFERENCE_SEMIS",
    "CONFERENCE_FINALS",
    "NBA_FINALS",
  ];

  const motions = (through: BracketRoundId | null, readOnly = false) =>
    ROUNDS.map((round) => roundMotionFor(round, through, readOnly));

  it("reveals only the first round before anything has been played", () => {
    expect(motions(null)).toEqual(["REVEALING", "NONE", "NONE", "NONE"]);
  });

  it("resolves the completed round and reveals the next one", () => {
    expect(motions("FIRST_ROUND")).toEqual([
      "RESOLVING",
      "REVEALING",
      "NONE",
      "NONE",
    ]);
    expect(motions("CONFERENCE_SEMIS")).toEqual([
      "NONE",
      "RESOLVING",
      "REVEALING",
      "NONE",
    ]);
  });

  // Winning the title reveals nothing — there is no round after the Finals.
  it("resolves the Finals with nothing left to reveal", () => {
    expect(motions("NBA_FINALS")).toEqual([
      "NONE",
      "NONE",
      "NONE",
      "RESOLVING",
    ]);
  });

  it("plays nothing at all in the archive", () => {
    [null, ...ROUNDS].forEach((through) => {
      expect(motions(through, true)).toEqual(["NONE", "NONE", "NONE", "NONE"]);
    });
  });

  // Two different rules on two different rounds: the scores land on the round
  // just completed, the slots on the one after it. Conflating them replays
  // every score on every return to the bracket.
  it("never puts both treatments on the same round", () => {
    [null, ...ROUNDS].forEach((through) => {
      const played = motions(through);

      expect(
        played.filter((m) => m === "RESOLVING").length
      ).toBeLessThanOrEqual(1);
      expect(
        played.filter((m) => m === "REVEALING").length
      ).toBeLessThanOrEqual(1);
      expect(new Set(played.filter((m) => m !== "NONE")).size).toBe(
        played.filter((m) => m !== "NONE").length
      );
    });
  });

  // The hazard this phase exists to avoid: an animation that fires because a
  // far-half series resolved tells the player what the masking withholds.
  it("is unmoved by a far-half result", () => {
    const unresolved = buildBracket();
    const resolved = buildResolvedBracket();

    // Resolving the far half decides real matchups...
    expect(
      resolved.rounds.flatMap((r) => r.matchups).filter((m) => m.winner).length
    ).toBeGreaterThan(
      unresolved.rounds.flatMap((r) => r.matchups).filter((m) => m.winner)
        .length
    );

    // ...and moves neither the reveal nor the resolve.
    expect(revealedThroughFor(resolved)).toBe(revealedThroughFor(unresolved));
    expect(motions(revealedThroughFor(resolved))).toEqual(
      motions(revealedThroughFor(unresolved))
    );
    expect(motions(revealedThroughFor(resolved))).toEqual([
      "REVEALING",
      "NONE",
      "NONE",
      "NONE",
    ]);
  });

  it("advances exactly one round when the squad wins one", () => {
    const before = buildResolvedBracket();
    const after = winSquadMatchup(before);

    expect(motions(revealedThroughFor(before))).toEqual([
      "REVEALING",
      "NONE",
      "NONE",
      "NONE",
    ]);
    expect(motions(revealedThroughFor(after))).toEqual([
      "RESOLVING",
      "REVEALING",
      "NONE",
      "NONE",
    ]);
  });
});

describe("isChampionUnlocking", () => {
  const opponent = {
    teamSlug: "LAL",
    teamName: "Los Angeles Lakers",
    teamLogo: "/logos/LAL.png",
    seasonYear: 1988,
    seed: 1,
    wins: 15,
    losses: 9,
    pedigree: 96,
    bracketSlot: null,
  } as unknown as BracketOpponent;

  it("unlocks on the beat the Conference Finals are revealed", () => {
    expect(isChampionUnlocking("CONFERENCE_SEMIS", opponent)).toBe(true);
  });

  it("stays shut at every other point in the run", () => {
    [null, "FIRST_ROUND", "CONFERENCE_FINALS", "NBA_FINALS"].forEach(
      (through) => {
        expect(
          isChampionUnlocking(through as BracketRoundId | null, opponent)
        ).toBe(false);
      }
    );
  });

  // A null opponent is the lock. Phase 16 shipped the 1985 Lakers into Round 1
  // by reading the drawn champion instead of the guarded value, and the type
  // cannot prevent it — both branches are `BracketOpponent | null`.
  it("never unlocks without a guarded opponent", () => {
    [null, "FIRST_ROUND", "CONFERENCE_SEMIS", "NBA_FINALS"].forEach(
      (through) => {
        expect(
          isChampionUnlocking(through as BracketRoundId | null, null)
        ).toBe(false);
      }
    );
  });

  it("never unlocks in the archive", () => {
    expect(isChampionUnlocking("CONFERENCE_SEMIS", opponent, true)).toBe(false);
  });
});
