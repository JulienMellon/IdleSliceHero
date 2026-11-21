"""Shots 98-105 (card U3): the ad buttons, the store and Settings, on the web stubs' query flags.
98 the claim sheet with the double button · 99 the same for a Nonna's Plus owner · 100 the welcome-back gift with its 2x button ·
101 the Store tab with prices · 102 the Store tab while the prices load · 103 the Starter Pack sheet · 104 Settings, the new rows ·
105 Settings after Restore Purchases · 106 the day's task swap · 107 the missed-day streak save · 108 the free booster on the shelf (D502).
Flags (services/*.web.ts, query.ts): `?ads=rewarded` an ad always pays, `?owned=nonnas_plus` owns Plus, `?prices=loading` (the store tab's own).
A flag lives in the page's URL, and the router drops it when the app opens another screen: `flags()` puts it back with replaceState.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)
import shots_lib


def with_flags(query, make):
    """Boot a page with `query` in its URL (first_load and reload read shots_lib.URL when they run)."""
    old = shots_lib.URL
    shots_lib.URL = old + query
    try:
        return make()
    finally:
        shots_lib.URL = old


def flags(page, query):
    """Put `query` back in the page's URL without a navigation (the stubs read it when they are called)."""
    page.evaluate("q => history.replaceState(history.state, '', location.pathname + q)", query)


def rewarded_save(missed=False):
    """Rewards unlocked, today's gift taken (`missed`: the day before yesterday's, so the calendar offers the streak save), a daily set with three tasks done and two still to do (so the swap shows)."""
    monday = (T0 - datetime.timedelta(days=T0.weekday())).strftime("%Y-%m-%d")
    stats = {"upgrades": 14, "ovens": 5, "hires": 1, "builds": 0, "fleet": 0, "decor": 2, "walkins": 90, "deliveries": 130, "baked": 210,
             "offline": 1, "boosters": 0, "dailyDone": 9, "days": 3}
    task = lambda kind, target: {"kind": kind, "target": target, "base": 0, "claimed": False}
    r = {
        "day": day_str(), "daily": [task("upgrades", 5), task("baked", 100), task("deliveries", 100), task("walkins", 4000), task("earn", 90000000)],
        "points": 20, "chests": [False, False, False], "rerollUsed": False,
        "week": monday, "weekly": [], "weeklyChest": False,
        "gift": {"streak": 3, "last": day_str(-2 if missed else 0), "saveUsed": False, "cycle": 0}, "giftShownDay": day_str(),
        "diamonds": 42, "boosters": [], "boosts": [], "cosmetics": [], "lastSeen": now_ms - 60000}
    return dict(MID_SAVE, saveVersion=5, stats=stats, lastSavedAt=T0_MS, totalEarned=15000, rewards=r)


def tasks_page(browser, query):
    page = with_flags(query, lambda: seeded_page(browser, rewarded_save()))
    settle(page)
    tid(page, "open-tasks").click()
    expect(page, "tasks-drawer")
    return page


