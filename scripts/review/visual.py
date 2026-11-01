import functools, http.server, json, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist'); OUT = './vis'; os.makedirs(OUT, exist_ok=True)
KEY = "slice-empire/save/v1"
class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)): self.path = "/index.html"
        return super().send_head()
httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{httpd.server_address[1]}/"
IDS = ["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"]
ALL = [f"{n}-{b}" for n in IDS for b in range(1, 5)]
now = int(time.time() * 1000)
def shop(**kw):
    b = {"decor": {k: 0 for k in ["plants","flooring","tables","walls","signage"]}, "built": True, "managed": True, "heads": {"prep": True, "oven": True, "counter": True}, "prep": 1, "ovens": 1, "grade": 0, "counter": 1, "drivers": 1, "tables": 1, "footprint": 0, "sold": 2e6, "perk": True}
    b.update(kw); return b
STAGES = [
  ("L1",   dict(prep=1, ovens=1, counter=1, drivers=1, tables=1, grade=0, footprint=0, d=0)),
  ("L10",  dict(prep=10, ovens=10, counter=10, drivers=6, tables=8, grade=1, footprint=0, d=0)),
  ("L25",  dict(prep=25, ovens=25, counter=25, drivers=15, tables=20, grade=1, footprint=1, d=1)),
  ("L50",  dict(prep=50, ovens=50, counter=50, drivers=30, tables=40, grade=2, footprint=2, d=2)),
  ("L75",  dict(prep=75, ovens=75, counter=75, drivers=45, tables=60, grade=3, footprint=3, d=3)),
  ("L125", dict(prep=125, ovens=125, counter=125, drivers=90, tables=100, grade=4, footprint=4, d=3)),
]
hood = sys.argv[1] if len(sys.argv) > 1 else "downtown"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, st in STAGES:
        d = st.pop("d")
        shops = {i: shop() for i in IDS}
        shops[hood] = shop(**st, decor={k: d for k in ["plants","flooring","tables","walls","signage"]})
        save = {"saveVersion": 5, "cash": 1e3, "totalEarned": 1e9, "vehicle": 3 if name in ("L75","L125") else 1, "active": hood, "shops": shops, "dronesUnlocked": True, "cityComplete": False, "seenScenes": ALL, "scrapbookViewed": 24, "lastSavedAt": now, "tutorial": 10, "playSeconds": 99999}
        c = b.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
        c.add_init_script(f"localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(save))});")
        pg = c.new_page(); pg.goto(URL); time.sleep(3)
        for _ in range(8):
            for t in ["title-card", "collect-offline", "skip-scene", "gift-close"]:
                if pg.locator(f'[data-testid="{t}"]').count():
                    try: pg.locator(f'[data-testid="{t}"]').first.click(timeout=800, force=True)
                    except Exception: pass
            time.sleep(0.4)
        time.sleep(2.5)
        pg.screenshot(path=f"{OUT}/{hood}-{name}.png")
        c.close()
print("ok")
