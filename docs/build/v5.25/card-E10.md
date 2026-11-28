# Card E10 — shop renovation, engine and data (v5.25, lane E)

**Goal:** a shop at ★★★ can be renovated up to 3 times. Each renovation resets its stations to level 1, gives the shop a permanent income multiplier (x2, x3, x4), a plaque (I/II/III), one fixture upgrade, and opens a new tier of 3 cash decor items for that shop. Old shops stay worth visiting: Downtown and Suburbs each earn ≥ 10% of total income at every later hood opening, and the Home city takes about 7 days.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md`; `src/content/layers.ts` (~108-119, stars and decor tiers); `src/content/tuning.ts` (`DECOR_TIER_COST`); `src/engine/features/franchise.ts` (`KEPT_FIELDS`, `RESET_FIELDS` ~94-115); `src/engine/features/index.ts` (the append-only feature list); `src/engine/game.ts` (save fields, `migrate`); `scripts/pacing-fit.ts` (`TARGETS`, the `// E10:` comment).

## Files
- Own: a new `src/engine/features/renovation.ts` and `src/content/renovation.ts`; `src/content/layers.ts` (stars with renovation decor); `src/engine/features/franchise.ts` (`RESET_FIELDS` only); `src/engine/features/index.ts` (append one line); `src/engine/game.ts` (save field and migration only); `scripts/pacing-fit.ts` and `scripts/pacing-sim.ts` (the renovating player, `TARGETS`); their tests; `docs/build/v5.25/renovation.md` (new).
- Tests to check: `grep -rln "RESET_FIELDS\|decorTier\|stars(" src/engine/__tests__ src/content/__tests__`.
- Do not touch: `src/components/**` (S6, S7, U7); copy (W6, T3).

## Steps
- [ ] **1. The list first:** write `docs/build/v5.25/renovation.md` before any code. For each of the 6 Home shops and each level I-III it gives:
  - the plaque;
  - 1 fixture upgrade (`id | part | what it changes`);
  - 3 decor items (`id | where it stands | silhouette or prop`).

  That is 18 fixtures and 54 decor items. **Variety check (README section 11):** within a shop, every item differs from the others by silhouette or prop, not only by colour; across shops, each set reads as its neighbourhood (Downtown classic, Suburbs diner, Waterfront dockside, University dorm, Industrial brick, Uptown marble). Ids: `reno<level>-<shop>-<thing>`. Then report `Needs: renovation.md written` and keep going: the orchestrator starts W6 on it.
- [ ] **2. Data.** `src/content/renovation.ts` holds:
  - `RENO_MULT = [1, 2, 3, 4]`;
  - `renoCost(shop, level)`, which rises with each level and is fitted in the sim (a starting point is 3x the shop's next unopened hood price × level, but the sim decides);
  - the fixture and decor ids from step 1;
  - decor prices, set on the same curve as `DECOR_TIER_COST`.
- [ ] **3. Engine.**
  - **Save:** `renovation: Record<shopId, { level: 0|1|2|3; decor: string[] }>` (saved; `migrate` defaults it to empty).
  - **Offer:** `canRenovate(g, shop)` is true when the shop is at ★★★ or more, is below level 3, and the player can afford it.
  - **`renovate(g, shop)`:** charges the cost, sets the shop's stations to level 1 (cash, managers, heads and hood unlocks stay), bumps the level and emits `renovated { shop, level }` for the scene and the UI.
  - **Income:** a shop's income is multiplied by `RENO_MULT[level]`.
  - **Decor:** the level's 3 decor items can be bought with cash, and each adds stars the way decor tiers do today.
- [ ] **4. Franchise.** Add `renovation` to `RESET_FIELDS`, so franchising resets renovations and their looks.
- [ ] **5. Pacing.** The sim's player renovates as soon as `canRenovate` holds and the payback is under the sim's threshold. Set `TARGETS` so the Home finale lands at about 7.0 days (tolerance 0.4), and spread the hood days evenly. New assertion: at each hood opening after Suburbs, Downtown and Suburbs each earn ≥ 10% of total income. Keep the SESSION1 targets from E8 and `pacing-sim` green, Boston included.
- [ ] **6. Tests.**
  - The ★★★ gate.
  - Station reset (and what stays).
  - x2 / x3 / x4 income.
  - Decor stars.
  - Franchise reset.
  - The save round trip.
  - Every id in `renovation.md` exists in `renovation.ts`, and the reverse.

## Checks
- `npx tsc --noEmit`
- `npx jest`
- `npx tsx scripts/pacing-fit.ts check`
- `npx tsx scripts/pacing-sim.ts`
- `npm run format:check`
- `npx tsx scripts/api-digest.ts`

## Report
Standard format, plus each hood's opening day, the finale day, the lowest share of Downtown and of Suburbs, the cost of renovation I/II/III for Downtown, and the new events and selectors.
