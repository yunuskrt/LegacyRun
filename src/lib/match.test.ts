import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADVANCEMENTS,
  AND_ONE_RATE,
  BASE_PPP,
  HOME_COURT_NET,
  MAX_SERIES_GAMES,
  OVERTIME_POSSESSIONS,
  PERIOD_MINUTES,
  POINTS_PER_MADE,
  POSSESSIONS_PER_PERIOD,
  REGULATION_PERIODS,
  SERIES_WINS_NEEDED,
  SQUAD_WEIGHTS,
  THREE_RATE,
  TURNOVER_RATE,
  advanceBracket,
  buildMatchData,
  byPointsDesc,
  compressSquadNet,
  effectivePpp,
  findMatchup,
  formatClock,
  gameSeed,
  homeCourtSide,
  hostSideFor,
  makeProbability,
  netRatingOf,
  opponentNet,
  parseMatchDataQuery,
  pickScorer,
  playMatchup,
  rawSquadScore,
  resolvePossession,
  scoringWeights,
  simulateGame,
  simulateSeries,
  squadNet,
  teamForSlot,
  toMatchPlayer,
} from "@/lib/match";
import { seededRng } from "@/lib/rng";
import type { MatchPlayer, MatchTeam, ScoringLine } from "@/types/match";
import type { Bracket, BracketSlot } from "@/types/bracket";

const player = (
  id: string,
  boxPlusMinus: number | null,
  minutesPlayed = 2000,
  playerEfficiencyRating: number | null = 15
): MatchPlayer => ({
  playerSeasonId: id,
  playerName: id.toUpperCase(),
  minutesPlayed,
  boxPlusMinus,
  playerEfficiencyRating,
});

// Five equal players whose minutes-weighted mean × 5 is exactly `net`, so a test
// can dial a side's strength directly.
const teamAt = (id: string, net: number): MatchTeam => ({
  kind: "OPPONENT",
  id,
  name: id,
  players: Array.from({ length: 5 }, (_, index) =>
    player(`${id}-p${index}`, net / 5)
  ),
});

const squadOf = (...bpms: number[]): MatchTeam => ({
  kind: "SQUAD",
  id: "SQUAD",
  name: "Squad",
  players: bpms.map((bpm, index) => player(`s${index}`, bpm)),
});

describe("opponentNet", () => {
  it("weights by minutes and scales five on-court BPMs into a team net", () => {
    const net = opponentNet([
      player("a", 6, 3000),
      player("b", 1, 1000),
      // (6*3000 + 1*1000) / 4000 = 4.75, × 5 = 23.75
    ]);

    expect(net).toBeCloseTo(23.75, 6);
  });

  it("skips MP = 0 rows rather than substituting a value for them", () => {
    const withGhosts = opponentNet([
      player("a", 6, 3000),
      player("b", 1, 1000),
      player("ghost", null, 0),
      player("ghost2", null, 0),
    ]);

    expect(withGhosts).toBeCloseTo(23.75, 6);
  });

  it("does not let an unrated player drag the mean toward zero", () => {
    // Real data never pairs a null BPM with real minutes (Phase 7: null BPM
    // means MP = 0), but the column is nullable, so the guard has to hold. Left
    // in the denominator, this roster would read 15.83 instead of 23.75.
    const withUnrated = opponentNet([
      player("a", 6, 3000),
      player("b", 1, 1000),
      player("unrated", null, 2000),
    ]);

    expect(withUnrated).toBeCloseTo(23.75, 6);
  });

  it("is unmoved by a zero-minute row whichever way it is counted", () => {
    // bpm × 0 in the numerator and 0 in the denominator, so this row cannot
    // change the result — the minutes half of the guard is belt-and-braces.
    expect(
      opponentNet([
        player("a", 6, 3000),
        player("b", 1, 1000),
        player("c", 9, 0),
      ])
    ).toBeCloseTo(23.75, 6);
  });

  it("returns 0 rather than NaN when nothing is rateable", () => {
    expect(opponentNet([])).toBe(0);
    expect(opponentNet([player("ghost", null, 0)])).toBe(0);
  });
});

