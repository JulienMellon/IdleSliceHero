import sys, json
from pathlib import Path
from PIL import Image, ImageChops
root = Path(sys.argv[1]); a, b = sys.argv[2], sys.argv[3]
def frac(p, q):
    x = Image.open(p).convert("RGB"); y = Image.open(q).convert("RGB")
    if x.size != y.size: return 1.0, None
    d = ImageChops.difference(x, y); r, g, bl = d.split()
    w = ImageChops.lighter(ImageChops.lighter(r, g), bl)
    h = w.histogram(); over = sum(h[25:])
    bbox = w.point(lambda v: 255 if v > 24 else 0).getbbox()
    return over / (x.size[0] * x.size[1]), bbox
rows = []
for p in sorted((root / b).glob("*.png")):
    q = root / a / p.name
    if not q.exists(): rows.append((p.name, None, None)); continue
    f, bb = frac(q, p); rows.append((p.name, round(f * 100, 2), bb))
new = [r for r in rows if r[1] is None]; old = [r for r in rows if r[1] is not None]
same = [r for r in old if r[1] < 0.5]
bands = {"<0.5 (same)": 0, "0.5-2": 0, "2-5": 0, "5-15": 0, ">15": 0}
for n, f, _ in old:
    k = "<0.5 (same)" if f < 0.5 else "0.5-2" if f < 2 else "2-5" if f < 5 else "5-15" if f < 15 else ">15"
    bands[k] += 1
print(a, "->", b, "total", len(rows), "new", len(new), "changed", len(old) - len(same), "same", len(same))
print(bands)
if "-v" in sys.argv:
    for n, f, bb in old: print(f"{f:6.2f} {bb} {n}")
