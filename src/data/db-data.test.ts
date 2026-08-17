import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PLAYERS } from "@/data/db/player";
import { PLAYER_SEASONS } from "@/data/db/player_season";
import { PLAYER_SEASON_DATA } from "@/data/db/player_season_data";
import { PLAYER_SEASON_TEAMS } from "@/data/db/player_season_team";
import { PLAYOFF_PARTICIPATION } from "@/data/db/playoff_participation";
import { TEAMS } from "@/data/db/team";
import { TEAM_SEASONS } from "@/data/db/team_season";
import type {
  Conference,
  Position,
  PlayoffRound,
} from "@/generated/prisma/enums";
import type { PlayoffParticipationRow } from "@/types/db-data";

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

// Mirrors scripts/build-db-data.mts. Kept as an independent reimplementation so
// a change to the rating engine has to be made deliberately in both places.
const LINEUP_WEIGHTS = [0.32, 0.24, 0.19, 0.14, 0.11];
const RATING_FLOOR = 35;
const RATING_CEILING = 99;
const RATING_STEEPNESS = 1.15;

const PLAYOFF_ROUNDS: PlayoffRound[] = [
  "FIRST_ROUND",
  "CONFERENCE_SEMIS",
  "CONFERENCE_FINALS",
  "NBA_FINALS",
  "CHAMPION",
];

// 12-team brackets — the top two seeds per conference had a first-round bye.
const BYE_SEASONS = new Set([1981, 1982, 1983]);

const playerSlugs = new Set(PLAYERS.map((player) => player.slug));
const teamSlugs = new Set(TEAMS.map((team) => team.slug));
const teamSeasonIds = new Set(TEAM_SEASONS.map((row) => row.id));
const playerSeasonIds = new Set(PLAYER_SEASONS.map((row) => row.id));

// Independent reimplementation of the playoff fold in scripts/build-db-data.mts,
// resolving slugs off the generated team.ts rather than the generator's private
// directory. See context/docs/playoff-participation-derivation.md.
const foldPlayoffCsv = (): PlayoffParticipationRow[] => {
  const slugsByName = new Map<string, string[]>();
  for (const team of TEAMS) {
    const slugs = slugsByName.get(team.name);
    if (slugs) slugs.push(team.slug);
    else slugsByName.set(team.name, [team.slug]);
  }

  const slugOf = (name: string, seasonYear: number): string => {
    if (name === "Charlotte Hornets") return seasonYear <= 2002 ? "CHH" : "CHO";
    const slugs = slugsByName.get(name) ?? [];
    expect(slugs, name).toHaveLength(1);
    return slugs[0];
  };

  const depthOf = (series: string): number => {
    if (series === "Finals") return 4;
    if (series.endsWith("First Round")) return 1;
    if (series.endsWith("Semifinals")) return 2;
    return 3;
  };

  const csv = readFileSync(
    path.join(process.cwd(), "src/data/raw/playoffs/playoff_teams.csv"),
    "utf8"
  );
  const rows = csv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .slice(1)
    .map((line) => line.split(","));

  const folded = new Map<
    string,
    PlayoffParticipationRow & { depth: number; champion: boolean }
  >();

  for (const cells of rows) {
    const seasonYear = Number(cells[0]);
    const series = cells[2];
    const depth = depthOf(series);
    const conference: Conference | null = series.startsWith("Eastern")
      ? "EAST"
      : series.startsWith("Western")
        ? "WEST"
        : null;

    for (const [self, other] of [
      [5, 8],
      [8, 5],
    ]) {
      const match = /^(.+) \((\d+)\)$/.exec(cells[self]);
      expect(match, cells[self]).not.toBeNull();
      const teamSlug = slugOf(match![1], seasonYear);
      const wins = Number(cells[self + 1]);
      const losses = Number(cells[other + 1]);
      const id = `${teamSlug}-${seasonYear}`;
      const entry = folded.get(id);

      if (!entry) {
        folded.set(id, {
          id,
          teamSlug,
          seasonYear,
          conference: conference as Conference,
          seed: Number(match![2]),
          roundReached: "FIRST_ROUND",
          wins,
          losses,
          depth,
          champion: depth === 4 && wins > losses,
        });
        continue;
      }
      if (conference !== null) entry.conference = conference;
      entry.depth = Math.max(entry.depth, depth);
      entry.wins += wins;
      entry.losses += losses;
      entry.champion ||= depth === 4 && wins > losses;
    }
  }

  return [...folded.values()]
    .sort(
      (a, b) =>
        a.seasonYear - b.seasonYear || a.teamSlug.localeCompare(b.teamSlug)
    )
    .map(({ depth, champion, ...row }) => ({
      ...row,
      roundReached: champion ? "CHAMPION" : PLAYOFF_ROUNDS[depth - 1],
    }));
};

