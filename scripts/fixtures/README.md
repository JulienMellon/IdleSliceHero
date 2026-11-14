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

## Game time is frozen (Q1)
Every page runs on Playwright's fake clock, frozen before the app boots, so two runs of one build give the same pixels (`review_shots.py`
then flags only what the code changed). The rules:
- **`T0`** (`shots_lib.py`) is the one fixed moment: Wednesday 2026-11-11 12:00 local. Saves are stamped from `T0`/`T0_MS`/`now_ms` and dates
  from `day_str()`; never read `time.time()` or `datetime.now()`. Shots on another day pass `when=` (see `clock_page`, shots 62/62b).
- **Game time moves only when a fixture moves it**: `advance(page, ms)`, `settle`, `shot(page, name, wait)`, `expect`, `expect_text`,
  `wait_for(page, testid)` and `until(page, check)` all step the fake clock. `time.sleep` and `page.wait_for_timeout` are real time and
  give the game none; a locator's own `wait_for`/`wait_for_function` waits in real time, so a state that needs game time never shows up.
  `page_ms(page)` is the page's `Date.now()`.
- **`seeded_page`** (and `fresh_page`, `clock_page`, thin wrappers) boots on the frozen clock and returns with the title card tapped away.
  Pass `title=False` to keep it, `save=None` for a fresh install.
- The page gets four things a plain Chromium does not: no `MessageChannel` (React's scheduler then runs on the fake `setTimeout`), a
  `ResizeObserver` and `requestAnimationFrame` that run on the fake clock (a 16 ms grid of `Date.now()`), and its own requests held until
  the clock stands still (`_quiet`). Without them a step ended in a different state on each run. Do not add a real-time wait around a click.
- Two runs of one build are byte-identical. Check with `python3 scripts/screenshots.py dev`, then `dev-b`, then
  `python3 scripts/review_shots.py dev-b dev | tail -1` (`0 new, 0 changed`). If a new shot differs between two runs, find what moves
  before changing a wait: `document.getAnimations()` lists CSS animations, and anything that reads the real clock shows up as a shot that
  changes with machine load.

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

## Layout checks at every shot (Q3)
`shot()` ends with one `page.evaluate` (no waiting, no clock step) that reads the DOM and keeps what it found under the shot's name.
`screenshots.py` writes all of it to `screenshots/<label>/layout-raw.json`; after a **full** run it calls `scripts/layout_check.py <label>`, which
drops what `scripts/layout_allow.json` accepts, writes `layout.json` and prints `layout: <n> new, <m> allowed, <k> stale`. Verify wants `0 new`.
After a `--only` run call it by hand: `python3 scripts/layout_check.py dev`; the entries of shots you did not take show up as `stale`, which is expected.

| kind | what it is | key (stable across saves) |
|---|---|---|
| `tap` | a visible, uncovered `role="button"` / `tabindex="0"` drawn under 44 px in either direction | its `data-testid` (its text if none); `detail` is `WxH` |
| `text` | visible text with a computed font size under 10 px | nearest ancestor's `data-testid` + the text, a number (with K/M/B/T) as `#` |
| `clip` | text that is cut off: a box that hides its overflow and whose text (measured with a Range) is wider or taller than it, or text that itself ends in "…" and its source does not | same |
| `edge` | text starting left of 0 or ending right of the viewport (not inside a horizontal scroller: the shop tabs scroll) | same |

How a cut-off shows in this build: react-native-web draws `numberOfLines={1}` as `overflow:hidden; white-space:nowrap; text-overflow:ellipsis` and
`numberOfLines={n}` as `-webkit-line-clamp:n`; `adjustsFontSizeToFit` does nothing. `scrollWidth` vs `clientWidth` rounds both sides to whole pixels and
misses a 1 px cut (D477: "+$83/s" is 41.8 px wide in a 40.5 px box), so the probe measures the text with a `Range`. The ellipsis is not in the DOM.

**The allowlist is a to-do list, not a list of exceptions.** An entry is `{kind, key, reason, card}`:
- `"card": "U5"`: a control or text under the rule that card U5 fixes; accepted until U5 lands, then U5 deletes the entry.
- `"card": null`: a documented exception (the Close buttons, `tap-targets.ts`).
- `"proof": "<test name>"` on a `tap` entry: the control is drawn at 40 to 43 px and that test in `src/components/__tests__/tap-targets.test.ts` proves its
  hitSlop reaches 44 pt inside space its parent owns. This is the only way a 40 to 43 px control passes for good; it needs 40 px drawn both ways.
  Under 40 px drawn only a `U5` or `null` entry lets it through.
- `"drawn": <px>` on a `tap` entry: the shortest side when the entry was written; a control that gets shorter than that is new again.
A `stale` entry matched nothing in the run: delete it (the problem is fixed) or check that the fixture still reaches that shot.

## A narrow phone
`python3 scripts/screenshots.py <label> --viewport 375x667` runs the fixtures at iPhone SE size into `screenshots/<label>-se/` with the probe on and
prints the raw count per kind at the end. It is not part of verify (the allowlist is for the normal phone), and it does not call `layout_check.py`.
