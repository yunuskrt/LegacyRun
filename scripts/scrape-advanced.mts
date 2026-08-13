import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const FIRST_SEASON = 1981;
const LAST_SEASON = 2026;
const RAW_DIR = path.join(process.cwd(), "src", "data", "raw");
const REQUEST_DELAY_MS = 6_000;
const PAGE_TIMEOUT_MS = 60_000;

type TableKind = "regular" | "playoffs";

type TableTarget = {
  tabLabel: string;
  headingId: string;
  preId: string;
};

const TABLES: Record<TableKind, TableTarget> = {
  regular: {
    tabLabel: "Regular Season",
    headingId: "advanced_sh",
    preId: "csv_advanced",
  },
  playoffs: {
    tabLabel: "Playoffs",
    headingId: "advanced_post_sh",
    preId: "csv_advanced_post",
  },
};

const seasonLabel = (seasonYear: number) => {
  const start = String((seasonYear - 1) % 100).padStart(2, "0");
  const end = String(seasonYear % 100).padStart(2, "0");
  return `${start}-${end}`;
};

const csvPath = (seasonYear: number, kind: TableKind) =>
  kind === "playoffs"
    ? path.join(
        RAW_DIR,
        "playoffs",
        `players-${seasonLabel(seasonYear)}-playoffs.csv`
      )
    : path.join(RAW_DIR, "regular", `players-${seasonLabel(seasonYear)}.csv`);

const seasonUrl = (seasonYear: number) =>
  `https://www.basketball-reference.com/leagues/NBA_${seasonYear}_advanced.html`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Share & Export menu is hover-only and closes on scroll, so Playwright's
// actionability checks can never land a real click — dispatch it in-page instead.
const exportTableAsCsv = async (
  page: Page,
  target: TableTarget
): Promise<string> => {
  const csv = await page.evaluate(
    ({ tabLabel, headingId, preId }: TableTarget) => {
      const tab = [
        ...document.querySelectorAll<HTMLAnchorElement>(
          "#all_advanced .filter.switcher a.sr_preset"
        ),
      ].find((a) => a.textContent?.trim() === tabLabel);
      if (!tab)
        return { ok: false as const, reason: `tab "${tabLabel}" not found` };
      tab.click();

      const heading = document.getElementById(headingId);
      if (!heading)
        return { ok: false as const, reason: `#${headingId} not found` };

      const button = [...heading.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "Get table as CSV (for Excel)"
      );
      if (!button)
        return {
          ok: false as const,
          reason: `CSV button not found in #${headingId}`,
        };
      button.click();

      const pre = document.getElementById(preId);
      if (!pre) return { ok: false as const, reason: `#${preId} not produced` };
      return { ok: true as const, text: pre.textContent ?? "" };
    },
    target
  );

  if (!csv.ok) throw new Error(csv.reason);

  // The <pre> opens with a citation preamble; the CSV proper starts at the header row.
  const lines = csv.text.split("\n");
  const headerIndex = lines.findIndex((line) => line.startsWith("Rk,"));
  if (headerIndex === -1) throw new Error(`no header row in #${target.preId}`);

  const body = lines.slice(headerIndex).join("\n").replace(/\s+$/, "");
  if (body.split("\n").length < 2)
    throw new Error(`#${target.preId} has no data rows`);
  return body;
};

const scrapeSeason = async (
  page: Page,
  seasonYear: number,
  pending: TableKind[]
) => {
  await page.goto(seasonUrl(seasonYear), {
    waitUntil: "domcontentloaded",
    timeout: PAGE_TIMEOUT_MS,
  });
  await page.waitForSelector("#all_advanced .filter.switcher a.sr_preset", {
    timeout: PAGE_TIMEOUT_MS,
  });

  for (const kind of pending) {
    const csv = await exportTableAsCsv(page, TABLES[kind]);
    const target = csvPath(seasonYear, kind);
    await writeFile(target, csv, "utf8");
    console.log(
      `  wrote ${path.relative(RAW_DIR, target)} (${csv.split("\n").length - 1} rows)`
    );
  }
};

const parseRange = (): [number, number] => {
  const [first, last] = process.argv.slice(2);
  if (first === undefined) return [FIRST_SEASON, LAST_SEASON];

  const from = Number(first);
  const to = last === undefined ? from : Number(last);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from > to) {
    throw new Error(`invalid season range: ${first} ${last ?? ""}`.trim());
  }
  return [from, to];
};

const main = async () => {
  const [firstSeason, lastSeason] = parseRange();
  await mkdir(path.join(RAW_DIR, "regular"), { recursive: true });
  await mkdir(path.join(RAW_DIR, "playoffs"), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const failures: string[] = [];
  let scrapedSeasons = 0;

  try {
    for (let seasonYear = firstSeason; seasonYear <= lastSeason; seasonYear++) {
      const pending = (["regular", "playoffs"] as const).filter(
        (kind) => !existsSync(csvPath(seasonYear, kind))
      );

      if (pending.length === 0) {
        console.log(
          `${seasonYear} (${seasonLabel(seasonYear)}) — already scraped, skipping`
        );
        continue;
      }

      if (scrapedSeasons > 0) await sleep(REQUEST_DELAY_MS);
      scrapedSeasons++;

      console.log(
        `${seasonYear} (${seasonLabel(seasonYear)}) — fetching ${pending.join(", ")}`
      );
      try {
        await scrapeSeason(page, seasonYear, pending);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  FAILED ${seasonYear}: ${message}`);
        failures.push(`${seasonYear}: ${message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} season(s) failed:`);
    for (const failure of failures) console.error(`  ${failure}`);
    console.error("Rerun to retry — seasons already written are skipped.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nDone. ${scrapedSeasons} season(s) fetched this run.`);
};

await main();
