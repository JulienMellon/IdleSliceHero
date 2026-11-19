"""X4 (v5.19-test): the Test panel's Story & save block: the section, the scene "Play next story beat now" opens, and the import box with a parse error.
Runs against a build made with EXPO_PUBLIC_TEST_MODE=1 only (see README.md here):
  SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode python3 scripts/screenshots.py dev --only x4_story_save
"""
import shots_lib
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, until, report, MID_SAVE, ...)

TEST_KEY = "slice-empire/save/test-v1"   # the test build reads this key, never the v1 save the other fixtures seed

# MID_SAVE with Coach Todd's interlude (suburbs-3b, 150 play seconds after suburbs-3) not yet seen and 20 s into its wait
WAITING = dict(MID_SAVE, seenScenes=[s for s in MID_SAVE["seenScenes"] if s != "suburbs-3b"], playSeconds=20, sceneAt={"suburbs-3": 10})


def _scroll_to(page, testid):
    page.evaluate("(id) => document.querySelector(`[data-testid=\"${id}\"]`)?.scrollIntoView({ block: 'center' })", testid)
    advance(page, 300)


def _disabled(page, testid):
    return page.evaluate("(id) => document.querySelector(`[data-testid=\"${id}\"]`)?.getAttribute('aria-disabled') === 'true'", testid)


def run(ctx):
    old_key = shots_lib.KEY
    shots_lib.KEY = TEST_KEY
    try:
        page = seeded_page(ctx.browser, WAITING)
        settle(page)
        tid(page, "test-pill").click()
        advance(page, 600)
        expect(page, "test-section-story")
        for row in ("test-next-beat", "test-skip-tutorial", "test-export", "test-import-text", "test-import", "test-reset"):
            expect(page, row)
        # a beat waits on its gap: the row is on; the tutorial is long over: its row is off
        if _disabled(page, "test-next-beat"):
            report["errors"].append("x4: Play next story beat is disabled with Coach Todd's beat waiting")
        if not _disabled(page, "test-skip-tutorial"):
            report["errors"].append("x4: Skip tutorial is enabled after the tutorial")
        _scroll_to(page, "test-next-beat")
        shot(page, "x4-story-section", 0.3)
        # the import box with a parse error (nothing is loaded: the Import row says why)
        tid(page, "test-import-text").fill("{oops")
        advance(page, 300)
        tid(page, "test-import").click()
        advance(page, 600)
        expect_text(page, "test-import-error", r"Not valid JSON")
        _scroll_to(page, "test-import-error")
        shot(page, "x4-import-error", 0.3)
        # Play next story beat now: the panel says so, and the scene opens under it once the panel is closed
        _scroll_to(page, "test-next-beat")
        tid(page, "test-next-beat").click()
        advance(page, 600)
        expect_text(page, "test-story-message", r"Next beat due: Coach Todd")
        tid(page, "test-panel-close").click()
        advance(page, 800)
        expect(page, "cutscene")
        shot(page, "x4-next-beat-scene", 0.3)
    except Exception as e:
        report["errors"].append(f"x4 story and save shots failed: {e}")
    finally:
        shots_lib.KEY = old_key
