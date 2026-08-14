#!/usr/bin/env python3
"""Parse the raw regular-season advanced CSVs into the two JSON artifacts.

Reads every file in src/data/raw/regular, keeps only the fields the schema
consumes, collapses a traded player's split rows into one object, and writes
src/data/parsed/season_players.json (keyed by season) plus
src/data/parsed/flattened_players.json (one merged array, no Season field).

Both outputs are rewritten from scratch on every run. Exits non-zero on any
structural problem so it can gate the ingestion phase.
"""

import csv
import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "data"
RAW_DIR = DATA_DIR / "raw" / "regular"
PARSED_DIR = DATA_DIR / "parsed"

SEASON_PLAYERS_FILE = PARSED_DIR / "season_players.json"
FLATTENED_PLAYERS_FILE = PARSED_DIR / "flattened_players.json"

STR = "str"
INT = "int"
FLOAT = "float"

# (source column, output field, value kind) — output key order is preserved.
FIELDS = [
    ("Rk", "Rank", INT),
    ("Player", "PlayerName", STR),
    ("Age", "Age", INT),
    ("Team", "TeamSlug", STR),
    ("Pos", "Position", STR),
    ("G", "GamesPlayed", INT),
    ("MP", "MinutesPlayed", INT),
    ("PER", "PlayerEfficiencyRating", FLOAT),
    ("BPM", "BoxPlusMinus", FLOAT),
    ("VORP", "ValueOverReplacementPlayer", FLOAT),
    ("WS/48", "WinSharesPer48Min", FLOAT),
    ("Player-additional", "PlayerSlug", STR),
]

FILENAME_PATTERN = re.compile(r"^players-(\d{2})-(\d{2})\.csv$")
MULTI_TEAM_PATTERN = re.compile(r"^(\d+)TM$")

# The export closes with a league-wide summary row that is not a player.
LEAGUE_AVERAGE_NAME = "League Average"


def season_from_filename(name):
    match = FILENAME_PATTERN.match(name)
    if match is None:
        return None

    start = int(match.group(1))
    start_year = 1900 + start if start >= 80 else 2000 + start
    return f"{start_year}-{start_year + 1}"


def parse_value(raw, kind, field, context, errors):
    value = (raw or "").strip()
    if value == "":
        return None
    if kind is STR:
        return value

    try:
        return int(value) if kind is INT else float(value)
    except ValueError:
        errors.append(f"{context}: {field} is not a {kind} ({value!r})")
        return None


def parse_row(row, season, errors, context):
    player = {"Season": season}
    for column, field, kind in FIELDS:
        player[field] = parse_value(row.get(column), kind, field, context, errors)
    return player


def is_league_average(row):
    return (row.get("Player") or "").strip() == LEAGUE_AVERAGE_NAME


def is_repeated_header(row):
    return (row.get("Rk") or "").strip() == "Rk"


def group_rows(rows):
    """Group a traded player's consecutive split rows under their total row."""
    groups = []
    for row in rows:
        key = ((row.get("Rk") or "").strip(), (row.get("Player-additional") or "").strip())
        if groups and groups[-1][0] == key:
            groups[-1][1].append(row)
        else:
            groups.append((key, [row]))
    return [rows for _, rows in groups]


def collapse_group(group, season, name, errors):
    total_row = group[0]
    team = (total_row.get("Team") or "").strip()
    match = MULTI_TEAM_PATTERN.match(team)
    context = f"{name}: {(total_row.get('Player') or '').strip()!r}"

    if len(group) == 1:
        if match is not None:
            errors.append(f"{context}: {team} total row has no per-team rows")
        return parse_row(total_row, season, errors, context)

    if match is None:
        errors.append(f"{context}: {len(group)} rows but the first is {team!r}, not a total row")
        return parse_row(total_row, season, errors, context)

    team_rows = group[1:]
    expected = int(match.group(1))
    if len(team_rows) != expected:
        errors.append(f"{context}: {team} expects {expected} per-team rows, found {len(team_rows)}")

    player = parse_row(total_row, season, errors, context)
    player["TeamSlug"] = [(row.get("Team") or "").strip() for row in team_rows]
    return player


def parse_file(path, errors):
    season = season_from_filename(path.name)
    if season is None:
        errors.append(f"{path.name}: filename does not match players-YY-YY.csv")
        return season, []

    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        header = reader.fieldnames or []
        missing = [column for column, _, _ in FIELDS if column not in header]
        if missing:
            errors.append(f"{path.name}: missing column(s) {', '.join(missing)}")
            return season, []

        rows = [
            row for row in reader if not is_repeated_header(row) and not is_league_average(row)
        ]

    players = [collapse_group(group, season, path.name, errors) for group in group_rows(rows)]

    slugs = {}
    for player in players:
        slugs.setdefault(player["PlayerSlug"], 0)
        slugs[player["PlayerSlug"]] += 1
    for slug, count in slugs.items():
        if count > 1:
            errors.append(f"{path.name}: {slug!r} appears in {count} separate groups")

    return season, players


def write_json(path, payload):
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main():
    if not RAW_DIR.is_dir():
        print(f"error: {RAW_DIR} does not exist", file=sys.stderr)
        return 1

    paths = sorted(RAW_DIR.glob("*.csv"))
    if not paths:
        print(f"error: no CSV files under {RAW_DIR}", file=sys.stderr)
        return 1

    errors = []
    season_players = {}
    for path in paths:
        season, players = parse_file(path, errors)
        if season is not None and players:
            season_players[season] = players
            print(f"  {season}  {len(players)} players")

    if errors:
        print(f"\nParsing failed — {len(errors)} problem(s):", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        return 1

    season_players = dict(sorted(season_players.items()))
    flattened = [
        {key: value for key, value in player.items() if key != "Season"}
        for players in season_players.values()
        for player in players
    ]

    PARSED_DIR.mkdir(parents=True, exist_ok=True)
    write_json(SEASON_PLAYERS_FILE, season_players)
    write_json(FLATTENED_PLAYERS_FILE, flattened)

    print(f"\nParsed {len(paths)} file(s) → {len(season_players)} seasons, {len(flattened)} players")
    print(f"  {SEASON_PLAYERS_FILE.relative_to(DATA_DIR.parent.parent)}")
    print(f"  {FLATTENED_PLAYERS_FILE.relative_to(DATA_DIR.parent.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
