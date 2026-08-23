import { describe, expect, it } from "vitest";
import { PLAYER_SEASON_DATA } from "@/data/db/player_season_data";
import { PLAYER_SEASON_TEAMS } from "@/data/db/player_season_team";
import { PLAYOFF_PARTICIPATION } from "@/data/db/playoff_participation";
import { TEAMS } from "@/data/db/team";
import { generateBracket } from "@/lib/bracket";
import {
  allMatchups,
  isSquadMatchup,
  opponentNet,
  playMatchup,
  resolveOpponentMatchups,
  squadNet,
} from "@/lib/match";
import type { PlayoffTeamRow } from "@/lib/bracket";
import type { Bracket } from "@/types/bracket";
import type { MatchData, MatchPlayer } from "@/types/match";

// The committed tables, folded into the shape the endpoint would return.
// Nothing here touches the database.
const DATA_BY_ID = new Map(
  PLAYER_SEASON_DATA.map((row) => [row.playerSeasonId, row])
);

const toPlayer = (playerSeasonId: string): MatchPlayer => {
  const data = DATA_BY_ID.get(playerSeasonId);

  return {
    playerSeasonId,
    playerName: playerSeasonId,
    minutesPlayed: data?.minutesPlayed ?? 0,
    boxPlusMinus: data?.boxPlusMinus ?? null,
    playerEfficiencyRating: data?.playerEfficiencyRating ?? null,
  };
};

const ROSTERS = new Map<string, MatchPlayer[]>();

for (const link of PLAYER_SEASON_TEAMS) {
  const roster = ROSTERS.get(link.teamSeasonId) ?? [];
  roster.push(toPlayer(link.playerSeasonId));
  ROSTERS.set(link.teamSeasonId, roster);
}

const netOf = (teamSeasonId: string): number =>
  opponentNet(ROSTERS.get(teamSeasonId) ?? []);

describe("real team-seasons rate the way history says they should", () => {
  it("puts the great teams where they belong, with no calibration at all", () => {
    expect(netOf("CHI-1996")).toBeGreaterThan(12);
    expect(netOf("CHI-1996")).toBeLessThan(16);
    expect(netOf("GSW-2017")).toBeGreaterThan(9);
    expect(netOf("GSW-2017")).toBeLessThan(13);
    expect(netOf("LAL-2020")).toBeGreaterThan(3);
    expect(netOf("LAL-2020")).toBeLessThan(9);
  });

  it("rates a sub-.500 team-season negative", () => {
    expect(netOf("VAN-1997")).toBeLessThan(0);
  });

  it("keeps every team-season inside the genuine NBA range", () => {
    const nets = [...ROSTERS.keys()].map(netOf);

    expect(Math.min(...nets)).toBeGreaterThan(-20);
    expect(Math.max(...nets)).toBeLessThan(18);
  });

  // This is the §2 argument, pinned. team_seasons.rating puts PHI-1983 at 95 and
  // ORL-1995 at 94 against CHI-1996's 91 — backwards for a difficulty ladder.
  it("ranks the 72-10 Bulls above the teams the stored rating prefers", () => {
    expect(netOf("CHI-1996")).toBeGreaterThan(netOf("PHI-1983"));
    expect(netOf("CHI-1996")).toBeGreaterThan(netOf("ORL-1995"));
  });
});

describe("a drafted squad rates against real opposition", () => {
  const squadFor = (ids: string[]): MatchPlayer[] => ids.map(toPlayer);

  it("puts an all-time squad just above the best real team", () => {
    const net = squadNet(
      squadFor([
        "jordami01-1996",
        "jamesle01-2013",
        "curryst01-2016",
        "duncati01-2003",
        "abdulka01-1981",
      ])
    );

    expect(net).toBeGreaterThan(netOf("CHI-1996"));
    expect(net).toBeLessThan(18);
  });

  it("puts an ordinary squad below a champion", () => {
    const net = squadNet(
      squadFor([
        "jamisan01-2013",
        "jamesmi01-2013",
        "jamisan01-2013",
        "jamesmi01-2013",
        "jamisan01-2013",
      ])
    );

    expect(net).toBeLessThan(netOf("LAL-2020"));
  });
});

