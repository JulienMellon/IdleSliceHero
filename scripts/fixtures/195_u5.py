"""Shots 195-197 (v5.23, card U5): the Store chip from the Store intro, the Shop's tabs, the Boosters tab that sells.

195 the Style tab opened from the chip on the way in (no tab is locked), Nonna's nudge after the first tap on a look that costs too much · 196 the Boosters tab with a running slot,
the three cards above the free shelf · 197 the same tab after a buy that would pass 24 h: Nonna's refusal, nothing spent.
Asserted: no chip at step 15 on a save before the takeover; the chip at step 16; the chip's dot at the takeover with no Starter Pack, gone once the Shop has been opened.
Game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, is_up, report, ...)

INTRO = 16  # the Store intro: the Starter Pack is first offered (card E6 makes it a step of its own)


def before_takeover(tutorial):
    """Downtown at the end of Chapter 1 (the first head hired), the story short of the takeover (downtown-4 not seen): rewards are still locked."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    sv = dict(MID_SAVE, saveVersion=9, cash=2000, totalEarned=2000, vehicle=0, active="downtown", tutorial=tutorial, seenScenes=["downtown-1", "downtown-2"],
              scrapbookViewed=2, lastSavedAt=T0_MS, playSeconds=900,
              shops=dict(unbuilt, downtown=shop(managed=False, prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=60,
                                                 heads={"prep": True, "oven": False, "counter": False})))
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def after_takeover(paid_min=59):
    """Rewards open, 400 diamonds, a paid slot with `paid_min` minutes left."""
    sv = dict(MID_SAVE, saveVersion=9, tutorial=INTRO + 2, lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": 400, "paidUntil": now_ms + paid_min * 60000, "lastSeen": now_ms - 60000}
    return sv


def run(ctx):
    b = ctx.browser

    # the chip: not at step 15, there at step 16
    try:
        page = seeded_page(b, before_takeover(INTRO - 1))
        settle(page, 1.0)
        assert not is_up(page, "shop-chip"), "the chip shows before the Store intro"
        page = seeded_page(b, before_takeover(INTRO))
        settle(page, 1.0)
        expect(page, "shop-chip")
        assert not is_up(page, "shop-chip-dot"), "the dot is for the takeover"
        # 195: the chip opens the Shop (on the Store tab while the intro is up); every tab works
        tid(page, "shop-chip").click()
        expect(page, "store-tab")
        tid(page, "shop-tab-0").click()
        page.locator('[data-testid^="vanity-"][data-testid$="-button"]').first.click()
        expect(page, "store-nudge")
        shot(page, "195-style-tab-nudge", 0.5)
    except Exception as e:
        report["errors"].append(f"U5 chip / nudge shots failed: {e}")

    # the dot at the takeover: there with no Starter Pack, gone after the Shop opens
    try:
        sv = after_takeover()
        sv["rewards"]["paidUntil"] = 0
        page = seeded_page(b, sv)
        settle(page, 1.5)
        expect(page, "shop-chip-dot")
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-1")
        tid(page, "back").click()
        advance(page, 800)
        expect(page, "shop-chip")
        assert not is_up(page, "shop-chip-dot"), "the dot stays after the Shop was opened"
    except Exception as e:
        report["errors"].append(f"U5 dot check failed: {e}")

    # 196 / 197: the Boosters tab, a running slot, then a buy that does not fit
    try:
        page = seeded_page(b, after_takeover())
        settle(page, 1.5)
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-1")
        tid(page, "shop-tab-1").click()
        expect(page, "booster-buy")
        expect_text(page, "booster-running", r"left")
        expect(page, "booster-rush-hour")
        expect(page, "booster-big-night")
        shot(page, "196-boosters-buy", 0.5)
        tid(page, "booster-big-night-buy").click()  # 59 m + 12 h: fits
        advance(page, 400)
        assert not is_up(page, "booster-full"), "a buy that fits was refused"
        tid(page, "booster-big-night-buy").click()  # + 12 h more: over 24 h
        expect(page, "booster-full")
        expect_text(page, "booster-full", r"Nothing spent")
        shot(page, "197-boosters-full", 0.5)
    except Exception as e:
        report["errors"].append(f"U5 boosters shots failed: {e}")
