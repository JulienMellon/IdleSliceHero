"""Shared helpers for scripts/screenshots.py and the fixtures in scripts/fixtures/ (v5.14 K0b).

Importing this module starts the static server for dist/ and creates the shared `report`; a fixture just does
`from shots_lib import *` and uses `seeded_page`, `settle`, `shot`, `tid`, `report`, ... Version comes from argv[1].

Q1 (v5.15 loop): every page runs on Playwright's fake clock, frozen before the app boots, so two runs of one build give the same pixels.
Game time moves only when a fixture says so (`advance`, `settle`, `shot`'s wait, `expect`, `wait_for`); a fixture never calls `time.sleep`
for game time. The one fixed moment is `T0` (Wednesday 2026-11-11 12:00 local); nothing here reads the wall clock.
"""
import datetime, functools, http.server, json, os, re, socketserver, sys, threading, time  # noqa: F401  (time: fixtures that need a real wait)
from playwright.sync_api import sync_playwright

VERSION = sys.argv[1] if len(sys.argv) > 1 else "dev"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")

def _viewport_arg(argv):
    """`--viewport 375x667` / `--viewport=375x667` from the command line (Q3): the phone size to run at; None = the default iPhone 15 (393x852)."""
    for i, a in enumerate(argv):
        v = argv[i + 1] if a == "--viewport" and i + 1 < len(argv) else a[len("--viewport="):] if a.startswith("--viewport=") else None
        if v:
            m = re.fullmatch(r"(\d+)x(\d+)", v.strip())
            if not m:
                raise SystemExit(f"--viewport wants WIDTHxHEIGHT (375x667), got {v!r}")
            return int(m.group(1)), int(m.group(2))
    return None

VIEWPORT = _viewport_arg(sys.argv[2:])
OUT = os.path.join(ROOT, "screenshots", VERSION + ("-se" if VIEWPORT else ""))   # a narrow-phone run never overwrites the normal one
os.makedirs(OUT, exist_ok=True)
KEY = "slice-empire/save/v1"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=DIST))
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{port}/"

# ---- the one fixed moment (Q1): every save, date and "now" in the shots comes from here, never from the wall clock ----
T0 = datetime.datetime(2026, 11, 11, 12, 0, 0)   # a Wednesday, local time; never changed (a changed T0 changes every shot)
T0_MS = int(T0.timestamp() * 1000)
now_ms = T0_MS
seen_all_but = lambda ids: ids
def shop(built=True, managed=True, **kw):
    base = {"decor": {"plants": 0, "flooring": 0, "tables": 0, "walls": 0, "signage": 0}, "built": built, "managed": managed, "prep": 1, "ovens": 1, "grade": 0, "counter": 1, "drivers": 1, "tables": 1, "footprint": 0, "queued": 0, "sold": 0}
    base.update(kw)
    return base

IDS = ["downtown", "suburbs", "waterfront", "university", "industrial", "uptown"]
MID_SAVE = {
    "saveVersion": 2, "cash": 3120, "totalEarned": 15000, "vehicle": 1, "active": "suburbs",
    "shops": {
        "downtown": shop(prep=22, ovens=20, grade=1, counter=18, drivers=14, tables=8, footprint=1, sold=4000),
        "suburbs": shop(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=700,
                        decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1}),
        "waterfront": shop(managed=False, sold=10),
        "university": shop(built=False, managed=False), "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False),
    },
    "dronesUnlocked": False, "cityComplete": False,
    "seenScenes": ["downtown-1", "downtown-2", "downtown-3", "downtown-4", "suburbs-1", "suburbs-2", "suburbs-3", "waterfront-1"],
    "scrapbookViewed": 7, "lastSavedAt": now_ms,
}
report = {"version": VERSION, "errors": [], "shots": [], "loaded": False}
if VIEWPORT:
    report["viewport"] = f"{VIEWPORT[0]}x{VIEWPORT[1]}"

def _only_arg(argv):
    """`--only a,b` / `--only=a,b` from the command line: the fixture names (or number prefixes) to run; None = all of them."""
    for i, a in enumerate(argv):
        if a == "--only" and i + 1 < len(argv):
            return [t.strip() for t in argv[i + 1].split(",") if t.strip()]
        if a.startswith("--only="):
            return [t.strip() for t in a[len("--only="):].split(",") if t.strip()]
    return None