describe("generated db data", () => {
  it("has the expected row count per table", () => {
    expect(PLAYERS).toHaveLength(3755);
    expect(TEAMS).toHaveLength(40);
    expect(TEAM_SEASONS).toHaveLength(1292);
    expect(PLAYER_SEASONS).toHaveLength(20260);
    expect(PLAYER_SEASON_TEAMS).toHaveLength(22705);
    expect(PLAYER_SEASON_DATA).toHaveLength(20260);
    expect(PLAYOFF_PARTICIPATION).toHaveLength(724);
  });

  it("keys every table by a unique identifier", () => {
    expect(playerSlugs.size).toBe(PLAYERS.length);
    expect(teamSlugs.size).toBe(TEAMS.length);
    expect(teamSeasonIds.size).toBe(TEAM_SEASONS.length);
    expect(playerSeasonIds.size).toBe(PLAYER_SEASONS.length);
  });
});

describe("player.ts", () => {
  it("gives every player a non-empty name", () => {
    const unnamed = PLAYERS.filter((player) => player.fullName.trim() === "");
    expect(unnamed).toEqual([]);
  });
});

describe("team.ts", () => {
  it("assigns every team a name and a valid conference", () => {
    for (const team of TEAMS) {
      expect(team.name, team.slug).not.toBe("");
      expect(["EAST", "WEST"], team.slug).toContain(team.conference);
    }
  });

  it("keeps relocated franchises as separate rows", () => {
    for (const slug of ["SEA", "OKC", "VAN", "MEM", "WSB", "WAS"])
      expect(teamSlugs, slug).toContain(slug);
    expect(TEAMS.find((team) => team.slug === "SEA")?.name).toBe(
      "Seattle SuperSonics"
    );
  });
});

