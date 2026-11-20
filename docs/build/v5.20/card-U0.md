# Card U0 — the Store stays reachable after the Starter Pack is offered (v5.20, lane U)

**Goal:** from the moment the Starter Pack is first offered, the diamond chip (the way into the Shop) is on the HUD for good, and every tab of the Shop works: Vanity, Boosters and Store. Today the chip appears only at Nonna's takeover, so a player who taps "Not now" can't find the pack again for about 2,000 pizzas.

**Why (Julien, 2026-11-20):** "I want the store to be available to the player right after the starter pack is first offered." DECISIONS #47.

**Read first:** `src/components/endgame/diamond-chip.tsx` (it shows only when `rewardsUnlocked`); `src/components/store/starter-sheet.tsx` (it sets `prefs.starterOffered` when the sheet goes up); `src/app/shop.tsx`.

## Files
- Own: `src/components/endgame/diamond-chip.tsx`, `src/app/shop.tsx` (only if a tab checks `rewardsUnlocked`), their tests, one fixture `scripts/fixtures/<next free number>_u0.py`.
- Do not touch: `src/components/store/**`, `src/engine/**`.

## Steps
- [ ] **1.** The chip shows when `rewardsUnlocked(game)` **or** `prefs.starterOffered` is true. It reads the store prefs as a primitive selector (no re-render per tick).
- [ ] **2.** No Shop tab is locked by rewards: check that Vanity, Boosters and Store all open and work before the takeover (a player may hold 0 diamonds; that's fine).
- [ ] **3. Tests:** chip hidden on a fresh save, shown once the sheet has been offered (bought or "Not now"), shown after the takeover on an old save that never saw the sheet.
- [ ] **4. Fixture:** a save just past the tutorial with `starterOffered: true`: the chip on the HUD, then the Shop's Store tab with the Starter Pack.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
