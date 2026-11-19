"""X1 (v5.19-test): the test build boots to its first screen. Sets report["loaded"] for the test-mode run (the normal 00_boot.py does it for dist/).
Runs against a build made with EXPO_PUBLIC_TEST_MODE=1 only (see README.md here): SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode.
"""
import shots_lib
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, report, MID_SAVE, ...)

TEST_KEY = "slice-empire/save/test-v1"   # the test build reads this key, never the v1 save the other fixtures seed


def run(ctx):
    old_key = shots_lib.KEY
    shots_lib.KEY = TEST_KEY
    try:
        # a fresh install of the test build: no save under the test key, so the title card and then the opening cut-scene come up
        page = seeded_page(ctx.browser, None, title=False)
        wait_for(page, "title-card", 15000)
        skip_title(page, 2000)
        wait_for(page, "cutscene", 15000)
        report["loaded"] = True
        page.context.close()
    except Exception as e:
        report["errors"].append(f"test build never booted to its first screen: {e}")
    finally:
        shots_lib.KEY = old_key
