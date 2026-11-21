"""Card U1 (v5.21): the goal bar is the next chapter task. Shots 178-178d.

178  chapter 2 at 0 pies: "Ch 2 · Serve 424 pies in Downtown", 0/424, the bar empty
178b chapter 2 half way: 212/424, the bar half full
178c a chapter done and waiting on the story's pacing: a full basil bar that says "Ready" with the countdown
178d a tap on the bar opens the task list on its Story tab (it buys nothing)
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, tap_shop, report, ...)

TUTORIAL_DONE = 16


def story_save(sold=0, **kw):
    """Downtown after its tutorial, before Nonna takes over: chapter 2 of the story is on."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    opening = ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3"]  # the free chapter 1 stays current until its tasks are done
    return dict(MID_SAVE, x={"chapters": {"done": opening, "best": {}, "run": {}, "calm": {}, "report": False}}, saveVersion=8, cash=500, totalEarned=500, vehicle=0, active="downtown", tutorial=TUTORIAL_DONE,
                shops=dict(unbuilt, downtown=shop(managed=False, prep=3, ovens=2, counter=2, sold=sold, **kw)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=200)


def run(ctx):
    browser = ctx.browser

    # 178: no pies yet
    try:
        page = seeded_page(browser, story_save()); settle(page, 1.0)
        expect_text(page, "goal", r"Ch\s*2")
        expect_text(page, "goal", r"Serve\s+424\s+pies")
        expect_text(page, "goal", r"0/424")
        shot(page, "178-goal-start", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178 failed: {e}")

    # 178b: half way
    try:
        page = seeded_page(browser, story_save(sold=212)); settle(page, 1.0)
        expect_text(page, "goal", r"212/424")
        shot(page, "178b-goal-half", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178b failed: {e}")

    # 178c: every task of chapters 2 and 3 done: chapter 2's beat plays (and is skipped), and chapter 3's waits on the 90 s the story keeps between
    # beats: a full basil bar that says Ready, with the countdown in its words
    try:
        sv = story_save(sold=941, heads={"prep": True, "oven": True, "counter": True})
        sv["x"] = {"chapters": {"done": ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3", "task.downtown-2.1", "task.downtown-2.2", "task.downtown-2.3", "task.downtown-3.1", "task.downtown-3.2", "task.downtown-3.3"],
                                "best": {}, "run": {}, "calm": {}, "report": False}}
        page = seeded_page(browser, sv)
        expect(page, "skip-scene", 8000)
        tid(page, "skip-scene").click()
        advance(page, 1500)
        for t in ("skip-scene", "collect-offline"):  # a second scene or popup due: away too
            if page.locator(f'[data-testid="{t}"]').count():
                tid(page, t).click(); advance(page, 800)
        expect_text(page, "goal", r"Next\s+scene\s+in")
        expect_text(page, "goal", r"Ready")
        shot(page, "178c-goal-ready", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178c failed: {e}")

    # 178d: a tap on the bar opens the list on the Story tab
    try:
        page = seeded_page(browser, story_save(sold=212)); settle(page, 1.0)
        tid(page, "goal").click()
        expect(page, "tasks-drawer", 3000)
        expect(page, "story-tab", 3000)
        shot(page, "178d-goal-opens-list", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178d failed: {e}")
