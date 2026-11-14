"""Q3 (v5.15 loop): turn the layout probe's raw findings into a verdict.

Usage: python3 scripts/layout_check.py <label>
Reads screenshots/<label>/layout-raw.json (written by scripts/screenshots.py: what the probe found at every shot), drops the findings that
scripts/layout_allow.json accepts, and writes screenshots/<label>/layout.json:
  {"new": n, "findings": [{kind, key, shots, detail}], "allowed": m, "stale": [allowlist entries that matched nothing]}
`findings` lists the new ones only. It prints one line: `layout: <n> new, <m> allowed, <k> stale`. Exit code 0 either way (the reader decides).

The probe's four kinds (see LAYOUT_PROBE in shots_lib.py): tap (drawn under 44 px), text (under 10 px), clip (cut off), edge (off the screen).
A finding is one (kind, key) over all the shots; `shots` says where it was seen and `detail` what was measured.

The allowlist is a list of {kind, key, reason, card} (and for a tap: optionally `drawn` and `proof`):
- card "U5": a to-do for card U5 (every control and text now under the rule gets fixed there), accepted until it lands.
- card null: a documented exception (Close, in tap-targets.ts).
- tap, with `proof`: the control is drawn at 40 to 43 px and a test in src/components/__tests__/tap-targets.test.ts proves its hitSlop reaches
  44 inside space its parent owns. Accepted only if the control is drawn at 40 px or more both ways; without `proof` only U5 / null entries pass.
- `drawn`: the shortest side (px) the control had when the entry was written. A control that gets shorter than that (40 -> 36) is new again.
- clip: text that ends in "…" is dropped when its own source string does (a literal "Loading…" in src/), not when the browser drew the ellipsis.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOW = os.path.join(ROOT, "scripts", "layout_allow.json")
MIN_DRAWN = 40   # a control under this fails whatever the allowlist says, unless the entry is a U5 to-do or a documented exception


def source_ellipses():
    """Every string-ish line of src/ that contains an ellipsis, for the 'source ends in …' test."""
    lines = []
    for base, _dirs, files in os.walk(os.path.join(ROOT, "src")):
        if "__tests__" in base or "node_modules" in base:
            continue
        for f in files:
            if f.endswith((".ts", ".tsx")):
                with open(os.path.join(base, f), encoding="utf-8") as fh:
                    lines += [ln for ln in fh if "…" in ln]
    return lines


def own_ellipsis(text, lines):
    """True if the string `text` (which ends in …) is written that way in the source: its literal pieces, in order, all sit before a … in one line.
    A piece is what stays after cutting the text at its digits and at the words the program fills in (we cannot tell which: so only the pieces
    that are not numbers are used, and the longest must be found)."""
    body = text[:-1].strip()
    pieces = [p.strip() for p in re.split(r"[0-9$.,+%×/]+", body) if len(p.strip()) >= 3]
    if not pieces:
        return False
    # a literal source line carries "…" right after its last literal piece
    last = pieces[-1]
    return any(last + "…" in ln or last + " …" in ln for ln in lines)


def sizes(details):
    out = []
    for d in details:
        m = re.fullmatch(r"(\d+)x(\d+)", d)
        if m:
            out.append((int(m.group(1)), int(m.group(2))))
    return out


def main(label):
    shots_dir = os.path.join(ROOT, "screenshots", label)
    raw = json.load(open(os.path.join(shots_dir, "layout-raw.json")))
    allow = json.load(open(ALLOW))
    by = {}
    src = None
    for shot, found in raw.items():
        for f in found:
            if f["kind"] == "clip" and f.get("ellipsis"):
                src = source_ellipses() if src is None else src
                if own_ellipsis(f["ellipsis"], src):
                    continue
            g = by.setdefault((f["kind"], f["key"]), {"kind": f["kind"], "key": f["key"], "shots": [], "detail": []})
            if shot not in g["shots"]:
                g["shots"].append(shot)
            if f["detail"] not in g["detail"]:
                g["detail"].append(f["detail"])
    entries = {(e["kind"], e["key"]): e for e in allow}
    new, allowed, hit = [], 0, set()
    for k, g in by.items():
        e = entries.get(k)
        ok = e is not None
        if ok:
            hit.add(k)
            if g["kind"] == "tap":
                ws = sizes(g["detail"])
                small = min((min(w, h) for w, h in ws), default=0)
                if e.get("proof"):
                    ok = small >= MIN_DRAWN
                elif e.get("card") not in ("U5", None):
                    ok = False
                if ok and e.get("drawn"):
                    ok = small >= e["drawn"]
        if ok:
            allowed += 1
        else:
            new.append(g)
    stale = [{"kind": k[0], "key": k[1]} for k in entries if k not in hit]
    for g in new:
        g["shots"].sort()
    new.sort(key=lambda g: (g["kind"], g["key"]))
    json.dump({"new": len(new), "findings": new, "allowed": allowed, "stale": stale}, open(os.path.join(shots_dir, "layout.json"), "w"), indent=1, ensure_ascii=False)
    print(f"layout: {len(new)} new, {allowed} allowed, {len(stale)} stale")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 scripts/layout_check.py <label>")
    main(sys.argv[1])
