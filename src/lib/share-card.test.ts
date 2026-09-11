import { describe, expect, it } from "vitest";
import { TRADITIONAL_SLOTS } from "@/data/formations";
import { MAX_SQUAD_NAME_LENGTH } from "@/lib/run";
import {
  DEFAULT_SHARE_RATIO,
  ROUND_IDS,
  SHARE_CARD_FILE_NAME,
  SHARE_CARD_PATH,
  SHARE_CARD_RATIOS,
  SHARE_CARD_SIZES,
  SHARE_CARD_VERSION,
  buildShareCard,
  closingLine,
  decodeShareCard,
  encodeShareCard,
  outcomeBanner,
  parseShareRatio,
  ratioForViewport,
  recordLine,
  shareCardPath,
} from "@/lib/share-card";
import type { ShareCard, ShareCardRatio } from "@/lib/share-card";
import { ROUND_ORDER } from "@/lib/tournament-view";
import type { Bracket, BracketOpponent, BracketRoundId } from "@/types/bracket";
import type { Squad, SquadMember } from "@/types/game";
import type { GameResult, MatchSideId, SeriesState } from "@/types/match";

const opponent = (
  teamName: string,
  seasonYear: number,
  teamSlug = "NYK"
): BracketOpponent => ({
  teamSeasonId: `${teamSlug}-${seasonYear}`,
  teamSlug,
  teamName,
  teamLogo: `/logos/${teamSlug}.png`,
  seasonYear,
  conference: "EAST",
  seed: 1,
  roundReached: "CONFERENCE_FINALS",
  wins: 9,
  losses: 6,
  pedigree: 70,
});

const member = (
  position: (typeof TRADITIONAL_SLOTS)[number],
  index: number
): SquadMember => ({
  playerSlug: `p${index}`,
  playerSeasonId: `p${index}-1996`,
  name: `Player ${index}`,
  teamName: "Chicago Bulls",
  teamSlug: "CHI",
  teamLogo: "/logos/CHI.png",
  seasonYear: 1996,
  position,
  rating: 90,
});

const squadOf = (name?: string): Squad => ({
  name,
  formation: "TRADITIONAL",
  players: TRADITIONAL_SLOTS.map(member),
});

const game = (gameNumber: number, homeScore: number, awayScore: number) =>
  ({
    gameNumber,
    seed: `g${gameNumber}`,
    hostSide: "HOME",
    homeScore,
    awayScore,
    periodScores: [],
    winner: homeScore > awayScore ? "HOME" : "AWAY",
    events: [],
    scoring: [],
  }) satisfies GameResult;

// One squad matchup per round, with the squad always on the HOME slot.
const bracketOf = (rounds: readonly BracketRoundId[]): Bracket => ({
  runSeed: "seed",
  conference: "EAST",
  squadSlot: 1,
  rounds: rounds.map((round, index) => ({
    id: round,
    label: round,
    matchups: [
      {
        id: `m${index}`,
        round,
        home: { side: "SQUAD", bracketSlot: 1 },
        away: {
          side: "OPPONENT",
          bracketSlot: 2,
          opponent: opponent(`Team ${index}`, 1990 + index),
        },
        winner: null,
      },
    ],
  })),
});

const seriesOf = (
  matchupId: string,
  winner: MatchSideId,
  squadWins: number,
  opponentWins: number
): SeriesState => ({
  matchupId,
  homeWins: squadWins,
  awayWins: opponentWins,
  winner,
  games: Array.from({ length: squadWins + opponentWins }, (_, index) =>
    game(index + 1, 100, 90)
  ),
});

const card = (overrides: Partial<ShareCard> = {}): ShareCard => ({
  v: SHARE_CARD_VERSION,
  champion: true,
  name: "Ironside",
  avg: 94,
  wins: 16,
  losses: 5,
  last: { team: "Chicago Bulls", year: 1996, round: "NBA_FINALS" },
  five: TRADITIONAL_SLOTS.map((pos, index) => ({
    pos,
    name: `Player ${index}`,
    team: "Chicago Bulls",
    slug: "CHI",
    year: 1996,
    rating: 90 + index,
  })),
  ...overrides,
});

