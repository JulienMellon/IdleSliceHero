"""PoC: run the normal screenshot suite, but at every shot also ask the DOM for clipped text, off-screen text and small tap targets."""
import sys, os, json, runpy
sys.argv = ["screenshots.py", "lint"]
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import shots_lib as L
PROBE = """() => {
  const out = {trunc: [], off: [], small: [], tiny: []}; const vw = innerWidth;
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = r.top + r.height / 2;
    if (cy < 0 || cy > innerHeight) return null;
    const top = document.elementFromPoint(cx, cy); if (!top || !(el === top || el.contains(top) || top.contains(el))) return null;   // covered by a sheet
    return r; };
  for (const el of document.querySelectorAll('div[dir="auto"], span[dir="auto"]')) {
    const t = el.textContent.trim(); if (!t) continue; const r = vis(el); if (!r) continue; const cs = getComputedStyle(el);
    if (cs.overflow !== 'visible' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) out.trunc.push([t.slice(0, 48), el.scrollWidth, el.clientWidth]);
    if (r.right > vw + 1 || r.left < -1) out.off.push([t.slice(0, 48), Math.round(r.left), Math.round(r.right)]);
    if (parseFloat(cs.fontSize) < 10) out.tiny.push([t.slice(0, 24), parseFloat(cs.fontSize)]);
  }
  for (const el of document.querySelectorAll('[role="button"], [tabindex="0"]')) { const r = vis(el); if (!r) continue;
    if (r.width < 43.5 || r.height < 43.5) out.small.push([el.getAttribute('data-testid') || el.textContent.trim().slice(0, 24), Math.round(r.width), Math.round(r.height)]); }
  return out; }"""
found = {}
_shot = L.shot
def shot(page, name, wait=0.6):
    _shot(page, name, wait)
    try: found[name] = page.evaluate(PROBE)
    except Exception as e: found[name] = {"error": str(e)[:120]}
    json.dump(found, open("/tmp/layout-probe.json", "w"), indent=1)
L.shot = shot
runpy.run_path(os.path.join(ROOT, "scripts", "screenshots.py"), run_name="__main__")
