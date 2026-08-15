# Phase 8 — Data Normalization & Player Rating Engine

## Overview

Construction of player ratings normalized in scale 0-100 (both included) for each season

## Requirements

- Create a new file : `@src/data/rating/season_players.ts`
- File includes an array of the below field table
- Do not touch json files under `@src/data/parsed`
- Do not use `@src/data/parsed/flattened_players.json` Use `@src/data/parsed/season_players.json` file as data source
- Add only `Rating` field and make it typescript
- Use documentation of player rating engine `@context/docs/player-rating-normalization.md` as reference to construction of ratings in scale 0-100

| Field                        | Type           | Notes                                                                                   |
| ---------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `Season`                     | string         | Season in `YYYY-YYYY` format. 46 keys, from `1980-1981` to `2025-2026`.                 |
| `Rank`                       | number         | Basketball-Reference row rank within the season.                                        |
| `PlayerName`                 | string         | Player's name.                                                                          |
| `Age`                        | number         | Player's age on January 31 of that season.                                              |
| `TeamSlug`                   | string[]       | Array for the 2,284 mid-season-traded player-seasons, in the order the raw rows appear. |
| `Position`                   | string         | Player position, e.g. `C`, `PG`, `SG`.                                                  |
| `GamesPlayed`                | number         | Number of games played.                                                                 |
| `MinutesPlayed`              | number         | Total minutes played.                                                                   |
| `PlayerEfficiencyRating`     | number \| null | Player Efficiency Rating (PER).                                                         |
| `BoxPlusMinus`               | number \| null | Box Plus/Minus (BPM).                                                                   |
| `ValueOverReplacementPlayer` | number \| null | Value Over Replacement Player (VORP).                                                   |
| `WinSharesPer48Min`          | number \| null | Win Shares per 48 minutes (WS/48).                                                      |
| `PlayerSlug`                 | string         | Canonical identity key, unique within each season's array.                              |

## Field Mapping

| JSON Field ('season_players.json') | CSV Field           | Type           |
| ---------------------------------- | ------------------- | -------------- |
| `Rank`                             | `Rk`                | number         |
| `PlayerName`                       | `Player`            | string         |
| `Age`                              | `Age`               | number         |
| `TeamSlug`                         | `Team`              | string[]       |
| `Position`                         | `Pos`               | string         |
| `GamesPlayed`                      | `G`                 | number         |
| `MinutesPlayed`                    | `MP`                | number         |
| `PlayerEfficiencyRating`           | `PER`               | number or null |
| `BoxPlusMinus`                     | `BPM`               | number or null |
| `ValueOverReplacementPlayer`       | `VORP`              | number or null |
| `WinSharesPer48Min`                | `WS/48`             | number or null |
| `PlayerSlug`                       | `Player-additional` | string         |

## Notes

- Season column will be added as it exists in `season_players.json` file

## References

- `src/data/parsed/season_players.json`
- `context/docs/player-rating-normalization`
