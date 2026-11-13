# Screenshot fixtures
One file per group of shots, `NN_name.py`, NN = the first shot number the file owns. `scripts/screenshots.py` launches the browser and calls
`run(ctx)` of each file here in sorted order, then writes `report.json`. `ctx` has `browser`, `report`, `version`, `out`. A raise lands in
`report["errors"]`. A fixture never needs another fixture's page: it seeds its own with `seeded_page`.

| file | shots |
|---|---|
| `00_boot.py` | 00-04 fresh install: title card, opening cut-scene, new game, 20 s of play (sets `report["loaded"]`) |
| `05_midgame.py` | 05-05c mid-game, upgrades sheet, unmanaged shop, City |
| `06_scrapbook_offline.py` | 06 scrapbook, 07 offline popup |
| `09_lategame.py` | 08-15a late game, flagship, Uptown, 16 tied drawer, 17 locked Suburbs, 18 sold sign, 25 neighbourhood looks |
| `19_story_props.py` | 19 recipe card, 20 offline cap, 21 Pier 9 bid, 22 perk card, 23 perk banner |
| `24_settings.py` | 24 settings audio |
| `29_rewards.py` | 29-33 tasks and the gift calendar |
| `34_sidewalk.py` | 34-38 sidewalk: expand, bundle, rush combo, GM hire, locked goal |
| `39_ladder.py` | 39-46 visual ladder, milestone, queues, patio |
| `47_hooks.py` | 47-47c golden pizza, 48-50 special orders |
| `51_return.py` | 51 night oven, 52-54 welcome-back gift, 55/55b teaser |
| `56_u1.py` | 56-65 endgame (card U1) |
| `66_s1.py` | 66-73 cosmetics, heads, cameo (card S1) |

## One fixture at a time
```
npx expo export --platform web > /tmp/export.log 2>&1     # once per code change
python3 scripts/screenshots.py dev --only 56_u1,05_midgame # just those files
python3 scripts/screenshots.py dev --only 56               # a number prefix alone matches too
```
`--only` takes file names without `.py` (or their number prefix), comma separated. `report.json` then carries `"only": [...]`, so a partial run is never
mistaken for a full one; a name that matches no file is an error. Use a scratch label (`dev`, `<version>-b`): both are git-ignored.

## Fixtures assert their state
```python
from shots_lib import *   # seeded_page, settle, shot, tid, expect, expect_text, tap_shop, hood_save, report, ...

def run(ctx):
    page = seeded_page(ctx.browser, hood_save("downtown")); settle(page)
    expect(page, "order-rush")                       # wait for [data-testid] (timeout=5000 ms)
    expect_text(page, "challenge-progress", r"\d+ ?/ ?\d+")   # its text matches the regex
    shot(page, "56-trophies", 0.5)
```
`expect` and `expect_text` return True or False. A miss does not stop the fixture: it adds `fixture <file>: expected <what> before shot <name>` to
`report["errors"]`, and the shot is still taken so you can look at it. Put one before every shot whose point is a state rather than a screen.
`expect_text(page, None, pattern)` searches the scene's SVG text (a head's bark has no test ID). Saves shared by several fixtures live in
`shots_lib.py` (`MID_SAVE`, `LATE_SAVE`, `TIED_SAVE`, `FRUGAL_SAVE`, `hood_save`, `hooks_save`).
