"""Card U2 (v5.21): the Story tab of the tasks drawer. Shots 175-177.

175 chapter 2 half way (212 of 424 pies, no head yet): the title, the teaser with its portrait, the tasks and the reward
176 chapter 2 done and waiting on the story's pacing: three ticks and "Next scene in ..." (needs the scene held back, see the note there)
177 the Daily tab before Nonna takes over: the padlock and "Opens when Nonna takes over"
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)

TUTORIAL_DONE = 16


def story_save(sold=212, **kw):
    """Downtown after its tutorial, before Nonna takes over (chapter 2 of the story is on): the drawer's Daily and Weekly are padlocked."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=8, cash=500, totalEarned=500, vehicle=0, active="downtown", tutorial=TUTORIAL_DONE,
                shops=dict(unbuilt, downtown=shop(managed=False, prep=3, ovens=2, counter=2, sold=sold, **kw)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=200)


def open_drawer(page):
    tid(page, "open-tasks").click()
    expect(page, "tasks-drawer", 3000)
    expect(page, "story-tab", 3000)


def run(ctx):
    browser = ctx.browser

    # 175: chapter 2 half way: the Story tab is the one open, with the teaser's portrait, a bar "212/424" and the reward row
    try:
        page = seeded_page(browser, story_save()); settle(page, 1.0)
        open_drawer(page)
        expect_text(page, "story-title", r"First Regulars")
        expect_text(page, "story-teaser", r"Nonna Rosa hears a sound")
        expect_text(page, "story-reward", r"New scene")
        shot(page, "175-story-half", 0.6)
    except Exception as e:
        report["errors"].append(f"U2 175 failed: {e}")

    # 176: every task done: three ticks. The scene follows at once on a fresh launch (no session gap yet), so the shot is of the ticks;
    # "Next scene in" shows for the seconds the pacing keeps a finished chapter waiting (the jest tests pin its text and countdown)
    try:
        page = seeded_page(browser, story_save(sold=424, heads={"prep": True, "oven": True, "counter": False})); settle(page, 0.5)
        tid(page, "open-tasks").click()
        expect(page, "story-tab", 3000)
        shot(page, "176-story-done", 0.6)
    except Exception as e:
        report["errors"].append(f"U2 176 failed: {e}")

    # 177: the Daily tab before the takeover: a padlock, and no list to claim
    try:
        page = seeded_page(browser, story_save()); settle(page, 1.0)
        open_drawer(page)
        tid(page, "tab-daily").click()
        expect(page, "tab-locked", 3000)
        expect_text(page, "tab-locked", r"Opens when Nonna takes over")
        shot(page, "177-daily-locked", 0.5)
    except Exception as e:
        report["errors"].append(f"U2 177 failed: {e}")
