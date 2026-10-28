"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <version>   (expects `npx expo export --platform web` output in dist/)
Writes screenshots/<version>/*.png and screenshots/<version>/report.json (console errors, load status).
"""
import functools, http.server, json, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

VERSION = sys.argv[1] if len(sys.argv) > 1 else "dev"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
OUT = os.path.join(ROOT, "screenshots", VERSION)
os.makedirs(OUT, exist_ok=True)
KEY = "slice-empire/save/v1"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{port}/"

now_ms = int(time.time() * 1000)
seen_all_but = lambda ids: ids
def shop(built=True, managed=True, **kw):
    base = {"built": built, "managed": managed, "prep": 1, "ovens": 1, "grade": 0, "counter": 1, "drivers": 1, "tables": 1, "footprint": 0, "queued": 0, "sold": 0}
    base.update(kw)
    return base

IDS = ["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"]
MID_SAVE = {
    "saveVersion": 2, "cash": 3120, "totalEarned": 15000, "vehicle": 1, "active": "suburbs",
    "shops": {
        "downtown": shop(prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=4000),
        "suburbs": shop(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=700),
        "waterfront": shop(managed=False, sold=10),
        "university": shop(built=False, managed=False), "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False),
    },
    "dronesUnlocked": False, "cityComplete": False,
    "seenScenes": ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "waterfront-1"],
    "scrapbookViewed": 7, "lastSavedAt": now_ms,
}
report = {"version": VERSION, "errors": [], "shots": [], "loaded": False}

def shot(page, name, wait=0.6):
    time.sleep(wait)
    p = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=p)
    report["shots"].append(p)

def seeded_page(browser, save):
    """Fresh browser profile whose localStorage holds `save` before the app boots."""
    c = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    c.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{
        localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(save))});
        sessionStorage.setItem('seeded', '1'); }}""")
    pg = c.new_page()
    pg.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    pg.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))
    pg.goto(URL)
    return pg

def tid(page, t):
    return page.locator(f'[data-testid="{t}"]').first

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    page.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))

    # 1. Fresh install → opening cut-scene
    page.goto(URL)
    try:
        tid(page, "cutscene").wait_for(timeout=15000)
        report["loaded"] = True
    except Exception as e:
        report["errors"].append(f"cut-scene never appeared on first launch: {e}")
    shot(page, "01-opening-cutscene", 1.0)
    try:
        tid(page, "cutscene").click(); tid(page, "cutscene").click()
        shot(page, "02-cutscene-dialog", 0.8)
        tid(page, "skip-scene").click()
    except Exception as e:
        report["errors"].append(f"could not skip cut-scene: {e}")

    # 2. Fresh game screen; fill the tap queue and tap once more (should say "Kitchen full!")
    shot(page, "03-new-game")
    try:
        for _ in range(4):
            tid(page, "shop").click(); time.sleep(0.08)
        tid(page, "shop").click()
        shot(page, "03b-full-queue-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"full-queue tap failed: {e}")
    try:
        for i in range(40):
            tid(page, "shop").click(); time.sleep(0.25)
            if i % 4 == 3:
                for b in ["buy-drivers", "buy-tables"]:
                    tid(page, b).click()
            if page.locator('[data-testid="skip-scene"]').count():
                tid(page, "skip-scene").click()
        shot(page, "04-after-20s-play")
        cash = tid(page, "cash").inner_text()
        report["cash_after_play"] = cash
        if cash.strip() in ("$0", ""):
            report["errors"].append("cash still $0 after 20s of tapping — core loop broken")
    except Exception as e:
        report["errors"].append(f"core loop interaction failed: {e}")

    # 3. Mid-game save → main screen with drivers on routes
    page = seeded_page(browser, MID_SAVE); time.sleep(2.5)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "skip-scene").click()
    shot(page, "05-mid-game", 1.2)

    # 3b. An unmanaged pizzeria (Waterfront) via its tab, then the City overview
    try:
        tid(page, "tab-waterfront").click(); shot(page, "05b-unmanaged-shop", 0.8)
        tid(page, "open-city").click(); shot(page, "05c-city", 0.8)
        tid(page, "back").click()
    except Exception as e:
        report["errors"].append(f"tab/city navigation failed: {e}")

    # 4. Scrapbook
    try:
        tid(page, "open-scrapbook").click(); shot(page, "06-scrapbook", 1.0)
        tid(page, "back").click()
    except Exception as e:
        report["errors"].append(f"scrapbook navigation failed: {e}")

    # 5. Offline popup (away 2h)
    away = dict(MID_SAVE, lastSavedAt=now_ms - 2 * 3600 * 1000)
    page = seeded_page(browser, away)
    try:
        tid(page, "collect-offline").wait_for(timeout=8000)
    except Exception as e:
        report["errors"].append(f"offline popup missing: {e}")
    shot(page, "07-offline-popup", 0.8)

    # 6. Late game: every neighborhood, van fleet
    # On-curve late state (costs ~ a few minutes of income); exactly one cut-scene (industrial-3) is due.
    late = dict(MID_SAVE, cash=1.5e6, vehicle=3, active="industrial", dronesUnlocked=False,
                shops={
                    "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5),
                    "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5),
                    "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=2, sold=4e5),
                    "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=2, sold=3e5),
                    "industrial": shop(prep=52, ovens=48, grade=3, counter=50, drivers=22, tables=34, footprint=2, sold=180500),
                    "uptown": shop(managed=False, sold=0),
                },
                seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:18] + ["uptown-1"], scrapbookViewed=19)
    page = seeded_page(browser, late); time.sleep(2.5)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "cutscene").click(); shot(page, "08-late-cutscene", 0.8)
        tid(page, "skip-scene").click()
    shot(page, "09-late-game", 1.2)
    shot(page, "10-late-game-pops-a", 0.7)
    shot(page, "11-late-game-pops-b", 0.9)
    try:
        for _ in range(3):
            tid(page, "shop").click(); time.sleep(0.15)
        shot(page, "12-late-rush-tap", 0.2)
    except Exception as e:
        report["errors"].append(f"late oven tap failed: {e}")
    # 7. Flagship pizzeria with maxed Expand and Oven Grade
    flag = dict(late, active="downtown", seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:19] + ["uptown-1"], scrapbookViewed=20,
                shops=dict(late["shops"], downtown=shop(prep=120, ovens=118, grade=4, counter=119, drivers=60, tables=110, footprint=4, sold=9e5)))
    page = seeded_page(browser, flag); time.sleep(2.5)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "skip-scene").click()
    shot(page, "13-flagship-max", 1.2)
    page.mouse.wheel(0, 600)
    shot(page, "14-flagship-max-cards", 0.6)
    browser.close()

httpd.shutdown()
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
