# Team Logos

Where the files go, what to name them, and which franchise each one is.

## The rule

```
public/logos/<slug>.png
```

`<slug>` is the **Basketball-Reference code exactly as it appears in
`src/data/db/team.ts`** — uppercase, three letters. `LAL.png`, `WSB.png`, `CHO.png`.

Nothing else needs changing: `teamLogoPath()` in `src/lib/team-logo.ts` is the only
place the convention is written, and it already produces this path.

> **Uppercase is not optional.** macOS filesystems are case-insensitive, so
> `lal.png` works locally and 404s on Vercel's Linux build. Name them uppercase
> from the start.

## File spec

| | |
| --- | --- |
| Format | PNG with transparency |
| Size | 256×256 (rendered at 56×56 in `TeamLogoBadge`, `object-contain` with padding) |
| Background | Transparent — the badge supplies its own tinted panel |
| Shape | Square canvas; center the mark and let it breathe |

Missing files are not fatal: `TeamLogoBadge` catches `onError` and falls back to
the team's initials. Expect a console 404 per missing logo until the set is complete.

## The 40 files

**Priority column:** ★ = appears in the draft pool and brackets. The three teams
marked — never made the playoffs in 1981–2026, so they can only ever be seen if
something outside the draft renders the full team list.

| # | Filename | Franchise | Conf | ★ | Playoff seasons | Notes |
| --: | --- | --- | --- | :-: | --- | --- |
| 1 | `ATL.png` | Atlanta Hawks | EAST | ★ | 29 (1982–2026) | |
| 2 | `BOS.png` | Boston Celtics | EAST | ★ | 36 (1981–2026) | |
| 3 | `BRK.png` | Brooklyn Nets | EAST | ★ | 8 (2013–2023) | **≠ `NJN`** |
| 4 | `CHA.png` | Charlotte Bobcats | EAST | ★ | 2 (2010–2014) | Bobcats era logo |
| 5 | `CHH.png` | Charlotte Hornets | EAST | ★ | 7 (1993–2002) | **Original teal Hornets** |
| 6 | `CHI.png` | Chicago Bulls | EAST | ★ | 27 (1981–2022) | |
| 7 | `CHO.png` | Charlotte Hornets | EAST | ★ | 1 (2016) | **Modern Hornets, 2015–** |
| 8 | `CLE.png` | Cleveland Cavaliers | EAST | ★ | 23 (1985–2026) | |
| 9 | `DAL.png` | Dallas Mavericks | WEST | ★ | 25 (1984–2024) | |
| 10 | `DEN.png` | Denver Nuggets | WEST | ★ | 29 (1982–2026) | |
| 11 | `DET.png` | Detroit Pistons | EAST | ★ | 25 (1984–2026) | |
| 12 | `GSW.png` | Golden State Warriors | WEST | ★ | 16 (1987–2025) | |
| 13 | `HOU.png` | Houston Rockets | WEST | ★ | 31 (1981–2026) | |
| 14 | `IND.png` | Indiana Pacers | EAST | ★ | 29 (1981–2025) | |
| 15 | `KCK.png` | Kansas City Kings | WEST | ★ | 2 (1981–1984) | **≠ `SAC`** |
| 16 | `LAC.png` | Los Angeles Clippers | WEST | ★ | 16 (1992–2025) | |
| 17 | `LAL.png` | Los Angeles Lakers | WEST | ★ | 37 (1981–2026) | |
| 18 | `MEM.png` | Memphis Grizzlies | WEST | ★ | 14 (2004–2025) | **≠ `VAN`** |
| 19 | `MIA.png` | Miami Heat | EAST | ★ | 26 (1992–2025) | |
| 20 | `MIL.png` | Milwaukee Bucks | EAST | ★ | 29 (1981–2025) | |
| 21 | `MIN.png` | Minnesota Timberwolves | WEST | ★ | 14 (1997–2026) | |
| 22 | `NJN.png` | New Jersey Nets | EAST | ★ | 15 (1982–2007) | **≠ `BRK`** |
| 23 | `NOH.png` | New Orleans Hornets | WEST | ★ | 5 (2003–2011) | Hornets-branded NO |
| 24 | `NOK.png` | New Orleans/Oklahoma City Hornets | WEST | — | none | Katrina years, 2006–07 only |
| 25 | `NOP.png` | New Orleans Pelicans | WEST | ★ | 4 (2015–2024) | **≠ `NOH`** |
| 26 | `NYK.png` | New York Knicks | EAST | ★ | 26 (1981–2026) | |
| 27 | `OKC.png` | Oklahoma City Thunder | WEST | ★ | 13 (2010–2026) | **≠ `SEA`** |
| 28 | `ORL.png` | Orlando Magic | EAST | ★ | 19 (1994–2026) | |
| 29 | `PHI.png` | Philadelphia 76ers | EAST | ★ | 28 (1981–2026) | |
| 30 | `PHO.png` | Phoenix Suns | WEST | ★ | 29 (1981–2026) | Note: `PHO`, not `PHX` |
| 31 | `POR.png` | Portland Trail Blazers | WEST | ★ | 34 (1981–2026) | |
| 32 | `SAC.png` | Sacramento Kings | WEST | ★ | 11 (1986–2023) | **≠ `KCK`** |
| 33 | `SAS.png` | San Antonio Spurs | WEST | ★ | 36 (1981–2026) | |
| 34 | `SDC.png` | San Diego Clippers | WEST | — | none | 1981–84 only |
| 35 | `SEA.png` | Seattle SuperSonics | WEST | ★ | 17 (1982–2005) | **≠ `OKC`** |
| 36 | `TOR.png` | Toronto Raptors | EAST | ★ | 14 (2000–2026) | |
| 37 | `UTA.png` | Utah Jazz | WEST | ★ | 31 (1984–2022) | |
| 38 | `VAN.png` | Vancouver Grizzlies | WEST | — | none | 1996–2001 only |
| 39 | `WAS.png` | Washington Wizards | EAST | ★ | 9 (2005–2021) | **≠ `WSB`** |
| 40 | `WSB.png` | Washington Bullets | EAST | ★ | 7 (1982–1997) | Bullets-era logo |

