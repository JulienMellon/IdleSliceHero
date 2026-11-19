"""X3 (v5.19-test): the Test panel's Neighbourhoods block: the jump list, a jump to Boston's first neighbourhood, the shop screen after it, and the Undo row.
Runs against a build made with EXPO_PUBLIC_TEST_MODE=1 only (see README.md here):
  SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode python3 scripts/screenshots.py dev --only x3_jumps
"""
import shots_lib
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, until, report, MID_SAVE, ...)

TEST_KEY = "slice-empire/save/test-v1"   # the test build reads this key, never the v1 save the other fixtures seed


def _scroll_to(page, testid):
    page.evaluate("(id) => document.querySelector(`[data-testid=\"${id}\"]`)?.scrollIntoView({ block: 'center' })", testid)
    advance(page, 300)


def _disabled(page, testid):
    return page.evaluate("(id) => document.querySelector(`[data-testid=\"${id}\"]`)?.getAttribute('aria-disabled') === 'true'", testid)


def run(ctx):
    old_key = shots_lib.KEY
    shots_lib.KEY = TEST_KEY
    try:
        page = seeded_page(ctx.browser, MID_SAVE)
        settle(page)
        tid(page, "test-pill").click()
        advance(page, 600)
        expect(page, "test-section-hoods")
        for row in ("test-jump-home-downtown", "test-jump-home-complete", "test-jump-boston-north-end", "test-jump-boston-complete", "test-build-next"):
            expect(page, row)
        _scroll_to(page, "test-jumps-home")
        shot(page, "x3-jump-list", 0.3)
        # nothing has been jumped yet: the Undo row is disabled
        if not _disabled(page, "test-jump-undo"):
            report["errors"].append("x3: Undo is enabled before any jump")
        # tap -> confirm -> jump to Boston's first neighbourhood
        _scroll_to(page, "test-jump-boston-north-end")
        tid(page, "test-jump-boston-north-end").click()
        advance(page, 400)
        expect(page, "test-jump-boston-north-end-confirm")
        tid(page, "test-jump-boston-north-end-confirm").click()
        advance(page, 800)
        expect_text(page, "test-jumps-message", r"Jumped to North End")
        if not until(page, lambda: not _disabled(page, "test-jump-undo"), 3000):
            report["errors"].append("x3: Undo is still disabled after a jump")
        _scroll_to(page, "test-jump-undo")
        shot(page, "x3-after-jump-undo-enabled", 0.3)
        # close the panel: the shop screen is Boston's North End
        tid(page, "test-panel-close").click()
        advance(page, 800)
        settle(page)
        shot(page, "x3-boston-shop", 0.3)
    except Exception as e:
        report["errors"].append(f"x3 jump shots failed: {e}")
    finally:
        shots_lib.KEY = old_key