describe("team_season.ts", () => {
  it("derives id from teamSlug and seasonYear", () => {
    for (const row of TEAM_SEASONS)
      expect(row.id).toBe(`${row.teamSlug}-${row.seasonYear}`);
  });

  it("references a known team", () => {
    for (const row of TEAM_SEASONS)
      expect(teamSlugs, row.id).toContain(row.teamSlug);
  });

  it("rates every team-season as an integer inside the band", () => {
    for (const row of TEAM_SEASONS) {
      expect(Number.isInteger(row.rating), row.id).toBe(true);
      expect(row.rating, row.id).toBeGreaterThanOrEqual(RATING_FLOOR);
      expect(row.rating, row.id).toBeLessThanOrEqual(RATING_CEILING);
    }
  });

  it("spans the band instead of clustering, and reaches the elite tier", () => {
    const ratings = TEAM_SEASONS.map((row) => row.rating);
    const elite = ratings.filter((rating) => rating >= 90);
    expect(elite.length).toBeGreaterThan(0);
    expect(Math.max(...ratings) - Math.min(...ratings)).toBeGreaterThan(50);
  });

  it("derives every rating from five distinct players, filling absent positions", () => {
    const seasonsById = new Map(PLAYER_SEASONS.map((row) => [row.id, row]));
    const rosters = new Map<string, typeof PLAYER_SEASONS>();
    for (const link of PLAYER_SEASON_TEAMS) {
      const player = seasonsById.get(link.playerSeasonId);
      if (!player)
        throw new Error(`unknown player-season ${link.playerSeasonId}`);
      const roster = rosters.get(link.teamSeasonId);
      if (roster) roster.push(player);
      else rosters.set(link.teamSeasonId, [player]);
    }

    const raw = TEAM_SEASONS.map((row) => {
      const ranked = [...(rosters.get(row.id) ?? [])].sort(
        (a, b) =>
          b.rating - a.rating || a.playerSlug.localeCompare(b.playerSlug)
      );
      const used = new Set<string>();
      const lineup: number[] = [];
      for (const position of POSITIONS) {
        const best = ranked.find(
          (player) =>
            player.position === position && !used.has(player.playerSlug)
        );
        if (best) {
          lineup.push(best.rating);
          used.add(best.playerSlug);
        }
      }
      for (const player of ranked) {
        if (lineup.length === 5) break;
        if (used.has(player.playerSlug)) continue;
        lineup.push(player.rating);
        used.add(player.playerSlug);
      }
      expect(lineup, row.id).toHaveLength(5);
      return lineup
        .sort((a, b) => b - a)
        .reduce(
          (sum, rating, index) => sum + rating * LINEUP_WEIGHTS[index],
          0
        );
    });

    const mean = raw.reduce((sum, value) => sum + value, 0) / raw.length;
    const deviation = Math.sqrt(
      raw.reduce((sum, value) => sum + (value - mean) ** 2, 0) / raw.length
    );

    TEAM_SEASONS.forEach((row, index) => {
      const z = (raw[index] - mean) / deviation;
      const expected = Math.round(
        RATING_FLOOR +
          (RATING_CEILING - RATING_FLOOR) /
            (1 + Math.exp(-RATING_STEEPNESS * z))
      );
      expect(row.rating, row.id).toBe(expected);
    });
  });

  it("covers the two rosters with no listed SF", () => {
    for (const id of ["LAL-2020", "MEM-2025"])
      expect(teamSeasonIds).toContain(id);
  });
});

