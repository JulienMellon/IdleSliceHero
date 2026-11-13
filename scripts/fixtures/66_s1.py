"""Shots 66-73 (v5.15, card S1): worn cosmetics, the station heads and the day-30 visitor's cameo.

66 gold oven + gold awning (Downtown) · 67 wood-fired oven + neon counter (Waterfront) · 68 storefront skin + mint scooters ·
69 master plaque · 70 a head's rush bark with rank pins · 71 Head of the Week star · 72 Nonna in the shop with her timer ·
73 the same shop with nothing worn, for comparison.
"""
import time
from shots_lib import *  # seeded_page, settle, shot, tid, tap_shop, hood_save, now_ms, day_str, report, ...

DAY_MS = 86_400_000
# a mid-game GM shop: ovens past Lv 25 so the oven and its brass trim show, tables for a full room
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000,
            decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})


def dressed(hood, worn, vehicle=2, rewards=None, **kw):
    """A save in `hood` with these cosmetics owned and worn (city-wide), the daily gift already shown."""
    sv = hood_save(hood, vehicle=vehicle, **dict(BUSY, **kw))
    sv.update(lastSavedAt=int(time.time() * 1000))
    sv["rewards"] = dict({"giftShownDay": day_str(), "cosmetics": list(worn), "worn": list(worn)}, **(rewards or {}))
    return sv


def look(browser, name, save, wait=1.2):
    page = seeded_page(browser, save)
    settle(page, 2.0)
    shot(page, name, wait)
    return page


def run(ctx):
    b = ctx.browser
    # 66: gold oven and gold awning, Downtown
    look(b, "66-gold-oven-awning", dressed("downtown", ["oven-gold", "awning-gold"]))
    # 67: wood-fired oven and the neon counter sign, Waterfront
    look(b, "67-woodfired-neon", dressed("waterfront", ["oven-woodfired", "neon-counter"]))
    # 68: a storefront skin (cycle 2's) and mint scooters: the scooter tier is parked
    look(b, "68-skin-mint-scooter", dressed("suburbs", ["storefront-skin-2", "scooter-mint"], vehicle=1))
    # 69: the master's plaque by the door
    look(b, "69-master-plaque", dressed("uptown", ["plaque-master"]))

    # 70: a head's rush bark, with rank pins on every badge (Lv 30 / 55 / 100 = bronze, silver, gold). The scene taps are quick enough
    # to make a combo, and the rush pill gives its place to the head's bubble.
    heads = {"prep": True, "oven": True, "counter": True}
    sv = dressed("downtown", [], prep=30, ovens=55, counter=100, drivers=40, tables=12, heads=heads)
    page = seeded_page(b, sv)
    settle(page, 2.0)
    # the city's only hired heads are Downtown's, so one of them is Head of the Week and says so on load; bubbles are 20 s apart, so let that
    # one pass (D459: the rush bark used to be held back by it and shot 70 showed none)
    time.sleep(22)
    for _ in range(10):
        tap_shop(page)
        time.sleep(0.12)
    # the bark is SVG text with no test ID: look for one of the three Downtown rush lines (content/heads.ts BARKS.downtown.*.rush)
    expect_text(page, None, r"Dough.s flying|Nobody touches the oven door|Mrs\. Russo", 2000)
    shot(page, "70-head-rush-bark", 0.3)

    # 71: Head of the Week: the only hired head in the city is the week's pick, so the star pin shows on its badge (and it says so)
    one = {"prep": False, "oven": True, "counter": False}
    sv = dressed("downtown", [], ovens=30, heads=one)
    page = seeded_page(b, sv)
    settle(page, 2.0)
    shot(page, "71-head-of-the-week", 0.6)

    # 72: day 30's visit: Nonna by the counter with the visit's time on her tag. She speaks for 4 s of every 150 s (wall clock), so wait
    # for it when it is near.
    visit = {"boosts": [{"mult": 2, "until": int(time.time() * 1000) + 6 * DAY_MS + 4 * 3_600_000, "source": "visit-nonna"}]}
    sv = dressed("downtown", [], rewards=visit)
    page = seeded_page(b, sv)
    settle(page, 2.0)
    phase = time.time() % 150
    ahead = (8.6 - phase) % 150
    if ahead <= 20:
        time.sleep(ahead)
    shot(page, "72-nonna-cameo", 0.3)

    # 73: the same shop as 66 with nothing worn
    look(b, "73-nothing-worn", dressed("downtown", []))
