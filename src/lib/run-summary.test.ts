import { describe, expect, it } from "vitest";
import {
  defeatSubtitle,
  eliminationHeadline,
  eliminationRow,
  gamesPlayed,
  opponentLabel,
  playoffRecord,
  recordLabel,
  runPath,
  runScoringLeader,
  signatureGame,
  signatureLine,
} from "@/lib/run-summary";
import type { RunPathRow } from "@/lib/run-summary";
import type { Bracket, BracketOpponent, BracketRoundId } from "@/types/bracket";
import type { GameResult, MatchSideId, ScoringLine } from "@/types/match";
import type { SeriesState } from "@/types/match";

const opponent = (teamName: string, seasonYear = 1993): BracketOpponent => ({
  teamSeasonId: `${teamName}-${seasonYear}`,
  teamSlug: teamName.slice(0, 3).toUpperCase(),
  teamName,
  teamLogo: `/logos/${teamName}.png`,
  seasonYear,
  conference: "EAST",
  seed: 3,
  roundReached: "CONFERENCE_FINALS",
  wins: 8,
  losses: 7,
  pedigree: 70,
});

type GameSpec = {
  gameNumber: number;
  squadPoints: number;
  opponentPoints: number;
  scoring?: { name: string; points: number; side?: MatchSideId }[];
};

// Rows are hand-built so every derivation is exercised without a bracket: the
// squad deliberately sits on AWAY, which catches anything reading HOME.
const SQUAD_SIDE: MatchSideId = "AWAY";
const OTHER_SIDE: MatchSideId = "HOME";

const game = (spec: GameSpec): GameResult => {
  const scoring: ScoringLine[] = (spec.scoring ?? []).map((line) => ({
    side: line.side ?? SQUAD_SIDE,
    playerSeasonId: `${line.name}-id`,
    playerName: line.name,
    points: line.points,
  }));

  return {
    gameNumber: spec.gameNumber,
    seed: `g${spec.gameNumber}-${spec.squadPoints}-${spec.opponentPoints}`,
    hostSide: "HOME",
    homeScore: spec.opponentPoints,
    awayScore: spec.squadPoints,
    periodScores: [],
    winner: spec.squadPoints > spec.opponentPoints ? SQUAD_SIDE : OTHER_SIDE,
    events: [],
    scoring,
  };
};

const pathRow = (
  round: BracketRoundId,
  label: string,
  teamName: string,
  games: GameSpec[]
): RunPathRow => {
  const built = games.map(game);
  const squadWins = built.filter((one) => one.winner === SQUAD_SIDE).length;

  return {
    round,
    label,
    opponent: opponent(teamName),
    squadSide: SQUAD_SIDE,
    squadWins,
    opponentWins: built.length - squadWins,
    won: squadWins > built.length - squadWins,
    games: built,
  };
};

const win = (gameNumber: number, margin = 6): GameSpec => ({
  gameNumber,
  squadPoints: 100 + margin,
  opponentPoints: 100,
});

const loss = (gameNumber: number, margin = 6): GameSpec => ({
  gameNumber,
  squadPoints: 100,
  opponentPoints: 100 + margin,
});

describe("playoffRecord", () => {
  it("totals series wins and losses across every round played", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        win(1),
        win(2),
        loss(3),
        win(4),
        win(5),
      ]),
      pathRow("CONFERENCE_SEMIS", "Conference Semifinals", "Knicks", [
        win(1),
        loss(2),
        loss(3),
        loss(4),
        loss(5),
      ]),
    ];

    expect(playoffRecord(path)).toEqual({ wins: 5, losses: 5 });
    expect(recordLabel(playoffRecord(path))).toBe("5-5");
    expect(gamesPlayed(path)).toBe(10);
  });

  it("is 0-0 for a run with no completed round", () => {
    expect(playoffRecord([])).toEqual({ wins: 0, losses: 0 });
    expect(recordLabel(playoffRecord([]))).toBe("0-0");
  });
});

