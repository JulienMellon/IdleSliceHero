"""Measure the main screen on the flagship late-game save, in REAL time (no fake clock): the numbers that say whether a change helped.

Usage: python3 scripts/review/perf.py [--seconds 20] [--json out.json]     (expects `npx expo export --platform web` output in dist/)

Loads the export at 393 x 852 with ?perf=1 (the app then counts commits behind that flag: src/components/scene/clock.ts `usePerfMarks`),
lets it run 20 real seconds and prints three numbers:
  frames over 16 ms       animation-frame gaps longer than 16.7 ms plus a 1 ms allowance (a 60 Hz frame that came on time is not counted)
  Storefront commit       median and worst milliseconds from render start to layout effect (React's own work for one scene frame)
  GameScreen commits/s    how often the whole main screen re-rendered
The save is the flagship of scripts/fixtures/09_lategame.py (`flag`): the industrial shop at max footprint, decor 3, every shop built.
Numbers depend on the machine: compare a before and an after taken on the same one, back to back.
"""
import json, os, statistics, sys

# shots_lib starts the static server for dist/ and reads argv[1] as its screenshot label; "dev" is the git-ignored scratch label
_args = sys.argv[1:]
sys.argv = [sys.argv[0], "dev"]
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from shots_lib import IDS, KEY, LATE_SAVE, URL, httpd, shop, sync_playwright  # noqa: E402

SECONDS = 20.0
FRAME_ALLOWANCE_MS = 1.0
FRAME_MS = 1000 / 60


def flagship_save():
    """The `flag` save of scripts/fixtures/09_lategame.py: LATE_SAVE with the industrial shop maxed and decorated."""
    decor3 = {"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3}
    seen = [f"{n}-{b}" for n in IDS for b in range(1, 5)][:19] + ["industrial-2b", "uptown-1"]
    return dict(LATE_SAVE, active="industrial", cash=2.0e8, seenScenes=seen, scrapbookViewed=20,
                shops=dict(LATE_SAVE["shops"], industrial=shop(prep=104, ovens=100, grade=4, counter=104, drivers=44, tables=90, footprint=4, sold=450000, decor=decor3)))


# every animation-frame gap, kept in the page (the gap list is read once at the end)
FRAMES = """(() => { window.__gaps = []; let last = 0;
  const loop = (t) => { if (last) window.__gaps.push(t - last); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop); })();"""


def measure(seconds=SECONDS):
    import time
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
        seed = json.dumps({KEY: json.dumps(dict(flagship_save(), lastSavedAt=int(time.time() * 1000)))})
        ctx.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{ const s = {seed}; for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.setItem('seeded', '1'); }}""")
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL + "?perf=1", wait_until="networkidle")
        # the title card, then whatever is due (an offline popup, a cut-scene, the gift calendar): tap each away so the scene is what runs
        for _ in range(12):
            up = next((t for t in ("title-card", "collect-offline", "skip-scene", "gift-close") if page.locator(f'[data-testid="{t}"]').count()), None)
            if not up:
                break
            page.locator(f'[data-testid="{up}"]').first.click()
            page.wait_for_timeout(700)
        page.wait_for_timeout(1500)
        page.evaluate("() => { window.__perf = { commits: {}, ms: {} }; }")   # forget the start-up
        page.evaluate(FRAMES)
        page.wait_for_timeout(int(seconds * 1000))
        out = page.evaluate("(k) => ({ gaps: window.__gaps, perf: window.__perf, save: (localStorage.getItem(k) || '').length })", KEY)
        browser.close()
    gaps, perf = out["gaps"], out["perf"]
    sf = perf["ms"].get("Storefront", [])
    result = {
        "seconds": seconds,
        "frames": len(gaps),
        "frames_over_16ms": sum(1 for g in gaps if g > FRAME_MS + FRAME_ALLOWANCE_MS),
        "storefront_commits": len(sf),
        "storefront_median_ms": round(statistics.median(sf), 2) if sf else None,
        "storefront_worst_ms": round(max(sf), 2) if sf else None,
        "gamescreen_commits": perf["commits"].get("GameScreen", 0),
        "gamescreen_commits_per_s": round(perf["commits"].get("GameScreen", 0) / seconds, 2),
        "save_bytes": out["save"],
        "errors": errors,
    }
    return result


if __name__ == "__main__":
    secs = SECONDS
    out_path = None
    for i, a in enumerate(_args):
        if a == "--seconds" and i + 1 < len(_args):
            secs = float(_args[i + 1])
        if a == "--json" and i + 1 < len(_args):
            out_path = _args[i + 1]
    r = measure(secs)
    httpd.shutdown()
    print(f"frames over 16 ms        {r['frames_over_16ms']} of {r['frames']} in {secs:g} s")
    print(f"Storefront commit        median {r['storefront_median_ms']} ms, worst {r['storefront_worst_ms']} ms ({r['storefront_commits']} commits)")
    print(f"GameScreen commits/s     {r['gamescreen_commits_per_s']} ({r['gamescreen_commits']} in {secs:g} s)")
    print(f"save payload             {r['save_bytes']} characters in localStorage")
    if r["errors"]:
        print("page errors:", *r["errors"][:3], sep="\n  ")
    if out_path:
        json.dump(r, open(out_path, "w"), indent=2)
