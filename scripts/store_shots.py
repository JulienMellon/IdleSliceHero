"""App Store screenshots: six seeded scenes, no device frame and no added text.

Usage:  python3 scripts/store_shots.py [--only 01,04] [--set iphone|ipad|all]      (expects `npx expo export --platform web` output in dist/)

Writes marketing/store/iphone-6.9/NN-name.png at 1320 x 2868 px (a 440 x 956 pt page at 3x: the 6.9-inch iPhone set, the one iPhone size App Store
Connect requires; it scales that set down for the smaller phones). If app.json has `expo.ios.supportsTablet` true it also writes
marketing/store/ipad-13/NN-name.png at 2064 x 2752 px (1032 x 1376 pt at 2x); today it is false, so the iPad set is skipped (`--set ipad` forces it,
to see whether the layout holds). Every file's pixel size is checked after the shot; a wrong size is an error and the script exits 1.
Apple's accepted sizes change with new devices: check docs/STORE-LISTING.md ("Screenshot sizes") before uploading.

Built on scripts/shots_lib.py as scripts/fixtures/README.md describes: the page runs on the frozen clock, time moves only through advance(),
and expect() runs before each shot so a scene that did not reach its state is reported instead of shipped. Scenes:
  01 Downtown in full swing     a late-game save with pops, coins and queues
  02 a cut-scene panel          the opening scene of a fresh install, on a line of dialogue
  03 the City screen with stars the finished city, every pin starred, an attack marked
  04 a Game Day rush            Suburbs on its game day, the families filling the free seats
  05 the welcome-back gift      Nonna's night oven opened after 3 h away, the total counting up
  06 the Scrapbook              the recipe cards of a finished story
"""
import importlib.util, json, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def _cli(argv):
    """`--only 01,04` and `--set iphone|ipad|all` from the command line (our own: shots_lib reads argv too, so it is cleared before the import)."""
    opts = {"only": None, "set": "auto"}
    for i, a in enumerate(argv):
        if a == "--only" and i + 1 < len(argv):
            opts["only"] = [t.strip() for t in argv[i + 1].split(",") if t.strip()]
        elif a.startswith("--only="):
            opts["only"] = [t.strip() for t in a[len("--only="):].split(",") if t.strip()]
        elif a == "--set" and i + 1 < len(argv):
            opts["set"] = argv[i + 1]
        elif a.startswith("--set="):
            opts["set"] = a[len("--set="):]
    return opts


OPTS = _cli(sys.argv[1:])
sys.argv = [sys.argv[0], "dev"]   # shots_lib's scratch label: screenshots/dev is git-ignored; the marketing files are copied out of it

import shots_lib  # noqa: E402  (starts the static server for dist/)
from shots_lib import (  # noqa: E402
    FIXTURES, IDS, LATE_SAVE, MID_SAVE, OUT, T0_MS, advance, day_str, expect, expect_text, hooks_save, report, seeded_page, settle, shot, tid, until,
)
from playwright.sync_api import sync_playwright  # noqa: E402

ROOT = shots_lib.ROOT
STORE_DIR = os.path.join(ROOT, "marketing", "store")

#            folder        viewport (pt)  scale  pixels
SETS = {
    "iphone": ("iphone-6.9", (440, 956), 3, (1320, 2868)),
    "ipad": ("ipad-13", (1032, 1376), 2, (2064, 2752)),
}


