"""Shots 90-97 and 138-139 (v5.16, card T1b): Todd's looks and props, the Scrapbook, the story wait hint, a shop interior of its own, the managers.

90 mr-smith (downtown-1 P1) · 91 name-tag (suburbs-3b P3) · 92 order-slip (downtown-5 P4) · 93 phone-footage (university-3c P2) ·
94 slicey (uptown-2b P2) · 95 Scrapbook with interlude tiles · 96 the Uptown wait hint in its drawer · 97 a Waterfront shop-interior panel
(waterfront-hire P1: Marisol and Skip in the Waterfront room) · 138 a hire scene (university-hire P2, Noor) · 139 the Waterfront shop with Skip's
badge and face, 139b the drawer's manager row with the same face (the hire card, in a shop that has not hired him yet).
Every scene is replayed from the Scrapbook (the save has every scene seen), tapping on until the panel's own text is up.
"""
import os
import re

from shots_lib import *  # noqa: F401,F403  (seeded_page, settle, shot, tid, expect, advance, hood_save, report, ROOT, ...)

SCENES_DIR = os.path.join(ROOT, "src", "content", "cities", "home", "scenes")


def all_scene_ids():
    """Every home scene id, read from the scene files (their `id: '<hood>-<n>',` lines at the scene level)."""
    ids = []
    for hood in IDS:
        with open(os.path.join(SCENES_DIR, hood + ".ts"), encoding="utf-8") as f:
            ids += re.findall(r"^    id: '([a-z0-9-]+)',$", f.read(), re.M)
    return ids


ALL = all_scene_ids()
# every scene but the last finale: once uptown-4 is seen the story is over and "Coming soon: Boston" covers the screen
SEEN = [i for i in ALL if i != "uptown-4"]
GM_SHOP = dict(prep=30, ovens=30, counter=30, drivers=14, tables=8, grade=1, footprint=1, sold=4000,
               decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})


def story_save(hood="downtown", seen=None, **kw):
    """A save in `hood` with the given scenes seen (all of them by default), the daily gift already shown."""
    sv = hood_save(hood, **dict(GM_SHOP, **kw))
    sv.update(lastSavedAt=T0_MS, seenScenes=list(SEEN if seen is None else seen), scrapbookViewed=len(SEEN))
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def replay(page, scene_id, snippet, name, wait=0.4):
    """Open the Scrapbook, replay `scene_id`, tap on until `snippet` is on screen, shoot."""
    if not page.locator('[data-testid="scrapbook-teaser"]').count():  # still on the Scrapbook after the last replay: no need to open it
        tid(page, "open-scrapbook").click()
    if not expect(page, f"scene-{scene_id}"):
        report["errors"].append(f"90_t1b: no tile for {scene_id}")
    tile = tid(page, f"scene-{scene_id}")
    tile.scroll_into_view_if_needed()
    tile.click()
    wait_for(page, "cutscene", 5000)
    advance(page, 1200)
    for _ in range(30):
        if page.get_by_text(snippet, exact=False).count():
            break
        tid(page, "cutscene").click()
        advance(page, 1300)
    else:
        report["errors"].append(f"90_t1b: '{snippet}' never showed in {scene_id}")
    shot(page, name, wait)
    tid(page, "skip-scene").click()
    advance(page, 800)


def run(ctx):
    b = ctx.browser
    page = seeded_page(b, story_save())
    settle(page, 2.0)

    replay(page, "downtown-1", "Target located", "90-mr-smith")
    replay(page, "suburbs-3b", "If the Llamas lose", "91-name-tag")
    replay(page, "downtown-5", "Spies don", "92-order-slip")
    replay(page, "university-3c", "career-fair guy", "93-phone-footage")
    replay(page, "uptown-2b", "Croissant has never been wrong", "94-slicey")
    replay(page, "waterfront-hire", "Kid, meet Skip", "97-waterfront-shop-interior")
    replay(page, "university-hire", "timed your line", "138-hire-scene-noor")

    # 95: the Scrapbook with the interlude tiles (Suburbs has Todd's two and Deb's hire scene)
    page = seeded_page(b, story_save())
    settle(page, 2.0)
    tid(page, "open-scrapbook").click()
    if expect(page, "scene-suburbs-hire"):
        tid(page, "scene-suburbs-hire").scroll_into_view_if_needed()
    shot(page, "95-scrapbook-interludes", 0.6)

    # 96: Uptown's act 3 is held behind Industrial's finale: the drawer says so on one line
    held = [i for i in SEEN if i not in ("uptown-2b", "uptown-3", "uptown-3b", "uptown-4", "industrial-4")]
    page = seeded_page(b, story_save("uptown", seen=held, sold=700000, managed=False))
    settle(page, 2.0)
    tid(page, "open-upgrades").click()
    if expect(page, "story-wait-hint"):
        tid(page, "story-wait-hint").scroll_into_view_if_needed()
    shot(page, "96-uptown-wait-hint", 0.6)

    # 139: Waterfront's manager runs the shop: Skip's badge at the end of the station rail and on every station he runs
    page = seeded_page(b, story_save("waterfront", managed=True))
    settle(page, 2.0)
    shot(page, "139-skip-badge", 1.0)
    # 139b: the same shop before he is hired: the drawer's manager row carries his face
    page = seeded_page(b, story_save("waterfront", managed=False, heads={"prep": True, "oven": True, "counter": True}))
    settle(page, 2.0)
    tid(page, "open-upgrades").click()
    if expect(page, "buy-manager"):
        tid(page, "buy-manager").scroll_into_view_if_needed()
    shot(page, "139b-skip-drawer-row", 0.6)
