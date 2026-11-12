"""Card U1 (v5.15): the endgame screens, shots 56-65.

56 post-story goal bar            57 City screen: stars, the marked tile, the Boston tile   58 the Boston card
59 attack banner (+ 59b the marked City tile)   60 challenge chip behind pace   61 challenge won
62 event countdown chip (+ 62b the banner while it runs)   63 Scrapbook recipes, 9 of 24 owned
64 vanity tab (+ 64b booster shelf)   65 sidewalk on MAX

Every save is seeded; the numbers are the late game's (about 7 pies/s in the Suburbs, a 5 minute challenge asks for about 2,900).
Shots 62 and 62b run on a shifted clock (a Friday at 16:30 and 18:48), because the events follow the device's local time.
"""
import datetime, json, time

from shots_lib import *  # seeded_page, settle, shot, tid, shop, hood_save, MID_SAVE, IDS, day_str, report, KEY, URL, AUDIO_PROBE

SCENES = lambda hoods: [f"{h}-{b}" for h in hoods for b in range(1, 5)]
DECOR3 = {"plants": 3, "flooring": 3, "tables": 3, "walls": 3, "signage": 3}


def week_number(ms):
    """engine/features/counterattack.ts weekNumber: whole weeks since the first Monday of 1970, from the local Monday."""
    d = datetime.datetime.fromtimestamp(ms / 1000)
    monday = (d - datetime.timedelta(days=d.weekday())).date()
    return round(((monday - datetime.date(1970, 1, 1)).days - 4) / 7)


def endgame_save(**over):
    """The story is told (every scene seen, the finale included), every shop is built and runs itself; seven stars."""
    shops = {
        "downtown": shop(prep=118, ovens=112, grade=4, counter=116, drivers=60, tables=70, footprint=4, sold=6.2e6, decor=DECOR3),
        "suburbs": shop(prep=112, ovens=108, grade=4, counter=110, drivers=56, tables=66, footprint=4, sold=5.1e6, decor=DECOR3),
        "waterfront": shop(prep=96, ovens=90, grade=3, counter=94, drivers=48, tables=60, footprint=3, sold=3.4e6, decor=DECOR3),
        "university": shop(prep=84, ovens=78, grade=3, counter=82, drivers=40, tables=52, footprint=2, sold=2.2e6, decor=DECOR3),
        "industrial": shop(prep=70, ovens=64, grade=2, counter=68, drivers=34, tables=44, footprint=2, sold=1.4e6, decor=DECOR3),
        "uptown": shop(prep=56, ovens=50, grade=2, counter=54, drivers=28, tables=36, footprint=1, sold=6.1e5, decor=DECOR3),
    }
    sv = dict(MID_SAVE, cash=3.2e14, totalEarned=9.5e15, vehicle=3, active="suburbs", shops=shops, cityComplete=True,
              seenScenes=SCENES(IDS), scrapbookViewed=24, lastSavedAt=int(time.time() * 1000), playSeconds=9000)
    sv["rewards"] = {"giftShownDay": day_str(), "diamonds": 340}
    sv.update(over)
    return sv


def attack_state(shop_id, **kw):
    """An attack that is open this week (the week roll sees nothing new: seenWeek is this week's number)."""
    w = week_number(int(time.time() * 1000))
    st = {"armedWeek": w - 1, "seenWeek": w, "target": shop_id, "open": True, "defended": [], "challenge": None, "retryAt": 0}
    st.update(kw)
    return {"counterattack": st}


def skip_boston(page, wait=4000):
    """The Boston card opens once after the finale: tap it away. It covers the whole screen, so do this BEFORE settle(), which
    needs to click the gift calendar's close button underneath."""
    try:
        tid(page, "soon-card").wait_for(timeout=wait)
        tid(page, "soon-card").click(); time.sleep(0.6)
    except Exception:
        pass


def ready(page):
    """Get a post-finale save to the game screen: the Boston card first (it sits over everything), then the usual settle."""
    skip_boston(page, 3000)
    settle(page, 2.0)
    skip_boston(page, 500)


