"""Card U1 (v5.21): the goal bar is the next chapter task. Shots 178-178j.

178  chapter 2 at 0 pies: "Ch 2 · Serve 424 pies in Downtown", 0/424, the bar empty
178b chapter 2 half way: 212/424, the bar half full
178c a chapter done and waiting on the story's pacing: a full bar with the countdown in the amount slot ("Ready" on basil only at 0:00)
178d a tap on the bar opens the task list on its Story tab (it buys nothing)
178e a hire task done: the tick pops on the bar and the toast names the task (D541)
178f the chapter's last task done: the "Chapter N complete" ribbon (D541)
178g a hire task: the cash against its price, "$12 / $800" (D532)
178h/i/j the Story tab's Go on a build, a win and a bid row (D536): the city map, the shop, the shop's drawer
178k chapter 1 mid-tutorial: the bar's words read on the fill (S88)
Every state is asserted with expect() before its shot; game time moves only through advance().
"""
from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, expect, expect_text, tid, advance, tap_shop, report, ...)

TUTORIAL_DONE = 18


def story_save(sold=0, **kw):
    """Downtown after its tutorial, before Nonna takes over: chapter 2 of the story is on."""
    unbuilt = {h: shop(built=False, managed=False) for h in IDS[1:]}
    opening = ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3"]  # the free chapter 1 stays current until its tasks are done
    # D533: the bar shows the hire and the rate before the long serve count, so they are done here and the bar is on the serve
    opening += ["task.downtown-2.2", "task.downtown-2.3"]
    kw.setdefault("heads", {"prep": True, "oven": True, "counter": False})
    return dict(MID_SAVE, x={"chapters": {"done": opening, "best": {}, "run": {}, "calm": {}, "report": False}}, saveVersion=8, cash=500, totalEarned=500, vehicle=0, active="downtown", tutorial=TUTORIAL_DONE,
                shops=dict(unbuilt, downtown=shop(managed=False, prep=3, ovens=2, counter=2, sold=sold, **kw)),
                seenScenes=["downtown-1"], scrapbookViewed=1, lastSavedAt=T0_MS, playSeconds=200)


