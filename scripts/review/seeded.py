import functools, http.server, json, os, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist'); OUT = './seeded'; os.makedirs(OUT, exist_ok=True)
KEY = "slice-empire/save/v1"
class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path)): self.path = "/index.html"
        return super().send_head()
httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{httpd.server_address[1]}/"
def clear(pg):
    for _ in range(10):
        for t in ["title-card", "collect-offline", "skip-scene", "gift-close"]:
            if pg.locator(f'[data-testid="{t}"]').count():
                try: pg.locator(f'[data-testid="{t}"]').first.click(timeout=800, force=True)
                except Exception: pass
        time.sleep(0.4)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name in sys.argv[1:]:
        save = json.load(open(f'saves/{name}.json'))
        save['lastSavedAt'] = int(time.time()*1000); save['tutorial'] = 10
        c = b.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
        c.add_init_script(f"if (!sessionStorage.getItem('s')) {{ localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(save))}); sessionStorage.setItem('s','1'); }}")
        pg = c.new_page(); pg.goto(URL); time.sleep(3); clear(pg); time.sleep(2)
        pg.screenshot(path=f"{OUT}/{name}-main.png")
        pg.locator('[data-testid="open-upgrades"]').first.click(force=True); time.sleep(1)
        pg.screenshot(path=f"{OUT}/{name}-drawer1.png")
        pg.mouse.move(196, 600); pg.mouse.wheel(0, 700); time.sleep(0.8)
        pg.screenshot(path=f"{OUT}/{name}-drawer2.png")
        pg.mouse.wheel(0, 900); time.sleep(0.8)
        pg.screenshot(path=f"{OUT}/{name}-drawer3.png")
        c.close()
print('ok')
