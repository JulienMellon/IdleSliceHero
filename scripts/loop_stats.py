#!/usr/bin/env python3
"""Loop metrics for one version, read from `git log` and the critic review files.

    python3 scripts/loop_stats.py 5.15
    python3 scripts/loop_stats.py 5.15 --line [--shots "83, 78"] [--layout "not measured"]

Reads only; never writes a file. Times are UTC. Durations come from unix
timestamps (%at), because commits are made from sessions in different time zones.
Standard library only, no network.
"""
import argparse
import glob
import os
import re
import subprocess
import sys

IDLE_GAP_SECONDS = 45 * 60
FETCH_HINT = "fetch more history: git fetch --depth=200 origin main"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def git(*args):
    return subprocess.run(
        ["git", "-C", ROOT, *args], check=True, capture_output=True, text=True
    ).stdout


def utc(ts, fmt="%Y-%m-%d %H:%M"):
    import datetime

    return datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).strftime(fmt)


def dur(seconds):
    """'7 h 17 min', '27 min', rounded to the nearest minute."""
    minutes = int(round(seconds / 60.0))
    h, m = divmod(minutes, 60)
    return f"{h} h {m:02d} min" if h else f"{m} min"


def version_commits(version):
    """Commits whose message starts `v<version> `, oldest first, as (ts, hash, subject)."""
    out = git("log", "--format=%at%x09%h%x09%s")
    prefix = f"v{version} "
    rows = []
    for line in out.splitlines():
        ts, h, subject = line.split("\t", 2)
        if subject.startswith(prefix):
            rows.append((int(ts), h, subject))
    rows.sort()
    return rows


def is_shallow_boundary(short_hash):
    """True if the commit is a root of a shallow clone (its parents are missing)."""
    if git("rev-parse", "--is-shallow-repository").strip() != "true":
        return False
    full = git("rev-parse", short_hash).strip()
    shallow_file = os.path.join(git("rev-parse", "--git-dir").strip(), "shallow")
    if not os.path.isabs(shallow_file):
        shallow_file = os.path.join(ROOT, shallow_file)
    try:
        with open(shallow_file) as f:
            return full in f.read().split()
    except OSError:
        return False


def idle_gaps(commits):
    gaps = []
    for a, b in zip(commits, commits[1:]):
        if b[0] - a[0] > IDLE_GAP_SECONDS:
            gaps.append((a[0], b[0]))
    return gaps


def rounds_of(version, commits):
    """{round number: (first ts, last ts)} from `v<version> rN` messages."""
    pat = re.compile(rf"^v{re.escape(version)} r(\d+)\b")
    found = {}
    for ts, _h, subject in commits:
        m = pat.match(subject)
        if m:
            n = int(m.group(1))
            lo, hi = found.get(n, (ts, ts))
            found[n] = (min(lo, ts), max(hi, ts))
    return dict(sorted(found.items()))


def open_notes(path):
    """(bug IDs, counts by severity) from the `## Open notes` table of a review file."""
    ids, counts = [], {"bug": 0, "major": 0, "minor": 0}
    in_section = False
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("## "):
                in_section = line.strip().lower().startswith("## open notes")
                continue
            if not in_section or not line.startswith("|"):
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 2:
                continue
            sev = cells[1].lower()
            if sev in counts:
                counts[sev] += 1
                if sev == "bug":
                    ids.append(cells[0])
    return ids, counts


def review_rounds(version):
    """[(round number, bug IDs, counts, new bug IDs)] from docs/build/v<version>/review-rN-critic.md."""
    files = glob.glob(os.path.join(ROOT, "docs", "build", f"v{version}", "review-r*-critic.md"))
    parsed = []
    for p in files:
        m = re.search(r"review-r(\d+)-critic\.md$", p)
        if m:
            parsed.append((int(m.group(1)), p))
    seen, out = set(), []
    for n, p in sorted(parsed):
        ids, counts = open_notes(p)
        new = [i for i in ids if i not in seen]
        seen.update(ids)
        out.append((n, ids, counts, new))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("version", help="for example 5.15")
    ap.add_argument("--line", action="store_true", help="print one METRICS.md table row")
    ap.add_argument("--shots", default="not recorded", help="shots changed per fix round (not in git)")
    ap.add_argument("--layout", default="not recorded", help="layout findings at close (not in git)")
    args = ap.parse_args()
    version = args.version.lstrip("v")

    commits = version_commits(version)
    if not commits or is_shallow_boundary(commits[0][1]):
        print(FETCH_HINT)
        return 1

    start = commits[0]
    close_pat = f"v{version} closed"
    closes = [c for c in commits if c[2].startswith(close_pat)]
    end = closes[-1] if closes else commits[-1]
    commits = [c for c in commits if c[0] <= end[0]]
    closed = bool(closes)

    wall = end[0] - start[0]
    gaps = idle_gaps(commits)
    idle = sum(b - a for a, b in gaps)
    active = wall - idle
    rounds = rounds_of(version, commits)
    reviews = review_rounds(version)

    new_per_round = [len(new) for _n, _ids, _c, new in reviews]
    minors_at_close = reviews[-1][2]["minor"] if reviews else None
    bugs_cell = ", ".join(str(n) for n in new_per_round) if reviews else "not recorded"
    minors_cell = str(minors_at_close) if minors_at_close is not None else "not recorded"

    if args.line:
        cells = [
            version,
            utc(end[0], "%Y-%m-%d") if closed else "open",
            str(len(rounds)),
            dur(wall),
            dur(idle),
            dur(active),
            bugs_cell,
            minors_cell,
            args.shots,
            args.layout,
        ]
        print("| " + " | ".join(cells) + " |")
        return 0

    print(f"v{version} loop (all times UTC)")
    print(f"start  {utc(start[0])}  {start[1]}  {start[2]}")
    print(f"end    {utc(end[0])}  {end[1]}  {end[2]}" + ("" if closed else "  (not closed yet)"))
    print(f"wall time  {dur(wall)}")
    print(f"commits    {len(commits)}")
    print()
    print("rounds")
    for n, (lo, hi) in rounds.items():
        inside = sum(b - a for a, b in gaps if a >= lo and b <= hi)
        extra = f"  (idle inside {dur(inside)})" if inside else ""
        print(f"  r{n}  {utc(lo)} to {utc(hi)}  {dur(hi - lo)}{extra}")
    print()
    print(f"idle gaps over {IDLE_GAP_SECONDS // 60} min")
    if gaps:
        for a, b in gaps:
            print(f"  {utc(a)} to {utc(b)}  {dur(b - a)}")
    else:
        print("  none")
    print(f"idle total   {dur(idle)}")
    print(f"active time  {dur(active)}  (wall time minus idle)")
    print()
    print("critic Open notes per round")
    if not reviews:
        print(f"  no review-r*-critic.md in docs/build/v{version}/")
    for n, _ids, c, new in reviews:
        print(f"  r{n}  bug {c['bug']}  major {c['major']}  minor {c['minor']}  new bugs {len(new)}"
              + (f" ({', '.join(new)})" if new else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