describe("SHARE_CARD_SIZES", () => {
  it("offers only vertical shapes", () => {
    for (const ratio of SHARE_CARD_RATIOS) {
      const { width, height } = SHARE_CARD_SIZES[ratio];

      expect(height).toBeGreaterThan(width);
    }
  });

  // One layout serves all three, which only holds while the width is shared.
  it("keeps one width and varies only the height", () => {
    const widths = SHARE_CARD_RATIOS.map(
      (ratio) => SHARE_CARD_SIZES[ratio].width
    );
    const heights = SHARE_CARD_RATIOS.map(
      (ratio) => SHARE_CARD_SIZES[ratio].height
    );

    expect(new Set(widths).size).toBe(1);
    expect(heights).toEqual([...heights].sort((a, b) => b - a));
  });

  it("sizes every offered ratio", () => {
    for (const ratio of SHARE_CARD_RATIOS) {
      expect(SHARE_CARD_SIZES[ratio]).toBeDefined();
    }
    expect(SHARE_CARD_RATIOS).toContain(DEFAULT_SHARE_RATIO);
  });
});

describe("ratioForViewport", () => {
  it("hands a phone the tallest shape and a desktop the shortest", () => {
    expect(ratioForViewport(390)).toBe<ShareCardRatio>("STORY");
    expect(ratioForViewport(768)).toBe<ShareCardRatio>("TALL");
    expect(ratioForViewport(1440)).toBe<ShareCardRatio>("FEED");
  });

  // The breakpoints are Tailwind's `sm` and `lg`, so the boundaries are exclusive.
  it("switches exactly at 640 and 1024", () => {
    expect(ratioForViewport(639)).toBe<ShareCardRatio>("STORY");
    expect(ratioForViewport(640)).toBe<ShareCardRatio>("TALL");
    expect(ratioForViewport(1023)).toBe<ShareCardRatio>("TALL");
    expect(ratioForViewport(1024)).toBe<ShareCardRatio>("FEED");
  });

  it("never returns a shape with no size behind it", () => {
    for (const width of [0, 320, 640, 1024, 3840]) {
      expect(SHARE_CARD_RATIOS).toContain(ratioForViewport(width));
    }
  });
});

describe("parseShareRatio", () => {
  it("takes a known ratio and falls back on anything else", () => {
    expect(parseShareRatio("STORY")).toBe<ShareCardRatio>("STORY");
    expect(parseShareRatio(null)).toBe(DEFAULT_SHARE_RATIO);
    expect(parseShareRatio("")).toBe(DEFAULT_SHARE_RATIO);
    expect(parseShareRatio("BILLBOARD")).toBe(DEFAULT_SHARE_RATIO);
  });
});

describe("ROUND_IDS", () => {
  // `z.enum` needs a tuple, so this restatement exists; it must stay in step.
  it("matches ROUND_ORDER exactly, in order", () => {
    expect([...ROUND_IDS]).toEqual([...ROUND_ORDER]);
  });
});

