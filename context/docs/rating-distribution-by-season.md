# Rating Distribution by Season

Every rated player-season in `src/data/rating/season_players.ts`, broken down by season.
Ratings come from the engine specified in `player-rating-normalization.md`; this document
only reports its output.

**Reading the bands.** Each band is lower-bound inclusive and upper-bound exclusive —
`70-80` means 70 ≤ rating < 80. The top band is `90-100` inclusive of 100, though no
season has ever produced one. Bands below 40 are listed only where players land in them.

**Reading the bottom tens.** They are *not* mostly no-minute call-ups, which is the
counter-intuitive part. Pooled across all 46 seasons the bottom tens carry a median of 631
minutes and only 11% fall under 200; one played 2,605. The reliability shrinkage is what
causes this — a tiny sample gets pulled toward the replacement-level prior, which lands it
near 52 and therefore *above* the floor. Reaching the bottom ten takes enough minutes to
prove the bad rate is real. Read `MP` alongside the rating: a low rating on 2,000 minutes
is a genuinely poor season, while a low rating on 40 minutes mostly means unproven.

**Columns.** `G` games, `MP` total minutes, `PER` player efficiency rating, `BPM` box
plus/minus, `VORP` value over replacement player, `WS/48` win shares per 48 minutes.
Where a player was traded mid-season, every team he appeared for is listed and the stats
are his combined totals.

Regenerate after any change to the rating constants.

---

## League-wide totals

20260 rated player-seasons across 46 seasons · mean 61.1 · median 58 · range 34–99

- **Rating 90-100:** 539 players (2.7%)
- **Rating 80-90:** 1434 players (7.1%)
- **Rating 70-80:** 2850 players (14.1%)
- **Rating 60-70:** 4565 players (22.5%)
- **Rating 50-60:** 7950 players (39.2%)
- **Rating 40-50:** 2877 players (14.2%)
- **Rating 30-40:** 45 players (0.2%)

### Season summary

| Season | Rated | Qualified | Mean | Median | Min | Max | 90+ | 80+ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1980-1981 | 304 | 241 | 61.9 | 60 | 37 | 96 | 9 | 35 |
| 1981-1982 | 316 | 248 | 62.0 | 59 | 39 | 96 | 13 | 34 |
| 1982-1983 | 316 | 251 | 62.2 | 59 | 39 | 96 | 9 | 43 |
| 1983-1984 | 310 | 239 | 61.9 | 59 | 42 | 97 | 9 | 37 |
| 1984-1985 | 320 | 248 | 62.0 | 60 | 36 | 97 | 8 | 35 |
| 1985-1986 | 325 | 247 | 61.8 | 59 | 38 | 97 | 11 | 31 |
| 1986-1987 | 335 | 248 | 61.3 | 58 | 40 | 98 | 12 | 36 |
| 1987-1988 | 332 | 248 | 61.4 | 59 | 40 | 99 | 9 | 39 |
| 1988-1989 | 353 | 263 | 61.8 | 58 | 41 | 99 | 8 | 40 |
| 1989-1990 | 381 | 282 | 61.5 | 59 | 42 | 98 | 13 | 33 |
| 1990-1991 | 387 | 286 | 61.6 | 58 | 40 | 98 | 13 | 38 |
| 1991-1992 | 386 | 287 | 61.5 | 59 | 39 | 98 | 13 | 37 |
| 1992-1993 | 390 | 290 | 61.8 | 59 | 40 | 98 | 9 | 47 |
| 1993-1994 | 403 | 286 | 61.0 | 58 | 38 | 99 | 12 | 36 |
| 1994-1995 | 407 | 303 | 61.5 | 58 | 42 | 98 | 13 | 38 |
| 1995-1996 | 429 | 322 | 61.8 | 59 | 36 | 98 | 12 | 47 |
| 1996-1997 | 441 | 312 | 61.1 | 58 | 37 | 97 | 15 | 44 |
| 1997-1998 | 439 | 311 | 61.3 | 58 | 37 | 96 | 9 | 52 |
| 1998-1999 | 440 | 265 | 58.9 | 55 | 36 | 95 | 10 | 32 |
| 1999-2000 | 439 | 312 | 61.0 | 58 | 34 | 98 | 12 | 40 |
| 2000-2001 | 441 | 318 | 61.3 | 59 | 41 | 96 | 15 | 48 |
| 2001-2002 | 440 | 317 | 61.3 | 59 | 39 | 97 | 12 | 45 |
| 2002-2003 | 428 | 313 | 61.5 | 59 | 40 | 98 | 11 | 47 |
| 2003-2004 | 442 | 325 | 61.4 | 58 | 39 | 98 | 10 | 49 |
| 2004-2005 | 464 | 336 | 61.1 | 58 | 41 | 97 | 17 | 46 |
| 2005-2006 | 457 | 323 | 61.0 | 58 | 40 | 97 | 17 | 44 |
| 2006-2007 | 458 | 328 | 61.0 | 59 | 37 | 97 | 15 | 47 |
| 2007-2008 | 451 | 324 | 61.4 | 58 | 40 | 97 | 10 | 50 |
| 2008-2009 | 445 | 329 | 61.5 | 59 | 40 | 99 | 8 | 41 |
| 2009-2010 | 441 | 331 | 61.5 | 59 | 39 | 99 | 11 | 43 |
| 2010-2011 | 452 | 338 | 61.4 | 59 | 38 | 97 | 13 | 48 |
| 2011-2012 | 478 | 331 | 60.7 | 58 | 37 | 98 | 5 | 46 |
| 2012-2013 | 468 | 344 | 61.4 | 60 | 37 | 99 | 11 | 48 |
| 2013-2014 | 482 | 337 | 60.7 | 58 | 39 | 98 | 14 | 43 |
| 2014-2015 | 492 | 366 | 61.3 | 59 | 40 | 98 | 12 | 46 |
| 2015-2016 | 476 | 350 | 61.5 | 60 | 40 | 99 | 10 | 43 |
| 2016-2017 | 486 | 355 | 61.3 | 59 | 41 | 97 | 19 | 42 |
| 2017-2018 | 540 | 353 | 60.6 | 58 | 40 | 97 | 15 | 45 |
| 2018-2019 | 530 | 361 | 60.9 | 58 | 38 | 98 | 15 | 44 |
| 2019-2020 | 529 | 339 | 60.5 | 57 | 38 | 97 | 10 | 41 |
| 2020-2021 | 540 | 362 | 60.6 | 58 | 38 | 98 | 12 | 47 |
| 2021-2022 | 605 | 375 | 59.8 | 56 | 39 | 99 | 15 | 47 |
| 2022-2023 | 539 | 367 | 61.0 | 58 | 35 | 98 | 14 | 50 |
| 2023-2024 | 572 | 360 | 60.4 | 57 | 39 | 98 | 12 | 50 |
| 2024-2025 | 569 | 375 | 60.7 | 58 | 36 | 99 | 9 | 52 |
| 2025-2026 | 582 | 379 | 60.8 | 58 | 38 | 98 | 8 | 47 |

---

## 1980-1981

304 rated player-seasons · 241 qualified (MP ≥ 500) · mean 61.9 · median 60 · range 37–96

