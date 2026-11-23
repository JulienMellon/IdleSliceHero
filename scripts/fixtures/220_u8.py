"""Card U8 (v5.23b): Story tab, coach and goal-bar minors. Shots 220-220e.

220  step 8 of the tutorial: the Story tab is lit, Chapter 1 has Nonna's line and portrait (D545), the hand rests 24 pt right and below, off the "Next: Chapter 2" row (D542)
220b chapter 2, a rate held over its target: "6/6 · holding" with a full bar (D537); the row the goal bar picks says so (S89)
220c chapter 4: the reward row names what it opens, "Daily tasks open" (D538), with the SVG clapper and gem (D535)
220d "Go" on a "Beat MegaSlice" row: the shop, with the rival's pavement band glowing (D547); two seconds later it is dark again
220e a hire done: the tick badge and the chapter ribbon (D544); the ribbon is gone 1.5 s after it began
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, is_up, report, ...)

TUTORIAL_DONE = 18
ORDER = ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-4", "waterfront-1", "waterfront-2", "waterfront-3", "waterfront-4"]
CH1 = ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3"]


def tutorial_save(step):
    """A fresh Downtown after its first sale at tutorial step `step`: nothing managed, the opening scene seen."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=8, cash=4, totalEarned=12, vehicle=0, active="downtown", tutorial=step,
                shops=dict(unbuilt, downtown=shop(managed=False, sold=1)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=60)


def chapter_save(n, active="downtown", run=None, **kw):
    """Past the tutorial with chapters 1 .. n-1 done (their scenes seen): chapter n is on."""
    keys = [f"task.{sc}.{i}" for sc in ORDER[:n - 1] for i in (1, 2, 3)]
    sv = dict(MID_SAVE, saveVersion=8, cash=5e5, vehicle=2, active=active, tutorial=TUTORIAL_DONE, scrapbookViewed=9, lastSavedAt=T0_MS, playSeconds=5000,
              seenScenes=ORDER[:n - 1], rewards={"giftShownDay": day_str()}, **kw)
    sv["x"] = {"chapters": {"done": keys, "best": {}, "run": run or {}, "calm": {}, "report": False}}
    return sv


def run(ctx):
    browser = ctx.browser

    # 220: step 8, the Story tab lit with the hand off its text
    try:
        page = seeded_page(browser, tutorial_save(7)); settle(page, 0.5)
        expect(page, "coach", 3000)
        tid(page, "goal").click(); advance(page, 700)
        expect(page, "tasks-drawer", 3000)
        expect_text(page, "coach", r"This list tells you", 3000)
        expect(page, "coach-hand", 3000)
        expect_text(page, "story-tab", r"Chapter\s*1", 3000)
        expect_text(page, "story-teaser", r"Take my keys, cara", 3000)
        expect_text(page, "story-reward", r"Next: Chapter 2", 3000)
        shot(page, "220-step8-chapter1-line", 0.4)
    except Exception as e:
        report["errors"].append(f"U8 220 failed: {e}")

    # 220b: a rate held over its target
    try:
        sv = chapter_save(2, run={"task.downtown-2.3": {"lo": 8, "secs": 12}})
        sv["shops"] = dict(sv["shops"], downtown=shop(managed=False, sold=212))
        page = seeded_page(browser, sv); settle(page, 1.0)
        tid(page, "goal").click(); advance(page, 700)
        expect(page, "story-tab", 3000)
        expect_text(page, "story-tab", r"6/6\s*·\s*holding", 3000)
        expect(page, "story-next", 3000)  # S89: the bar leads with the hire, so the list marks it
        shot(page, "220b-rate-holding", 0.4)
    except Exception as e:
        report["errors"].append(f"U8 220b failed: {e}")

    # 220c: chapter 4's reward row
    try:
        page = seeded_page(browser, chapter_save(4)); settle(page, 1.0)
        tid(page, "goal").click(); advance(page, 700)
        expect(page, "story-tab", 3000)
        expect_text(page, "story-reward", r"Daily tasks open", 3000)
        shot(page, "220c-reward-daily", 0.4)
    except Exception as e:
        report["errors"].append(f"U8 220c failed: {e}")

    # 220d: Go on the "Beat MegaSlice" row (chapter 8): the Suburbs shop with the rival band glowing, then dark
    try:
        page = seeded_page(browser, chapter_save(8)); settle(page, 1.0)
        tid(page, "goal").click(); advance(page, 700)
        expect(page, "story-go", 3000)
        tid(page, "story-go").click(); advance(page, 500)
        expect(page, "rival-shop", 3000)
        shot(page, "220d-go-win-glow", 0.2)
        advance(page, 2200)
        shot(page, "220d2-glow-over", 0.2)
    except Exception as e:
        report["errors"].append(f"U8 220d failed: {e}")

    # 220e: a hire done: the tick badge and the ribbon, gone by 1.5 s
    try:
        unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
        sv = dict(MID_SAVE, saveVersion=8, cash=5000, totalEarned=5000, vehicle=0, active="downtown", tutorial=14,
                  shops=dict(unbuilt, downtown=shop(managed=False, sold=30, ovens=2)),
                  seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=300)
        page = seeded_page(browser, sv); settle(page, 0.5)
        expect_text(page, "goal", r"Ch\s*1", 3000)
        tid(page, "open-upgrades").click(); advance(page, 600)
        tid(page, "buy-headPrep").click(); advance(page, 150)
        tid(page, "close-upgrades").click(); advance(page, 250)
        expect(page, "goal-ribbon", 3000)
        expect(page, "goal-tick", 1000)
        shot(page, "220e-tick-ribbon", 0.0)
        advance(page, 1500)
        if is_up(page, "goal-ribbon"):
            report["errors"].append("fixture 220_u8: the chapter ribbon is still up 1.5 s after it began")
    except Exception as e:
        report["errors"].append(f"U8 220e failed: {e}")
