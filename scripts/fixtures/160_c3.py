"""Card C3 (v5.20): the Chapter 1 script. Shots 160-169, one for each of steps 1, 2, 4, 6, 9, 10, 11, 12, 13, 15.

160 step 1  tap the prep table          165 step 10 tap Ovens (the second oven is affordable)
161 step 2  the prep dial fills         166 step 11 both ovens lit (a look)
162 step 4  the oven dial is the timer  167 step 12 tap All
163 step 6  the cash (a look)           168 step 13 the drawer's prep-head hire card (a look, then Nonna's card alone)
164 step 9  free play, save for ovens   169 step 15 the prep dial runs on its own (a look)
Every state is asserted with expect_text() on Nonna's line (the step's copy) before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, tap_station, advance, until, report, ...)

HEADS_PREP = {"prep": True, "oven": False, "counter": False}


def tutorial_save(step, cash=0, **kw):
    """A fresh Downtown at tutorial step `step` (the v7 numbering): nothing managed, the opening scene seen."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=7, cash=cash, totalEarned=cash, vehicle=0, active="downtown", tutorial=step,
                shops=dict(unbuilt, downtown=shop(managed=False, **kw)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS)


def lit(page, cut_id, testid, shot_name):
    """The cut-out must hold the element it points at (its box, give or take half a point)."""
    cut = tid(page, cut_id).bounding_box()
    box = tid(page, testid).bounding_box()
    ok = (cut["x"] <= box["x"] + 0.5 and cut["y"] <= box["y"] + 0.5
          and cut["x"] + cut["width"] >= box["x"] + box["width"] - 0.5 and cut["y"] + cut["height"] >= box["y"] + box["height"] - 0.5)
    if not ok:
        report["errors"].append(f'fixture 160_c3: {cut_id} {cut} does not hold "{testid}" {box} in shot {shot_name}')


def step_page(browser, step, line, cash=0, **kw):
    """Boot at `step`, wait for Nonna's line of that step, and return the page."""
    page = seeded_page(browser, tutorial_save(step, cash, **kw)); settle(page, 0.5)
    expect(page, "coach", 3000)
    expect_text(page, "coach", line, 3000)
    return page


def run(ctx):
    browser = ctx.browser

    # 160-162: the real run: step 1, tap prep -> step 2, the dough rolls -> tap the oven -> step 4
    try:
        page = step_page(browser, 1, r"First, the dough")
        expect(page, "coach-cut-0", 3000)
        shot(page, "160-step1-prep", 0.5)
        tap_station(page, "prep"); advance(page, 400)
        expect_text(page, "coach", r"See the dial", 3000)
        expect(page, "coach-cut-1", 3000)
        shot(page, "161-step2-prep-dial", 0.5)
        until(page, lambda: "dough is ready" in tid(page, "coach").inner_text(), 20000)
        tap_station(page, "oven"); advance(page, 400)
        expect_text(page, "coach", r"The dial is the timer", 3000)
        expect(page, "coach-cut-1", 3000)
        shot(page, "162-step4-oven-dial", 0.5)
    except Exception as e:
        report["errors"].append(f"C3 160-162 failed: {e}")

    # 163: step 6, the first pizza is sold: the cash pill, for a look
    try:
        page = step_page(browser, 6, r"Every pizza you sell", 12, sold=1)
        expect(page, "coach-cut-0", 3000)
        lit(page, "coach-cut-0", "cash", "163-step6-cash")
        shot(page, "163-step6-cash", 0.4)
    except Exception as e:
        report["errors"].append(f"C3 163 failed: {e}")

    # 164: step 9, free play: only Nonna's card, no scrim
    try:
        page = step_page(browser, 9, r"Save \$[\d.,]+\w* for a second oven", 4, sold=3)
        if is_up(page, "coach-cut-0"):
            report["errors"].append("fixture 160_c3: step 9 draws a cut-out (it is free play)")
        shot(page, "164-step9-free", 0.4)
    except Exception as e:
        report["errors"].append(f"C3 164 failed: {e}")

    # 165: step 10, the money is there: the Ovens card is lit
    try:
        page = step_page(browser, 10, r"you have enough", 5000, sold=30)
        expect(page, "coach-cut-0", 3000)
        lit(page, "coach-cut-0", "walk-ovens", "165-step10-ovens")
        shot(page, "165-step10-ovens", 0.4)
    except Exception as e:
        report["errors"].append(f"C3 165 failed: {e}")

    # 166: step 11, two ovens
    try:
        page = step_page(browser, 11, r"Two ovens bake two", 0, sold=30, ovens=2)
        expect(page, "coach-cut-0", 3000)
        shot(page, "166-step11-two-ovens", 0.4)
    except Exception as e:
        report["errors"].append(f"C3 166 failed: {e}")

    # 167: step 12, the All button
    try:
        page = step_page(browser, 12, r"Tap All", 0, sold=30, ovens=2)
        expect(page, "coach-cut-0", 3000)
        lit(page, "coach-cut-0", "open-upgrades", "167-step12-all")
        shot(page, "167-step12-all", 0.4)

        # 168: All opens the drawer -> step 13: the prep head's hire card is lit
        tid(page, "open-upgrades").click(); advance(page, 600)
        expect_text(page, "coach", r"rolls dough for you", 3000)
        expect(page, "coach-cut-0", 3000)
        lit(page, "coach-cut-0", "buy-headPrep", "168-step13-hire")
        shot(page, "168-step13-hire", 0.4)
        # after the look (2.5 s) the scrim goes and only her card stays: Close and the hire card can be tapped
        advance(page, 3000)
        if is_up(page, "coach-block"):
            report["errors"].append("fixture 160_c3: step 13 keeps its scrim after the look")
        tid(page, "close-upgrades").click(); advance(page, 600)
        expect_text(page, "coach", r"won.t hire himself", 3000)
    except Exception as e:
        report["errors"].append(f"C3 167/168 failed: {e}")

    # 169: step 15, Marco rolls on his own: the prep station and its dial
    try:
        page = step_page(browser, 15, r"rolls on his own now", 0, sold=30, ovens=2, heads=HEADS_PREP)
        expect(page, "coach-cut-0", 3000)
        shot(page, "169-step15-marco", 0.4)
    except Exception as e:
        report["errors"].append(f"C3 169 failed: {e}")