def run(ctx):
    browser = ctx.browser
    # 98: claim a finished daily task; the card says what it paid and offers to pay it again for an ad
    try:
        page = tasks_page(browser, "?ads=rewarded")
        expect(page, "swap-daily-3")  # an unfinished row offers the day's swap
        tid(page, "claim-daily-0").click()
        expect(page, "claim-sheet")
        expect(page, "claim-double")
        shot(page, "98-claim-double", 0.4)
    except Exception as e:
        report["errors"].append(f"claim sheet shot failed: {e}")
    # 99: the same for a Nonna's Plus owner: no ad button; the claim is paid double at once and the card says "Doubled! ×2"
    try:
        page = tasks_page(browser, "?owned=nonnas_plus&ads=rewarded")
        tid(page, "claim-daily-0").click()
        expect(page, "claim-sheet")
        expect_text(page, "claim-title", r"Doubled")  # D504: a Plus owner is paid double at once, the card says ×2
        shot(page, "99-claim-double-plus", 0.4)
    except Exception as e:
        report["errors"].append(f"claim sheet (Plus) shot failed: {e}")
    # 100: away 3 h: the gift's 2x button sits above "Open the oven"
    try:
        sv = hooks_save()
        sv["lastSavedAt"] = T0_MS - int(3 * 3600 * 1000)
        page = with_flags("?ads=rewarded", lambda: seeded_page(browser, sv))
        expect(page, "collect-offline", 8000)
        expect(page, "offline-double")
        shot(page, "100-offline-double", 0.8)
    except Exception as e:
        report["errors"].append(f"offline 2x shot failed: {e}")
    # 101 / 102: the Store tab with prices, then while they load
    try:
        page = with_flags("?ads=rewarded", lambda: seeded_page(browser, rewarded_save()))
        settle(page)
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-2")
        tid(page, "shop-tab-2").click()
        expect(page, "product-starter_pack")
        expect_text(page, "buy-diamonds_80", r"\$0\.99")
        shot(page, "101-store-prices", 0.4)
        tid(page, "shop-tab-0").click()
        flags(page, "?prices=loading")
        tid(page, "shop-tab-2").click()
        expect(page, "product-starter_pack")
        expect_text(page, "buy-starter_pack", r"Loading")
        shot(page, "102-store-loading", 0.4)
    except Exception as e:
        report["errors"].append(f"store tab shots failed: {e}")
    # 103: the tutorial ends in play (v5.20: step 15, Nonna's last look at the prep table, ends after 2.5 s; Marco is already hired); 30 s later the pack is offered once
    try:
        shops = dict(MID_SAVE["shops"], downtown=shop(managed=False, prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=4000,
                                                      heads={"prep": True, "oven": False, "counter": False}))
        sv = dict(MID_SAVE, saveVersion=7, tutorial=15, active="downtown", shops=shops, lastSavedAt=T0_MS, rewards={"giftShownDay": day_str()})
        page = seeded_page(browser, sv)
        advance(page, 1000)
        for _ in range(12):  # a due scene or popup first, as settle() does
            if not any(is_up(page, t) for t in DISMISS):
                break
            settle(page, 0.5)
        advance(page, 32000)
        settle(page, 0.2)
        expect(page, "starter-sheet", 8000)
        expect_text(page, "starter-buy", r"\$2\.99")
        shot(page, "103-starter-sheet", 0.4)
    except Exception as e:
        report["errors"].append(f"starter sheet shot failed: {e}")
    # 104 / 105: Settings, the new rows, then after Restore Purchases (the account owns Plus)
    try:
        page = seeded_page(browser, rewarded_save())
        settle(page)
        tid(page, "open-city").click(); advance(page, 600)
        tid(page, "open-settings").click(); advance(page, 600)
        expect(page, "settings-privacy")
        page.locator('[data-testid="copy-install-id"]').first.scroll_into_view_if_needed()
        shot(page, "104-settings-new-rows", 0.4)
        flags(page, "?owned=nonnas_plus")
        page.locator('[data-testid="restore-purchases"]').first.scroll_into_view_if_needed()
        tid(page, "restore-purchases").click()
        expect_text(page, "restore-line", r"Restored: Nonna")
        page.locator('[data-testid="restore-line"]').first.scroll_into_view_if_needed()
        shot(page, "105-settings-restored", 0.4)
    except Exception as e:
        report["errors"].append(f"settings shots failed: {e}")
    # 106: the tasks drawer with the day's swap on an unfinished row (an ad is ready)
    try:
        page = tasks_page(browser, "?ads=rewarded")
        expect(page, "swap-daily-3")
        shot(page, "106-task-swap", 0.4)
    except Exception as e:
        report["errors"].append(f"task swap shot failed: {e}")
    # 107: the gift calendar after a missed day: the 20-diamond repair and, beside it, the ad
    try:
        page = with_flags("?ads=rewarded", lambda: seeded_page(browser, rewarded_save(missed=True)))
        settle(page)
        tid(page, "open-gift").click()
        expect(page, "gift-repair-ad")
        shot(page, "107-streak-save-ad", 0.4)
    except Exception as e:
        report["errors"].append(f"streak save shot failed: {e}")
    # 108: the booster shelf with its free daily booster
    try:
        page = with_flags("?ads=rewarded", lambda: seeded_page(browser, rewarded_save()))
        settle(page)
        tid(page, "shop-chip").click()
        expect(page, "shop-tab-1")
        flags(page, "?ads=rewarded")  # the router dropped the flag on the way to the Shop
        tid(page, "shop-tab-1").click()
        expect(page, "booster-ad")
        shot(page, "108-booster-ad", 0.4)
    except Exception as e:
        report["errors"].append(f"booster ad shot failed: {e}")
