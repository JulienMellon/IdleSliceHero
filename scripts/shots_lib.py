"""Shared helpers for scripts/screenshots.py and the fixtures in scripts/fixtures/ (v5.14 K0b).

Importing this module starts the static server for dist/ and creates the shared `report`; a fixture just does
`from shots_lib import *` and uses `seeded_page`, `settle`, `shot`, `tid`, `report`, ... Version comes from argv[1].
"""
import datetime, functools, http.server, json, os, re, socketserver, sys, threading, time
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
    base = {"decor": {"plants": 0, "flooring": 0, "tables": 0, "walls": 0, "signage": 0}, "built": built, "managed": managed, "prep": 1, "ovens": 1, "grade": 0, "counter": 1, "drivers": 1, "tables": 1, "footprint": 0, "queued": 0, "sold": 0}
    base.update(kw)
    return base

IDS = ["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"]
MID_SAVE = {
    "saveVersion": 2, "cash": 3120, "totalEarned": 15000, "vehicle": 1, "active": "suburbs",
    "shops": {
        "downtown": shop(prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=4000),
        "suburbs": shop(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=700,
                        decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}),
        "waterfront": shop(managed=False, sold=10),
        "university": shop(built=False, managed=False), "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False),
    },
    "dronesUnlocked": False, "cityComplete": False,
    "seenScenes": ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "waterfront-1"],
    "scrapbookViewed": 7, "lastSavedAt": now_ms,
}
report = {"version": VERSION, "errors": [], "shots": [], "loaded": False}

def _only_arg(argv):
    """`--only a,b` / `--only=a,b` from the command line: the fixture names (or number prefixes) to run; None = all of them."""
    for i, a in enumerate(argv):
        if a == "--only" and i + 1 < len(argv):
            return [t.strip() for t in argv[i + 1].split(",") if t.strip()]
        if a.startswith("--only="):
            return [t.strip() for t in a[len("--only="):].split(",") if t.strip()]
    return None

ONLY = _only_arg(sys.argv[2:])
if ONLY is not None:
    report["only"] = ONLY  # a partial run can never be mistaken for a full one

# ---- expectations: a fixture says which state a shot is meant to show; a miss is an error, not a skipped shot ----
_current = {"fixture": "screenshots.py"}
_missed = []

def _flush_missed(before):
    for what in _missed:
        report["errors"].append(f"fixture {_current['fixture']}: expected {what} before shot {before}")
    del _missed[:]

def expect(page, testid, timeout=5000):
    """Wait for [data-testid=testid] to be on screen. A miss is reported against the next shot and the fixture carries on."""
    try:
        page.locator(f'[data-testid="{testid}"]').first.wait_for(timeout=timeout)
        return True
    except Exception:
        _missed.append(f'testid "{testid}"')
        return False

def expect_text(page, testid, pattern, timeout=5000):
    """Wait for the text of [data-testid=testid] to match the regex `pattern` (case-insensitive). With testid=None the text of every
    SVG <text> on the page is searched (for what the scene draws, a head's bark, which has no test ID)."""
    sel = f'[data-testid="{testid}"]'
    want = re.compile(pattern, re.I | re.S)
    deadline = time.time() + timeout / 1000
    while True:
        try:
            if testid is None:
                txt = page.evaluate("() => [...document.querySelectorAll('text')].map((t) => t.textContent || '').join('\\n')")
            else:
                txt = page.locator(sel).first.inner_text(timeout=300)
            if want.search(txt or ""):
                return True
        except Exception:
            pass
        if time.time() >= deadline:
            break
        time.sleep(0.15)
    _missed.append(f'text /{pattern}/ in ' + (f'testid "{testid}"' if testid else "the scene's text"))
    return False

def shot(page, name, wait=0.6):
    _flush_missed(name)
    time.sleep(wait)
    p = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=p)
    report["shots"].append(p)

# Audio probe (v4.4): log every media play() as "<file> @<seconds since load>" so a run shows which cues fired.
AUDIO_PROBE = """(() => { window.__audioLog = []; const t0 = performance.now();
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const f = (this.currentSrc || this.src || '').split('/').pop().split('?')[0].replace(/\\.[0-9a-f]{20,}/, '');
    window.__audioLog.push(f + ' @' + ((performance.now() - t0) / 1000).toFixed(1));
    return play.apply(this, arguments); }; })();"""

