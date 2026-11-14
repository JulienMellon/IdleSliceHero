"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <label> [--only 56_u1,05_midgame] [--viewport 375x667]
(expects `npx expo export --platform web` output in dist/.)
Every shot lives in scripts/fixtures/NN_name.py (see the README there); this file launches the browser, runs the fixtures in sorted
order and writes screenshots/<label>/*.png and screenshots/<label>/report.json (console errors, load status; `only` when --only was used),
layout-raw.json (what the layout probe found at each shot) and, after a full run, layout.json (scripts/layout_check.py). --viewport runs
at another phone size into screenshots/<label>-se/.
"""
from shots_lib import *  # noqa: F401,F403  (the shared report and the static server)
from shots_lib import httpd, run_fixtures, LAYOUT, VIEWPORT  # noqa: F401
import subprocess, sys

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    run_fixtures(browser)
    browser.close()

httpd.shutdown()
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
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "layout_check.py"), os.path.basename(OUT)], check=False)
