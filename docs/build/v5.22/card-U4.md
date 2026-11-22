# Card U4 — capacity on the cards; the pointers go (v5.22, lane U)

**Goal:** every upgrade card (sidewalk and drawer) says what the station can handle now and after the buy ("Ovens · 18/min → 22"). Nothing in the sidewalk or drawer ranks, tints or bundles stations.

**Read first:** `src/components/sidewalk-model.ts`, `src/components/sidewalk-row.tsx`, `src/components/drawer-model.ts`, the drawer block of `src/app/index.tsx`, `BuyButton` in `src/components/game-ui.tsx`; E3's `capacity`.

## Files
- Own: `src/components/sidewalk-model.ts`, `sidewalk-row.tsx`, `drawer-model.ts`, the drawer block of `src/app/index.tsx`, `BuyButton`'s `saving`/`progress` props in `game-ui.tsx`, their tests, one fixture `scripts/fixtures/<next free number>_u4.py`.
- Do not touch: `src/components/report/**` (U3), `scene/**` (S3).

## Steps
- [x] **1. Capacity line.** Each station card's foot: `<n>/min → <m>` (the station's capacity before and after, from E3's `capacityAfter(g, id, what)`). Drivers card: deliveries a minute. Hires: "Marco takes the prep table" (the hire's effect in words, no number). Fleet: deliveries a minute. Expand, grade, decor keep their own effect lines, but never a "+$/min".
- [x] **2. Remove:** `upgradeGain`'s use in card lines, `effectLine`/`noGainLine` for stations, `tiedBundle`, `buyBundle`, `showBundlePill`, the bundle card in `sidewalkSlots`, the drawer header's "Bottleneck: …" (the header is the shop's title alone, or U3's strip line), the `frame: 'hot' | 'waiting'` and `saving` looks if anything still sets them after the tutorial.
- [x] **3. Chapter 1 still works:** steps 9–10 light `walk:ovens`; the card needs no special look.
- [x] **4. Tests and fixture:** sidewalk and drawer for a shop short on ovens (nothing on the ovens card differs from the others but its numbers), and a tied shop (no bundle card).

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format, plus every removed export.