ONLY = _only_arg(sys.argv[2:])
if ONLY is not None:
    report["only"] = ONLY  # a partial run can never be mistaken for a full one

# ---- expectations: a fixture says which state a shot is meant to show; a miss is an error, not a skipped shot ----
_current = {"fixture": "screenshots.py"}
_missed = []

def _flush_missed(before):
    for what in _missed:
        report["errors"].append(f"fixture {_current['fixture']}: expected {what} before shot {before}")
    del _missed[:]

# ---- game time (Q1): the page's clock is frozen; these are the only things that move it ----
STEP_MS = 100  # advance() moves game time in steps this long, letting React commit between them (a longer jump skips frames)
_FLUSH = "() => new Promise((r) => { let n = 0; const c = new (window.__MC || MessageChannel)(); c.port1.onmessage = () => { if (++n >= 5) r(document.fonts.status !== 'loading' && [...document.images].every((i) => i.complete)); else c.port2.postMessage(0); }; c.port2.postMessage(0); })"
# React's scheduler talks to itself through a MessageChannel, which the fake clock does not own: its work would run in REAL time, between
# two fake timers, and where it landed moved from run to run. Without a MessageChannel it falls back to setTimeout, which the clock owns.
NO_MESSAGE_CHANNEL = "window.__MC = window.MessageChannel; window.MessageChannel = undefined;"
# The fake clock lines its animation frames up on performance.now(), whose zero is the REAL time the page started: a few milliseconds that
# differ on every run, so the first frame came 0 to 16 ms earlier or later and every animation began at another phase. These frames come on
# the same fake setTimeout as everything else, on a grid of Date.now(), 16 ms apart; performance.now() is Date-based too.
FRAME_GRID = """(() => {
  const st = window.setTimeout, ct = window.clearTimeout, t0 = Date.now(); let n = 0; const pending = new Map();
  performance.now = () => Date.now() - t0 + 1000;
  window.requestAnimationFrame = (cb) => {
    const h = ++n;
    pending.set(h, st(() => { pending.delete(h); cb(performance.now()); }, 16 - (Date.now() % 16)));
    return h;
  };
  window.cancelAnimationFrame = (h) => { if (pending.has(h)) { ct(pending.get(h)); pending.delete(h); } };
})();"""
# react-native-web delivers onLayout through a ResizeObserver, which the browser calls from its own (real) rendering frames: a layout
# came in a step early or late from run to run. This one looks at the sizes from a fake timer instead (every 16 ms of game time).
FAKE_RESIZE_OBSERVER = """(() => {
  const watched = new Map(); let timer = null;
  const look = () => {
    for (const [el, st] of [...watched]) {
      if (!el.isConnected) { watched.delete(el); continue; }
      const r = el.getBoundingClientRect();
      if (st.w !== r.width || st.h !== r.height) {
        st.w = r.width; st.h = r.height;
        const entry = { target: el, contentRect: { x: 0, y: 0, width: r.width, height: r.height, top: 0, left: 0, right: r.width, bottom: r.height } };
        for (const cb of st.cbs) cb([entry], st.obs.get(cb));
      }
    }
  };
  window.ResizeObserver = class ResizeObserver {
    constructor(cb) { this.cb = cb; }
    observe(el) {
      let st = watched.get(el);
      if (!st) { st = { w: -1, h: -1, cbs: new Set(), obs: new Map() }; watched.set(el, st); }
      st.cbs.add(this.cb); st.obs.set(this.cb, this);
      if (timer === null) timer = window.setInterval(look, 16);
    }
    unobserve(el) { const st = watched.get(el); if (st) { st.cbs.delete(this.cb); if (!st.cbs.size) watched.delete(el); } }
    disconnect() { for (const [el, st] of [...watched]) { st.cbs.delete(this.cb); if (!st.cbs.size) watched.delete(el); } }
  };
})();"""