**37 of 40 can appear in gameplay.** `NOK`, `SDC` and `VAN` never made the
playoffs in this dataset — safe to skip until something renders all franchises.

## Historical marks, not current ones

Each code is a distinct franchise era with its own identity, and pairs that share
a lineage must **not** share a file:

| Same franchise, different logo |
| --- |
| `SEA` Sonics → `OKC` Thunder |
| `VAN` Grizzlies → `MEM` Grizzlies |
| `WSB` Bullets → `WAS` Wizards |
| `NJN` Nets → `BRK` Nets |
| `KCK` Kings → `SAC` Kings |
| `SDC` Clippers → `LAC` Clippers |
| `NOH` Hornets → `NOK` → `NOP` Pelicans |
| `CHH` Hornets → `CHA` Bobcats → `CHO` Hornets |

`CHH` and `CHO` are both literally named "Charlotte Hornets" in `team.ts` — the
name is not unique, only the slug is. Give them the teal 1988–2002 mark and the
modern 2015– mark respectively, or the two eras become indistinguishable in the UI.

Within a single code, seasons span decades and logos changed (the Bulls of 1981 and
2022 share `CHI.png`). **One logo per code is the accepted simplification** — a
per-season logo would need a new table.

## Checklist

1. Export 40 PNGs at 256×256 with transparent backgrounds.
2. Name each one `<CODE>.png`, uppercase, matching the table above.
3. Drop them all in `public/logos/`.
4. Load `/play/draft` and confirm zero `/logos/*.png` 404s in the console.

`public/logos/` already exists and is empty. No code changes are required.