describe("runScoringLeader", () => {
  const path = [
    pathRow("FIRST_ROUND", "Round 1", "Pacers", [
      {
        gameNumber: 1,
        squadPoints: 110,
        opponentPoints: 100,
        scoring: [
          { name: "Jordan", points: 40 },
          { name: "Magic", points: 20 },
          // Deliberately more than any squad player's run total, so dropping
          // the side guard makes him the leader rather than tying.
          { name: "Ewing", points: 70, side: OTHER_SIDE },
        ],
      },
      {
        gameNumber: 2,
        squadPoints: 90,
        opponentPoints: 101,
        scoring: [
          { name: "Jordan", points: 20 },
          { name: "Magic", points: 35 },
        ],
      },
    ]),
  ];

  it("totals points across the run and divides by games played", () => {
    const leader = runScoringLeader(path);

    expect(leader?.playerName).toBe("Jordan");
    expect(leader?.points).toBe(60);
    expect(leader?.gamesPlayed).toBe(2);
    expect(leader?.pointsPerGame).toBe(30);
  });

  it("never counts the opposing side", () => {
    expect(runScoringLeader(path)?.playerName).not.toBe("Ewing");
  });

  it("rounds points per game to one decimal", () => {
    const leader = runScoringLeader([
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        {
          gameNumber: 1,
          squadPoints: 110,
          opponentPoints: 100,
          scoring: [{ name: "Bird", points: 33 }],
        },
        {
          gameNumber: 2,
          squadPoints: 110,
          opponentPoints: 100,
          scoring: [{ name: "Bird", points: 30 }],
        },
        {
          gameNumber: 3,
          squadPoints: 110,
          opponentPoints: 100,
          scoring: [{ name: "Bird", points: 30 }],
        },
      ]),
    ]);

    expect(leader?.points).toBe(93);
    expect(leader?.pointsPerGame).toBe(31);
  });

  it("returns null when no game was played", () => {
    expect(runScoringLeader([])).toBeNull();
  });
});

describe("signatureGame", () => {
  it("prefers the later round over a bigger margin in an earlier one", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        { gameNumber: 1, squadPoints: 140, opponentPoints: 90 },
      ]),
      pathRow("NBA_FINALS", "NBA Finals", "Warriors", [
        { gameNumber: 1, squadPoints: 101, opponentPoints: 100 },
      ]),
    ];

    expect(signatureGame(path)?.round).toBe("NBA_FINALS");
    expect(signatureGame(path)?.squadPoints).toBe(101);
  });

  it("prefers a game 7 over a bigger margin in the same round", () => {
    const path = [
      pathRow("NBA_FINALS", "NBA Finals", "Warriors", [
        win(1, 30),
        win(2, 25),
        loss(3),
        loss(4),
        win(5, 20),
        loss(6),
        { gameNumber: 7, squadPoints: 112, opponentPoints: 108 },
      ]),
    ];

    const signature = signatureGame(path);

    expect(signature?.gameNumber).toBe(7);
    expect(signature?.squadPoints).toBe(112);
  });

  it("falls back to the largest margin when the round has no game 7", () => {
    const path = [
      pathRow("CONFERENCE_SEMIS", "Conference Semifinals", "Knicks", [
        win(1, 4),
        { gameNumber: 2, squadPoints: 112, opponentPoints: 101 },
        loss(3),
        win(4, 8),
        loss(5),
        loss(6),
      ]),
    ];

    const signature = signatureGame(path);

    expect(signature?.gameNumber).toBe(2);
    expect(signature?.label).toBe("Conference Semifinals");
  });

  // Two wins by the same margin in the same round: the rule has to name one.
  it("breaks a margin tie with the later game", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        win(1, 12),
        loss(2),
        win(3, 12),
        win(4, 12),
      ]),
    ];

    expect(signatureGame(path)?.gameNumber).toBe(4);
  });

  it("never picks a defeat, because the line reads 'over the ...'", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        win(1, 2),
        loss(2, 40),
        loss(3, 40),
        loss(4, 40),
        loss(5, 40),
      ]),
    ];

    const signature = signatureGame(path);

    expect(signature?.gameNumber).toBe(1);
    expect(signature!.squadPoints).toBeGreaterThan(signature!.opponentPoints);
  });

  it("returns null for a run that never won a game", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        loss(1),
        loss(2),
        loss(3),
        loss(4),
      ]),
    ];

    expect(signatureGame(path)).toBeNull();
    expect(signatureGame([])).toBeNull();
  });

  it("names the squad's own top scorer in that game", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        {
          gameNumber: 1,
          squadPoints: 120,
          opponentPoints: 100,
          scoring: [
            { name: "Magic", points: 25 },
            { name: "Jordan", points: 43 },
            { name: "Ewing", points: 55, side: OTHER_SIDE },
          ],
        },
      ]),
    ];

    const signature = signatureGame(path);

    expect(signature?.scorerName).toBe("Jordan");
    expect(signature?.scorerPoints).toBe(43);
  });
});

