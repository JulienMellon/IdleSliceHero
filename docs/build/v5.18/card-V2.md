# Card V2 — wide shops, a second floor plan, off-screen cues (v5.18, lanes S and U)

**Goal:** the Restaurant and the Flagship are wider than the screen and scroll; two neighbourhoods use a mirrored floor plan; the player is never lost about what is off screen. Built on card V1's frame.

**Read first:** card V1's comment above `sceneToScreen`; `src/components/scene/layout.ts`; `docs/API.md` (`reportView` in `features/service.ts`: the lamps drive the cues).

## Files
- Own: `src/components/scene/**`, `src/components/storefront.tsx`, `src/components/scroll-cues.tsx` and a pure `scroll-cues-model.ts` with tests (new), `scripts/shots_lib.py` (one helper, `scroll_shop(page, where)`), `scripts/fixtures/140_v2.py`.
- Shared, append-only: `src/components/slots.tsx`.
- Do not touch: `src/engine/**`, `src/content/**` except one new file, `src/content/shop-layout.ts`, for the numbers below.

## Steps
- [x] **1. Widths.** In `shop-layout.ts`: scene widths by footprint 393 / 393 / 393 / 520 / 640, room widths 270 / 295 / 320 / 450 / 570. The first three tiers must not change by a pixel.
- [x] **2. Use the room.** At the two wide tiers the extra width goes to a longer oven bank (the bank must read as better at every step: the D417 rule), a second prep table, a dining room deep enough for all six tables in two rows, and room for the layer props from v5.16 (the warming rack, the menu board, the shift clock) without crowding the counter.
- [x] **3. A second floor plan.** `mirrored: true` for Waterfront and Industrial: kitchen on the right, door on the left. Mirror in the layout module, not in the drawing code, so crew routes, tags and budgets mirror with it. The WELCOME mat stays at the door.
- [x] **4. The cold line.** While `reportView(...).state` is `cold`, draw the queue at `queueShare` of its length (carried from v5.16).
- [x] **5. Off-screen cues.** (cues, the tap-to-scroll and the `askScroll` bus are in; a tap on a report lamp needs report-strip / report-sheet to call `askScroll`: see the report) A chevron at the screen edge when something that wants attention is off screen: a Slammed station (from the report's lamps), a jammed oven, a head's bubble, a tappable station in a hand-run shop. One cue per side, the most urgent. Tapping a cue scrolls there, and tapping a lamp in the shop report scrolls to its station: every place stays reachable by taps alone (Julien's October rule was taps only; the drag is an addition, never a requirement).
- [x] **6. Cost check.** (Flagship 2936 -> 3425 SVG nodes, +17%) Count the SVG nodes of a Flagship before and after and report both. If the count grows by more than 50%, say which group grew and stop before step 7.
- [ ] **7. Carried.** Rows with owner S in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/140_v2.py`, shots 140–147)
140 a Restaurant, scrolled to the kitchen; 141 the same, scrolled to the dining room; 142 a Flagship, centre; 143 a Flagship during a rush with a cue pointing at the Slammed ovens; 144 Waterfront mirrored; 145 Industrial mirrored with a jam off screen and its cue; 146 a cold line with the short queue; 147 a Corner shop, unchanged, for comparison.

## Rules
Overlap fixes go in the pure modules with a budget test that fails on the old code; then run the whole crowd suite. Don't remove the WELCOME mat. 44 pt targets for the cues. Signs stay out of the caption zone.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/140_v2.py`.

## Report
Standard format, plus the node counts from step 6.
