"""Card E1b (v5.21): the next shop waits for the current chapter. Shot 180.

180  the City list with Waterfront built and its story short of chapter 3: University is a padlock that says "Finish Chapter 8 first" (D546: the chapter the goal bar
     and the Story tab show as current, "Ch 8"), with enough cash to build it. Asserted before the shot.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)


def run(ctx):
    try:
        sv = dict(MID_SAVE, saveVersion=8, cash=5e6, totalEarned=5e6, vehicle=2, active="waterfront", scrapbookViewed=9,
                  lastSavedAt=T0_MS, playSeconds=900, rewards={"giftShownDay": day_str()})
        page = seeded_page(ctx.browser, sv); settle(page, 0.5)
        tid(page, "open-city").click(); advance(page, 800)
        expect(page, "city-row-university", 3000)
        expect_text(page, "city-row-university", r"Finish Chapter 8 first", 3000)
        shot(page, "180-build-locked", 0.6)
        tid(page, "city-row-university").click(); advance(page, 800)
        expect(page, "story-tab", 3000)
        shot(page, "180b-locked-tap-story", 0.6)
    except Exception as e:
        report["errors"].append(f"E1b 180 failed: {e}")
