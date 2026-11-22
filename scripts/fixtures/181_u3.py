"""Shots 181-185 (v5.22, card U3): the shop report redrawn.

181 the strip: "Served 126/min · Missed 42/min" over a shop short on ovens · 182 its sheet: four basil bars, the dashed line at the customers a minute ·
183 the sheet of a shop short on drivers · 184 a balanced shop: every bar reaches the line, "Tips up" · 185 a heads-only shop whose ovens the player taps (the "You" bar).
Levels are chosen against vehicle 0 (a Downtown shop wants 0.25 pies/s per driver and 0.3 per seating level 1).
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}


def shop_save(cash=2000, **kw):
    """A Downtown save after the tutorial (the default seen scenes include downtown-4), the gift already shown."""
    base = dict(footprint=1, sold=4000, decor=DECOR)
    base.update(kw)
    sv = hood_save("downtown", cash=cash, vehicle=0, **base)
    sv.update(lastSavedAt=T0_MS)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def open_sheet(page):
    tid(page, "shop-report-strip").click()
    return expect(page, "report-sheet")


def run(ctx):
    b = ctx.browser

    # 181 / 182: the ovens are short: 126 of 168 a minute served; the ovens bar stops left of the dashed line, the others run past it
    page = seeded_page(b, shop_save(prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    expect_text(page, "shop-report-line", r"Served 126/min . Missed 42/min", 4000)
    shot(page, "181-report-strip", 0.4)
    open_sheet(page)
    expect(page, "report-bar-ovens")
    expect_text(page, "report-demand", r"Customers 168/min", 4000)
    shot(page, "182-report-short-ovens", 0.5)

    # 183: one driver: the Drivers bar is the short one (walk-ins make up the rest, so nothing is missed)
    page = seeded_page(b, shop_save(prep=10, ovens=10, counter=10, drivers=1, tables=1))
    settle(page, 2.0)
    open_sheet(page)
    expect_text(page, "report-demand", r"Customers 33/min", 4000)
    shot(page, "183-report-short-drivers", 0.5)

    # 184: a balanced shop: every bar reaches the line, nothing is missed, the tip is on
    page = seeded_page(b, shop_save(prep=8, ovens=8, counter=8, drivers=4, tables=4))
    settle(page, 2.0)
    open_sheet(page)
    expect_text(page, "report-service", r"Tips up", 4000)
    shot(page, "184-report-balanced", 0.5)

    # 185: prep and counter have heads, the ovens are tapped by hand: that bar says "You"
    page = seeded_page(b, shop_save(managed=False, heads={"prep": True, "oven": False, "counter": True}, prep=10, ovens=5, counter=10, drivers=10, tables=1))
    settle(page, 2.0)
    open_sheet(page)
    expect(page, "report-bar-ovens")
    shot(page, "185-report-you", 0.5)
