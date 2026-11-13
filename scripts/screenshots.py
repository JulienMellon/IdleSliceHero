"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <label> [--only 56_u1,05_midgame]
(expects `npx expo export --platform web` output in dist/.)
Every shot lives in scripts/fixtures/NN_name.py (see the README there); this file launches the browser, runs the fixtures in sorted
order and writes screenshots/<label>/*.png and screenshots/<label>/report.json (console errors, load status; `only` when --only was used).
"""
from shots_lib import *  # noqa: F401,F403  (the shared report and the static server)
from shots_lib import httpd, run_fixtures  # noqa: F401

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    run_fixtures(browser)
    browser.close()

httpd.shutdown()
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