describe("signatureLine", () => {
  it("reads as one sentence with the opponent named once", () => {
    const path = [
      pathRow("NBA_FINALS", "NBA Finals", "Golden State Warriors", [
        { gameNumber: 7, squadPoints: 112, opponentPoints: 108 },
      ]),
    ];

    expect(signatureLine(signatureGame(path)!)).toBe(
      "Game 7 · NBA Finals · 112-108 over the 1993 Golden State Warriors"
    );
  });

  it("drops the clause rather than doubling the article", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        { gameNumber: 1, squadPoints: 110, opponentPoints: 100 },
      ]),
    ];
    const signature = { ...signatureGame(path)!, opponent: null };

    expect(signatureLine(signature)).toBe("Game 1 · Round 1 · 110-100");
    expect(signatureLine(signature)).not.toContain("the the");
  });
});

describe("opponentLabel", () => {
  it("prefixes the season to the franchise", () => {
    expect(opponentLabel(opponent("New York Knicks"))).toBe(
      "1993 New York Knicks"
    );
  });

  it("falls back without inventing a team", () => {
    expect(opponentLabel(null)).toBe("Opponent");
  });
});

// The article rule Phase 16 established, in the one place this phase generates
// round copy. Round 1 is the case a browser run never reproduced after the fix.
describe("eliminationHeadline", () => {
  const headlineFor = (round: BracketRoundId, label: string) =>
    eliminationHeadline(pathRow(round, label, "Knicks", [loss(1)]));

  it("takes no article for Round 1", () => {
    expect(headlineFor("FIRST_ROUND", "Round 1")).toBe("ELIMINATED IN ROUND 1");
    expect(headlineFor("FIRST_ROUND", "Round 1")).not.toContain("IN THE ROUND");
  });

  it("takes the article for every other round", () => {
    expect(headlineFor("CONFERENCE_SEMIS", "Conference Semifinals")).toBe(
      "ELIMINATED IN THE CONFERENCE SEMIFINALS"
    );
    expect(headlineFor("CONFERENCE_FINALS", "Conference Finals")).toBe(
      "ELIMINATED IN THE CONFERENCE FINALS"
    );
    expect(headlineFor("NBA_FINALS", "NBA Finals")).toBe(
      "ELIMINATED IN THE NBA FINALS"
    );
  });

  it("falls back without naming a round it cannot identify", () => {
    expect(eliminationHeadline(null)).toBe("ELIMINATED IN THE PLAYOFFS");
  });
});

describe("defeatSubtitle", () => {
  // The inverse of every other score on this screen, which reads squad-first.
  it("leads with the opponent and their winning score", () => {
    const row = pathRow("CONFERENCE_SEMIS", "Conference Semifinals", "Knicks", [
      win(1),
      win(2),
      loss(3),
      loss(4),
      loss(5),
      loss(6),
    ]);

    expect(defeatSubtitle(row)).toBe("1993 Knicks won the series 4-2");
  });
});

