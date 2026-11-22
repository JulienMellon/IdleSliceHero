# Card U5 — the Store chip from Chapter 1; the Boosters shop (v5.23, lane U)

**Goal:** the diamond chip (the way into the Shop) shows from the moment the Starter Pack is first offered (the Store intro, step 16), the Shop opens on the Store tab when asked, every tab works from then on, and the Boosters tab sells E5's three boosters above the free shelf.

**Read first:** `src/components/endgame/diamond-chip.tsx` (it shows only after `rewardsUnlocked`); `src/app/shop.tsx` (tabs, the booster shelf, the free daily ad); `src/components/endgame/shop-model.ts`; E5's selectors; `docs/story/COPY-v5.23.md`.

## Files
- Own: `src/components/endgame/**`, `src/app/shop.tsx`, their tests, one fixture `scripts/fixtures/<next free number>_u5.py`.
- Do not touch: `src/components/store/**` (N1), `src/engine/**` (E5), `src/services/**`.

## Steps
- [x] **1. Chip:** visible from tutorial step 16 on (`tutorial >= 16`: the Store intro, where the Starter Pack is first offered; card E6 makes 16 the intro), or when `prefs.starterOffered` (v5.20 card U0's rule, kept for saves that saw the old pop-up), or when rewards are unlocked. Don't compare with `TUTORIAL_DONE`, which E6 moves to 18. Register coach target `hud:store`. A dot on it once at the takeover when the Starter Pack isn't owned (cleared when the Shop opens).
- [x] **2. Shop tabs:** Vanity · Boosters · Store. A route param `tab=store` opens the Store tab. **No tab is locked** (DECISIONS #47): Vanity, Boosters and Store all work from the intro on. Pass `onClose` (back to the game) to N1's Starter card.
- [x] **3. Boosters tab:** a "Buy" section above the free shelf: three cards with name, duration, "2×", W4's one-liner, "≈ {cash} at your shop's pace" (E5's `boosterPace`), the diamond price on the button; a running slot shows `booster.running`; a refusal shows `booster.full`. Track `booster_bought{id}`.
- [x] **4. The nudge:** the first time the player taps an unaffordable look, Nonna's `store.nudge` line as a small card (not a pop-up sheet), once per save.
- [x] **5. Analytics** `store_opened{from: 'chip' | 'intro' | 'nudge'}`.
- [x] **6. Tests and fixture:** chip before and after the intro, Vanity open before the takeover, Boosters with a running slot, the refusal.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