def audio_log(page, label):
    try:
        report.setdefault("audio", {})[label] = page.evaluate("window.__audioLog || []")
    except Exception as e:
        report.setdefault("audio", {})[label] = [f"probe failed: {e}"]

_last_seeded = None
def seeded_page(browser, save):
    """Fresh browser profile whose localStorage holds `save` before the app boots."""
    # v5.12: close the previous seeded profile first; ~50 live pages animating at once stalled the late shots.
    global _last_seeded
    if _last_seeded is not None:
        try: _last_seeded.close()
        except Exception: pass
    c = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    _last_seeded = c
    c.set_default_timeout(20000)
    c.add_init_script(AUDIO_PROBE)
    c.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{
        localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(save))});
        sessionStorage.setItem('seeded', '1'); }}""")
    pg = c.new_page()
    pg.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    pg.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))
    pg.goto(URL)
    skip_title(pg)
    return pg

def skip_title(page, timeout=8000):
    """v5.1: a title card opens every launch; tap it away (it would also go by itself in ≤ 2 s)."""
    try:
        tid(page, "title-card").wait_for(timeout=timeout)
        tid(page, "title-card").click()
        page.locator('[data-testid="title-card"]').wait_for(state="detached", timeout=3000)
    except Exception:
        pass

def settle(page, wait=2.5):
    """Dismiss the offline popup, any due cut-scene and the daily gift calendar so the scene is interactive."""
    time.sleep(wait)
    quiet = 0
    for _ in range(12):  # v4.5: audio preloading can delay the popup or a due beat, so wait for two quiet checks
        if page.locator('[data-testid="collect-offline"]').count():
            tid(page, "collect-offline").click(); time.sleep(0.6); quiet = 0
        elif page.locator('[data-testid="skip-scene"]').count():
            tid(page, "skip-scene").click(); time.sleep(0.6); quiet = 0
        elif page.locator('[data-testid="gift-close"]').count():  # v5.4: the daily gift calendar opens by itself once per day
            tid(page, "gift-close").click(); time.sleep(0.6); quiet = 0
        else:
            quiet += 1
            if quiet >= 2:
                break
            time.sleep(0.5)

def tap_shop(page):
    """Tap the back wall of the pizzeria (clear of the station tags)."""
    box = tid(page, "shop").bounding_box()
    page.mouse.click(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.22)

def tap_station(page, st):
    """Tap a kitchen station: the shop's own hit-test decides; these points sit on the furniture."""
    box = tid(page, "shop").bounding_box()
    fx = {"prep": 0.31, "oven": 0.46, "counter": 0.6}[st]
    fy = {"prep": 0.5, "oven": 0.45, "counter": 0.5}[st]
    page.mouse.click(box["x"] + box["width"] * fx, box["y"] + box["height"] * fy)

def tid(page, t):
    return page.locator(f'[data-testid="{t}"]').first

# ---- save builders and page helpers shared by the shots (moved out of the run loop) ----
def day_str(offset=0):
    return (datetime.datetime.now() + datetime.timedelta(days=offset)).strftime("%Y-%m-%d")

def played_page(browser, save):
    """Boot `save` (the game rolls its task sets), then add some play on top of what it saved and reload: progress is
    measured from the generated baselines, so every target on screen is the generator's own."""
    pg = seeded_page(browser, save); settle(pg, 3.5)
    pg.evaluate("""(key) => {
        const g = JSON.parse(localStorage.getItem(key));
        const add = {upgrades: 6, walkins: 30, deliveries: 60, baked: 90, ovens: 2, dailyDone: 3, offline: 1};
        for (const k in add) g.stats[k] = (g.stats[k] || 0) + add[k];
        g.totalEarned += 4000; g.rewards.points = 40;
        if (g.rewards.daily.length > 4) g.rewards.daily[4].claimed = true;
        localStorage.setItem(key, JSON.stringify(g));
    }""", KEY)
    pg.reload(); skip_title(pg); settle(pg, 3.0)
    return pg

