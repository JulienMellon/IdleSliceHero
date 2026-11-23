"""Shots 211-216 (v5.23b, card S6): the scene's carried notes.

211 Suburbs at its widest footprint with the rival open: the whole MegaSlice shop on the far kerb, the room scaled to the screen (D481, D519) ·
212 Waterfront, one screen wide, the rival open: the shop whole above the screen's foot (D481) · 213 Industrial at its widest footprint (D519) ·
214 a shop short on drivers with a customer walking out: his body is above the report strip and clear of the idle drivers (D552) ·
215 a balanced shop: no dough stack (D557) · 216 a shop short on ovens beside it: the dough piles on its stand (D557).
Saves are stamped from T0.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

PLAY = 1000
DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}
SEEN = ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-3b", "waterfront-1", "waterfront-2", "waterfront-3"]


def rival_save(hood, footprint, seen=SEEN, **kw):
    """`hood` mid-game at `footprint` with beat 3 seen and the rival open."""
    base = dict(prep=30, ovens=30, counter=30, drivers=14, tables=30, grade=1, footprint=footprint, sold=20000, decor=DECOR)
    base.update(kw)
    sv = hood_save(hood, cash=5e5, **base)
    sv.update(lastSavedAt=T0_MS, playSeconds=PLAY, rewards={"giftShownDay": day_str()}, scrapbookViewed=12, x={})
    sv["seenScenes"] = list(seen)
    return sv


def kitchen_save(cash=2000, **kw):
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save("downtown", cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def run(ctx):
    b = ctx.browser

    # 211: the widest Suburbs shop, the rival open (it opens after beat 3): the room fits the screen or scrolls, and the MegaSlice shop is whole on the far kerb
    page = seeded_page(b, rival_save("suburbs", 4))
    settle(page, 2.0)
    expect(page, "rival-shop")
    shot(page, "211-wide-suburbs-rival", 0.5)

    # 212: Waterfront, one screen, the rival open
    page = seeded_page(b, rival_save("waterfront", 2))
    settle(page, 2.0)
    expect(page, "rival-shop")
    shot(page, "212-rival-waterfront", 0.5)

    # 213: the widest Industrial shop
    page = seeded_page(b, rival_save("industrial", 4, seen=SEEN + ["industrial-1", "industrial-2"]))
    settle(page, 2.0)
    shot(page, "213-wide-industrial", 0.5)

    # 214: one driver and a dining room that wants more: the line at the door gives up and a customer walks out (every 7 s, 3.5 s long)
    page = seeded_page(b, kitchen_save(prep=10, ovens=20, counter=20, drivers=1, tables=12))
    settle(page, 2.0)
    advance(page, 40000)
    expect(page, "pile-bags", 20000)
    advance(page, 1500)
    shot(page, "214-short-drivers-walkout", 0.0)

    # 215: every station level alike: no dough stack
    page = seeded_page(b, kitchen_save(prep=8, ovens=8, counter=8, drivers=4, tables=4))
    settle(page, 2.0)
    advance(page, 40000)
    shot(page, "215-balanced-no-stack", 0.5)

    # 216: one oven against twenty levels of prep and counter: the dough piles on its stand
    page = seeded_page(b, kitchen_save(prep=20, ovens=1, counter=20, drivers=10, tables=1))
    settle(page, 2.0)
    advance(page, 40000)
    expect(page, "pile-dough", 20000)
    shot(page, "216-short-ovens-pile", 0.5)
