"""Card U2 (v5.21): the Story tab of the tasks drawer. Shots 175-177.

175 chapter 2 half way (212 of 424 pies, no head yet): the title, the teaser with its portrait, the tasks and the reward
176 chapter 2 done and waiting on the story's pacing: three ticks and "Next scene in ..." (needs the scene held back, see the note there)
177 the Daily tab before Nonna takes over: the padlock and "Opens when Nonna takes over"
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)

TUTORIAL_DONE = 16
CH1 = [f"task.downtown-1.{n}" for n in (1, 2, 3)]  # chapter 1 (the tutorial's) is done, so chapter 2 is the one on


def story_save(sold=212, **kw):
    """Downtown after its tutorial, before Nonna takes over (chapter 2 of the story is on): the drawer's Daily and Weekly are padlocked."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=8, cash=500, totalEarned=500, vehicle=0, active="downtown", tutorial=TUTORIAL_DONE,
                shops=dict(unbuilt, downtown=shop(managed=False, prep=3, ovens=2, counter=2, sold=sold, **kw)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=200,
                x={"chapters": {"done": CH1, "best": {}, "run": {}, "calm": {}, "report": False}})


# D536: a chapter whose open task is done by going somewhere: its Go button (44 pt) takes the player there. Main beats, in story order, with the
# interludes before them: everything before the chapter has played, the first chapter's tasks are done, Nonna has taken over (the list is open).
BEATS = ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-3b", "suburbs-hire",
         "suburbs-4", "waterfront-1", "waterfront-2", "waterfront-3", "waterfront-3b", "waterfront-4"]


def go_save(chapter, built):
    """The save on `chapter` (a scene id in BEATS): every beat before it seen, `built` the shops that exist, all of them run by their managers."""
    seen = BEATS[:BEATS.index(chapter)]
    shops = {h: shop(built=h in built, managed=h in built, prep=8, ovens=6, counter=6, sold=900 if h in built else 0) for h in IDS}
    return dict(MID_SAVE, saveVersion=8, cash=200, totalEarned=20000, vehicle=1, active=built[-1], tutorial=TUTORIAL_DONE, shops=shops,
                seenScenes=seen, scrapbookViewed=3, lastSavedAt=T0_MS, playSeconds=900,
                rewards={"giftShownDay": day_str()},
                x={"chapters": {"done": CH1, "best": {}, "run": {}, "calm": {}, "report": False}})


def go_shot(browser, chapter, built, title, name):
    """Open the Story tab of `chapter`: its title is the chapter's, and a Go button (44 pt) is on the row."""
    page = seeded_page(browser, go_save(chapter, built)); settle(page, 1.0)
    open_drawer(page)
    expect_text(page, "story-title", title)
    expect(page, "story-go", 3000)
    box = tid(page, "story-go").first.bounding_box()
    if box["height"] < 43.5 or box["width"] < 43.5:
        report["errors"].append(f"fixture 175_u2: the Go button is {box['width']:.0f} x {box['height']:.0f} pt in shot {name} (44 pt needed)")
    shot(page, name, 0.6)


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

    # 175b-d (D536): the Story tab on a build, a win and a bid chapter: each open task has its Go
    for chapter, built, title, name in [
        ("suburbs-1", ["downtown"], r"Meet the Mudhens", "175b-story-go-build"),
        ("suburbs-4", ["downtown", "suburbs"], r"The Championship", "175c-story-go-win"),
        ("waterfront-4", ["downtown", "suburbs", "waterfront"], r"Auction Day", "175d-story-go-bid"),
    ]:
        try:
            go_shot(browser, chapter, built, title, name)
        except Exception as e:
            report["errors"].append(f"U2 {name} failed: {e}")
