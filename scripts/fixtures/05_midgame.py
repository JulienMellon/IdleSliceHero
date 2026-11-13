"""Shots 05-05c (mid-game save): the main screen, the upgrades sheet, an unmanaged shop (tab, drawer, station taps, hire, upgrade flash) and the City.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
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