def clock_page(browser, save, when):
    """A seeded page whose Date is shifted to `when` (a local datetime), for the events."""
    target = int(when.timestamp() * 1000)
    c = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    c.set_default_timeout(20000)
    c.add_init_script(AUDIO_PROBE)
    c.add_init_script(f"""(() => {{
        const Real = Date, off = {target} - Real.now();
        class Shifted extends Real {{
            constructor(...a) {{ if (a.length === 0) super(Real.now() + off); else super(...a); }}
            static now() {{ return Real.now() + off; }}
        }}
        window.Date = Shifted;
    }})();""")
    save = dict(save, lastSavedAt=target)
    c.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{
        localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(save))});
        sessionStorage.setItem('seeded', '1'); }}""")
    pg = c.new_page()
    pg.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    pg.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))
    pg.goto(URL)
    skip_title(pg)
    return c, pg


def next_weekday(weekday, hour, minute):
    """The coming local `weekday` (Monday = 0) at hour:minute, at least a day away."""
    d = datetime.datetime.now() + datetime.timedelta(days=1)
    while d.weekday() != weekday:
        d += datetime.timedelta(days=1)
    return d.replace(hour=hour, minute=minute, second=0, microsecond=0)


def run(ctx):
    browser = ctx.browser

    # 58 then 56: the Boston card opens by itself on the first launch after the finale; behind it, the goal bar reads "Mastery n/18"
    try:
        page = seeded_page(browser, endgame_save())
        tid(page, "soon-card").wait_for(timeout=6000)
        shot(page, "58-boston-card", 1.0)
        skip_boston(page)
        settle(page, 2.0)
        shot(page, "56-post-story-goal", 0.6)
    except Exception as e:
        report["errors"].append(f"U1 56/58 failed: {e}")

    # 57: the City screen with the stars on every pin, the Boston tile, and (in this save) an attack on Waterfront
    try:
        sv = endgame_save(x=attack_state("waterfront"))
        page = seeded_page(browser, sv); ready(page)
        tid(page, "open-city").click(); time.sleep(1.0)
        shot(page, "57-city-stars-boston", 0.8)
        shot(page, "59b-attack-marked-tile", 0.1)
    except Exception as e:
        report["errors"].append(f"U1 57 failed: {e}")

    # 59: the attack banner on the Suburbs, naming the shop, with its Defend button
    try:
        page = seeded_page(browser, endgame_save(x=attack_state("suburbs"))); ready(page)
        shot(page, "59-attack-banner", 0.8)
    except Exception as e:
        report["errors"].append(f"U1 59 failed: {e}")

    # 60: the challenge is running and the pies are behind the clock: "tap to rush!"
    try:
        sold = 5.1e6
        ch = {"target": 2900, "startSold": int(sold - 580), "left": 150}
        page = seeded_page(browser, endgame_save(x=attack_state("suburbs", challenge=ch))); ready(page)
        shot(page, "60-challenge-behind", 0.8)
    except Exception as e:
        report["errors"].append(f"U1 60 failed: {e}")

    # 61: three pies short of the target: it is won within a second or two, and the result chip shows the character's line
    try:
        sold = 5.1e6
        ch = {"target": 2900, "startSold": int(sold - 2897), "left": 40}
        page = seeded_page(browser, endgame_save(x=attack_state("suburbs", challenge=ch))); ready(page)
        shot(page, "61-challenge-won", 1.5)
    except Exception as e:
        report["errors"].append(f"U1 61 failed: {e}")

    # 62: the hour before Friday Night Rush (the chip), then while it runs (the banner)
    try:
        c, page = clock_page(browser, endgame_save(), next_weekday(4, 16, 30)); ready(page)
        shot(page, "62-event-countdown-chip", 0.8)
        c.close()
        c, page = clock_page(browser, endgame_save(), next_weekday(4, 18, 48)); ready(page)
        shot(page, "62b-event-banner", 0.8)
        c.close()
    except Exception as e:
        report["errors"].append(f"U1 62 failed: {e}")

    # 63: the Scrapbook's Recipes tab with 9 of 24 owned: Downtown and the Suburbs told their stories and run themselves,
    # Waterfront has its GM and its finale, and Downtown has defended an attack; every other card is a silhouette
    try:
        hoods = ["downtown", "suburbs", "waterfront"]
        shops = dict(MID_SAVE["shops"])
        shops["downtown"] = shop(prep=52, ovens=48, grade=2, counter=50, drivers=20, tables=30, footprint=2, sold=4e5)
        shops["suburbs"] = shop(prep=51, ovens=44, grade=2, counter=46, drivers=18, tables=28, footprint=2, sold=3e5)
        shops["waterfront"] = shop(prep=30, ovens=28, grade=1, counter=30, drivers=12, tables=18, footprint=1, sold=1e5)
        sv = dict(MID_SAVE, cash=2e6, vehicle=3, active="suburbs", shops=shops, seenScenes=SCENES(hoods), scrapbookViewed=12, lastSavedAt=int(time.time() * 1000), playSeconds=5000)
        sv["rewards"] = {"giftShownDay": day_str()}
        sv["x"] = {"counterattack": {"armedWeek": 1, "seenWeek": week_number(int(time.time() * 1000)), "target": None, "open": False, "defended": ["downtown"], "challenge": None, "retryAt": 0}}
        page = seeded_page(browser, sv); settle(page, 3.0)
        tid(page, "open-scrapbook").click(); time.sleep(0.8)
        tid(page, "scrapbook-tab-recipes").click()
        shot(page, "63-scrapbook-recipes", 0.8)
    except Exception as e:
        report["errors"].append(f"U1 63 failed: {e}")

    # 64: the Shop screen from the diamond chip: the vanity tab (one cosmetic worn, one owned, the plaque not earned), then the booster shelf
    try:
        rw = {"giftShownDay": day_str(), "diamonds": 340, "cosmetics": ["oven-gold", "scooter-mint"], "worn": ["oven-gold"],
              "boosters": [{"mult": 2, "seconds": 900}, {"mult": 2, "seconds": 3600}]}
        page = seeded_page(browser, endgame_save(rewards=rw)); ready(page)
        tid(page, "shop-chip").click(); time.sleep(0.8)
        shot(page, "64-vanity-tab", 0.8)
        tid(page, "shop-tab-1").click()
        shot(page, "64b-booster-shelf", 0.6)
    except Exception as e:
        report["errors"].append(f"U1 64 failed: {e}")

    # 65: the sidewalk on MAX: each card shows the total price and the levels it buys
    try:
        sv = endgame_save(cash=8.4e12, active="uptown")
        page = seeded_page(browser, sv); ready(page)
        tid(page, "buy-amount-max").click()
        shot(page, "65-sidewalk-max", 0.8)
    except Exception as e:
        report["errors"].append(f"U1 65 failed: {e}")
