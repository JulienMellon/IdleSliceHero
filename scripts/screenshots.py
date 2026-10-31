"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <version>   (expects `npx expo export --platform web` output in dist/)
Writes screenshots/<version>/*.png and screenshots/<version>/report.json (console errors, load status).
"""
import datetime, functools, http.server, json, os, socketserver, sys, threading, time
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

def shot(page, name, wait=0.6):
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

def seeded_page(browser, save):
    """Fresh browser profile whose localStorage holds `save` before the app boots."""
    c = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
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

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script(AUDIO_PROBE)
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    page.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))

    # 1. Fresh install → opening cut-scene
    page.goto(URL)
    # v5.1: the title card after the native splash
    try:
        tid(page, "title-card").wait_for(timeout=15000)
        shot(page, "00-title-card", 0.9)
    except Exception as e:
        report["errors"].append(f"title card never appeared: {e}")
    skip_title(page, 2000)
    try:
        tid(page, "cutscene").wait_for(timeout=15000)
        report["loaded"] = True
    except Exception as e:
        report["errors"].append(f"cut-scene never appeared on first launch: {e}")
    shot(page, "01-opening-cutscene", 1.0)
    try:
        tid(page, "cutscene").click(); tid(page, "cutscene").click()
        shot(page, "02-cutscene-dialog", 0.8)
        audio_log(page, "opening")
        tid(page, "skip-scene").click()
    except Exception as e:
        report["errors"].append(f"could not skip cut-scene: {e}")

    # 2. Fresh game screen; fill the tap queue and tap once more (should say "Kitchen full!")
    shot(page, "03-new-game")
    try:
        # v4.8: tap the prep table, then again while it's prepping (refused with its reason)
        tap_station(page, "prep"); time.sleep(0.3)
        tap_station(page, "prep")
        shot(page, "03b-full-queue-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"full-queue tap failed: {e}")
    try:
        # v4.7: three taps per batch (prep → oven → counter), each stage takes a few seconds
        for i in range(70):
            tap_station(page, ["counter", "oven", "prep"][i % 3]); time.sleep(0.3)
            if i % 4 == 3:
                for b in ["walk-drivers", "walk-ovens"]:
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
    page = seeded_page(browser, MID_SAVE); settle(page)
    shot(page, "05-mid-game", 1.2)

    # 3a. The full upgrades sheet (tap "All")
    try:
        tid(page, "open-upgrades").click(); shot(page, "05a-upgrades-sheet", 0.6)
        page.mouse.wheel(0, 900); time.sleep(0.4)
        page.locator('[data-testid="decor-plants"]').first.scroll_into_view_if_needed()
        shot(page, "05a2-decor-section", 0.4)
        tid(page, "close-upgrades").click()
    except Exception as e:
        report["errors"].append(f"upgrades sheet failed: {e}")

    # 3b. An unmanaged pizzeria (Waterfront) via its tab, then the City overview
    try:
        tid(page, "tab-waterfront").click(); shot(page, "05b-unmanaged-shop", 0.8)
        # the head cards and the GM's lock in a shop with no manager (D342)
        tid(page, "open-upgrades").click(); shot(page, "05b2-heads-drawer", 0.6)
        tid(page, "close-upgrades").click()
        # station taps: prep, then the oven while it's still prepping (refused, with the reason)
        tap_station(page, "prep"); shot(page, "05b3-prep-ring", 1.2)
        tap_station(page, "oven"); shot(page, "05b4-refused-tap", 0.2)
        # hire Finn from the sidewalk: his hello bubble over the prep badge, his face on the badge (D349)
        time.sleep(1.4)
        tid(page, "walk-manager").click(); shot(page, "05b5-hire-bubble", 0.5)
        # D376: an Ovens buy shows "+N% faster" rising from the oven's badge
        time.sleep(2.6)
        tid(page, "mini-ovens").click(); shot(page, "05b6-upgrade-flash", 0.25)
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
    audio_log(page, "offline")

    # 6. Late game: every neighborhood, van fleet
    # On-curve late state (costs ~ a few minutes of income); exactly one cut-scene (industrial-3) is due.
    late = dict(MID_SAVE, cash=1.5e6, vehicle=3, active="industrial", dronesUnlocked=False,
                shops={
                    "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5),
                    "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5),
                    "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=2, sold=4e5),
                    "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=2, sold=3e5),
                    "industrial": shop(prep=52, ovens=48, grade=3, counter=50, drivers=22, tables=34, footprint=2, sold=360500),
                    "uptown": shop(managed=False, sold=0),
                },
                seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:18] + ["uptown-1"], scrapbookViewed=19)
    page = seeded_page(browser, late); time.sleep(2.5)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(0.8)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "cutscene").click(); shot(page, "08-late-cutscene", 0.8)
        tid(page, "skip-scene").click()
    settle(page, 0.3)
    shot(page, "09-late-game", 1.2)
    # D361: land these just after a pickup, so the pop riding the carrier is in the frame
    def pop_on_screen(timeout=7000):
        try:
            page.wait_for_function("() => [...document.querySelectorAll('text')].some((t) => (t.textContent || '').includes('+$'))", timeout=timeout)
        except Exception:
            pass
    pop_on_screen(); shot(page, "10-late-game-pops-a", 0.15)
    time.sleep(1.5); pop_on_screen(); shot(page, "11-late-game-pops-b", 0.15)
    try:
        for _ in range(3):
            tap_shop(page); time.sleep(0.15)
        shot(page, "12-late-rush-tap", 0.2)
    except Exception as e:
        report["errors"].append(f"late oven tap failed: {e}")
    # v5.0: every neighbourhood's own look (the critic had no Suburbs or University interior)
    try:
        for hood in ["suburbs", "university", "downtown"]:
            tid(page, f"tab-{hood}").click(force=True); time.sleep(1.0)
            settle(page, 0.3)
            shot(page, f"25-look-{hood}", 0.6)
    except Exception as e:
        report["errors"].append(f"neighbourhood look shots failed: {e}")
    # 7. Flagship pizzeria with maxed Expand and Oven Grade
    flag = dict(late, active="industrial", cash=2.0e8, seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:19] + ["uptown-1"], scrapbookViewed=20,
                shops=dict(late["shops"], industrial=shop(prep=104, ovens=100, grade=4, counter=104, drivers=44, tables=90, footprint=4, sold=450000,
                           decor={"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3})))
    page = seeded_page(browser, flag); settle(page)
    shot(page, "13-flagship-max", 1.2)
    # 8. Uptown, fully decorated, with tier-3 signage
    up = dict(flag, active="uptown", shops=dict(flag["shops"], uptown=shop(perk=True, prep=40, ovens=36, grade=2, counter=38, drivers=18, tables=30, footprint=2, sold=9e4,
              decor={"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3})))
    page = seeded_page(browser, up); settle(page)
    shot(page, "14-uptown-decorated", 1.2)
    # 9. A station tag opens the drawer focused on that station
    try:
        tid(page, "open-upgrades").click(); shot(page, "15-uptown-drawer", 0.6)
        page.mouse.wheel(0, 1400); shot(page, "15a-uptown-decor-section", 0.6)
    except Exception as e:
        report["errors"].append(f"uptown drawer failed: {e}")

    # 10. Playtest fixes the earlier shots could not show
    # 10a. Tied stations: the drawer explains what to buy together
    tied = dict(MID_SAVE, cash=500, active="downtown", scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], downtown=shop(prep=6, ovens=8, counter=20, drivers=30, tables=4)))
    page = seeded_page(browser, tied); settle(page)
    try:
        tid(page, "open-upgrades").click(); shot(page, "16-tied-bundle-drawer", 0.7)
    except Exception as e:
        report["errors"].append(f"tied drawer failed: {e}")
    # 10b. Frugal path: Suburbs stays locked until Nonna takes over, with a countdown toast on the City screen
    frugal = dict(MID_SAVE, cash=1000, vehicle=0, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                  shops={"downtown": shop(managed=False, prep=3, ovens=3, counter=3, drivers=3, sold=40), "suburbs": shop(built=False, managed=False),
                         "waterfront": shop(built=False, managed=False), "university": shop(built=False, managed=False),
                         "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False)})
    page = seeded_page(browser, frugal); settle(page)
    try:
        tid(page, "open-city").click(); time.sleep(0.6)
        tid(page, "city-row-suburbs").click(force=True); shot(page, "17-suburbs-locked", 0.4)
    except Exception as e:
        report["errors"].append(f"suburbs lock shot failed: {e}")
    # 10c. Cut-scene props: the Pier 9 sold sign and Nonna's recipe card
    pier = dict(MID_SAVE, active="waterfront", seenScenes=["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-4", "waterfront-1", "waterfront-2"],
                shops=dict(MID_SAVE["shops"], waterfront=shop(prep=20, ovens=18, counter=20, drivers=12, sold=15100)))
    page = seeded_page(browser, pier); time.sleep(3)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(0.8)
    if page.locator('[data-testid="cutscene"]').count():
        shot(page, "18-sold-sign-scene", 0.6)
    sauce = dict(MID_SAVE, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                 shops=dict(MID_SAVE["shops"], downtown=shop(managed=False, prep=20, ovens=18, counter=20, drivers=12, sold=160), suburbs=shop(built=False, managed=False), waterfront=shop(built=False, managed=False)))
    page = seeded_page(browser, sauce); time.sleep(3)
    try:
        for _ in range(14):
            if page.get_by_text("secret sauce recipe").count():
                break
            tid(page, "cutscene").click(); time.sleep(1.3)
        shot(page, "19-recipe-card-scene", 0.5)
        audio_log(page, "recipe")
    except Exception as e:
        report["errors"].append(f"recipe card scene failed: {e}")
    # 10d. Away longer than the offline cap: the popup says so
    page = seeded_page(browser, dict(MID_SAVE, lastSavedAt=now_ms - 9 * 3600 * 1000))
    try:
        tid(page, "collect-offline").wait_for(timeout=8000)
        shot(page, "20-offline-capped", 0.8)
    except Exception as e:
        report["errors"].append(f"capped offline popup missing: {e}")

    # 11. v3.7: the Pier 9 bid leads the goal bar, and a finale shows its neighbourhood perk
    bid = dict(MID_SAVE, cash=1.2e6, active="waterfront", scrapbookViewed=10,
               seenScenes=MID_SAVE["seenScenes"] + ["suburbs-4", "waterfront-2", "waterfront-3"],
               shops=dict(MID_SAVE["shops"], waterfront=shop(prep=30, ovens=28, grade=1, counter=30, drivers=14, tables=12, footprint=1, sold=52000)))
    page = seeded_page(browser, bid); settle(page)
    shot(page, "21-pier9-bid-goal", 0.8)
    dale = dict(MID_SAVE, active="suburbs", seenScenes=MID_SAVE["seenScenes"], scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], suburbs=shop(prep=30, ovens=28, grade=1, counter=30, drivers=14, tables=20, footprint=1, sold=8100)))
    page = seeded_page(browser, dale); time.sleep(3)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(1.0)
    try:
        for _ in range(20):
            if page.get_by_text("PERK", exact=False).count():
                break
            tid(page, "cutscene").click(); time.sleep(1.3)
        shot(page, "22-dale-perk-card", 0.6)
    except Exception as e:
        report["errors"].append(f"perk card shot failed: {e}")

    # 12. v3.8: an earned perk shows as a banner in that shop's drawer (D308)
    perked = dict(MID_SAVE, active="suburbs", scrapbookViewed=9, seenScenes=MID_SAVE["seenScenes"] + ["suburbs-4"],
                  shops=dict(MID_SAVE["shops"], suburbs=dict(MID_SAVE["shops"]["suburbs"], perk=True, sold=8200)))
    page = seeded_page(browser, perked); settle(page)
    try:
        tid(page, "open-upgrades").click(); shot(page, "23-perk-banner-drawer", 0.7)
    except Exception as e:
        report["errors"].append(f"perk banner shot failed: {e}")
    # 13. v4.4: Settings has Music and Sound toggles (AU24); the probe shows what a short session played
    try:
        page.keyboard.press("Escape"); time.sleep(0.3)
        page = seeded_page(browser, perked); settle(page)
        for _ in range(6):
            tap_shop(page); time.sleep(0.25)
        settle(page, 0.5)  # a story beat may have come due during the taps
        tid(page, "tab-downtown").click(); time.sleep(1.0)
        settle(page, 0.3)
        audio_log(page, "session")
        tid(page, "open-city").click(); time.sleep(0.6)
        tid(page, "open-settings").click(); time.sleep(0.6)
        tid(page, "toggle-music").click()
        shot(page, "24-settings-audio", 0.5)
    except Exception as e:
        report["errors"].append(f"settings audio shot failed: {e}")

    # 14. v5.4: daily/weekly tasks and the gift calendar, from a save that looks mid-week
    def day_str(offset=0):
        return (datetime.datetime.now() + datetime.timedelta(days=offset)).strftime("%Y-%m-%d")
    monday = (datetime.datetime.now() - datetime.timedelta(days=datetime.datetime.now().weekday())).strftime("%Y-%m-%d")
    stats = {"upgrades": 14, "ovens": 5, "hires": 1, "builds": 0, "fleet": 0, "decor": 2, "walkins": 90, "deliveries": 130, "baked": 210, "offline": 1, "boosters": 0, "dailyDone": 9, "days": 3}
    def rewarded(last, streak, diamonds=42, shown=None, generate=False):
        """A rewards-unlocked save. With `generate`, the daily and weekly sets are left empty (day = week = ''), so the game rolls
        them itself on load: the on-screen targets are exactly what the generator makes for this save (D389)."""
        r = {
            "day": "" if generate else day_str(), "daily": [], "points": 40, "chests": [False, False, False], "rerollUsed": False,
            "week": "" if generate else monday, "weekly": [], "weeklyChest": False,
            "gift": {"streak": streak, "last": last, "saveUsed": False, "cycle": 0}, "giftShownDay": shown or "",
            "diamonds": diamonds, "boosters": [{"mult": 2, "seconds": 900}, {"mult": 2, "seconds": 1800}],
            "boosts": [{"mult": 2, "until": now_ms + 14 * 60 * 1000 + 5000, "source": "booster"}],
            "cosmetics": ["oven-woodfired"], "lastSeen": now_ms - 60000}
        return dict(MID_SAVE, saveVersion=5, stats=stats, lastSavedAt=int(time.time() * 1000), totalEarned=15000, rewards=r)
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
    try:
        page = played_page(browser, rewarded(day_str(), 3, generate=True))
        shot(page, "29-hud-rewards", 0.8)
        tid(page, "open-tasks").click(); shot(page, "30-tasks-daily", 0.8)
        page.locator('[data-testid="chest-0"]').first.scroll_into_view_if_needed(); shot(page, "30b-tasks-daily-chests", 0.5)
        tid(page, "tab-weekly").click(); page.locator('[data-testid$="claim-weekly-0"]').first.scroll_into_view_if_needed(); shot(page, "31-tasks-weekly", 0.6)
        page.locator('[data-testid="weekly-chest"]').first.scroll_into_view_if_needed(); shot(page, "31b-tasks-weekly-chest", 0.5)
    except Exception as e:
        report["errors"].append(f"tasks shots failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-1), 6))
        tid(page, "gift-calendar").wait_for(timeout=8000)
        shot(page, "32-gift-calendar", 1.0)
    except Exception as e:
        report["errors"].append(f"gift calendar shot failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-2), 6, diamonds=25))
        tid(page, "gift-calendar").wait_for(timeout=8000)
        shot(page, "33-gift-streak-save", 1.0)
    except Exception as e:
        report["errors"].append(f"gift streak-save shot failed: {e}")
    browser.close()

httpd.shutdown()
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
