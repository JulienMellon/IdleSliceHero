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
MID_SAVE = {
    "saveVersion": 1, "cash": 3120, "totalEarned": 15000, "ovenLevel": 18, "drivers": 9, "vehicle": 1,
    "unlocked": ["downtown", "suburbs", "waterfront"],
    "delivered": {"downtown": 900, "suburbs": 620, "waterfront": 120, "university": 0, "industrial": 0, "uptown": 0},
    "stock": 6, "batchProgress": 0.5, "autoBake": True, "dronesUnlocked": False, "cityComplete": False,
    "seenScenes": ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "waterfront-1"],
    "lastSavedAt": now_ms,
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

    # 2. Fresh game screen, then tap the oven and play ~20s
    shot(page, "03-new-game")
    try:
        for i in range(40):
            tid(page, "oven").click(); time.sleep(0.25)
            if i % 8 == 7:
                for b in ["buy-driver", "buy-oven"]:
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
    late = dict(MID_SAVE, cash=2.4e6, ovenLevel=72, drivers=41, vehicle=3,
                unlocked=["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"],
                seenScenes=[f"{n}-{b}" for n in ["downtown","suburbs","waterfront","university","industrial","uptown"] for b in range(1,5)][:21],
                delivered={"downtown": 1e5, "suburbs": 8e4, "waterfront": 6e4, "university": 3e4, "industrial": 2e4, "uptown": 7000}, dronesUnlocked=True)
    page = seeded_page(browser, late); time.sleep(2.5)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "cutscene").click(); shot(page, "08-late-cutscene", 0.8)
        tid(page, "skip-scene").click()
    shot(page, "09-late-game", 1.2)
    browser.close()

httpd.shutdown()
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
