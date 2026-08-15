import { describe, expect, it } from "vitest";
import { RATED_PLAYER_SEASONS } from "@/data/rating/season_players";

const SEASONS = [...new Set(RATED_PLAYER_SEASONS.map((row) => row.Season))];

const bySeason = new Map<string, typeof RATED_PLAYER_SEASONS>();
for (const row of RATED_PLAYER_SEASONS) {
  const rows = bySeason.get(row.Season);
  if (rows) {
    rows.push(row);
  } else {
    bySeason.set(row.Season, [row]);
  }
}

describe("RATED_PLAYER_SEASONS", () => {
  it("covers all 46 seasons from 1980-1981 to 2025-2026", () => {
    expect(SEASONS).toHaveLength(46);
    expect(SEASONS[0]).toBe("1980-1981");
    expect(SEASONS.at(-1)).toBe("2025-2026");
  });

  it("drops only the three unrateable rows from the 20,263 parsed", () => {
    expect(RATED_PLAYER_SEASONS).toHaveLength(20260);
  });

  it("keeps PlayerSlug unique within each season", () => {
    for (const [season, rows] of bySeason) {
      const slugs = rows.map((row) => row.PlayerSlug);
      expect(new Set(slugs).size, season).toBe(slugs.length);
    }
  });

  it("rates every row as an integer inside the 0-100 band", () => {
    for (const row of RATED_PLAYER_SEASONS) {
      expect(Number.isInteger(row.Rating), row.PlayerSlug).toBe(true);
      expect(row.Rating).toBeGreaterThanOrEqual(0);
      expect(row.Rating).toBeLessThanOrEqual(100);
    }
  });

  it("normalizes TeamSlug to a non-empty array on every row", () => {
    for (const row of RATED_PLAYER_SEASONS) {
      expect(Array.isArray(row.TeamSlug), row.PlayerSlug).toBe(true);
      expect(row.TeamSlug.length, row.PlayerSlug).toBeGreaterThan(0);
    }
  });

  it("rates only rows that played minutes and have every metric", () => {
    for (const row of RATED_PLAYER_SEASONS) {
      expect(row.MinutesPlayed, row.PlayerSlug).toBeGreaterThan(0);
      expect(row.PlayerEfficiencyRating).not.toBeNull();
      expect(row.BoxPlusMinus).not.toBeNull();
      expect(row.ValueOverReplacementPlayer).not.toBeNull();
      expect(row.WinSharesPer48Min).not.toBeNull();
    }
  });

  it("holds no season under 200 minutes above the documented ceiling of 68", () => {
    const lowMinute = RATED_PLAYER_SEASONS.filter(
      (row) => row.MinutesPlayed < 200
    );
    expect(lowMinute.length).toBeGreaterThan(0);
    expect(Math.max(...lowMinute.map((row) => row.Rating))).toBe(68);
  });

  it("matches the documented distribution", () => {
    const ratings = RATED_PLAYER_SEASONS.map((row) => row.Rating).sort(
      (a, b) => a - b
    );
    const percentile = (fraction: number) =>
      ratings[
        Math.min(ratings.length - 1, Math.floor(fraction * ratings.length))
      ];

    expect(ratings[0]).toBe(34);
    expect(ratings.at(-1)).toBe(99);
    expect(percentile(0.25)).toBe(52);
    expect(percentile(0.5)).toBe(58);
    expect(percentile(0.75)).toBe(69);
    expect(percentile(0.9)).toBe(79);
    expect(percentile(0.99)).toBe(94);
  });

  it("reproduces the worked 2022-23 example from the rating document", () => {
    const ratingFor = (slug: string) =>
      bySeason.get("2022-2023")?.find((row) => row.PlayerSlug === slug)?.Rating;

    expect(ratingFor("jokicni01")).toBe(98);
    expect(ratingFor("brunsja01")).toBe(87);
    expect(ratingFor("looneke01")).toBe(81);
    expect(ratingFor("zelleco01")).toBe(57);
  });
});
