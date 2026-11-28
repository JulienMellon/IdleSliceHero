"""Shots 239-243 (v5.25, card S7): renovation art for the University, Industrial and Uptown, and the free gift's box.

239 the University at renovation III (shield plaque with a book, school banner on the pilaster, clock tower, sticker-covered lounge counter, bulletin board, bean bag, string lights, couch,
vending machine, bike rack, globe, library ladder, telescope) · 240 Industrial at III (hex-nut plaque, steel shutter, brick chimney with a plume, gantry crane, pipe run, drums, pegboard, flour
pallet, gear clock, work lamp, boiler, conveyor, anvil table) · 241 Uptown at III (art-deco fan plaque, brass revolving door, gold crown, marble counter, velvet rope, orchid, lectern, columns, piano,
portrait, ice swan, champagne tower, deco arch) · 242 Downtown with a free gift waiting: the gift box on the floor, no text · 243 right after the tap: the box is gone and its cash is paid (U7's
reward moment shows over it once U7 lands).
Saves are stamped from T0; every item is bought, so the shop shows all it has.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, wait_for, advance, hood_save, ...

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000, decor=DECOR)

THINGS = {
    "university": [("banner", ["bulletin-board", "bean-bag", "string-lights"]), ("lounge-counter", ["couch", "vending", "bike-rack"]), ("clock-tower", ["globe", "library-ladder", "telescope"])],
    "industrial": [("steel-shutter", ["pipe-run", "drums", "pegboard"]), ("chimney", ["flour-pallet", "gear-clock", "work-lamp"]), ("gantry", ["boiler", "conveyor", "anvil-table"])],
    "uptown": [("brass-door", ["velvet-rope", "orchid", "lectern"]), ("marble-counter", ["columns", "piano", "portrait"]), ("crown-sign", ["ice-swan", "champagne-tower", "deco-arch"])],
}


def reno_save(hood, level, **kw):
    """`hood` busy at renovation `level` with every decor item of the levels it has reached bought."""
    sv = hood_save(hood, cash=5e5, vehicle=1, **dict(BUSY, **kw))
    sv.update(lastSavedAt=T0_MS, rewards={"giftShownDay": day_str()})
    decor = [f"reno{l}-{hood}-{d}" for l in range(1, level + 1) for d in THINGS[hood][l - 1][1]]
    sv["renovation"] = {hood: {"level": level, "decor": decor}}
    return sv


def plaque(level):
    """The scene's text holds the plaque's numeral on a line of its own."""
    return r"(^|\n)" + "I" * level + r"(\n|$)"


def look(browser, save):
    page = seeded_page(browser, save)
    settle(page, 2.0)
    return page


def run(ctx):
    b = ctx.browser

    for n, hood, name in ((239, "university", "university-reno-3"), (240, "industrial", "industrial-reno-3"), (241, "uptown", "uptown-reno-3")):
        page = look(b, reno_save(hood, 3))
        expect_text(page, None, plaque(3))
        shot(page, f"{n}-{name}", 1.0)

    gift(b)


def gift(b):
    # 242: a free gift waits in Downtown (the slice says ready); the box stands on the floor and bobs, with no text
    sv = hood_save("downtown", cash=5e5, vehicle=1, **BUSY)
    sv.update(lastSavedAt=T0_MS, rewards={"giftShownDay": day_str()})
    sv["x"] = {"freeGift": {"nextAt": T0_MS, "count": 0, "ready": True}}
    page = look(b, sv)
    expect(page, "gift-box")
    shot(page, "242-gift-ready", 1.0)
    # 243: a tap on the box claims it: the box goes and the cash is paid
    tid(page, "gift-box").click()
    advance(page, 200)
    wait_for(page, "gift-box", gone=True)
    shot(page, "243-gift-claimed", 0.3)
