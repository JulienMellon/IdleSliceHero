"""Shots 47-50: the golden pizza (47, 47a-c) and the special orders (48-50).
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    # for real minutes: `bonus.until` puts a golden pizza in the sky (its flight is 12 s, so these shots skip settle()'s long waits),
    # `order.offer` / `order.active` put the chip in its offer / mid-progress faces, and an order one pie short of done finishes
    # a second after load, so 50 waits for the "done" line and shoots while it flashes (2.5 s). Every save is stamped "now"
    # (no time away, so nothing fails or expires on load) and the daily gift is marked shown (it would cover the scene).
    try:
        page = seeded_page(browser, hooks_save(bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 2}))
        quiet_start(page)
        expect(page, "golden-pizza", 8000)
        shot(page, "47-golden-pizza", 0.2)
    except Exception as e:
        report["errors"].append(f"golden pizza shot failed: {e}")
    try:
        # D445: the very first golden pizza (number 1, no tap yet) carries Nonna's "A gift, caro. Tap it!"
        page = seeded_page(browser, hooks_save(bonus={"spawned": 1, "until": HOOK_PLAY + 12}, stats={"bonusTaps": 0}))
        quiet_start(page)
        expect(page, "golden-gift", 8000)
        shot(page, "47a-golden-gift", 0.15)
    except Exception as e:
        report["errors"].append(f"golden gift shot failed: {e}")
    try:
        # the lucky slice: four taps made, so this is the 5th; tap it for the pop, the ten coins and the full-width banner
        page = seeded_page(browser, hooks_save(bonus={"until": HOOK_PLAY + 12}, stats={"bonusTaps": 4}))
        quiet_start(page)
        expect(page, "golden-pizza", 8000)
        shot(page, "47b-golden-lucky", 0.15)
        # the pizza is flying (12 s across): wait until the whole box is inside the window, then tap it
        for _ in range(60):
            bb = tid(page, "golden-pizza").bounding_box()
            vw = page.viewport_size["width"]
            if bb and bb["x"] >= 4 and bb["x"] + bb["width"] <= vw - 4:
                break
            page.wait_for_timeout(100)
        tid(page, "golden-pizza").click(force=True)
        expect(page, "golden-pop", 3000)
        shot(page, "47c-golden-lucky-tap", 0.25)
    except Exception as e:
        report["errors"].append(f"golden lucky shot failed: {e}")
    try:
        page = seeded_page(browser, hooks_save(order={"offer": {"hood": "suburbs", "target": 1100, "left": 45, "variant": 0}}))
        quiet_start(page)
        expect(page, "order-accept", 8000)
        shot(page, "48-order-offer", 0.3)
    except Exception as e:
        report["errors"].append(f"order offer shot failed: {e}")
    try:
        # D422: 250 of 1,100 pies sold with 84 s left: behind the clock (30% used, 23% sold), so "tap to rush!" shows (the managed shop
        # keeps selling at about 7.7 pies/s while the page loads)
        page = seeded_page(browser, hooks_save(order={"active": {"hood": "suburbs", "target": 1100, "startSold": 4750, "left": 84, "variant": 0}}))
        quiet_start(page)
        expect(page, "order-active", 8000)
        expect(page, "order-rush", 3000)  # "tap to rush!": the order is behind the clock
        shot(page, "49-order-active", 0.3)
    except Exception as e:
        report["errors"].append(f"order active shot failed: {e}")
    try:
        # a few pies short: it finishes within a second of load; shoot while the chip flashes gold with the thank-you and the coins fly
        page = seeded_page(browser, hooks_save(order={"active": {"hood": "suburbs", "target": 1100, "startSold": 3908, "left": 80, "variant": 0}}))
        expect(page, "order-done", 15000)
        shot(page, "50-order-success", 0.2)
    except Exception as e:
        report["errors"].append(f"order success shot failed: {e}")
