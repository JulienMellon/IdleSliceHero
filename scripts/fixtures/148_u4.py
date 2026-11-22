"""Card U4 (v5.17): a calmer first minute, one sky event at a time, rewards that look claimable. Shots 148-152.

148 a fresh save twenty seconds in (the same moment as shot 04): Nonna's card is the one voice, no padlocked tabs, no hint bubbles
149 an order offer and a golden pizza due together: the offer shows, the pizza waits
150 the attack banner open in full with a golden pizza waiting
151 the daily tasks: one finished (Claim), two in progress ("3 / 5" where the padlock was)
152 the gift calendar on day 29: day 30 is the big last cell with its prize named
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
import datetime

from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def week_number(ms):
    """engine/features/counterattack.ts weekNumber: whole weeks since the first Monday of 1970, from the local Monday."""
    d = datetime.datetime.fromtimestamp(ms / 1000)
    monday = (d - datetime.timedelta(days=d.weekday())).date()
    return round(((monday - datetime.date(1970, 1, 1)).days - 4) / 7)


def absent(page, testid, shot_name):
    """Report (against the shot) a testid that is on screen when the queue says it must wait."""
    if is_up(page, testid):
        report["errors"].append(f'fixture 148_u4: "{testid}" is on screen in shot {shot_name} but must wait')
        return False
    return True


def run(ctx):
    browser = ctx.browser

    # 148: the new game 20 s in (the loop of shot 04): the coach is up, so the scene says nothing else
    try:
        page = seeded_page(browser, None, title=False)
        skip_title(page, 2000)
        wait_for(page, "cutscene", 15000)
        tid(page, "cutscene").click(); tid(page, "cutscene").click()
        tid(page, "skip-scene").click()
        for i in range(70):
            tap_station(page, ["counter", "oven", "prep"][i % 3]); advance(page, 300)
            if i % 4 == 3:
                for b in ["walk-drivers", "walk-ovens"]:
                    if page.locator(f'[data-testid="{b}"]').count():
                        tid(page, b).click(force=True)  # v5.20: the scrim may eat it (a tap outside Nonna's cut-out), like a finger's
            if page.locator('[data-testid="skip-scene"]').count():
                tid(page, "skip-scene").click()
        expect(page, "coach", 3000)
        expect(page, "walk-ovens", 3000)  # the purchase is still one tap away
        shot(page, "148-first-20s", 0.6)
    except Exception as e:
        report["errors"].append(f"U4 148 failed: {e}")

    # 149: an order offer on the table and a golden pizza due: one strip, one item. The offer wins; the pizza waits (its 12 s are held)
    try:
        page = seeded_page(browser, hooks_save(order={"offer": {"hood": "suburbs", "target": 1100, "left": 45, "variant": 0}},
                                               bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 2}))
        quiet_start(page)
        expect(page, "order-accept", 8000)
        advance(page, 1500)
        absent(page, "golden-pizza", "149")
        shot(page, "149-offer-golden-waits", 0.4)
    except Exception as e:
        report["errors"].append(f"U4 149 failed: {e}")

    # 150: the attack banner open in full (its first 10 s) and a golden pizza waiting behind it
    try:
        w = week_number(T0_MS)
        sv = hooks_save(bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 2})
        sv["x"] = {"counterattack": {"armedWeek": w - 1, "seenWeek": w, "target": "suburbs", "open": True, "defended": [], "challenge": None, "retryAt": 0}}
        c, page = fresh_page(browser, sv); settle(page, 0.5)
        expect(page, "attack-banner", 8000)
        advance(page, 800)
        absent(page, "golden-pizza", "150")
        shot(page, "150-attack-golden-waits", 0.4)
        c.close()
    except Exception as e:
        report["errors"].append(f"U4 150 failed: {e}")

    # rewards saves: the sets are written out, so the targets on screen are the ones below (no re-roll: day and week are today's)
    monday = (T0 - datetime.timedelta(days=T0.weekday())).strftime("%Y-%m-%d")
    stats = {"upgrades": 14, "ovens": 5, "hires": 1, "builds": 0, "fleet": 0, "decor": 2, "walkins": 3, "deliveries": 12, "baked": 25, "offline": 1, "boosters": 0, "dailyDone": 9, "days": 3}

    def rewarded(last, streak, daily=(), shown=None):
        r = {
            "day": day_str(), "daily": list(daily), "points": 40, "chests": [False, False, False], "rerollUsed": True,
            "week": monday, "weekly": [], "weeklyChest": False,
            "gift": {"streak": streak, "last": last, "saveUsed": False, "cycle": 0}, "giftShownDay": shown if shown is not None else day_str(),
            "diamonds": 42, "boosters": [], "boosts": [], "cosmetics": ["oven-woodfired"], "lastSeen": now_ms - 60000}
        return dict(MID_SAVE, saveVersion=7, tutorial=18, stats=stats, lastSavedAt=T0_MS, totalEarned=15000, rewards=r)

    # 151: three daily tasks: upgrades 3 / 5 and hires 1 / 3 in progress, decor done (Claim)
    try:
        daily = [
            {"kind": "upgrades", "target": 5, "base": 11, "claimed": False},   # 3 / 5: counters only the player moves, so the shop's sales never finish them
            {"kind": "hire", "target": 3, "base": 0, "claimed": False},        # 1 / 3
            {"kind": "decor", "target": 1, "base": 0, "claimed": False},       # done: Claim
        ]
        page = seeded_page(browser, rewarded(day_str(), 3, daily)); settle(page, 2.0)
        tid(page, "open-tasks").click()
        expect(page, "tasks-drawer", 3000)
        tid(page, "tab-daily").click()                    # v5.21: the drawer opens on Story
        expect(page, "claim-daily-2", 3000)               # the finished one keeps its Claim button
        expect(page, "progress-claim-daily-0", 3000)      # the unfinished ones say how far they are
        expect_text(page, "progress-claim-daily-0", r"3 ?/ ?5")
        shot(page, "151-tasks-progress", 0.8)
    except Exception as e:
        report["errors"].append(f"U4 151 failed: {e}")

    # 152: the gift calendar on day 29 (streak 28, last claimed yesterday): day 30 is the full-width cell with its name
    try:
        page = seeded_page(browser, rewarded(day_str(-1), 28, shown=""))
        wait_for(page, "gift-calendar", 8000)
        expect(page, "gift-day30-name", 3000)
        expect_text(page, "gift-day30-name", r"\S")
        shot(page, "152-gift-day-30", 1.0)
    except Exception as e:
        report["errors"].append(f"U4 152 failed: {e}")
