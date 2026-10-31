#!/usr/bin/env python3
"""Build a small review set of screenshots for the visual critic.

Usage: python3 scripts/review_shots.py <new> <prev> [--all]

Reads screenshots/<new>/*.png and screenshots/<prev>/*.png and writes
screenshots/<new>/review/ (wiped each run):
  - new shots (no same-named file in prev): half-size copy at review/<name>
  - changed shots: half-size new at review/<name>, half-size prev at review/prev/<name>
  - same shots: nothing
  - index.json describing every shot
--all treats every shot that exists in prev as changed.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops

CHANNEL_DIFF = 24      # a pixel differs if its max RGB channel diff exceeds this
CHANGED_FRACTION = 0.005  # changed if >= 0.5% of pixels differ

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
    args = ap.parse_args()

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

    shots, counts, total = [], {"new": 0, "changed": 0, "same": 0}, 0
    for name in new_names:
        cur = load_rgb(new_dir / name)
        if name not in prev_names:
            status, pct = "new", None
        else:
            prev = load_rgb(prev_dir / name)
            frac = diff_fraction(cur, prev)
            pct = round(frac * 100, 3)
            status = "changed" if (args.all or frac >= CHANGED_FRACTION) else "same"
        counts[status] += 1
        if status in ("new", "changed"):
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
          f"{counts['same']} same, {len(index['removed'])} removed; {total} bytes written")


if __name__ == "__main__":
    main()