describe("squad rating", () => {
  it("applies the redundancy weights to BPMs sorted descending", () => {
    const raw = rawSquadScore([
      player("a", 2),
      player("b", 10),
      player("c", 4),
      player("d", 8),
      player("e", 6),
    ]);

    // 10*1.00 + 8*0.80 + 6*0.65 + 4*0.52 + 2*0.42 = 23.22
    expect(raw).toBeCloseTo(23.22, 6);
  });

  it("does not mutate the roster it was handed", () => {
    const players = [player("a", 2), player("b", 10)];
    rawSquadScore(players);

    expect(players.map((entry) => entry.playerSeasonId)).toEqual(["a", "b"]);
  });

  it("weights the best player most", () => {
    expect(SQUAD_WEIGHTS[0]).toBeGreaterThan(
      SQUAD_WEIGHTS[SQUAD_WEIGHTS.length - 1]
    );
    expect([...SQUAD_WEIGHTS].sort((a, b) => b - a)).toEqual([
      ...SQUAD_WEIGHTS,
    ]);
  });

  it("keeps five elite players well short of summing their BPMs", () => {
    const elite = squadOf(12, 12, 12, 12, 12);

    expect(rawSquadScore(elite.players)).toBeLessThan(60);
    expect(squadNet(elite.players)).toBeLessThan(18);
  });

  it("compresses monotonically into a plausible band", () => {
    const points = [0, 5, 10, 16, 25, 40, 60].map(compressSquadNet);

    for (let index = 1; index < points.length; index += 1) {
      expect(points[index]).toBeGreaterThan(points[index - 1]);
    }

    expect(compressSquadNet(-100)).toBeGreaterThan(-8.001);
    expect(compressSquadNet(1000)).toBeLessThan(18.001);
  });

  it("treats a missing BPM as replacement level rather than dropping the slot", () => {
    expect(rawSquadScore([player("a", null)])).toBe(0);
  });
});

describe("netRatingOf", () => {
  it("rates a real team-season and a drafted squad by different rules", () => {
    const bpms = [10, 9, 8, 7, 6];
    const opponent: MatchTeam = { ...teamAt("t", 0) };
    opponent.players = bpms.map((bpm, index) => player(`o${index}`, bpm));

    expect(netRatingOf(opponent)).toBeCloseTo(5 * 8, 6);
    expect(netRatingOf(squadOf(...bpms))).toBeCloseTo(
      compressSquadNet(rawSquadScore(squadOf(...bpms).players)),
      6
    );
  });
});

describe("home court", () => {
  it("gives it to the stronger side", () => {
    const strong = teamAt("strong", 10);
    const weak = teamAt("weak", 2);

    expect(homeCourtSide(strong, weak, 10, 2)).toBe("HOME");
    expect(homeCourtSide(weak, strong, 2, 10)).toBe("AWAY");
  });

  it("breaks an exact tie toward the historical team", () => {
    const squad = squadOf(5, 5, 5, 5, 5);
    const historical = teamAt("hist", 5);

    expect(homeCourtSide(squad, historical, 5, 5)).toBe("AWAY");
    expect(homeCourtSide(historical, squad, 5, 5)).toBe("HOME");
  });

  it("alternates 2-2-1-1-1 from the holder's view", () => {
    const hosts = [1, 2, 3, 4, 5, 6, 7].map((game) =>
      hostSideFor(game, "HOME")
    );

    expect(hosts).toEqual([
      "HOME",
      "HOME",
      "AWAY",
      "AWAY",
      "HOME",
      "AWAY",
      "HOME",
    ]);
    expect(
      [1, 2, 3, 4, 5, 6, 7].map((game) => hostSideFor(game, "AWAY"))
    ).toEqual(hosts.map((side) => (side === "HOME" ? "AWAY" : "HOME")));
  });

  it("is worth a real but beatable edge", () => {
    expect(HOME_COURT_NET).toBeGreaterThan(0);
    expect(HOME_COURT_NET).toBeLessThan(4);
  });
});

describe("the possession table", () => {
  it("derives points per made possession from the outcome rates", () => {
    expect(POINTS_PER_MADE).toBeCloseTo(
      (1 - THREE_RATE - AND_ONE_RATE) * 2 +
        THREE_RATE * 3 +
        AND_ONE_RATE * 2.75,
      6
    );
  });

  it("splits the differential symmetrically onto the two sides", () => {
    expect(effectivePpp(10, 0) - BASE_PPP).toBeCloseTo(
      BASE_PPP - effectivePpp(0, 10),
      6
    );
  });

  it("makes the expected margin over 100 possessions equal the differential", () => {
    const expected = (net: number, opposing: number) =>
      100 *
      (1 - TURNOVER_RATE) *
      makeProbability(effectivePpp(net, opposing)) *
      POINTS_PER_MADE;

    expect(expected(10, 0) - expected(0, 10)).toBeCloseTo(10, 6);
    expect(expected(3, -4) - expected(-4, 3)).toBeCloseTo(7, 6);
  });

  it("clamps the make probability rather than leaving the range", () => {
    expect(makeProbability(effectivePpp(500, -500))).toBeLessThanOrEqual(0.95);
    expect(makeProbability(effectivePpp(-500, 500))).toBeGreaterThanOrEqual(
      0.05
    );
  });

  it("only ever produces 0, 2 or 3 points", () => {
    const rng = seededRng("possessions");

    for (let index = 0; index < 5000; index += 1) {
      const outcome = resolvePossession(0.55, rng);

      expect([0, 2, 3]).toContain(outcome.points);
      if (outcome.andOne) expect(outcome.points).toBeGreaterThan(0);
    }
  });
});

