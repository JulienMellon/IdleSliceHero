"""Shots 39-46: the visual ladder (a prop every ~10 levels), a milestone moment, the queues and the patio.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    for name, save in [
        ("39-ladder-lv10", hood_save("downtown", prep=10, ovens=10, counter=10, drivers=10, tables=6, footprint=0, sold=3000)),
        ("40-ladder-lv40", hood_save("downtown", vehicle=3, prep=40, ovens=40, counter=40, drivers=40, tables=12, footprint=1, grade=1, sold=9000)),
        ("41-ladder-lv120", hood_save("suburbs", cash=5e9, vehicle=3, prep=120, ovens=120, counter=120, drivers=120, tables=60, footprint=4, grade=3, sold=9e5)),
    ]:
        try:
            page = seeded_page(browser, save); settle(page)
            shot(page, name, 0.8)
        except Exception as e:
            report["errors"].append(f"{name} failed: {e}")
    try:
        page = seeded_page(browser, hood_save("downtown", cash=5e4, prep=24, ovens=30, counter=30, drivers=20, tables=6, footprint=1, sold=6000)); settle(page)
        page.locator('[data-testid="walk-prep"], [data-testid="mini-prep"]').first.click()
        shot(page, "42-milestone-moment", 0.15)
    except Exception as e:
        report["errors"].append(f"milestone shot failed: {e}")
    for name, save in [
        # kitchen slower than the seats: diners wait outside
        ("43-diner-queue", hood_save("downtown", prep=3, ovens=3, counter=3, drivers=3, tables=20, footprint=0, sold=2000)),
        # kitchen faster than the seats, drivers to spare: drivers wait by the door
        ("44-driver-queue", hood_save("downtown", prep=20, ovens=20, counter=20, drivers=12, tables=3, footprint=0, sold=4000)),
        # D428: the Hole-in-the-wall and the Corner shop (footprint 0 / 1) have no room for a patio set beside the prop, the chalkboard and the
        # vehicle, so the deck shots move up: the Double storefront seats one set (25 tables), the Restaurant two (37 tables)
        ("45-patio-one", hood_save("downtown", prep=10, ovens=10, counter=10, drivers=2, tables=25, footprint=2, sold=3000)),
        ("46-patio-two-busy", hood_save("downtown", prep=1, ovens=1, counter=1, drivers=4, tables=37, footprint=3, sold=1500)),
    ]:
        try:
            page = seeded_page(browser, save); settle(page)
            shot(page, name, 2.5)
        except Exception as e:
            report["errors"].append(f"{name} failed: {e}")
