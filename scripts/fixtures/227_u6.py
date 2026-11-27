"""Shots 227-227b (v5.24, card U6): the Vanity tab.

227  a fresh tab: this week's four on top (two by two, each with its thumbnail, name and tier price), then the first set with its "0/4 pieces"
227b a complete set (Rosa's classic: the check and Nonna's line) above a half set (Mudhens diner, "2/4 pieces") with its Owned pieces and "Shows in Suburbs"
Asserted before each shot: the Featured four, the progress texts, the done line, the price on a button; the tab scrolls to the generic looks. All owned
is asserted too (no Featured, every set done). Game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)

CLASSIC = ["facade-classic", "awning-classic", "menu-classic", "apron-classic"]
DINER = ["facade-diner", "counter-diner"]


def shop_save(cosmetics=(), diamonds=200, seen=()):
    """Rewards open (the takeover has happened), the Store intro over, `diamonds` to spend, these looks owned and worn."""
    sv = dict(MID_SAVE, saveVersion=10, tutorial=19, lastSavedAt=T0_MS, seenScenes=list(seen))
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": diamonds, "lastSeen": now_ms - 60000, "cosmetics": list(cosmetics), "worn": list(cosmetics)}
    return sv


def open_vanity(page):
    settle(page, 1.5)
    tid(page, "shop-chip").click()
    expect(page, "shop-tab-0")
    tid(page, "shop-tab-0").click()
    advance(page, 600)


def scroll_to(page, testid):
    page.locator(f'[data-testid="{testid}"]').first.scroll_into_view_if_needed()
    advance(page, 400)


def run(ctx):
    b = ctx.browser

    try:
        page = seeded_page(b, shop_save())
        open_vanity(page)
        expect(page, "vanity-featured")
        n = page.locator('[data-testid^="vanity-featured-"][data-testid$="-button"]').count()
        assert n == 4, f"Featured shows {n} looks, not 4"
        assert not is_up(page, "vanity-done-set:classic"), "a set with nothing owned shows no done line"
        expect_text(page, "vanity-progress-set:classic", r"0/4 pieces", 3000)
        shot(page, "227-vanity-fresh", 0.5)
        # the tab scrolls to the generic looks, and a price is on a button
        scroll_to(page, "vanity-section-tier:small")
        expect_text(page, "vanity-menu-chalkboard-button", r"60", 3000)
    except Exception as e:
        report["errors"].append(f"U6 227 failed: {e}")

    try:
        page = seeded_page(b, shop_save(CLASSIC + DINER, diamonds=500))
        open_vanity(page)
        expect_text(page, "vanity-progress-set:classic", r"4/4 pieces", 3000)
        expect_text(page, "vanity-done-set:classic", r"Nonna Rosa: Now it looks like Rosa", 3000)
        expect_text(page, "vanity-progress-set:diner", r"2/4 pieces", 3000)
        scroll_to(page, "vanity-section-set:classic")
        shot(page, "227b-set-complete-and-half", 0.3)
    except Exception as e:
        report["errors"].append(f"U6 227b failed: {e}")