describe("eliminationRow", () => {
  it("finds the round that ended the run", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        win(1),
        win(2),
        win(3),
        win(4),
      ]),
      pathRow("CONFERENCE_SEMIS", "Conference Semifinals", "Knicks", [
        win(1),
        win(2),
        loss(3),
        loss(4),
        loss(5),
        loss(6),
      ]),
    ];

    const row = eliminationRow(path);

    expect(row?.round).toBe("CONFERENCE_SEMIS");
    expect(row?.squadWins).toBe(2);
    expect(row?.opponentWins).toBe(4);
  });

  it("is null for a run that was never beaten", () => {
    const path = [
      pathRow("FIRST_ROUND", "Round 1", "Pacers", [
        win(1),
        win(2),
        win(3),
        win(4),
      ]),
    ];

    expect(eliminationRow(path)).toBeNull();
    expect(eliminationRow([])).toBeNull();
  });
});

describe("runPath", () => {
  const matchup = (id: string, round: BracketRoundId, squadHome: boolean) => ({
    id,
    round,
    home: squadHome
      ? ({ side: "SQUAD", bracketSlot: 1 } as const)
      : ({
          side: "OPPONENT",
          bracketSlot: 2,
          opponent: opponent("Knicks"),
        } as const),
    away: squadHome
      ? ({
          side: "OPPONENT",
          bracketSlot: 2,
          opponent: opponent("Knicks"),
        } as const)
      : ({ side: "SQUAD", bracketSlot: 1 } as const),
    winner: null,
  });

  const bracketOf = (squadHome: boolean): Bracket => ({
    runSeed: "seed",
    conference: "EAST",
    squadSlot: 1,
    rounds: [
      {
        id: "FIRST_ROUND",
        label: "Round 1",
        matchups: [matchup("r1-m1", "FIRST_ROUND", squadHome)],
      },
      {
        id: "CONFERENCE_SEMIS",
        label: "Conference Semifinals",
        matchups: [matchup("r2-m1", "CONFERENCE_SEMIS", squadHome)],
      },
    ],
  });

  const decided = (
    matchupId: string,
    homeWins: number,
    awayWins: number
  ): SeriesState => ({
    matchupId,
    homeWins,
    awayWins,
    winner: homeWins > awayWins ? "HOME" : "AWAY",
    games: [],
  });

  it("reads the score from the squad's side, not the home slot", () => {
    const asHome = runPath(bracketOf(true), [decided("r1-m1", 4, 2)]);
    const asAway = runPath(bracketOf(false), [decided("r1-m1", 2, 4)]);

    expect(asHome[0]).toMatchObject({
      squadWins: 4,
      opponentWins: 2,
      won: true,
    });
    expect(asAway[0]).toMatchObject({
      squadWins: 4,
      opponentWins: 2,
      won: true,
    });
  });

  it("marks a defeat as lost with the squad's score first", () => {
    const path = runPath(bracketOf(true), [decided("r1-m1", 2, 4)]);

    expect(path[0]).toMatchObject({
      squadWins: 2,
      opponentWins: 4,
      won: false,
    });
  });

  it("skips a round whose series is still undecided", () => {
    const undecided: SeriesState = {
      matchupId: "r1-m1",
      homeWins: 3,
      awayWins: 3,
      winner: null,
      games: [],
    };

    expect(runPath(bracketOf(true), [undecided])).toEqual([]);
  });

  it("includes only the rounds actually played", () => {
    const path = runPath(bracketOf(true), [decided("r1-m1", 4, 1)]);

    expect(path).toHaveLength(1);
    expect(path[0].round).toBe("FIRST_ROUND");
    expect(path[0].label).toBe("Round 1");
  });
});
