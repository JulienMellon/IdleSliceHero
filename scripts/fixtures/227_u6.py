"""Shots 227-227b (v5.24, card U6): the Vanity tab.

227  a fresh tab: this week's four on top (two by two, each with its thumbnail, name and tier price), then the first set with its "0/4 pieces"
227b a half set (Mudhens diner, "2/4 pieces") framed from its header, its Owned pieces and "Mudhens diner · shows in Suburbs"; the complete set (Rosa's classic) is asserted above it
227c every look owned: no Featured row, every set with its check and done line, every button Wear or Worn
Asserted before each shot: the Featured four, the progress texts, the done line, the price on a button; the tab scrolls to the generic looks. All owned
is asserted too (no Featured, every set done). Game time moves only through advance().
"""
import re

from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)

# every look for sale, read from the catalog (the plaque is earned; the storefront skin is owned as a numbered, bought one)
_CAT = open(os.path.join(os.path.dirname(__file__), "..", "..", "src", "content", "catalog.ts"), encoding="utf8").read()
ALL = ["storefront-skin-101" if i == "storefront-skin" else i for i in re.findall(r"look\('([\w-]+)'", _CAT) if i != "plaque-master"]

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


def scroll_to(page, testid, top=False):
    """Bring a section into view; `top` puts its header at the top edge of the list, as a thumb would leave it."""
    page.locator(f'[data-testid="{testid}"]').first.evaluate("(el, top) => el.scrollIntoView({ block: top ? 'start' : 'nearest' })", top)
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
        expect_text(page, "vanity-featured", r"shows in", 3000) if page.locator('[data-testid$="-where"]').count() else None
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
        scroll_to(page, "vanity-section-set:diner", top=True)
        shot(page, "227b-set-half", 0.3)
    except Exception as e:
        report["errors"].append(f"U6 227b failed: {e}")

    try:
        page = seeded_page(b, shop_save(ALL, diamonds=0))
        open_vanity(page)
        assert not is_up(page, "vanity-featured"), "every look owned: no Featured row"
        for sid in ("classic", "diner", "dockside", "dorm", "brick", "marble"):
            expect_text(page, f"vanity-progress-set:{sid}", r"4/4 pieces", 3000)
            expect(page, f"vanity-done-set:{sid}")
        assert not page.locator('[data-testid^="vanity-"][data-testid$="-button"]').filter(has_text=re.compile(r"💎")).count(), "an owned look shows a price"
        shot(page, "227c-all-owned", 0.3)
    except Exception as e:
        report["errors"].append(f"U6 227c failed: {e}")
