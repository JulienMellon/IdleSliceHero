"""Shots 08-18 and 25: the late game (every neighbourhood, van fleet), the flagship, Uptown decorated, the tied-station drawer, the frugal path and the sold-sign scene.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    late, tied, frugal = LATE_SAVE, TIED_SAVE, FRUGAL_SAVE
    # 6. Late game: every neighborhood, van fleet
    # On-curve late state (costs ~ a few minutes of income); exactly one cut-scene (industrial-3) is due.
    late = dict(MID_SAVE, cash=1.5e6, vehicle=3, active="industrial", dronesUnlocked=False,
                shops={
                    "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5),
                    "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5),
                    "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=2, sold=4e5),
                    "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=2, sold=3e5),
                    "industrial": shop(prep=52, ovens=48, grade=3, counter=50, drivers=22, tables=34, footprint=2, sold=360500),
                    "uptown": shop(managed=False, sold=0),
                },
                seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:18] + ["uptown-1"], scrapbookViewed=19)
    page = seeded_page(browser, late); advance(page, 2500)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); advance(page, 800)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "cutscene").click(); shot(page, "08-late-cutscene", 0.8)
        tid(page, "skip-scene").click()
    settle(page, 0.3)
    shot(page, "09-late-game", 1.2)
    # D361: land these just after a pickup, so the pop riding the carrier is in the frame
    def pop_on_screen(timeout=7000):
        until(page, lambda: page.evaluate("() => [...document.querySelectorAll('text')].some((t) => (t.textContent || '').includes('+$'))"), timeout)
    pop_on_screen(); shot(page, "10-late-game-pops-a", 0.15)
    advance(page, 1500); pop_on_screen(); shot(page, "11-late-game-pops-b", 0.15)
    try:
        for _ in range(3):
            tap_shop(page); advance(page, 150)
        shot(page, "12-late-rush-tap", 0.2)
    except Exception as e:
        report["errors"].append(f"late oven tap failed: {e}")
    # v5.0: every neighbourhood's own look (the critic had no Suburbs or University interior)
    try:
        for hood in ["suburbs", "university", "downtown"]:
            tid(page, f"tab-{hood}").click(force=True); advance(page, 1000)
            settle(page, 0.3)
            shot(page, f"25-look-{hood}", 0.6)
    except Exception as e:
        report["errors"].append(f"neighbourhood look shots failed: {e}")
    # 7. Flagship pizzeria with maxed Expand and Oven Grade
    flag = dict(late, active="industrial", cash=2.0e8, seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:19] + ["uptown-1"], scrapbookViewed=20,
                shops=dict(late["shops"], industrial=shop(prep=104, ovens=100, grade=4, counter=104, drivers=44, tables=90, footprint=4, sold=450000,
                           decor={"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3})))
    page = seeded_page(browser, flag); settle(page)
    shot(page, "13-flagship-max", 1.2)
    # 8. Uptown, fully decorated, with tier-3 signage
    up = dict(flag, active="uptown", shops=dict(flag["shops"], uptown=shop(perk=True, prep=40, ovens=36, grade=2, counter=38, drivers=18, tables=30, footprint=2, sold=9e4,
              decor={"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3})))
    page = seeded_page(browser, up); settle(page)
    shot(page, "14-uptown-decorated", 1.2)
    # 9. A station tag opens the drawer focused on that station
    try:
        tid(page, "open-upgrades").click(); shot(page, "15-uptown-drawer", 0.6)
        page.mouse.wheel(0, 1400); shot(page, "15a-uptown-decor-section", 0.6)
    except Exception as e:
        report["errors"].append(f"uptown drawer failed: {e}")

    # 10. Playtest fixes the earlier shots could not show
    # 10a. Tied stations: the drawer explains what to buy together
    tied = dict(MID_SAVE, cash=500, active="downtown", scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], downtown=shop(prep=6, ovens=8, counter=20, drivers=30, tables=4)))
    page = seeded_page(browser, tied); settle(page)
    try:
        tid(page, "open-upgrades").click(); shot(page, "16-tied-bundle-drawer", 0.7)
    except Exception as e:
        report["errors"].append(f"tied drawer failed: {e}")
    # 10b. Frugal path: Suburbs stays locked until Nonna takes over, with a countdown toast on the City screen
    frugal = dict(MID_SAVE, cash=1000, vehicle=0, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                  shops={"downtown": shop(managed=False, prep=3, ovens=3, counter=3, drivers=3, sold=40), "suburbs": shop(built=False, managed=False),
                         "waterfront": shop(built=False, managed=False), "university": shop(built=False, managed=False),
                         "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False)})
    page = seeded_page(browser, frugal); settle(page)
    try:
        tid(page, "open-city").click(); advance(page, 600)
        tid(page, "city-row-suburbs").click(force=True); shot(page, "17-suburbs-locked", 0.4)
    except Exception as e:
        report["errors"].append(f"suburbs lock shot failed: {e}")
    # 10c. Cut-scene props: the Pier 9 sold sign and Nonna's recipe card
    pier = dict(MID_SAVE, active="waterfront", seenScenes=["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-4", "waterfront-1", "waterfront-2"],
                shops=dict(MID_SAVE["shops"], waterfront=shop(prep=20, ovens=18, counter=20, drivers=12, sold=15100)))
    page = seeded_page(browser, pier); advance(page, 3000)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); advance(page, 800)
    if page.locator('[data-testid="cutscene"]').count():
        shot(page, "18-sold-sign-scene", 0.6)