def _fixture(stem):
    """A fixture file by name, for the saves it already builds (one rule, one place: a scene is seeded the way its own card seeds it)."""
    spec = importlib.util.spec_from_file_location(f"store_{stem}", os.path.join(FIXTURES, stem + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Scaled:
    """A browser whose contexts all get one device scale factor (shots_lib opens its pages at 2x; the store sizes need 3x on the phone)."""
    def __init__(self, browser, scale):
        self._b, self._scale = browser, scale

    def new_context(self, **kw):
        kw["device_scale_factor"] = self._scale
        return self._b.new_context(**kw)

    def __getattr__(self, name):
        return getattr(self._b, name)


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")
    return struct.unpack(">II", head[16:24])


# ---- the six scenes: each returns the shot's name after taking it ----------------------------------------------------------------------------

def scene_downtown(browser):
    """01: Downtown with every upgrade bought and the street busy: pops over the carriers, the diner queue at the door."""
    sv = dict(LATE_SAVE, active="downtown", cash=2.4e6, scrapbookViewed=20,
              seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:19] + ["industrial-2b", "uptown-1"])
    page = seeded_page(browser, sv)
    settle(page, 2.5)
    expect(page, "shop")
    # the payout pops ("+$12") ride the carriers: land the shot while one is up
    pop = lambda: page.evaluate("() => [...document.querySelectorAll('text')].some((t) => (t.textContent || '').includes('+$'))")
    for _ in range(3):
        if until(page, pop, 7000):
            break
    shot(page, "01-downtown-full-swing", 0.1)
    return "01-downtown-full-swing"


def scene_cutscene(browser):
    """02: the opening scene on its first line of dialogue (a fresh install: Nonna in her shop)."""
    page = seeded_page(browser, None)
    expect(page, "cutscene", 15000)
    advance(page, 1500)
    for _ in range(2):
        tid(page, "cutscene").click()
        advance(page, 1200)
    expect(page, "cutscene")
    shot(page, "02-cutscene-panel", 0.9)
    return "02-cutscene-panel"


def scene_city(browser):
    """03: the City screen of the finished city: stars on every pin, the marked tile, the Boston tile."""
    u1 = _fixture("56_u1")
    page = seeded_page(browser, u1.endgame_save(x=u1.attack_state("waterfront")))
    u1.ready(page)
    tid(page, "open-city").click()
    advance(page, 1000)
    expect(page, "city-attack-waterfront", 3000)
    shot(page, "03-city-stars", 0.8)
    return "03-city-stars"


def scene_gameday(browser):
    """04: Suburbs on its game day, 28 s in: the banner, the red chip, the free seats glowing and the families on the walkers' lane."""
    s2a = _fixture("74_s2a")
    page = seeded_page(browser, s2a.save("suburbs", x={"suburbsGameDay": s2a.timed(s2a.PLAY + 460, until=s2a.PLAY + 40)}))
    settle(page, 2.0)
    expect(page, "layer-notice")
    expect(page, "gameday-scene")
    advance(page, 2200)
    shot(page, "04-game-day-rush", 0.4)
    return "04-game-day-rush"


def scene_gift(browser):
    """05: the welcome-back gift: away 3 h 12 m of a 4 h night oven, the door open and the total counting up."""
    sv = hooks_save()
    sv.update(nightOven=0, lastSavedAt=T0_MS - int(3.2 * 3600 * 1000))
    page = seeded_page(browser, sv)
    expect(page, "collect-offline", 8000)
    expect_text(page, "collect-offline", r"open the oven")
    tid(page, "collect-offline").click()
    expect(page, "offline-total", 3000)
    shot(page, "05-welcome-back-gift", 0.3)
    return "05-welcome-back-gift"


def scene_scrapbook(browser):
    """06: the Scrapbook's Recipes tab of the finished story."""
    u1 = _fixture("56_u1")
    page = seeded_page(browser, u1.endgame_save())
    u1.ready(page)
    tid(page, "open-scrapbook").click()
    advance(page, 800)
    tid(page, "scrapbook-tab-recipes").click()
    expect(page, "scrapbook-tab-recipes")
    shot(page, "06-scrapbook", 0.8)
    return "06-scrapbook"


SCENES = [("01", scene_downtown), ("02", scene_cutscene), ("03", scene_city), ("04", scene_gameday), ("05", scene_gift), ("06", scene_scrapbook)]


def wanted_sets():
    ios = shots_lib_supports_tablet()
    pick = OPTS["set"]
    if pick == "auto":
        return ["iphone"] + (["ipad"] if ios else [])
    return ["iphone", "ipad"] if pick == "all" else [pick]


def shots_lib_supports_tablet():
    """`expo.ios.supportsTablet` of app.json: an iPad build needs the 13-inch iPad set."""
    with open(os.path.join(ROOT, "app.json")) as f:
        return bool(json.load(f)["expo"].get("ios", {}).get("supportsTablet"))


def main():
    failed = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for key in wanted_sets():
            folder, (w, h), scale, (px_w, px_h) = SETS[key]
            shots_lib.VIEWPORT = (w, h)   # shots_lib's _open reads it for every page it makes
            out_dir = os.path.join(STORE_DIR, folder)
            os.makedirs(out_dir, exist_ok=True)
            for number, scene in SCENES:
                if OPTS["only"] and not any(number == o or number.lstrip("0") == o for o in OPTS["only"]):
                    continue
                before = len(report["errors"])
                try:
                    name = scene(Scaled(browser, scale))
                except Exception as e:   # one scene failing does not stop the others
                    report["errors"].append(f"scene {number} ({key}) failed: {e}")
                    failed.append(f"{key}/{number}")
                    continue
                src = os.path.join(OUT, name + ".png")
                size = png_size(src)
                if size != (px_w, px_h):
                    report["errors"].append(f"{key}/{name}: {size[0]}x{size[1]} px, the store wants {px_w}x{px_h}")
                    failed.append(f"{key}/{number}")
                    continue
                with open(src, "rb") as a, open(os.path.join(out_dir, name + ".png"), "wb") as b:
                    b.write(a.read())
                if len(report["errors"]) > before:
                    failed.append(f"{key}/{number}")   # an expect() missed: the file is written so it can be looked at, but it is not a store shot yet
                print(f"{folder}/{name}.png  {px_w}x{px_h}")
        browser.close()
    shots_lib.httpd.shutdown()
    for e in report["errors"]:
        print("error:", e)
    if not shots_lib_supports_tablet() and OPTS["set"] == "auto":
        print("iPad set skipped: app.json ios.supportsTablet is false")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
