#!/usr/bin/env python3
"""Compute a 0-100 overall rating for every parsed player-season.

Reads src/data/parsed/season_players.json and writes the typed TypeScript
array at src/data/rating/season_players.ts. The engine is specified in
context/docs/player-rating-normalization.md; every tunable constant below
maps to a row of that document's section 9.

Rows that cannot be rated (MP = 0, or any of the four metrics missing) are
dropped rather than rated with a placeholder, so Rating is always a number.

Exits non-zero on any structural problem so it can gate the ingestion phase.
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_FILE = ROOT / "src" / "data" / "parsed" / "season_players.json"
OUTPUT_FILE = ROOT / "src" / "data" / "rating" / "season_players.ts"

QUALIFIED_MINUTES = 500
RATE_WEIGHTS = {"PlayerEfficiencyRating": 0.30, "BoxPlusMinus": 0.40, "WinSharesPer48Min": 0.30}
SHRINKAGE_K = 400
REPLACEMENT_PRIOR = -1.0
VORP_SHIFT = 2.5
VOLUME_WEIGHT = 0.25
RATING_FLOOR = 25
RATING_CEILING = 100
LOGISTIC_CENTER = -0.316
LOGISTIC_SCALE = 1.072

METRIC_FIELDS = list(RATE_WEIGHTS)
VORP_FIELD = "ValueOverReplacementPlayer"
REQUIRED_FIELDS = METRIC_FIELDS + [VORP_FIELD]

FIELD_ORDER = [
    ("Season", "string"),
    ("Rank", "number"),
    ("PlayerName", "string"),
    ("Age", "number"),
    ("TeamSlug", "string[]"),
    ("Position", "string"),
    ("GamesPlayed", "number"),
    ("MinutesPlayed", "number"),
    ("PlayerEfficiencyRating", "number"),
    ("BoxPlusMinus", "number"),
    ("ValueOverReplacementPlayer", "number"),
    ("WinSharesPer48Min", "number"),
    ("PlayerSlug", "string"),
]

EXPORT_NAME = "RATED_PLAYER_SEASONS"


def is_rateable(player):
    minutes = player.get("MinutesPlayed")
    if not isinstance(minutes, (int, float)) or minutes <= 0:
        return False
    return all(isinstance(player.get(field), (int, float)) for field in REQUIRED_FIELDS)


def compressed_vorp(player):
    # One season in the dataset (Olowokandi 1999-2000, -2.6) sits below -VORP_SHIFT,
    # so the argument is floored rather than left to raise.
    return math.sqrt(max(0.0, player[VORP_FIELD] + VORP_SHIFT))


def mean_and_deviation(values):
    count = len(values)
    mean = sum(values) / count
    variance = sum((value - mean) ** 2 for value in values) / count
    return mean, math.sqrt(variance)


def season_distribution(reference, errors, season):
    if not reference:
        errors.append(f"{season}: no player reached {QUALIFIED_MINUTES} minutes")
        return None

    distribution = {}
    for field in METRIC_FIELDS:
        distribution[field] = mean_and_deviation([player[field] for player in reference])
    distribution[VORP_FIELD] = mean_and_deviation([compressed_vorp(p) for p in reference])

    for field, (_, deviation) in distribution.items():
        if deviation == 0:
            errors.append(f"{season}: {field} has zero spread across {len(reference)} players")
            return None

    return distribution


def z_score(value, moments):
    mean, deviation = moments
    return (value - mean) / deviation


def rate_player(player, distribution):
    z_rate = sum(
        weight * z_score(player[field], distribution[field])
        for field, weight in RATE_WEIGHTS.items()
    )

    minutes = player["MinutesPlayed"]
    shrinkage = minutes / (minutes + SHRINKAGE_K)
    z_rate_adjusted = shrinkage * z_rate + (1 - shrinkage) * REPLACEMENT_PRIOR

    z_vorp = z_score(compressed_vorp(player), distribution[VORP_FIELD])
    composite = (1 - VOLUME_WEIGHT) * z_rate_adjusted + VOLUME_WEIGHT * z_vorp

    span = RATING_CEILING - RATING_FLOOR
    logistic = 1 / (1 + math.exp(-(composite - LOGISTIC_CENTER) / LOGISTIC_SCALE))
    return math.floor(RATING_FLOOR + span * logistic + 0.5)


def rate_season(season, players, errors):
    rateable = [player for player in players if is_rateable(player)]
    reference = [p for p in rateable if p["MinutesPlayed"] >= QUALIFIED_MINUTES]

    distribution = season_distribution(reference, errors, season)
    if distribution is None:
        return []

    rated = []
    for player in rateable:
        rating = rate_player(player, distribution)
        if not RATING_FLOOR <= rating <= RATING_CEILING:
            errors.append(f"{season}: {player['PlayerName']!r} rated {rating}, outside the band")
        rated.append({**player, "Rating": rating})

    return rated


def validate_output(rated, errors):
    for season, players in rated.items():
        slugs = set()
        for player in players:
            slug = player["PlayerSlug"]
            if slug in slugs:
                errors.append(f"{season}: duplicate PlayerSlug {slug!r}")
            slugs.add(slug)

            rating = player["Rating"]
            if not isinstance(rating, int):
                errors.append(f"{season}: {slug} Rating is {rating!r}, expected an integer")

            for field, kind in FIELD_ORDER:
                value = player[field]
                if kind == "string" and not isinstance(value, str):
                    errors.append(f"{season}: {slug} {field} is {value!r}, expected a string")
                elif kind == "string[]" and not (
                    isinstance(value, list) and all(isinstance(item, str) for item in value)
                ):
                    errors.append(f"{season}: {slug} {field} is {value!r}, expected string[]")
                elif kind == "number" and not isinstance(value, (int, float)):
                    errors.append(f"{season}: {slug} {field} is {value!r}, expected a number")


def encode(value):
    return json.dumps(value, ensure_ascii=False)


def serialize_player(player):
    fields = [f"{field}: {encode(player[field])}" for field, _ in FIELD_ORDER]
    fields.append(f"Rating: {player['Rating']}")
    return "  { " + ", ".join(fields) + " },"


def write_typescript(rated):
    lines = [
        "// Generated by scripts/rate-players.py — do not edit by hand.",
        "// Regenerate with `npm run rate:players`.",
        "",
        'import type { RatedPlayerSeason } from "@/types/rating";',
        "",
        f"export const {EXPORT_NAME}: RatedPlayerSeason[] = [",
    ]
    for players in rated.values():
        lines.extend(serialize_player(player) for player in players)
    lines.append("];")
    lines.append("")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")


def percentile(sorted_values, fraction):
    index = min(len(sorted_values) - 1, int(fraction * len(sorted_values)))
    return sorted_values[index]


def report(rated):
    everyone = [player for players in rated.values() for player in players]
    ratings = sorted(player["Rating"] for player in everyone)

    marks = " ".join(
        f"p{int(f * 100)}={percentile(ratings, f)}"
        for f in (0.01, 0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99)
    )
    print(f"\nDistribution  min={ratings[0]} {marks} max={ratings[-1]}")

    low_minute = [p["Rating"] for p in everyone if p["MinutesPlayed"] < 200]
    print(f"Highest rating under 200 minutes: {max(low_minute)}")

    print("\nTop seasons:")
    top = sorted(everyone, key=lambda p: (-p["Rating"], p["Season"]))[:9]
    for player in top:
        print(f"  {player['Rating']}  {player['Season']}  {player['PlayerName']}")


def main():
    if not SOURCE_FILE.is_file():
        print(f"error: {SOURCE_FILE} does not exist — run `npm run parse:raw`", file=sys.stderr)
        return 1

    season_players = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    errors = []
    rated = {}
    dropped = 0
    for season in sorted(season_players):
        players = season_players[season]
        for player in players:
            slug = player.get("TeamSlug")
            player["TeamSlug"] = [slug] if isinstance(slug, str) else slug

        rated_players = rate_season(season, players, errors)
        dropped += len(players) - len(rated_players)
        if rated_players:
            rated[season] = rated_players
            print(f"  {season}  {len(rated_players)} rated")

    validate_output(rated, errors)

    if errors:
        print(f"\nRating failed — {len(errors)} problem(s):", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        return 1

    write_typescript(rated)

    total = sum(len(players) for players in rated.values())
    print(f"\nRated {total} player-seasons across {len(rated)} seasons ({dropped} dropped)")
    report(rated)
    print(f"\n  {OUTPUT_FILE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