describe("player_season.ts", () => {
  it("derives id from playerSlug and seasonYear", () => {
    for (const row of PLAYER_SEASONS)
      expect(row.id).toBe(`${row.playerSlug}-${row.seasonYear}`);
  });

  it("references a known player", () => {
    for (const row of PLAYER_SEASONS)
      expect(playerSlugs, row.id).toContain(row.playerSlug);
  });

  it("assigns only Position enum values", () => {
    const offenders = PLAYER_SEASONS.filter(
      (row) => !POSITIONS.includes(row.position)
    ).map((row) => `${row.id}:${row.position}`);
    expect(offenders).toEqual([]);
  });

  it("never repeats a player within one season", () => {
    const seen = new Set<string>();
    for (const row of PLAYER_SEASONS) {
      const key = `${row.seasonYear}:${row.playerSlug}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});

describe("player_season_team.ts", () => {
  it("resolves both sides of every join row", () => {
    for (const row of PLAYER_SEASON_TEAMS) {
      expect(playerSeasonIds, row.playerSeasonId).toContain(row.playerSeasonId);
      expect(teamSeasonIds, row.teamSeasonId).toContain(row.teamSeasonId);
    }
  });

  it("keeps each player-season/team-season pair unique", () => {
    const pairs = new Set(
      PLAYER_SEASON_TEAMS.map(
        (row) => `${row.playerSeasonId}|${row.teamSeasonId}`
      )
    );
    expect(pairs.size).toBe(PLAYER_SEASON_TEAMS.length);
  });

  it("links every player-season to at least one team-season", () => {
    const linked = new Set(
      PLAYER_SEASON_TEAMS.map((row) => row.playerSeasonId)
    );
    expect(linked.size).toBe(PLAYER_SEASONS.length);
  });

  it("has more rows than player-seasons, because traded players repeat", () => {
    expect(PLAYER_SEASON_TEAMS.length).toBeGreaterThan(PLAYER_SEASONS.length);
  });
});

describe("player_season_data.ts", () => {
  it("holds exactly one audit row per player-season", () => {
    const ids = new Set(PLAYER_SEASON_DATA.map((row) => row.playerSeasonId));
    expect(ids.size).toBe(PLAYER_SEASON_DATA.length);
    for (const row of PLAYER_SEASON_DATA)
      expect(playerSeasonIds, row.playerSeasonId).toContain(row.playerSeasonId);
  });

  it("always carries rank, games and minutes", () => {
    for (const row of PLAYER_SEASON_DATA) {
      expect(Number.isInteger(row.rank), row.playerSeasonId).toBe(true);
      expect(Number.isInteger(row.gamesPlayed), row.playerSeasonId).toBe(true);
      expect(Number.isInteger(row.minutesPlayed), row.playerSeasonId).toBe(
        true
      );
    }
  });
});

describe("playoff_participation.ts", () => {
  it("derives id from teamSlug and seasonYear", () => {
    for (const row of PLAYOFF_PARTICIPATION)
      expect(row.id).toBe(`${row.teamSlug}-${row.seasonYear}`);
  });

  it("resolves to a team-season that exists", () => {
    for (const row of PLAYOFF_PARTICIPATION) {
      expect(teamSlugs, row.id).toContain(row.teamSlug);
      expect(teamSeasonIds, row.id).toContain(row.id);
    }
  });

  it("stays inside the enums and the legal seed range", () => {
    for (const row of PLAYOFF_PARTICIPATION) {
      expect(["EAST", "WEST"], row.id).toContain(row.conference);
      expect(PLAYOFF_ROUNDS, row.id).toContain(row.roundReached);
      expect(row.seed, row.id).toBeGreaterThanOrEqual(1);
      expect(row.seed, row.id).toBeLessThanOrEqual(8);
      expect(row.wins, row.id).toBeGreaterThanOrEqual(0);
      expect(row.losses, row.id).toBeGreaterThanOrEqual(0);
    }
  });

  it("fields a full bracket every season, with 12 teams in the bye era", () => {
    const bySeason = new Map<number, number>();
    for (const row of PLAYOFF_PARTICIPATION)
      bySeason.set(row.seasonYear, (bySeason.get(row.seasonYear) ?? 0) + 1);

    expect(bySeason.size).toBe(46);
    for (const [seasonYear, count] of bySeason)
      expect(count, String(seasonYear)).toBe(
        BYE_SEASONS.has(seasonYear) ? 12 : 16
      );
  });

  it("crowns exactly one champion per season", () => {
    const champions = PLAYOFF_PARTICIPATION.filter(
      (row) => row.roundReached === "CHAMPION"
    );
    expect(champions).toHaveLength(46);
    expect(new Set(champions.map((row) => row.seasonYear)).size).toBe(46);
    for (const champion of champions)
      expect(champion.wins, champion.id).toBeGreaterThan(champion.losses);
  });

  it("records the season's conference, not the franchise's current one", () => {
    // NOH played the East in 2003-2004 and the West from 2005; team.ts lists WEST.
    expect(TEAMS.find((team) => team.slug === "NOH")?.conference).toBe("WEST");
    for (const seasonYear of [2003, 2004])
      expect(
        PLAYOFF_PARTICIPATION.find((row) => row.id === `NOH-${seasonYear}`)
          ?.conference
      ).toBe("EAST");
  });

  it("splits Charlotte's two Hornets codes by era", () => {
    const hornets = PLAYOFF_PARTICIPATION.filter((row) =>
      ["CHH", "CHO"].includes(row.teamSlug)
    );
    for (const row of hornets)
      expect(row.teamSlug, row.id).toBe(row.seasonYear <= 2002 ? "CHH" : "CHO");
    expect(hornets.length).toBeGreaterThan(0);
  });

  it("gives bye-era top seeds no first round to lose", () => {
    // 1981 PHO was the 1 seed in the West and entered at the Semifinals.
    const suns = PLAYOFF_PARTICIPATION.find((row) => row.id === "PHO-1981");
    expect(suns).toEqual({
      id: "PHO-1981",
      teamSlug: "PHO",
      seasonYear: 1981,
      conference: "WEST",
      seed: 1,
      roundReached: "CONFERENCE_SEMIS",
      wins: 3,
      losses: 4,
    });
  });

  it("matches an independent fold of the source CSV", () => {
    expect(foldPlayoffCsv()).toEqual(PLAYOFF_PARTICIPATION);
  });
});
