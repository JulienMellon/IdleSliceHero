"""Card C2 (v5.20): the scene reports its stations and their dials to the Coach. Shots 158-159.

158 step 2 (prep is rolling, a wait step): the prep table's cut-out and the prep dial's cut-out are both lit; the dial and its count pill are inside the lit area
159 step 4 (the oven is baking, a wait step): the same for the oven and its dial
Every state is asserted with expect() before its shot; game time moves only through advance(). The dial is the badge in the SVG (test ID dial-<station>):
its box must lie inside one of the overlay's cut-outs (coach-cut-0 / coach-cut-1), read from the DOM.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, tap_station, report, ...)


def tutorial_save(step, cash=0):
    """A fresh Downtown at tutorial step `step`: nothing sold, nothing managed, the opening scene seen."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    return dict(MID_SAVE, saveVersion=5, cash=cash, totalEarned=cash, vehicle=0, active="downtown", tutorial=step,
                shops=dict(unbuilt, downtown=shop(managed=False, sold=0)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS)


def inside_lit(page, dial_id, shot_name):
    """The dial's box must lie inside one of the overlay's cut-outs (half a point of give)."""
    box = tid(page, dial_id).bounding_box()
    for i in range(3):
        loc = page.locator(f'[data-testid="coach-cut-{i}"]')
        if not loc.count():
            continue
        cut = loc.first.bounding_box()
        if (cut["x"] <= box["x"] + 0.5 and cut["y"] <= box["y"] + 0.5
                and cut["x"] + cut["width"] >= box["x"] + box["width"] - 0.5 and cut["y"] + cut["height"] >= box["y"] + box["height"] - 0.5):
            return True
    report["errors"].append(f'fixture 158_c2: "{dial_id}" {box} is outside every cut-out in shot {shot_name}')
    return False


def run(ctx):
    browser = ctx.browser

    # 158: step 1 -> tap the prep table -> step 2, "Rolling the dough…": the station and its dial are lit together
    try:
        page = seeded_page(browser, tutorial_save(1)); settle(page, 1.0)
        expect(page, "coach", 3000)
        expect(page, "coach-cut-0", 3000)
        tap_station(page, "prep"); advance(page, 400)
        expect(page, "coach-cut-1", 3000)     # a wait step cuts two holes: the station, then its dial
        expect(page, "dial-prep", 3000)
        inside_lit(page, "dial-prep", "158-coach-dial-prep")
        inside_lit(page, "dial-count-prep", "158-coach-dial-prep")     # G112: the number Nonna names is lit with the ring
        shot(page, "158-coach-dial-prep", 0.5)

        # 159: the dough is rolled -> tap the oven -> step 4, "Watch the timer…": the oven and its dial
        until(page, lambda: tid(page, "coach").inner_text().startswith("Into the oven"), 20000)
        tap_station(page, "oven"); advance(page, 400)
        expect(page, "coach-cut-1", 3000)
        expect(page, "dial-oven", 3000)
        inside_lit(page, "dial-oven", "159-coach-dial-oven")
        inside_lit(page, "dial-count-oven", "159-coach-dial-oven")
        shot(page, "159-coach-dial-oven", 0.5)
    except Exception as e:
        report["errors"].append(f"C2 158/159 failed: {e}")
