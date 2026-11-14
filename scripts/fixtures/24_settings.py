"""Shot 24: Settings has Music and Sound toggles; the audio probe logs what a short session played.
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, tid, saves, report, ...)


def run(ctx):
    browser = ctx.browser
    perked = dict(MID_SAVE, active="suburbs", scrapbookViewed=9, seenScenes=MID_SAVE["seenScenes"] + ["suburbs-4"],
                  shops=dict(MID_SAVE["shops"], suburbs=dict(MID_SAVE["shops"]["suburbs"], perk=True, sold=8200)))
    # 13. v4.4: Settings has Music and Sound toggles (AU24); the probe shows what a short session played
    try:
        page = seeded_page(browser, perked); settle(page)
        for _ in range(6):
            tap_shop(page); advance(page, 250)
        settle(page, 0.5)  # a story beat may have come due during the taps
        tid(page, "tab-downtown").click(); advance(page, 1000)
        settle(page, 0.3)
        audio_log(page, "session")
        tid(page, "open-city").click(); advance(page, 600)
        tid(page, "open-settings").click(); advance(page, 600)
        tid(page, "toggle-music").click()
        shot(page, "24-settings-audio", 0.5)
    except Exception as e:
        report["errors"].append(f"settings audio shot failed: {e}")
