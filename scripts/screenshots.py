"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <label> [--only 56_u1,05_midgame] [--viewport 375x667] [--jobs N] [--shard K/N]
(expects `npx expo export --platform web` output in dist/.)
Every shot lives in scripts/fixtures/NN_name.py (see the README there); this file launches the browser, runs the fixtures in sorted
order and writes screenshots/<label>/*.png and screenshots/<label>/report.json (console errors, load status; `only` when --only was used),
layout-raw.json (what the layout probe found at each shot), fixture-times.json (seconds and shots per fixture; the next --jobs run balances
its shards with the newest full one) and, after a full run, layout.json (scripts/layout_check.py). --viewport runs
at another phone size into screenshots/<label>-se/.

S4 (sharded run): --jobs N starts N processes, each with its own browser and static server, each running its share of the fixtures
(--shard K/N, balanced by the recorded times, else fixture i goes to shard i mod N). Their output is merged into screenshots/<label>/ as one run:
the same PNGs, one report.json, one layout-raw.json and, after a full run, one layout.json made by layout_check.py over all the shards' raw
findings (so the counts are those of a single run). --jobs 1 (the default) is the plain single run. A shard that dies is an error in report.json.
--shard K/N by hand runs one share into screenshots/<label>-shardKofN/ (a partial report.json and layout.json; never merged by itself).
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TIMES = "fixture-times.json"


def _opt(argv, name):
    """`--name v` / `--name=v` from the command line; None when absent."""
    for i, a in enumerate(argv):
        if a == name and i + 1 < len(argv):
            return argv[i + 1]
        if a.startswith(name + "="):
            return a[len(name) + 1:]
    return None


def _parse_shard(s):
    m = re.fullmatch(r"(\d+)/(\d+)", (s or "").strip())
    if not m or not 1 <= int(m.group(1)) <= int(m.group(2)):
        raise SystemExit(f"--shard wants K/N with 1 <= K <= N (1/2), got {s!r}")
    return int(m.group(1)), int(m.group(2))


def _parse_jobs(s):
    if s is None:
        return 1
    if not re.fullmatch(r"\d+", s.strip()) or int(s) < 1:
        raise SystemExit(f"--jobs wants a whole number >= 1, got {s!r}")
    return int(s)


def plan(names, n, times):
    """Split the fixture files `names` into n shards (lists, each in sorted order). With recorded seconds per fixture: longest first onto the
    lightest shard (a fixture without a record counts as the median). Without any: fixture i goes to shard i mod n."""
    shards = [[] for _ in range(n)]
    known = sorted(times[x] for x in names if x in times)
    if not known:
        for i, name in enumerate(names):
            shards[i % n].append(name)
        return shards
    median = known[len(known) // 2]
    load = [0.0] * n
    for name in sorted(names, key=lambda x: (-times.get(x, median), x)):
        k = min(range(n), key=lambda j: (load[j], j))
        shards[k].append(name)
        load[k] += times.get(name, median)
    return [sorted(s) for s in shards]


def recorded_times(screenshots_dir):
    """Seconds per fixture from the newest full run's fixture-times.json (a shard's or a partial run's does not count); {} if there is none."""
    best, found = -1, {}
    for d in os.listdir(screenshots_dir) if os.path.isdir(screenshots_dir) else []:
        p = os.path.join(screenshots_dir, d, TIMES)
        if re.search(r"-shard\d+of\d+", d) or not os.path.isfile(p):
            continue
        try:
            data = json.load(open(p))
            m = os.path.getmtime(p)
        except (OSError, ValueError):
            continue
        if data.get("full") and m > best:
            best, found = m, {k: v["s"] for k, v in data.get("fixtures", {}).items() if isinstance(v, dict) and "s" in v}
    return found


# --shard K/N: this process works in its own folder, screenshots/<label>-shardKofN (shots_lib takes the folder from argv[1])
SHARD = _parse_shard(_opt(sys.argv[2:], "--shard")) if _opt(sys.argv[2:], "--shard") is not None else None
JOBS = _parse_jobs(_opt(sys.argv[2:], "--jobs"))
if SHARD and len(sys.argv) > 1:
    sys.argv[1] = f"{sys.argv[1]}-shard{SHARD[0]}of{SHARD[1]}"

from shots_lib import *  # noqa: F401,F403,E402  (the shared report and the static server)
from shots_lib import httpd, run_fixtures, fixture_files, wanted, LAYOUT, VIEWPORT, ROOT, OUT, ONLY, VERSION, report  # noqa: F401,E402
import shutil, time  # noqa: E402

SHOTS_DIR = os.path.join(ROOT, "screenshots")


def selected():
    """The fixture files this run is about (--only applied), in sorted order; a name in --only that matches nothing is an error."""
    names = [n for n in fixture_files() if wanted(n, ONLY)]
    if SHARD is None:   # a shard leaves it to the process that started it
        for t in ONLY or []:
            if not any(wanted(n, [t]) for n in fixture_files()):
                report["errors"].append(f"--only {t}: no such fixture in scripts/fixtures/")
    return names


def write_outputs(times, full):
    """report.json, layout-raw.json, fixture-times.json and (full single run) layout.json: what a plain run writes at its end."""
    json.dump({"full": full, "fixtures": times}, open(os.path.join(OUT, TIMES), "w"), indent=1)
    json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
    print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
    # Q3: the probe's raw findings, always; the verdict (allowlist, counts) only after a full run, where every allowlist entry can be seen
    json.dump(LAYOUT, open(os.path.join(OUT, "layout-raw.json"), "w"), indent=1)
    if VIEWPORT:   # not gated yet (the allowlist is for the normal phone): just the count per kind
        kinds = {}
        for found in LAYOUT.values():
            for f in found:
                kinds[f["kind"]] = kinds.get(f["kind"], 0) + 1
        print(f"layout at {VIEWPORT[0]}x{VIEWPORT[1]} (raw hits over all shots): " + (", ".join(f"{k} {n}" for k, n in sorted(kinds.items())) or "none"))
    elif ONLY is None:
        subprocess.run([sys.executable, os.path.join(HERE, "layout_check.py"), os.path.basename(OUT)], check=False)


def run_here(names):
    """One browser, the fixtures `names` in order, each timed (seconds of real time and the shots it took)."""
    from playwright.sync_api import sync_playwright
    times = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name in names:
            t0, n0 = time.time(), len(report["shots"])
            run_fixtures(browser, only=[name[:-3]])
            times[name] = {"s": round(time.time() - t0, 1), "shots": [os.path.basename(p) for p in report["shots"][n0:]]}
        browser.close()
    httpd.shutdown()
    return times


def run_sharded(names, jobs):
    """Start `jobs` shard processes, wait for all, fold their folders into OUT as one run."""
    parts = plan(names, jobs, recorded_times(SHOTS_DIR))
    passthrough, skip = [], False
    for a in sys.argv[2:]:
        if skip:
            skip = False
        elif a in ("--jobs", "--shard"):
            skip = True
        elif not a.startswith(("--jobs=", "--shard=")):
            passthrough.append(a)
    suffix = "-se" if VIEWPORT else ""
    procs = []
    for k in range(1, jobs + 1):
        log = os.path.join(OUT, f".shard{k}.log")
        cmd = [sys.executable, "-u", os.path.abspath(__file__), sys.argv[1], *passthrough, "--shard", f"{k}/{jobs}"]
        print(f"shard {k}/{jobs}: {len(parts[k - 1])} fixtures", flush=True)
        procs.append((k, log, subprocess.Popen(cmd, stdout=open(log, "w"), stderr=subprocess.STDOUT)))
    merged = {"shots": [], "errors": [], "audio": {}, "loaded": False, "extra": {}}
    times, layout, dirs = {}, {}, []
    for k, log, proc in procs:
        code = proc.wait()
        sdir = os.path.join(SHOTS_DIR, f"{VERSION_BASE}-shard{k}of{jobs}{suffix}")
        dirs.append(sdir)
        rp = os.path.join(sdir, "report.json")
        try:
            r = json.load(open(rp))
        except (OSError, ValueError):
            r = None
        if code != 0 or r is None:
            merged["errors"].append(f"shard {k}/{jobs} crashed (exit code {code}, "
                                    f"{'no report.json' if r is None else 'report.json written'}): fixtures {', '.join(parts[k - 1])}; log {log}")
            tail = open(log, errors="replace").read().strip().splitlines()[-15:]
            print(f"shard {k}/{jobs} crashed (exit code {code}):\n  " + "\n  ".join(tail), flush=True)
        if r is not None:
            merged["errors"] += r.get("errors", [])
            merged["loaded"] = merged["loaded"] or bool(r.get("loaded"))   # only the shard that runs 00_boot sets it
            merged["audio"].update(r.get("audio", {}))
            for key, v in r.items():
                if key not in ("version", "errors", "shots", "loaded", "only", "shard", "audio", "viewport"):
                    merged["extra"].setdefault(key, v)
            try:
                times.update(json.load(open(os.path.join(sdir, TIMES))).get("fixtures", {}))
            except (OSError, ValueError):
                pass
            try:
                layout.update({kk: vv for kk, vv in json.load(open(os.path.join(sdir, "layout-raw.json"))).items()})
            except (OSError, ValueError):
                pass
        if os.path.isdir(sdir):
            for f in sorted(os.listdir(sdir)):
                if f.endswith(".png"):
                    shutil.move(os.path.join(sdir, f), os.path.join(OUT, f))
        print(f"shard {k}/{jobs} done in {sum(v['s'] for n, v in times.items() if n in parts[k - 1]):.0f} s of fixtures", flush=True)
    # one run's shape: shots in fixture order, layout entries in the same order, one report
    order = [os.path.join(OUT, s) for n in sorted(times) for s in times[n]["shots"]]
    report["shots"][:] = order
    names_in_order = [os.path.splitext(os.path.basename(p))[0] for p in order]
    rank = {n: i for i, n in enumerate(names_in_order)}
    LAYOUT.update(dict(sorted(layout.items(), key=lambda kv: (rank.get(kv[0].split("#")[0], len(rank)), kv[0]))))
    report["errors"] += merged["errors"]
    report["loaded"] = merged["loaded"]
    if merged["audio"]:
        report["audio"] = merged["audio"]
    report.update(merged["extra"])
    for sdir in dirs:
        shutil.rmtree(sdir, ignore_errors=True)
    for k, log, _p in procs:
        if os.path.exists(log) and not any(f"shard {k}/{jobs} crashed" in e for e in report["errors"]):
            os.remove(log)
    return times


VERSION_BASE = VERSION[: -len(f"-shard{SHARD[0]}of{SHARD[1]}")] if SHARD else VERSION
names = selected()
if SHARD:
    report["shard"] = f"{SHARD[0]}/{SHARD[1]}"   # a partial run, like `only`: never mistaken for a full one
    mine = plan(names, SHARD[1], recorded_times(SHOTS_DIR))[SHARD[0] - 1]
    times = run_here(mine)
    write_outputs(times, False)
elif JOBS > 1 and len(names) > 1:
    times = run_sharded(names, min(JOBS, len(names)))
    httpd.shutdown()
    write_outputs(times, ONLY is None)
else:
    times = run_here(names)
    write_outputs(times, ONLY is None)
