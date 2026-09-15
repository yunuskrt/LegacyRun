import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

// This file scans for the very imports it describes, so it must skip itself.
const SELF = "src/lib/tsconfig-build.test.ts";

const DATA_IMPORT =
  /["'](?:@\/|\.\.\/src\/)data\/(?:db\/|rating\/season_players)/;

const WHY_IT_MATTERS = [
  "`tsconfig.build.json` must exclude exactly the files that import",
  "`src/data/db`, `src/data/raw` or `src/data/rating/season_players.ts`.",
  "Those are gitignored, so a fresh checkout — Vercel's included — lacks them.",
  "Miss one and `next build` fails on a deploy that passes locally; keep a stale",
  "one and that file silently stops being type checked at all.",
  "See the Untrack the src/data Pipeline Files entry in context/current-feature.md.",
].join(" ");

const sourceFiles = (dir: string): string[] =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter(
      (entry) =>
        entry.endsWith(".ts") ||
        entry.endsWith(".tsx") ||
        entry.endsWith(".mts")
    )
    .map((entry) => `${dir}/${entry}`)
    .filter((path) => path !== SELF);

const importsGitignoredData = (path: string): boolean =>
  DATA_IMPORT.test(readFileSync(join(ROOT, path), "utf8"));

const dataImporters = (): string[] =>
  [...sourceFiles("src"), ...sourceFiles("scripts")]
    .filter(importsGitignoredData)
    .sort();

const excludedFiles = (): string[] => {
  const source = readFileSync(join(ROOT, "tsconfig.build.json"), "utf8");
  const config = JSON.parse(source.replace(/^\s*\/\/.*$/gm, "")) as {
    exclude: string[];
  };

  return config.exclude.filter((entry) => entry !== "node_modules").sort();
};

describe("tsconfig.build.json", () => {
  it("excludes every file that imports the gitignored pipeline data", () => {
    const missing = dataImporters().filter(
      (path) => !excludedFiles().includes(path)
    );

    expect(
      missing,
      `${WHY_IT_MATTERS} Not excluded: ${missing.join(", ")}`
    ).toEqual([]);
  });

  // A stale entry is the quieter half: the file keeps compiling locally while
  // the deployed build never checks it again.
  it("excludes nothing that reads the data any more", () => {
    const stale = excludedFiles().filter(
      (path) => !dataImporters().includes(path)
    );

    expect(
      stale,
      `${WHY_IT_MATTERS} No longer reads the data, so drop it from the exclude list: ${stale.join(", ")}`
    ).toEqual([]);
  });

  // Both comparisons above pass on two empty sets, so the pairing needs a floor.
  it("still has files to guard", () => {
    expect(
      dataImporters().length,
      "Nothing imports the gitignored data any more — re-check whether tsconfig.build.json is still needed."
    ).toBeGreaterThan(0);
  });
});
