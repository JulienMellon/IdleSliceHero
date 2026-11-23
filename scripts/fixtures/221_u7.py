"""Card U7 (v5.23b): shop-surface minors. Shots 221-221b.

221   the City screen with an unmanaged shop: its "no manager" is ink, not tomato (D553), the map halo is on the shop being visited alone, and University's lot
      reads "Opens after Ch 8" on the map (D540)
221b  a balanced shop, Missed at 0 for 10 s (the page has run about 2 s of it by the time the fixture looks): shot 200 ms into the payoff, the strip's basil flash at its peak over Nonna's line and the crew cheering (D556); the numbers are back 4 s later
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, hood_save, report, ...)

DECOR = {"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}


def run(ctx):
    try:
        sv = dict(MID_SAVE, saveVersion=8, cash=5e6, totalEarned=5e6, vehicle=2, active="waterfront", scrapbookViewed=9,
                  lastSavedAt=T0_MS, playSeconds=900, rewards={"giftShownDay": day_str()})
        sv["shops"] = dict(sv["shops"], suburbs=dict(sv["shops"]["suburbs"], managed=False))
        page = seeded_page(ctx.browser, sv); settle(page, 0.5)
        tid(page, "open-city").click(); advance(page, 800)
        expect_text(page, "city-row-suburbs", r"no manager", 3000)
        expect_text(page, "city-row-university", r"Finish Chapter 8 first", 3000)
        shot(page, "221-city-no-manager", 0.5)
    except Exception as e:
        report["errors"].append(f"U7 221 failed: {e}")

    try:
        sv = hood_save("downtown", cash=2000, vehicle=0, footprint=1, sold=4000, decor=DECOR, prep=8, ovens=8, counter=8, drivers=4, tables=4)
        sv.update(lastSavedAt=T0_MS)
        sv["rewards"] = {"giftShownDay": day_str()}
        page = seeded_page(ctx.browser, sv); settle(page, 2.0)
        expect_text(page, "shop-report-line", r"Missed 0/min", 4000)
        advance(page, 7000)
        # step 100 ms at a time until the payoff's line is up, then 200 ms more: the flash is at its peak (it runs 0.6 s, peak at a third) and the crew's arms are up
        until(page, lambda: "Not one missed" in tid(page, "shop-report-line").inner_text(), timeout=4000, step=100)
        advance(page, 200)
        expect_text(page, "shop-report-line", r"Not one missed", 1000)
        shot(page, "221b-missed-zero", 0.0)
        advance(page, 1000)
        advance(page, 4000)
        expect_text(page, "shop-report-line", r"Missed 0/min", 3000)
    except Exception as e:
        report["errors"].append(f"U7 221b failed: {e}")