def run(ctx):
    browser = ctx.browser

    # 178: no pies yet
    try:
        page = seeded_page(browser, story_save()); settle(page, 1.0)
        expect_text(page, "goal", r"Ch\s*2")
        expect_text(page, "goal", r"Serve\s+424\s+pies")
        expect_text(page, "goal", r"0/424")
        shot(page, "178-goal-start", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178 failed: {e}")

    # 178b: half way
    try:
        page = seeded_page(browser, story_save(sold=212)); settle(page, 1.0)
        expect_text(page, "goal", r"212/424")
        shot(page, "178b-goal-half", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178b failed: {e}")

    # 178c / 178f: chapter 3 is one pie short of done and the shop runs itself (all three heads): its last pie completes the chapter, the ribbon hangs
    # under the bar, and the beat then waits on the 90 s the story keeps between scenes (chapter 2's beat plays first and is skipped)
    try:
        done = ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3", "task.downtown-2.1", "task.downtown-2.2", "task.downtown-2.3", "task.downtown-3.2", "task.downtown-3.3"]
        sv = story_save(sold=940, heads={"prep": True, "oven": True, "counter": True})
        sv["x"] = {"chapters": {"done": done, "best": {}, "run": {}, "calm": {}, "report": False}}
        page = seeded_page(browser, sv)
        expect(page, "skip-scene", 8000)
        tid(page, "skip-scene").click()
        advance(page, 1500)
        for t in ("skip-scene", "collect-offline"):  # a second scene or popup due: away too
            if page.locator(f'[data-testid="{t}"]').count():
                tid(page, t).click(); advance(page, 800)
        expect_text(page, "goal", r"940/941")
        if until(page, lambda: is_up(page, "goal-ribbon"), 60000, 250):
            advance(page, 400)  # the ribbon has faded in
            expect_text(page, "goal-ribbon", r"Chapter\s+3\s+complete")
            shot(page, "178f-chapter-ribbon", 0.5)
        else:
            report["errors"].append("fixture 178_u1b.py: expected goal-ribbon before shot 178f-chapter-ribbon")
        advance(page, 3000)
        expect_text(page, "goal", r"Next\s+scene\s+in")
        expect_text(page, "goal", r"\d:\d\d")  # the countdown sits in the amount slot; "Ready" only at 0:00
        shot(page, "178c-goal-ready", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178c failed: {e}")

    # 178d: a tap on the bar opens the list on the Story tab
    try:
        page = seeded_page(browser, story_save(sold=212)); settle(page, 1.0)
        tid(page, "goal").click()
        expect(page, "tasks-drawer", 3000)
        expect(page, "story-tab", 3000)
        shot(page, "178d-goal-opens-list", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178d failed: {e}")

    # 178g / 178e: chapter 2's hire is the bar's task and the cash is there: "$12 / $800" first (cash set low), then hired from the drawer: tick and toast
    try:
        sv = story_save(sold=212)
        sv["x"]["chapters"]["done"] = ["task.downtown-1.1", "task.downtown-1.2", "task.downtown-1.3"]
        sv.update(cash=12)
        sv["shops"]["downtown"]["heads"] = {"prep": True, "oven": False, "counter": False}
        page = seeded_page(browser, sv); settle(page, 1.0)
        expect_text(page, "goal", r"Hire\s+Lucia")
        expect_text(page, "goal", r"\$12\s*/\s*\$")
        shot(page, "178g-goal-hire-price", 0.5)
        sv.update(cash=5000)
        page = seeded_page(browser, sv); settle(page, 1.0)
        tid(page, "open-upgrades").click(); advance(page, 600)
        expect(page, "buy-headOven", 3000)
        tid(page, "buy-headOven").click(); advance(page, 400)
        tid(page, "close-upgrades").click(); advance(page, 150)
        expect(page, "goal-tick", 2000)
        expect(page, "toast", 2000)
        expect_text(page, "toast", r"Hire Lucia")
        shot(page, "178e-task-done-toast", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178e/g failed: {e}")

    # 178h / 178i / 178j: the Story tab's Go: build opens the city map, win the shop (where the rival's card is), bid the shop's drawer
    order = ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-4", "waterfront-1", "waterfront-2", "waterfront-3", "waterfront-4"]

    def go_save(n, active):
        keys = [f"task.{sc}.{i}" for sc in order[:n - 1] for i in (1, 2, 3)]
        sv = dict(MID_SAVE, saveVersion=8, cash=5e5, vehicle=2, active=active, tutorial=TUTORIAL_DONE, scrapbookViewed=9, lastSavedAt=T0_MS, playSeconds=5000,
                  seenScenes=order[:n - 1], rewards={"giftShownDay": day_str()})
        sv["x"] = {"chapters": {"done": keys, "best": {}, "run": {}, "calm": {}, "report": False}}
        return sv

    def open_go(page):
        tid(page, "goal").click()
        expect(page, "story-tab", 3000)
        expect(page, "story-go", 3000)

    try:
        sv = go_save(5, "downtown")  # chapter 5 (suburbs-1): build Suburbs
        sv["shops"] = dict(sv["shops"], suburbs=shop(built=False, managed=False), waterfront=shop(built=False, managed=False))
        page = seeded_page(browser, sv); settle(page, 1.0)
        open_go(page)
        shot(page, "178h-go-build-row", 0.5)
        tid(page, "story-go").click(); advance(page, 800)
        expect(page, "city-row-suburbs", 3000)
        shot(page, "178h2-go-build-city", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178h failed: {e}")

    try:
        sv = go_save(8, "downtown")  # chapter 8 (suburbs-4): beat MegaSlice in Suburbs, viewed from Downtown
        page = seeded_page(browser, sv); settle(page, 1.0)
        open_go(page)
        tid(page, "story-go").click(); advance(page, 800)
        expect_text(page, None, r"Suburbs")  # the scene's sign: the Suburbs shop is the one on screen (it was Downtown)
        shot(page, "178i-go-win-shop", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178i failed: {e}")

    try:
        sv = go_save(12, "downtown")  # chapter 12 (waterfront-4): the Pier 9 auction, viewed from Downtown
        sv["shops"] = dict(sv["shops"], waterfront=shop(managed=False))
        page = seeded_page(browser, sv); settle(page, 1.0)
        open_go(page)
        tid(page, "story-go").click(); advance(page, 800)
        expect(page, "close-upgrades", 3000)
        expect_text(page, None, r"Waterfront")
        shot(page, "178j-go-bid-drawer", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178j failed: {e}")

    # 178k: the tutorial's chapter 1, two of four pies in: the words on the fill are light, on the track dark (S88)
    try:
        sv = story_save(sold=2)
        sv["x"]["chapters"]["done"] = ["task.downtown-1.1"]
        sv["shops"]["downtown"]["heads"] = {"prep": False, "oven": False, "counter": False}
        page = seeded_page(browser, sv); settle(page, 1.0)
        expect_text(page, "goal", r"Ch\s*1")
        shot(page, "178k-goal-ch1", 0.5)
    except Exception as e:
        report["errors"].append(f"U1b 178k failed: {e}")
