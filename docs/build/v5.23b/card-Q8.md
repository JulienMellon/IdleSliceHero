# Card Q8 — protected elements are never covered (v5.23b, lanes scripts + S)

**Goal:** a check that fails when anything opaque covers the WELCOME mat, the entrance or a station worker's face. The critic log has about 8 rounds where the owner-required mat was removed or hidden: G54 (removed), D232, D260, D276 (people standing on it), D405 (the Buy-both pill), D456 (the ×1/×10/MAX slab) and D479 (the report strip), plus door overlaps G48 to G69. Each was found by the critic, never by a test. After this card, a new chip, strip or prop that lands on them fails before review.

**Read first:** `docs/build/v5.23b/VERSION.md` (Defaults: protected elements, "covered"); `src/components/scene/ladder.ts` (`matRect`, `doorRect`, `obstacles`), `strip-clear.ts` (`stripTop`), `src/components/tap-targets.ts` (`SIDEWALK_ROW`), `src/components/report/report-model.ts` (`STRIP`), `scene/cast.ts` (staff heads); `scripts/shots_lib.py` (`LAYOUT_PROBE`, `layout_probe`), `scripts/layout_check.py` (its docstring), and `scripts/layout_allow.json`.

## Files
- Own: new `src/components/scene/protected.ts` and `scene/__tests__/protected.test.ts`; in `storefront.tsx`, one web-only, dev-only line that publishes the protected rects in page pixels (for example `window.__protected = [{id, x0, y0, x1, y1}]`, refreshed on layout); `scripts/shots_lib.py` (`LAYOUT_PROBE` only), `scripts/layout_check.py`, `scripts/layout_allow.json`.
- Do not touch: anything else in `scene/**` (S6 has finished by now; a real overlap you find is a row for the critic or a one-line fix you name), and U7's or U8's files.

## Steps
- [x] **1. The scene rule.** `protected.ts` exports `protectedRects(lay, fit)`: the mat, the door, and each staff member's head rect at their station. It also exports `sceneCovers(lay, inputs)`: the fixed scene rects that may never sit on them (parked vehicles, the A-frame, the neighbourhood prop, the patio, cosmetics, the report strip from `stripTop`, the sidewalk row from `SIDEWALK_ROW`).
- [x] **2. The test.** For every city × hood × footprint × managed/unmanaged × mirrored plan, no cover rect overlaps a protected rect by more than 10% of the protected rect's area. Before you trust it, confirm it fails on a deliberate regression: move the parked van onto the mat.
- [x] **3. The probe kind.** In `LAYOUT_PROBE`, read `window.__protected`. For each rect, sample a 5×3 grid of points with `elementFromPoint`, and count a point as covered when the top element is not inside the scene SVG and is not `pointer-events: none` and transparent. More than 10% of points covered gives a `cover` finding, `key = <protected id> | <testid of the top element>`. This is how HTML overlays (strip, chips, banners, the gift lane, sheets) get caught.
- [x] **4. Sheets and scrims are fine.** A full-screen sheet or scrim (the gift calendar, the night oven, the offline popup, the coach scrim) covering the scene is expected. Skip a shot when the top element belongs to a modal root, and say in the docstring how a modal root is recognised.
- [x] **5. Today's findings.** Run the full screenshot set once with `dev`. Each `cover` finding is either a real overlap (write it into your report as a proposed critic row, with the shot) or an allowlist entry with a reason. Don't fix scene art in this card.
- [x] **6. Docs.** Add the `cover` kind to `layout_check.py`'s docstring and to `scripts/fixtures/README.md` where the probe's kinds are listed.

## Checks
`npx tsc --noEmit`; `npx jest src/components/scene`; `npm run format:check`; `python3 scripts/screenshots.py dev` (this card runs the full set; it is the only way to see every shot's covers), then `python3 scripts/layout_check.py dev`.

## Report
Standard format, plus the `cover` count, each finding (real or allowed, with its reason), and the regression you used to prove the test fails.
