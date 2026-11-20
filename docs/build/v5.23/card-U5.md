# Card U5 — the Store chip from Chapter 1; the Boosters shop (v5.23, lane U)

**Goal:** the diamond chip (the way into the Shop) shows from the end of Chapter 1, the Shop opens on the Store tab when asked, Vanity is padlocked until Nonna's takeover, and the Boosters tab sells E5's three boosters above the free shelf.

**Read first:** `src/components/endgame/diamond-chip.tsx` (it shows only after `rewardsUnlocked`); `src/app/shop.tsx` (tabs, the booster shelf, the free daily ad); `src/components/endgame/shop-model.ts`; E5's selectors; `docs/story/COPY-v5.23.md`.

## Files
- Own: `src/components/endgame/**`, `src/app/shop.tsx`, their tests, one fixture `scripts/fixtures/<next free number>_u5.py`.
- Do not touch: `src/components/store/**` (N1), `src/engine/**` (E5), `src/services/**`.

## Steps
- [ ] **1. Chip:** visible from tutorial step 16 on (`tutorial >= 16`: Chapter 1 is over; card E6 makes 16 the Store intro) or when rewards are unlocked. Don't compare with `TUTORIAL_DONE`, which E6 moves to 18. Register coach target `hud:store`. A dot on it once at the takeover when the Starter Pack isn't owned (cleared when the Shop opens).
- [ ] **2. Shop tabs:** Vanity · Boosters · Store. A route param `tab=store` opens the Store tab. Vanity shows a padlock and "Opens when Nonna takes over" until rewards unlock. Pass `onClose` (back to the game) to N1's Starter card.
- [ ] **3. Boosters tab:** a "Buy" section above the free shelf: three cards with name, duration, "2×", W4's one-liner, "≈ {cash} at your shop's pace" (E5's `boosterPace`), the diamond price on the button; a running slot shows `booster.running`; a refusal shows `booster.full`. Track `booster_bought{id}`.
- [ ] **4. The nudge:** the first time the player taps an unaffordable look, Nonna's `store.nudge` line as a small card (not a pop-up sheet), once per save.
- [ ] **5. Analytics** `store_opened{from: 'chip' | 'intro' | 'nudge'}`.
- [ ] **6. Tests and fixture:** chip before and after Chapter 1, Vanity locked, Boosters with a running slot, the refusal.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
