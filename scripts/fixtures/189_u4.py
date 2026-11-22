"""Shots 189-191 (v5.22, card U4): every upgrade card says what the station can handle, now and after the buy. Nothing ranks, tints or bundles.

189 the sidewalk of a shop short on ovens: "446→486"-style foot lines (the full "n/min → m" where the card is wide enough) on all four cards, the ovens card the same look as the others ·
190 the drawer of the same shop: the same lines in each station's detail, the header is the shop's title and the report line · 191 a balanced shop (the stations tied): four plain cards, no "Buy both".
Levels are U3's (Downtown, vehicle 0: a driver carries 0.25 pies/s and a seating level 0.3).
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}
# the foot narrows with the card: "446/min → 486", "446/m → 486", "446 → 486" or "446→486"
FOOT = r"\d[\d.,KM]*(/m(in)?)?\s*\u2192\s*\d"


def shop_save(cash=2000, **kw):
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save("downtown", cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def run(ctx):
    b = ctx.browser

    # 189 / 190: the ovens are short; their card reads like the others, only its numbers are smaller
    page = seeded_page(b, shop_save(prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    for k in ("prep", "ovens", "counter", "drivers"):
        expect_text(page, f"walk-{k}", FOOT, 4000)
    shot(page, "189-sidewalk-short-ovens", 0.8)
    tid(page, "open-upgrades").click()
    expect(page, "buy-ovens")
    expect_text(page, "buy-ovens", r"\$", 4000)
    shot(page, "190-drawer-short-ovens", 0.7)

    # 191: every station level alike: four plain cards, no bundle
    page = seeded_page(b, shop_save(prep=8, ovens=8, counter=8, drivers=4, tables=4))
    settle(page, 2.0)
    for k in ("prep", "ovens", "counter", "drivers"):
        expect_text(page, f"walk-{k}", FOOT, 4000)
    shot(page, "191-sidewalk-balanced", 0.8)
