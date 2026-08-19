import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BANDS,
  generateBracket,
  maxSeedFor,
  oppositeConference,
  parseBracketQuery,
  pedigreeOf,
  squadSlotFor,
  toBracketOpponent,
} from "@/lib/bracket";
import type { BracketQuery, PlayoffTeamRow } from "@/lib/bracket";
import type { PlayoffRound } from "@/types/bracket";
import type { Conference } from "@/types/game";

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

const pool = (): PlayoffTeamRow[] => {
  const rows: PlayoffTeamRow[] = [];

  for (let index = 0; index < 6; index += 1) {
    rows.push(
      row({
        teamSlug: `E1${index}`,
        seed: 8,
        roundReached: "FIRST_ROUND",
        wins: 1,
        losses: 4,
        seasonYear: 1990 + index,
      })
    );
    rows.push(
      row({
        teamSlug: `E2${index}`,
        seed: 4,
        roundReached: "CONFERENCE_SEMIS",
        wins: 4,
        losses: 4,
        seasonYear: 1990 + index,
      })
    );
  }

  for (let index = 0; index < 8; index += 1) {
    rows.push(
      row({
        teamSlug: `E3${index}`,
        seed: 2,
        roundReached: "CONFERENCE_FINALS",
        wins: 8,
        losses: 5,
        seasonYear: 1990 + index,
      })
    );
  }

  // Rows that sit in two bands at once. Without them the bands never overlap in
  // the fixture and the escalation floor looks load-bearing when it isn't.
  rows.push(
    row({
      teamSlug: "EOV1",
      seed: 5,
      roundReached: "CONFERENCE_SEMIS",
      wins: 2,
      losses: 4,
      seasonYear: 1996,
    })
  );
  rows.push(
    row({
      teamSlug: "EOV2",
      seed: 8,
      roundReached: "CONFERENCE_SEMIS",
      wins: 0,
      losses: 4,
      seasonYear: 1997,
    })
  );
  rows.push(
    row({
      teamSlug: "EOV3",
      seed: 1,
      roundReached: "CONFERENCE_SEMIS",
      wins: 4,
      losses: 2,
      seasonYear: 1998,
    })
  );
  rows.push(
    row({
      teamSlug: "EOV4",
      seed: 8,
      roundReached: "CONFERENCE_FINALS",
      wins: 0,
      losses: 4,
      seasonYear: 1999,
    })
  );

  for (let index = 0; index < 6; index += 1) {
    rows.push(
      row({
        teamSlug: `W1${index}`,
        conference: "WEST",
        seed: 1,
        roundReached: "CHAMPION",
        wins: 15,
        losses: 3,
        seasonYear: 1990 + index,
      })
    );
  }

  return rows;
};

const query = (overrides: Partial<BracketQuery> = {}): BracketQuery => ({
  conference: "EAST",
  squadRating: 74,
  exclude: [],
  ...overrides,
});

const opponentsOf = (
  bracket: NonNullable<ReturnType<typeof generateBracket>>
) =>
  bracket.rounds
    .flatMap((round) => round.matchups)
    .flatMap((matchup) => [matchup.home, matchup.away])
    .filter((slot) => slot?.side === "OPPONENT")
    .map((slot) => slot.opponent);

