"""Record the raw footage for the 15 s Slice Empire promo.

Usage: python3 record.py <dist> <out_dir>
Steps the page's fake clock 1/30 s per frame and screenshots each frame, so the footage is smooth
and deterministic. Writes <out>/<segment>/f0000.png ... and <out>/taps.json (frame, x, y in 1080x1920 px).
"""
import functools, http.server, json, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

DIST, OUT = sys.argv[1], sys.argv[2]
FPS = 30
DT = 1000 / FPS
W, H = 393, 699                     # 9:16 viewport, rendered at 1080x1920
SCALE = 1080 / W
KEY = "slice-empire/save/v1"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)):
            self.path = "/index.html"
        return super().send_head()

httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{httpd.server_address[1]}/"

now_ms = int(time.time() * 1000)
IDS = ["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"]
def shop(built=True, managed=True, **kw):
    base = {"decor": {"plants": 0, "flooring": 0, "tables": 0, "walls": 0, "signage": 0}, "built": built, "managed": managed,
            "prep": 1, "ovens": 1, "grade": 0, "counter": 1, "drivers": 1, "tables": 1, "footprint": 0, "queued": 0, "sold": 0}
    base.update(kw)
    return base
ALL_SEEN = [f"{n}-{b}" for n in IDS for b in range(1, 5)]
DECOR3 = {"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3}
LATE_SHOPS = {
    "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5, decor=DECOR3),
    "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5, decor=DECOR3),
    "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=3, sold=4e5, decor=DECOR3),
    "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=3, sold=3e5, decor=DECOR3),
    "industrial": shop(prep=104, ovens=100, grade=4, counter=104, drivers=44, tables=90, footprint=4, sold=450000, decor=DECOR3),
    "uptown": shop(perk=True, prep=40, ovens=36, grade=2, counter=38, drivers=18, tables=30, footprint=3, sold=9e4, decor=DECOR3),
}
def save(**kw):
    s = {"saveVersion": 2, "cash": 3120, "totalEarned": 15000, "vehicle": 1, "active": "downtown", "shops": {},
         "dronesUnlocked": False, "cityComplete": False, "seenScenes": [], "scrapbookViewed": 0, "lastSavedAt": now_ms}
    s.update(kw)
    return s

# Kitchen: an early Waterfront shop with no heads (three taps per batch), story caught up.
KITCHEN = save(cash=400, active="waterfront", seenScenes=ALL_SEEN[:10], scrapbookViewed=10, shops={
    "downtown": shop(prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=4000),
    "suburbs": shop(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=9000),
    "waterfront": shop(managed=False, prep=30, ovens=28, counter=30, drivers=12, tables=8, sold=10),
    "university": shop(built=False, managed=False), "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False)})
# Busy: the maxed flagship, van fleet, every story beat seen.
BUSY = save(cash=2.4e8, totalEarned=9e8, vehicle=3, active="industrial", seenScenes=ALL_SEEN, scrapbookViewed=24, cityComplete=True, shops=LATE_SHOPS)

taps = []

def page_for(browser, s, title=False):
    c = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE, is_mobile=True, has_touch=True)
    if s is not None:
        c.add_init_script(f"localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(s))});")
    pg = c.new_page()
    pg.on("pageerror", lambda e: print("pageerror", e))
    pg.clock.install()
    pg.goto(URL)
    return pg

def step(pg, ms):
    pg.clock.run_for(int(ms))

def clear(pg):
    """Tap away the title card, offline popup, cut-scenes and gift calendar."""
    for _ in range(30):
        step(pg, 250)
        time.sleep(0.05)
        for t in ["title-card", "collect-offline", "skip-scene", "gift-close"]:
            loc = pg.locator(f'[data-testid="{t}"]')
            if loc.count():
                try:
                    loc.first.click(timeout=1000)
                except Exception:
                    pass
    step(pg, 600)

def capture(pg, seg, seconds, actions=None, start_frame=0):
    """Capture `seconds` of frames. `actions` maps frame index -> callable(pg) -> optional (x, y) css point for a tap mark."""
    d = os.path.join(OUT, seg)
    os.makedirs(d, exist_ok=True)
    n = int(round(seconds * FPS))
    for i in range(n):
        if actions and i in actions:
            pt = actions[i](pg)
            if pt:
                taps.append({"seg": seg, "frame": i, "x": pt[0] * SCALE, "y": pt[1] * SCALE})
        pg.screenshot(path=os.path.join(d, f"f{i:04d}.png"))
        step(pg, DT)

STATION_PX = {"prep": (300, 1010), "oven": (470, 800), "counter": (610, 1010)}   # 1080x1920 frame px (9:16 layout)

def station(st):
    def act(pg):
        x, y = STATION_PX[st][0] / SCALE, STATION_PX[st][1] / SCALE
        pg.mouse.click(x, y)
        return (x, y)
    return act


def press(tid):
    def act(pg):
        loc = pg.locator(f'[data-testid="{tid}"]').first
        b = loc.bounding_box()
        loc.click(force=True)
        return (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2) if b else None
    return act

def seg_kitchen(browser):
    """Tap whatever station the HUD names next (prep -> oven -> counter), at most every 8 frames."""
    pg = page_for(browser, KITCHEN); clear(pg)
    d = os.path.join(OUT, "kitchen"); os.makedirs(d, exist_ok=True)
    last = -99
    for i in range(int(5.0 * FPS)):
        if i >= 4 and i - last >= 8:
            hud = pg.evaluate("() => [...document.querySelectorAll('div')].map(e => e.textContent).find(t => t && /^Tap to (serve|bake|prep)/.test(t)) || ''")
            st = "counter" if "serve" in hud else "oven" if "bake" in hud else "prep" if "prep" in hud else None
            if st:
                x, y = station(st)(pg)
                taps.append({"seg": "kitchen", "frame": i, "x": x * SCALE, "y": y * SCALE, "st": st})
                last = i
        pg.screenshot(path=os.path.join(d, f"f{i:04d}.png"))
        step(pg, DT)

def seg_busy(browser):
    pg = page_for(browser, BUSY); clear(pg)
    step(pg, 2500)
    capture(pg, "busy", 4.2, {40: station("oven"), 70: station("oven")})

def seg_tour(browser):
    pg = page_for(browser, dict(BUSY, active="uptown")); clear(pg)
    capture(pg, "tour-uptown", 1.1)
    for hood in ["waterfront", "suburbs"]:
        pg.locator(f'[data-testid="tab-{hood}"]').first.click(force=True)
        step(pg, 900); time.sleep(0.2); clear(pg)
        capture(pg, f"tour-{hood}", 1.1)
    pg.locator('[data-testid="open-city"]').first.click(force=True)
    step(pg, 700)
    capture(pg, "city", 1.2)

def seg_title(browser):
    pg = page_for(browser, BUSY)
    for _ in range(200):
        if pg.locator('[data-testid="title-card"]').count():
            break
        time.sleep(0.05)
    print("title card present:", pg.locator('[data-testid="title-card"]').count())
    capture(pg, "title", 2.0)

SEGS = {"kitchen": seg_kitchen, "busy": seg_busy, "tour": seg_tour, "title": seg_title}
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    only = [x for x in os.environ.get("ONLY", "").split(",") if x] or list(SEGS)
    tp = os.path.join(OUT, "taps.json")
    if os.path.exists(tp):
        taps.extend(t for t in json.load(open(tp)) if t["seg"] not in only)
    for name in only:
        SEGS[name](browser)
    json.dump(taps, open(tp, "w"), indent=1)
    print("done", {d: len(os.listdir(os.path.join(OUT, d))) for d in sorted(os.listdir(OUT)) if os.path.isdir(os.path.join(OUT, d))})