- **Rating 90-100:** 9 players (3.0%)
- **Rating 80-90:** 26 players (8.6%)
- **Rating 70-80:** 51 players (16.8%)
- **Rating 60-70:** 70 players (23.0%)
- **Rating 50-60:** 98 players (32.2%)
- **Rating 40-50:** 48 players (15.8%)
- **Rating 30-40:** 2 players (0.7%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **96** | Julius Erving | 30 | PHI | 82 | 2874 | 25.1 | 7.5 | 6.9 | 0.231 |
| **95** | Kareem Abdul-Jabbar | 33 | LAL | 80 | 2976 | 25.5 | 6.1 | 6.1 | 0.230 |
| **93** | Adrian Dantley | 25 | UTA | 80 | 3417 | 24.3 | 4.3 | 5.4 | 0.191 |
| **93** | Marques Johnson | 24 | MIL | 76 | 2542 | 22.0 | 5.6 | 4.9 | 0.211 |
| **93** | Robert Parish | 27 | BOS | 82 | 2298 | 25.2 | 5.4 | 4.3 | 0.228 |
| **93** | Magic Johnson | 21 | LAL | 37 | 1371 | 25.7 | 8.8 | 3.8 | 0.225 |
| **92** | Moses Malone | 25 | HOU | 80 | 3245 | 25.1 | 3.3 | 4.3 | 0.202 |
| **91** | Artis Gilmore | 31 | CHI | 82 | 2832 | 21.7 | 4.3 | 4.5 | 0.208 |
| **90** | Larry Bird | 24 | BOS | 82 | 3239 | 19.9 | 4.3 | 5.2 | 0.160 |
| **89** | Alvan Adams | 26 | PHO | 75 | 2054 | 20.3 | 5.1 | 3.7 | 0.180 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Winford Boynes | 23 | DAL | 44 | 757 | 6.1 | -7.3 | -1.0 | -0.091 |
| **38** | John Duren | 22 | UTA | 40 | 458 | 2.6 | -7.5 | -0.6 | -0.099 |
| **40** | Jim McElroy | 27 | ATL | 54 | 680 | 5.9 | -5.8 | -0.6 | -0.062 |
| **40** | Clifford Ray | 32 | GSW | 66 | 838 | 4.7 | -5.6 | -0.8 | -0.018 |
| **41** | Ron Boone | 34 | UTA | 52 | 1146 | 9.0 | -5.2 | -0.9 | -0.025 |
| **42** | Art Collins | 26 | ATL | 29 | 395 | 4.3 | -5.8 | -0.4 | -0.054 |
| **42** | Billy Reid | 23 | GSW | 59 | 597 | 6.2 | -5.6 | -0.5 | -0.050 |
| **43** | Mike Niles | 25 | PHO | 44 | 231 | 6.7 | -8.8 | -0.5 | -0.062 |
| **43** | Craig Shelton | 23 | ATL | 55 | 586 | 8.8 | -6.5 | -0.7 | -0.002 |
| **43** | Austin Carr | 32 | DAL/WSB | 47 | 657 | 6.2 | -4.7 | -0.6 | -0.029 |

## 1981-1982

316 rated player-seasons · 248 qualified (MP ≥ 500) · mean 62.0 · median 59 · range 39–96

- **Rating 90-100:** 13 players (4.1%)
- **Rating 80-90:** 21 players (6.6%)
- **Rating 70-80:** 46 players (14.6%)
- **Rating 60-70:** 77 players (24.4%)
- **Rating 50-60:** 104 players (32.9%)
- **Rating 40-50:** 53 players (16.8%)
- **Rating 30-40:** 2 players (0.6%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **96** | Magic Johnson | 22 | LAL | 78 | 2991 | 22.9 | 7.2 | 7.0 | 0.207 |
| **96** | Julius Erving | 31 | PHI | 81 | 2789 | 25.9 | 7.7 | 6.8 | 0.229 |
| **95** | Moses Malone | 26 | HOU | 81 | 3398 | 26.8 | 4.5 | 5.5 | 0.218 |
| **95** | Larry Bird | 25 | BOS | 77 | 2923 | 22.6 | 6.6 | 6.4 | 0.205 |
| **93** | Adrian Dantley | 26 | UTA | 81 | 3222 | 24.2 | 4.1 | 5.0 | 0.187 |
| **92** | Sidney Moncrief | 24 | MIL | 80 | 2980 | 20.1 | 4.8 | 5.1 | 0.216 |
| **92** | Gus Williams | 28 | SEA | 80 | 2876 | 21.8 | 5.1 | 5.2 | 0.171 |
| **92** | Artis Gilmore | 32 | CHI | 82 | 2796 | 22.4 | 4.3 | 4.4 | 0.208 |
| **92** | Kareem Abdul-Jabbar | 34 | LAL | 76 | 2677 | 23.4 | 5.0 | 4.7 | 0.192 |
| **91** | Jack Sikma | 26 | SEA | 82 | 3049 | 20.6 | 3.9 | 4.5 | 0.199 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Tom LaGarde | 26 | DAL | 47 | 909 | 7.6 | -6.4 | -1.0 | -0.028 |
| **39** | Scott Lloyd | 29 | DAL | 74 | 1047 | 5.9 | -6.3 | -1.1 | -0.004 |
| **40** | John Duren | 23 | UTA | 79 | 1056 | 7.0 | -5.8 | -1.0 | -0.013 |
| **41** | Kevin McKenna | 23 | LAL | 36 | 237 | 2.8 | -8.2 | -0.5 | -0.069 |
| **41** | Armond Hill | 28 | SEA/SDC | 40 | 723 | 5.5 | -5.3 | -0.6 | -0.024 |
| **42** | Richard Washington | 26 | CLE | 18 | 313 | 7.1 | -7.1 | -0.5 | -0.072 |
| **42** | Carl Nicks | 23 | UTA | 80 | 1322 | 10.5 | -5.0 | -1.0 | -0.010 |
| **43** | Larry Demic | 24 | NYK | 48 | 356 | 5.7 | -6.5 | -0.4 | -0.017 |
| **44** | Bill Robinzine | 29 | UTA | 56 | 651 | 11.3 | -6.0 | -0.7 | -0.013 |
| **44** | Cedrick Hordges | 25 | DEN | 77 | 1372 | 10.4 | -5.0 | -1.0 | 0.026 |

## 1982-1983

316 rated player-seasons · 251 qualified (MP ≥ 500) · mean 62.2 · median 59 · range 39–96

- **Rating 90-100:** 9 players (2.8%)
- **Rating 80-90:** 34 players (10.8%)
- **Rating 70-80:** 47 players (14.9%)
- **Rating 60-70:** 67 players (21.2%)
- **Rating 50-60:** 109 players (34.5%)
- **Rating 40-50:** 49 players (15.5%)
- **Rating 30-40:** 1 players (0.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **96** | Larry Bird | 26 | BOS | 79 | 2982 | 24.1 | 7.5 | 7.2 | 0.225 |
| **95** | Magic Johnson | 23 | LAL | 79 | 2907 | 23.0 | 7.2 | 6.8 | 0.207 |
| **94** | Julius Erving | 32 | PHI | 72 | 2421 | 23.1 | 6.5 | 5.2 | 0.217 |
| **93** | Moses Malone | 27 | PHI | 78 | 2922 | 25.1 | 3.7 | 4.2 | 0.248 |
| **93** | Sidney Moncrief | 25 | MIL | 76 | 2710 | 22.6 | 5.4 | 5.1 | 0.233 |
| **92** | Alex English | 29 | DEN | 82 | 2988 | 24.1 | 4.6 | 5.0 | 0.166 |
| **91** | Kareem Abdul-Jabbar | 35 | LAL | 79 | 2554 | 23.6 | 4.5 | 4.2 | 0.205 |
| **91** | Robert Parish | 29 | BOS | 78 | 2459 | 23.0 | 4.3 | 3.9 | 0.211 |
| **90** | Marques Johnson | 26 | MIL | 80 | 2853 | 21.1 | 4.5 | 4.7 | 0.180 |
| **89** | Maurice Cheeks | 26 | PHI | 79 | 2465 | 18.6 | 4.7 | 4.2 | 0.183 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Walker Russell | 22 | DET | 68 | 757 | 5.3 | -6.7 | -0.9 | -0.054 |
| **41** | Eddie Jordan | 28 | LAL | 35 | 333 | 5.2 | -7.0 | -0.5 | -0.113 |
| **44** | Chris Engler | 23 | GSW | 54 | 369 | 5.8 | -7.1 | -0.5 | -0.006 |
| **44** | Corny Thompson | 22 | DAL | 44 | 520 | 6.0 | -5.9 | -0.5 | -0.010 |
| **44** | Sam Lacey | 34 | CLE | 60 | 1232 | 6.5 | -3.9 | -0.6 | -0.004 |
| **44** | Terry Teagle | 22 | HOU | 73 | 1708 | 10.3 | -4.2 | -1.0 | -0.022 |
| **45** | Mark McNamara | 23 | PHI | 36 | 182 | 7.6 | -8.4 | -0.4 | -0.056 |
| **45** | Freeman Williams | 26 | UTA | 18 | 210 | 5.9 | -7.3 | -0.4 | -0.050 |
| **45** | Keith Edmonson | 22 | ATL | 32 | 309 | 6.8 | -5.9 | -0.3 | -0.051 |
| **45** | Mike Evans | 27 | DEN | 42 | 695 | 8.9 | -5.3 | -0.6 | -0.010 |

## 1983-1984

310 rated player-seasons · 239 qualified (MP ≥ 500) · mean 61.9 · median 59 · range 42–97

- **Rating 90-100:** 9 players (2.9%)
- **Rating 80-90:** 28 players (9.0%)
- **Rating 70-80:** 52 players (16.8%)
- **Rating 60-70:** 63 players (20.3%)
- **Rating 50-60:** 104 players (33.5%)
- **Rating 40-50:** 54 players (17.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Larry Bird | 27 | BOS | 79 | 3028 | 24.2 | 7.6 | 7.3 | 0.215 |
| **94** | Adrian Dantley | 28 | UTA | 79 | 2984 | 24.6 | 4.2 | 4.7 | 0.235 |
| **94** | Julius Erving | 33 | PHI | 77 | 2683 | 22.9 | 5.9 | 5.3 | 0.180 |
| **94** | Magic Johnson | 24 | LAL | 67 | 2567 | 22.6 | 6.6 | 5.6 | 0.191 |
| **93** | Bernard King | 27 | NYK | 77 | 2667 | 22.7 | 4.5 | 4.3 | 0.218 |
| **92** | Sidney Moncrief | 26 | MIL | 79 | 3075 | 19.8 | 4.1 | 4.7 | 0.198 |
| **91** | Isiah Thomas | 22 | DET | 82 | 3007 | 20.9 | 4.8 | 5.1 | 0.144 |
| **91** | Kiki Vandeweghe | 25 | DEN | 78 | 2734 | 23.6 | 3.6 | 3.9 | 0.181 |
| **90** | Mark Aguirre | 24 | DAL | 79 | 2900 | 23.5 | 3.7 | 4.1 | 0.149 |
| **89** | Alex English | 30 | DEN | 82 | 2870 | 22.2 | 3.4 | 3.9 | 0.136 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **42** | Craig Hodges | 23 | SDC | 76 | 1571 | 8.7 | -4.5 | -1.0 | 0.015 |
| **43** | Bruce Kuczenski | 22 | NJN/PHI/IND | 15 | 119 | -0.5 | -6.0 | -0.3 | -0.152 |
| **43** | Anthony Roberts | 28 | DEN | 19 | 197 | 6.7 | -7.9 | -0.4 | -0.058 |
| **43** | Mitch Kupchak | 29 | LAL | 34 | 324 | 7.0 | -7.4 | -0.5 | 0.003 |
| **43** | Chris Engler | 24 | GSW | 46 | 360 | 5.3 | -6.4 | -0.4 | 0.000 |
| **44** | Mark West | 23 | DAL | 34 | 202 | 4.1 | -6.3 | -0.3 | -0.023 |
| **44** | Bob Hansen | 23 | UTA | 55 | 419 | 7.6 | -5.6 | -0.4 | -0.008 |
| **44** | Sedale Threatt | 22 | PHI | 45 | 464 | 6.6 | -5.7 | -0.4 | 0.012 |
| **44** | Sidney Green | 23 | CHI | 49 | 667 | 9.2 | -5.7 | -0.6 | 0.020 |
| **44** | Darren Tillis | 23 | GSW | 72 | 730 | 9.5 | -5.6 | -0.7 | 0.030 |

## 1984-1985

320 rated player-seasons · 248 qualified (MP ≥ 500) · mean 62.0 · median 60 · range 36–97

- **Rating 90-100:** 8 players (2.5%)
- **Rating 80-90:** 27 players (8.4%)
- **Rating 70-80:** 49 players (15.3%)
- **Rating 60-70:** 81 players (25.3%)
- **Rating 50-60:** 106 players (33.1%)
- **Rating 40-50:** 47 players (14.7%)
- **Rating 30-40:** 2 players (0.6%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Larry Bird | 28 | BOS | 80 | 3161 | 26.5 | 8.8 | 8.7 | 0.238 |
| **96** | Michael Jordan | 21 | CHI | 82 | 3144 | 25.8 | 7.3 | 7.4 | 0.213 |
| **94** | Magic Johnson | 25 | LAL | 77 | 2781 | 23.2 | 6.7 | 6.1 | 0.220 |
| **93** | Isiah Thomas | 23 | DET | 81 | 3089 | 22.2 | 6.3 | 6.5 | 0.173 |
| **92** | Kareem Abdul-Jabbar | 37 | LAL | 79 | 2630 | 22.9 | 5.1 | 4.8 | 0.204 |
| **91** | Sidney Moncrief | 27 | MIL | 73 | 2734 | 20.1 | 4.8 | 4.7 | 0.197 |
| **90** | Terry Cummings | 23 | MIL | 79 | 2722 | 22.1 | 4.3 | 4.3 | 0.189 |
| **90** | Bernard King | 28 | NYK | 55 | 2063 | 25.2 | 5.1 | 3.6 | 0.166 |
| **88** | Michael Ray Richardson | 29 | NJN | 82 | 3127 | 19.8 | 4.1 | 4.8 | 0.134 |
| **88** | Paul Pressey | 26 | MIL | 80 | 2876 | 17.6 | 4.2 | 4.5 | 0.160 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **36** | Ken Bannister | 24 | NYK | 75 | 1404 | 7.3 | -7.1 | -1.8 | -0.028 |
| **39** | Cory Blackwell | 21 | SEA | 60 | 551 | 6.4 | -7.9 | -0.8 | -0.081 |
| **41** | Jay Murphy | 22 | LAC | 23 | 149 | -0.9 | -12.4 | -0.4 | -0.154 |
| **41** | Stuart Gray | 21 | IND | 52 | 391 | 4.6 | -7.9 | -0.6 | -0.052 |
| **41** | Gary Plummer | 22 | GSW | 66 | 702 | 7.5 | -7.3 | -0.9 | -0.012 |
| **42** | Steve Burtt | 22 | GSW | 47 | 418 | 7.4 | -7.5 | -0.6 | -0.043 |
| **42** | Ron Cavenall | 25 | NYK | 53 | 653 | 4.1 | -5.8 | -0.6 | -0.016 |
| **42** | Lancaster Gordon | 22 | LAC | 63 | 682 | 8.2 | -6.1 | -0.7 | -0.055 |
| **42** | James Bailey | 27 | NYK | 74 | 1297 | 7.9 | -5.8 | -1.3 | 0.021 |
| **43** | Howard Carter | 23 | DAL | 11 | 66 | -7.4 | -15.5 | -0.2 | -0.309 |

## 1985-1986

325 rated player-seasons · 247 qualified (MP ≥ 500) · mean 61.8 · median 59 · range 38–97

- **Rating 90-100:** 11 players (3.4%)
- **Rating 80-90:** 20 players (6.2%)
- **Rating 70-80:** 54 players (16.6%)
- **Rating 60-70:** 76 players (23.4%)
- **Rating 50-60:** 106 players (32.6%)
- **Rating 40-50:** 57 players (17.5%)
- **Rating 30-40:** 1 players (0.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Larry Bird | 29 | BOS | 82 | 3113 | 25.6 | 8.7 | 8.4 | 0.244 |
| **95** | Magic Johnson | 26 | LAL | 72 | 2578 | 24.0 | 6.7 | 5.7 | 0.226 |
| **93** | Adrian Dantley | 30 | UTA | 76 | 2744 | 24.6 | 4.9 | 4.8 | 0.223 |
| **92** | Charles Barkley | 22 | PHI | 80 | 2952 | 22.4 | 5.1 | 5.3 | 0.176 |
| **92** | Kareem Abdul-Jabbar | 38 | LAL | 79 | 2629 | 22.7 | 5.4 | 4.9 | 0.197 |
| **91** | Dominique Wilkins | 26 | ATL | 78 | 3049 | 23.3 | 4.2 | 4.8 | 0.170 |
| **91** | Paul Pressey | 27 | MIL | 80 | 2704 | 18.6 | 5.7 | 5.3 | 0.174 |
| **91** | Sidney Moncrief | 28 | MIL | 73 | 2567 | 20.0 | 4.9 | 4.5 | 0.219 |
| **91** | Kevin McHale | 28 | BOS | 68 | 2397 | 21.6 | 4.4 | 3.9 | 0.220 |
| **90** | Isiah Thomas | 24 | DET | 77 | 2790 | 21.2 | 5.0 | 4.9 | 0.151 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Lancaster Gordon | 23 | LAC | 60 | 704 | 7.8 | -7.4 | -1.0 | -0.072 |
| **40** | Rick Robey | 30 | PHO | 46 | 629 | 5.7 | -6.3 | -0.7 | -0.042 |
| **40** | Georgi Glouchkov | 26 | PHO | 49 | 772 | 5.7 | -6.3 | -0.8 | -0.029 |
| **40** | Jerome Whitehead | 29 | GSW | 81 | 1079 | 7.9 | -6.5 | -1.2 | 0.013 |
| **40** | Jeff Wilkins | 30 | UTA/SAS | 75 | 1126 | 7.2 | -6.2 | -1.2 | 0.012 |
| **41** | Nick Vanos | 22 | PHO | 11 | 202 | 3.4 | -10.1 | -0.4 | -0.106 |
| **41** | Alfredrick Hughes | 23 | SAS | 68 | 866 | 8.2 | -5.7 | -0.8 | -0.029 |
| **42** | Mike Smrek | 23 | CHI | 38 | 408 | 6.5 | -7.5 | -0.6 | -0.024 |
| **43** | Blair Rasmussen | 23 | DEN | 48 | 330 | 8.7 | -8.1 | -0.5 | -0.021 |
| **43** | Greg Kite | 24 | BOS | 64 | 464 | 4.6 | -6.0 | -0.5 | 0.007 |

## 1986-1987

335 rated player-seasons · 248 qualified (MP ≥ 500) · mean 61.3 · median 58 · range 40–98

- **Rating 90-100:** 12 players (3.6%)
- **Rating 80-90:** 24 players (7.2%)
- **Rating 70-80:** 46 players (13.7%)
- **Rating 60-70:** 73 players (21.8%)
- **Rating 50-60:** 129 players (38.5%)
- **Rating 40-50:** 51 players (15.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 23 | CHI | 82 | 3281 | 29.8 | 10.8 | 10.6 | 0.247 |
| **97** | Larry Bird | 30 | BOS | 74 | 3005 | 26.4 | 9.4 | 8.6 | 0.243 |
| **97** | Magic Johnson | 27 | LAL | 80 | 2904 | 27.0 | 8.8 | 8.0 | 0.263 |
| **94** | Charles Barkley | 23 | PHI | 68 | 2740 | 25.1 | 6.7 | 6.0 | 0.210 |
| **93** | Kevin McHale | 29 | BOS | 77 | 3060 | 24.0 | 5.1 | 5.5 | 0.232 |
| **93** | Dominique Wilkins | 27 | ATL | 79 | 2969 | 23.5 | 5.5 | 5.6 | 0.197 |
| **93** | Hakeem Olajuwon | 24 | HOU | 75 | 2760 | 23.8 | 5.8 | 5.4 | 0.189 |
| **91** | Doc Rivers | 25 | ATL | 82 | 2590 | 19.9 | 6.0 | 5.3 | 0.191 |
| **91** | Larry Nance | 27 | PHO | 69 | 2569 | 22.2 | 5.0 | 4.5 | 0.190 |
| **90** | Clyde Drexler | 24 | POR | 82 | 3114 | 20.2 | 4.9 | 5.4 | 0.158 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Chris Washburn | 21 | GSW | 35 | 385 | 5.4 | -9.0 | -0.7 | -0.100 |
| **40** | William Bedford | 23 | PHO | 50 | 979 | 7.6 | -6.6 | -1.1 | -0.041 |
| **43** | Fernando Martín | 24 | POR | 24 | 146 | -0.9 | -10.3 | -0.3 | -0.144 |
| **43** | Steffond Johnson | 24 | LAC | 29 | 234 | 4.7 | -9.8 | -0.5 | -0.037 |
| **43** | Conner Henry | 23 | HOU/BOS | 54 | 323 | 6.1 | -7.7 | -0.5 | -0.049 |
| **43** | Eddie Lee Wilkins | 24 | NYK | 24 | 454 | 7.0 | -7.7 | -0.7 | -0.012 |
| **44** | Bob Thornton | 24 | NYK | 33 | 282 | 4.1 | -7.9 | -0.4 | -0.044 |
| **44** | World B. Free | 33 | PHI | 20 | 285 | 7.1 | -8.6 | -0.5 | -0.037 |
| **44** | Rick Carlisle | 27 | BOS | 42 | 297 | 4.6 | -7.1 | -0.4 | -0.054 |
| **44** | Russ Schoene | 26 | SEA | 63 | 579 | 6.2 | -6.0 | -0.6 | -0.018 |

## 1987-1988

332 rated player-seasons · 248 qualified (MP ≥ 500) · mean 61.4 · median 59 · range 40–99

- **Rating 90-100:** 9 players (2.7%)
- **Rating 80-90:** 30 players (9.0%)
- **Rating 70-80:** 43 players (13.0%)
- **Rating 60-70:** 82 players (24.7%)
- **Rating 50-60:** 114 players (34.3%)
- **Rating 40-50:** 54 players (16.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | Michael Jordan | 24 | CHI | 82 | 3311 | 31.7 | 13.0 | 12.5 | 0.308 |
| **97** | Larry Bird | 31 | BOS | 76 | 2965 | 27.8 | 8.8 | 8.1 | 0.243 |
| **96** | Charles Barkley | 24 | PHI | 80 | 3170 | 27.6 | 7.4 | 7.5 | 0.253 |
| **96** | John Stockton | 25 | UTA | 82 | 2842 | 23.2 | 8.5 | 7.6 | 0.238 |
| **95** | Clyde Drexler | 25 | POR | 81 | 3060 | 24.1 | 7.0 | 7.0 | 0.207 |
| **92** | Magic Johnson | 28 | LAL | 72 | 2637 | 23.1 | 6.0 | 5.3 | 0.199 |
| **90** | Fat Lever | 27 | DEN | 82 | 3061 | 20.5 | 5.1 | 5.5 | 0.163 |
| **90** | Dominique Wilkins | 28 | ATL | 78 | 2948 | 23.7 | 4.3 | 4.7 | 0.160 |
| **90** | Hakeem Olajuwon | 25 | HOU | 79 | 2825 | 23.4 | 4.4 | 4.6 | 0.182 |
| **88** | Mark Aguirre | 28 | DAL | 77 | 2610 | 21.9 | 3.8 | 3.9 | 0.163 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Reggie Williams | 23 | LAC | 35 | 857 | 7.6 | -6.6 | -1.0 | -0.061 |
| **41** | Albert King | 28 | PHI | 72 | 1593 | 7.2 | -5.4 | -1.4 | -0.004 |
| **43** | Martin Nessley | 22 | LAC/SAC | 44 | 336 | 2.8 | -8.2 | -0.5 | -0.014 |
| **43** | Norris Coleman | 26 | LAC | 29 | 431 | 6.6 | -7.1 | -0.6 | -0.046 |
| **43** | David Wingate | 24 | PHI | 61 | 1419 | 8.5 | -4.8 | -1.0 | -0.018 |
| **44** | Jim Farmer | 23 | DAL | 30 | 157 | 4.4 | -9.9 | -0.3 | -0.111 |
| **44** | Dave Henderson | 23 | PHI | 22 | 351 | 6.7 | -7.1 | -0.4 | -0.058 |
| **45** | Louis Orr | 29 | NYK | 29 | 180 | 2.7 | -7.5 | -0.3 | -0.059 |
| **45** | Bart Kofoed | 23 | UTA | 36 | 225 | 1.9 | -7.9 | -0.3 | -0.026 |
| **45** | Michael Jackson | 23 | SAC | 58 | 760 | 7.8 | -4.9 | -0.6 | -0.011 |

## 1988-1989

353 rated player-seasons · 263 qualified (MP ≥ 500) · mean 61.8 · median 58 · range 41–99

- **Rating 90-100:** 8 players (2.3%)
- **Rating 80-90:** 32 players (9.1%)
- **Rating 70-80:** 50 players (14.2%)
- **Rating 60-70:** 76 players (21.5%)
- **Rating 50-60:** 143 players (40.5%)
- **Rating 40-50:** 44 players (12.5%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | Michael Jordan | 25 | CHI | 81 | 3255 | 31.1 | 11.9 | 11.4 | 0.292 |
| **97** | Magic Johnson | 29 | LAL | 77 | 2886 | 26.9 | 9.4 | 8.3 | 0.267 |
| **96** | John Stockton | 26 | UTA | 82 | 3171 | 22.9 | 8.3 | 8.3 | 0.236 |
| **96** | Charles Barkley | 25 | PHI | 79 | 3088 | 27.0 | 7.5 | 7.4 | 0.250 |
| **93** | Karl Malone | 25 | UTA | 80 | 3126 | 24.4 | 5.4 | 5.9 | 0.233 |
| **93** | Clyde Drexler | 26 | POR | 78 | 3064 | 23.6 | 6.5 | 6.6 | 0.197 |
| **93** | Hakeem Olajuwon | 26 | HOU | 82 | 3024 | 25.2 | 5.5 | 5.7 | 0.197 |
| **90** | Patrick Ewing | 26 | NYK | 80 | 2896 | 22.1 | 4.5 | 4.8 | 0.181 |
| **89** | Kevin Johnson | 22 | PHO | 81 | 3179 | 20.5 | 4.2 | 5.0 | 0.184 |
| **89** | Chris Mullin | 25 | GSW | 82 | 3093 | 21.9 | 4.0 | 4.7 | 0.165 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **41** | Rony Seikaly | 23 | MIA | 78 | 1962 | 10.8 | -5.8 | -1.9 | -0.012 |
| **42** | Joe Wolf | 24 | LAC | 66 | 1450 | 7.0 | -5.5 | -1.3 | -0.016 |
| **43** | Jay Vincent | 29 | DEN/SAS | 29 | 646 | 7.0 | -6.8 | -0.8 | -0.024 |
| **45** | Tito Horford | 23 | MIL | 25 | 112 | 3.6 | -12.1 | -0.3 | -0.136 |
| **45** | Greg Kite | 27 | LAC/CHH | 70 | 942 | 6.3 | -5.2 | -0.8 | 0.005 |
| **45** | Bill Cartwright | 31 | CHI | 78 | 2333 | 11.0 | -5.0 | -1.7 | 0.042 |
| **46** | Rolando Ferreira | 24 | POR | 12 | 34 | -7.6 | -23.2 | -0.2 | -0.352 |
| **46** | Bob Thornton | 26 | PHI | 54 | 449 | 6.4 | -6.7 | -0.5 | 0.010 |
| **46** | Craig Neal | 24 | POR/MIA | 53 | 500 | 6.7 | -5.2 | -0.4 | -0.025 |
| **46** | Chris Dudley | 23 | CLE | 61 | 544 | 8.7 | -7.0 | -0.7 | 0.011 |

## 1989-1990

381 rated player-seasons · 282 qualified (MP ≥ 500) · mean 61.5 · median 59 · range 42–98

- **Rating 90-100:** 13 players (3.4%)
- **Rating 80-90:** 20 players (5.2%)
- **Rating 70-80:** 64 players (16.8%)
- **Rating 60-70:** 86 players (22.6%)
- **Rating 50-60:** 131 players (34.4%)
- **Rating 40-50:** 67 players (17.6%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 26 | CHI | 82 | 3197 | 31.2 | 11.2 | 10.6 | 0.285 |
| **97** | Magic Johnson | 30 | LAL | 79 | 2937 | 26.6 | 10.1 | 8.9 | 0.270 |
| **96** | Charles Barkley | 26 | PHI | 79 | 3085 | 27.1 | 8.2 | 8.0 | 0.269 |
| **95** | Karl Malone | 26 | UTA | 82 | 3122 | 27.2 | 6.4 | 6.6 | 0.245 |
| **95** | David Robinson | 24 | SAS | 82 | 3002 | 26.3 | 6.9 | 6.8 | 0.241 |
| **95** | John Stockton | 27 | UTA | 78 | 2915 | 23.9 | 8.9 | 8.0 | 0.238 |
| **93** | Patrick Ewing | 27 | NYK | 82 | 3165 | 25.8 | 5.5 | 6.0 | 0.205 |
| **93** | Clyde Drexler | 27 | POR | 73 | 2683 | 22.2 | 7.3 | 6.3 | 0.208 |
| **92** | Hakeem Olajuwon | 27 | HOU | 82 | 3124 | 24.1 | 5.8 | 6.2 | 0.173 |
| **91** | Dominique Wilkins | 30 | ATL | 80 | 2888 | 24.6 | 5.4 | 5.4 | 0.184 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **42** | John Morton | 22 | CLE | 37 | 402 | 5.9 | -7.7 | -0.6 | -0.109 |
| **42** | Uwe Blab | 27 | GSW/SAS | 47 | 531 | 3.3 | -7.4 | -0.7 | -0.039 |
| **42** | Jeff Turner | 27 | ORL | 60 | 1105 | 6.6 | -6.1 | -1.2 | -0.009 |
| **43** | George McCloud | 22 | IND | 44 | 413 | 4.6 | -6.8 | -0.5 | -0.079 |
| **43** | Randy White | 22 | DAL | 55 | 707 | 7.4 | -7.5 | -1.0 | -0.012 |
| **43** | Jack Haley | 26 | CHI/NJN | 67 | 1084 | 8.5 | -7.1 | -1.4 | 0.013 |
| **44** | Joe Wolf | 25 | LAC | 77 | 1325 | 6.8 | -5.3 | -1.1 | -0.006 |
| **45** | Mike Morrison | 22 | PHO | 36 | 153 | 4.2 | -10.5 | -0.3 | -0.106 |
| **45** | Žarko Paspalj | 23 | SAS | 28 | 181 | 4.3 | -10.4 | -0.4 | -0.072 |
| **45** | Jeff Sanders | 24 | CHI | 31 | 182 | 2.5 | -10.2 | -0.4 | -0.069 |

## 1990-1991

387 rated player-seasons · 286 qualified (MP ≥ 500) · mean 61.6 · median 58 · range 40–98

- **Rating 90-100:** 13 players (3.4%)
- **Rating 80-90:** 25 players (6.5%)
- **Rating 70-80:** 59 players (15.2%)
- **Rating 60-70:** 89 players (23.0%)
- **Rating 50-60:** 150 players (38.8%)
- **Rating 40-50:** 51 players (13.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 27 | CHI | 82 | 3034 | 31.6 | 12.0 | 10.8 | 0.321 |
| **96** | David Robinson | 25 | SAS | 82 | 3095 | 27.4 | 8.5 | 8.2 | 0.264 |
| **96** | Magic Johnson | 31 | LAL | 79 | 2933 | 25.1 | 9.0 | 8.1 | 0.251 |
| **96** | Charles Barkley | 27 | PHI | 67 | 2498 | 28.9 | 9.3 | 7.0 | 0.258 |
| **95** | John Stockton | 28 | UTA | 82 | 3103 | 23.4 | 8.3 | 8.1 | 0.217 |
| **93** | Karl Malone | 27 | UTA | 82 | 3302 | 24.8 | 5.4 | 6.2 | 0.225 |
| **93** | Clyde Drexler | 28 | POR | 82 | 2852 | 22.1 | 6.8 | 6.4 | 0.209 |
| **93** | Kevin Johnson | 24 | PHO | 77 | 2772 | 23.7 | 6.6 | 6.0 | 0.220 |
| **93** | Terry Porter | 27 | POR | 81 | 2665 | 21.7 | 7.4 | 6.2 | 0.235 |
| **91** | Dominique Wilkins | 31 | ATL | 81 | 3078 | 23.5 | 4.9 | 5.4 | 0.177 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Alec Kessler | 24 | MIA | 78 | 1259 | 8.4 | -7.5 | -1.7 | -0.005 |
| **42** | Eric Leckner | 24 | SAC/CHH | 72 | 1122 | 7.5 | -6.6 | -1.3 | 0.007 |
| **42** | Gerald Paddio | 25 | CLE | 70 | 1181 | 9.3 | -6.5 | -1.3 | -0.018 |
| **43** | Rick Calloway | 24 | SAC | 64 | 678 | 6.6 | -6.6 | -0.8 | -0.025 |
| **44** | Kenny Payne | 24 | PHI | 47 | 444 | 7.5 | -7.2 | -0.6 | -0.037 |
| **44** | Greg Anderson | 26 | MIL/NJN/DEN | 68 | 924 | 9.1 | -6.1 | -1.0 | -0.017 |
| **44** | Bo Kimble | 24 | LAC | 62 | 1004 | 7.7 | -5.9 | -1.0 | 0.000 |
| **45** | Trevor Wilson | 22 | ATL | 25 | 162 | 4.9 | -9.3 | -0.3 | -0.144 |
| **45** | Jayson Williams | 22 | PHI | 52 | 508 | 8.0 | -7.7 | -0.7 | 0.006 |
| **45** | Mike Sanders | 30 | IND | 80 | 1357 | 8.4 | -4.9 | -1.0 | 0.003 |

## 1991-1992

386 rated player-seasons · 287 qualified (MP ≥ 500) · mean 61.5 · median 59 · range 39–98

- **Rating 90-100:** 13 players (3.4%)
- **Rating 80-90:** 24 players (6.2%)
- **Rating 70-80:** 53 players (13.7%)
- **Rating 60-70:** 95 players (24.6%)
- **Rating 50-60:** 160 players (41.5%)
- **Rating 40-50:** 40 players (10.4%)
- **Rating 30-40:** 1 players (0.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 28 | CHI | 80 | 3102 | 27.7 | 9.7 | 9.2 | 0.274 |
| **97** | David Robinson | 26 | SAS | 68 | 2564 | 27.5 | 9.4 | 7.4 | 0.260 |
| **96** | John Stockton | 29 | UTA | 82 | 3002 | 22.8 | 8.7 | 8.1 | 0.215 |
| **96** | Clyde Drexler | 29 | POR | 76 | 2751 | 23.6 | 8.7 | 7.4 | 0.223 |
| **94** | Karl Malone | 28 | UTA | 81 | 3054 | 25.4 | 5.7 | 5.9 | 0.237 |
| **94** | Charles Barkley | 28 | PHI | 75 | 2881 | 24.5 | 6.3 | 6.1 | 0.205 |
| **93** | Scottie Pippen | 26 | CHI | 82 | 3164 | 21.5 | 6.1 | 6.4 | 0.192 |
| **92** | Patrick Ewing | 29 | NYK | 82 | 3150 | 22.8 | 4.9 | 5.5 | 0.198 |
| **92** | Horace Grant | 26 | CHI | 81 | 2859 | 20.6 | 5.3 | 5.2 | 0.237 |
| **91** | Larry Nance | 32 | CLE | 81 | 2880 | 21.4 | 5.2 | 5.2 | 0.204 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Jeff Turner | 29 | ORL | 75 | 1591 | 7.2 | -5.9 | -1.6 | -0.005 |
| **40** | Jack Haley | 28 | LAL | 49 | 394 | 3.6 | -10.4 | -0.8 | -0.034 |
| **41** | Brian Oliver | 23 | PHI | 34 | 279 | 3.6 | -9.5 | -0.5 | -0.115 |
| **41** | Jayson Williams | 23 | PHI | 50 | 646 | 7.4 | -7.9 | -1.0 | -0.020 |
| **41** | Mark Macon | 22 | DEN | 76 | 2304 | 8.3 | -4.4 | -1.4 | -0.016 |
| **43** | Rory Sparrow | 33 | CHI/LAL | 46 | 489 | 6.5 | -6.6 | -0.6 | -0.037 |
| **43** | Winston Bennett | 26 | CLE/MIA | 54 | 833 | 6.3 | -6.5 | -0.9 | 0.020 |
| **44** | John Turner | 24 | HOU | 42 | 345 | 7.8 | -7.9 | -0.5 | -0.021 |
| **44** | Henry James | 26 | CLE | 65 | 866 | 10.0 | -6.5 | -1.0 | 0.015 |
| **45** | Sean Green | 21 | IND | 35 | 256 | 9.9 | -7.9 | -0.4 | -0.087 |

## 1992-1993

390 rated player-seasons · 290 qualified (MP ≥ 500) · mean 61.8 · median 59 · range 40–98

- **Rating 90-100:** 9 players (2.3%)
- **Rating 80-90:** 38 players (9.7%)
- **Rating 70-80:** 57 players (14.6%)
- **Rating 60-70:** 82 players (21.0%)
- **Rating 50-60:** 156 players (40.0%)
- **Rating 40-50:** 48 players (12.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 29 | CHI | 78 | 3067 | 29.7 | 11.2 | 10.2 | 0.270 |
| **96** | Hakeem Olajuwon | 30 | HOU | 82 | 3242 | 27.3 | 7.5 | 7.8 | 0.234 |
| **96** | Karl Malone | 29 | UTA | 82 | 3099 | 26.2 | 7.3 | 7.3 | 0.238 |
| **96** | Charles Barkley | 29 | PHO | 76 | 2859 | 25.9 | 7.8 | 7.1 | 0.242 |
| **94** | David Robinson | 27 | SAS | 82 | 3211 | 24.2 | 6.4 | 6.8 | 0.197 |
| **92** | John Stockton | 30 | UTA | 82 | 2863 | 21.3 | 6.6 | 6.2 | 0.177 |
| **92** | Brad Daugherty | 27 | CLE | 71 | 2691 | 22.0 | 4.9 | 4.7 | 0.226 |
| **92** | Dominique Wilkins | 33 | ATL | 71 | 2647 | 24.3 | 5.4 | 4.9 | 0.191 |
| **91** | Mark Price | 28 | CLE | 75 | 2380 | 22.1 | 5.3 | 4.4 | 0.197 |
| **89** | Shaquille O'Neal | 20 | ORL | 81 | 3071 | 22.9 | 3.5 | 4.3 | 0.163 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Donald Hodge | 23 | DAL | 79 | 1267 | 8.3 | -5.9 | -1.3 | -0.032 |
| **40** | Anthony Avent | 23 | MIL | 82 | 2285 | 10.2 | -5.5 | -2.0 | 0.005 |
| **42** | Walter Bond | 23 | DAL | 74 | 1578 | 9.0 | -5.0 | -1.2 | -0.024 |
| **43** | Felton Spencer | 25 | MIN | 71 | 1296 | 8.2 | -5.9 | -1.3 | 0.039 |
| **43** | Doug Smith | 23 | DAL | 61 | 1524 | 10.3 | -5.2 | -1.2 | -0.029 |
| **43** | Terry Davis | 25 | DAL | 75 | 2462 | 11.7 | -4.8 | -1.7 | -0.002 |
| **44** | Blair Rasmussen | 30 | ATL | 22 | 283 | 4.8 | -8.5 | -0.5 | -0.002 |
| **44** | Duane Cooper | 23 | LAL | 65 | 645 | 7.6 | -5.8 | -0.6 | -0.031 |
| **44** | Jim Jackson | 22 | DAL | 28 | 938 | 11.0 | -4.5 | -0.6 | -0.081 |
| **45** | Delaney Rudd | 30 | POR | 15 | 95 | 1.7 | -11.0 | -0.2 | -0.151 |

## 1993-1994

403 rated player-seasons · 286 qualified (MP ≥ 500) · mean 61.0 · median 58 · range 38–99

- **Rating 90-100:** 12 players (3.0%)
- **Rating 80-90:** 24 players (6.0%)
- **Rating 70-80:** 66 players (16.4%)
- **Rating 60-70:** 83 players (20.6%)
- **Rating 50-60:** 158 players (39.2%)
- **Rating 40-50:** 58 players (14.4%)
- **Rating 30-40:** 2 players (0.5%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | David Robinson | 28 | SAS | 80 | 3241 | 30.7 | 11.9 | 11.4 | 0.296 |
| **96** | Shaquille O'Neal | 21 | ORL | 81 | 3224 | 28.5 | 6.8 | 7.2 | 0.252 |
| **95** | Hakeem Olajuwon | 31 | HOU | 80 | 3277 | 25.3 | 6.8 | 7.3 | 0.210 |
| **95** | John Stockton | 31 | UTA | 82 | 2969 | 22.5 | 8.0 | 7.5 | 0.214 |
| **94** | Scottie Pippen | 28 | CHI | 72 | 2759 | 23.2 | 7.7 | 6.8 | 0.194 |
| **93** | Karl Malone | 30 | UTA | 82 | 3329 | 22.9 | 5.6 | 6.4 | 0.193 |
| **92** | Patrick Ewing | 31 | NYK | 79 | 2972 | 22.9 | 5.2 | 5.5 | 0.211 |
| **92** | Mark Price | 29 | CLE | 76 | 2386 | 22.7 | 6.4 | 5.0 | 0.201 |
| **91** | Mookie Blaylock | 26 | ATL | 81 | 2915 | 19.6 | 5.7 | 5.7 | 0.168 |
| **91** | Shawn Kemp | 24 | SEA | 79 | 2597 | 22.9 | 4.4 | 4.2 | 0.216 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Kevin Duckworth | 29 | WSB | 69 | 1485 | 8.2 | -6.6 | -1.7 | -0.017 |
| **39** | Allan Houston | 22 | DET | 79 | 1519 | 9.0 | -5.8 | -1.5 | -0.038 |
| **41** | Sleepy Floyd | 33 | SAS | 53 | 737 | 6.0 | -6.3 | -0.8 | -0.025 |
| **41** | Acie Earl | 23 | BOS | 74 | 1149 | 9.2 | -6.5 | -1.3 | 0.008 |
| **42** | Sean Green | 23 | PHI/UTA | 36 | 334 | 7.6 | -7.4 | -0.5 | -0.130 |
| **42** | Chris Whitney | 22 | SAS | 40 | 339 | 3.5 | -8.2 | -0.5 | -0.049 |
| **42** | Rumeal Robinson | 27 | NJN/CHH | 31 | 396 | 6.1 | -6.9 | -0.5 | -0.077 |
| **42** | Doug Overton | 24 | WSB | 61 | 749 | 8.4 | -6.0 | -0.8 | -0.028 |
| **43** | Greg Kite | 32 | ORL | 29 | 309 | 2.2 | -7.3 | -0.4 | -0.018 |
| **43** | Bobby Hurley | 22 | SAC | 19 | 499 | 8.4 | -6.4 | -0.6 | -0.044 |

## 1994-1995

407 rated player-seasons · 303 qualified (MP ≥ 500) · mean 61.5 · median 58 · range 42–98

- **Rating 90-100:** 13 players (3.2%)
- **Rating 80-90:** 25 players (6.1%)
- **Rating 70-80:** 72 players (17.7%)
- **Rating 60-70:** 76 players (18.7%)
- **Rating 50-60:** 167 players (41.0%)
- **Rating 40-50:** 54 players (13.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | David Robinson | 29 | SAS | 81 | 3074 | 29.1 | 9.2 | 8.7 | 0.273 |
| **96** | John Stockton | 32 | UTA | 82 | 2867 | 23.3 | 9.0 | 7.9 | 0.233 |
| **95** | Shaquille O'Neal | 22 | ORL | 79 | 2923 | 28.6 | 5.8 | 5.7 | 0.230 |
| **94** | Karl Malone | 31 | UTA | 82 | 3126 | 25.1 | 5.6 | 6.0 | 0.212 |
| **94** | Scottie Pippen | 29 | CHI | 79 | 3014 | 22.6 | 7.5 | 7.2 | 0.188 |
| **93** | Hakeem Olajuwon | 32 | HOU | 72 | 2853 | 26.0 | 5.4 | 5.3 | 0.181 |
| **93** | Clyde Drexler | 32 | POR/HOU | 76 | 2728 | 22.4 | 6.5 | 5.9 | 0.206 |
| **93** | Charles Barkley | 31 | PHO | 68 | 2382 | 25.2 | 6.3 | 5.0 | 0.214 |
| **92** | Dana Barros | 27 | PHI | 82 | 3318 | 20.9 | 5.0 | 5.8 | 0.183 |
| **91** | Gary Payton | 26 | SEA | 82 | 3015 | 21.3 | 4.9 | 5.2 | 0.187 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **42** | Jay Humphries | 32 | UTA/BOS | 18 | 201 | -0.9 | -8.6 | -0.3 | -0.100 |
| **42** | Mike Brown | 31 | MIN | 27 | 213 | 1.8 | -10.1 | -0.4 | -0.097 |
| **42** | Howard Eisley | 22 | MIN/SAS | 49 | 552 | 6.1 | -6.8 | -0.7 | -0.044 |
| **42** | Sleepy Floyd | 34 | NJN | 48 | 831 | 6.3 | -6.2 | -0.9 | -0.010 |
| **43** | John Williams | 28 | IND | 34 | 402 | 4.2 | -6.3 | -0.4 | -0.055 |
| **43** | Sean Higgins | 26 | NJN | 57 | 735 | 7.1 | -6.5 | -0.8 | 0.002 |
| **43** | Harold Miner | 23 | MIA | 45 | 871 | 8.5 | -5.8 | -0.8 | -0.023 |
| **44** | Greg Kite | 33 | NYK/IND | 11 | 77 | -3.2 | -15.4 | -0.3 | -0.163 |
| **44** | Doug Christie | 24 | NYK | 12 | 79 | -3.7 | -13.5 | -0.2 | -0.202 |
| **44** | Alphonso Ford | 23 | PHI | 5 | 98 | 0.4 | -11.0 | -0.2 | -0.210 |

## 1995-1996

429 rated player-seasons · 322 qualified (MP ≥ 500) · mean 61.8 · median 59 · range 36–98

- **Rating 90-100:** 12 players (2.8%)
- **Rating 80-90:** 35 players (8.2%)
- **Rating 70-80:** 67 players (15.6%)
- **Rating 60-70:** 97 players (22.6%)
- **Rating 50-60:** 163 players (38.0%)
- **Rating 40-50:** 54 players (12.6%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Michael Jordan | 32 | CHI | 82 | 3090 | 29.4 | 10.5 | 9.8 | 0.317 |
| **97** | David Robinson | 30 | SAS | 82 | 3019 | 29.4 | 8.9 | 8.3 | 0.290 |
| **95** | Karl Malone | 32 | UTA | 82 | 3113 | 26.0 | 7.0 | 7.1 | 0.233 |
| **95** | Anfernee Hardaway | 24 | ORL | 82 | 3015 | 24.6 | 7.2 | 6.9 | 0.229 |
| **94** | Terrell Brandon | 25 | CLE | 75 | 2570 | 25.2 | 7.5 | 6.2 | 0.237 |
| **93** | John Stockton | 33 | UTA | 82 | 2915 | 21.9 | 6.8 | 6.4 | 0.214 |
| **92** | Scottie Pippen | 30 | CHI | 77 | 2825 | 21.0 | 6.3 | 5.9 | 0.209 |
| **92** | Charles Barkley | 32 | PHO | 71 | 2632 | 24.8 | 5.7 | 5.1 | 0.191 |
| **91** | Hakeem Olajuwon | 33 | HOU | 72 | 2797 | 25.5 | 4.9 | 4.9 | 0.166 |
| **91** | Arvydas Sabonis | 31 | POR | 73 | 1735 | 24.7 | 6.7 | 3.8 | 0.233 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **36** | Anthony Avent | 26 | VAN | 71 | 1586 | 6.9 | -7.3 | -2.1 | -0.037 |
| **40** | Corliss Williamson | 22 | SAC | 53 | 609 | 8.5 | -9.3 | -1.1 | -0.062 |
| **41** | John Amaechi | 25 | CLE | 28 | 357 | 3.1 | -9.1 | -0.6 | -0.075 |
| **41** | Yinka Dare | 23 | NJN | 58 | 626 | 6.1 | -8.7 | -1.0 | -0.037 |
| **42** | James Edwards | 40 | CHI | 28 | 274 | 3.5 | -12.2 | -0.7 | -0.028 |
| **42** | Vincenzo Esposito | 26 | TOR | 30 | 282 | 5.2 | -9.5 | -0.5 | -0.106 |
| **43** | George Zídek | 22 | CHH | 71 | 888 | 8.0 | -7.5 | -1.2 | 0.031 |
| **43** | Bobby Hurley | 24 | SAC | 72 | 1059 | 6.5 | -5.9 | -1.0 | -0.013 |
| **44** | David Vaughn | 22 | ORL | 33 | 266 | 6.0 | -10.9 | -0.6 | -0.013 |
| **44** | Tim Breaux | 25 | HOU | 54 | 570 | 6.2 | -6.7 | -0.7 | -0.021 |

## 1996-1997

441 rated player-seasons · 312 qualified (MP ≥ 500) · mean 61.1 · median 58 · range 37–97

- **Rating 90-100:** 15 players (3.4%)
- **Rating 80-90:** 29 players (6.6%)
- **Rating 70-80:** 62 players (14.1%)
- **Rating 60-70:** 93 players (21.1%)
- **Rating 50-60:** 186 players (42.2%)
- **Rating 40-50:** 55 players (12.5%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Michael Jordan | 33 | CHI | 82 | 3106 | 27.8 | 8.9 | 8.6 | 0.283 |
| **97** | Karl Malone | 33 | UTA | 82 | 2998 | 28.9 | 8.3 | 7.8 | 0.268 |
| **96** | Grant Hill | 24 | DET | 80 | 3147 | 25.5 | 8.2 | 8.0 | 0.223 |
| **93** | Mookie Blaylock | 29 | ATL | 78 | 3056 | 20.4 | 6.8 | 6.8 | 0.197 |
| **93** | John Stockton | 34 | UTA | 82 | 2896 | 22.1 | 6.6 | 6.3 | 0.226 |
| **92** | Gary Payton | 28 | SEA | 82 | 3213 | 21.8 | 5.5 | 6.1 | 0.193 |
| **92** | Tim Hardaway | 30 | MIA | 81 | 3136 | 20.8 | 6.2 | 6.5 | 0.198 |
| **92** | Scottie Pippen | 31 | CHI | 82 | 3095 | 21.3 | 5.7 | 6.1 | 0.203 |
| **92** | Shaquille O'Neal | 24 | LAL | 51 | 1941 | 27.1 | 6.5 | 4.1 | 0.197 |
| **91** | Reggie Miller | 31 | IND | 81 | 2966 | 20.2 | 5.8 | 5.8 | 0.200 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Sharone Wright | 24 | TOR | 60 | 1009 | 7.4 | -8.3 | -1.6 | -0.076 |
| **40** | Wayman Tisdale | 32 | PHO | 53 | 778 | 8.8 | -8.3 | -1.2 | -0.037 |
| **41** | Loren Meyer | 24 | DAL/PHO | 54 | 708 | 8.1 | -8.4 | -1.1 | -0.020 |
| **42** | Ken Norman | 32 | ATL | 17 | 220 | 3.1 | -9.2 | -0.4 | -0.129 |
| **43** | Tom Chambers | 37 | CHH | 12 | 83 | -3.9 | -16.9 | -0.3 | -0.239 |
| **43** | Eric Mobley | 26 | VAN | 28 | 307 | 6.3 | -8.4 | -0.5 | -0.063 |
| **43** | Vitaly Potapenko | 21 | CLE | 80 | 1238 | 9.5 | -6.6 | -1.4 | 0.020 |
| **44** | LaSalle Thompson | 35 | DEN/IND | 26 | 140 | -0.5 | -10.1 | -0.3 | -0.086 |
| **44** | Tony Dumas | 24 | DAL/PHO | 24 | 278 | 5.2 | -7.6 | -0.4 | -0.055 |
| **44** | Felton Spencer | 29 | ORL/GSW | 73 | 1558 | 9.2 | -5.6 | -1.4 | 0.040 |

## 1997-1998

439 rated player-seasons · 311 qualified (MP ≥ 500) · mean 61.3 · median 58 · range 37–96

- **Rating 90-100:** 9 players (2.1%)
- **Rating 80-90:** 43 players (9.8%)
- **Rating 70-80:** 58 players (13.2%)
- **Rating 60-70:** 90 players (20.5%)
- **Rating 50-60:** 170 players (38.7%)
- **Rating 40-50:** 68 players (15.5%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **96** | Karl Malone | 34 | UTA | 81 | 3030 | 27.9 | 7.3 | 7.1 | 0.259 |
| **96** | David Robinson | 32 | SAS | 73 | 2457 | 27.8 | 8.3 | 6.3 | 0.269 |
| **95** | Michael Jordan | 34 | CHI | 82 | 3181 | 25.2 | 6.9 | 7.1 | 0.238 |
| **93** | Shaquille O'Neal | 25 | LAL | 60 | 2175 | 28.8 | 5.8 | 4.3 | 0.224 |
| **91** | Tim Duncan | 21 | SAS | 82 | 3204 | 22.6 | 4.6 | 5.3 | 0.192 |
| **91** | Gary Payton | 29 | SEA | 82 | 3145 | 21.6 | 5.1 | 5.7 | 0.190 |
| **91** | Tim Hardaway | 31 | MIA | 81 | 3031 | 20.6 | 5.2 | 5.5 | 0.185 |
| **90** | Grant Hill | 25 | DET | 81 | 3294 | 21.2 | 4.7 | 5.6 | 0.149 |
| **90** | Reggie Miller | 32 | IND | 81 | 2795 | 19.8 | 4.8 | 4.8 | 0.206 |
| **89** | John Stockton | 35 | UTA | 64 | 1858 | 21.8 | 5.6 | 3.6 | 0.206 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Gerald Wilkins | 34 | ORL | 72 | 1252 | 5.4 | -6.6 | -1.5 | -0.048 |
| **41** | Joe Wolf | 33 | DEN | 57 | 621 | 5.1 | -6.6 | -0.7 | -0.037 |
| **41** | Antonio Daniels | 22 | VAN | 74 | 1956 | 9.9 | -5.0 | -1.5 | -0.032 |
| **42** | Bobby Hurley | 26 | SAC/VAN | 61 | 875 | 9.0 | -6.6 | -1.0 | -0.029 |
| **42** | Rodrick Rhodes | 24 | HOU | 58 | 1070 | 7.7 | -5.4 | -0.9 | -0.040 |
| **42** | Erick Strickland | 24 | DAL | 67 | 1505 | 9.3 | -5.0 | -1.1 | -0.028 |
| **43** | Jacque Vaughn | 22 | UTA | 45 | 419 | 6.9 | -7.6 | -0.6 | -0.048 |
| **43** | Doug West | 30 | MIN | 38 | 688 | 5.6 | -6.0 | -0.7 | 0.004 |
| **43** | Žan Tabak | 27 | TOR/BOS | 57 | 984 | 9.7 | -6.0 | -1.0 | -0.001 |
| **43** | Anthony Johnson | 23 | SAC | 77 | 2266 | 8.6 | -4.4 | -1.4 | 0.008 |

## 1998-1999

440 rated player-seasons · 265 qualified (MP ≥ 500) · mean 58.9 · median 55 · range 36–95

- **Rating 90-100:** 10 players (2.3%)
- **Rating 80-90:** 22 players (5.0%)
- **Rating 70-80:** 56 players (12.7%)
- **Rating 60-70:** 82 players (18.6%)
- **Rating 50-60:** 168 players (38.2%)
- **Rating 40-50:** 101 players (23.0%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **95** | Shaquille O'Neal | 26 | LAL | 49 | 1705 | 30.6 | 7.1 | 3.9 | 0.255 |
| **94** | Karl Malone | 35 | UTA | 49 | 1832 | 25.6 | 6.7 | 4.0 | 0.252 |
| **93** | David Robinson | 33 | SAS | 49 | 1554 | 24.9 | 6.7 | 3.4 | 0.261 |
| **92** | Grant Hill | 26 | DET | 50 | 1852 | 23.9 | 6.2 | 3.8 | 0.189 |
| **91** | Jason Kidd | 25 | PHO | 50 | 2060 | 22.5 | 5.5 | 3.9 | 0.188 |
| **91** | Allen Iverson | 23 | PHI | 48 | 1990 | 22.2 | 5.7 | 3.9 | 0.173 |
| **91** | Darrell Armstrong | 30 | ORL | 50 | 1502 | 22.2 | 6.7 | 3.3 | 0.205 |
| **90** | Gary Payton | 30 | SEA | 50 | 2008 | 23.1 | 5.1 | 3.6 | 0.172 |
| **90** | Tim Duncan | 22 | SAS | 50 | 1963 | 23.2 | 4.5 | 3.2 | 0.213 |
| **90** | Alonzo Mourning | 28 | MIA | 46 | 1753 | 24.6 | 4.7 | 3.0 | 0.216 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **36** | Cory Carr | 23 | CHI | 42 | 624 | 5.1 | -8.2 | -1.0 | -0.089 |
| **40** | Rodrick Rhodes | 25 | HOU/VAN | 13 | 156 | 0.7 | -11.4 | -0.4 | -0.201 |
| **40** | Ed Gray | 23 | ATL | 30 | 337 | 4.8 | -7.7 | -0.5 | -0.096 |
| **41** | Keith Booth | 24 | CHI | 39 | 432 | 7.0 | -6.0 | -0.4 | -0.088 |
| **41** | Bill Wennington | 35 | CHI | 38 | 451 | 7.0 | -6.9 | -0.6 | -0.030 |
| **42** | Bryant Reeves | 25 | VAN | 25 | 702 | 10.3 | -6.3 | -0.8 | -0.010 |
| **42** | Michael Olowokandi | 23 | LAC | 45 | 1279 | 11.8 | -5.0 | -1.0 | -0.010 |
| **43** | Loren Meyer | 26 | DEN | 14 | 70 | -2.8 | -16.9 | -0.3 | -0.190 |
| **43** | Rashard Lewis | 19 | SEA | 20 | 145 | 4.5 | -9.5 | -0.3 | -0.136 |
| **43** | William Cunningham | 24 | TOR/NJN | 16 | 162 | 0.5 | -10.3 | -0.3 | -0.054 |

## 1999-2000

439 rated player-seasons · 312 qualified (MP ≥ 500) · mean 61.0 · median 58 · range 34–98

- **Rating 90-100:** 12 players (2.7%)
- **Rating 80-90:** 28 players (6.4%)
- **Rating 70-80:** 73 players (16.6%)
- **Rating 60-70:** 95 players (21.6%)
- **Rating 50-60:** 160 players (36.4%)
- **Rating 40-50:** 68 players (15.5%)
- **Rating 30-40:** 3 players (0.7%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Shaquille O'Neal | 27 | LAL | 79 | 3163 | 30.6 | 9.3 | 9.0 | 0.283 |
| **96** | Karl Malone | 36 | UTA | 82 | 2947 | 27.1 | 7.5 | 7.1 | 0.249 |
| **94** | Gary Payton | 31 | SEA | 82 | 3425 | 23.6 | 6.4 | 7.3 | 0.195 |
| **93** | Kevin Garnett | 23 | MIN | 81 | 3243 | 23.6 | 6.3 | 6.8 | 0.172 |
| **93** | Tim Duncan | 23 | SAS | 74 | 2875 | 24.8 | 5.6 | 5.5 | 0.218 |
| **93** | Alonzo Mourning | 29 | MIA | 79 | 2748 | 25.8 | 5.3 | 5.0 | 0.226 |
| **93** | David Robinson | 34 | SAS | 80 | 2557 | 24.6 | 5.8 | 5.0 | 0.238 |
| **93** | John Stockton | 37 | UTA | 82 | 2432 | 22.4 | 6.6 | 5.3 | 0.222 |
| **92** | Vince Carter | 23 | TOR | 82 | 3126 | 23.4 | 5.5 | 5.9 | 0.182 |
| **92** | Chris Webber | 26 | SAC | 75 | 2880 | 23.4 | 5.7 | 5.6 | 0.179 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **34** | Michael Olowokandi | 24 | LAC | 80 | 2493 | 10.4 | -6.0 | -2.6 | -0.016 |
| **36** | Dickey Simpkins | 27 | CHI | 69 | 1651 | 5.5 | -6.3 | -1.8 | -0.021 |
| **39** | Eric Montross | 28 | DET | 51 | 332 | 0.2 | -9.3 | -0.6 | -0.058 |
| **41** | Rafer Alston | 23 | MIL | 27 | 361 | 4.3 | -7.3 | -0.5 | -0.095 |
| **41** | Randy Brown | 31 | CHI | 59 | 1625 | 7.3 | -4.8 | -1.2 | -0.024 |
| **42** | Anthony Avent | 30 | LAC | 49 | 377 | 5.5 | -7.4 | -0.5 | -0.065 |
| **42** | Will Perdue | 34 | CHI | 67 | 1012 | 6.6 | -5.3 | -0.8 | -0.023 |
| **43** | Vladimir Stepania | 23 | SEA | 30 | 202 | 6.7 | -10.8 | -0.5 | -0.080 |
| **43** | Michael Stewart | 24 | TOR | 42 | 389 | 5.4 | -8.2 | -0.6 | 0.030 |
| **43** | William Avery | 20 | MIN | 59 | 484 | 6.7 | -6.3 | -0.5 | -0.046 |

## 2000-2001

441 rated player-seasons · 318 qualified (MP ≥ 500) · mean 61.3 · median 59 · range 41–96

- **Rating 90-100:** 15 players (3.4%)
- **Rating 80-90:** 33 players (7.5%)
- **Rating 70-80:** 58 players (13.2%)
- **Rating 60-70:** 100 players (22.7%)
- **Rating 50-60:** 171 players (38.8%)
- **Rating 40-50:** 64 players (14.5%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **96** | Shaquille O'Neal | 28 | LAL | 74 | 2924 | 30.2 | 7.7 | 7.1 | 0.245 |
| **95** | Vince Carter | 24 | TOR | 75 | 2979 | 25.0 | 7.6 | 7.2 | 0.208 |
| **94** | Tracy McGrady | 21 | ORL | 77 | 3087 | 24.9 | 7.0 | 7.0 | 0.189 |
| **94** | Karl Malone | 37 | UTA | 81 | 2895 | 24.7 | 6.6 | 6.3 | 0.217 |
| **93** | Kevin Garnett | 24 | MIN | 81 | 3202 | 23.9 | 6.0 | 6.4 | 0.176 |
| **93** | Dirk Nowitzki | 22 | DAL | 82 | 3125 | 22.8 | 5.4 | 5.9 | 0.224 |
| **93** | Allen Iverson | 25 | PHI | 71 | 2979 | 24.0 | 6.1 | 6.1 | 0.190 |
| **92** | Tim Duncan | 24 | SAS | 82 | 3174 | 23.8 | 4.7 | 5.4 | 0.200 |
| **92** | Ray Allen | 25 | MIL | 82 | 3129 | 22.9 | 5.5 | 5.9 | 0.211 |
| **92** | Chris Webber | 27 | SAC | 70 | 2836 | 24.7 | 5.5 | 5.3 | 0.186 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **41** | Dalibor Bagarić | 20 | CHI | 35 | 259 | 3.3 | -10.0 | -0.5 | -0.121 |
| **41** | John Amaechi | 30 | ORL | 82 | 1710 | 8.7 | -6.1 | -1.7 | 0.001 |
| **41** | Michael Olowokandi | 25 | LAC | 82 | 2127 | 10.0 | -5.5 | -1.9 | -0.008 |
| **42** | Devean George | 23 | LAL | 59 | 593 | 6.2 | -7.6 | -0.8 | -0.023 |
| **42** | Marcus Fizer | 22 | CHI | 72 | 1580 | 11.0 | -6.1 | -1.6 | -0.022 |
| **43** | Chris Garner | 25 | GSW | 8 | 149 | 1.0 | -12.0 | -0.4 | -0.123 |
| **43** | Travis Knight | 26 | NYK | 45 | 256 | 0.9 | -8.6 | -0.4 | -0.049 |
| **43** | Dragan Tarlać | 27 | CHI | 43 | 598 | 5.6 | -7.3 | -0.8 | -0.016 |
| **43** | Eric Montross | 29 | DET/TOR | 54 | 649 | 5.4 | -6.7 | -0.8 | -0.001 |
| **43** | Hanno Möttölä | 24 | ATL | 73 | 989 | 7.5 | -6.6 | -1.1 | 0.018 |

## 2001-2002

440 rated player-seasons · 317 qualified (MP ≥ 500) · mean 61.3 · median 59 · range 39–97

- **Rating 90-100:** 12 players (2.7%)
- **Rating 80-90:** 33 players (7.5%)
- **Rating 70-80:** 63 players (14.3%)
- **Rating 60-70:** 101 players (23.0%)
- **Rating 50-60:** 163 players (37.0%)
- **Rating 40-50:** 66 players (15.0%)
- **Rating 30-40:** 2 players (0.5%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Tim Duncan | 25 | SAS | 82 | 3329 | 27.0 | 7.6 | 8.0 | 0.257 |
| **96** | Shaquille O'Neal | 29 | LAL | 67 | 2422 | 29.7 | 8.0 | 6.1 | 0.262 |
| **94** | Kevin Garnett | 25 | MIN | 81 | 3175 | 23.8 | 6.8 | 7.1 | 0.194 |
| **94** | Tracy McGrady | 22 | ORL | 76 | 2912 | 25.1 | 6.8 | 6.4 | 0.189 |
| **93** | Paul Pierce | 24 | BOS | 82 | 3302 | 22.3 | 5.9 | 6.6 | 0.187 |
| **93** | Dirk Nowitzki | 23 | DAL | 76 | 2891 | 24.1 | 5.5 | 5.5 | 0.222 |
| **92** | Gary Payton | 33 | SEA | 82 | 3301 | 22.9 | 5.1 | 5.9 | 0.183 |
| **92** | Kobe Bryant | 23 | LAL | 80 | 3063 | 23.2 | 4.6 | 5.2 | 0.199 |
| **92** | Elton Brand | 22 | LAC | 80 | 3020 | 23.6 | 4.3 | 4.8 | 0.216 |
| **91** | Brent Barry | 30 | SEA | 81 | 3040 | 19.3 | 5.5 | 5.8 | 0.191 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | John Amaechi | 31 | UTA | 54 | 586 | 5.4 | -8.2 | -0.9 | -0.056 |
| **39** | Chris Mihm | 22 | CLE | 74 | 1659 | 10.0 | -6.9 | -2.0 | 0.019 |
| **42** | Travis Knight | 27 | NYK | 49 | 429 | 5.3 | -8.7 | -0.7 | -0.015 |
| **42** | John Starks | 36 | UTA | 66 | 929 | 6.0 | -6.2 | -1.0 | -0.004 |
| **42** | Charles Oakley | 38 | CHI | 57 | 1383 | 6.6 | -5.1 | -1.1 | -0.016 |
| **43** | Felton Spencer | 34 | NYK | 32 | 248 | 0.8 | -9.9 | -0.5 | -0.013 |
| **43** | Dalibor Bagarić | 21 | CHI | 50 | 638 | 8.6 | -7.2 | -0.8 | -0.011 |
| **43** | Hanno Möttölä | 25 | ATL | 82 | 1371 | 8.4 | -5.4 | -1.2 | 0.019 |
| **43** | Ron Mercer | 25 | CHI/IND | 53 | 1716 | 10.2 | -4.6 | -1.1 | -0.032 |
| **43** | Grant Long | 35 | MEM | 66 | 1868 | 7.7 | -4.6 | -1.2 | 0.004 |

## 2002-2003

428 rated player-seasons · 313 qualified (MP ≥ 500) · mean 61.5 · median 59 · range 40–98

- **Rating 90-100:** 11 players (2.6%)
- **Rating 80-90:** 36 players (8.4%)
- **Rating 70-80:** 54 players (12.6%)
- **Rating 60-70:** 103 players (24.1%)
- **Rating 50-60:** 164 players (38.3%)
- **Rating 40-50:** 60 players (14.0%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Tracy McGrady | 23 | ORL | 75 | 2954 | 30.3 | 10.5 | 9.3 | 0.262 |
| **96** | Kevin Garnett | 26 | MIN | 82 | 3321 | 26.4 | 8.4 | 8.7 | 0.225 |
| **96** | Tim Duncan | 26 | SAS | 81 | 3181 | 26.9 | 7.6 | 7.7 | 0.248 |
| **95** | Kobe Bryant | 24 | LAL | 82 | 3401 | 26.2 | 7.1 | 7.7 | 0.210 |
| **95** | Dirk Nowitzki | 24 | DAL | 80 | 3117 | 25.6 | 7.2 | 7.3 | 0.249 |
| **95** | Shaquille O'Neal | 30 | LAL | 67 | 2535 | 29.5 | 6.5 | 5.5 | 0.250 |
| **92** | Shawn Marion | 24 | PHO | 81 | 3373 | 21.3 | 5.6 | 6.5 | 0.186 |
| **92** | Jason Kidd | 29 | NJN | 80 | 2989 | 22.2 | 6.6 | 6.5 | 0.182 |
| **90** | Paul Pierce | 25 | BOS | 79 | 3096 | 22.7 | 4.9 | 5.4 | 0.157 |
| **90** | Steve Nash | 28 | DAL | 82 | 2711 | 22.6 | 4.6 | 4.5 | 0.206 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Nikoloz Tskitishvili | 19 | DEN | 81 | 1320 | 4.9 | -5.5 | -1.2 | -0.035 |
| **41** | Ryan Humphrey | 23 | ORL/MEM | 48 | 444 | 4.1 | -9.3 | -0.8 | -0.052 |
| **41** | John Amaechi | 32 | UTA | 50 | 474 | 3.1 | -8.0 | -0.7 | -0.070 |
| **41** | Greg Foster | 34 | TOR | 29 | 539 | 4.7 | -8.7 | -0.9 | -0.025 |
| **41** | Junior Harrington | 22 | DEN | 82 | 2003 | 6.4 | -5.1 | -1.6 | -0.009 |
| **42** | Kareem Rush | 22 | LAL | 76 | 872 | 5.8 | -6.0 | -0.9 | -0.033 |
| **42** | Darvin Ham | 29 | ATL | 75 | 926 | 5.5 | -5.9 | -0.9 | -0.021 |
| **43** | Pat Burke | 29 | ORL | 62 | 783 | 8.3 | -6.6 | -0.9 | -0.021 |
| **44** | Antoine Rigaudeau | 31 | DAL | 11 | 91 | -2.4 | -14.7 | -0.3 | -0.192 |
| **44** | Kenny Satterfield | 21 | DEN/PHI | 39 | 502 | 4.8 | -4.8 | -0.4 | -0.091 |

## 2003-2004

442 rated player-seasons · 325 qualified (MP ≥ 500) · mean 61.4 · median 58 · range 39–98

- **Rating 90-100:** 10 players (2.3%)
- **Rating 80-90:** 39 players (8.8%)
- **Rating 70-80:** 64 players (14.5%)
- **Rating 60-70:** 85 players (19.2%)
- **Rating 50-60:** 183 players (41.4%)
- **Rating 40-50:** 60 players (13.6%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Kevin Garnett | 27 | MIN | 82 | 3231 | 29.4 | 10.2 | 10.0 | 0.272 |
| **96** | Tim Duncan | 27 | SAS | 69 | 2527 | 27.1 | 8.5 | 6.7 | 0.249 |
| **95** | Andrei Kirilenko | 22 | UTA | 78 | 2895 | 22.6 | 7.9 | 7.2 | 0.192 |
| **93** | Tracy McGrady | 24 | ORL | 67 | 2675 | 25.3 | 6.4 | 5.7 | 0.151 |
| **92** | Kobe Bryant | 25 | LAL | 65 | 2447 | 23.7 | 5.6 | 4.7 | 0.210 |
| **91** | Peja Stojaković | 26 | SAC | 81 | 3264 | 21.8 | 3.9 | 4.9 | 0.198 |
| **91** | Sam Cassell | 34 | MIN | 81 | 2838 | 22.8 | 4.4 | 4.6 | 0.205 |
| **91** | Shaquille O'Neal | 31 | LAL | 67 | 2464 | 24.4 | 4.8 | 4.1 | 0.192 |
| **90** | Dirk Nowitzki | 25 | DAL | 77 | 2915 | 22.5 | 3.8 | 4.3 | 0.190 |
| **90** | Elton Brand | 24 | LAC | 69 | 2670 | 23.2 | 4.0 | 4.0 | 0.174 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Michael Curry | 35 | TOR | 70 | 1229 | 3.6 | -6.2 | -1.3 | 0.013 |
| **41** | Britton Johnsen | 24 | ORL | 20 | 290 | 2.6 | -7.8 | -0.4 | -0.096 |
| **42** | Brandon Armstrong | 23 | NJN | 56 | 434 | 5.5 | -7.5 | -0.6 | -0.030 |
| **42** | Milt Palacio | 25 | TOR | 59 | 1211 | 7.4 | -4.9 | -0.9 | -0.020 |
| **43** | Doug Overton | 34 | NJN/LAC | 61 | 1033 | 7.5 | -4.9 | -0.8 | -0.016 |
| **43** | Jacque Vaughn | 28 | ATL | 71 | 1271 | 8.0 | -5.0 | -1.0 | -0.002 |
| **43** | Jared Jeffries | 22 | WAS | 82 | 1913 | 8.7 | -4.6 | -1.2 | 0.014 |
| **44** | Reece Gaines | 23 | ORL | 38 | 364 | 6.1 | -6.1 | -0.4 | -0.065 |
| **44** | J.R. Bremer | 23 | CLE/GSW | 36 | 443 | 6.2 | -5.2 | -0.4 | -0.053 |
| **44** | Žarko Čabarkapa | 22 | PHO | 49 | 570 | 8.4 | -5.7 | -0.5 | -0.037 |

## 2004-2005

464 rated player-seasons · 336 qualified (MP ≥ 500) · mean 61.1 · median 58 · range 41–97

- **Rating 90-100:** 17 players (3.7%)
- **Rating 80-90:** 29 players (6.2%)
- **Rating 70-80:** 64 players (13.8%)
- **Rating 60-70:** 106 players (22.8%)
- **Rating 50-60:** 172 players (37.1%)
- **Rating 40-50:** 76 players (16.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Kevin Garnett | 28 | MIN | 82 | 3121 | 28.2 | 9.5 | 9.1 | 0.248 |
| **96** | LeBron James | 20 | CLE | 80 | 3388 | 25.7 | 8.6 | 9.1 | 0.203 |
| **96** | Dirk Nowitzki | 26 | DAL | 78 | 3020 | 26.1 | 7.3 | 7.1 | 0.248 |
| **95** | Tim Duncan | 28 | SAS | 66 | 2203 | 27.0 | 7.6 | 5.4 | 0.245 |
| **94** | Tracy McGrady | 25 | HOU | 78 | 3182 | 22.9 | 6.7 | 6.9 | 0.180 |
| **93** | Amar'e Stoudemire | 22 | PHO | 80 | 2889 | 26.6 | 4.4 | 4.7 | 0.243 |
| **93** | Shaquille O'Neal | 32 | MIA | 73 | 2492 | 27.0 | 5.3 | 4.6 | 0.211 |
| **93** | Manu Ginóbili | 27 | SAS | 74 | 2193 | 22.3 | 6.9 | 4.9 | 0.240 |
| **92** | Vince Carter | 28 | TOR/NJN | 77 | 2828 | 22.9 | 6.0 | 5.7 | 0.159 |
| **92** | Andrei Kirilenko | 23 | UTA | 41 | 1349 | 24.4 | 9.2 | 3.8 | 0.197 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **41** | Theron Smith | 24 | CHA | 33 | 510 | 5.2 | -7.5 | -0.7 | -0.040 |
| **42** | Rafael Araújo | 24 | TOR | 59 | 736 | 7.1 | -7.4 | -1.0 | 0.016 |
| **42** | Sebastian Telfair | 19 | POR | 68 | 1330 | 9.7 | -5.9 | -1.3 | -0.013 |
| **43** | Aleksandar Radojević | 28 | UTA | 12 | 128 | -1.5 | -11.6 | -0.3 | -0.117 |
| **43** | Vin Baker | 33 | NYK/HOU | 27 | 204 | 1.4 | -9.6 | -0.4 | -0.091 |
| **43** | Nikoloz Tskitishvili | 21 | DEN/GSW | 35 | 220 | 2.7 | -8.0 | -0.3 | -0.109 |
| **43** | Matt Freije | 23 | NOH | 23 | 441 | 4.1 | -6.2 | -0.4 | -0.052 |
| **43** | Jason Collier | 27 | ATL | 70 | 942 | 11.0 | -6.7 | -1.1 | 0.000 |
| **44** | Moochie Norris | 31 | NYK/HOU | 38 | 360 | 6.1 | -6.6 | -0.4 | -0.056 |
| **45** | Ha Seung-Jin | 19 | POR | 19 | 104 | 2.5 | -12.2 | -0.3 | -0.094 |

## 2005-2006

457 rated player-seasons · 323 qualified (MP ≥ 500) · mean 61.0 · median 58 · range 40–97

- **Rating 90-100:** 17 players (3.7%)
- **Rating 80-90:** 27 players (5.9%)
- **Rating 70-80:** 53 players (11.6%)
- **Rating 60-70:** 111 players (24.3%)
- **Rating 50-60:** 183 players (40.0%)
- **Rating 40-50:** 66 players (14.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | LeBron James | 21 | CLE | 79 | 3361 | 28.1 | 9.1 | 9.4 | 0.232 |
| **96** | Kobe Bryant | 27 | LAL | 80 | 3277 | 28.0 | 7.6 | 8.0 | 0.224 |
| **96** | Dirk Nowitzki | 27 | DAL | 81 | 3089 | 28.1 | 8.1 | 7.9 | 0.275 |
| **95** | Kevin Garnett | 29 | MIN | 76 | 2957 | 26.8 | 7.8 | 7.4 | 0.242 |
| **95** | Dwyane Wade | 24 | MIA | 75 | 2892 | 27.6 | 7.7 | 7.1 | 0.239 |
| **94** | Elton Brand | 26 | LAC | 79 | 3099 | 26.5 | 6.7 | 6.8 | 0.229 |
| **94** | Chauncey Billups | 29 | DET | 81 | 2925 | 23.4 | 6.2 | 6.1 | 0.254 |
| **92** | Gilbert Arenas | 24 | WAS | 80 | 3384 | 23.8 | 5.4 | 6.3 | 0.193 |
| **92** | Shawn Marion | 27 | PHO | 81 | 3263 | 23.6 | 4.8 | 5.6 | 0.214 |
| **91** | Pau Gasol | 25 | MEM | 80 | 3135 | 22.7 | 5.5 | 6.0 | 0.184 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Rafael Araújo | 25 | TOR | 52 | 601 | 4.5 | -7.7 | -0.9 | -0.066 |
| **41** | Antoine Wright | 21 | NJN | 39 | 370 | 0.7 | -8.8 | -0.6 | -0.062 |
| **41** | Jerome James | 30 | NYK | 45 | 406 | 6.3 | -9.3 | -0.8 | -0.062 |
| **42** | Jim Jackson | 35 | PHO/LAL | 40 | 512 | 3.0 | -6.5 | -0.6 | -0.078 |
| **43** | Antonio Burks | 25 | MEM | 57 | 570 | 5.1 | -6.8 | -0.7 | -0.033 |
| **43** | Maurice Taylor | 29 | NYK | 67 | 1210 | 8.5 | -5.7 | -1.1 | -0.021 |
| **43** | Desmond Mason | 28 | NOK | 70 | 2102 | 9.2 | -4.9 | -1.5 | -0.005 |
| **44** | Esteban Batista | 22 | ATL | 57 | 495 | 7.1 | -7.9 | -0.7 | 0.011 |
| **45** | Gordan Giriček | 28 | UTA | 37 | 956 | 8.7 | -5.6 | -0.9 | -0.010 |
| **45** | Justin Reed | 24 | BOS/MIN | 72 | 997 | 7.9 | -5.8 | -0.9 | 0.021 |

## 2006-2007

458 rated player-seasons · 328 qualified (MP ≥ 500) · mean 61.0 · median 59 · range 37–97

- **Rating 90-100:** 15 players (3.3%)
- **Rating 80-90:** 32 players (7.0%)
- **Rating 70-80:** 57 players (12.4%)
- **Rating 60-70:** 110 players (24.0%)
- **Rating 50-60:** 167 players (36.5%)
- **Rating 40-50:** 75 players (16.4%)
- **Rating 30-40:** 2 players (0.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Dirk Nowitzki | 28 | DAL | 78 | 2820 | 27.6 | 8.3 | 7.4 | 0.278 |
| **96** | LeBron James | 22 | CLE | 78 | 3190 | 24.5 | 8.1 | 8.1 | 0.206 |
| **95** | Tim Duncan | 30 | SAS | 80 | 2726 | 26.1 | 7.0 | 6.2 | 0.230 |
| **95** | Dwyane Wade | 25 | MIA | 51 | 1931 | 28.9 | 8.2 | 4.9 | 0.219 |
| **94** | Kobe Bryant | 28 | LAL | 77 | 3140 | 26.1 | 5.9 | 6.1 | 0.199 |
| **94** | Manu Ginóbili | 29 | SAS | 75 | 2060 | 24.1 | 7.8 | 5.1 | 0.246 |
| **93** | Steve Nash | 32 | PHO | 76 | 2682 | 23.8 | 5.9 | 5.3 | 0.225 |
| **92** | Kevin Garnett | 30 | MIN | 76 | 2995 | 24.1 | 5.4 | 5.5 | 0.171 |
| **91** | Gilbert Arenas | 25 | WAS | 74 | 2942 | 24.0 | 4.7 | 5.0 | 0.177 |
| **91** | Tracy McGrady | 27 | HOU | 71 | 2539 | 23.2 | 6.1 | 5.2 | 0.163 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Jason Collins | 28 | NJN | 80 | 1844 | 3.0 | -5.8 | -1.8 | 0.015 |
| **38** | Adam Morrison | 22 | CHA | 78 | 2326 | 7.9 | -5.1 | -1.8 | -0.030 |
| **41** | C.J. Miles | 19 | UTA | 37 | 373 | 2.8 | -7.3 | -0.5 | -0.062 |
| **43** | Maurice Ager | 22 | DAL | 32 | 214 | 2.9 | -8.7 | -0.4 | -0.060 |
| **43** | Jerome James | 31 | NYK | 41 | 273 | 5.1 | -8.9 | -0.5 | -0.031 |
| **43** | Justin Reed | 25 | MIN | 41 | 318 | 6.3 | -8.3 | -0.5 | -0.037 |
| **43** | Speedy Claxton | 28 | ATL | 42 | 1054 | 7.3 | -4.5 | -0.7 | -0.034 |
| **43** | Willie Green | 25 | PHI | 74 | 1842 | 10.3 | -4.7 | -1.2 | -0.018 |
| **44** | Cedric Bozeman | 23 | ATL | 23 | 199 | -0.1 | -7.3 | -0.3 | -0.077 |
| **44** | Earl Barron | 25 | MIA | 28 | 203 | 6.6 | -9.6 | -0.4 | -0.062 |

## 2007-2008

451 rated player-seasons · 324 qualified (MP ≥ 500) · mean 61.4 · median 58 · range 40–97

- **Rating 90-100:** 10 players (2.2%)
- **Rating 80-90:** 40 players (8.9%)
- **Rating 70-80:** 61 players (13.5%)
- **Rating 60-70:** 98 players (21.7%)
- **Rating 50-60:** 174 players (38.6%)
- **Rating 40-50:** 68 players (15.1%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | LeBron James | 23 | CLE | 75 | 3027 | 29.1 | 10.9 | 9.8 | 0.242 |
| **97** | Chris Paul | 22 | NOH | 80 | 3006 | 28.3 | 10.4 | 9.3 | 0.284 |
| **95** | Kevin Garnett | 31 | BOS | 71 | 2328 | 25.3 | 8.2 | 6.0 | 0.265 |
| **94** | Chauncey Billups | 31 | DET | 78 | 2522 | 23.6 | 7.7 | 6.2 | 0.257 |
| **94** | Manu Ginóbili | 30 | SAS | 74 | 2299 | 24.3 | 8.3 | 6.0 | 0.232 |
| **93** | Kobe Bryant | 29 | LAL | 82 | 3192 | 24.2 | 5.8 | 6.3 | 0.208 |
| **93** | Dirk Nowitzki | 29 | DAL | 77 | 2769 | 24.6 | 6.6 | 6.0 | 0.223 |
| **93** | Amar'e Stoudemire | 25 | PHO | 79 | 2677 | 27.6 | 4.8 | 4.6 | 0.262 |
| **91** | Tim Duncan | 31 | SAS | 78 | 2651 | 24.4 | 5.2 | 4.8 | 0.201 |
| **90** | Paul Pierce | 30 | BOS | 80 | 2874 | 19.6 | 4.8 | 5.0 | 0.207 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Jamaal Magloire | 29 | NJN/DAL | 31 | 286 | 1.4 | -10.8 | -0.6 | -0.109 |
| **40** | Jason Collins | 29 | NJN/MEM | 74 | 1172 | 3.4 | -6.7 | -1.4 | 0.005 |
| **42** | Mardy Collins | 23 | NYK | 46 | 634 | 5.9 | -6.4 | -0.7 | -0.079 |
| **42** | Earl Barron | 26 | MIA | 46 | 889 | 9.4 | -7.2 | -1.2 | -0.019 |
| **43** | Maurice Ager | 23 | DAL/NJN | 26 | 165 | 1.8 | -11.1 | -0.4 | -0.114 |
| **43** | Malik Rose | 33 | NYK | 49 | 494 | 7.3 | -7.5 | -0.7 | -0.052 |
| **43** | Nenad Krstić | 24 | NJN | 45 | 812 | 8.5 | -6.7 | -1.0 | -0.007 |
| **43** | Jeff McInnis | 33 | CHA | 54 | 1410 | 6.5 | -5.4 | -1.2 | 0.002 |
| **43** | Daequan Cook | 20 | MIA | 59 | 1441 | 7.9 | -5.2 | -1.2 | -0.013 |
| **44** | Mark Madsen | 32 | MIN | 20 | 151 | 0.2 | -10.6 | -0.3 | -0.102 |

## 2008-2009

445 rated player-seasons · 329 qualified (MP ≥ 500) · mean 61.5 · median 59 · range 40–99

- **Rating 90-100:** 8 players (1.8%)
- **Rating 80-90:** 33 players (7.4%)
- **Rating 70-80:** 73 players (16.4%)
- **Rating 60-70:** 98 players (22.0%)
- **Rating 50-60:** 159 players (35.7%)
- **Rating 40-50:** 74 players (16.6%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | LeBron James | 24 | CLE | 81 | 3054 | 31.7 | 13.2 | 11.8 | 0.318 |
| **98** | Dwyane Wade | 27 | MIA | 79 | 3048 | 30.4 | 10.6 | 9.6 | 0.232 |
| **98** | Chris Paul | 23 | NOH | 78 | 3002 | 30.0 | 11.0 | 9.9 | 0.292 |
| **94** | Brandon Roy | 24 | POR | 78 | 2903 | 24.0 | 6.2 | 6.0 | 0.223 |
| **93** | Kobe Bryant | 30 | LAL | 82 | 2960 | 24.4 | 5.9 | 5.9 | 0.206 |
| **92** | Dwight Howard | 23 | ORL | 79 | 2821 | 25.4 | 4.5 | 4.7 | 0.234 |
| **91** | Pau Gasol | 28 | LAL | 81 | 2999 | 22.2 | 4.5 | 5.0 | 0.223 |
| **91** | Tim Duncan | 32 | SAS | 75 | 2524 | 24.4 | 5.4 | 4.7 | 0.191 |
| **89** | Dirk Nowitzki | 30 | DAL | 81 | 3050 | 23.1 | 3.4 | 4.2 | 0.171 |
| **88** | Danny Granger | 25 | IND | 67 | 2424 | 21.8 | 4.8 | 4.2 | 0.158 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Donté Greene | 20 | SAC | 55 | 725 | 5.2 | -6.8 | -0.9 | -0.074 |
| **41** | Jake Voskuhl | 31 | TOR | 38 | 240 | 0.4 | -10.9 | -0.5 | -0.064 |
| **42** | Ricky Davis | 29 | LAC | 36 | 785 | 7.1 | -6.3 | -0.9 | -0.027 |
| **43** | Jason Collins | 30 | MIN | 31 | 422 | 3.3 | -7.2 | -0.6 | -0.018 |
| **43** | Malik Rose | 34 | NYK/OKC | 38 | 470 | 5.3 | -7.1 | -0.6 | -0.039 |
| **44** | Stephon Marbury | 31 | BOS | 23 | 414 | 4.4 | -6.1 | -0.4 | -0.038 |
| **44** | DeShawn Stevenson | 27 | WAS | 32 | 886 | 6.9 | -4.7 | -0.6 | -0.032 |
| **44** | Bobby Brown | 24 | SAC/MIN | 68 | 931 | 8.9 | -5.0 | -0.7 | -0.029 |
| **44** | Desmond Mason | 31 | OKC | 39 | 1064 | 7.1 | -5.1 | -0.8 | -0.012 |
| **44** | Earl Watson | 29 | OKC | 68 | 1776 | 9.5 | -4.6 | -1.2 | -0.005 |

## 2009-2010

441 rated player-seasons · 331 qualified (MP ≥ 500) · mean 61.5 · median 59 · range 39–99

- **Rating 90-100:** 11 players (2.5%)
- **Rating 80-90:** 32 players (7.3%)
- **Rating 70-80:** 68 players (15.4%)
- **Rating 60-70:** 104 players (23.6%)
- **Rating 50-60:** 160 players (36.3%)
- **Rating 40-50:** 65 players (14.7%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | LeBron James | 25 | CLE | 76 | 2966 | 31.1 | 11.8 | 10.3 | 0.299 |
| **97** | Dwyane Wade | 28 | MIA | 77 | 2792 | 28.0 | 9.2 | 7.9 | 0.224 |
| **96** | Kevin Durant | 21 | OKC | 82 | 3239 | 26.2 | 7.1 | 7.5 | 0.238 |
| **93** | Tim Duncan | 33 | SAS | 78 | 2438 | 24.7 | 6.1 | 5.0 | 0.215 |
| **93** | Manu Ginóbili | 32 | SAS | 75 | 2150 | 22.5 | 6.7 | 4.7 | 0.216 |
| **92** | Dwight Howard | 24 | ORL | 82 | 2843 | 24.0 | 4.4 | 4.6 | 0.223 |
| **91** | Dirk Nowitzki | 31 | DAL | 81 | 3039 | 22.9 | 4.2 | 4.7 | 0.194 |
| **91** | Pau Gasol | 29 | LAL | 65 | 2403 | 22.9 | 4.9 | 4.2 | 0.220 |
| **91** | Chris Paul | 24 | NOH | 45 | 1712 | 23.7 | 6.2 | 3.5 | 0.204 |
| **90** | Josh Smith | 24 | ATL | 81 | 2871 | 21.0 | 5.1 | 5.1 | 0.155 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Sasha Pavlović | 26 | MIN | 71 | 877 | 5.4 | -6.2 | -0.9 | -0.063 |
| **40** | DeShawn Stevenson | 28 | WAS/DAL | 64 | 883 | 3.3 | -5.6 | -0.8 | -0.022 |
| **41** | Quinton Ross | 28 | DAL/WAS | 52 | 562 | 3.0 | -6.4 | -0.6 | -0.008 |
| **42** | Trenton Hassell | 30 | NJN | 52 | 1106 | 6.5 | -5.3 | -0.9 | -0.003 |
| **43** | Eddy Curry | 27 | NYK | 7 | 62 | -1.9 | -18.5 | -0.3 | -0.258 |
| **43** | Lindsey Hunter | 39 | CHI | 13 | 122 | -2.2 | -12.0 | -0.3 | -0.117 |
| **43** | Darnell Jackson | 24 | CLE/MIL | 28 | 123 | -0.1 | -11.8 | -0.3 | -0.104 |
| **43** | Mardy Collins | 25 | LAC | 43 | 470 | 5.7 | -5.8 | -0.4 | -0.049 |
| **43** | Josh Powell | 27 | LAL | 63 | 581 | 6.7 | -6.3 | -0.6 | 0.001 |
| **44** | Dominic McGuire | 24 | WAS/SAC | 51 | 307 | 3.8 | -6.2 | -0.3 | -0.038 |

## 2010-2011

452 rated player-seasons · 338 qualified (MP ≥ 500) · mean 61.4 · median 59 · range 38–97

- **Rating 90-100:** 13 players (2.9%)
- **Rating 80-90:** 35 players (7.7%)
- **Rating 70-80:** 66 players (14.6%)
- **Rating 60-70:** 105 players (23.2%)
- **Rating 50-60:** 169 players (37.4%)
- **Rating 40-50:** 62 players (13.7%)
- **Rating 30-40:** 2 players (0.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | LeBron James | 26 | MIA | 79 | 3063 | 27.3 | 8.1 | 7.8 | 0.244 |
| **95** | Derrick Rose | 22 | CHI | 81 | 3026 | 23.5 | 6.8 | 6.7 | 0.208 |
| **95** | Chris Paul | 25 | NOH | 80 | 2880 | 23.7 | 7.1 | 6.7 | 0.232 |
| **95** | Dwyane Wade | 29 | MIA | 76 | 2823 | 25.6 | 6.6 | 6.1 | 0.218 |
| **94** | Dwight Howard | 25 | ORL | 78 | 2935 | 26.1 | 5.3 | 5.4 | 0.235 |
| **93** | Pau Gasol | 30 | LAL | 82 | 3037 | 23.3 | 4.8 | 5.2 | 0.232 |
| **92** | Kevin Durant | 22 | OKC | 78 | 3038 | 23.6 | 4.9 | 5.3 | 0.189 |
| **92** | Kobe Bryant | 32 | LAL | 82 | 2779 | 23.9 | 5.2 | 5.0 | 0.178 |
| **92** | Kevin Love | 22 | MIN | 73 | 2611 | 24.3 | 4.4 | 4.2 | 0.210 |
| **92** | Dirk Nowitzki | 32 | DAL | 73 | 2504 | 23.4 | 5.1 | 4.5 | 0.213 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Stephen Graham | 28 | NJN | 59 | 959 | 4.4 | -6.8 | -1.2 | -0.014 |
| **39** | Jonny Flynn | 21 | MIN | 53 | 983 | 7.1 | -6.3 | -1.1 | -0.064 |
| **40** | Ronnie Price | 27 | UTA | 59 | 717 | 5.5 | -6.3 | -0.8 | -0.048 |
| **41** | Josh Powell | 28 | ATL | 54 | 653 | 8.0 | -7.3 | -0.9 | -0.012 |
| **42** | Avery Bradley | 20 | BOS | 31 | 162 | 2.2 | -11.1 | -0.4 | -0.139 |
| **42** | Jawad Williams | 27 | CLE | 26 | 391 | 4.8 | -6.8 | -0.5 | -0.067 |
| **42** | Kyrylo Fesenko | 24 | UTA | 53 | 456 | 5.8 | -7.4 | -0.6 | -0.011 |
| **43** | Luke Babbitt | 21 | POR | 24 | 137 | 1.0 | -10.8 | -0.3 | -0.143 |
| **43** | DaJuan Summers | 23 | DET | 22 | 199 | 4.4 | -9.5 | -0.4 | -0.083 |
| **43** | Earl Barron | 29 | PHO/MIL/POR | 21 | 305 | 6.2 | -8.1 | -0.5 | -0.039 |

## 2011-2012

478 rated player-seasons · 331 qualified (MP ≥ 500) · mean 60.7 · median 58 · range 37–98

- **Rating 90-100:** 5 players (1.0%)
- **Rating 80-90:** 41 players (8.6%)
- **Rating 70-80:** 68 players (14.2%)
- **Rating 60-70:** 94 players (19.7%)
- **Rating 50-60:** 190 players (39.7%)
- **Rating 40-50:** 79 players (16.5%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | LeBron James | 27 | MIA | 62 | 2326 | 30.7 | 10.9 | 7.6 | 0.298 |
| **96** | Chris Paul | 26 | LAC | 60 | 2181 | 27.0 | 9.2 | 6.1 | 0.278 |
| **95** | Kevin Durant | 23 | OKC | 66 | 2546 | 26.2 | 7.0 | 5.8 | 0.230 |
| **93** | Dwyane Wade | 30 | MIA | 49 | 1625 | 26.3 | 7.9 | 4.0 | 0.227 |
| **92** | Kevin Love | 23 | MIN | 55 | 2145 | 25.4 | 5.2 | 3.9 | 0.223 |
| **89** | Blake Griffin | 22 | LAC | 66 | 2392 | 23.4 | 3.7 | 3.4 | 0.185 |
| **89** | Dwight Howard | 26 | ORL | 54 | 2070 | 24.2 | 4.3 | 3.3 | 0.179 |
| **89** | James Harden | 22 | OKC | 62 | 1946 | 21.1 | 4.3 | 3.1 | 0.230 |
| **89** | Derrick Rose | 23 | CHI | 39 | 1375 | 23.0 | 6.4 | 2.9 | 0.211 |
| **88** | Ryan Anderson | 23 | ORL | 61 | 1964 | 21.2 | 4.0 | 3.0 | 0.219 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Cory Higgins | 22 | CHA | 38 | 423 | 4.1 | -10.4 | -0.9 | -0.150 |
| **40** | Matt Carroll | 31 | CHA | 53 | 596 | 5.6 | -7.4 | -0.8 | -0.051 |
| **40** | Norris Cole | 23 | MIA | 65 | 1260 | 7.9 | -6.3 | -1.4 | 0.000 |
| **41** | Jeremy Pargo | 25 | MEM | 44 | 424 | 4.4 | -7.6 | -0.6 | -0.085 |
| **41** | Tyrus Thomas | 25 | CHA | 54 | 1013 | 9.0 | -6.0 | -1.0 | -0.029 |
| **42** | Larry Hughes | 33 | ORL | 9 | 114 | -4.8 | -11.9 | -0.3 | -0.193 |
| **42** | Josh Selby | 20 | MEM | 28 | 237 | 3.3 | -8.8 | -0.4 | -0.105 |
| **42** | Luke Walton | 31 | LAL/CLE | 30 | 364 | 3.4 | -7.1 | -0.5 | -0.050 |
| **42** | Jamaal Magloire | 33 | TOR | 34 | 374 | 2.7 | -7.6 | -0.5 | -0.021 |
| **42** | Shawne Williams | 25 | NJN | 25 | 514 | 4.9 | -6.4 | -0.6 | -0.041 |

## 2012-2013

468 rated player-seasons · 344 qualified (MP ≥ 500) · mean 61.4 · median 60 · range 37–99

- **Rating 90-100:** 11 players (2.4%)
- **Rating 80-90:** 37 players (7.9%)
- **Rating 70-80:** 70 players (15.0%)
- **Rating 60-70:** 116 players (24.8%)
- **Rating 50-60:** 158 players (33.8%)
- **Rating 40-50:** 75 players (16.0%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | LeBron James | 28 | MIA | 76 | 2877 | 31.6 | 11.7 | 9.9 | 0.322 |
| **98** | Kevin Durant | 24 | OKC | 81 | 3119 | 28.3 | 9.3 | 8.9 | 0.291 |
| **96** | Chris Paul | 27 | LAC | 70 | 2335 | 26.4 | 8.8 | 6.4 | 0.287 |
| **93** | James Harden | 23 | HOU | 78 | 2985 | 22.9 | 5.6 | 5.8 | 0.206 |
| **92** | Stephen Curry | 24 | GSW | 78 | 2983 | 21.3 | 5.4 | 5.6 | 0.180 |
| **91** | Kobe Bryant | 34 | LAL | 78 | 3013 | 23.0 | 4.6 | 5.0 | 0.174 |
| **91** | Russell Westbrook | 24 | OKC | 82 | 2861 | 23.9 | 4.4 | 4.6 | 0.195 |
| **91** | Marc Gasol | 28 | MEM | 80 | 2796 | 19.5 | 5.2 | 5.1 | 0.197 |
| **90** | Carmelo Anthony | 28 | NYK | 67 | 2482 | 24.8 | 4.3 | 3.9 | 0.184 |
| **90** | Dwyane Wade | 31 | MIA | 69 | 2391 | 24.0 | 4.4 | 3.8 | 0.192 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **37** | Austin Rivers | 20 | NOH | 61 | 1418 | 5.9 | -6.2 | -1.5 | -0.038 |
| **40** | Terrel Harris | 25 | MIA/NOH | 20 | 137 | -3.8 | -12.6 | -0.4 | -0.219 |
| **41** | Doron Lamb | 21 | MIL/ORL | 47 | 577 | 4.8 | -7.3 | -0.8 | -0.032 |
| **41** | Kevin Séraphin | 23 | WAS | 79 | 1721 | 10.3 | -5.5 | -1.5 | 0.004 |
| **42** | Jared Jeffries | 31 | POR | 38 | 350 | 2.4 | -7.4 | -0.5 | -0.042 |
| **42** | Brendan Haywood | 33 | CHA | 61 | 1162 | 8.7 | -6.0 | -1.2 | 0.006 |
| **42** | Michael Beasley | 24 | PHO | 75 | 1554 | 10.8 | -4.7 | -1.1 | -0.047 |
| **43** | Maalik Wayns | 21 | PHI/LAC | 27 | 202 | 5.0 | -9.9 | -0.4 | -0.079 |
| **43** | Dahntay Jones | 32 | DAL/ATL | 78 | 1016 | 6.4 | -5.5 | -0.9 | 0.026 |
| **43** | Norris Cole | 24 | MIA | 80 | 1590 | 7.9 | -4.9 | -1.2 | 0.019 |

## 2013-2014

482 rated player-seasons · 337 qualified (MP ≥ 500) · mean 60.7 · median 58 · range 39–98

- **Rating 90-100:** 14 players (2.9%)
- **Rating 80-90:** 29 players (6.0%)
- **Rating 70-80:** 64 players (13.3%)
- **Rating 60-70:** 114 players (23.7%)
- **Rating 50-60:** 187 players (38.8%)
- **Rating 40-50:** 73 players (15.1%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Kevin Durant | 25 | OKC | 81 | 3122 | 29.8 | 10.2 | 9.6 | 0.295 |
| **97** | LeBron James | 29 | MIA | 77 | 2902 | 29.3 | 8.8 | 7.9 | 0.264 |
| **97** | Kevin Love | 25 | MIN | 77 | 2797 | 26.9 | 8.9 | 7.7 | 0.245 |
| **96** | Chris Paul | 28 | LAC | 62 | 2171 | 25.9 | 8.6 | 5.8 | 0.270 |
| **95** | Stephen Curry | 25 | GSW | 78 | 2846 | 24.1 | 7.4 | 6.7 | 0.225 |
| **93** | James Harden | 24 | HOU | 73 | 2777 | 23.5 | 5.6 | 5.3 | 0.221 |
| **92** | Carmelo Anthony | 29 | NYK | 77 | 2982 | 24.4 | 5.0 | 5.3 | 0.172 |
| **92** | Blake Griffin | 24 | LAC | 80 | 2863 | 23.9 | 4.5 | 4.7 | 0.205 |
| **92** | Anthony Davis | 20 | NOP | 67 | 2358 | 26.5 | 4.8 | 4.0 | 0.212 |
| **91** | Joakim Noah | 28 | CHI | 80 | 2820 | 20.0 | 5.3 | 5.2 | 0.190 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Dennis Schröder | 20 | ATL | 49 | 641 | 5.8 | -7.3 | -0.9 | -0.054 |
| **40** | Marquis Teague | 20 | CHI/BRK | 40 | 443 | 3.8 | -7.4 | -0.6 | -0.059 |
| **40** | Anthony Bennett | 20 | CLE | 52 | 663 | 6.9 | -7.4 | -0.9 | -0.028 |
| **41** | John Lucas III | 31 | UTA | 42 | 591 | 5.2 | -5.9 | -0.6 | -0.058 |
| **42** | Tyshawn Taylor | 23 | BRK | 23 | 270 | 5.4 | -8.7 | -0.5 | -0.098 |
| **42** | Diante Garrett | 25 | UTA | 71 | 1048 | 7.1 | -4.6 | -0.7 | -0.036 |
| **42** | Elliot Williams | 24 | PHI | 67 | 1157 | 8.7 | -5.6 | -1.1 | 0.014 |
| **43** | Nemanja Nedović | 22 | GSW | 24 | 142 | -1.7 | -10.0 | -0.3 | -0.132 |
| **43** | Gal Mekel | 25 | DAL | 31 | 292 | 5.4 | -7.6 | -0.4 | -0.073 |
| **43** | Brandon Rush | 28 | UTA | 38 | 418 | 4.1 | -5.6 | -0.4 | -0.050 |

## 2014-2015

492 rated player-seasons · 366 qualified (MP ≥ 500) · mean 61.3 · median 59 · range 40–98

- **Rating 90-100:** 12 players (2.4%)
- **Rating 80-90:** 34 players (6.9%)
- **Rating 70-80:** 65 players (13.2%)
- **Rating 60-70:** 123 players (25.0%)
- **Rating 50-60:** 179 players (36.4%)
- **Rating 40-50:** 79 players (16.1%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Stephen Curry | 26 | GSW | 80 | 2613 | 28.0 | 9.9 | 7.9 | 0.288 |
| **97** | James Harden | 25 | HOU | 81 | 2981 | 26.7 | 8.8 | 8.1 | 0.265 |
| **97** | Chris Paul | 29 | LAC | 82 | 2857 | 26.0 | 8.0 | 7.2 | 0.270 |
| **97** | Anthony Davis | 21 | NOP | 68 | 2455 | 30.8 | 8.9 | 6.7 | 0.274 |
| **96** | Russell Westbrook | 26 | OKC | 67 | 2302 | 29.1 | 8.1 | 5.8 | 0.222 |
| **94** | LeBron James | 30 | CLE | 69 | 2493 | 25.9 | 7.1 | 5.7 | 0.199 |
| **92** | Kevin Durant | 26 | OKC | 27 | 913 | 27.6 | 10.0 | 2.8 | 0.252 |
| **91** | Marc Gasol | 30 | MEM | 81 | 2687 | 21.7 | 5.1 | 4.8 | 0.182 |
| **91** | Kawhi Leonard | 23 | SAS | 64 | 2033 | 22.0 | 5.9 | 4.1 | 0.204 |
| **90** | Damian Lillard | 24 | POR | 82 | 2925 | 20.7 | 4.7 | 4.9 | 0.174 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Johnny O'Bryant | 21 | MIL | 34 | 368 | 3.8 | -9.5 | -0.7 | -0.063 |
| **40** | Lance Thomas | 26 | OKC/NYK | 62 | 1490 | 8.0 | -5.6 | -1.3 | -0.014 |
| **41** | Adreian Payne | 23 | ATL/MIN | 32 | 739 | 7.7 | -6.9 | -0.9 | -0.033 |
| **41** | Danté Exum | 19 | UTA | 82 | 1817 | 5.7 | -4.3 | -1.1 | -0.003 |
| **42** | Larry Drew II | 24 | PHI | 12 | 219 | 4.5 | -9.9 | -0.4 | -0.087 |
| **42** | Gary Harris | 20 | DEN | 55 | 719 | 4.9 | -5.3 | -0.6 | -0.046 |
| **42** | Kendrick Perkins | 30 | OKC/CLE | 68 | 1148 | 7.0 | -5.4 | -1.0 | 0.006 |
| **42** | Lance Stephenson | 24 | CHO | 61 | 1573 | 8.8 | -4.5 | -1.0 | -0.026 |
| **42** | Zach LaVine | 19 | MIN | 77 | 1902 | 11.3 | -4.6 | -1.3 | -0.018 |
| **43** | Ricky Ledo | 22 | DAL/NYK | 17 | 244 | 6.3 | -8.1 | -0.4 | -0.112 |

## 2015-2016

476 rated player-seasons · 350 qualified (MP ≥ 500) · mean 61.5 · median 60 · range 40–99

- **Rating 90-100:** 10 players (2.1%)
- **Rating 80-90:** 33 players (6.9%)
- **Rating 70-80:** 66 players (13.9%)
- **Rating 60-70:** 134 players (28.2%)
- **Rating 50-60:** 172 players (36.1%)
- **Rating 40-50:** 61 players (12.8%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | Stephen Curry | 27 | GSW | 79 | 2700 | 31.5 | 11.9 | 9.5 | 0.318 |
| **97** | Kevin Durant | 27 | OKC | 72 | 2578 | 28.2 | 9.9 | 7.8 | 0.270 |
| **96** | Russell Westbrook | 27 | OKC | 80 | 2750 | 27.6 | 7.8 | 6.8 | 0.245 |
| **96** | LeBron James | 31 | CLE | 76 | 2709 | 27.5 | 9.0 | 7.5 | 0.242 |
| **96** | Kawhi Leonard | 24 | SAS | 72 | 2380 | 26.0 | 9.1 | 6.7 | 0.277 |
| **95** | Chris Paul | 30 | LAC | 74 | 2420 | 26.2 | 7.9 | 6.0 | 0.253 |
| **94** | James Harden | 26 | HOU | 82 | 3125 | 25.3 | 6.6 | 6.8 | 0.204 |
| **92** | Kyle Lowry | 29 | TOR | 77 | 2851 | 22.2 | 5.8 | 5.7 | 0.196 |
| **90** | Draymond Green | 25 | GSW | 81 | 2808 | 19.3 | 5.5 | 5.3 | 0.190 |
| **90** | Hassan Whiteside | 26 | MIA | 73 | 2125 | 25.6 | 4.1 | 3.3 | 0.233 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Rashad Vaughn | 19 | MIL | 70 | 1001 | 4.2 | -5.7 | -0.9 | -0.036 |
| **41** | Tony Wroten | 22 | PHI | 8 | 144 | 1.8 | -13.4 | -0.4 | -0.263 |
| **41** | Sonny Weems | 29 | PHO/PHI | 43 | 499 | 3.7 | -7.3 | -0.7 | -0.053 |
| **42** | Emmanuel Mudiay | 19 | DEN | 68 | 2068 | 9.9 | -4.2 | -1.2 | -0.049 |
| **43** | Kendall Marshall | 24 | PHI | 30 | 400 | 6.7 | -7.3 | -0.5 | -0.064 |
| **43** | Adreian Payne | 24 | MIN | 52 | 486 | 5.6 | -6.2 | -0.5 | -0.047 |
| **43** | Anthony Brown | 23 | LAL | 29 | 599 | 4.9 | -5.5 | -0.5 | -0.024 |
| **43** | JaKarr Sampson | 22 | PHI/DEN | 73 | 1160 | 8.3 | -5.4 | -1.0 | 0.006 |
| **44** | Greivis Vásquez | 29 | MIL | 23 | 460 | 7.4 | -6.2 | -0.5 | -0.033 |
| **44** | Johnny O'Bryant | 22 | MIL | 66 | 857 | 7.4 | -5.9 | -0.8 | 0.014 |

## 2016-2017

486 rated player-seasons · 355 qualified (MP ≥ 500) · mean 61.3 · median 59 · range 41–97

- **Rating 90-100:** 19 players (3.9%)
- **Rating 80-90:** 23 players (4.7%)
- **Rating 70-80:** 60 players (12.3%)
- **Rating 60-70:** 125 players (25.7%)
- **Rating 50-60:** 204 players (42.0%)
- **Rating 40-50:** 55 players (11.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | Russell Westbrook | 28 | OKC | 81 | 2802 | 30.6 | 11.1 | 9.3 | 0.224 |
| **96** | James Harden | 27 | HOU | 81 | 2947 | 27.4 | 8.7 | 8.0 | 0.245 |
| **96** | Kawhi Leonard | 25 | SAS | 74 | 2474 | 27.6 | 9.4 | 7.1 | 0.264 |
| **95** | Giannis Antetokounmpo | 22 | MIL | 80 | 2845 | 26.1 | 7.3 | 6.7 | 0.210 |
| **95** | Jimmy Butler | 27 | CHI | 76 | 2809 | 25.1 | 7.3 | 6.6 | 0.236 |
| **95** | LeBron James | 32 | CLE | 74 | 2794 | 27.0 | 7.6 | 6.7 | 0.221 |
| **95** | Kevin Durant | 28 | GSW | 62 | 2070 | 27.6 | 8.9 | 5.7 | 0.278 |
| **95** | Chris Paul | 31 | LAC | 61 | 1921 | 26.2 | 8.7 | 5.2 | 0.264 |
| **94** | Stephen Curry | 28 | GSW | 79 | 2638 | 24.6 | 6.9 | 5.9 | 0.229 |
| **94** | Isaiah Thomas | 27 | BOS | 76 | 2569 | 26.5 | 6.7 | 5.6 | 0.234 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **41** | Isaiah Whitehead | 21 | BRK | 73 | 1643 | 7.6 | -5.1 | -1.3 | -0.023 |
| **43** | Malcolm Delaney | 27 | ATL | 73 | 1248 | 7.5 | -5.6 | -1.1 | 0.005 |
| **43** | Brandon Ingram | 19 | LAL | 79 | 2279 | 8.5 | -4.4 | -1.4 | -0.007 |
| **44** | Cameron Payne | 22 | OKC/CHI | 31 | 462 | 5.5 | -6.1 | -0.5 | -0.035 |
| **44** | Mario Hezonja | 21 | ORL | 65 | 960 | 7.2 | -5.0 | -0.7 | -0.033 |
| **44** | Semaj Christon | 24 | OKC | 64 | 973 | 5.7 | -5.1 | -0.8 | 0.006 |
| **45** | Georges Niang | 23 | IND | 23 | 93 | 0.1 | -11.7 | -0.2 | -0.168 |
| **45** | Dragan Bender | 19 | PHO | 43 | 574 | 5.3 | -5.1 | -0.4 | -0.029 |
| **45** | Randy Foye | 33 | BRK | 69 | 1284 | 7.3 | -4.4 | -0.8 | 0.006 |
| **45** | Domantas Sabonis | 20 | OKC | 81 | 1632 | 6.9 | -4.5 | -1.0 | 0.022 |

## 2017-2018

540 rated player-seasons · 353 qualified (MP ≥ 500) · mean 60.6 · median 58 · range 40–97

- **Rating 90-100:** 15 players (2.8%)
- **Rating 80-90:** 30 players (5.6%)
- **Rating 70-80:** 65 players (12.0%)
- **Rating 60-70:** 128 players (23.7%)
- **Rating 50-60:** 232 players (43.0%)
- **Rating 40-50:** 70 players (13.0%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | LeBron James | 33 | CLE | 82 | 3026 | 28.6 | 8.7 | 8.2 | 0.221 |
| **97** | James Harden | 28 | HOU | 72 | 2551 | 29.8 | 9.9 | 7.7 | 0.289 |
| **95** | Anthony Davis | 24 | NOP | 75 | 2727 | 28.9 | 6.7 | 5.9 | 0.241 |
| **95** | Damian Lillard | 27 | POR | 73 | 2670 | 25.2 | 7.2 | 6.3 | 0.227 |
| **94** | Giannis Antetokounmpo | 23 | MIL | 75 | 2756 | 27.3 | 6.2 | 5.7 | 0.207 |
| **94** | Kevin Durant | 29 | GSW | 68 | 2325 | 26.0 | 7.3 | 5.5 | 0.215 |
| **94** | Stephen Curry | 29 | GSW | 51 | 1631 | 28.2 | 7.7 | 4.0 | 0.267 |
| **93** | Karl-Anthony Towns | 22 | MIN | 82 | 2918 | 24.9 | 5.1 | 5.2 | 0.230 |
| **93** | Russell Westbrook | 29 | OKC | 80 | 2914 | 24.7 | 6.3 | 6.1 | 0.166 |
| **93** | Nikola Jokić | 22 | DEN | 75 | 2443 | 24.4 | 6.9 | 5.5 | 0.211 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **40** | Frank Ntilikina | 19 | NYK | 78 | 1706 | 7.0 | -5.0 | -1.3 | -0.026 |
| **41** | Paul Zipser | 23 | CHI | 54 | 824 | 5.2 | -6.1 | -0.8 | -0.034 |
| **43** | Kay Felder | 22 | CHI/DET | 16 | 140 | 3.6 | -11.1 | -0.3 | -0.175 |
| **43** | Rodney Purvis | 23 | ORL | 16 | 290 | 4.5 | -8.2 | -0.5 | -0.056 |
| **43** | Kobi Simmons | 20 | MEM | 32 | 643 | 7.7 | -6.9 | -0.8 | -0.013 |
| **44** | Xavier Rathan-Mayes | 23 | MEM | 5 | 118 | 0.9 | -11.5 | -0.3 | -0.171 |
| **44** | Arron Afflalo | 32 | ORL | 53 | 682 | 5.8 | -5.4 | -0.6 | 0.009 |
| **44** | Tyler Ulis | 22 | PHO | 71 | 1658 | 10.1 | -4.4 | -1.0 | -0.006 |
| **44** | De'Aaron Fox | 20 | SAC | 73 | 2026 | 11.2 | -4.2 | -1.1 | -0.014 |
| **44** | Dragan Bender | 20 | PHO | 82 | 2069 | 7.1 | -3.7 | -0.9 | 0.001 |

## 2018-2019

530 rated player-seasons · 361 qualified (MP ≥ 500) · mean 60.9 · median 58 · range 38–98

- **Rating 90-100:** 15 players (2.8%)
- **Rating 80-90:** 29 players (5.5%)
- **Rating 70-80:** 78 players (14.7%)
- **Rating 60-70:** 114 players (21.5%)
- **Rating 50-60:** 230 players (43.4%)
- **Rating 40-50:** 63 players (11.9%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | James Harden | 29 | HOU | 78 | 2867 | 30.6 | 11.0 | 9.3 | 0.254 |
| **97** | Giannis Antetokounmpo | 24 | MIL | 72 | 2358 | 30.9 | 10.4 | 7.4 | 0.292 |
| **95** | Nikola Jokić | 23 | DEN | 80 | 2504 | 26.3 | 9.1 | 7.0 | 0.226 |
| **95** | Anthony Davis | 25 | NOP | 56 | 1850 | 30.3 | 9.4 | 5.3 | 0.247 |
| **94** | Paul George | 28 | OKC | 77 | 2841 | 23.3 | 7.2 | 6.6 | 0.201 |
| **93** | Damian Lillard | 28 | POR | 80 | 2838 | 23.7 | 6.4 | 6.0 | 0.205 |
| **93** | Rudy Gobert | 26 | UTA | 81 | 2577 | 24.6 | 5.4 | 4.8 | 0.268 |
| **93** | Nikola Vučević | 28 | ORL | 80 | 2510 | 25.5 | 6.6 | 5.5 | 0.193 |
| **93** | Kawhi Leonard | 27 | TOR | 60 | 2040 | 25.8 | 7.2 | 4.7 | 0.224 |
| **92** | Kevin Durant | 30 | GSW | 78 | 2702 | 24.2 | 5.5 | 5.1 | 0.204 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Kevin Knox | 19 | NYK | 75 | 2158 | 8.7 | -5.7 | -2.0 | -0.030 |
| **41** | Frank Ntilikina | 20 | NYK | 43 | 904 | 6.0 | -6.0 | -0.9 | -0.045 |
| **42** | Wayne Selden | 24 | MEM/CHI | 75 | 1439 | 8.3 | -5.4 | -1.2 | -0.009 |
| **42** | Collin Sexton | 20 | CLE | 82 | 2605 | 12.0 | -4.7 | -1.8 | -0.011 |
| **43** | Elie Okobo | 21 | PHO | 53 | 958 | 7.6 | -5.7 | -0.9 | -0.027 |
| **43** | Josh Jackson | 21 | PHO | 79 | 1988 | 10.6 | -4.6 | -1.3 | -0.040 |
| **44** | Marquese Chriss | 21 | HOU/CLE | 43 | 499 | 9.2 | -7.5 | -0.7 | -0.023 |
| **44** | Tyrone Wallace | 24 | LAC | 62 | 628 | 7.0 | -6.4 | -0.7 | -0.023 |
| **44** | Lance Thomas | 30 | NYK | 46 | 783 | 6.4 | -5.7 | -0.7 | 0.004 |
| **45** | Jared Terrell | 23 | MIN | 14 | 111 | 0.7 | -10.9 | -0.2 | -0.140 |

## 2019-2020

529 rated player-seasons · 339 qualified (MP ≥ 500) · mean 60.5 · median 57 · range 38–97

- **Rating 90-100:** 10 players (1.9%)
- **Rating 80-90:** 31 players (5.9%)
- **Rating 70-80:** 74 players (14.0%)
- **Rating 60-70:** 121 players (22.9%)
- **Rating 50-60:** 227 players (42.9%)
- **Rating 40-50:** 64 players (12.1%)
- **Rating 30-40:** 2 players (0.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **97** | James Harden | 30 | HOU | 68 | 2483 | 29.1 | 9.6 | 7.3 | 0.254 |
| **97** | Giannis Antetokounmpo | 25 | MIL | 63 | 1917 | 31.9 | 11.5 | 6.6 | 0.279 |
| **95** | Damian Lillard | 29 | POR | 66 | 2474 | 26.9 | 7.5 | 5.9 | 0.225 |
| **95** | LeBron James | 35 | LAL | 67 | 2316 | 25.5 | 8.4 | 6.1 | 0.204 |
| **95** | Anthony Davis | 26 | LAL | 62 | 2131 | 27.4 | 8.0 | 5.4 | 0.250 |
| **94** | Luka Dončić | 20 | DAL | 61 | 2047 | 27.6 | 8.4 | 5.4 | 0.207 |
| **94** | Kawhi Leonard | 28 | LAC | 57 | 1848 | 26.9 | 8.9 | 5.1 | 0.226 |
| **93** | Nikola Jokić | 24 | DEN | 73 | 2336 | 24.9 | 7.4 | 5.5 | 0.202 |
| **90** | Jimmy Butler | 30 | MIA | 58 | 1959 | 23.6 | 5.4 | 3.7 | 0.221 |
| **90** | Karl-Anthony Towns | 24 | MIN | 35 | 1187 | 26.5 | 7.8 | 2.9 | 0.204 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Jordan Poole | 20 | GSW | 57 | 1274 | 7.2 | -6.6 | -1.5 | -0.047 |
| **38** | Darius Garland | 20 | CLE | 59 | 1824 | 8.5 | -5.5 | -1.7 | -0.034 |
| **41** | Dwayne Bacon | 24 | CHO | 39 | 687 | 6.1 | -6.8 | -0.8 | -0.053 |
| **41** | Sekou Doumbouya | 19 | DET | 38 | 754 | 6.2 | -6.7 | -0.9 | -0.020 |
| **42** | Dennis Smith Jr. | 22 | NYK | 34 | 537 | 7.4 | -6.1 | -0.6 | -0.079 |
| **42** | De'Andre Hunter | 22 | ATL | 63 | 2018 | 8.6 | -4.7 | -1.4 | 0.002 |
| **43** | Deonte Burton | 26 | OKC | 39 | 356 | 4.3 | -6.8 | -0.4 | -0.067 |
| **43** | Theo Pinson | 24 | BRK | 33 | 365 | 5.2 | -7.0 | -0.5 | -0.078 |
| **43** | Jacob Evans | 22 | GSW/MIN | 29 | 418 | 5.5 | -7.1 | -0.5 | -0.056 |
| **43** | Treveon Graham | 26 | MIN/ATL | 55 | 929 | 6.6 | -5.6 | -0.8 | 0.009 |

## 2020-2021

540 rated player-seasons · 362 qualified (MP ≥ 500) · mean 60.6 · median 58 · range 38–98

- **Rating 90-100:** 12 players (2.2%)
- **Rating 80-90:** 35 players (6.5%)
- **Rating 70-80:** 63 players (11.7%)
- **Rating 60-70:** 130 players (24.1%)
- **Rating 50-60:** 237 players (43.9%)
- **Rating 40-50:** 60 players (11.1%)
- **Rating 30-40:** 3 players (0.6%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Nikola Jokić | 25 | DEN | 72 | 2488 | 31.3 | 12.1 | 8.8 | 0.301 |
| **95** | Giannis Antetokounmpo | 26 | MIL | 61 | 2013 | 29.2 | 9.0 | 5.6 | 0.244 |
| **94** | Stephen Curry | 32 | GSW | 63 | 2152 | 26.3 | 8.7 | 5.8 | 0.201 |
| **94** | Joel Embiid | 26 | PHI | 51 | 1585 | 30.3 | 7.5 | 3.8 | 0.266 |
| **93** | Damian Lillard | 30 | POR | 67 | 2398 | 25.6 | 6.3 | 5.0 | 0.209 |
| **93** | Kawhi Leonard | 29 | LAC | 52 | 1773 | 26.0 | 7.3 | 4.2 | 0.238 |
| **93** | Jimmy Butler | 31 | MIA | 52 | 1745 | 26.5 | 7.7 | 4.3 | 0.255 |
| **92** | Luka Dončić | 21 | DAL | 66 | 2262 | 25.3 | 6.8 | 5.1 | 0.163 |
| **91** | Rudy Gobert | 28 | UTA | 71 | 2187 | 23.5 | 4.9 | 3.8 | 0.248 |
| **91** | Zion Williamson | 20 | NOP | 61 | 2026 | 27.1 | 5.8 | 4.0 | 0.205 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Josh Hall | 20 | OKC | 21 | 336 | 1.0 | -11.9 | -0.8 | -0.126 |
| **39** | Killian Hayes | 19 | DET | 26 | 670 | 5.3 | -7.2 | -0.9 | -0.081 |
| **39** | Aleksej Pokusevski | 19 | OKC | 45 | 1090 | 6.1 | -6.1 | -1.1 | -0.084 |
| **40** | Isaac Okoro | 20 | CLE | 67 | 2173 | 7.9 | -5.1 | -1.7 | 0.020 |
| **41** | Sekou Doumbouya | 20 | DET | 56 | 869 | 6.9 | -6.7 | -1.0 | -0.012 |
| **41** | Rodney Hood | 28 | POR/TOR | 55 | 942 | 5.6 | -6.4 | -1.0 | -0.019 |
| **41** | Théo Maledon | 19 | OKC | 65 | 1778 | 8.2 | -5.0 | -1.3 | -0.021 |
| **42** | Dwayne Bacon | 25 | ORL | 72 | 1853 | 9.9 | -5.1 | -1.5 | 0.013 |
| **43** | Justise Winslow | 24 | MEM | 26 | 507 | 6.2 | -6.0 | -0.5 | -0.066 |
| **43** | Chasson Randle | 27 | ORL | 41 | 837 | 7.4 | -5.9 | -0.8 | -0.001 |

## 2021-2022

605 rated player-seasons · 375 qualified (MP ≥ 500) · mean 59.8 · median 56 · range 39–99

- **Rating 90-100:** 15 players (2.5%)
- **Rating 80-90:** 32 players (5.3%)
- **Rating 70-80:** 75 players (12.4%)
- **Rating 60-70:** 118 players (19.5%)
- **Rating 50-60:** 279 players (46.1%)
- **Rating 40-50:** 85 players (14.0%)
- **Rating 30-40:** 1 players (0.2%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | Nikola Jokić | 26 | DEN | 74 | 2476 | 32.8 | 13.7 | 9.8 | 0.296 |
| **98** | Giannis Antetokounmpo | 27 | MIL | 67 | 2204 | 32.1 | 11.2 | 7.4 | 0.281 |
| **97** | Joel Embiid | 27 | PHI | 68 | 2297 | 31.2 | 9.2 | 6.5 | 0.252 |
| **94** | Luka Dončić | 22 | DAL | 65 | 2301 | 25.1 | 8.2 | 5.9 | 0.159 |
| **93** | LeBron James | 37 | LAL | 56 | 2084 | 26.2 | 7.7 | 5.1 | 0.172 |
| **93** | Kevin Durant | 33 | BRK | 55 | 2047 | 25.6 | 7.2 | 4.8 | 0.198 |
| **92** | Trae Young | 23 | ATL | 76 | 2652 | 25.4 | 5.2 | 4.8 | 0.181 |
| **91** | Karl-Anthony Towns | 26 | MIN | 74 | 2476 | 24.1 | 5.0 | 4.4 | 0.199 |
| **91** | Rudy Gobert | 29 | UTA | 66 | 2120 | 24.7 | 4.6 | 3.6 | 0.264 |
| **91** | Jimmy Butler | 32 | MIA | 57 | 1931 | 23.6 | 6.3 | 4.0 | 0.228 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Jalen Suggs | 20 | ORL | 48 | 1307 | 8.6 | -5.6 | -1.2 | -0.060 |
| **41** | Melvin Frazier | 25 | OKC | 3 | 120 | -0.4 | -16.4 | -0.4 | -0.160 |
| **41** | Keljin Blevins | 26 | POR | 31 | 349 | 4.8 | -8.5 | -0.6 | -0.066 |
| **41** | Keifer Sykes | 28 | IND | 32 | 566 | 5.9 | -6.9 | -0.7 | -0.040 |
| **43** | Justin Robinson | 24 | MIL/SAC/DET | 25 | 304 | 3.6 | -7.6 | -0.4 | -0.055 |
| **43** | Elijah Hughes | 23 | UTA/POR | 36 | 434 | 5.4 | -6.9 | -0.5 | -0.043 |
| **43** | Keon Johnson | 19 | LAC/POR | 37 | 697 | 8.7 | -5.9 | -0.7 | -0.031 |
| **44** | Tim Frazier | 31 | ORL/CLE | 12 | 208 | 3.3 | -8.6 | -0.3 | -0.046 |
| **44** | Mychal Mulder | 27 | ORL/MIA | 17 | 239 | 3.7 | -7.7 | -0.3 | -0.050 |
| **44** | Brandon Williams | 22 | POR | 24 | 640 | 11.0 | -5.7 | -0.6 | -0.037 |

## 2022-2023

539 rated player-seasons · 367 qualified (MP ≥ 500) · mean 61.0 · median 58 · range 35–98

- **Rating 90-100:** 14 players (2.6%)
- **Rating 80-90:** 36 players (6.7%)
- **Rating 70-80:** 66 players (12.2%)
- **Rating 60-70:** 125 players (23.2%)
- **Rating 50-60:** 237 players (44.0%)
- **Rating 40-50:** 59 players (10.9%)
- **Rating 30-40:** 2 players (0.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Nikola Jokić | 27 | DEN | 69 | 2323 | 31.5 | 13.0 | 8.8 | 0.308 |
| **96** | Joel Embiid | 28 | PHI | 66 | 2284 | 31.4 | 9.2 | 6.4 | 0.259 |
| **96** | Jimmy Butler | 33 | MIA | 64 | 2138 | 27.6 | 8.7 | 5.8 | 0.277 |
| **95** | Luka Dončić | 23 | DAL | 66 | 2391 | 28.7 | 8.9 | 6.6 | 0.204 |
| **94** | Shai Gilgeous-Alexander | 24 | OKC | 68 | 2416 | 27.2 | 7.3 | 5.6 | 0.226 |
| **94** | Giannis Antetokounmpo | 28 | MIL | 63 | 2024 | 29.0 | 8.5 | 5.4 | 0.204 |
| **93** | Domantas Sabonis | 26 | SAC | 79 | 2736 | 23.5 | 5.8 | 5.4 | 0.221 |
| **93** | Damian Lillard | 32 | POR | 58 | 2107 | 26.7 | 7.1 | 4.9 | 0.205 |
| **92** | Stephen Curry | 34 | GSW | 56 | 1941 | 24.1 | 7.5 | 4.7 | 0.192 |
| **92** | Anthony Davis | 29 | LAL | 56 | 1904 | 27.8 | 6.3 | 4.0 | 0.226 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **35** | Blake Wesley | 19 | SAS | 37 | 669 | 3.5 | -9.6 | -1.3 | -0.114 |
| **39** | Daishen Nix | 20 | HOU | 57 | 914 | 5.3 | -6.5 | -1.0 | -0.062 |
| **43** | James Bouknight | 22 | CHO | 34 | 515 | 6.2 | -6.5 | -0.6 | -0.040 |
| **43** | Frank Ntilikina | 24 | DAL | 47 | 607 | 5.2 | -6.7 | -0.7 | -0.010 |
| **43** | Malaki Branham | 19 | SAS | 66 | 1550 | 9.5 | -5.2 | -1.3 | -0.004 |
| **44** | Ish Smith | 34 | DEN | 43 | 398 | 6.5 | -6.6 | -0.5 | -0.056 |
| **44** | Johnny Davis | 20 | WAS | 28 | 423 | 7.2 | -7.4 | -0.6 | -0.033 |
| **44** | Bryce McGowens | 20 | CHO | 46 | 787 | 7.2 | -6.0 | -0.8 | 0.005 |
| **45** | Leandro Bolmaro | 22 | UTA | 14 | 68 | -5.0 | -14.7 | -0.2 | -0.231 |
| **45** | TyTy Washington Jr. | 21 | HOU | 31 | 433 | 7.5 | -6.3 | -0.5 | -0.016 |

## 2023-2024

572 rated player-seasons · 360 qualified (MP ≥ 500) · mean 60.4 · median 57 · range 39–98

- **Rating 90-100:** 12 players (2.1%)
- **Rating 80-90:** 38 players (6.6%)
- **Rating 70-80:** 68 players (11.9%)
- **Rating 60-70:** 125 players (21.9%)
- **Rating 50-60:** 266 players (46.5%)
- **Rating 40-50:** 61 players (10.7%)
- **Rating 30-40:** 2 players (0.3%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Nikola Jokić | 28 | DEN | 79 | 2737 | 31.0 | 13.2 | 10.6 | 0.299 |
| **96** | Luka Dončić | 24 | DAL | 70 | 2624 | 28.1 | 9.9 | 8.0 | 0.220 |
| **96** | Giannis Antetokounmpo | 29 | MIL | 73 | 2567 | 29.9 | 9.0 | 7.2 | 0.246 |
| **96** | Shai Gilgeous-Alexander | 25 | OKC | 75 | 2553 | 29.3 | 9.0 | 7.1 | 0.275 |
| **96** | Joel Embiid | 29 | PHI | 39 | 1309 | 34.1 | 11.6 | 4.5 | 0.275 |
| **93** | Domantas Sabonis | 27 | SAC | 82 | 2928 | 23.2 | 6.5 | 6.2 | 0.206 |
| **92** | Jalen Brunson | 27 | NYK | 77 | 2726 | 23.4 | 5.8 | 5.4 | 0.198 |
| **92** | Anthony Davis | 30 | LAL | 76 | 2700 | 25.8 | 5.1 | 4.9 | 0.210 |
| **92** | Tyrese Haliburton | 23 | IND | 69 | 2224 | 23.3 | 6.9 | 5.0 | 0.195 |
| **91** | LeBron James | 39 | LAL | 71 | 2504 | 23.7 | 6.5 | 5.4 | 0.164 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **39** | Jalen McDaniels | 26 | TOR | 50 | 538 | 5.0 | -9.0 | -1.0 | -0.074 |
| **39** | Scoot Henderson | 19 | POR | 62 | 1765 | 9.5 | -5.8 | -1.7 | -0.045 |
| **41** | Malaki Branham | 20 | SAS | 75 | 1594 | 8.7 | -5.6 | -1.5 | -0.008 |
| **42** | Jalen Hood-Schifino | 20 | LAL | 21 | 109 | -1.5 | -16.1 | -0.4 | -0.222 |
| **42** | Théo Maledon | 22 | CHO/PHO | 17 | 213 | 3.2 | -10.3 | -0.5 | -0.122 |
| **42** | Ish Smith | 35 | CHO | 43 | 741 | 6.8 | -6.8 | -0.9 | -0.025 |
| **43** | Maxwell Lewis | 21 | LAL | 34 | 103 | -3.9 | -13.5 | -0.3 | -0.195 |
| **43** | Rayan Rupert | 19 | POR | 39 | 633 | 5.8 | -6.7 | -0.8 | -0.009 |
| **44** | AJ Griffin | 20 | ATL | 20 | 171 | 1.2 | -9.6 | -0.3 | -0.120 |
| **44** | Brandon Boston Jr. | 22 | LAC | 32 | 345 | 8.7 | -9.0 | -0.6 | -0.040 |

## 2024-2025

569 rated player-seasons · 375 qualified (MP ≥ 500) · mean 60.7 · median 58 · range 36–99

- **Rating 90-100:** 9 players (1.6%)
- **Rating 80-90:** 43 players (7.6%)
- **Rating 70-80:** 78 players (13.7%)
- **Rating 60-70:** 123 players (21.6%)
- **Rating 50-60:** 243 players (42.7%)
- **Rating 40-50:** 71 players (12.5%)
- **Rating 30-40:** 2 players (0.4%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **99** | Nikola Jokić | 29 | DEN | 70 | 2571 | 32.0 | 13.3 | 9.8 | 0.307 |
| **98** | Shai Gilgeous-Alexander | 26 | OKC | 76 | 2598 | 30.7 | 11.5 | 8.9 | 0.309 |
| **96** | Giannis Antetokounmpo | 30 | MIL | 67 | 2289 | 30.5 | 9.5 | 6.6 | 0.241 |
| **91** | Tyrese Haliburton | 24 | IND | 73 | 2451 | 21.8 | 5.8 | 4.9 | 0.204 |
| **90** | Jayson Tatum | 26 | BOS | 72 | 2624 | 21.7 | 5.2 | 4.8 | 0.174 |
| **90** | LeBron James | 40 | LAL | 70 | 2444 | 22.7 | 5.6 | 4.7 | 0.152 |
| **90** | Domantas Sabonis | 28 | SAC | 70 | 2429 | 22.9 | 5.2 | 4.4 | 0.199 |
| **90** | Jarrett Allen | 26 | CLE | 82 | 2296 | 22.1 | 4.2 | 3.6 | 0.243 |
| **90** | Stephen Curry | 36 | GSW | 70 | 2252 | 21.5 | 6.3 | 4.8 | 0.168 |
| **89** | Luka Dončić | 25 | DAL/LAL | 50 | 1769 | 24.1 | 6.7 | 3.9 | 0.160 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **36** | Cody Williams | 20 | UTA | 50 | 1060 | 3.7 | -7.3 | -1.4 | -0.053 |
| **39** | Vasilije Micić | 31 | CHO/PHO | 41 | 785 | 6.5 | -7.0 | -1.0 | -0.060 |
| **40** | AJ Johnson | 20 | MIL/WAS | 29 | 639 | 7.1 | -8.1 | -1.0 | -0.032 |
| **40** | Isaiah Collier | 20 | UTA | 71 | 1839 | 9.7 | -5.3 | -1.6 | -0.021 |
| **41** | Nick Smith Jr. | 20 | CHO | 60 | 1369 | 8.3 | -5.7 | -1.3 | -0.019 |
| **41** | Bub Carrington | 19 | WAS | 82 | 2458 | 9.0 | -4.6 | -1.6 | 0.005 |
| **42** | Jordan Hawkins | 22 | NOP | 56 | 1321 | 9.6 | -5.4 | -1.2 | -0.020 |
| **42** | Kyle Kuzma | 29 | WAS/MIL | 65 | 1936 | 10.6 | -4.9 | -1.4 | -0.024 |
| **43** | Adam Flagler | 25 | OKC | 37 | 203 | 3.7 | -10.3 | -0.4 | -0.062 |
| **43** | Damion Baugh | 24 | CHO | 15 | 370 | 6.3 | -7.1 | -0.5 | -0.069 |

## 2025-2026

582 rated player-seasons · 379 qualified (MP ≥ 500) · mean 60.8 · median 58 · range 38–98

- **Rating 90-100:** 8 players (1.4%)
- **Rating 80-90:** 39 players (6.7%)
- **Rating 70-80:** 84 players (14.4%)
- **Rating 60-70:** 121 players (20.8%)
- **Rating 50-60:** 262 players (45.0%)
- **Rating 40-50:** 65 players (11.2%)
- **Rating 30-40:** 3 players (0.5%)

**Top 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **98** | Nikola Jokić | 30 | DEN | 65 | 2265 | 32.3 | 14.2 | 9.2 | 0.316 |
| **98** | Shai Gilgeous-Alexander | 27 | OKC | 68 | 2259 | 30.8 | 11.7 | 7.8 | 0.323 |
| **96** | Victor Wembanyama | 22 | SAS | 64 | 1866 | 29.9 | 10.7 | 6.0 | 0.257 |
| **95** | Luka Dončić | 26 | LAL | 64 | 2289 | 27.9 | 9.3 | 6.6 | 0.199 |
| **94** | Kawhi Leonard | 34 | LAC | 65 | 2085 | 27.9 | 8.0 | 5.3 | 0.212 |
| **92** | Giannis Antetokounmpo | 31 | MIL | 36 | 1039 | 32.6 | 9.5 | 3.0 | 0.231 |
| **91** | Jalen Duren | 22 | DET | 70 | 1976 | 26.1 | 5.0 | 3.5 | 0.266 |
| **90** | Cade Cunningham | 24 | DET | 64 | 2172 | 21.6 | 6.3 | 4.6 | 0.174 |
| **89** | Kevin Durant | 37 | HOU | 78 | 2840 | 21.1 | 4.5 | 4.7 | 0.180 |
| **89** | Tyrese Maxey | 25 | PHI | 70 | 2661 | 21.9 | 5.4 | 4.9 | 0.156 |

**Bottom 10**

| Rating | Player | Age | Team | G | MP | PER | BPM | VORP | WS/48 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **38** | Nolan Traoré | 19 | BRK | 56 | 1243 | 7.9 | -6.8 | -1.5 | -0.063 |
| **39** | Ben Saraf | 19 | BRK | 44 | 916 | 7.8 | -7.3 | -1.2 | -0.057 |
| **39** | Rob Dillingham | 21 | MIN/CHI | 65 | 970 | 7.7 | -7.3 | -1.3 | -0.056 |
| **40** | AJ Johnson | 21 | WAS/DAL | 48 | 454 | 5.6 | -8.9 | -0.8 | -0.090 |
| **41** | Drake Powell | 20 | BRK | 63 | 1320 | 7.3 | -6.0 | -1.3 | -0.003 |
| **42** | Yang Hansen | 20 | POR | 43 | 300 | 3.7 | -9.5 | -0.6 | -0.075 |
| **42** | Jahmai Mashack | 23 | MEM | 31 | 673 | 7.0 | -7.0 | -0.8 | -0.036 |
| **42** | Gary Trent Jr. | 27 | MIL | 65 | 1377 | 8.0 | -5.4 | -1.2 | -0.002 |
| **42** | Cody Williams | 21 | UTA | 67 | 1631 | 9.6 | -5.5 | -1.5 | 0.004 |
| **42** | Nique Clifford | 23 | SAC | 75 | 1882 | 9.0 | -4.9 | -1.4 | -0.014 |
