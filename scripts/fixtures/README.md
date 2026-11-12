# Screenshot fixtures
One file per card, `NN_card.py`, NN = the first shot number the card owns (e.g. `56_trophies.py`).
`screenshots.py` runs its own shots, then calls `run(ctx)` of each file here in sorted order.
`ctx` has `browser`, `report`, `version`, `out`. A raise lands in `report["errors"]`.
```python
from shots_lib import *   # seeded_page, settle, shot, tid, tap_shop, hood_save, report, ...

def run(ctx):
    page = seeded_page(ctx.browser, hood_save("downtown")); settle(page)
    shot(page, "56-trophies", 0.5)
```
