"""Card E2 (v5.21): tutorial steps 7 and 8, Nonna's list. Shots 179-179c.

179  step 7: "I keep a list, like my mother did. Tap it, cara." with the goal bar lit
179b step 8: the task list is open on its Story tab; the tab is lit (a look)
179c step 8 after the look: the scrim is gone and only Nonna's card stays, so the list can be read and closed
Closing the list ends step 8: step 9's "save up" line follows. Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)


def list_save(step):
    """A fresh Downtown after its first sale at tutorial step `step`: nothing managed, the opening scene seen."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=8, cash=4, totalEarned=12, vehicle=0, active="downtown", tutorial=step,
                shops=dict(unbuilt, downtown=shop(managed=False, sold=1)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=60)


def run(ctx):
    browser = ctx.browser
    try:
        page = seeded_page(browser, list_save(7)); settle(page, 0.5)
        expect(page, "coach", 3000)
        expect_text(page, "coach", r"I keep a list", 3000)
        expect(page, "coach-cut-0", 3000)
        shot(page, "179-step7-goal", 0.4)

        # the tap on the lit bar opens the list on its Story tab: step 8
        tid(page, "goal").click(); advance(page, 700)
        expect(page, "tasks-drawer", 3000)
        expect_text(page, "coach", r"This list tells you", 3000)
        expect(page, "coach-cut-0", 3000)
        shot(page, "179b-step8-story-tab", 0.4)

        # the look seen (4 s): the scrim goes, the card stays, and Close can be tapped
        advance(page, 4500)
        if is_up(page, "coach-block"):
            report["errors"].append("fixture 179_e2: step 8 keeps its scrim after the look")
        expect_text(page, "coach", r"This list tells you", 3000)
        shot(page, "179c-step8-seen", 0.4)

        # closing the list ends step 8
        tid(page, "close-tasks").click(); advance(page, 700)
        expect_text(page, "coach", r"Save \$[\d.,]+\w* for a faster oven", 3000)
    except Exception as e:
        report["errors"].append(f"E2 179 failed: {e}")
