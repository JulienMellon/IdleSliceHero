"""Shots 34-38: EXPAND at the cap, Buy both, the visible rush, the GM hire and the locked build on the sidewalk.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    late, tied, frugal = LATE_SAVE, TIED_SAVE, FRUGAL_SAVE
    try:
        capped = dict(MID_SAVE, cash=2000, active="downtown", scrapbookViewed=8,
                      shops=dict(MID_SAVE["shops"], downtown=shop(prep=25, ovens=25, counter=25, drivers=30, tables=10, footprint=0, sold=5000)))
        page = seeded_page(browser, capped); settle(page)
        shot(page, "34-sidewalk-expand", 0.8)
    except Exception as e:
        report["errors"].append(f"sidewalk expand shot failed: {e}")
    try:
        page = seeded_page(browser, tied); settle(page)
        shot(page, "35-sidewalk-bundle", 0.8)
    except Exception as e:
        report["errors"].append(f"sidewalk bundle shot failed: {e}")
    try:
        # a kitchen-bound shop (drivers to spare), so the combo shows a real boost; quick taps (≥ 2/s is a combo)
        rushy = dict(late, shops=dict(late["shops"], industrial=dict(late["shops"]["industrial"], drivers=40)))
        page = seeded_page(browser, rushy); settle(page)
        for _ in range(8):
            tap_shop(page); time.sleep(0.05)
        shot(page, "36-rush-combo", 0.05)
    except Exception as e:
        report["errors"].append(f"rush combo shot failed: {e}")
    try:
        gm = dict(MID_SAVE, cash=60000, active="waterfront", scrapbookViewed=8,
                  shops=dict(MID_SAVE["shops"], waterfront=dict(shop(managed=False, prep=18, ovens=16, counter=18, drivers=10, tables=8, footprint=1, sold=9000),
                                                                heads={"prep": True, "oven": True, "counter": True})))
        page = seeded_page(browser, gm); settle(page)
        shot(page, "37-gm-hire-sidewalk", 0.8)
    except Exception as e:
        report["errors"].append(f"gm hire shot failed: {e}")
    try:
        page = seeded_page(browser, dict(frugal, cash=5000)); settle(page)
        shot(page, "38-suburbs-locked-goal", 0.8)
    except Exception as e:
        report["errors"].append(f"locked goal shot failed: {e}")
