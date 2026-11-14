"""Shots 130-137 (v5.16, card P1): the shop report, and upgrades the player chooses.

130 a manager's shop humming: tip on, the manager's line · 131 ovens Slammed, money walking out · 132 floor Quiet ·
133 the cold line after a minute under 60% · 134 the sheet open · 135 sidewalk cards after the tutorial: effect lines, no frame, "Buy both" ·
136 a tutorial shop that still shows the frame · 137 a heads-only shop whose Slammed head asks for help.
Levels are chosen against vehicle 0 (a Downtown shop wants 0.25 pies/s per driver and 0.3 per seating level 1).
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

HEADS = {"prep": True, "oven": True, "counter": True}
DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}


def shop_save(hood="downtown", cash=2000, **kw):
    """A save in `hood`, after the tutorial (the default seen scenes include downtown-4), the gift already shown."""
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save(hood, cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def run(ctx):
    b = ctx.browser

    # 130: a kitchen with room to spare and a manager: service 100%, customers tip, Nonna says so
    page = seeded_page(b, shop_save(prep=10, ovens=10, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    expect_text(page, "shop-report-line", r"tip", 4000)
    shot(page, "130-report-tipping", 0.4)

    # 131: the ovens are the limit: 75% served, the Slammed lamp, and the money walking out
    page = seeded_page(b, shop_save(prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    expect_text(page, "shop-report-line", r"of \d+", 4000)
    shot(page, "131-report-slammed", 0.4)

    # 132: the floor is Quiet: the kitchen could make far more than comes in
    page = seeded_page(b, shop_save(prep=10, ovens=10, counter=10, drivers=1, tables=1))
    settle(page, 2.0)
    expect_text(page, "shop-report-line", r"hungry|could|bake", 4000)
    shot(page, "132-report-quiet", 0.4)

    # 133: under 60% served for a minute of play: the line goes cold (-10%)
    page = seeded_page(b, shop_save(prep=5, ovens=5, counter=5, drivers=10, tables=10))
    settle(page, 2.0)
    advance(page, 66000)
    expect_text(page, "shop-report-line", r"[Cc]old", 4000)
    shot(page, "133-report-cold", 0.4)

    # 134: the sheet: each station's rate and load, the floor, service, three ways to fix it
    page = seeded_page(b, shop_save(prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    tid(page, "shop-report-strip").click()
    expect(page, "report-sheet")
    shot(page, "134-report-sheet", 0.4)

    # 135: after the tutorial the cards say what they do: no red frame, effect lines, and "Buy both" stays (prep and ovens tied)
    page = seeded_page(b, shop_save(cash=1e6, prep=6, ovens=8, counter=5, drivers=25, tables=1))
    settle(page, 2.0)
    shot(page, "135-cards-effect-lines", 0.4)

    # 136: a tutorial shop (Nonna has not taken over): the bottleneck card keeps its frame
    sv = shop_save(cash=1e6, managed=False, prep=20, ovens=20, counter=20, drivers=1, tables=1)
    sv["seenScenes"] = ["downtown-1", "downtown-2", "downtown-3"]
    page = seeded_page(b, sv)
    settle(page, 2.0)
    shot(page, "136-tutorial-frame", 0.4)

    # 137: three heads and no manager, ovens Slammed for 20 s: the strip, and the oven head's bubble once the scene asks for it
    page = seeded_page(b, shop_save("suburbs", cash=2000, managed=False, heads=HEADS, prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    advance(page, 26000)
    shot(page, "137-heads-slammed", 0.4)
