"""Shots 228-232 (v5.24, card S5): the looks art, part 2, and the set flourish.

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

    # 231: Downtown completes its Classic set on the Shop route (the last piece, 60 diamonds), and the flourish waits for the player's return: the scene was covered, so it starts on its
    # first visible frame and is mid-play 0.8 s later (3 s in all). The save already holds three pieces and no finished set, so only this purchase celebrates.
    sv = dict(MID_SAVE, saveVersion=10, tutorial=19, lastSavedAt=T0_MS, active="downtown", seenScenes=[])
    sv["shops"] = dict(sv["shops"], downtown=hood_save("downtown", **BUSY)["shops"]["downtown"])
    own = CLASSIC[:3]
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": 200, "lastSeen": now_ms - 60000, "cosmetics": own, "worn": own, "setsDone": []}
    page = seeded_page(b, sv)
    settle(page, 1.5)
    tid(page, "shop-chip").click()
    expect(page, "shop-tab-0")
    tid(page, "shop-tab-0").click()
    advance(page, 600)
    page.locator('[data-testid="vanity-apron-classic-button"]').first.evaluate("el => el.scrollIntoView({ block: 'center' })")
    advance(page, 400)
    tid(page, "vanity-apron-classic-button").click()
    advance(page, 1500)   # the Shop route stays on top for longer than the flourish lasts: nothing plays unseen
    expect(page, "vanity-done-set:classic")
    tid(page, "back").click()
    advance(page, 800)
    expect_text(page, None, r"Good, eh")
    shot(page, "231-downtown-set-flourish", 1.0)

    # 232: the Style tab at the Uptown set: the marble storefront's thumbnail (veins, gilt cap) beside the awning, linens and urn
    page = seeded_page(b, dict(MID_SAVE, saveVersion=10, tutorial=19, lastSavedAt=T0_MS, active="downtown", seenScenes=[],
                               rewards={"giftShownDay": day_str(), "diamonds": 200, "lastSeen": now_ms - 60000, "cosmetics": [], "worn": [], "setsDone": []}))
    settle(page, 1.5)
    tid(page, "shop-chip").click()
    expect(page, "shop-tab-0")
    tid(page, "shop-tab-0").click()
    advance(page, 600)
    page.locator('[data-testid="vanity-section-set:marble"]').first.evaluate("el => el.scrollIntoView({ block: 'start' })")
    advance(page, 500)
    expect(page, "vanity-facade-marble")
    shot(page, "232-style-tab-marble-thumbs", 0.5)