def hood_save(hood, cash=5e5, vehicle=2, **kw):
    return dict(MID_SAVE, cash=cash, vehicle=vehicle, active=hood, scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], **{hood: shop(**kw)}))

HOOK_PLAY = 300
def hooks_save(order=None, bonus=None, stats=None, **shop_kw):
    # D422: the Suburbs shop at the same mid-game levels as the other fixtures (about 7.7 pies/s), so an order's target (1,100 pies for
    # 2 minutes) and the kitchen counters agree; `sold` leaves room for an order's start count to sit below it
    kw = dict(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=5000,
              decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})
    kw.update(shop_kw)
    sv = hood_save("suburbs", cash=2e4, **kw)
    sv.update(lastSavedAt=int(time.time() * 1000), playSeconds=HOOK_PLAY, rewards={"giftShownDay": day_str()})
    if order: sv["order"] = dict({"seed": 7, "made": 1, "nextAt": HOOK_PLAY + 400}, **order)
    if bonus: sv["bonus"] = dict({"seed": 7, "spawned": 2, "next": HOOK_PLAY + 400}, **bonus)
    if stats: sv["stats"] = stats
    return sv
def quiet_start(pg, wait=0.2):
    """A short settle: dismiss a due scene or popup, but keep the clock (a golden pizza stays 12 s)."""
    settle(pg, wait)

# ---- saves several fixtures share ----
LATE_SAVE = dict(MID_SAVE, cash=1.5e6, vehicle=3, active="industrial", dronesUnlocked=False,
                 shops={
                     "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5),
                     "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5),
                     "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=2, sold=4e5),
                     "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=2, sold=3e5),
                     "industrial": shop(prep=52, ovens=48, grade=3, counter=50, drivers=22, tables=34, footprint=2, sold=360500),
                     "uptown": shop(managed=False, sold=0),
                 },
                 seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:18] + ["uptown-1"], scrapbookViewed=19)
TIED_SAVE = dict(MID_SAVE, cash=500, active="downtown", scrapbookViewed=8,
                 shops=dict(MID_SAVE["shops"], downtown=shop(prep=6, ovens=8, counter=20, drivers=30, tables=4)))
FRUGAL_SAVE = dict(MID_SAVE, cash=1000, vehicle=0, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                   shops={"downtown": shop(managed=False, prep=3, ovens=3, counter=3, drivers=3, sold=40), "suburbs": shop(built=False, managed=False),
                          "waterfront": shop(built=False, managed=False), "university": shop(built=False, managed=False),
                          "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False)})

# ---- per-card fixtures: scripts/fixtures/NN_card.py, each with run(ctx) ----
FIXTURES = os.path.join(ROOT, "scripts", "fixtures")

def fixture_files():
    return sorted(f for f in os.listdir(FIXTURES) if f.endswith(".py") and not f.startswith("_")) if os.path.isdir(FIXTURES) else []

def wanted(name, only):
    """`--only` matches a fixture by its file name without `.py` (56_u1) or by its number prefix alone (56)."""
    stem = name[:-3]
    return only is None or any(stem == t or stem.split("_")[0] == t for t in only)

def run_fixtures(browser, only=None):
    """Import every scripts/fixtures/*.py in sorted order and call its run(ctx). A fixture that raises is reported, not fatal.
    `only` (default: --only on the command line) limits the run to those fixtures.
    ctx has: browser, report, version, out (the screenshots folder)."""
    import importlib.util, types
    only = ONLY if only is None else only
    ctx = types.SimpleNamespace(browser=browser, report=report, version=VERSION, out=OUT)
    names = fixture_files()
    for t in only or []:
        if not any(wanted(n, [t]) for n in names):
            report["errors"].append(f"--only {t}: no such fixture in scripts/fixtures/")
    for name in names:
        if not wanted(name, only):
            continue
        _current["fixture"] = name
        del _missed[:]
        try:
            spec = importlib.util.spec_from_file_location(f"fixture_{name[:-3]}", os.path.join(FIXTURES, name))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            mod.run(ctx)
        except Exception as e:
            report["errors"].append(f"fixture {name} failed: {e}")
        _flush_missed("(none: the fixture ended first)")
