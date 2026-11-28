"""Shots 106-117 (v5.18, card T2): the franchise and Boston.

106 franchise confirm sheet (on the City screen's Franchise lot) · 107 the franchise moment · 108 Boston's City screen at the start ·
109-114 one cut-scene panel per neighbourhood (North End, Southie, Back Bay, Fenway, Cambridge, Dorchester), each with its character and
backdrop · 115 Trish Vance at MegaSlice HQ (boston-0 panel 4) · 116 a Boston shop (Fenway, the game-day layer's neighbourhood) ·
117 Port Marinara's Scrapbook opened from Boston's City screen.
Every save is seeded. A Boston scene is not replayed: the save has everything before it seen and its trigger passed, so it opens by itself and the
fixture taps on until the panel's own text is up.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, tid, expect, advance, shop, MID_SAVE, IDS, day_str, T0_MS, report)

BOSTON_IDS = ["north-end", "southie", "back-bay", "fenway", "cambridge", "dorchester"]
HOME_SCENES = [f"{h}-{b}" for h in IDS for b in range(1, 5)] + HIRES(IDS)
DECOR3 = {"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3}
# every Boston scene told before a neighbourhood's beat 1, in play order (the bridge, then each earlier neighbourhood's, interludes where the story tells them)
ORDER = {h: [f"{h}-{n}" for n in (1, 2, 3, 5, 4)] for h in BOSTON_IDS}
ORDER["dorchester"] = ["dorchester-1", "dorchester-2", "dorchester-5", "dorchester-3", "dorchester-6", "dorchester-4"]
BEFORE = {}
_acc = ["boston-0"]
for _h in BOSTON_IDS:
    BEFORE[_h] = list(_acc)
    _acc += ORDER[_h]


def skip_boston(page, wait=3000):
    """The "Coming soon" card opens once after a finale: tap it away (it covers the screen, so before settle())."""
    try:
        wait_for(page, "soon-card", wait)
        tid(page, "soon-card").click()
        advance(page, 600)
    except Exception:
        pass


def home_done(**over):
    """Port Marinara cleared: every scene seen (the finale included), every shop built and running, a lot of cash."""
    shops = {h: shop(prep=100, ovens=96, grade=4, counter=98, drivers=50, tables=60, footprint=4, sold=3e6, decor=DECOR3) for h in IDS}
    sv = dict(MID_SAVE, cash=3.2e14, totalEarned=2.79e15, vehicle=3, active="suburbs", shops=shops, cityComplete=True,
              seenScenes=list(HOME_SCENES), scrapbookViewed=len(HOME_SCENES), lastSavedAt=T0_MS, playSeconds=9000)
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": 340}
    sv.update(over)
    return sv


def boston_save(active="north-end", built=("north-end",), seen=None, **over):
    """A Boston game: the shops in `built` run themselves, `seen` scenes are told (the home story by default)."""
    shops = {h: shop(built=h in built, managed=h in built, prep=20, ovens=18, counter=18, drivers=10, tables=8, footprint=1, sold=60000 if h in built else 0, decor=DECOR3) for h in BOSTON_IDS}
    seen = list(HOME_SCENES) if seen is None else seen
    sv = dict(saveVersion=7, tutorial=18, economy=4, city="boston", cash=5e9, totalEarned=3e15, vehicle=2, active=active, shops=shops, dronesUnlocked=False,
              cityComplete=False, seenScenes=seen, scrapbookViewed=len(seen), lastSavedAt=T0_MS, playSeconds=9000)
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": 340}
    sv["x"] = {"franchise": {"count": 1, "stars": 12, "cityStart": 2.79e15, "masteryBanked": 0}}
    sv.update(over)
    return sv


def open_city(page):
    tid(page, "open-city").click()
    advance(page, 1000)


def tap_until(page, snippet, name, wait=0.4):
    """A scene is up: tap on until `snippet` is on screen, shoot, skip the rest."""
    wait_for(page, "cutscene", 8000)
    advance(page, 1200)
    for _ in range(30):
        if page.get_by_text(snippet, exact=False).count():
            break
        tid(page, "cutscene").click()
        advance(page, 1300)
    else:
        report["errors"].append(f"106_t2: '{snippet}' never showed ({name})")
    shot(page, name, wait)


def run(ctx):
    b = ctx.browser

    # 106 / 107: the franchise offer. Home is cleared, so the City screen's seventh lot is the Franchise lot.
    try:
        page = seeded_page(b, home_done())
        skip_boston(page, 3000)
        settle(page, 2.0)
        open_city(page)
        expect(page, "city-boston", 4000)
        tid(page, "city-boston").click()
        advance(page, 600)
        expect(page, "franchise-ask", 3000)
        shot(page, "106-franchise-confirm", 0.6)
        tid(page, "franchise-go").click()
        advance(page, 400)
        expect(page, "franchise-sure", 3000)
        tid(page, "franchise-go").click()
        advance(page, 400)
        expect(page, "franchise-moment", 3000)
        advance(page, 900)
        shot(page, "107-franchise-moment", 0.6)
    except Exception as e:
        report["errors"].append(f"106_t2 106/107 failed: {e}")

    # 108: Boston's City screen at the start: North End built, the other five lots waiting
    try:
        page = seeded_page(b, boston_save(seen=HOME_SCENES + ["boston-0", "north-end-1"]))
        settle(page, 2.0)
        open_city(page)
        expect(page, "city-picker", 3000)
        shot(page, "108-boston-city", 0.6)
    except Exception as e:
        report["errors"].append(f"106_t2 108 failed: {e}")

    # 109-114: each neighbourhood's first beat, its character on its backdrop (the line is the one on the panel with the character)
    beats = [
        ("north-end", "I bless boats, babies and ovens", "109-north-end"),
        ("southie", "I run Dunn", "110-southie"),
        ("back-bay", "Of the Whitmores", "111-back-bay"),
        ("fenway", "I sell peanuts", "112-fenway"),
        ("cambridge", "successful failure", "113-cambridge"),
        ("dorchester", "Everybody's grandma", "114-dorchester"),
    ]
    for hood, snippet, name in beats:
        try:
            built = tuple(BOSTON_IDS[: BOSTON_IDS.index(hood) + 1])
            seen = list(dict.fromkeys(HOME_SCENES + BEFORE[hood]))
            page = seeded_page(b, boston_save(active=hood, built=built, seen=seen))
            tap_until(page, snippet, name)
        except Exception as e:
            report["errors"].append(f"106_t2 {name} failed: {e}")

    # 115: Trish Vance at HQ: the bridge scene's fourth panel
    try:
        page = seeded_page(b, boston_save(seen=list(HOME_SCENES)))
        tap_until(page, "brings me great news", "115-trish-hq")
    except Exception as e:
        report["errors"].append(f"106_t2 115 failed: {e}")

    # 116: a Boston shop with its neighbourhood's layer (Fenway: game day)
    try:
        built = tuple(BOSTON_IDS[:4])
        seen = list(dict.fromkeys(HOME_SCENES + BEFORE["fenway"] + ["fenway-1", "fenway-2"]))
        page = seeded_page(b, boston_save(active="fenway", built=built, seen=seen))
        settle(page, 3.0)
        shot(page, "116-boston-shop-layer", 0.8)
    except Exception as e:
        report["errors"].append(f"106_t2 116 failed: {e}")

    # 117: Port Marinara's Scrapbook, opened from Boston's City screen
    try:
        page = seeded_page(b, boston_save(seen=HOME_SCENES + ["boston-0", "north-end-1"]))
        settle(page, 2.0)
        open_city(page)
        expect(page, "city-scrapbook-home", 3000)
        tid(page, "city-scrapbook-home").click()
        expect(page, "past-scrapbook-home", 3000)
        advance(page, 600)
        shot(page, "117-home-scrapbook-from-boston", 0.6)
    except Exception as e:
        report["errors"].append(f"106_t2 117 failed: {e}")
