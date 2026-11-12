"""Run the exported web build in headless Chromium at iPhone size and capture key screens.

Usage: python3 scripts/screenshots.py <version>   (expects `npx expo export --platform web` output in dist/)
Writes screenshots/<version>/*.png and screenshots/<version>/report.json (console errors, load status).
"""
import time  # noqa: F401  (kept for the shots below)
from shots_lib import *  # noqa: F401,F403  (helpers, saves, the shared report and the server)
from shots_lib import httpd  # noqa: F401

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script(AUDIO_PROBE)
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    page.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))

    # 1. Fresh install → opening cut-scene
    page.goto(URL)
    # v5.1: the title card after the native splash
    try:
        tid(page, "title-card").wait_for(timeout=15000)
        shot(page, "00-title-card", 0.9)
    except Exception as e:
        report["errors"].append(f"title card never appeared: {e}")
    skip_title(page, 2000)
    try:
        tid(page, "cutscene").wait_for(timeout=15000)
        report["loaded"] = True
    except Exception as e:
        report["errors"].append(f"cut-scene never appeared on first launch: {e}")
    shot(page, "01-opening-cutscene", 1.0)
    try:
        tid(page, "cutscene").click(); tid(page, "cutscene").click()
        shot(page, "02-cutscene-dialog", 0.8)
        audio_log(page, "opening")
        tid(page, "skip-scene").click()
    except Exception as e:
        report["errors"].append(f"could not skip cut-scene: {e}")

    # 2. Fresh game screen; fill the tap queue and tap once more (should say "Kitchen full!")
    shot(page, "03-new-game")
    try:
        # v4.8: tap the prep table, then again while it's prepping (refused with its reason)
        tap_station(page, "prep"); time.sleep(0.3)
        tap_station(page, "prep")
        shot(page, "03b-full-queue-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"full-queue tap failed: {e}")
    try:
        # v4.7: three taps per batch (prep → oven → counter), each stage takes a few seconds
        for i in range(70):
            tap_station(page, ["counter", "oven", "prep"][i % 3]); time.sleep(0.3)
            if i % 4 == 3:
                for b in ["walk-drivers", "walk-ovens"]:
                    tid(page, b).click()
            if page.locator('[data-testid="skip-scene"]').count():
                tid(page, "skip-scene").click()
        shot(page, "04-after-20s-play")
        cash = tid(page, "cash").inner_text()
        report["cash_after_play"] = cash
        if cash.strip() in ("$0", ""):
            report["errors"].append("cash still $0 after 20s of tapping — core loop broken")
    except Exception as e:
        report["errors"].append(f"core loop interaction failed: {e}")

    # 3. Mid-game save → main screen with drivers on routes
    page = seeded_page(browser, MID_SAVE); settle(page)
    shot(page, "05-mid-game", 1.2)

    # 3a. The full upgrades sheet (tap "All")
    try:
        tid(page, "open-upgrades").click(); shot(page, "05a-upgrades-sheet", 0.6)
        page.mouse.wheel(0, 900); time.sleep(0.4)
        page.locator('[data-testid="decor-plants"]').first.scroll_into_view_if_needed()
        shot(page, "05a2-decor-section", 0.4)
        tid(page, "close-upgrades").click()
    except Exception as e:
        report["errors"].append(f"upgrades sheet failed: {e}")

    # 3b. An unmanaged pizzeria (Waterfront) via its tab, then the City overview
    try:
        tid(page, "tab-waterfront").click(); shot(page, "05b-unmanaged-shop", 0.8)
        # the head cards and the GM's lock in a shop with no manager (D342)
        tid(page, "open-upgrades").click(); shot(page, "05b2-heads-drawer", 0.6)
        tid(page, "close-upgrades").click()
        # station taps: prep, then the oven while it's still prepping (refused, with the reason)
        tap_station(page, "prep"); shot(page, "05b3-prep-ring", 1.2)
        tap_station(page, "oven"); shot(page, "05b4-refused-tap", 0.2)
        # hire Finn from the sidewalk: his hello bubble over the prep badge, his face on the badge (D349)
        time.sleep(1.4)
        tid(page, "walk-manager").click(); shot(page, "05b5-hire-bubble", 0.5)
        # D376: an Ovens buy shows "+N% faster" rising from the oven's badge
        time.sleep(2.6)
        tid(page, "mini-ovens").click(); shot(page, "05b6-upgrade-flash", 0.25)
        tid(page, "open-city").click(); shot(page, "05c-city", 0.8)
        tid(page, "back").click()
    except Exception as e:
        report["errors"].append(f"tab/city navigation failed: {e}")

    # 4. Scrapbook
    try:
        tid(page, "open-scrapbook").click(); shot(page, "06-scrapbook", 1.0)
        tid(page, "back").click()
    except Exception as e:
        report["errors"].append(f"scrapbook navigation failed: {e}")

    # 5. Offline popup (away 2h)
    away = dict(MID_SAVE, lastSavedAt=now_ms - 2 * 3600 * 1000)
    page = seeded_page(browser, away)
    try:
        tid(page, "collect-offline").wait_for(timeout=8000)
    except Exception as e:
        report["errors"].append(f"offline popup missing: {e}")
    shot(page, "07-offline-popup", 0.8)
    audio_log(page, "offline")

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
    page = seeded_page(browser, late); time.sleep(2.5)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(0.8)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "cutscene").click(); shot(page, "08-late-cutscene", 0.8)
        tid(page, "skip-scene").click()
    settle(page, 0.3)
    shot(page, "09-late-game", 1.2)
    # D361: land these just after a pickup, so the pop riding the carrier is in the frame
    def pop_on_screen(timeout=7000):
        try:
            page.wait_for_function("() => [...document.querySelectorAll('text')].some((t) => (t.textContent || '').includes('+$'))", timeout=timeout)
        except Exception:
            pass
    pop_on_screen(); shot(page, "10-late-game-pops-a", 0.15)
    time.sleep(1.5); pop_on_screen(); shot(page, "11-late-game-pops-b", 0.15)
    try:
        for _ in range(3):
            tap_shop(page); time.sleep(0.15)
        shot(page, "12-late-rush-tap", 0.2)
    except Exception as e:
        report["errors"].append(f"late oven tap failed: {e}")
    # v5.0: every neighbourhood's own look (the critic had no Suburbs or University interior)
    try:
        for hood in ["suburbs", "university", "downtown"]:
            tid(page, f"tab-{hood}").click(force=True); time.sleep(1.0)
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
        tid(page, "open-city").click(); time.sleep(0.6)
        tid(page, "city-row-suburbs").click(force=True); shot(page, "17-suburbs-locked", 0.4)
    except Exception as e:
        report["errors"].append(f"suburbs lock shot failed: {e}")
    # 10c. Cut-scene props: the Pier 9 sold sign and Nonna's recipe card
    pier = dict(MID_SAVE, active="waterfront", seenScenes=["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-4", "waterfront-1", "waterfront-2"],
                shops=dict(MID_SAVE["shops"], waterfront=shop(prep=20, ovens=18, counter=20, drivers=12, sold=15100)))
    page = seeded_page(browser, pier); time.sleep(3)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(0.8)
    if page.locator('[data-testid="cutscene"]').count():
        shot(page, "18-sold-sign-scene", 0.6)
    sauce = dict(MID_SAVE, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                 shops=dict(MID_SAVE["shops"], downtown=shop(managed=False, prep=20, ovens=18, counter=20, drivers=12, sold=160), suburbs=shop(built=False, managed=False), waterfront=shop(built=False, managed=False)))
    page = seeded_page(browser, sauce); time.sleep(3)
    try:
        for _ in range(14):
            if page.get_by_text("secret sauce recipe").count():
                break
            tid(page, "cutscene").click(); time.sleep(1.3)
        shot(page, "19-recipe-card-scene", 0.5)
        audio_log(page, "recipe")
    except Exception as e:
        report["errors"].append(f"recipe card scene failed: {e}")
    # 10d. Away longer than the offline cap: the popup says so
    page = seeded_page(browser, dict(MID_SAVE, lastSavedAt=now_ms - 9 * 3600 * 1000))
    try:
        tid(page, "collect-offline").wait_for(timeout=8000)
        shot(page, "20-offline-capped", 0.8)
    except Exception as e:
        report["errors"].append(f"capped offline popup missing: {e}")

    # 11. v3.7: the Pier 9 bid leads the goal bar, and a finale shows its neighbourhood perk
    bid = dict(MID_SAVE, cash=1.2e6, active="waterfront", scrapbookViewed=10,
               seenScenes=MID_SAVE["seenScenes"] + ["suburbs-4", "waterfront-2", "waterfront-3"],
               shops=dict(MID_SAVE["shops"], waterfront=shop(prep=30, ovens=28, grade=1, counter=30, drivers=14, tables=12, footprint=1, sold=52000)))
    page = seeded_page(browser, bid); settle(page)
    shot(page, "21-pier9-bid-goal", 0.8)
    dale = dict(MID_SAVE, active="suburbs", seenScenes=MID_SAVE["seenScenes"], scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], suburbs=shop(prep=30, ovens=28, grade=1, counter=30, drivers=14, tables=20, footprint=1, sold=8100)))
    page = seeded_page(browser, dale); time.sleep(3)
    if page.locator('[data-testid="collect-offline"]').count():
        tid(page, "collect-offline").click(); time.sleep(1.0)
    try:
        for _ in range(20):
            if page.get_by_text("PERK", exact=False).count():
                break
            tid(page, "cutscene").click(); time.sleep(1.3)
        shot(page, "22-dale-perk-card", 0.6)
    except Exception as e:
        report["errors"].append(f"perk card shot failed: {e}")

    # 12. v3.8: an earned perk shows as a banner in that shop's drawer (D308)
    perked = dict(MID_SAVE, active="suburbs", scrapbookViewed=9, seenScenes=MID_SAVE["seenScenes"] + ["suburbs-4"],
                  shops=dict(MID_SAVE["shops"], suburbs=dict(MID_SAVE["shops"]["suburbs"], perk=True, sold=8200)))
    page = seeded_page(browser, perked); settle(page)
    try:
        tid(page, "open-upgrades").click(); shot(page, "23-perk-banner-drawer", 0.7)
    except Exception as e:
        report["errors"].append(f"perk banner shot failed: {e}")
    # 13. v4.4: Settings has Music and Sound toggles (AU24); the probe shows what a short session played
    try:
        page.keyboard.press("Escape"); time.sleep(0.3)
        page = seeded_page(browser, perked); settle(page)
        for _ in range(6):
            tap_shop(page); time.sleep(0.25)
        settle(page, 0.5)  # a story beat may have come due during the taps
        tid(page, "tab-downtown").click(); time.sleep(1.0)
        settle(page, 0.3)
        audio_log(page, "session")
        tid(page, "open-city").click(); time.sleep(0.6)
        tid(page, "open-settings").click(); time.sleep(0.6)
        tid(page, "toggle-music").click()
        shot(page, "24-settings-audio", 0.5)
    except Exception as e:
        report["errors"].append(f"settings audio shot failed: {e}")

    # 14. v5.4: daily/weekly tasks and the gift calendar, from a save that looks mid-week
    monday = (datetime.datetime.now() - datetime.timedelta(days=datetime.datetime.now().weekday())).strftime("%Y-%m-%d")
    stats = {"upgrades": 14, "ovens": 5, "hires": 1, "builds": 0, "fleet": 0, "decor": 2, "walkins": 90, "deliveries": 130, "baked": 210, "offline": 1, "boosters": 0, "dailyDone": 9, "days": 3}
    def rewarded(last, streak, diamonds=42, shown=None, generate=False):
        """A rewards-unlocked save. With `generate`, the daily and weekly sets are left empty (day = week = ''), so the game rolls
        them itself on load: the on-screen targets are exactly what the generator makes for this save (D389)."""
        r = {
            "day": "" if generate else day_str(), "daily": [], "points": 40, "chests": [False, False, False], "rerollUsed": False,
            "week": "" if generate else monday, "weekly": [], "weeklyChest": False,
            "gift": {"streak": streak, "last": last, "saveUsed": False, "cycle": 0}, "giftShownDay": shown or "",
            "diamonds": diamonds, "boosters": [{"mult": 2, "seconds": 900}, {"mult": 2, "seconds": 1800}],
            "boosts": [{"mult": 2, "until": now_ms + 14 * 60 * 1000 + 5000, "source": "booster"}],
            "cosmetics": ["oven-woodfired"], "lastSeen": now_ms - 60000}
        return dict(MID_SAVE, saveVersion=5, stats=stats, lastSavedAt=int(time.time() * 1000), totalEarned=15000, rewards=r)
    try:
        page = played_page(browser, rewarded(day_str(), 3, generate=True))
        shot(page, "29-hud-rewards", 0.8)
        tid(page, "open-tasks").click(); shot(page, "30-tasks-daily", 0.8)
        page.locator('[data-testid="chest-0"]').first.scroll_into_view_if_needed(); shot(page, "30b-tasks-daily-chests", 0.5)
        tid(page, "tab-weekly").click(); page.locator('[data-testid$="claim-weekly-0"]').first.scroll_into_view_if_needed(); shot(page, "31-tasks-weekly", 0.6)
        page.locator('[data-testid="weekly-chest"]').first.scroll_into_view_if_needed(); shot(page, "31b-tasks-weekly-chest", 0.5)
    except Exception as e:
        report["errors"].append(f"tasks shots failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-1), 6))
        tid(page, "gift-calendar").wait_for(timeout=8000)
        shot(page, "32-gift-calendar", 1.0)
    except Exception as e:
        report["errors"].append(f"gift calendar shot failed: {e}")
    try:
        page = seeded_page(browser, rewarded(day_str(-2), 6, diamonds=25))
        tid(page, "gift-calendar").wait_for(timeout=8000)
        shot(page, "33-gift-streak-save", 1.0)
    except Exception as e:
        report["errors"].append(f"gift streak-save shot failed: {e}")

    # 15. v5.10 (playthrough review): EXPAND at the cap, Buy both on the sidewalk, visible rush, the GM hire, the locked build
    try:
        capped = dict(MID_SAVE, cash=2000, active="downtown", scrapbookViewed=8,
                      shops=dict(MID_SAVE["shops"], downtown=shop(prep=25, ovens=25, counter=25, drivers=30, tables=10, footprint=0, sold=5000)))
        page = seeded_page(browser, capped); settle(page)
        shot(page, "34-sidewalk-expand", 0.8)
    except Exception as e:
        report["errors"].append(f"sidewalk expand shot failed: {e}")
    try:
        page = seeded_page(browser, tied); settle(page)
        shot(page, "35-sidewalk-bundle", 0.8)
    except Exception as e:
        report["errors"].append(f"sidewalk bundle shot failed: {e}")
    try:
        # a kitchen-bound shop (drivers to spare), so the combo shows a real boost; quick taps (≥ 2/s is a combo)
        rushy = dict(late, shops=dict(late["shops"], industrial=dict(late["shops"]["industrial"], drivers=40)))
        page = seeded_page(browser, rushy); settle(page)
        for _ in range(8):
            tap_shop(page); time.sleep(0.05)
        shot(page, "36-rush-combo", 0.05)
    except Exception as e:
        report["errors"].append(f"rush combo shot failed: {e}")
    try:
        gm = dict(MID_SAVE, cash=60000, active="waterfront", scrapbookViewed=8,
                  shops=dict(MID_SAVE["shops"], waterfront=dict(shop(managed=False, prep=18, ovens=16, counter=18, drivers=10, tables=8, footprint=1, sold=9000),
                                                                heads={"prep": True, "oven": True, "counter": True})))
        page = seeded_page(browser, gm); settle(page)
        shot(page, "37-gm-hire-sidewalk", 0.8)
    except Exception as e:
        report["errors"].append(f"gm hire shot failed: {e}")
    try:
        page = seeded_page(browser, dict(frugal, cash=5000)); settle(page)
        shot(page, "38-suburbs-locked-goal", 0.8)
    except Exception as e:
        report["errors"].append(f"locked goal shot failed: {e}")

    # 16. v5.11: the visual ladder (a prop every ~10 levels), a milestone moment, the queues and the patio
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

    # 17. v5.13 session hooks: the golden pizza (47) and the special orders (48-50). The save carries each state, so nothing waits
    # for real minutes: `bonus.until` puts a golden pizza in the sky (its flight is 12 s, so these shots skip settle()'s long waits),
    # `order.offer` / `order.active` put the chip in its offer / mid-progress faces, and an order one pie short of done finishes
    # a second after load, so 50 waits for the "done" line and shoots while it flashes (2.5 s). Every save is stamped "now"
    # (no time away, so nothing fails or expires on load) and the daily gift is marked shown (it would cover the scene).
    try:
        page = seeded_page(browser, hooks_save(bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 2}))
        quiet_start(page)
        tid(page, "golden-pizza").wait_for(timeout=8000)
        shot(page, "47-golden-pizza", 0.2)
    except Exception as e:
        report["errors"].append(f"golden pizza shot failed: {e}")
    try:
        # D445: the very first golden pizza (number 1, no tap yet) carries Nonna's "A gift, caro. Tap it!"
        page = seeded_page(browser, hooks_save(bonus={"spawned": 1, "until": HOOK_PLAY + 12}, stats={"bonusTaps": 0}))
        quiet_start(page)
        tid(page, "golden-gift").wait_for(timeout=8000)
        shot(page, "47a-golden-gift", 0.15)
    except Exception as e:
        report["errors"].append(f"golden gift shot failed: {e}")
    try:
        # the lucky slice: four taps made, so this is the 5th; tap it for the pop, the ten coins and the full-width banner
        page = seeded_page(browser, hooks_save(bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 4}))
        quiet_start(page)
        tid(page, "golden-pizza").wait_for(timeout=8000)
        shot(page, "47b-golden-lucky", 0.15)
        # the pizza is flying (12 s across): wait until the whole box is inside the window, then tap it
        for _ in range(60):
            bb = tid(page, "golden-pizza").bounding_box()
            vw = page.viewport_size["width"]
            if bb and bb["x"] >= 4 and bb["x"] + bb["width"] <= vw - 4:
                break
            page.wait_for_timeout(100)
        tid(page, "golden-pizza").click(force=True)
        tid(page, "golden-pop").wait_for(timeout=3000)
        shot(page, "47c-golden-lucky-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"golden lucky shot failed: {e}")
    try:
        page = seeded_page(browser, hooks_save(order={"offer": {"hood": "suburbs", "target": 1100, "left": 45, "variant": 0}}))
        quiet_start(page)
        tid(page, "order-accept").wait_for(timeout=8000)
        shot(page, "48-order-offer", 0.3)
    except Exception as e:
        report["errors"].append(f"order offer shot failed: {e}")
    try:
        # D422: 250 of 1,100 pies sold with 84 s left: behind the clock (30% used, 23% sold), so "tap to rush!" shows (the managed shop
        # keeps selling at about 7.7 pies/s while the page loads)
        page = seeded_page(browser, hooks_save(order={"active": {"hood": "suburbs", "target": 1100, "startSold": 4750, "left": 84, "variant": 0}}))
        quiet_start(page)
        tid(page, "order-active").wait_for(timeout=8000)
        shot(page, "49-order-active", 0.3)
    except Exception as e:
        report["errors"].append(f"order active shot failed: {e}")
    try:
        # a few pies short: it finishes within a second of load; shoot while the chip flashes gold with the thank-you and the coins fly
        page = seeded_page(browser, hooks_save(order={"active": {"hood": "suburbs", "target": 1100, "startSold": 3908, "left": 80, "variant": 0}}))
        tid(page, "order-done").wait_for(timeout=15000)
        shot(page, "50-order-success", 0.2)
    except Exception as e:
        report["errors"].append(f"order success shot failed: {e}")
    # 18. v5.14 return hooks: Nonna's night oven (51), the welcome-back gift (52-54) and the next-scene teaser (55). Each save carries
    # its state: `nightOven` is the tier owned, and `lastSavedAt` puts the player away for the gift. 52-54 skip settle() because it taps
    # `collect-offline`; the gift is the shot. The daily gift calendar is marked shown so it doesn't cover the scene afterwards.
    def return_save(away_hours=None, oven=0):
        sv = hooks_save()
        sv["nightOven"] = oven
        if away_hours:
            sv["lastSavedAt"] = int(time.time() * 1000) - int(away_hours * 3600 * 1000)
        return sv
    try:
        page = seeded_page(browser, return_save()); quiet_start(page)
        tid(page, "night-oven-chip").click()
        tid(page, "night-oven-sheet").wait_for(timeout=5000)
        shot(page, "51-night-oven-sheet", 0.5)
    except Exception as e:
        report["errors"].append(f"night oven sheet shot failed: {e}")
    try:
        # away 3 h 12 m of a 4 h oven: the door is shut and glows at about 80%
        page = seeded_page(browser, return_save(away_hours=3.2))
        tid(page, "collect-offline").wait_for(timeout=8000)
        shot(page, "52-gift-closed", 0.8)
        # open it: the door swings and the total counts up; shoot partway
        tid(page, "collect-offline").click()
        shot(page, "53-gift-counting", 0.3)
    except Exception as e:
        report["errors"].append(f"welcome-back gift shots failed: {e}")
    try:
        # away 9 h with the 4 h oven: full, and the bigger oven is on offer
        page = seeded_page(browser, return_save(away_hours=9))
        tid(page, "collect-offline").wait_for(timeout=8000)
        shot(page, "54-gift-full-upgrade", 0.8)
    except Exception as e:
        report["errors"].append(f"full night oven shot failed: {e}")
    try:
        page = seeded_page(browser, return_save()); quiet_start(page)
        shot(page, "55b-hud-teaser-ring", 0.3)
        tid(page, "open-scrapbook").click()
        tid(page, "scrapbook-teaser").wait_for(timeout=5000)
        shot(page, "55-scrapbook-teaser", 0.8)
    except Exception as e:
        report["errors"].append(f"scrapbook teaser shot failed: {e}")
    # v5.14: every card's own shots, one file each (scripts/fixtures/README.md), after the shots above so their names and order stay put
    run_fixtures(browser)
    browser.close()

httpd.shutdown()
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in report.items() if k != "shots"}, indent=2))
