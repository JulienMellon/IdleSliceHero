#!/usr/bin/env python3
"""Build a small review set of screenshots for the visual critic.

Usage: python3 scripts/review_shots.py <new> <prev> [--all] [--notes <review file>]

Reads screenshots/<new>/*.png and screenshots/<prev>/*.png and writes
screenshots/<new>/review/ (wiped each run):
  - new shots (no same-named file in prev): half-size copy at review/<name>
  - changed shots: half-size new at review/<name>, half-size prev at review/prev/<name>
  - noted shots (--notes only; pixels unchanged but named in the review file): half-size new at review/<name>
  - same shots: nothing
  - index.json describing every shot (status new, changed, noted or same)
--all treats every shot that exists in prev as changed.
--notes <review file> names the shots a critic must re-check besides the changed ones: the
  "where" column of that file's "## Open notes" table (for example 59, 05b2, 67-70). A shot matches
  by the part of its file name before the first hyphen, so 62 does not select 62b.
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops

CHANNEL_DIFF = 24      # a pixel differs if its max RGB channel diff exceeds this
CHANGED_FRACTION = 0.001  # changed if >= 0.1% of pixels differ (screenshots are deterministic)

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "screenshots"


def load_rgb(path):
    with Image.open(path) as im:
        return im.convert("RGB")


def diff_fraction(a, b):
    """Fraction of pixels whose max RGB channel diff > CHANNEL_DIFF (1.0 if sizes differ)."""
    if a.size != b.size:
        return 1.0
    r, g, bl = ImageChops.difference(a, b).split()
    worst = ImageChops.lighter(ImageChops.lighter(r, g), bl)
    hist = worst.histogram()
    over = sum(hist[CHANNEL_DIFF + 1:])
    return over / (a.size[0] * a.size[1])


def noted_shots(path):
    """Shot prefixes and numeric ranges named in the "where" column of the file's Open notes table.

    Returns (set of exact prefixes such as {"59", "05b2"}, list of (low, high) integer ranges).
    """
    text = Path(path).read_text()
    if "## Open notes" not in text:
        sys.exit(f"error: no '## Open notes' section in {path}")
    rows = text.split("## Open notes", 1)[1].splitlines()
    exact, ranges, col = set(), [], None
    for line in rows:
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if col is None:
            lowered = [c.lower() for c in cells]
            if "where" in lowered:
                col = lowered.index("where")
            continue
        if col >= len(cells) or set(cells[col]) <= set("-: "):
            continue
        shots = cells[col].split("/", 1)[0]
        for lo, hi in re.findall(r"(\d+[a-z0-9]*)(?:\s*[\u2013\u2014-]\s*(\d+[a-z0-9]*))?", shots):
            if hi:
                ranges.append((int(re.match(r"\d+", lo).group()), int(re.match(r"\d+", hi).group())))
            else:
                exact.add(lo)
    return exact, ranges


def is_noted(name, exact, ranges):
    prefix = name.split("-", 1)[0]
    if prefix in exact:
        return True
    lead = re.match(r"\d+", prefix)
    return bool(lead) and any(lo <= int(lead.group()) <= hi for lo, hi in ranges)


def save_half(im, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    w, h = im.size
    im.resize((max(1, w // 2), max(1, h // 2)), Image.LANCZOS).save(dest, optimize=True)
    return dest.stat().st_size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("new")
    ap.add_argument("prev")
    ap.add_argument("--all", action="store_true", help="treat every shot present in prev as changed")
    ap.add_argument("--notes", metavar="REVIEW_FILE",
                    help="also review the shots named in the 'where' column of this file's '## Open notes' table")
    args = ap.parse_args()
    exact, ranges = noted_shots(args.notes) if args.notes else (set(), [])

    new_dir, prev_dir = SHOTS / args.new, SHOTS / args.prev
    for d in (new_dir, prev_dir):
        if not d.is_dir():
            sys.exit(f"error: folder not found: {d}")

    new_names = sorted(p.name for p in new_dir.glob("*.png"))
    prev_names = {p.name for p in prev_dir.glob("*.png")}

    out = new_dir / "review"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()

    shots, counts, total = [], {"new": 0, "changed": 0, "noted": 0, "same": 0}, 0
    for name in new_names:
        cur = load_rgb(new_dir / name)
        if name not in prev_names:
            status, pct = "new", None
        else:
            prev = load_rgb(prev_dir / name)
            frac = diff_fraction(cur, prev)
            pct = round(frac * 100, 3)
            if args.all or frac >= CHANGED_FRACTION:
                status = "changed"
            else:
                status = "noted" if is_noted(name, exact, ranges) else "same"
        counts[status] += 1
        if status in ("new", "changed", "noted"):
            total += save_half(cur, out / name)
        if status == "changed":
            total += save_half(prev, out / "prev" / name)
        shots.append({"name": name, "status": status, "diff_pct": pct})

    index = {
        "new": args.new,
        "prev": args.prev,
        "shots": shots,
        "removed": sorted(prev_names - set(new_names)),
    }
    (out / "index.json").write_text(json.dumps(index, indent=2) + "\n")
    print(f"{args.new} vs {args.prev}: {counts['new']} new, {counts['changed']} changed, "
          f"{counts['noted']} noted, {counts['same']} same, {len(index['removed'])} removed; {total} bytes written")


if __name__ == "__main__":
    main()
