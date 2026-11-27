"""Shots 228-231 (v5.24, card S5): the looks art, part 2, and the set flourish.

228 University in the Dorm set (brick and ivy storefront with bunting, pennant sign, purple scooter, cork menu board, navy plaid cloths) · 229 Industrial in the Brick set
(soot brick and steel storefront with a rivet strip, plate sign, the riveted brick oven, hazard-hem leather aprons, the gear chime) · 230 Uptown in the Marble set
(white stone and gilt, engraved sign, black and ivory awning, ivory cloths, the urn tip jar) · 231 Downtown the moment its Classic set is complete: the diners cheer,
confetti bursts from the sign and Nonna says the set's line (mid-flourish, 1.2 s in). Saves are stamped from T0; each look is owned and worn, the daily gift already shown.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

# a mid-game GM shop: a full room (tables), a second counter worker, the cooks and the baker at their stations
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000,
            decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})

DORM = ["facade-dorm", "scooter-dorm", "menu-dorm", "tablecloth-dorm"]
BRICK = ["facade-brick", "oven-brick", "apron-brick", "chime-brick"]
MARBLE = ["facade-marble", "awning-marble", "tablecloth-marble", "tipjar-marble"]
CLASSIC = ["facade-classic", "awning-classic", "menu-classic", "apron-classic"]


def dressed(hood, worn, vehicle=1, sets_done=None, **kw):
    """A save in `hood` with these looks owned and worn (and, when given, the sets already done: `[{"set": ..., "at": ms}]`)."""
    sv = hood_save(hood, vehicle=vehicle, **dict(BUSY, **kw))
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str(), "cosmetics": list(worn), "worn": list(worn), "setsDone": list(sets_done or [])}
    return sv


def look(browser, save):
    page = seeded_page(browser, save)
    settle(page, 2.0)
    return page


def run(ctx):
    b = ctx.browser

    # 228: University in the Dorm set; a done set from an old save plays nothing (its entry is a week old)
    page = look(b, dressed("university", DORM, vehicle=1, sets_done=[{"set": "dorm", "at": T0_MS - 7 * 86400 * 1000}]))
    expect_text(page, None, r"MENU")
    shot(page, "228-university-dorm", 1.0)

    # 229: Industrial in the Brick set
    page = look(b, dressed("industrial", BRICK))
    shot(page, "229-industrial-brick", 1.0)

    # 230: Uptown in the Marble set
    page = look(b, dressed("uptown", MARBLE))
    shot(page, "230-uptown-marble", 1.0)

    # 231: Downtown completes its Classic set: the set is stamped a little after the session began, so the flourish starts on the scene's first visible frame and is mid-play 1.2 s later (3 s in all)
    page = seeded_page(b, dressed("downtown", CLASSIC, sets_done=[{"set": "classic", "at": T0_MS + 60_000}]))
    advance(page, 1200)
    expect_text(page, None, r"Good, eh")
    shot(page, "231-downtown-set-flourish", 1.0)