def _hold_network(page):
    """Hold every request of the game until the clock is standing still. Loading (fonts, bundles, audio and picture files) finishes in REAL
    time; a response that landed in the middle of a step reached the app at a different fake moment on every run. Now a request made during
    a step is let go by _quiet(), after the step, and the app sees its answer with the clock stopped. (Only after the first load: a route
    set before `goto` makes the page's own load run in a different order from run to run.)"""
    held, n = [], [0]
    page._held, page._inflight = held, n
    def route(r):
        if r.request.url.startswith(URL):
            held.append(r)
        else:
            r.continue_()
    page._route = route
    # music streams: its request stays open while it plays, so media is not counted
    page.on("request", lambda r: r.resource_type != "media" and n.__setitem__(0, n[0] + 1))
    page.on("requestfinished", lambda r: r.resource_type != "media" and n.__setitem__(0, max(0, n[0] - 1)))
    page.on("requestfailed", lambda r: r.resource_type != "media" and n.__setitem__(0, max(0, n[0] - 1)))

def _holding(page, on=True):
    """Start holding the game's requests (after the first load, which needs them); off lets everything through again."""
    if on:
        page.route("**/*", page._route)
    else:
        page.unroute("**/*", page._route)
        _quiet(page)

def _quiet(page):
    """Real time (game time stands still): let the held requests go and wait until nothing is loading and the page has had a few
    macrotasks to react to what just finished. A response is not the end of loading: a chunk is still compiled and run after it arrives,
    and a step that began before that was done got the chunk at a different fake moment each run; so after any release, give the page
    a moment (REAL_SETTLE_S) and look again, until a look finds nothing to release."""
    held, n = getattr(page, "_held", []), getattr(page, "_inflight", [0])
    calm, quiet_rounds = 0, 0
    for _ in range(300):
        released = bool(held)
        while held:
            held.pop(0).continue_()
        idle = page.evaluate(_FLUSH)   # also: no font and no picture still loading or decoding
        if released:
            page.wait_for_timeout(int(REAL_SETTLE_S * 1000))
            calm = 0
            continue
        if idle and n[0] <= len(held):
            calm += 1
            if calm >= 2:
                return
        else:
            calm = 0
            page.wait_for_timeout(5)

REAL_SETTLE_S = 0.1  # real time a page gets, after the requests of a step were let go, to compile and run what they brought

def advance(page, ms):
    """Move the page's game time forward `ms` (fake) milliseconds, in STEP_MS steps of `page.clock.run_for`. After each step the page
    gets real time to finish what the step started (loading, React's own real scheduler), so a step always ends in the same state."""
    left = int(round(ms))
    _quiet(page)   # first what a click or a load before this call set going
    while left > 0:
        n = min(STEP_MS, left)
        page.clock.run_for(n)
        left -= n
        _quiet(page)

def page_ms(page):
    """The page's Date.now(), in game time."""
    return page.evaluate("Date.now()")

def until(page, check, timeout=5000, step=STEP_MS):
    """Advance game time `step` at a time until check() is truthy; False after `timeout` game ms. (A wait in real time would never see
    anything that needs game time to pass.)"""
    waited = 0
    while True:
        try:
            if check():
                return True
        except Exception:
            pass
        if waited >= timeout:
            return False
        advance(page, step)
        waited += step

def is_up(page, testid):
    return page.locator(f'[data-testid="{testid}"]').first.is_visible()

def wait_for(page, testid, timeout=8000, gone=False):
    """Like locator.wait_for, in game time: wait for [data-testid=testid] to be on screen (or, with gone=True, off it). Raises on a miss."""
    if not until(page, lambda: is_up(page, testid) != gone, timeout):
        raise TimeoutError(f'testid "{testid}" ' + ("still on screen" if gone else "never appeared") + f" after {timeout} ms of game time")

def expect(page, testid, timeout=5000):
    """Wait (in game time) for [data-testid=testid] to be on screen. A miss is reported against the next shot and the fixture carries on."""
    if until(page, lambda: is_up(page, testid), timeout):
        return True
    _missed.append(f'testid "{testid}"')
    return False