describe("buildShareCard", () => {
  const bracket = bracketOf([
    "FIRST_ROUND",
    "CONFERENCE_SEMIS",
    "CONFERENCE_FINALS",
    "NBA_FINALS",
  ]);

  it("totals the record across every decided series", () => {
    const built = buildShareCard(
      squadOf("Ironside"),
      bracket,
      [
        seriesOf("m0", "HOME", 4, 1),
        seriesOf("m1", "HOME", 4, 2),
        seriesOf("m2", "HOME", 4, 0),
        seriesOf("m3", "HOME", 4, 3),
      ],
      true
    );

    expect(built).toMatchObject({ wins: 16, losses: 6, champion: true });
  });

  // The path stops at the loss, so its last row is the finale in both outcomes.
  it("takes the finale from the last decided round, won or lost", () => {
    const champion = buildShareCard(
      squadOf(),
      bracket,
      ROUND_ORDER.map((_, index) => seriesOf(`m${index}`, "HOME", 4, 1)),
      true
    );

    expect(champion.last).toEqual({
      team: "Team 3",
      year: 1993,
      round: "NBA_FINALS",
    });

    const eliminated = buildShareCard(
      squadOf(),
      bracket,
      [seriesOf("m0", "HOME", 4, 1), seriesOf("m1", "AWAY", 2, 4)],
      false
    );

    expect(eliminated.last).toEqual({
      team: "Team 1",
      year: 1991,
      round: "CONFERENCE_SEMIS",
    });
  });

  it("falls back to YOUR SQUAD when the run was never named", () => {
    expect(buildShareCard(squadOf(), bracket, [], false).name).toBe(
      "YOUR SQUAD"
    );
    expect(buildShareCard(squadOf("Ironside"), bracket, [], false).name).toBe(
      "Ironside"
    );
  });

  it("carries the five in slot order with the squad average", () => {
    const built = buildShareCard(squadOf("Ironside"), bracket, [], false);

    expect(built.five.map((player) => player.pos)).toEqual([
      ...TRADITIONAL_SLOTS,
    ]);
    expect(built.avg).toBe(90);
    expect(built.last).toBeNull();
  });

  // The dialog builds and the route decodes, so anything the builder can emit
  // the decoder has to accept — otherwise sharing fails with a bare 400.
  it("always produces a payload its own decoder accepts", () => {
    const runs: readonly [string, Squad, SeriesState[], boolean][] = [
      [
        "eliminated in round 1",
        squadOf("Ironside"),
        [seriesOf("m0", "AWAY", 1, 4)],
        false,
      ],
      ["unnamed squad", squadOf(), [seriesOf("m0", "AWAY", 0, 4)], false],
      [
        "champion",
        squadOf("Ironside"),
        ROUND_ORDER.map((_, index) => seriesOf(`m${index}`, "HOME", 4, 0)),
        true,
      ],
      ["no series played at all", squadOf("Ironside"), [], false],
      // `normalizeSquadName` caps at MAX_SQUAD_NAME_LENGTH and so does the schema.
      [
        "name at the length cap",
        squadOf("x".repeat(MAX_SQUAD_NAME_LENGTH)),
        [],
        false,
      ],
      ["name outside Latin-1", squadOf("Šarić's Five ☆"), [], false],
    ];

    for (const [label, squad, series, champion] of runs) {
      const built = buildShareCard(squad, bracket, series, champion);
      const decoded = decodeShareCard(encodeShareCard(built));

      expect(decoded, label).toEqual(built);
    }
  });

  // A sweep is worth more than one longest series: every length must survive.
  it("accepts a record from every series length in every round", () => {
    for (const round of [1, 2, 3, 4]) {
      for (const squadWins of [0, 1, 2, 3, 4]) {
        const series = ROUND_ORDER.slice(0, round).map((_, index) =>
          index === round - 1
            ? seriesOf(
                `m${index}`,
                squadWins === 4 ? "HOME" : "AWAY",
                squadWins,
                4
              )
            : seriesOf(`m${index}`, "HOME", 4, 3)
        );
        const built = buildShareCard(
          squadOf("Ironside"),
          bracket,
          series,
          false
        );

        expect(decodeShareCard(encodeShareCard(built))).toEqual(built);
      }
    }
  });
});

describe("closingLine", () => {
  it("names the team beaten in the Finals", () => {
    expect(closingLine(card())).toBe(
      "Beat the 1996 Chicago Bulls in the NBA Finals"
    );
  });

  it("names the team that ended the run", () => {
    expect(
      closingLine(
        card({
          champion: false,
          last: {
            team: "New York Knicks",
            year: 1993,
            round: "CONFERENCE_FINALS",
          },
        })
      )
    ).toBe("Eliminated by the 1993 New York Knicks in the Conference Finals");
  });

  // ROUND_PHRASE carries each round's article, and Round 1 takes none.
  it("does not put an article in front of Round 1", () => {
    const line = closingLine(
      card({
        champion: false,
        last: { team: "Boston Celtics", year: 1986, round: "FIRST_ROUND" },
      })
    );

    expect(line).toBe("Eliminated by the 1986 Boston Celtics in Round 1");
    expect(line).not.toContain("the Round 1");
  });

  it("drops the clause rather than naming nobody", () => {
    expect(closingLine(card({ last: null }))).toBe("Won it all");
    expect(closingLine(card({ champion: false, last: null }))).toBe(
      "The run is over"
    );
  });

  it("reads a phrase for every round", () => {
    for (const round of ROUND_IDS) {
      const line = closingLine(
        card({ champion: false, last: { team: "Team", year: 1996, round } })
      );

      expect(line).not.toContain("undefined");
      expect(line.startsWith("Eliminated by the 1996 Team in ")).toBe(true);
    }
  });
});

