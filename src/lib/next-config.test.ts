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

const WHY_TRACING_MATTERS = [
  "`next.config.ts` must trace `public/logos` into the share-card function.",
  "The route reads the crests off disk, and `public/` is not included in a",
  "serverless bundle on its own — without this the deployed card renders team",
  "initials where every logo should be, with no error anywhere to explain it.",
  "See the Public Deploy Hardening entry in context/current-feature.md.",
].join(" ");

describe("next.config.ts output file tracing", () => {
  it("traces the crests into the share-card function", () => {
    const traced =
      /outputFileTracingIncludes\s*:\s*\{[^}]*["']\/api\/share\/card["']\s*:\s*\[[^\]]*logos/.test(
        CONFIG
      );

    expect(traced, WHY_TRACING_MATTERS).toBe(true);
  });

  // Without a disk read in the tree the trace above is dead weight.
  it("still has the disk read it exists for", () => {
    const source = readFileSync(join(ROOT, "src/lib/share-logos.ts"), "utf8");

    expect(
      source.includes("node:fs/promises"),
      "`share-logos.ts` no longer reads from disk — re-check whether the trace above is still needed."
    ).toBe(true);
  });
});

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