def expect_text(page, testid, pattern, timeout=5000):
    """Wait (in game time) for the text of [data-testid=testid] to match the regex `pattern` (case-insensitive). With testid=None the text of
    every SVG <text> on the page is searched (for what the scene draws, a head's bark, which has no test ID)."""
    sel = f'[data-testid="{testid}"]'
    want = re.compile(pattern, re.I | re.S)
    def seen():
        if testid is None:
            txt = page.evaluate("() => [...document.querySelectorAll('text')].map((t) => t.textContent || '').join('\\n')")
        else:
            txt = page.locator(sel).first.inner_text(timeout=300)
        return bool(want.search(txt or ""))
    if until(page, seen, timeout):
        return True
    _missed.append(f'text /{pattern}/ in ' + (f'testid "{testid}"' if testid else "the scene's text"))
    return False

# ---- layout probe (Q3): at every shot, one page.evaluate asks the DOM what a player would trip over ----
# Four kinds of finding, each with a key that does not change with the save (a number in text, with its K/M/B/T/Q, becomes #):
#   tap   a visible, uncovered button (role=button / tabindex=0) drawn under 44 px in either direction. key: data-testid (or its text); detail: "WxH"
#   text  visible text under 10 px. key: nearest ancestor's data-testid + the text
#   clip  text that is cut off. react-native-web draws numberOfLines={1} as `overflow:hidden; white-space:nowrap; text-overflow:ellipsis`
#         and numberOfLines={n} as `-webkit-line-clamp:n`; adjustsFontSizeToFit does nothing in this build. So: a box that hides its overflow
#         and whose text (measured with a Range, which ignores the clipping) is wider than the box's content, or, with a line clamp or a
#         wrapping box, taller than the box. A scrollWidth/clientWidth comparison alone rounds both to whole pixels and misses a 1 px cut
#         (D477: "+$83/s" is 41.8 wide in a 40.5 box). Also: text that itself ends in "…" (layout_check.py drops those whose source does).
#   edge  text that starts left of 0 or ends right of the viewport (text inside a horizontal scroller is skipped: the shop tabs scroll)
# The page is only read: no waiting, no clock step.
LAYOUT_PROBE = """() => {
  const out = []; const vw = document.documentElement.clientWidth, vh = innerHeight;
  const norm = (t) => t.replace(/\\s+/g, ' ').trim().replace(/[0-9][0-9.,]*[KMBTQ]?/g, '#').slice(0, 40);   // "need $1.2K" and "need $450" are one key
  const tidOf = (el) => { const a = el.closest('[data-testid]'); return a ? a.getAttribute('data-testid') : '(none)'; };
  const seen = (el, r) => {   // on screen and not under something else (a sheet, a popup); pointer-events: none overlays do not count
    if (r.width < 1 || r.height < 1) return false;
    for (let a = el; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity === 0) return false; }
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = r.top + r.height / 2;
    if (cy < 0 || cy > vh) return false;
    const top = document.elementFromPoint(cx, cy);
    return !!top && (el === top || el.contains(top) || top.contains(el)); };
  const inHScroller = (el) => { for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  const px = (v) => parseFloat(v) || 0;
  for (const el of document.querySelectorAll('div[dir="auto"], span[dir="auto"]')) {
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.data;
    if (!own.trim()) continue;
    const r = el.getBoundingClientRect(); if (!seen(el, r)) continue;
    const cs = getComputedStyle(el), text = own.trim().replace(/\\s+/g, ' '), key = tidOf(el) + ' | ' + norm(text);
    const fs = px(cs.fontSize);
    if (fs < 9.995) out.push({kind: 'text', key, detail: fs + ' px'});
    const rg = document.createRange(); rg.selectNodeContents(el); const t = rg.getBoundingClientRect();
    if (t.width && (t.left < -0.5 || t.right > vw + 0.5) && !inHScroller(el)) out.push({kind: 'edge', key, detail: 'x ' + Math.round(t.left) + ' to ' + Math.round(t.right) + ' of ' + vw});
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const sx = el.offsetWidth ? r.width / el.offsetWidth : 1, sy = el.offsetHeight ? r.height / el.offsetHeight : 1;
      const room = (el.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight)) * sx, high = el.clientHeight * sy;
      const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if (cs.whiteSpace.startsWith('nowrap') || cs.whiteSpace === 'pre') {
        if (cs.overflowX !== 'visible' && t.width > room + 0.5) out.push({kind: 'clip', key, detail: 'text ' + t.width.toFixed(1) + ' px in ' + room.toFixed(1) + ' px, ' + (cs.textOverflow === 'ellipsis' ? 'drawn with an ellipsis' : 'cut')});
      } else if (cs.overflowY !== 'visible' && (clamp || el.offsetHeight) && el.scrollHeight * sy > high + 1.5) {
        out.push({kind: 'clip', key, detail: 'text ' + (el.scrollHeight * sy).toFixed(1) + ' px high in ' + high.toFixed(1) + ' px' + (clamp ? ' (' + cs.webkitLineClamp + ' lines)' : '')});
      }
    }
    if (/[…]$/.test(text)) out.push({kind: 'clip', key, detail: 'ends in …', ellipsis: text});
  }
  for (const el of document.querySelectorAll('[role="button"], [tabindex="0"]')) {
    const r = el.getBoundingClientRect(); if (!seen(el, r)) continue;
    if (r.width < 43.5 || r.height < 43.5) out.push({kind: 'tap', key: el.getAttribute('data-testid') || norm(el.textContent) || '(none)', detail: Math.round(r.width) + 'x' + Math.round(r.height)});
  }
  return out; }"""
