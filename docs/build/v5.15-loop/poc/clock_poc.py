"""PoC 3: freeze the clock BEFORE the app boots; let real network/fonts finish while fake time stands still; then step fake time."""
import sys, os, json, time, datetime, io
sys.argv = [sys.argv[0], "probe"]
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "scripts"))
import shots_lib as L
from PIL import Image, ImageChops
def frac(a, b):
    x = Image.open(io.BytesIO(a)).convert("RGB"); y = Image.open(io.BytesIO(b)).convert("RGB")
    r, g, bl = ImageChops.difference(x, y).split()
    w = ImageChops.lighter(ImageChops.lighter(r, g), bl)
    return 100 * sum(w.histogram()[25:]) / (x.size[0] * x.size[1])
T0 = datetime.datetime(2026, 11, 13, 12, 0, 0)
def fake(browser, save):
    c = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=2, is_mobile=True, has_touch=True)
    c.clock.install(time=T0)
    sv = dict(save, lastSavedAt=int(T0.timestamp() * 1000))
    c.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{ localStorage.setItem({json.dumps(L.KEY)}, {json.dumps(json.dumps(sv))}); sessionStorage.setItem('seeded', '1'); }}""")
    pg = c.new_page()
    pg.clock.pause_at(T0 + datetime.timedelta(seconds=1))     # frozen before any app code runs
    pg.goto(L.URL); pg.wait_for_load_state("networkidle"); time.sleep(1.0)   # real waits only; fake time stands still
    steps = 0
    for _ in range(120):                      # 12 s of game time in 100 ms steps; dismiss whatever is up
        pg.clock.run_for(100); steps += 1
        for t in ("title-card", "collect-offline", "skip-scene", "gift-close"):
            if pg.locator(f'[data-testid="{t}"]').count():
                try: L.tid(pg, t).click(timeout=500)
                except Exception: pass
    st = pg.evaluate("(k)=>{const g=JSON.parse(localStorage.getItem(k));return [Date.now(), g.playSeconds, g.lastSavedAt]}", L.KEY)
    print("  state:", st, "cash", L.tid(pg, "cash").inner_text())
    img = pg.screenshot(); c.close()
    return img
with L.sync_playwright() as pw:
    b = pw.chromium.launch(); fake(b, L.MID_SAVE)   # warm-up
    for name, save in (("mid-game (05)", L.MID_SAVE), ("suburbs hooks", L.hooks_save(bonus={"at": L.HOOK_PLAY + 2}))):
        s = time.time(); f1 = fake(b, save); f2 = fake(b, save); f3 = fake(b, save); tf = (time.time() - s) / 3
        print(f"{name}: fake clock diff run1-2 {frac(f1, f2):.3f}%, run2-3 {frac(f2, f3):.3f}% ({tf:.1f}s/shot)")
    b.close()
