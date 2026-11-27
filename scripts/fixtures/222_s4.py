"""Shots 222-226 (v5.24, card S4): the looks art, part 1.

222 Downtown in the Classic set (storefront, awning, menu board, aprons) · 223 the Suburbs in the Diner set (storefront, counter, table cloths, tip jar) ·
224 the Waterfront in the Dockside set (storefront, plank sign, tip jar, ship's bell) · 225 every generic small look at once in Downtown (chalkboard menu, checkered
aprons, gingham cloths, glass tip jar, bell, candy awning, red scooter) · 226 the other generic looks (striped aprons, linen cloths, brass tip jar, wind chime).
Saves are stamped from T0; each look is owned and worn, the daily gift already shown.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

# a mid-game GM shop: a full room (tables), a second counter worker, the cooks and the baker at their stations
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000,
            decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})


def dressed(hood, worn, vehicle=1, **kw):
    """A save in `hood` with these looks owned and worn."""
    sv = hood_save(hood, vehicle=vehicle, **dict(BUSY, **kw))
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str(), "cosmetics": list(worn), "worn": list(worn)}
    return sv


def look(browser, name, save, wait=1.0):
    page = seeded_page(browser, save)
    settle(page, 2.0)
    return page


def run(ctx):
    b = ctx.browser

    # 222: Downtown in the Classic set: cream plaster and green, a gold pinstripe, a cartouche sign, the green awning, the cream menu board, cream aprons
    page = look(b, "222", dressed("downtown", ["facade-classic", "awning-classic", "menu-classic", "apron-classic"]))
    expect_text(page, None, r"Menu")
    shot(page, "222-downtown-classic", 1.0)

    # 223: the Suburbs in the Diner set: mint tile, the red fascia and its checker band, a pill sign, the red counter with its chrome lip, cloths on the tables, the shake-glass jar
    page = look(b, "223", dressed("suburbs", ["facade-diner", "counter-diner", "tablecloth-diner", "tipjar-diner"]))
    shot(page, "223-suburbs-diner", 1.0)

    # 224: the Waterfront in the Dockside set: navy planks and rope, the plank sign with its anchor, the bottle tip jar, the ship's bell in the doorway
    page = look(b, "224", dressed("waterfront", ["facade-dockside", "sign-dockside", "tipjar-dockside", "chime-dockside"]))
    shot(page, "224-waterfront-dockside", 1.0)

    # 225: the generic looks, one per part, all at once in Downtown
    page = look(b, "225", dressed("downtown", ["menu-chalkboard", "apron-checkered", "tablecloth-gingham", "tipjar-glass", "chime-bell", "awning-candy", "scooter-red"]))
    shot(page, "225-generic-small-looks", 1.0)

    # 226: the other generic variants of the same parts
    page = look(b, "226", dressed("suburbs", ["apron-striped", "tablecloth-linen", "tipjar-brass", "chime-wind"]))
    shot(page, "226-generic-small-looks-b", 1.0)