LAYOUT = {}   # shot name -> findings; screenshots.py writes it to layout-raw.json

def layout_probe(page, name):
    key = name if name not in LAYOUT else f"{name}#{len(LAYOUT)}"
    try:
        LAYOUT[key] = page.evaluate(LAYOUT_PROBE)
    except Exception as e:   # the page was mid-navigation: say so, the shot itself is fine
        LAYOUT[key] = [{"kind": "probe-error", "key": name, "detail": str(e)[:120]}]

def shot(page, name, wait=0.6):
    """Let `wait` seconds of game time pass, then take the shot, then read the layout of what is on screen (one page.evaluate, no waiting)."""
    _flush_missed(name)
    advance(page, wait * 1000)
    p = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=p)
    report["shots"].append(p)
    layout_probe(page, name)

# Audio probe (v4.4): log every media play() as "<file> @<seconds since load>" so a run shows which cues fired.
AUDIO_PROBE = """(() => { window.__audioLog = []; const t0 = performance.now();
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const f = (this.currentSrc || this.src || '').split('/').pop().split('?')[0].replace(/\\.[0-9a-f]{20,}/, '');
    window.__audioLog.push(f + ' @' + ((performance.now() - t0) / 1000).toFixed(1));
    return play.apply(this, arguments); }; })();"""

def audio_log(page, label):
    try:
        report.setdefault("audio", {})[label] = page.evaluate("window.__audioLog || []")
    except Exception as e:
        report.setdefault("audio", {})[label] = [f"probe failed: {e}"]

_last_seeded = None
def seeded_page(browser, save, when=None, ahead_ms=None, storage=None, keep=False, title=True):
    """A fresh browser profile whose localStorage holds `save` before the app boots, on a clock frozen before the app boots.
    The clock stands at `when` (a local datetime; default T0) + 1 s while the page loads in real time; after that game time moves only
    through advance(). `when` (or `ahead_ms`: the save's stamp that far after `when`) also re-stamps the save's `lastSavedAt`, so the app
    sees no time away; a plain call keeps the stamp the save has. `storage` is extra localStorage to seed ({key: value}).
    `save=None` boots a fresh install. `keep=True` leaves the previous seeded profile open (default: close it, v5.12: ~50 live pages
    animating at once stalled the late shots). `title=False` leaves the title card up (shot 00). The context is `page.context`."""
    global _last_seeded
    if not keep and _last_seeded is not None:
        try: _last_seeded.close()
        except Exception: pass
    boots = []
    for attempt in range(6):
        pg, steps = _open(browser, save, when, ahead_ms, storage)
        boots.append(steps)
        if steps > 0 or attempt == 5:   # steps == 0: the app drew its first screen before the clock took its first step (about 1 boot in 50), which moves
            break                       # everything after it by 2 ms; a boot like that is thrown away and made again
        pg.context.close()
    pg.boots = boots   # boot steps of every try (a probe's evidence)
    if not keep:
        _last_seeded = pg.context
    if title:
        skip_title(pg)
    return pg

