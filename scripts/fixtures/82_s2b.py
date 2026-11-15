"""Shots 82-89 (v5.16, card S2b): University, Industrial and Uptown.

82 University menu sheet at 50/30/20 · 83 zones strip with the Stadium locked · 84 zones with drones (and the drone flight) ·
85 Industrial night shift (tint, x2, chip) · 86 jammed oven with the wrench (86b: a Head Baker fixing it) ·
87 Uptown at 2 stars with the half-pay tag · 88 stars sheet at 4 stars · 89 the critic's pass moment.
Seeded saves: the layer's state lives in the save's `x` (universityMenu / industrialShifts / uptownStars); play time is `playSeconds`.
"""
from shots_lib import *  # seeded_page, settle, shot, tid, expect, expect_text, advance, hood_save, ...

SCENES = ("downtown-1 downtown-2 downtown-3 downtown-4 downtown-5 industrial-1 industrial-2 industrial-2b industrial-3 industrial-3b industrial-4 "
          "industrial-hire suburbs-1 suburbs-2 suburbs-3 suburbs-3b suburbs-4 suburbs-5 suburbs-hire university-1 university-2 university-3 "
          "university-3b university-3c university-4 university-hire uptown-1 uptown-2 uptown-2b uptown-3 uptown-3b uptown-4 uptown-hire "
          "waterfront-1 waterfront-2 waterfront-3 waterfront-3b waterfront-4 waterfront-5 waterfront-hire").split()
PLAY = 1000          # play seconds in every save below
HEADS = {"prep": True, "oven": True, "counter": True}


def layer_save(hood, x, cash=2e6, vehicle=2, **kw):
    """A save in `hood` after the story, the gift already shown; `x` is the layer's saved state."""
    base = dict(prep=30, ovens=24, counter=26, drivers=12, tables=14, grade=2, footprint=2, sold=60000,
                decor={"plants": 2, "flooring": 2, "tables": 1, "walls": 1, "signage": 1})
    base.update(kw)
    sv = hood_save(hood, cash=cash, vehicle=vehicle, **base)
    sv.update(lastSavedAt=T0_MS, playSeconds=PLAY, seenScenes=SCENES, scrapbookViewed=len(SCENES), x=x, dronesUnlocked=vehicle == 4)
    sv["rewards"] = {"giftShownDay": day_str()}
    return sv


def page_of(b, save):
    """The save on a page whose \"Coming soon: Boston\" card has been seen (every scene is seen in these saves)."""
    return seeded_page(b, save, storage={"slice-empire/boston-seen": "1"})


def menu(pepperoni=0, knots=0):
    return {"universityMenu": {"pepperoni": pepperoni, "knots": knots}}


def shifts(into, jam=-1):
    """Industrial's clock: the cycle started `into` play seconds ago (400 s a shift: day, swing, night); the next jam is far off."""
    return {"industrialShifts": {"seed": 5, "n": 0, "nextAt": PLAY + 5000, "jam": jam, "startAt": PLAY - into, "at": T0_MS}}


def stars(tier=0, sign=0, result=None, next_in=5000, n=0):
    return {"uptownStars": {"seed": 5, "n": n, "nextAt": PLAY + next_in, "tier": tier, "sign": sign, "result": result}}


def run(ctx):
    b = ctx.browser

    # 82: Priya's menu at 50/30/20, the mix by taps
    page = page_of(b, layer_save("university", menu(30, 20), footprint=2))
    settle(page, 2.0)
    expect(page, "university-chip")
    tid(page, "university-chip").click()
    expect(page, "university-sheet")
    expect_text(page, "mix-pct-cheese", r"50%")
    shot(page, "82-menu-sheet", 0.4)

    # 83: the zones strip, the Stadium still locked (footprint 1)
    page = page_of(b, layer_save("university", menu(), footprint=1))
    settle(page, 2.0)
    expect(page, "zones-strip")
    expect_text(page, "zone-stadium", r"Locked")
    shot(page, "83-zones-locked", 0.4)

    # 84: drones: every zone says "ignores distance", and the drones cross the sky
    page = page_of(b, layer_save("university", menu(), footprint=2, vehicle=4, cash=1e12))
    settle(page, 2.0)
    expect(page, "drone-flight")
    expect_text(page, "zone-library", r"ignores distance")
    advance(page, 3000)
    shot(page, "84-zones-drones", 0.4)

    # 85: the night shift: blue tint, the x2 badge and the chip
    page = page_of(b, layer_save("industrial", shifts(900)))
    settle(page, 2.0)
    expect(page, "shift-tint")
    expect_text(page, "shift-chip", r"Night")
    shot(page, "85-night-shift", 0.4)

    # 86: an oven jammed 5 s ago: smoke, the wrench and its label
    page = page_of(b, layer_save("industrial", shifts(100, jam=PLAY - 5), managed=False))
    settle(page, 2.0)
    expect(page, "fix-jam")
    expect_text(page, "jam-label", r"wrench")
    shot(page, "86-jam-wrench", 0.4)
    # 86b: the same jam with the Head Baker: the label counts down
    page = page_of(b, layer_save("industrial", shifts(100, jam=PLAY - 5), heads=HEADS))
    settle(page, 2.0)
    expect_text(page, "jam-label", r"Head Baker fixing")
    shot(page, "86b-jam-head-baker", 0.4)

    # 87: Uptown at 2 stars: the plaque under the sign and the half-pay tag
    page = page_of(b, layer_save("uptown", stars(), grade=1, decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}, footprint=1))
    settle(page, 2.0)
    expect(page, "pay-tag")
    expect_text(page, "stars-chip", r"2")
    shot(page, "87-uptown-2-stars", 0.4)

    # 88: the stars sheet at 4 stars (Wood-fired... Copper oven 2, decor 2, Ingredients 2)
    full = {"plants": 2, "flooring": 2, "tables": 2, "walls": 2, "signage": 2}
    page = page_of(b, layer_save("uptown", stars(tier=2), grade=3, decor=full, cash=1e18))
    settle(page, 2.0)
    tid(page, "stars-chip").click()
    expect(page, "uptown-sheet")
    expect_text(page, "pay-word", r"Full pay")
    shot(page, "88-stars-sheet", 0.4)

    # 89: the critic's verdict: a pass, Genevieve's line, the figure in the shop and a pin on the sign
    res = {"target": 3, "stars": 4, "hit": True, "cash": 1234000}
    page = page_of(b, layer_save("uptown", stars(tier=2, sign=1, result=res, n=1), grade=3, decor=full, cash=1e18))
    settle(page, 0.5)
    expect(page, "critic-pass")
    expect(page, "critic")
    shot(page, "89-critic-pass", 0.4)
