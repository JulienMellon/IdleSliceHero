"""Card C1 (v5.20): the Coach overlay, one highlight for every tutorial step. Shots 153-155.

153 a fresh save at step 1: the scrim, the prep station's cut-out, the hand, Nonna's card below it
154 step 6: the cash pill is the cut-out (a wait step, the ring breathes), her card below it
155 step 10 (was 8 before the 15-step script): the Ovens card on the sidewalk is the cut-out, her card above it (no room below)
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def tutorial_save(step, cash):
    """A fresh Downtown at tutorial step `step`: nothing sold, nothing managed, the opening scene seen."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=7, cash=cash, totalEarned=cash, vehicle=0, active="downtown", tutorial=step,
                shops=dict(unbuilt, downtown=shop(managed=False, sold=0)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS)


def cut_holds(page, cut_id, testid, shot_name):
    """The overlay's cut-out must contain the element it points at (its box, give or take half a point)."""
    cut = tid(page, cut_id).bounding_box()
    box = tid(page, testid).bounding_box()
    ok = (cut["x"] <= box["x"] + 0.5 and cut["y"] <= box["y"] + 0.5
          and cut["x"] + cut["width"] >= box["x"] + box["width"] - 0.5 and cut["y"] + cut["height"] >= box["y"] + box["height"] - 0.5)
    if not ok:
        report["errors"].append(f'fixture 153_c1: {cut_id} {cut} does not hold "{testid}" {box} in shot {shot_name}')
    return ok


def run(ctx):
    browser = ctx.browser

    # 153: step 1, "Tap the prep table": the station's rect is registered by the scene (card C2)
    try:
        page = seeded_page(browser, tutorial_save(1, 0)); settle(page, 1.0)
        expect(page, "coach", 3000)
        expect(page, "coach-overlay", 3000)
        expect(page, "coach-cut-0", 3000)     # the prep station's hole
        expect(page, "coach-hand", 3000)
        shot(page, "153-coach-step1", 0.5)
    except Exception as e:
        report["errors"].append(f"C1 153 failed: {e}")

    # 154: step 6, "money in the register": the HUD's cash pill
    try:
        page = seeded_page(browser, tutorial_save(6, 4)); settle(page, 1.0)
        expect(page, "coach", 3000)
        expect(page, "coach-cut-0", 3000)
        cut_holds(page, "coach-cut-0", "cash", "154-coach-step6")
        shot(page, "154-coach-step6", 0.5)
    except Exception as e:
        report["errors"].append(f"C1 154 failed: {e}")

    # 155: step 10, "Tap Ovens": the sidewalk card (the cash for it is in the save, or the coach falls back to step 7)
    try:
        page = seeded_page(browser, tutorial_save(10, 600)); settle(page, 1.0)
        expect(page, "coach", 3000)
        expect(page, "coach-cut-0", 3000)
        cut_holds(page, "coach-cut-0", "walk-ovens", "155-coach-step8")
        # a tap outside the hole is swallowed (the scrapbook stays shut); one inside reaches the card (the ovens are bought, the step is over)
        before = page.url
        tid(page, "open-scrapbook").click(force=True); advance(page, 400)
        if page.url != before or not is_up(page, "coach"):
            report["errors"].append("fixture 153_c1: a tap outside the cut-out got through the scrim in shot 155-coach-step8")
        shot(page, "155-coach-step8", 0.5)
        tid(page, "walk-ovens").click(); advance(page, 600)
        if is_up(page, "coach-cut-0") and tid(page, "coach").inner_text().startswith("Tap Ovens"):
            report["errors"].append("fixture 153_c1: a tap inside the cut-out did not reach the Ovens card")
    except Exception as e:
        report["errors"].append(f"C1 155 failed: {e}")