def _open(browser, save, when, ahead_ms, storage):
    start = when or T0
    start_ms = int(start.timestamp() * 1000)
    c = browser.new_context(viewport=dict(zip(("width", "height"), VIEWPORT or (393, 852))), device_scale_factor=2, is_mobile=True, has_touch=True)
    c.set_default_timeout(20000)
    c.clock.install(time=start)          # the page's Date, timers and animation frames are fake from its first line
    c.add_init_script(AUDIO_PROBE)
    c.add_init_script(NO_MESSAGE_CHANNEL)
    c.add_init_script(FAKE_RESIZE_OBSERVER)
    c.add_init_script(FRAME_GRID)
    if save is not None:
        if when is not None or ahead_ms is not None:
            save = dict(save, lastSavedAt=start_ms + (ahead_ms or 0))
        seed = {KEY: json.dumps(save)}
        seed.update(storage or {})
        c.add_init_script(f"""if (!sessionStorage.getItem('seeded')) {{
            const seed = {json.dumps(seed)};
            for (const k in seed) localStorage.setItem(k, seed[k]);
            sessionStorage.setItem('seeded', '1'); }}""")
    # frozen before the page exists, on the CONTEXT: paused on the page after it was made, the app's first timers sometimes ran first
    c.clock.pause_at(start + datetime.timedelta(seconds=1))
    pg = c.new_page()
    pg.on("console", lambda m: m.type == "error" and report["errors"].append(f"console: {m.text}"))
    pg.on("pageerror", lambda e: report["errors"].append(f"pageerror: {e}"))
    _hold_network(pg)
    first_load(pg, start + datetime.timedelta(seconds=1))
    _holding(pg)
    return pg, boot(pg)

def first_load(page, frozen_at, reload=False):
    """goto(URL) (or reload) with the game's scripts held back until the clock is certainly frozen at `frozen_at` (a datetime, or ms).
    Whether the clock was frozen before or after the first script ran depended on how fast the machine was (a script that ran first got its
    first timers fired by the freeze, and the app then started from a different place: its route chunk loaded before or after its first
    render, a 300 ms difference)."""
    held, gating = [], [True]
    def gate(r):
        if gating[0] and r.request.resource_type == "script":
            held.append(r)
        else:
            r.continue_()
    page.route("**/*", gate)
    if reload:
        page.reload(wait_until="commit")
    else:
        page.goto(URL, wait_until="commit")
    want = frozen_at if isinstance(frozen_at, int) else int(frozen_at.timestamp() * 1000)
    for _ in range(400):
        page.wait_for_timeout(5)   # real time
        try:
            if page.evaluate("Date.now()") == want:
                break
        except Exception:
            pass          # the document is still being swapped in
    page.wait_for_timeout(50)
    gating[0] = False
    for r in held:
        r.continue_()
    page.unroute("**/*", gate)
    page.wait_for_load_state("load")
    loaded(page)

def loaded(page):
    """Real-time wait (game time stands still) for the network, the fonts and the images to be done."""
    page.wait_for_load_state("networkidle")
    page.evaluate("() => document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => null))))")

BOOT_UP = ("title-card", "cash", "cutscene", "skip-scene")  # the app has rendered once one of these is on screen

def boot(page, limit_ms=3000):
    """Take the app from "scripts loaded" to its first screen: one fake millisecond at a time while it starts its loading (the route chunk, the
    fonts), then a frame at a time. Returns how many steps that took."""
    spent, steps = 0, 0
    while spent < limit_ms:
        if any(is_up(page, t) for t in BOOT_UP):
            return steps
        n = 1 if spent < 20 else 16
        page.clock.run_for(n)
        _quiet(page)
        spent += n
        steps += 1
    return steps

def reload(page):
    """page.reload() on the frozen clock, the same way the first load is made: the game's requests let through while it loads, held again after."""
    now = page_ms(page)
    _holding(page, False)
    first_load(page, now, reload=True)
    _holding(page)
    boot(page)

def fresh_page(browser, save, ahead_ms=20000):
    """seeded_page for a save stamped a little AHEAD of the page's clock: a running challenge lapses when the app was away for a second
    or more (engine onOffline) and the page boots a second after T0 (G103). Skips the Boston card. Returns (context, page)."""
    pg = seeded_page(browser, save, ahead_ms=ahead_ms, storage={"slice-empire/boston-seen": "1"})
    return pg.context, pg

