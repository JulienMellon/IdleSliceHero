"""Shots 209-210 (v5.23, card E6): Nonna's Store intro at the end of Chapter 1, and no pop-up sheet after it.

209 the Store chip lit (step 16) · 210 the Shop on its Store tab, the Starter card lit (step 17). "Not now" ends it: the coach is gone for good and no sheet appears,
not even 40 s later (the 30-second pop-up is removed). An owner of the Starter Pack sees neither step. Every state is asserted with expect() before its shot;
game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, is_up, report, ...)

INTRO = 16
DONE = 18


def chapter1_end(tutorial=INTRO, owned=False):
    """Downtown at the end of Chapter 1 (the first head hired), the story short of the takeover: rewards still locked."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    sv = dict(MID_SAVE, saveVersion=9, cash=2000, totalEarned=2000, vehicle=0, active="downtown", tutorial=tutorial, seenScenes=["downtown-1", "downtown-2"],
              scrapbookViewed=2, lastSavedAt=T0_MS, playSeconds=900,
              shops=dict(unbuilt, downtown=shop(managed=False, prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=60,
                                                 heads={"prep": True, "oven": False, "counter": False})))
    sv["rewards"] = {"giftShownDay": day_str(), "cosmetics": ["awning-founder"] if owned else []}
    return sv


def run(ctx):
    b = ctx.browser
    try:
        page = seeded_page(b, chapter1_end())
        settle(page, 1.5)
        expect(page, "coach-overlay", 6000)
        expect_text(page, "coach", r"Tap the Store")
        shot(page, "209-store-intro-chip", 0.5)

        tid(page, "shop-chip").click()  # the cut-out lets the tap through
        expect(page, "store-tab")
        expect_text(page, "coach", r"My pack waits here")
        shot(page, "210-store-intro-starter", 0.5)

        advance(page, 4500)  # the look ends by itself (a tap would end it sooner); the card stays, and the pack can be tapped
        if is_up(page, "coach-block"):
            report["errors"].append("E6: the look still blocks the Shop after 4.5 s")
        tid(page, "starter-not-now").click()  # "Not now" leaves the Shop: the intro is over
        advance(page, 1200)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E6: the coach is still up after Not now")
        advance(page, 40000)
        if is_up(page, "starter-sheet"):
            report["errors"].append("E6: the Starter Pack pop-up came back after the intro")
        expect(page, "shop-chip")
    except Exception as e:
        report["errors"].append(f"E6 intro failed: {e}")

    # two taps outside the lit chip skip the intro: the coach is gone, the chip is still there and opens the Shop
    try:
        page = seeded_page(b, chapter1_end())
        settle(page, 1.5)
        expect(page, "coach-overlay", 6000)
        tid(page, "coach-block").first.click()  # the first tap outside only nudges
        advance(page, 600)
        if not is_up(page, "coach-overlay"):
            report["errors"].append("E6: one stray tap ended the intro")
        tid(page, "coach-block").first.click()  # the second skips
        advance(page, 800)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E6: the coach is still up after two taps outside the chip")
        expect(page, "shop-chip")
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-0")
        advance(page, 600)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E6: the Starter card was lit after the intro was skipped")
    except Exception as e:
        report["errors"].append(f"E6 skip check failed: {e}")

    # an owner of the pack: neither step
    try:
        page = seeded_page(b, chapter1_end(owned=True))
        settle(page, 2.0)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E6: an owner of the Starter Pack was shown the Store intro")
    except Exception as e:
        report["errors"].append(f"E6 owner check failed: {e}")