describe("pedigreeOf", () => {
  it("scores from round reached, seed, and series record", () => {
    // 30 base + 12 x 1/8 seed + 6 x 1/5 record = 32.7
    expect(
      pedigreeOf(
        row({
          teamSlug: "AAA",
          seed: 8,
          roundReached: "FIRST_ROUND",
          wins: 1,
          losses: 4,
        })
      )
    ).toBe(33);

    // 48 base + 12 x 5/8 seed + 6 x 4/8 record = 58.5
    expect(
      pedigreeOf(
        row({
          teamSlug: "BBB",
          seed: 4,
          roundReached: "CONFERENCE_SEMIS",
          wins: 4,
          losses: 4,
        })
      )
    ).toBe(59);
  });

  it("orders the round bases as the ladder requires", () => {
    const rounds: PlayoffRound[] = [
      "FIRST_ROUND",
      "CONFERENCE_SEMIS",
      "CONFERENCE_FINALS",
      "NBA_FINALS",
      "CHAMPION",
    ];

    const scores = rounds.map((roundReached) =>
      pedigreeOf(row({ teamSlug: "X", roundReached, wins: 4, losses: 4 }))
    );

    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(new Set(scores).size).toBe(rounds.length);
  });

  it("scales the seed bonus by the season's bracket size", () => {
    expect(maxSeedFor(1983)).toBe(6);
    expect(maxSeedFor(1984)).toBe(8);

    const bottomOf1981 = pedigreeOf(
      row({ teamSlug: "PHO", seasonYear: 1981, seed: 6, wins: 0, losses: 2 })
    );
    const sixthOf1990 = pedigreeOf(
      row({ teamSlug: "PHO", seasonYear: 1990, seed: 6, wins: 0, losses: 2 })
    );

    // A 6 seed is last in a 12-team bracket but mid-pack in a 16-team one.
    expect(bottomOf1981).toBe(32);
    expect(sixthOf1990).toBe(35);

    const topOf1981 = pedigreeOf(
      row({ teamSlug: "PHO", seasonYear: 1981, seed: 1, wins: 0, losses: 2 })
    );
    expect(topOf1981).toBe(42);
  });

  it("clamps to 100 and survives a team with no games", () => {
    expect(
      pedigreeOf(
        row({
          teamSlug: "CHI",
          seasonYear: 1996,
          seed: 1,
          roundReached: "CHAMPION",
          wins: 15,
          losses: 3,
        })
      )
    ).toBe(100);

    expect(
      pedigreeOf(row({ teamSlug: "ZZZ", wins: 0, losses: 0 }))
    ).toBeGreaterThan(0);
  });
});

describe("toBracketOpponent", () => {
  it("never carries a team rating", () => {
    const opponent = toBracketOpponent(row({ teamSlug: "CHI" }));

    expect(Object.keys(opponent)).not.toContain("teamRating");
    expect(Object.keys(opponent)).not.toContain("rating");
    expect(opponent.teamLogo).toBe("/logos/CHI.png");
    expect(opponent.teamSeasonId).toBe("CHI-1990");
  });
});

describe("squadSlotFor", () => {
  it("maps a squad rating onto a bracket seed", () => {
    expect(squadSlotFor(95)).toBe(1);
    expect(squadSlotFor(88)).toBe(1);
    expect(squadSlotFor(87)).toBe(2);
    expect(squadSlotFor(74)).toBe(4);
    expect(squadSlotFor(52)).toBe(7);
    expect(squadSlotFor(51)).toBe(8);
    expect(squadSlotFor(0)).toBe(8);
  });
});

