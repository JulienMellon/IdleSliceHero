"""Shots 192-194 (v5.22, card E4): Nonna's report tutorial, the first time the chapter task "Read the Downtown shop report" is the next one.

192 the strip lit (a tap opens the sheet) · 193 the sheet open, the Ovens bar lit · 194 the dashed line lit. After the third look Nonna stops: the sheet is left alone,
and once it is closed the coach is gone for good (asserted: no coach overlay, nothing lit on the second opening).
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, ...)

TUTORIAL_DONE = 16


def chapter3_save():
    """Downtown after its tutorial with all three heads, chapter 3 on: the serve count is still short, the hire is done, the report is the next task."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    done = [f"task.downtown-{c}.{n}" for c in (1, 2) for n in (1, 2, 3)]
    sv = dict(MID_SAVE, x={"chapters": {"done": done, "best": {}, "run": {}, "calm": {}, "report": False, "coachDone": []}}, saveVersion=8, cash=2000, totalEarned=2000,
              vehicle=0, active="downtown", tutorial=TUTORIAL_DONE, seenScenes=["downtown-1", "downtown-2"], scrapbookViewed=2, lastSavedAt=T0_MS, playSeconds=900,
              shops=dict(unbuilt, downtown=shop(managed=False, heads={"prep": True, "oven": True, "counter": True}, prep=10, ovens=5, counter=10, drivers=10, tables=1,
                                                 footprint=1, sold=900)))
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def run(ctx):
    b = ctx.browser
    try:
        page = seeded_page(b, chapter3_save())
        settle(page, 2.0)
        expect(page, "coach-overlay", 6000)
        expect_text(page, "coach", r"This strip, cara")
        shot(page, "192-report-coach-strip", 0.5)

        tid(page, "shop-report-strip").click()  # the cut-out lets the tap through
        expect(page, "report-sheet")
        expect_text(page, "coach", r"This bar is my ovens")
        shot(page, "193-report-coach-bar", 0.5)

        tid(page, "coach-block").first.click()  # a tap anywhere ends a look
        expect_text(page, "coach", r"Dashed line, cara")
        shot(page, "194-report-coach-demand", 0.5)

        tid(page, "coach-block").first.click()
        advance(page, 600)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E4: the coach is still up after the third look")
        tid(page, "close-report").click()
        advance(page, 800)
        tid(page, "shop-report-strip").click()
        expect(page, "report-sheet")
        advance(page, 800)
        if is_up(page, "coach-overlay"):
            report["errors"].append("E4: the report coach came back on the second opening")
    except Exception as e:
        report["errors"].append(f"E4 fixture failed: {e}")
