"""X2 (v5.19-test): free buys with $0, Away for 8 h (the offline popup), Next day (the daily gift) and the Time section's readout.
Runs against a build made with EXPO_PUBLIC_TEST_MODE=1 only (see README.md here): SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode.
"""
import shots_lib
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, MID_SAVE, ...)

TEST_KEY = "slice-empire/save/test-v1"   # the test build reads this key, never the v1 save the other fixtures seed


def open_panel(page):
    tid(page, "test-pill").click()
    advance(page, 600)
    expect(page, "test-panel")


def close_panel(page):
    tid(page, "test-panel-close").click()
    advance(page, 600)


def collect_offline(page):
    """The welcome-back gift takes two taps by design (Open the oven, then Collect): open it, let the total count up, collect."""
    for _ in range(2):
        if not is_up(page, "collect-offline"):
            return
        tid(page, "collect-offline").click()
        advance(page, 3000)


def run(ctx):
    old_key = shots_lib.KEY
    shots_lib.KEY = TEST_KEY
    try:
        # 1. free buys are on by default in the test build: $0 in the till, an affordable row, no "need $X"
        page = seeded_page(ctx.browser, dict(MID_SAVE, cash=0))
        settle(page)
        expect(page, "test-pill")
        shot(page, "x2-free-buys-cash0", 0.4)

        # 2. Away for 8 h: the real return path, so the welcome-back popup comes up
        page = seeded_page(ctx.browser, MID_SAVE)
        settle(page)
        open_panel(page)
        expect_text(page, "test-clock-readout", r"Test clock \+0 min")
        tid(page, "test-away-8h").click()
        advance(page, 1200)
        close_panel(page)
        expect(page, "collect-offline")
        shot(page, "x2-away-8h-popup", 0.4)

        # 3. Next day: 00:01 tomorrow, a new daily gift
        collect_offline(page)
        open_panel(page)
        tid(page, "test-next-day").click()
        advance(page, 1200)
        close_panel(page)
        collect_offline(page)   # the welcome-back popup first, then the gift calendar the new day opens by itself
        expect(page, "gift-calendar")
        shot(page, "x2-next-day-gift", 0.4)

        # 4. the Time section's readout: 8 h + 4 h 1 min
        tid(page, "gift-close").click()
        advance(page, 600)
        open_panel(page)
        expect_text(page, "test-clock-readout", r"Test clock \+12 h 1 min")
        tid(page, "test-clock-readout").scroll_into_view_if_needed()   # the Time section sits below Money and the jump list
        advance(page, 300)
        shot(page, "x2-time-readout", 0.4)
    except Exception as e:
        report["errors"].append(f"x2 money and time shots failed: {e}")
    finally:
        shots_lib.KEY = old_key
