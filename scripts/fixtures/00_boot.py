"""Shots 00-04 (fresh install): the title card, the opening cut-scene, the new game and 20 s of tapping. Sets report["loaded"].
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    # no save: a fresh install, on the frozen clock, with the title card still up
    page = seeded_page(browser, None, title=False)
    browser_ctx = page.context

    # 1. Fresh install → opening cut-scene
    # v5.1: the title card after the native splash
    try:
        wait_for(page, "title-card", 15000)
        shot(page, "00-title-card", 0.9)
    except Exception as e:
        report["errors"].append(f"title card never appeared: {e}")
    skip_title(page, 2000)
    try:
        wait_for(page, "cutscene", 15000)
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
        tap_station(page, "prep"); advance(page, 300)
        tap_station(page, "prep")
        shot(page, "03b-full-queue-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"full-queue tap failed: {e}")
    try:
        # v4.7: three taps per batch (prep → oven → counter), each stage takes a few seconds
        for i in range(70):
            tap_station(page, ["counter", "oven", "prep"][i % 3]); advance(page, 300)
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
    browser_ctx.close()
