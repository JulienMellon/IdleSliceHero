"""Shots 140-147 (v5.18, card V2): wide shops, a second floor plan, off-screen cues.

140 a Restaurant scrolled to the kitchen · 141 the same scrolled to the dining room · 142 a Flagship, centre ·
143 a Flagship during a rush with a cue pointing at the prep bench, where orders pile up · 144 Waterfront mirrored (kitchen on the right, door on the left) ·
145 Industrial mirrored with a jam off screen and its cue · 146 a cold line with the short queue · 147 a Corner shop, unchanged, for comparison.
Levels are chosen against vehicle 0 (see 130_p1.py): an oven level of 1 against a prep and a counter of 60 backs the prep bench up (the `piling` symptom, v5.22: a station is named by its pile, never as the limit). Game time moves only through advance().
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, scroll_shop, tap_shop, hood_save, ...

PLAY = 1000
SCENES = ("downtown-1 downtown-2 downtown-3 downtown-4 downtown-5 industrial-1 industrial-2 industrial-2b industrial-3 industrial-3b industrial-4 "
          "industrial-hire suburbs-1 suburbs-2 suburbs-3 suburbs-3b suburbs-4 suburbs-5 suburbs-hire university-1 university-2 university-3 "
          "university-3b university-3c university-4 university-hire uptown-1 uptown-2 uptown-2b uptown-3 uptown-3b uptown-4 uptown-hire "
          "waterfront-1 waterfront-2 waterfront-3 waterfront-3b waterfront-4 waterfront-5 waterfront-hire").split()
DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}


def shop_save(hood="downtown", cash=2000, **kw):
    """A save in `hood` after the tutorial, the gift already shown, every story scene seen (so no cut-scene is due)."""
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save(hood, cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS, playSeconds=PLAY, seenScenes=SCENES, scrapbookViewed=len(SCENES))
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def page_of(b, save):
    """The save on a page whose "Coming soon: Boston" card has been seen."""
    return seeded_page(b, save, storage={"slice-empire/boston-seen": "1"})


def wide(page, what):
    """The wide shop is up (it has a scroll view), or the run says so against the shot."""
    return expect(page, "shop-scroll", 4000) or report["errors"].append(f"fixture 140_v2: {what} did not scroll")


def run(ctx):
    b = ctx.browser

    # 140 / 141: a Restaurant (520 wide): the kitchen at one end of the street, the dining room and the door at the other
    page = page_of(b, shop_save(footprint=3, prep=40, ovens=40, counter=40, drivers=20, tables=30, grade=2))
    settle(page, 2.0)
    wide(page, "the Restaurant")
    scroll_shop(page, "start")
    shot(page, "140-restaurant-kitchen", 0.4)
    scroll_shop(page, "end")
    shot(page, "141-restaurant-dining", 0.4)

    # 142: a Flagship (640 wide), scrolled to its middle: the second prep table, the long bank, two rows of tables
    page = page_of(b, shop_save(footprint=4, prep=100, ovens=100, counter=100, drivers=50, tables=60, grade=3, sold=9e5))
    settle(page, 2.0)
    wide(page, "the Flagship")
    scroll_shop(page, "middle")
    shot(page, "142-flagship-centre", 0.4)

    # 143: the Flagship's ovens are slow, so dough piles up at the prep bench (symptom `piling`) and the player is rushing at the counter end: a chevron points back at the bench. (The oven bank's badge is
    # always on screen in a 640 drawing: 190 units wide in the middle of it; the ovens' own cue is the jam at the bank's far end, shot 145.)
    page = page_of(b, shop_save(footprint=4, prep=60, ovens=1, counter=60, drivers=50, tables=60, grade=3, sold=9e5))
    settle(page, 2.0)
    advance(page, 40000)  # the pile has to build up for the symptom to hold
    wide(page, "the rushed Flagship")
    scroll_shop(page, "end")
    for _ in range(4):
        tap_shop(page)
        advance(page, 250)
    expect(page, "scroll-cue-left", 4000)
    shot(page, "143-flagship-rush-cue", 0.3)

    # 144: Waterfront, the mirrored plan: kitchen on the right, door on the left, the harbour's side of the street; the shop opens at the counter
    page = page_of(b, shop_save("waterfront", footprint=3, prep=40, ovens=40, counter=40, drivers=20, tables=30, grade=2))
    settle(page, 2.0)
    wide(page, "Waterfront")
    shot(page, "144-waterfront-mirrored", 0.4)

    # 145: Industrial, mirrored, hand-run, an oven jammed 5 s ago: the oven bank is off the right edge and a jam chevron says so
    page = page_of(b, dict(shop_save("industrial", footprint=4, prep=60, ovens=50, counter=60, drivers=30, tables=30, grade=2, managed=False, sold=9e5),
                           x={"industrialShifts": {"seed": 5, "n": 0, "nextAt": PLAY + 5000, "jam": PLAY - 5, "startAt": PLAY - 100, "at": T0_MS}}))
    settle(page, 2.0)
    wide(page, "Industrial")
    scroll_shop(page, "start")
    expect(page, "scroll-cue-right", 4000)
    shot(page, "145-industrial-jam-cue", 0.3)

    # 146: under 60% served for a minute: the line goes cold and the street draws a short queue (the report's queueShare)
    page = page_of(b, shop_save(footprint=2, prep=5, ovens=5, counter=5, drivers=10, tables=10))
    settle(page, 2.0)
    advance(page, 66000)
    # the strip no longer says "cold" (v5.22: served/missed only); the sheet's service row does
    tid(page, "shop-report-strip").click()
    expect_text(page, "report-service", r"cold", 4000)
    tid(page, "close-report").click()
    advance(page, 500)
    shot(page, "146-cold-short-queue", 0.4)

    # 147: a Corner shop, the same screen as before this card (for comparison with the wide shops)
    page = page_of(b, shop_save(footprint=2, prep=30, ovens=30, counter=30, drivers=14, tables=12, grade=1))
    settle(page, 2.0)
    shot(page, "147-corner-unchanged", 0.4)
