# Card U3 — ad buttons, store, Nonna's Plus, Settings (v5.17, lanes U and N)

**Goal:** every place the rewards design promised an ad button gets one; the store sells the five products; Settings has what App Review and the privacy policy require.

**Read first:** `docs/API.md` (`src/services`); `sed -n '97,116p' docs/REWARDS.md`; `src/app/settings.tsx` (101 lines); `src/app/shop.tsx` from v5.15.

## Files
- Own: `src/app/settings.tsx`, `src/app/shop.tsx`, `src/components/rewards-ui.tsx`, `rewards-model.ts`, `src/components/game-ui.tsx` (the welcome-back gift only), `src/components/store/**` (new), `src/components/scene/cosmetics.ts` (one entry: `awning-founder`, a red-and-white striped variant of the awning), `scripts/fixtures/98_u3.py`.
- Shared, append-only: `src/components/slots.tsx`, `src/store/game-store.ts` (actions that call the services and apply grants).
- Do not touch: `src/services/**`, `src/engine/**` except calling existing functions.

## Steps
- [ ] **1. One ad-button component** (`store/ad-button.tsx`) with one rule: if the player owns Nonna's Plus, the benefit is given at once and the button says so; otherwise it shows the film icon, calls `ads.show`, and on `unavailable` or `dismissed` lets the player continue without the benefit and without an error screen. Track `ad_offered`, `ad_started`, `ad_completed`.
- [ ] **2. Placements.** Double a daily, weekly or gift claim; reroll one daily task per day; save a streak once per 30-day cycle (beside the 20-diamond option); 2× offline earnings in the welcome-back gift (replaces, never stacks with, a timed boost); one free booster a day on the booster shelf. The limits live in a pure model and are tested.
- [ ] **3. Store tab** in `app/shop.tsx`: Starter Pack (offered once after the tutorial as a sheet, then in the tab until bought), Nonna's Plus, three diamond packs. Prices come from `purchases.products()`; while loading or on failure show the pack without a price and a disabled button, never a placeholder price. Track `iap_viewed` and `iap_purchased`.
- [ ] **4. Settings.** Add, under the existing sections: Privacy Policy and Support (open the site URLs from a constants file with `expo-web-browser`); "Share anonymous analytics" toggle (default on, calls `setOptOut`); Install ID with a Copy button (for data requests); Restore Purchases with a result line; the build number stays. Keep Stats, Audio and Start over.
- [ ] **5. No paid randomness.** Nothing bought with money or diamonds gives a random reward. If you find such a path, report it instead of shipping it.
- [ ] **6. Carried.** Rows with owner U in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/98_u3.py`, shots 98–105)
Use the web stubs' query flags. 98 claim sheet with the double button; 99 the same for a Plus owner; 100 welcome-back gift with 2× offline; 101 store tab with prices; 102 store tab while prices load; 103 Starter Pack sheet; 104 Settings, new rows; 105 Settings after Restore.

## Rules
44 pt targets. Every new control has an `accessibilityLabel` and role. Strings fit at iPhone SE width.

## Checks
`npx tsc --noEmit`; `npx jest src/components src/services`; `python3 -m py_compile scripts/fixtures/98_u3.py`.