describe("generateBracket", () => {
  it("builds four rounds with eight conference slots", () => {
    const bracket = generateBracket(pool(), query(), "seed-1");

    expect(bracket).not.toBeNull();
    if (!bracket) return;

    expect(bracket.rounds.map((round) => round.id)).toEqual([
      "FIRST_ROUND",
      "CONFERENCE_SEMIS",
      "CONFERENCE_FINALS",
      "NBA_FINALS",
    ]);
    expect(bracket.rounds[0].matchups).toHaveLength(4);
    expect(bracket.rounds[1].matchups).toHaveLength(2);
    expect(bracket.rounds[2].matchups).toHaveLength(1);
    expect(bracket.rounds[3].matchups).toHaveLength(1);

    const firstRoundSeeds = bracket.rounds[0].matchups.map((matchup) => [
      matchup.home?.bracketSlot,
      matchup.away?.bracketSlot,
    ]);
    expect(firstRoundSeeds).toEqual([
      [1, 8],
      [4, 5],
      [3, 6],
      [2, 7],
    ]);
  });

  it("seats the squad at its own seed exactly once", () => {
    const bracket = generateBracket(pool(), query({ squadRating: 90 }), "s2");

    expect(bracket?.squadSlot).toBe(1);

    const squadSlots = bracket?.rounds[0].matchups
      .flatMap((matchup) => [matchup.home, matchup.away])
      .filter((slot) => slot?.side === "SQUAD");

    expect(squadSlots).toHaveLength(1);
    expect(squadSlots?.[0]?.bracketSlot).toBe(1);
  });

  it("escalates: every group clears the previous group's best", () => {
    for (let index = 0; index < 50; index += 1) {
      const bracket = generateBracket(pool(), query(), `escalate-${index}`);
      expect(bracket).not.toBeNull();
      if (!bracket) return;

      const bySeed = new Map(
        bracket.rounds[0].matchups
          .flatMap((matchup) => [matchup.home, matchup.away])
          .filter((slot) => slot?.side === "OPPONENT")
          .map((slot) => [slot.bracketSlot, slot.opponent])
      );

      const squadSlot = bracket.squadSlot;
      const firstRound = bySeed.get(9 - squadSlot);
      const half = [1, 8, 4, 5].includes(squadSlot)
        ? [1, 8, 4, 5]
        : [2, 7, 3, 6];
      const semis = half
        .filter((seed) => seed !== squadSlot && seed !== 9 - squadSlot)
        .map((seed) => bySeed.get(seed));
      const far = [1, 2, 3, 4, 5, 6, 7, 8]
        .filter((seed) => !half.includes(seed))
        .map((seed) => bySeed.get(seed));
      const finals = bracket.rounds[3].matchups[0].away;

      const firstRoundBest = firstRound?.pedigree ?? 0;
      const semisWorst = Math.min(...semis.map((o) => o?.pedigree ?? 0));
      const semisBest = Math.max(...semis.map((o) => o?.pedigree ?? 0));
      const farWorst = Math.min(...far.map((o) => o?.pedigree ?? 0));
      const farBest = Math.max(...far.map((o) => o?.pedigree ?? 0));

      expect(semisWorst).toBeGreaterThan(firstRoundBest);
      expect(farWorst).toBeGreaterThan(semisBest);
      expect(
        finals?.side === "OPPONENT" ? finals.opponent.pedigree : 0
      ).toBeGreaterThan(farBest);
    }
  });

  it("keeps every opponent inside its round's band", () => {
    const bracket = generateBracket(pool(), query(), "bands");
    if (!bracket) throw new Error("no bracket");

    const finals = bracket.rounds[3].matchups[0].away;
    expect(finals?.side).toBe("OPPONENT");
    if (finals?.side !== "OPPONENT") return;

    expect(finals.opponent.pedigree).toBeGreaterThanOrEqual(
      BANDS.NBA_FINALS.min
    );
    expect(finals.opponent.pedigree).toBeLessThanOrEqual(BANDS.NBA_FINALS.max);

    for (const opponent of opponentsOf(bracket)) {
      if (opponent === finals.opponent) continue;
      expect(opponent.pedigree).toBeGreaterThanOrEqual(BANDS.FIRST_ROUND.min);
      expect(opponent.pedigree).toBeLessThanOrEqual(
        BANDS.CONFERENCE_FINALS.max
      );
    }
  });

  it("draws seven conference opponents and one from the other conference", () => {
    const bracket = generateBracket(pool(), query({ conference: "EAST" }), "c");
    if (!bracket) throw new Error("no bracket");

    const opponents = opponentsOf(bracket);
    expect(opponents).toHaveLength(8);

    const east = opponents.filter((o) => o.conference === "EAST");
    const west = opponents.filter((o) => o.conference === "WEST");
    expect(east).toHaveLength(7);
    expect(west).toHaveLength(1);

    const finals = bracket.rounds[3].matchups[0].away;
    expect(finals?.side === "OPPONENT" && finals.opponent.conference).toBe(
      "WEST"
    );
  });

  it("never repeats a franchise", () => {
    for (let index = 0; index < 50; index += 1) {
      const bracket = generateBracket(pool(), query(), `unique-${index}`);
      if (!bracket) throw new Error("no bracket");

      const slugs = opponentsOf(bracket).map((o) => o.teamSlug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("excludes the team-seasons the squad drafted from", () => {
    const excluded = ["E10-1990", "E20-1990", "W10-1990"];

    for (let index = 0; index < 30; index += 1) {
      const bracket = generateBracket(
        pool(),
        query({ exclude: excluded }),
        `exclude-${index}`
      );
      if (!bracket) throw new Error("no bracket");

      for (const opponent of opponentsOf(bracket)) {
        expect(excluded).not.toContain(opponent.teamSeasonId);
      }
    }
  });

  it("leaves later rounds unresolved and never declares a winner", () => {
    const bracket = generateBracket(pool(), query(), "unresolved");
    if (!bracket) throw new Error("no bracket");

    expect(bracket.rounds[1].matchups.every((m) => !m.home && !m.away)).toBe(
      true
    );
    expect(bracket.rounds[2].matchups[0].home).toBeNull();
    expect(bracket.rounds[3].matchups[0].home).toBeNull();
    expect(
      bracket.rounds
        .flatMap((round) => round.matchups)
        .every((matchup) => matchup.winner === null)
    ).toBe(true);
  });

  it("is reproducible from its run seed", () => {
    const first = generateBracket(pool(), query(), "same-seed");
    const second = generateBracket(pool(), query(), "same-seed");
    const other = generateBracket(pool(), query(), "other-seed");

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(JSON.stringify(first)).not.toBe(JSON.stringify(other));
    expect(first?.runSeed).toBe("same-seed");
  });

  it("returns null when a band cannot be filled", () => {
    const thin = pool().filter((r) => r.roundReached !== "CONFERENCE_FINALS");

    expect(generateBracket(thin, query(), "thin")).toBeNull();
    expect(generateBracket([], query(), "empty")).toBeNull();
  });
});

describe("oppositeConference", () => {
  it("flips the conference", () => {
    const conferences: Conference[] = ["EAST", "WEST"];
    expect(conferences.map(oppositeConference)).toEqual(["WEST", "EAST"]);
  });
});

describe("parseBracketQuery", () => {
  const parse = (search: string) =>
    parseBracketQuery(new URLSearchParams(search));

  it("accepts a complete request", () => {
    expect(
      parse(
        "conference=EAST&squadRating=78&exclude=CHI-1996,LAL-2020&runSeed=k3f9qv1p"
      )
    ).toEqual({
      conference: "EAST",
      squadRating: 78,
      exclude: ["CHI-1996", "LAL-2020"],
      runSeed: "k3f9qv1p",
    });
  });

  it("defaults exclude to empty and leaves runSeed unset", () => {
    expect(parse("conference=WEST&squadRating=60")).toEqual({
      conference: "WEST",
      squadRating: 60,
      exclude: [],
      runSeed: undefined,
    });
  });

  it("rejects a malformed request", () => {
    expect(parse("squadRating=60")).toBeNull();
    expect(parse("conference=NORTH&squadRating=60")).toBeNull();
    expect(parse("conference=EAST")).toBeNull();
    expect(parse("conference=EAST&squadRating=101")).toBeNull();
    expect(parse("conference=EAST&squadRating=-1")).toBeNull();
    expect(parse("conference=EAST&squadRating=abc")).toBeNull();
    expect(
      parse("conference=EAST&squadRating=60&runSeed=NOT-VALID")
    ).toBeNull();
  });
});

describe("team rating exclusion", () => {
  it("is enforced by the source, not just by convention", () => {
    const generator = readFileSync("src/lib/bracket.ts", "utf8");
    const queries = readFileSync("src/lib/db/bracket.ts", "utf8");

    // Difficulty comes from playoff history alone — see §2 of
    // context/docs/bracket-generation.md.
    expect(queries).not.toMatch(/prisma\.teamSeason/);
    expect(queries).toMatch(/prisma\.playoffParticipation/);
    expect(queries).not.toMatch(/rating/);
    expect(generator).not.toMatch(/teamRating/);
  });
});