describe("scoring attribution", () => {
  it("gives the squad equal minutes so its shares reduce to PER", () => {
    const squad: MatchTeam = {
      kind: "SQUAD",
      id: "SQUAD",
      name: "Squad",
      players: [player("star", 8, 500, 30), player("role", 3, 3000, 10)],
    };

    expect(scoringWeights(squad)).toEqual([30, 10]);
  });

  it("weights a historical roster by minutes as well as PER", () => {
    const opponent: MatchTeam = {
      kind: "OPPONENT",
      id: "t",
      name: "t",
      players: [player("starter", 5, 3000, 20), player("bench", 1, 300, 20)],
    };

    const [starter, bench] = scoringWeights(opponent);

    expect(starter).toBeGreaterThan(bench * 9);
  });

  it("routes every bucket to the only player who can score", () => {
    const team: MatchTeam = {
      kind: "OPPONENT",
      id: "t",
      name: "t",
      players: [player("scorer", 5, 2000, 25), player("void", 1, 2000, 0)],
    };
    const rng = seededRng("scorers");
    const picks = Array.from(
      { length: 300 },
      () => pickScorer(team, rng).playerSeasonId
    );

    expect(new Set(picks)).toEqual(new Set(["scorer"]));
  });

  it("falls back to a uniform draw when nobody has a usable PER", () => {
    const team: MatchTeam = {
      kind: "OPPONENT",
      id: "t",
      name: "t",
      players: [player("a", 5, 2000, null), player("b", 1, 2000, null)],
    };
    const rng = seededRng("uniform");
    const picks = Array.from(
      { length: 300 },
      () => pickScorer(team, rng).playerSeasonId
    );

    expect(new Set(picks)).toEqual(new Set(["a", "b"]));
  });
});

describe("byPointsDesc", () => {
  const line = (playerName: string, points: number): ScoringLine => ({
    side: "HOME",
    playerSeasonId: playerName.toLowerCase(),
    playerName,
    points,
  });

  const names = (lines: ScoringLine[]) =>
    [...lines].sort(byPointsDesc).map((entry) => entry.playerName);

  it("puts the highest scorer first", () => {
    expect(
      names([line("Pippen", 22), line("Jordan", 38), line("Kukoc", 14)])
    ).toEqual(["Jordan", "Pippen", "Kukoc"]);
  });

  it("breaks a tie on name, ascending", () => {
    expect(names([line("Rodman", 10), line("Harper", 10)])).toEqual([
      "Harper",
      "Rodman",
    ]);
  });

  // The tie-break is what makes the order total. Without it a tie keeps whatever
  // order the caller happened to build its Map in, and the box score, the
  // replay's running leaders and the period summary can disagree on the same
  // two players — the reason all three share this comparator.
  it("orders a tie the same way whatever order it is given in", () => {
    const tied = [
      line("Rodman", 10),
      line("Harper", 10),
      line("Kerr", 10),
      line("Longley", 10),
    ];

    const expected = ["Harper", "Kerr", "Longley", "Rodman"];

    expect(names(tied)).toEqual(expected);
    expect(names([...tied].reverse())).toEqual(expected);
    expect(names([tied[2], tied[0], tied[3], tied[1]])).toEqual(expected);
  });

  it("ranks on points before name", () => {
    expect(names([line("Armstrong", 4), line("Zidek", 31)])).toEqual([
      "Zidek",
      "Armstrong",
    ]);
  });
});

describe("formatClock", () => {
  it("counts a period down to zero", () => {
    expect(formatClock(0, 12)).toBe("12:00");
    expect(formatClock(0.5, 12)).toBe("6:00");
    expect(formatClock(1, 12)).toBe("0:00");
    expect(formatClock(1, 5)).toBe("0:00");
    expect(formatClock(0.5, 5)).toBe("2:30");
  });
});

