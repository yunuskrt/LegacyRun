import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CONFIG = readFileSync(join(ROOT, "next.config.ts"), "utf8");

const WHY_IT_MATTERS = [
  "`next.config.ts` must keep `images: { unoptimized: true }`.",
  "The image optimizer pulls `sharp` into the server process, and once it is there",
  "every `next/og` render fails with `Input buffer contains unsupported image format`",
  "until the process restarts — so the share card silently breaks in production.",
  "See the Shareable Run Card entry in context/current-feature.md.",
].join(" ");

const sourceFiles = (dir: string): string[] =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"))
    .filter((entry) => !entry.endsWith(".test.ts"))
    .map((entry) => readFileSync(join(ROOT, dir, entry), "utf8"));

describe("next.config.ts image optimization", () => {
  it("disables the image optimizer", () => {
    const disabled = /images\s*:\s*\{[^}]*\bunoptimized\s*:\s*true\b/.test(
      CONFIG
    );

    expect(disabled, WHY_IT_MATTERS).toBe(true);
  });

  // Without both halves of the conflict in the tree the guard above is cargo cult.
  it("still has both sides of the conflict it guards", () => {
    const sources = sourceFiles("src");

    expect(
      sources.some((source) => source.includes('from "next/og"')),
      "No `next/og` consumer left — re-check whether the guard above is still needed."
    ).toBe(true);
    expect(
      sources.some((source) => source.includes('from "next/image"')),
      "No `next/image` consumer left — re-check whether the guard above is still needed."
    ).toBe(true);
  });
});
