# Phase 7 — Scraper Data Load (Raw CSV Export)
 
## Overview
 
Part 2 of 2 in the data-scraping pipeline. This phase consists of writing a script to read the csv files in @src/data/raw/regular and write the parsed data in 2 files.
 
## Fields to be Parsed

| CSV Field | Description | Output Field | Type |
|---|---|---|---|
| `Rk` | Rank | `Rank` | number |
| `Player` | Player name | `PlayerName` | string |
| `Age` | Player's age on Jan 31 of the season | `Age` | number |
| `Team` | Team abbreviation | `TeamSlug` | string |
| `Pos` | Position | `Position` | string |
| `G` | Games played | `GamesPlayed` | number |
| `MP` | Minutes played | `MinutesPlayed` | number |
| `PER` | Player Efficiency Rating — per-minute production standardized to a league average of 15 | `PlayerEfficiencyRating` | float |
| `BPM` | Box Plus/Minus — points per 100 possessions contributed above a league-average player | `BoxPlusMinus` | float |
| `VORP` | Value Over Replacement Player — points per 100 team possessions above a replacement-level (-2.0) player, prorated to an 82-game season | `ValueOverReplacementPlayer` | float |
| `WS/48` | Win Shares per 48 minutes (league average ≈ .100) | `WinSharesPer48Min` | float |
| `Player-additional` | Player slug (unique player identifier) | `PlayerSlug` | string |
 
`PlayerSlug` is the canonical identity key — it's what the duplicate-player rule (one player per run, normalized across all their seasons) will key off of downstream

### Parsing rules

- Skip any repeated header rows embedded in the CSV body (Basketball-Reference re-inserts the header row roughly every 20 data rows in its export).
- Empty/blank numeric cells → `null` in the output (not `0`, not omitted).
- **Traded players:** a player traded mid-season has multiple rows in the raw CSV — one combined-total row (`Tm` = `2TM`, `3TM`, etc.) followed by one row per individual team. Parse all stat fields from the combined-total row (the uppermost row). The `Team` field is the exception: instead of the total row's `Tm` value, set it to an array of the team abbreviations pulled from the individual team rows, in the order they appear.

  Example — for the CSV rows below, all stats come from the `2TM` row, but `Team` is `["PHO", "NYK"]`:
Ex:
432,Cezary Trybański,24,2TM,C,7,0,15,-12.1,.102,.000,.500,0.0,7.6,3.8,0.0,3.6,5.0,29.1,21.0,-0.1,0.0,-0.1,-0.396,-20.9,-1.4,-22.3,-0.1,,trybace01
432,Cezary Trybański,24,PHO,C,4,0,10,-14.8,.000,.000,.000,0.0,11.5,5.7,0.0,0.0,7.4,50.0,18.1,-0.1,0.0,-0.1,-0.480,-22.8,-2.9,-25.7,0.0,,trybace01
432,Cezary Trybański,24,NYK,C,3,0,5,-6.6,.174,.000,1.000,0.0,0.0,0.0,0.0,10.7,0.0,0.0,26.7,0.0,0.0,0.0,-0.228,-17.1,1.7,-15.5,0.0,,trybace01

## Output Files

### `src/data/parsed/season_players.json`

Keys are season strings, values are arrays of parsed player objects for that season (fields as above). Each player object must also include a `Season` field matching its key, so season identity survives later when flattened.

Each season's array must contain exactly one object per `PlayerSlug` (equivalently, per `Rank`, since `Rank` repeats across a traded player's split rows) — the traded-player rule above is what collapses the multiple raw rows into that single object.

```json
{
  "2017-2018": [
    { "Season": "2017-2018", "PlayerSlug": "jamesle01", "PlayerName": "LeBron James", "...": "..." }
  ],
  "2018-2019": [ "..." ]
}
```

### `src/data/parsed/flattened_players.json`

A single merged array of every player object across all seasons in `season_players.json`. The `Season` field is intentionally dropped during flattening — this is expected, not a bug. Not used in rating normalization — this file exists for the later ETL ingestion into Neon.

## Requirements
 
- Language: Python (matches the header-validation script from the scraper phase).
- Read every CSV in `src/data/raw/regular` not `src/data/raw/playoffs`
- Validate that every field in the "Fields to Parse" table actually exists in each source CSV before parsing; fail loudly (name the file and missing column) if not.
- Script should be safely rerunnable — overwrite `season_players.json` / `flattened_players.json` on each run rather than appending.

## References
 
- `src/data/raw/regular`
- `src/data/parsed`
