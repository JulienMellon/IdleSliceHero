"""Shots 19-23: the recipe-card scene, the capped offline popup, the Pier 9 bid goal, the Dale perk card and the perk banner.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
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
