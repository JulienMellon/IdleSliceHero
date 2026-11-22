# Card E5 — diamond boosters and the paid-boost slot (v5.23, lane E)

**Goal:** three timed boosters can be bought with diamonds. They run in one paid-boost slot at 2×; buying another while one runs adds its time (up to 24 h remaining) and never a second multiplier. Free boosts keep working as today.

**Why (Julien, 2026-11-20):** "I think we can have timed income boosts." DECISIONS #44 changes #2 ("boosters are never sold for diamonds").

**Read first:** `docs/PRICING-STRATEGY.md` §4; `boostMult`, `rewards.boosts`, `rewards.boosters` and `payDiamonds` in `src/engine/game.ts` and `src/engine/vanity.ts`; `src/content/rewards.ts` (`MAX_CONCURRENT_BOOSTS`); the offline and Plus rules in `docs/REWARDS.md`.

## Files
- Own: `src/content/rewards.ts` (a `PAID_BOOSTERS` table), `src/engine/game.ts` (the slot field, `boostMult`, migration), a new `src/engine/paid-boost.ts`, `src/store/game-store.ts` (the `buyBooster` action only), their tests.
- Do not touch: `src/components/**`, `src/app/**`.

## Steps
- [x] **1. Data:** `PAID_BOOSTERS = [{ id: 'rush-hour', seconds: 3600, diamonds: 30 }, { id: 'dinner-service', seconds: 14400, diamonds: 90 }, { id: 'big-night', seconds: 43200, diamonds: 220 }]`, mult 2, `PAID_SLOT_CAP = 86400`.
- [x] **2. The slot:** `rewards.paidUntil: number` (0 = none). `buyBooster(g, id, now)`: refuse when diamonds are short or `max(paidUntil, now) + seconds − now > PAID_SLOT_CAP` (no diamonds taken); else pay and set `paidUntil = max(paidUntil, now) + seconds`.
- [x] **3. `boostMult`** adds `+1` while `paidUntil > now` (and the clock-behind rule holds), on top of today's sum. Cash rewards still use the rewards' income (no boost). The 2× offline ad and Plus keep their non-stacking rule: offline earnings ignore the paid slot exactly as they ignore other timed boosts.
- [x] **4. Save:** bump the version; old saves get `paidUntil: 0`.
- [x] **5. Selectors** for U5: `paidBoostLeft(g, now)`, `boosterPace(g, id)` (rewards' income × seconds).
- [x] **6. Tests:** buying, extending, the cap refusal with no charge, `boostMult` with a free 2× running (3×), the clock-behind rule, offline unaffected, `analytics` event name `booster_bought` exported for U5.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`; `npx tsx scripts/pacing-sim.ts | tail -12` (unchanged: the sim buys nothing).

## Report
Standard format.
