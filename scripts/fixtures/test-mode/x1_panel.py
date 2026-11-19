"""X1 (v5.19-test): the test build's red TEST pill, the empty Test panel and Settings' "· TEST" line.
Runs against a build made with EXPO_PUBLIC_TEST_MODE=1 only (see README.md here): SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode.
"""
import shots_lib
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, MID_SAVE, ...)

TEST_KEY = "slice-empire/save/test-v1"   # the test build reads this key, never the v1 save the other fixtures seed


def run(ctx):
    old_key = shots_lib.KEY
    shots_lib.KEY = TEST_KEY
    try:
        page = seeded_page(ctx.browser, MID_SAVE)
        settle(page)
        expect(page, "test-pill")
        shot(page, "x1-hud-pill", 0.3)
        tid(page, "test-pill").click()
        advance(page, 600)
        expect(page, "test-panel")
        for section in ("money", "hoods", "time", "story"):
            expect(page, f"test-section-{section}")
        expect_text(page, "test-panel", r"TEST MODE PANEL")
        shot(page, "x1-panel-open", 0.3)
        tid(page, "test-panel-close").click()
        advance(page, 600)
        tid(page, "open-city").click()
        advance(page, 600)
        tid(page, "open-settings").click()
        advance(page, 600)
        expect_text(page, "settings-version", r"Slice Empire v[\d.]+ · TEST$")
        # the line is at the foot of a scrolling page: bring it into view
        page.evaluate("() => document.querySelector('[data-testid=\"settings-version\"]')?.scrollIntoView({ block: 'center' })")
        shot(page, "x1-settings-version", 0.3)
    except Exception as e:
        report["errors"].append(f"x1 panel shots failed: {e}")
    finally:
        shots_lib.KEY = old_key
