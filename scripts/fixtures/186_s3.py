"""Shots 186-188 (v5.22, card S3): the shop shows its state. Nothing is coloured and nothing says what to buy; the piles, the workers and the line do.

186 a shop short on ovens: rolled dough piles on the pass between the bench and the ovens, the counter's cashier leans, idle · 187 short on drivers: bags pile on the
pickup shelf (the idle drivers sit on their scooters, and the pill only counts them, whenever some wait) · 188 short on the counter: boxed pies pile on the counter, the cooks and bakers hurry.
Levels are E3's (Downtown, vehicle 0: a driver carries 0.25 pies/s and a seating level 0.3; see features/__tests__/service.test.ts OVENS_SHORT); the page's clock runs 40 s so the piles and the symptoms have built up.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}


def shop_save(cash=2000, **kw):
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save("downtown", cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def run(ctx):
    b = ctx.browser

    # 186: one oven against twenty levels of prep and counter: the dough waits for it, the cashiers lean with a Z over their heads
    page = seeded_page(b, shop_save(prep=20, ovens=1, counter=20, drivers=10, tables=1))
    settle(page, 2.0)
    advance(page, 40000)
    expect(page, "pile-dough", 20000)
    shot(page, "186-state-short-ovens", 0.5)

    # 187: one driver and a dining room that wants more than he can carry: the bags wait on the pickup shelf
    page = seeded_page(b, shop_save(prep=10, ovens=20, counter=20, drivers=1, tables=12))
    settle(page, 2.0)
    advance(page, 40000)
    expect(page, "pile-bags", 20000)
    shot(page, "187-state-short-drivers", 0.5)

    # 188: a counter at level 1: the baked pies wait to be boxed, the bakers hurry and sweat
    page = seeded_page(b, shop_save(prep=20, ovens=20, counter=1, drivers=10, tables=1))
    settle(page, 2.0)
    advance(page, 40000)
    expect(page, "pile-boxes", 20000)
    shot(page, "188-state-short-counter", 0.5)
