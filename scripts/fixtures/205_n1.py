"""Shots 205-208 (card N1): the Store tab's cards, in game units, with the store's own price strings.
205 prices still loading (no price, a disabled button, no "Best rate") · 206 prices in: the Starter card at the top with Nonna's line, three chips and
"Most diamonds per dollar in the store" · 206b the diamond packs below it: base, "+N bonus", "Enough for N looks", "Best rate" on the 1,200 pack, "First buy: 2×" ·
207 the Starter owned (its card gone, Plus with the 7-day ad line) · 208 every first buy used (no "First buy: 2×", "Best rate" stays).
Flags (services/purchases.web.ts, store-tab.tsx): `?prices=loading`, `?owned=starter_pack`. A flag lives in the page's URL and the router drops it when
the app opens another screen, so `flags()` puts it back before the Store tab opens. The first buys come from the ledger (`first:<id>` keys, seeded under both
ledger keys: the dev export may or may not be the test build); the ad count from the store prefs' `adGrants`.
"""
import json

from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)
import shots_lib

PREFS_KEYS = ("slice-empire/store/v1", "slice-empire/store/test-v1")
LEDGER_KEYS = ("se.purchases.ledger", "se.purchases.ledger.test")
DAY = 86400000


def store_save():
    """Rewards unlocked, today's gift taken, so the Shop's Store tab is open to a mid-game player."""
    r = {"day": day_str(), "daily": [], "points": 0, "chests": [False, False, False], "rerollUsed": False,
         "week": day_str(), "weekly": [], "weeklyChest": False,
         "gift": {"streak": 3, "last": day_str(0), "saveUsed": False, "cycle": 0}, "giftShownDay": day_str(),
         "diamonds": 42, "boosters": [], "boosts": [], "cosmetics": [], "lastSeen": now_ms - 60000}
    return dict(MID_SAVE, saveVersion=5, totalEarned=15000, lastSavedAt=T0_MS, rewards=r)


def prefs(ads=0):
    stamps = [T0_MS - i * DAY // 2 for i in range(ads)]
    return json.dumps({"starterOffered": True, "boosterAdDay": "", "adGrants": stamps})


def ledger(first=()):
    return json.dumps({"keys": [f"first:{p}" for p in first] + [f"tx:old-{p}" for p in first]})


def store_page(browser, query="", ads=0, first=()):
    """The Shop's Store tab, with `query` flags put back in the URL after the router drops them."""
    storage = {k: prefs(ads) for k in PREFS_KEYS}
    storage.update({k: ledger(first) for k in LEDGER_KEYS})
    old = shots_lib.URL
    shots_lib.URL = old + query
    try:
        page = seeded_page(browser, store_save(), storage=storage)
    finally:
        shots_lib.URL = old
    settle(page)
    tid(page, "shop-chip").click()
    expect(page, "shop-tab-2")
    page.evaluate("q => history.replaceState(history.state, '', location.pathname + q)", query)
    tid(page, "shop-tab-0").click()  # the Shop may open on the Store: leave it and come back, so the tab asks the store again with the flag
    tid(page, "shop-tab-2").click()
    return page


def scroll_to(page, testid):
    page.locator(f'[data-testid="{testid}"]').first.scroll_into_view_if_needed()


def run(ctx):
    browser = ctx.browser
    # 205: prices still loading
    try:
        page = store_page(browser, "?prices=loading")
        expect(page, "product-starter_pack")
        expect_text(page, "buy-starter_pack", r"Loading")
        shot(page, "205-n1-loading", 0.4)
    except Exception as e:
        report["errors"].append(f"N1 loading shot failed: {e}")
    # 206 / 206b: prices in, nothing bought
    try:
        page = store_page(browser, "")
        expect_text(page, "buy-starter_pack", r"\$2\.99")
        expect_text(page, "starter-nonna", r"Like a lunch")
        expect(page, "starter-rate")
        expect(page, "starter-not-now")
        shot(page, "206-n1-starter", 0.4)
        scroll_to(page, "product-diamonds_1200")
        expect_text(page, "bonus-diamonds_1200", r"\+400 bonus")
        shot(page, "206b-n1-packs", 0.4)
    except Exception as e:
        report["errors"].append(f"N1 prices shots failed: {e}")
    # 207: the Starter owned; Plus says what the week's ads came to
    try:
        page = store_page(browser, "?owned=starter_pack", ads=5)
        expect(page, "product-nonnas_plus")
        expect_text(page, "plus-ads", r"5 ad rewards")
        shot(page, "207-n1-starter-owned", 0.4)
    except Exception as e:
        report["errors"].append(f"N1 owned shot failed: {e}")
    # 208: every first buy used
    try:
        page = store_page(browser, "?owned=starter_pack", first=("diamonds_80", "diamonds_500", "diamonds_1200"))
        expect(page, "product-diamonds_500")
        scroll_to(page, "product-diamonds_1200")
        shot(page, "208-n1-first-used", 0.4)
    except Exception as e:
        report["errors"].append(f"N1 first buys shot failed: {e}")
