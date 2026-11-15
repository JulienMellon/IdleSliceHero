"""Shots 74-81 (v5.16, card S2a): the three layers of Suburbs, Waterfront and the rival.

74 Game Day countdown chip · 75 Game Day rush with full seats and the wave of families · 76 boat docked, warming rack at tier 3 half full ·
77 the rack's drawer card · 78 the Pier 9 bid card after two raises · 79 the rival open with the -20% tag and Todd's offer ·
80 the rival challenge behind pace · 81 the rival closed after a win (shutters down, the tag gone, the win line up).
Saves are stamped from T0; the layers' schedules are seeded in `x` in play seconds (`playSeconds` is where the game starts).
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, hood_save, now_ms, day_str, report, ...

PLAY = 1000
# a busy managed shop: the footprint and tables give a full room for the families
BUSY = dict(prep=30, ovens=30, counter=30, drivers=14, tables=30, grade=1, footprint=3, sold=20000,
            decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})
FIRST = ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "suburbs-3b", "waterfront-1", "waterfront-2"]


def save(hood, x=None, seen=None, cash=5e5, **kw):
    """A save in `hood` mid-game with the layers' state `x` (keyed by feature) and the scenes seen."""
    sv = hood_save(hood, cash=cash, **dict(BUSY, **kw))
    sv.update(lastSavedAt=now_ms, playSeconds=PLAY, rewards={"giftShownDay": day_str()}, x=x or {}, scrapbookViewed=12)
    sv["seenScenes"] = list(seen if seen is not None else FIRST)
    return sv


def timed(nextAt, until=0, **extra):
    return dict({"seed": 7, "n": 1, "nextAt": nextAt, "until": until, "at": 0}, **extra)


def open_drawer(page):
    tid(page, "open-upgrades").click()
    advance(page, 700)


def run(ctx):
    b = ctx.browser

    # 74: the Suburbs shop, the next game 3 minutes off: a "Game Day 3:0x" chip in the goal row
    page = seeded_page(b, save("suburbs", x={"suburbsGameDay": timed(PLAY + 190)}))
    settle(page, 2.0)
    expect(page, "gameday-chip")
    shot(page, "74-gameday-chip", 0.3)

    # 75: the rush, 28 s in: the banner, the red chip, the free seats glowing and the families on the walkers' lane
    page = seeded_page(b, save("suburbs", x={"suburbsGameDay": timed(PLAY + 460, until=PLAY + 40)}))
    settle(page, 2.0)
    expect(page, "layer-notice")
    expect(page, "gameday-scene")
    advance(page, 2200)
    shot(page, "75-gameday-rush", 0.4)

    # 76: the boat docked at the pier with the warming rack at tier 3 (the boat's rush drains it, so it is seeded full and shot a moment in)
    wf = dict(footprint=2, tables=24, sold=30000)
    page = seeded_page(b, save("waterfront", x={"waterfrontBoats": timed(PLAY + 170, until=PLAY + 28, tier=3, rack=80, carry=0, openedAt=-1)}, **wf))
    settle(page, 0.3)
    expect(page, "harbour-scene")
    shot(page, "76-boat-and-rack", 0.4)

    # 77: the drawer: the warming rack's card with the next tier and its price
    page = seeded_page(b, save("waterfront", x={"waterfrontBoats": timed(PLAY + 170, tier=2, rack=20, carry=0, openedAt=-1)}, **wf))
    settle(page, 2.0)
    open_drawer(page)
    expect(page, "buy-rack")
    try:
        tid(page, "buy-rack").scroll_into_view_if_needed()
    except Exception as e:
        report["errors"].append(f"fixture 74_s2a: scrolling to the rack card failed: {e}")
    shot(page, "77-rack-card", 0.5)

    # 78: the Pier 9 bid on offer, the auction opened 250 s ago: two raises ($132M), the next in 1:50, the cap
    seen = FIRST + ["waterfront-3", "waterfront-3b"]
    sv = save("waterfront", x={"waterfrontBoats": timed(PLAY + 170, tier=1, rack=5, carry=0, openedAt=PLAY - 250)}, seen=seen, cash=1.4e8, **dict(wf, sold=80000))
    page = seeded_page(b, sv)
    settle(page, 2.0)
    open_drawer(page)
    expect(page, "auction-card")
    try:
        tid(page, "auction-card").scroll_into_view_if_needed()
    except Exception as e:
        report["errors"].append(f"fixture 74_s2a: scrolling to the bid card failed: {e}")
    shot(page, "78-auction-bid-card", 0.5)

    # 79: the Suburbs rival is open (beat 3 seen, beat 4 not): the shop across the street, the "-20% sales" tag (a tap opens the sheet with Todd's offer and Start)
    page = seeded_page(b, save("suburbs", x={"suburbsGameDay": timed(PLAY + 300)}))
    settle(page, 2.0)
    expect(page, "rival-shop")
    expect(page, "rival-tag")
    shot(page, "79-rival-open", 0.4)

    # 80: the challenge running and behind the pace: 100 of 900 pies with 110 s left
    run_state = {"rival": {"won": [], "challenge": {"hood": "suburbs", "target": 900, "startSold": 19900, "left": 110}, "retryAt": {}}, "suburbsGameDay": timed(PLAY + 300)}
    page = seeded_page(b, save("suburbs", x=run_state))
    settle(page, 2.0)
    expect(page, "rival-chip")
    expect(page, "rival-rush")
    shot(page, "80-rival-challenge-behind", 0.3)

    # 81: the win: a challenge 15 pies short wins within seconds; a moment later the shutters are down, the shop and the tag are gone and the win line is up
    near = {"rival": {"won": [], "challenge": {"hood": "suburbs", "target": 60, "startSold": 19950, "left": 200}, "retryAt": {}}, "suburbsGameDay": timed(PLAY + 300)}
    page = seeded_page(b, save("suburbs", x=near, sold=19995))
    expect(page, "rival-chip")
    expect(page, "rival-won", 12000)
    advance(page, 600)
    # the win plays the suburbs finale (beat 4): skip it to see the street (the win line stays on its card for 6 s)
    if page.locator('[data-testid="skip-scene"]').count():
        tid(page, "skip-scene").click()
        advance(page, 800)
    shot(page, "81-rival-closed", 0.3)
