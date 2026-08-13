# Phase 7 — Scraper Data Load (Raw CSV Export)
 
## Overview
 
Part 1 of 2 in the data-scraping pipeline. This phase scrapes raw season tables from Basketball-Reference and saves them as local CSV files, unparsed. Part 2 (a later phase) will normalize/parse this raw data into the app's schema.
 
## Requirements
 
- Tooling: Playwright MCP
- Source URL pattern: `https://www.basketball-reference.com/leagues/NBA_{season_year}_advanced.html`
- `season_year` ranges from **1981 to 2026** inclusive, incremented by 1, one full pass (steps below) per year.
- `season_year` corresponds to the year the season **ends** (e.g. `season_year=2020` → the 2019–20 season → files named with `start=19, end=20`; `season_year=1982` → the 1981–82 season → `start=81, end=82`).

### Per-season steps
 
For each `season_year` in range:
 
1. Navigate to the season URL.
2. Click the **Regular Season** tab.
3. Hover **Share & Export**.
4. Click **Get table as CSV (for Excel)**.
5. Copy the CSV content.
6. Write it to `@/data/raw/players-{start}-{end}.csv`..
7. Click the **Playoffs** tab.
8. Hover **Share & Export**.
9. Click **Get table as CSV (for Excel)**.
10. Copy the CSV content.
11. Write it to `@/data/raw/players-{start}-{end}-playoffs.csv`.

### Rerun behavior
 
- If a target CSV file already exists for a given `season_year`, skip re-scraping it (script should be safely rerunnable without re-fetching everything).

### Rate limiting
 
- Add a delay between each season's requests to avoid hammering the site (align with Phase 5's existing rate-limit/robots.txt discipline if this phase is merged with it).

### Post-scrape validation
 
- After all CSVs are written, run a Python script that:
- Loads every CSV in `@/data/raw`.
- Compares column headers across all regular-season files (and separately across all playoff files).
- Reports any file whose headers differ from the rest, naming the file and the mismatched columns.
- Exits non-zero if any mismatch is found, so it can gate the next phase.

## Output
 
- Raw, unparsed CSV files in `@/data/raw`, one regular-season and one playoffs file per `season_year`.
- A header-consistency report from the validation script.
- No writes to Neon in this phase — that happens in normalization (later phase).

## References
 
- `src/data/raw`