def clock_page(browser, save, when):
    """seeded_page on a shifted clock: Date is `when` (a local datetime), for the events. Returns (context, page)."""
    pg = seeded_page(browser, save, when=when, keep=True)
    return pg.context, pg

def skip_title(page, timeout=4000):
    """v5.1: a title card opens every launch; tap it away (it would also go by itself in <= 2 s)."""
    try:
        wait_for(page, "title-card", timeout)
        tid(page, "title-card").click()
        wait_for(page, "title-card", 3000, gone=True)
    except Exception:
        pass

DISMISS = ("collect-offline", "skip-scene", "gift-close")  # the offline popup, a due cut-scene, the daily gift calendar (v5.4)

def settle(page, wait=2.5):
    """Dismiss the offline popup, any due cut-scene and the daily gift calendar so the scene is interactive. `wait` game seconds first,
    then one look every 0.5 s: whatever is up is tapped away (0.6 s after the tap), in the same order on every run; two quiet looks end it."""
    advance(page, wait * 1000)
    quiet = 0
    for _ in range(12):  # v4.5: audio preloading can delay the popup or a due beat, so wait for two quiet checks
        up = next((t for t in DISMISS if page.locator(f'[data-testid="{t}"]').count()), None)
        if up:
            tid(page, up).click(); advance(page, 600); quiet = 0
        else:
            quiet += 1
            if quiet >= 2:
                break
            advance(page, 500)

def tap_shop(page):
    """Tap the back wall of the pizzeria (clear of the station tags)."""
    box = tid(page, "shop").bounding_box()
    page.mouse.click(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.22)

def tap_station(page, st):
    """Tap a kitchen station: the shop's own hit-test decides; these points sit on the furniture."""
    box = tid(page, "shop").bounding_box()
    fx = {"prep": 0.31, "oven": 0.46, "counter": 0.6}[st]
    fy = {"prep": 0.5, "oven": 0.45, "counter": 0.5}[st]
    page.mouse.click(box["x"] + box["width"] * fx, box["y"] + box["height"] * fy)

def tid(page, t):
    return page.locator(f'[data-testid="{t}"]').first

# ---- save builders and page helpers shared by the shots (moved out of the run loop) ----
def day_str(offset=0):
    """The date `offset` days from T0, as the game writes it (YYYY-MM-DD)."""
    return (T0 + datetime.timedelta(days=offset)).strftime("%Y-%m-%d")

def played_page(browser, save):
    """Boot `save` (the game rolls its task sets), then add some play on top of what it saved and reload: progress is
    measured from the generated baselines, so every target on screen is the generator's own."""
    pg = seeded_page(browser, save); settle(pg, 3.5)
    pg.evaluate("""(key) => {
        const g = JSON.parse(localStorage.getItem(key));
        const add = {upgrades: 6, walkins: 30, deliveries: 60, baked: 90, ovens: 2, dailyDone: 3, offline: 1};
        for (const k in add) g.stats[k] = (g.stats[k] || 0) + add[k];
        g.totalEarned += 4000; g.rewards.points = 40;
        if (g.rewards.daily.length > 4) g.rewards.daily[4].claimed = true;
        localStorage.setItem(key, JSON.stringify(g));
    }""", KEY)
    reload(pg); skip_title(pg); settle(pg, 3.0)
    return pg

def hood_save(hood, cash=5e5, vehicle=2, **kw):
    return dict(MID_SAVE, cash=cash, vehicle=vehicle, active=hood, scrapbookViewed=8,
                shops=dict(MID_SAVE["shops"], **{hood: shop(**kw)}))

HOOK_PLAY = 300
def hooks_save(order=None, bonus=None, stats=None, **shop_kw):
    # D422: the Suburbs shop at the same mid-game levels as the other fixtures (about 7.7 pies/s), so an order's target (1,100 pies for
    # 2 minutes) and the kitchen counters agree; `sold` leaves room for an order's start count to sit below it
    kw = dict(prep=12, ovens=10, grade=1, counter=9, drivers=6, tables=7, footprint=1, sold=5000,
              decor={"plants": 1, "flooring": 1, "tables": 1, "walls": 1, "signage": 1})
    kw.update(shop_kw)
    sv = hood_save("suburbs", cash=2e4, **kw)
    sv.update(lastSavedAt=T0_MS, playSeconds=HOOK_PLAY, rewards={"giftShownDay": day_str()})
    if order: sv["order"] = dict({"seed": 7, "made": 1, "nextAt": HOOK_PLAY + 400}, **order)
    if bonus: sv["bonus"] = dict({"seed": 7, "spawned": 2, "next": HOOK_PLAY + 400}, **bonus)
    if stats: sv["stats"] = stats
    return sv
