"""Play Slice Empire from a fresh install in headless Chromium with a fake clock, like an attentive player.
Usage: python3 scripts/review/play.py dist /tmp/run 15 [save.json]   (needs `npx expo export --platform web` first)
Logs one line per 10 game seconds: cash, HUD subtitle, goal, affordable buttons. Screenshots each new cut-scene panel
and the shop once a minute.
"""
import functools, http.server, json, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

DIST, OUT, MINUTES = sys.argv[1], sys.argv[2], float(sys.argv[3])
SEED = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None
os.makedirs(OUT, exist_ok=True)
KEY = "slice-empire/save/v1"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)):
            self.path = "/index.html"
        return super().send_head()

httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{httpd.server_address[1]}/"
log = open(os.path.join(OUT, "log.txt"), "w")
def say(*a):
    s = " ".join(str(x) for x in a)
    print(s); log.write(s + "\n"); log.flush()

def txt(pg, tid):
    loc = pg.locator(f'[data-testid="{tid}"]')
    try:
        return loc.first.inner_text(timeout=300).replace("\n", " ¦ ") if loc.count() else ""
    except Exception:
        return ""

def enabled_buttons(pg):
    # BuyButtons: enabled ones are opaque; read their aria-disabled? fall back to style opacity
    return pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="walk-"],[data-testid^="mini-"],[data-testid="goal"]')]
      .map(e => { const inner = e.firstElementChild; const bg = inner ? getComputedStyle(inner).backgroundColor : '';
        const off = ['rgb(226, 217, 206)', 'rgb(239, 230, 216)', 'rgb(221, 239, 217)'].includes(bg);
        const en = e.dataset.testid === 'goal' ? /tap!/.test(e.textContent) : !off;
        return {id: e.dataset.testid, t: e.textContent, en}; })""")

with sync_playwright() as pw:
    b = pw.chromium.launch()
    c = b.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=1, is_mobile=True, has_touch=True)
    if SEED:
        c.add_init_script(f"if (!sessionStorage.getItem('seeded')) {{ localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(SEED))}); sessionStorage.setItem('seeded','1'); }}")
    pg = c.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.clock.install()
    pg.goto(URL)
    step = lambda ms: pg.clock.run_for(int(ms))
    for _ in range(40):
        step(250); time.sleep(0.05)
        if pg.locator('[data-testid="title-card"]').count() or pg.locator('[data-testid="cutscene"]').count():
            break
    shopbox = None
    def tap_station(st):
        box = pg.locator('[data-testid="shop"]').first.bounding_box()
        fx = {"prep": 0.31, "oven": 0.46, "counter": 0.6}[st]
        fy = {"prep": 0.5, "oven": 0.45, "counter": 0.5}[st]
        pg.mouse.click(box["x"] + box["width"] * fx, box["y"] + box["height"] * fy)
    panels_seen = 0
    t = 0.0
    total = MINUTES * 60
    last_log = -999
    last_shot = -999
    goal_block = -1
    last_drawer = -99
    nothing = 0  # seconds with no affordable button and no station to tap
    prev_cash = None
    while t < total:
        # title card / offline popup / gift calendar
        for tid in ["title-card", "collect-offline", "gift-close"]:
            if pg.locator(f'[data-testid="{tid}"]').count():
                try: pg.locator(f'[data-testid="{tid}"]').first.click(timeout=800, force=True)
                except Exception: pass
        # cut-scene: screenshot each panel, tap through
        if pg.locator('[data-testid="cutscene"]').count():
            for k in range(30):
                if not pg.locator('[data-testid="cutscene"]').count(): break
                step(1800); time.sleep(0.05)
                pg.screenshot(path=os.path.join(OUT, f"scene-{panels_seen:03d}.png")); panels_seen += 1
                try: pg.locator('[data-testid="cutscene"]').first.click(timeout=800, force=True)
                except Exception: pass
                t += 1.8
            say(f"[{t/60:6.2f}m] scene played ({panels_seen} panel shots so far)")
            continue
        sub = pg.evaluate("() => [...document.querySelectorAll('div')].map(e => e.textContent).find(x => x && /^(Tap to (serve|bake|prep)|Baking|Prepping|Serving|Your heads|.*across the city)/.test(x) && x.length < 60) || ''")
        acted = False
        coach = txt(pg, "coach")
        st = "counter" if "serve" in sub else "oven" if "bake" in sub.lower() and "Baking" not in sub else "prep" if "prep a batch" in sub else None
        if coach and not st:
            st = "counter" if "counter" in coach else "oven" if "oven" in coach.lower() and "Ovens" not in coach else "prep" if "prep table" in coach or "Again" in coach else None
        if st:
            tap_station(st); acted = True
        elif coach and not sub:
            for x in ("counter", "oven", "prep"):
                tap_station(x)
            acted = True
        # buy: goal first, then any enabled walk button (cheapest-first is what a player sees)
        btns = enabled_buttons(pg)
        en = [x for x in btns if x["en"]]
        if "Tap Ovens" in coach:
            en = [{"id": "walk-ovens", "t": "coach", "en": True}]
        en.sort(key=lambda x: x["id"] != "goal")
        if t < goal_block: en = [x for x in en if x["id"] != "goal"]
        if en and en[0]["id"] == "goal":
            before = txt(pg, "cash")
            pg.locator('[data-testid="goal"]').first.click(timeout=500, force=True)
            step(100)
            if txt(pg, "cash") == before:
                goal_block = t + 20; say(f"[{t/60:6.2f}m] GOAL TAP DID NOTHING: {en[0]['t'][:60]}")
            else:
                say(f"[{t/60:6.2f}m] BUY goal: {en[0]['t'][:60]}")
            en = []; acted = True
        # every 4 s a careful player opens the drawer and takes the 'Buy both' bundle if it is lit
        if t - last_drawer >= 4 and pg.locator('[data-testid="open-upgrades"]').count():
            last_drawer = t
            try:
                pg.locator('[data-testid="open-upgrades"]').first.click(timeout=500, force=True); step(150)
                bb = pg.locator('[data-testid="buy-bundle"]')
                if bb.count():
                    bg = pg.evaluate("() => { const e = document.querySelector('[data-testid=\"buy-bundle\"]'); return getComputedStyle(e.firstElementChild).backgroundColor }")
                    if bg not in ('rgb(226, 217, 206)', 'rgb(239, 230, 216)', 'rgb(221, 239, 217)'):
                        bb.first.click(timeout=500, force=True); say(f"[{t/60:6.2f}m] BUY bundle: {bb.first.inner_text()[:50]!r}")
                for d in ['buy-grade', 'buy-expand']:
                    pass
                pg.locator('[data-testid="close-upgrades"]').first.click(timeout=500, force=True); step(150)
            except Exception as e:
                say("drawer err", e)
        for x in en:
            if x["id"] == "goal" or x["id"].startswith("walk-"):
                try:
                    pg.locator(f'[data-testid="{x["id"]}"]').first.click(timeout=500, force=True); acted = True
                    say(f"[{t/60:6.2f}m] BUY {x['id']}: {x['t'][:70]}")
                    break
                except Exception: pass
        if not acted: nothing += 0.5
        step(500); time.sleep(0.03); t += 0.5
        if t - last_log >= 10:
            last_log = t
            say(f"[{t/60:6.2f}m] cash={txt(pg,'cash')!r:14} sub={sub!r:42} goal={txt(pg,'goal')[:60]!r} coach={coach[:50]!r} idle={nothing:.0f}s")
        if t - last_shot >= 60:
            last_shot = t
            pg.screenshot(path=os.path.join(OUT, f"shop-{int(t/60):03d}m.png"))
    save = pg.evaluate(f"() => localStorage.getItem({json.dumps(KEY)})")
    open(os.path.join(OUT, "final-save.json"), "w").write(save or "")
    say("errors:", errs[:5], "idle seconds:", nothing)
