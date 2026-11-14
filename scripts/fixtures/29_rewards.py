"""Shots 29-33: daily/weekly tasks and the gift calendar, from a save that looks mid-week.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    # 14. v5.4: daily/weekly tasks and the gift calendar, from a save that looks mid-week
    monday = (T0 - datetime.timedelta(days=T0.weekday())).strftime("%Y-%m-%d")
    stats = {"upgrades": 14, "ovens": 5, "hires": 1, "builds": 0, "fleet": 0, "decor": 2, "walkins": 90, "deliveries": 130, "baked": 210, "offline": 1, "boosters": 0, "dailyDone": 9, "days": 3}
    def rewarded(last, streak, diamonds=42, shown=None, generate=False):
        """A rewards-unlocked save. With `generate`, the daily and weekly sets are left empty (day = week = ''), so the game rolls
        them itself on load: the on-screen targets are exactly what the generator makes for this save (D389)."""
        r = {
            "day": "" if generate else day_str(), "daily": [], "points": 40, "chests": [False, False, False], "rerollUsed": False,
            "week": "" if generate else monday, "weekly": [], "weeklyChest": False,
            "gift": {"streak": streak, "last": last, "saveUsed": False, "cycle": 0}, "giftShownDay": shown or "",
            "diamonds": diamonds, "boosters": [{"mult": 2, "seconds": 900}, {"mult": 2, "seconds": 1800}],
            "boosts": [{"mult": 2, "until": now_ms + 14 * 60 * 1000 + 5000, "source": "booster"}],
            "cosmetics": ["oven-woodfired"], "lastSeen": now_ms - 60000}
        return dict(MID_SAVE, saveVersion=5, stats=stats, lastSavedAt=T0_MS, totalEarned=15000, rewards=r)
    try:
        page = played_page(browser, rewarded(day_str(), 3, generate=True))
        shot(page, "29-hud-rewards", 0.8)
        tid(page, "open-tasks").click(); shot(page, "30-tasks-daily", 0.8)
        page.locator('[data-testid="chest-0"]').first.scroll_into_view_if_needed(); shot(page, "30b-tasks-daily-chests", 0.5)
        tid(page, "tab-weekly").click(); page.locator('[data-testid$="claim-weekly-0"]').first.scroll_into_view_if_needed(); shot(page, "31-tasks-weekly", 0.6)
        page.locator('[data-testid="weekly-chest"]').first.scroll_into_view_if_needed(); shot(page, "31b-tasks-weekly-chest", 0.5)
    except Exception as e:
        report["errors"].append(f"tasks shots failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-1), 6))
        wait_for(page, "gift-calendar", 8000)
        shot(page, "32-gift-calendar", 1.0)
    except Exception as e:
        report["errors"].append(f"gift calendar shot failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-2), 6, diamonds=25))
        wait_for(page, "gift-calendar", 8000)
        shot(page, "33-gift-streak-save", 1.0)
    except Exception as e:
        report["errors"].append(f"gift streak-save shot failed: {e}")
