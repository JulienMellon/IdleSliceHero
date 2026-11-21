"""Shots 156-157 (card U0): the Store is reachable once the Starter Pack has been offered, before Nonna's takeover.
156 the HUD with the diamond chip on a save that has not seen the takeover but has been offered the pack ("Not now") ·
157 the Shop's Store tab with the Starter Pack, opened from that chip.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)

PREFS = '{"starterOffered":true,"boosterAdDay":""}'


def pre_takeover_save():
    """Just past the tutorial: Downtown only, the takeover scene (downtown-4) not yet seen, 800 pizzas short of it."""
    shops = {h: shop(built=False, managed=False) for h in IDS}
    shops["downtown"] = shop(prep=6, ovens=4, grade=0, counter=4, drivers=3, tables=3, footprint=1, sold=1400)
    return dict(MID_SAVE, active="downtown", cash=900, totalEarned=4000, shops=shops, scrapbookViewed=0,
                seenScenes=["downtown-1", "downtown-2", "downtown-3"], lastSavedAt=T0_MS, rewards={"giftShownDay": day_str()})


def run(ctx):
    browser = ctx.browser
    try:
        # both prefs keys: the dev export may or may not be the test build
        page = seeded_page(browser, pre_takeover_save(), storage={"slice-empire/store/v1": PREFS, "slice-empire/store/test-v1": PREFS})
        settle(page)
        expect(page, "shop-chip")
        shot(page, "156-chip-before-takeover", 0.5)
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-2")
        tid(page, "shop-tab-2").click()
        expect(page, "product-starter_pack")
        shot(page, "157-store-before-takeover", 0.5)
    except Exception as e:
        report["errors"].append(f"U0 shots failed: {e}")
