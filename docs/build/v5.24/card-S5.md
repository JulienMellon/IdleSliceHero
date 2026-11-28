# Card S5 — looks art, part 2, and the set flourish (v5.24, lane S)

**Goal:** the University, Industrial and Uptown sets, in the same way as S4, and the once-per-set flourish when a set is completed.

**Read first:** `docs/build/v5.24/card-S4.md` (the same rules and helpers); `docs/build/v5.24/catalog.md` (your rows: sets `university`, `industrial`, `uptown`); E7's `set_complete` event; the milestone confetti in `scene/moments.ts`.

## Files
- Own: `src/components/scene/**`, `src/components/storefront.tsx`, one fixture `scripts/fixtures/<next free number>_s5.py`.
- Do not touch: `src/engine/**`, `src/content/**`, `endgame/**`.

## Steps
- [x] **1. Draw** your three sets and their thumbnails (`LookThumb` from S4).
- [x] **2. The flourish:** on `set_complete` for the shop on screen, the diners cheer (the existing cheer pose), confetti from the sign (reuse the milestone confetti), and the set's head or manager says `set.<set>.done` (W5) as a bubble. 3 s, once.
- [x] **3. Budget tests** as S4; **fixture:** each set worn; the flourish mid-play.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
