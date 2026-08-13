#!/usr/bin/env python3
"""Check that every raw advanced-stats CSV shares the same column headers.

Regular-season and playoff files are compared as two separate groups. Exits
non-zero on any mismatch so it can gate the normalization phase.
"""

import csv
import sys
from collections import Counter
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "raw"

# Verified against basketball-reference.com: the 1981-82 playoff advanced table
# genuinely ships without a GS column (1980-81 and 1982-83 both have it, mostly
# empty). GS is not consumed by the schema, so this one difference is accepted
# rather than left to fail the gate forever.
ALLOWED_MISSING = {
    "players-81-82-playoffs.csv": {"GS"},
}


def read_header(path):
    with path.open(newline="", encoding="utf-8") as handle:
        try:
            return next(csv.reader(handle))
        except StopIteration:
            return None


def check_group(label, paths):
    headers = {}
    failed = False
    reported = False

    empty = []
    for path in sorted(paths):
        header = read_header(path)
        if header is None:
            empty.append(path.name)
        else:
            headers[path.name] = tuple(header)

    if not headers:
        print(f"{label}: no files found")
        return failed or bool(empty)

    expected, _ = Counter(headers.values()).most_common(1)[0]
    print(f"{label}: {len(headers) + len(empty)} file(s), {len(expected)} columns")

    for name in empty:
        print(f"  EMPTY    {name} — no header row")
        failed = True
        reported = True

    for name, header in sorted(headers.items()):
        if header == expected:
            continue

        missing = [c for c in expected if c not in header]
        extra = [c for c in header if c not in expected]
        allowed = ALLOWED_MISSING.get(name, set())

        if extra or not missing or not set(missing) <= allowed:
            print(f"  MISMATCH  {name}")
            if missing:
                print(f"    missing: {', '.join(missing)}")
            if extra:
                print(f"    unexpected: {', '.join(extra)}")
            if not missing and not extra:
                print(f"    same columns, different order: {', '.join(header)}")
            failed = True
        else:
            print(f"  KNOWN    {name} — missing {', '.join(missing)} (accepted)")
        reported = True

    if not reported:
        print("  OK — all headers identical")

    return failed


def main():
    if not RAW_DIR.is_dir():
        print(f"error: {RAW_DIR} does not exist", file=sys.stderr)
        return 1

    regular = list((RAW_DIR / "regular").glob("*.csv"))
    playoffs = list((RAW_DIR / "playoffs").glob("*.csv"))
    if not regular and not playoffs:
        print(f"error: no CSV files under {RAW_DIR}", file=sys.stderr)
        return 1

    failed = check_group("Regular season", regular)
    failed |= check_group("Playoffs", playoffs)

    sys.stdout.flush()
    if failed:
        print("\nHeader validation failed.", file=sys.stderr)
        return 1

    print("\nHeader validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