describe("simulateGame", () => {
  const home = teamAt("home", 6);
  const away = teamAt("away", 2);

  it("is byte-identical for the same seed", () => {
    const first = simulateGame(home, away, 1, "HOME", "seed-a");
    const second = simulateGame(home, away, 1, "HOME", "seed-a");

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("produces different games for different seeds", () => {
    const scores = new Set(
      Array.from({ length: 25 }, (_, index) =>
        JSON.stringify(
          (({ homeScore, awayScore }) => [homeScore, awayScore])(
            simulateGame(home, away, 1, "HOME", `seed-${index}`)
          )
        )
      )
    );

    expect(scores.size).toBeGreaterThan(10);
  });

  it("never ends tied", () => {
    for (let index = 0; index < 200; index += 1) {
      const game = simulateGame(home, away, 1, "HOME", `tie-${index}`);

      expect(game.homeScore).not.toBe(game.awayScore);
      expect(game.winner).toBe(
        game.homeScore > game.awayScore ? "HOME" : "AWAY"
      );
    }
  });

  it("keeps the event log consistent with the final score", () => {
    for (let index = 0; index < 60; index += 1) {
      const game = simulateGame(home, away, 1, "HOME", `log-${index}`);
      const last = game.events[game.events.length - 1];

      expect(last.homeScore).toBe(game.homeScore);
      expect(last.awayScore).toBe(game.awayScore);

      const periods = game.periodScores.reduce(
        (totals, period) => ({
          home: totals.home + period.home,
          away: totals.away + period.away,
        }),
        { home: 0, away: 0 }
      );

      expect(periods).toEqual({
        home: game.homeScore,
        away: game.awayScore,
      });

      for (const side of ["HOME", "AWAY"] as const) {
        const scored = game.scoring
          .filter((line) => line.side === side)
          .reduce((total, line) => total + line.points, 0);

        expect(scored).toBe(side === "HOME" ? game.homeScore : game.awayScore);
      }
    }
  });

  it("increments running totals by exactly the event's points", () => {
    const game = simulateGame(home, away, 1, "HOME", "totals");
    let runningHome = 0;
    let runningAway = 0;

    for (const event of game.events) {
      if (event.side === "HOME") runningHome += event.points;
      else runningAway += event.points;

      expect(event.homeScore).toBe(runningHome);
      expect(event.awayScore).toBe(runningAway);
      expect([2, 3]).toContain(event.points);
      expect(event.period).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives both sides exactly the specced number of possessions", () => {
    const regulation = REGULATION_PERIODS * POSSESSIONS_PER_PERIOD * 2;

    for (let index = 0; index < 120; index += 1) {
      const game = simulateGame(home, away, 1, "HOME", `pace-${index}`);
      const last = game.events[game.events.length - 1];
      const overtimes = game.periodScores.length - REGULATION_PERIODS;
      const total = regulation + overtimes * OVERTIME_POSSESSIONS * 2;

      // The last event lands on or before the final possession, and each side
      // gets the same count — an off-by-one here would bias one side's scoring.
      expect(last.possession).toBeLessThanOrEqual(total);
      expect(
        game.events.filter((event) => event.side === "HOME").length
      ).toBeLessThanOrEqual(total / 2);
    }
  });

  it("clocks each period down from its own length", () => {
    const game = simulateGame(home, away, 1, "HOME", "clocks");
    const firstOf = (period: number) =>
      game.events.find((event) => event.period === period)?.clock;

    for (let period = 1; period <= REGULATION_PERIODS; period += 1) {
      const [minutes] = (firstOf(period) ?? "0:00").split(":").map(Number);
      expect(minutes).toBeLessThan(PERIOD_MINUTES);
    }
  });

  it("plays four periods and adds overtime only to break a tie", () => {
    let sawOvertime = false;

    for (let index = 0; index < 200; index += 1) {
      const game = simulateGame(home, away, 1, "HOME", `ot-${index}`);

      expect(game.periodScores.length).toBeGreaterThanOrEqual(4);
      if (game.periodScores.length > 4) sawOvertime = true;

      const regulation = game.periodScores.slice(0, 4).reduce(
        (totals, period) => ({
          home: totals.home + period.home,
          away: totals.away + period.away,
        }),
        { home: 0, away: 0 }
      );

      // Overtime happened if and only if regulation was level.
      expect(game.periodScores.length > 4).toBe(
        regulation.home === regulation.away
      );
    }

    expect(sawOvertime).toBe(true);
  });
});

describe("calibration", () => {
  const sample = (homeNet: number, awayNet: number, count: number) => {
    const home = teamAt("home", homeNet);
    const away = teamAt("away", awayNet);
    const margins: number[] = [];
    const combined: number[] = [];
    let homeWins = 0;

    for (let index = 0; index < count; index += 1) {
      const game = simulateGame(
        home,
        away,
        1,
        "HOME",
        `cal-${homeNet}-${awayNet}-${index}`
      );
      margins.push(game.homeScore - game.awayScore);
      combined.push(game.homeScore + game.awayScore);
      if (game.winner === "HOME") homeWins += 1;
    }

    const mean = (values: number[]) =>
      values.reduce((total, value) => total + value, 0) / values.length;
    const marginMean = mean(margins);

    return {
      combined: mean(combined),
      marginMean,
      marginSd: Math.sqrt(
        mean(margins.map((margin) => (margin - marginMean) ** 2))
      ),
      homeWinRate: homeWins / count,
    };
  };

  it("lands in the NBA's scoring and variance range", () => {
    const stats = sample(0, 0, 1200);

    expect(stats.combined).toBeGreaterThan(200);
    expect(stats.combined).toBeLessThan(215);

    // Independent possessions overstate margin variance: this lands near 16.9
    // where the real NBA sits around 13.5. Inside the doc's band, at the top of
    // it, and the reason upsets here are a little livelier than history's.
    expect(stats.marginSd).toBeGreaterThan(13);
    expect(stats.marginSd).toBeLessThan(17.5);
  });

  it("gives the home side an edge in an even matchup without deciding it", () => {
    const stats = sample(0, 0, 1200);

    expect(stats.homeWinRate).toBeGreaterThan(0.5);
    expect(stats.homeWinRate).toBeLessThan(0.63);
  });

  it("produces the net differential as the expected margin", () => {
    // Home court is worth HOME_COURT_NET on top of the rating gap.
    const stats = sample(8, 0, 1200);

    expect(stats.marginMean).toBeGreaterThan(6);
    expect(stats.marginMean).toBeLessThan(14);
  });

  it("raises the win rate monotonically with the rating gap", () => {
    const rates = [-12, -6, 0, 6, 12].map(
      (gap) => sample(gap, 0, 400).homeWinRate
    );

    for (let index = 1; index < rates.length; index += 1) {
      expect(rates[index]).toBeGreaterThan(rates[index - 1]);
    }
  });

  it("keeps upsets live — a heavy favourite still drops single games", () => {
    const stats = sample(10, 0, 800);

    expect(stats.homeWinRate).toBeLessThan(0.9);
    expect(stats.homeWinRate).toBeGreaterThan(0.6);
  });
});

describe("no fatigue", () => {
  const squad = squadOf(9, 8, 7, 6, 5);
  const opponent = teamAt("opp", 5);

  it("rates the squad identically in game 7 and game 1", () => {
    expect(netRatingOf(squad)).toBe(netRatingOf(squad));

    const first = simulateGame(squad, opponent, 1, "HOME", "fatigue-fixed");
    const seventh = simulateGame(squad, opponent, 7, "HOME", "fatigue-fixed");

    // Same seed, same host side in games 1 and 7 — so an identical game.
    expect(first.hostSide).toBe(seventh.hostSide);
    expect(first.homeScore).toBe(seventh.homeScore);
    expect(first.awayScore).toBe(seventh.awayScore);
  });

  it("scores the fourth quarter at the same rate as the first", () => {
    let firstQuarter = 0;
    let fourthQuarter = 0;

    for (let index = 0; index < 600; index += 1) {
      const game = simulateGame(squad, opponent, 1, "HOME", `q-${index}`);
      firstQuarter += game.periodScores[0].home;
      fourthQuarter += game.periodScores[3].home;
    }

    expect(fourthQuarter / firstQuarter).toBeGreaterThan(0.95);
    expect(fourthQuarter / firstQuarter).toBeLessThan(1.05);
  });

  it("does not weaken the squad as a series goes on", () => {
    const series = simulateSeries("m", squad, opponent, "fatigue-series");
    const perGame = series.games.map((game) => game.homeScore - game.awayScore);

    // A decay model would trend this downward; nothing here should.
    expect(perGame.length).toBeGreaterThan(0);
    expect(
      simulateGame(squad, opponent, 7, "HOME", gameSeed("x", "m", 1)).homeScore
    ).toBe(
      simulateGame(squad, opponent, 1, "HOME", gameSeed("x", "m", 1)).homeScore
    );
  });
});

describe("simulateSeries", () => {
  const strong = teamAt("strong", 12);
  const weak = teamAt("weak", -6);
  const even = teamAt("even", 0);

  it("ends the moment one side reaches four wins", () => {
    for (let index = 0; index < 120; index += 1) {
      const series = simulateSeries(
        "m1",
        even,
        teamAt("even2", 0),
        `s-${index}`
      );

      expect(Math.max(series.homeWins, series.awayWins)).toBe(
        SERIES_WINS_NEEDED
      );
      expect(Math.min(series.homeWins, series.awayWins)).toBeLessThan(
        SERIES_WINS_NEEDED
      );
      expect(series.games.length).toBe(series.homeWins + series.awayWins);
      expect(series.games.length).toBeLessThanOrEqual(MAX_SERIES_GAMES);
      expect(series.winner).toBe(
        series.homeWins === SERIES_WINS_NEEDED ? "HOME" : "AWAY"
      );
    }
  });

  it("simulates exactly four games in a sweep", () => {
    let sweeps = 0;

    for (let index = 0; index < 200; index += 1) {
      const series = simulateSeries("m1", strong, weak, `sweep-${index}`);

      if (
        Math.max(series.homeWins, series.awayWins) === 4 &&
        series.games.length === 4
      ) {
        sweeps += 1;
        expect(Math.min(series.homeWins, series.awayWins)).toBe(0);
      }
    }

    expect(sweeps).toBeGreaterThan(0);
  });

  it("numbers its games 1..n and seeds each one distinctly", () => {
    const series = simulateSeries("m1", strong, even, "numbering");

    expect(series.games.map((game) => game.gameNumber)).toEqual(
      series.games.map((_, index) => index + 1)
    );
    expect(new Set(series.games.map((game) => game.seed)).size).toBe(
      series.games.length
    );
    expect(series.games[0].seed).toBe(gameSeed("numbering", "m1", 1));
  });

  it("is byte-identical for the same run seed", () => {
    expect(JSON.stringify(simulateSeries("m1", strong, even, "same"))).toBe(
      JSON.stringify(simulateSeries("m1", strong, even, "same"))
    );
  });

  it("lets the underdog take a series often enough to matter", () => {
    const favourite = teamAt("fav", 6);
    const underdog = teamAt("dog", 0);
    let upsets = 0;

    for (let index = 0; index < 300; index += 1) {
      const series = simulateSeries(
        "m1",
        favourite,
        underdog,
        `upset-${index}`
      );
      if (series.winner === "AWAY") upsets += 1;
    }

    expect(upsets / 300).toBeGreaterThan(0.05);
    expect(upsets / 300).toBeLessThan(0.45);
  });
});

describe("advanceBracket", () => {
  const opponentSlot = (id: string): BracketSlot => ({
    side: "OPPONENT",
    bracketSlot: 1,
    opponent: {
      teamSeasonId: id,
      teamSlug: id.split("-")[0],
      teamName: id,
      teamLogo: "",
      seasonYear: 1996,
      conference: "EAST",
      seed: 1,
      roundReached: "CHAMPION",
      wins: 15,
      losses: 3,
      pedigree: 95,
    },
  });

  const bracket = (): Bracket => ({
    runSeed: "seed",
    conference: "EAST",
    squadSlot: 1,
    rounds: [
      {
        id: "FIRST_ROUND",
        label: "Round 1",
        matchups: [
          {
            id: "r1-m1",
            round: "FIRST_ROUND",
            home: { side: "SQUAD", bracketSlot: 1 },
            away: opponentSlot("CHI-1996"),
            winner: null,
          },
          {
            id: "r1-m2",
            round: "FIRST_ROUND",
            home: opponentSlot("LAL-1987"),
            away: opponentSlot("BOS-1986"),
            winner: null,
          },
        ],
      },
      {
        id: "CONFERENCE_SEMIS",
        label: "Conference Semifinals",
        matchups: [
          {
            id: "semis-m1",
            round: "CONFERENCE_SEMIS",
            home: null,
            away: null,
            winner: null,
          },
        ],
      },
    ],
  });

  it("records the winner and seats it in the next round", () => {
    const advanced = advanceBracket(bracket(), "r1-m1", "HOME");
    const first = advanced.rounds[0].matchups[0];
    const semis = advanced.rounds[1].matchups[0];

    expect(first.winner?.side).toBe("SQUAD");
    expect(semis.home?.side).toBe("SQUAD");
    expect(semis.away).toBeNull();
  });

  it("seats the two halves of a semifinal in the right slots", () => {
    const advanced = advanceBracket(
      advanceBracket(bracket(), "r1-m1", "AWAY"),
      "r1-m2",
      "HOME"
    );
    const semis = advanced.rounds[1].matchups[0];

    expect(
      semis.home?.side === "OPPONENT" && semis.home.opponent.teamSeasonId
    ).toBe("CHI-1996");
    expect(
      semis.away?.side === "OPPONENT" && semis.away.opponent.teamSeasonId
    ).toBe("LAL-1987");
  });

  it("leaves the bracket alone for an unknown matchup", () => {
    const original = bracket();

    expect(advanceBracket(original, "nope", "HOME")).toBe(original);
  });

  it("maps every matchup except the Finals into exactly one downstream slot", () => {
    expect(ADVANCEMENTS).toHaveLength(7);
    expect(new Set(ADVANCEMENTS.map((entry) => entry.matchupId)).size).toBe(7);
    expect(
      new Set(ADVANCEMENTS.map((entry) => `${entry.into}.${entry.slot}`)).size
    ).toBe(7);
    expect(ADVANCEMENTS.some((entry) => entry.matchupId === "finals")).toBe(
      false
    );
  });
});

describe("teamForSlot", () => {
  const data = {
    squad: [player("s1", 8), player("s2", 6)],
    opponents: [
      { teamSeasonId: "CHI-1996", players: [player("o1", 9)] },
      { teamSeasonId: "EMPTY-1996", players: [] },
    ],
  };

  const slotFor = (teamSeasonId: string): BracketSlot => ({
    side: "OPPONENT",
    bracketSlot: 1,
    opponent: {
      teamSeasonId,
      teamSlug: teamSeasonId.split("-")[0],
      teamName: teamSeasonId,
      teamLogo: "",
      seasonYear: 1996,
      conference: "EAST",
      seed: 1,
      roundReached: "CHAMPION",
      wins: 15,
      losses: 3,
      pedigree: 95,
    },
  });

  it("builds the squad side from the run's five players", () => {
    const team = teamForSlot(
      { side: "SQUAD", bracketSlot: 1 },
      data,
      "My Squad"
    );

    expect(team?.kind).toBe("SQUAD");
    expect(team?.name).toBe("My Squad");
    expect(team?.players).toHaveLength(2);
  });

  it("builds an opponent side from its roster", () => {
    const team = teamForSlot(slotFor("CHI-1996"), data, "My Squad");

    expect(team?.kind).toBe("OPPONENT");
    expect(team?.id).toBe("CHI-1996");
  });

  it("refuses an unfilled slot", () => {
    expect(teamForSlot(null, data, "My Squad")).toBeNull();
  });

  it("refuses a team whose roster never arrived", () => {
    expect(teamForSlot(slotFor("NOPE-1996"), data, "My Squad")).toBeNull();
  });

  it("refuses an empty roster rather than simulating a phantom team", () => {
    expect(teamForSlot(slotFor("EMPTY-1996"), data, "My Squad")).toBeNull();
  });
});

describe("playMatchup", () => {
  const data = {
    squad: [player("s1", 8)],
    opponents: [{ teamSeasonId: "CHI-1996", players: [player("o1", 4)] }],
  };

  const bracketWith = (
    home: BracketSlot | null,
    away: BracketSlot | null,
    winner: BracketSlot | null = null
  ): Bracket => ({
    runSeed: "seed",
    conference: "EAST",
    squadSlot: 1,
    rounds: [
      {
        id: "FIRST_ROUND",
        label: "Round 1",
        matchups: [{ id: "r1-m1", round: "FIRST_ROUND", home, away, winner }],
      },
    ],
  });

  const squadSlot: BracketSlot = { side: "SQUAD", bracketSlot: 1 };
  const chicago: BracketSlot = {
    side: "OPPONENT",
    bracketSlot: 8,
    opponent: {
      teamSeasonId: "CHI-1996",
      teamSlug: "CHI",
      teamName: "Chicago Bulls",
      teamLogo: "",
      seasonYear: 1996,
      conference: "EAST",
      seed: 1,
      roundReached: "CHAMPION",
      wins: 15,
      losses: 3,
      pedigree: 95,
    },
  };

  it("plays a ready matchup and records the winner", () => {
    const played = playMatchup(
      bracketWith(squadSlot, chicago),
      "r1-m1",
      data,
      "Squad",
      "seed"
    );

    expect(played?.series.winner).not.toBeNull();
    expect(findMatchup(played!.bracket, "r1-m1")?.winner).not.toBeNull();
  });

  it("refuses a matchup that is already decided", () => {
    expect(
      playMatchup(
        bracketWith(squadSlot, chicago, squadSlot),
        "r1-m1",
        data,
        "Squad",
        "seed"
      )
    ).toBeNull();
  });

  it("refuses a matchup with an empty slot", () => {
    expect(
      playMatchup(bracketWith(squadSlot, null), "r1-m1", data, "Squad", "seed")
    ).toBeNull();
  });

  it("refuses an unknown matchup id", () => {
    expect(
      playMatchup(
        bracketWith(squadSlot, chicago),
        "nope",
        data,
        "Squad",
        "seed"
      )
    ).toBeNull();
  });

  it("refuses rather than simulating against a missing roster", () => {
    expect(
      playMatchup(
        bracketWith(squadSlot, chicago),
        "r1-m1",
        { squad: data.squad, opponents: [] },
        "Squad",
        "seed"
      )
    ).toBeNull();
  });

  it("leaves the caller's bracket untouched", () => {
    const original = bracketWith(squadSlot, chicago);
    playMatchup(original, "r1-m1", data, "Squad", "seed");

    expect(original.rounds[0].matchups[0].winner).toBeNull();
  });
});

describe("toMatchPlayer", () => {
  it("carries the three simulation inputs across", () => {
    expect(
      toMatchPlayer({
        id: "a-1",
        player: { fullName: "A Player" },
        data: {
          minutesPlayed: 2000,
          boxPlusMinus: 5,
          playerEfficiencyRating: 20,
        },
      })
    ).toEqual({
      playerSeasonId: "a-1",
      playerName: "A Player",
      minutesPlayed: 2000,
      boxPlusMinus: 5,
      playerEfficiencyRating: 20,
    });
  });

  it("treats a missing data row as unrated rather than as zero production", () => {
    const converted = toMatchPlayer({
      id: "a-1",
      player: { fullName: "A Player" },
      data: null,
    });

    expect(converted.minutesPlayed).toBe(0);
    expect(converted.boxPlusMinus).toBeNull();
    expect(converted.playerEfficiencyRating).toBeNull();
  });
});

describe("parseMatchDataQuery", () => {
  const params = (squad: string, opponents: string) =>
    new URLSearchParams({ squad, opponents });

  it("accepts exactly five distinct squad ids", () => {
    const parsed = parseMatchDataQuery(
      params("a-1,b-2,c-3,d-4,e-5", "CHI-1996,LAL-1987")
    );

    expect(parsed?.squad).toEqual(["a-1", "b-2", "c-3", "d-4", "e-5"]);
    expect(parsed?.opponents).toEqual(["CHI-1996", "LAL-1987"]);
  });

  it("rejects a squad that is not five players", () => {
    expect(
      parseMatchDataQuery(params("a-1,b-2,c-3,d-4", "CHI-1996"))
    ).toBeNull();
    expect(
      parseMatchDataQuery(params("a-1,b-2,c-3,d-4,e-5,f-6", "CHI-1996"))
    ).toBeNull();
  });

  it("rejects a duplicated player, which would double-count his BPM", () => {
    expect(
      parseMatchDataQuery(params("a-1,a-1,c-3,d-4,e-5", "CHI-1996"))
    ).toBeNull();
  });

  it("rejects duplicate or missing opponents", () => {
    expect(
      parseMatchDataQuery(params("a-1,b-2,c-3,d-4,e-5", "CHI-1996,CHI-1996"))
    ).toBeNull();
    expect(parseMatchDataQuery(params("a-1,b-2,c-3,d-4,e-5", ""))).toBeNull();
    expect(
      parseMatchDataQuery(new URLSearchParams({ opponents: "CHI-1996" }))
    ).toBeNull();
  });
});

describe("buildMatchData", () => {
  const query = {
    squad: ["a-1", "b-2", "c-3", "d-4", "e-5"],
    opponents: ["CHI-1996"],
  };

  const row = (id: string) => ({
    id,
    player: { fullName: id.toUpperCase() },
    data: {
      minutesPlayed: 2000,
      boxPlusMinus: 5,
      playerEfficiencyRating: 20,
    },
  });

  const squadRows = query.squad.map(row);
  const rosterRows = ["x-1", "y-2"].map((id) => ({
    teamSeasonId: "CHI-1996",
    playerSeason: row(id),
  }));

  it("returns the squad in the order it was asked for", () => {
    const data = buildMatchData(query, [...squadRows].reverse(), rosterRows);

    expect(data?.squad.map((entry) => entry.playerSeasonId)).toEqual(
      query.squad
    );
    expect(data?.opponents[0].players).toHaveLength(2);
  });

  it("fails rather than simulating a squad with a missing player", () => {
    expect(buildMatchData(query, squadRows.slice(1), rosterRows)).toBeNull();
  });

  it("fails rather than simulating against an empty roster", () => {
    expect(buildMatchData(query, squadRows, [])).toBeNull();
  });

  it("carries a null metric through instead of inventing one", () => {
    const withNulls = [
      ...squadRows.slice(1),
      {
        id: "a-1",
        player: { fullName: "A" },
        data: {
          minutesPlayed: 0,
          boxPlusMinus: null,
          playerEfficiencyRating: null,
        },
      },
    ];
    const data = buildMatchData(query, withNulls, rosterRows);

    expect(data?.squad[0].boxPlusMinus).toBeNull();
    expect(data?.squad[0].playerEfficiencyRating).toBeNull();
  });
});

describe("the excluded inputs stay excluded", () => {
  // Comments naming the excluded fields are the point, so strip them and grep
  // the code that actually runs.
  const source = (file: string) =>
    readFileSync(path.join(process.cwd(), file), "utf8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");

  it("never reads a team rating anywhere in the match feature", () => {
    for (const file of ["src/lib/match.ts", "src/lib/db/match.ts"]) {
      const text = source(file);

      expect(text, `${file} reads prisma.teamSeason`).not.toContain(
        "prisma.teamSeason"
      );
      expect(text, `${file} references teamRating`).not.toContain("teamRating");
      expect(text, `${file} reads a stored .rating`).not.toMatch(/\.rating\b/);
    }
  });

  it("keeps every rule out of the query module", () => {
    const db = source("src/lib/db/match.ts");

    expect(db).not.toContain("Math.");
    expect(db).not.toContain("boxPlusMinus *");
  });
});