describe("outcomeBanner and recordLine", () => {
  it("reads the outcome as one word", () => {
    expect(outcomeBanner(true)).toBe("CHAMPION");
    expect(outcomeBanner(false)).toBe("ELIMINATED");
  });

  it("prints the record squad-first", () => {
    expect(recordLine(card({ wins: 16, losses: 5 }))).toBe("16-5");
  });
});

describe("encodeShareCard / decodeShareCard", () => {
  it("round-trips a card unchanged", () => {
    const original = card();

    expect(decodeShareCard(encodeShareCard(original))).toEqual(original);
  });

  // `btoa(JSON.stringify(...))` throws on these, which is why TextEncoder is used.
  it("survives names outside Latin-1", () => {
    const original = card({
      name: "Šarić's Five",
      five: card().five.map((player, index) =>
        index === 0
          ? { ...player, name: "Luka Dončić", team: "Dallas Mavericks" }
          : player
      ),
    });

    const decoded = decodeShareCard(encodeShareCard(original));

    expect(decoded).toEqual(original);
    expect(decoded?.five[0].name).toBe("Luka Dončić");
  });

  it("emits only URL-safe characters", () => {
    const encoded = encodeShareCard(card({ name: "Šarić's Five" }));

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects anything that is not a card", () => {
    expect(decodeShareCard("")).toBeNull();
    expect(decodeShareCard("!!!not-base64!!!")).toBeNull();
    expect(decodeShareCard(encodeShareCard({} as ShareCard))).toBeNull();
  });

  it("rejects a payload from another version", () => {
    expect(
      decodeShareCard(encodeShareCard(card({ v: SHARE_CARD_VERSION + 1 })))
    ).toBeNull();
  });

  it("rejects a squad that is not five players", () => {
    const four = card().five.slice(0, 4);

    expect(decodeShareCard(encodeShareCard(card({ five: four })))).toBeNull();
  });

  // The slug is interpolated into `/logos/<slug>.png`, so it must not be path-like.
  it("rejects a slug that could escape the logo directory", () => {
    for (const slug of ["../../etc/passwd", "chi", "C", "CHI.png", ""]) {
      const tampered = card({
        five: card().five.map((player, index) =>
          index === 0 ? { ...player, slug } : player
        ),
      });

      expect(decodeShareCard(encodeShareCard(tampered))).toBeNull();
    }
  });

  it("rejects out-of-range numbers and overlong text", () => {
    expect(decodeShareCard(encodeShareCard(card({ avg: 101 })))).toBeNull();
    expect(decodeShareCard(encodeShareCard(card({ wins: 29 })))).toBeNull();
    expect(decodeShareCard(encodeShareCard(card({ name: "" })))).toBeNull();
    expect(
      decodeShareCard(
        encodeShareCard(card({ name: "x".repeat(MAX_SQUAD_NAME_LENGTH + 1) }))
      )
    ).toBeNull();
    expect(
      decodeShareCard(
        encodeShareCard(
          card({ last: { team: "Team", year: 1979, round: "NBA_FINALS" } })
        )
      )
    ).toBeNull();
  });
});

describe("shareCardPath", () => {
  it("builds a query the route can parse back", () => {
    const original = card();
    const path = shareCardPath(original, "STORY");
    const params = new URLSearchParams(path.slice(path.indexOf("?")));

    expect(path.startsWith(`${SHARE_CARD_PATH}?`)).toBe(true);
    expect(parseShareRatio(params.get("ratio"))).toBe<ShareCardRatio>("STORY");
    expect(decodeShareCard(params.get("d") ?? "")).toEqual(original);
  });

  // base64url needs no escaping, so the raw query must survive a URL round trip.
  it("needs no percent-encoding", () => {
    const path = shareCardPath(card({ name: "Šarić's Five" }), "FEED");

    expect(path).toBe(encodeURI(path));
  });
});

describe("SHARE_CARD_FILE_NAME", () => {
  // Deliberately one name for every run, not one built from the squad.
  it("is a fixed png filename", () => {
    expect(SHARE_CARD_FILE_NAME).toBe("legacyrun-result.png");
    expect(SHARE_CARD_FILE_NAME).toMatch(/^[a-z0-9-]+\.png$/);
  });
});
