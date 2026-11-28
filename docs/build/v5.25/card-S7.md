# Card S7 — renovation art, University / Industrial / Uptown, and the gift prop (v5.25, lane S)

**Goal:**
- The University, Industrial and Uptown shops get their renovation art, following S6's pattern.
- A free gift waiting in the shop shows as a gift box the player can tap. Its ready state reads at a glance. Tapping it claims the gift.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md` (S6's component names, E9's `freeGiftReady` and `claimFreeGift`); `docs/build/v5.25/renovation.md` (rows for these three shops); `src/components/scene/renovation-props.tsx` (S6); `src/components/scene/protected.ts` (Q8).

## Files
- Own: `src/components/scene/**` and their tests, plus a new fixture `scripts/fixtures/<next number>_reno_b.py` (renovation shots and gift shots).
- Do not touch: `src/engine/**`, `src/content/**`, the reward moment overlay (U7).

## Steps
- [ ] **1. Renovation art:** plaques, the 9 fixtures and the 27 decor items for these three shops. Same size floors and variety rule as S6.
- [ ] **2. Gift prop:**
  - a gift box at a fixed free spot in the shop (not on the WELCOME mat, a station or a head), ≥ 10 pt at 1x;
  - while ready, a gentle bob and a glint every few seconds, with no text;
  - a tap calls `claimFreeGift` and emits `free_gift_claimed` for U7's moment;
  - hidden while not ready.
- [ ] **3. Fixture:** shots of University, Industrial and Uptown at III with all their decor; the gift box ready in Downtown; a shot right after the tap (the U7 moment appears once U7 lands). Use `expect()` before each.

## Checks
- `npx tsc --noEmit`
- `npx jest src/components/scene`
- `npm run format:check`
- the `cover` check (Q8)

## Report
Standard format, plus the fixture name, the gift box's position, and `Unverified:` IDs.
