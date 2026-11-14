"""Shots 51-55b: Nonna's night oven (51), the welcome-back gift (52-54) and the next-scene teaser (55).
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    # 18. v5.14 return hooks: Nonna's night oven (51), the welcome-back gift (52-54) and the next-scene teaser (55). Each save carries
    # its state: `nightOven` is the tier owned, and `lastSavedAt` puts the player away for the gift. 52-54 skip settle() because it taps
    # `collect-offline`; the gift is the shot. The daily gift calendar is marked shown so it doesn't cover the scene afterwards.
    def return_save(away_hours=None, oven=0):
        sv = hooks_save()
        sv["nightOven"] = oven
        if away_hours:
            sv["lastSavedAt"] = T0_MS - int(away_hours * 3600 * 1000)
        return sv
    try:
        page = seeded_page(browser, return_save()); quiet_start(page)
        tid(page, "night-oven-chip").click()
        expect(page, "night-oven-sheet", 5000)
        shot(page, "51-night-oven-sheet", 0.5)
    except Exception as e:
        report["errors"].append(f"night oven sheet shot failed: {e}")
    try:
        # away 3 h 12 m of a 4 h oven: the door is shut and glows at about 80%
        page = seeded_page(browser, return_save(away_hours=3.2))
        expect(page, "collect-offline", 8000)
        expect_text(page, "collect-offline", r"open the oven")  # the door is still shut
        shot(page, "52-gift-closed", 0.8)
        # open it: the door swings and the total counts up; shoot partway
        tid(page, "collect-offline").click()
        expect(page, "offline-total", 3000)  # the door is open and the total counts up
        shot(page, "53-gift-counting", 0.3)
    except Exception as e:
        report["errors"].append(f"welcome-back gift shots failed: {e}")
    try:
        # away 9 h with the 4 h oven: full, and the bigger oven is on offer
        page = seeded_page(browser, return_save(away_hours=9))
        expect(page, "collect-offline", 8000)
        expect(page, "gift-upgrade", 3000)  # full oven: the bigger one is on offer
        shot(page, "54-gift-full-upgrade", 0.8)
    except Exception as e:
        report["errors"].append(f"full night oven shot failed: {e}")
    try:
        page = seeded_page(browser, return_save()); quiet_start(page)
        shot(page, "55b-hud-teaser-ring", 0.3)
        tid(page, "open-scrapbook").click()
        expect(page, "scrapbook-teaser", 5000)
        shot(page, "55-scrapbook-teaser", 0.8)
    except Exception as e:
        report["errors"].append(f"scrapbook teaser shot failed: {e}")
