# Card N3 — Starter Pack retune (v5.25, lane N)

**Goal:** the Starter Pack keeps its price and product id. It now gives cash worth about a third of the way to Suburbs (about $7K, using E8's fitted number), 400 💎 and a 2x income boost for 30 minutes. Its App Store Connect description on `LAUNCH-TRACK.md` says the same.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md` (E8's Starter Pack cash); `src/services/grants.ts`, `src/services/types.ts`, `src/services/purchases.web.ts`; `src/components/store/store-model.ts`, `store-tab.tsx`; `docs/PRICING-STRATEGY.md` (the Starter Pack section).

## Files
- Own: `src/services/**`, `src/components/store/**` and their tests (`src/services/__tests__/grants.test.ts`, `src/components/store/__tests__/{store-model,store-actions,founder-awning}.test.ts`), plus the Starter Pack lines of `docs/build/LAUNCH-TRACK.md` and `docs/PRICING-STRATEGY.md`.
- Do not touch: `src/engine/**`. Grant the boost through the existing timed-boost API (grep `docs/API.md` for `addBoost` or `boosts`). If none fits, write `Needs: E9 timed-boost grant` and stop that step.

## Steps
- [ ] **1. Grant:** the Starter Pack's grant gives cash (from WAVE-NOTES, whole dollars), 400 💎 and a 2x boost for 1,800 s. Its price and product id stay unchanged.
- [ ] **2. Store text:** the pack card lists all three items. The visible copy is the short placeholder `$7K + 400 💎 + 2x for 30 min`, and W6/T3 may replace it.
- [ ] **3. LAUNCH-TRACK:** rewrite the Starter Pack's App Store Connect description to list the three items. Keep its length under 170 characters.
- [ ] **4. Tests:** the grant contents, a boost that is active right after the buy, the store-model row.

## Checks
- `npx tsc --noEmit`
- `npx jest src/services src/components/store`
- `npm run format:check`
- `scripts/check-no-test-mode.sh`

## Report
Standard format, plus the new description text, and a reminder that Julien must paste it into App Store Connect.