describe("driving a real bracket to a champion", () => {
  const TEAM_NAMES = new Map(TEAMS.map((team) => [team.slug, team.name]));

  const ROWS: PlayoffTeamRow[] = PLAYOFF_PARTICIPATION.map((row) => ({
    teamSlug: row.teamSlug,
    seasonYear: row.seasonYear,
    conference: row.conference,
    seed: row.seed,
    roundReached: row.roundReached,
    wins: row.wins,
    losses: row.losses,
    team: { name: TEAM_NAMES.get(row.teamSlug) ?? "" },
  }));

  const SQUAD = [
    "jordami01-1996",
    "jamesle01-2013",
    "curryst01-2016",
    "duncati01-2003",
    "abdulka01-1981",
  ].map(toPlayer);

  const matchDataFor = (bracket: Bracket): MatchData => ({
    squad: SQUAD,
    opponents: [
      ...new Set(
        allMatchups(bracket)
          .flatMap((matchup) => [matchup.home, matchup.away])
          .filter((slot) => slot?.side === "OPPONENT")
          .map((slot) => slot.opponent.teamSeasonId)
      ),
    ].map((teamSeasonId) => ({
      teamSeasonId,
      players: ROSTERS.get(teamSeasonId) ?? [],
    })),
  });

  const runs = (["EAST", "WEST"] as const).flatMap((conference) =>
    Array.from({ length: 20 }, (_, index) => ({
      conference,
      squadRating: 50 + ((index * 11) % 45),
      seed: `sim-${conference}-${index}`,
    }))
  );

  const buildBracket = (run: (typeof runs)[number]): Bracket => {
    const bracket = generateBracket(
      ROWS,
      { conference: run.conference, squadRating: run.squadRating, exclude: [] },
      run.seed
    );

    if (!bracket) throw new Error(`${run.seed} produced no bracket`);

    return bracket;
  };

  it("has a full roster for every opponent the bracket draws", () => {
    for (const run of runs) {
      for (const roster of matchDataFor(buildBracket(run)).opponents) {
        expect(
          roster.players.length,
          `${roster.teamSeasonId} has no roster`
        ).toBeGreaterThan(4);
      }
    }
  });

  it("resolves the far half and stops at the squad's own games", () => {
    for (const run of runs) {
      const bracket = buildBracket(run);
      const resolved = resolveOpponentMatchups(
        bracket,
        matchDataFor(bracket),
        "Squad",
        run.seed
      );

      // Three opponent-only first-round matchups plus the far-half semifinal.
      expect(resolved.series).toHaveLength(4);

      for (const matchup of allMatchups(resolved.bracket)) {
        if (isSquadMatchup(matchup)) expect(matchup.winner).toBeNull();
      }

      // The far half has produced the Conference Finals opponent and stopped;
      // which slot it lands in depends on the half the squad was seeded into.
      const confFinals = resolved.bracket.rounds[2].matchups[0];
      const filled = [confFinals.home, confFinals.away].filter(Boolean);

      expect(filled).toHaveLength(1);
      expect(confFinals.winner).toBeNull();
    }
  });

  it("plays a whole run through to a champion", () => {
    let squadTitles = 0;

    for (const run of runs) {
      const data = matchDataFor(buildBracket(run));
      let current = resolveOpponentMatchups(
        buildBracket(run),
        data,
        "Squad",
        run.seed
      ).bracket;

      // Play whatever is ready, round by round, until the Finals resolve. The
      // squad's half varies with its seeding, so nothing here is hardcoded.
      let played = 0;

      for (let round = 0; round < 8; round += 1) {
        const next = allMatchups(current).find(
          (matchup) => !matchup.winner && matchup.home && matchup.away
        );

        if (!next) break;

        const result = playMatchup(current, next.id, data, "Squad", run.seed);
        if (!result) throw new Error(`${next.id} would not play`);

        current = result.bracket;
        played += 1;

        expect(result.series.winner).not.toBeNull();
        expect(Math.max(result.series.homeWins, result.series.awayWins)).toBe(
          4
        );
        expect(result.series.games.length).toBeLessThanOrEqual(7);
      }

      // Round 1, the semifinal, the Conference Finals and the Finals.
      expect(played).toBe(4);

      const finals = current.rounds[3].matchups[0];
      expect(finals.winner).not.toBeNull();
      if (finals.winner?.side === "SQUAD") squadTitles += 1;
    }

    // An all-time squad should win most runs and still lose some.
    expect(squadTitles).toBeGreaterThan(0);
    expect(squadTitles).toBeLessThan(runs.length);
  });

  it("is byte-identical when the same run seed is replayed", () => {
    const run = runs[0];
    const data = matchDataFor(buildBracket(run));

    const play = () =>
      JSON.stringify(
        playMatchup(buildBracket(run), "r1-m1", data, "Squad", run.seed)?.series
      );

    expect(play()).toBe(play());
  });
});
