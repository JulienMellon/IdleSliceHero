"""Shots 233-238 (v5.25, card S6): renovation art for Downtown, Suburbs and Waterfront.

233 Downtown at renovation I (plaque I, the striped scalloped awning, the espresso machine, wine rack and chalkboard) · 234 Downtown at II (the oven arch, pendant lamps, Vespa,
herb box) · 235 Downtown at III with all nine decor items (gold sign, chandelier, medallion, bust) · 236 Suburbs at III (roof pylon, neon OPEN, chrome counter, jukebox, stools, pie case,
booth, pennants, gumball, Cadillac, trophy case, popcorn cart) · 237 Waterfront at III (rope rail, plank deck, beacon, crates, life ring, anchor, net, rowboat, lantern post, helm, mast, barrel
table) · 238 the first serves of a new game pop "+$N" over the counter (whole dollars).
Saves are stamped from T0; every item is bought, so the shop shows all it has.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000, decor=DECOR)

THINGS = {
    "downtown": [("awning", ["espresso", "wine-rack", "chalkboard"]), ("oven-arch", ["pendant-lamps", "vespa", "herb-box"]), ("gold-sign", ["chandelier", "medallion", "bust"])],
    "suburbs": [("neon-open", ["jukebox", "stools", "pie-case"]), ("chrome-counter", ["booth", "pennants", "gumball"]), ("roof-sign", ["cadillac", "trophy-case", "popcorn-cart"])],
    "waterfront": [("rope-rail", ["crates", "life-ring", "anchor"]), ("plank-deck", ["net-buoys", "rowboat", "lantern-post"]), ("beacon", ["helm", "mast", "barrel-table"])],
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

    for n, level, name in ((233, 1, "downtown-reno-1"), (234, 2, "downtown-reno-2"), (235, 3, "downtown-reno-3")):
        page = look(b, reno_save("downtown", level))
        expect_text(page, None, plaque(level))
        shot(page, f"{n}-{name}", 1.0)

    page = look(b, reno_save("suburbs", 3))
    expect_text(page, None, plaque(3))
    expect_text(page, None, r"OPEN")
    shot(page, "236-suburbs-reno-3", 1.0)

    page = look(b, reno_save("waterfront", 3))
    expect_text(page, None, plaque(3))
    shot(page, "237-waterfront-reno-3", 1.0)

    # 238: a new game's first serves pop "+$N" over the counter, in whole dollars: an unmanaged first shop, tutorial done, tapped through prep, oven and counter
    sv = hood_save("downtown", cash=0, vehicle=0, managed=False, prep=1, ovens=1, counter=1, drivers=1, tables=1, footprint=0, sold=0)
    sv.update(lastSavedAt=T0_MS, rewards={"giftShownDay": day_str()})
    page = seeded_page(b, sv)
    settle(page, 1.0)
    for i in range(12):
        for st in ("prep", "oven", "counter"):
            tap_station(page, st)
            advance(page, 400)
    expect_text(page, None, r"\+\$\d+(?![\d.])")
    shot(page, "238-first-serve-pop", 1.0)
