# Card Q3 — layout checks at every shot (v5.15-loop, scripts)

**Goal:** a control that is too small, text that is too small, and text that is cut off fail verify. The critic's rounds go to craft and fun.

**Why (measured 2026-11-13, `docs/PLAN-loop-improvements.md`):**
- Fix round r3 of v5.15 changed the HUD's round buttons from 44 to 40 pt because a critic note suggested it. Nothing flagged that it broke the rule in `tap-targets.ts`.
- 19 controls are drawn under 44 pt, and about 30 strings are under 10 pt ("DRIVERS" and "COUNTER" at 8.5 pt in 44 shots; "need $…" at 9 pt, 7.5 pt on the flagship). None is in an open-notes table.
- Half of v5.15's bug notes were clipped or covered text in the HUD and the sidewalk row (G95, G98, G101, G102).

**Julien's decisions (2026-11-13, DECISIONS #29 to #31):**
- **Tap targets:** a control passes if it is drawn at 44 pt or more in both directions, **or** at 40 pt or more with a `hitSlop` that a test in `src/components/__tests__/tap-targets.test.ts` proves reaches 44 pt inside space its parent owns. Under 40 pt drawn always fails. Close keeps its existing exception.
- **Text:** 10 pt minimum.
- Every control now under the rule gets fixed in v5.16 (card U5). So the allowlist you write here is a to-do list, not a list of exceptions.

**This card lifts one rule of your brief:** you may run `scripts/screenshots.py`. Develop with `--only`.

**Read first:** `docs/build/v5.15-loop/poc/layout_probe.py` (the rough probe and what it found); `shot()` in `scripts/shots_lib.py`; `src/components/tap-targets.ts` (read only).

## Files
- Own: `scripts/shots_lib.py` (the probe, called from `shot()`), `scripts/layout_check.py` (new), `scripts/layout_allow.json` (new), `scripts/screenshots.py` (one call at the end), `scripts/fixtures/README.md`.
- Do not touch: `src/**`, `docs/build/README.md`, `.claude/agents/**` (card Q4), `scripts/review_shots.py`.

## Steps
- [ ] **1. The probe.** In `shot()`, after the screenshot, evaluate one function in the page and keep its result under the shot's name. Start from `poc/layout_probe.py`. It reports four kinds of finding, each with a stable key:
  - `tap`: an element with `role="button"` or `tabindex="0"` that is visible and not covered, drawn under 44 pt in either direction. Key: its `data-testid` (or its text if it has none), with the drawn width and height.
  - `text`: visible text with a computed font size under 10 px. Key: the nearest ancestor's `data-testid` plus the text with digits replaced by `#`.
  - `clip`: text that is cut off (step 3).
  - `edge`: text that starts left of 0 or ends right of the viewport. Skip text inside a horizontal scroller (an ancestor with `overflow-x: auto` or `scroll`): the shop tabs scroll by design.
- [ ] **2. The check.** `scripts/layout_check.py <label>` reads the findings, drops those matched by `scripts/layout_allow.json`, and writes `screenshots/<label>/layout.json`: `{"new": <count>, "findings": [{kind, key, shots, detail}], "allowed": <count>, "stale": [allowlist entries that matched nothing]}`. It prints one line: `layout: <n> new, <m> allowed, <k> stale`. `screenshots.py` always writes the raw findings to `screenshots/<label>/layout-raw.json`, and calls `layout_check.py` itself at the end of a full run. After an `--only` run a programmer can call it by hand; entries for shots that were not taken then show up as `stale`, which is expected.
- [ ] **3. Clipped text, done properly.** The rough probe compared `scrollWidth` with `clientWidth`; it raised 16 doubtful hits and missed the one known case. Find how react-native-web renders `numberOfLines` and `adjustsFontSizeToFit` in this build and test for that. **It must find D477** on the current code: the goal bar in shot `05b2-heads-drawer` reads "Upgrade fleet to Cars · +$83…". Also count as clipped any visible text that ends in "…" when its source string does not. If you cannot make it reliable, leave `clip` out of `new`, keep it in `findings`, and report `PARTIAL`; VERSION.md has a default.
- [ ] **4. The allowlist.** `scripts/layout_allow.json`: a list of `{kind, key, reason, card}`. Fill it from a full run on the current code so that `new` is 0:
  - Every `tap` and `text` finding gets `"card": "U5"` and a one-line reason ("HUD round button, 40 pt drawn; U5 adds the proof"). 
  - Close buttons (`close-upgrades`, `close-tasks`) get `"card": null` and the reason "documented exception in tap-targets.ts".
  - An entry with `"proof": "<test name>"` is how a 40 to 43 pt control passes for good: `layout_check.py` accepts a `tap` finding only if it is drawn at 40 pt or more **and** its entry names a proof. Entries marked `U5` are accepted without a proof until that card lands.
- [ ] **5. A narrow phone (do this last; skip it if the card is running long).** `python3 scripts/screenshots.py <label> --viewport 375x667` re-runs the fixtures at iPhone SE size into `screenshots/<label>-se/`, with the probe on. It is not part of verify yet; report what it finds as a count per kind.

## Rules
- The probe sees the DOM, not the SVG scene. Don't try to check the scene here; scene overlaps stay with the budget tests in `src/components/scene/__tests__/`.
- A key must not contain a number that changes with the save (cash, prices), or the allowlist will never match twice.
- The probe adds no waiting: one `page.evaluate` per shot.

## Checks
- `python3 -m py_compile scripts/*.py scripts/fixtures/*.py`
- Full run on the current code: the last line is `layout: 0 new, <m> allowed, 0 stale`.
- Remove the `open-city` entry from the allowlist, run `python3 scripts/layout_check.py <label>` again: it prints `1 new`. Put the entry back.
- `clip` finds D477 in `05b2-heads-drawer` (or the report says `PARTIAL` and why).
- Report the counts per kind, and the full-run time with the probe on.
