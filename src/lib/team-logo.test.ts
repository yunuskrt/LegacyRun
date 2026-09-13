import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEAMS } from "@/data/db/team";
import { TEAM_SLUG_PATTERN, teamLogoPath } from "@/lib/team-logo";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("teamLogoPath", () => {
  it("builds the one path the crests are served and read from", () => {
    expect(teamLogoPath("CHI")).toBe("/logos/CHI.png");
  });
});

describe("TEAM_SLUG_PATTERN", () => {
  it("accepts the shapes real slugs take", () => {
    for (const slug of ["CHI", "LAL", "BRK", "PHO", "NOP"]) {
      expect(TEAM_SLUG_PATTERN.test(slug), slug).toBe(true);
    }
  });

  // The slug is interpolated into a filesystem path, so the pattern is what
  // stands between a payload and the rest of the disk.
  it("rejects anything that could leave the logo directory", () => {
    const hostile = [
      "../../etc/passwd",
      "CHI/../secret",
      "/etc/passwd",
      "CHI.png",
      "chi",
      "C",
      "",
      "TOOLONGSLUG",
      "CHI\nLAL",
    ];

    for (const slug of hostile) {
      expect(TEAM_SLUG_PATTERN.test(slug), `${slug} was accepted`).toBe(false);
    }
  });

  // A real slug the pattern rejects loses its crest with no error anywhere —
  // `loadShareLogos` answers null and the card quietly draws initials instead.
  it("accepts every slug the real data carries", () => {
    const rejected = TEAMS.filter((team) => !TEAM_SLUG_PATTERN.test(team.slug));

    expect(
      rejected.map((team) => team.slug),
      "these slugs would render as initials on every share card"
    ).toEqual([]);
  });
});

// The share card reads these off disk, so a slug with no file behind it is a
// missing crest rather than a failed request that something would notice.
describe("the crests on disk", () => {
  it("has a file for every team in the data", () => {
    const missing = TEAMS.filter(
      (team) => !existsSync(join(PUBLIC_DIR, teamLogoPath(team.slug)))
    );

    expect(
      missing.map((team) => team.slug),
      "no crest file under public/logos for these teams"
    ).toEqual([]);
  });

  it("covers the whole league rather than a sample", () => {
    expect(TEAMS.length).toBe(40);
  });
});