def quiet_start(pg, wait=0.2):
    """A short settle: dismiss a due scene or popup, but keep the clock (a golden pizza stays 12 s)."""
    settle(pg, wait)

# ---- saves several fixtures share ----
LATE_SAVE = dict(MID_SAVE, cash=1.5e6, vehicle=3, active="industrial", dronesUnlocked=False,
                 shops={
                     "downtown": shop(prep=85, ovens=80, grade=3, counter=82, drivers=40, tables=60, footprint=3, sold=7e5),
                     "suburbs": shop(prep=75, ovens=70, grade=3, counter=72, drivers=34, tables=50, footprint=3, sold=6e5),
                     "waterfront": shop(prep=66, ovens=60, grade=3, counter=62, drivers=30, tables=45, footprint=2, sold=4e5),
                     "university": shop(prep=58, ovens=52, grade=3, counter=55, drivers=26, tables=38, footprint=2, sold=3e5),
                     "industrial": shop(prep=52, ovens=48, grade=3, counter=50, drivers=22, tables=34, footprint=2, sold=360500),
                     "uptown": shop(managed=False, sold=0),
                 },
                 seenScenes=[f"{n}-{b}" for n in IDS for b in range(1, 5)][:18] + ["uptown-1"], scrapbookViewed=19)
TIED_SAVE = dict(MID_SAVE, cash=500, active="downtown", scrapbookViewed=8,
                 shops=dict(MID_SAVE["shops"], downtown=shop(prep=6, ovens=8, counter=20, drivers=30, tables=4)))
FRUGAL_SAVE = dict(MID_SAVE, cash=1000, vehicle=0, active="downtown", seenScenes=["downtown-1", "downtown-2", "downtown-3"], scrapbookViewed=3,
                   shops={"downtown": shop(managed=False, prep=3, ovens=3, counter=3, drivers=3, sold=40), "suburbs": shop(built=False, managed=False),
                          "waterfront": shop(built=False, managed=False), "university": shop(built=False, managed=False),
                          "industrial": shop(built=False, managed=False), "uptown": shop(built=False, managed=False)})

# ---- per-card fixtures: scripts/fixtures/NN_card.py, each with run(ctx) ----
FIXTURES = os.path.join(ROOT, "scripts", "fixtures")

def fixture_files():
    return sorted(f for f in os.listdir(FIXTURES) if f.endswith(".py") and not f.startswith("_")) if os.path.isdir(FIXTURES) else []

def wanted(name, only):
    """`--only` matches a fixture by its file name without `.py` (56_u1) or by its number prefix alone (56)."""
    stem = name[:-3]
    return only is None or any(stem == t or stem.split("_")[0] == t for t in only)

def run_fixtures(browser, only=None):
    """Import every scripts/fixtures/*.py in sorted order and call its run(ctx). A fixture that raises is reported, not fatal.
    `only` (default: --only on the command line) limits the run to those fixtures.
    ctx has: browser, report, version, out (the screenshots folder)."""
    import importlib.util, types
    only = ONLY if only is None else only
    ctx = types.SimpleNamespace(browser=browser, report=report, version=VERSION, out=OUT)
    names = fixture_files()
    for t in only or []:
        if not any(wanted(n, [t]) for n in names):
            report["errors"].append(f"--only {t}: no such fixture in scripts/fixtures/")
    for name in names:
        if not wanted(name, only):
            continue
        _current["fixture"] = name
        del _missed[:]
        try:
            spec = importlib.util.spec_from_file_location(f"fixture_{name[:-3]}", os.path.join(FIXTURES, name))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            mod.run(ctx)
        except Exception as e:
            report["errors"].append(f"fixture {name} failed: {e}")
        _flush_missed("(none: the fixture ended first)")
