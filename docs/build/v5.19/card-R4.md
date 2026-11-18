# Card R4: the game screen and HUD (v5.19, lane U)

**Goal:** the goal bar and the HUD subtitle are pure, tested models. `game-ui.tsx` is split by component, and the game screen re-renders less. **Same goals, same words, same order.**

**Run after R3.**

**Why:** `docs/PLAN-refactor.md`, phase P4. Notes to fix:
- **C137** [low], the half R5c left: the typed buy handler. Today the drawer encodes buys as strings (`'decor:<kind>'`, `'up:<what>'`).
- **U19** [low]: layer-stack.tsx:131. Select `rivalOpen` plus the challenge fields only.

## Files
- Own: `src/app/index.tsx`, `src/components/goal-model.ts`, new `src/components/hud-model.ts`, `src/components/game-ui.tsx` (split into new `buy-button.tsx`, `hud.tsx`, `offline-popup.tsx`, `night-oven-sheet.tsx` and `toast.tsx`, keeping a re-export at `game-ui.tsx`), `src/components/drawer-model.ts`, `src/components/shop-ui.tsx` (the handler type), `src/components/layers/layer-stack.tsx` (U19 only). CITY(los-angeles) may be adding its showdown strip there at the same time: re-read it immediately before each edit and change only the U19 selector.

## Steps
- [ ] **1. Golden first.** Before moving anything, write `goal-model` tests that pin today's output: label, short, target and order for about 12 seeded saves. Use the fixture saves in `scripts/fixtures` and the review sims; include home early, mid and late game, Boston, a save with an open bid, and a save with a tied bundle.
- [ ] **2. `goalCandidates(game, id, now): GoalView[]`.** Move `index.tsx:197-280` (hires, build, fleet, bid, big buys, the D494 far-away rule, the D341/B1 order, mastery, story). It returns a `GoalAction` union (`{ t: 'buy', id, what }`, `{ t: 'build', id }`, `{ t: 'fleet' }`, `{ t: 'bid' }`) instead of closures. The bid label comes from copy with `city.bid.name` (no "Pier 9" or "Marisol" literal). The screen maps an action to a store call and memoises on `shopLevelKey` plus `Math.floor(cash / step)`.
- [ ] **3. `hudSubtitle(game, shop, eps, mult)`** in `hud-model.ts` replaces the `index.tsx:282-301` chain.
- [ ] **4. Typed drawer buy.** A `DrawerBuy` union replaces the string keys (C137).
- [ ] **5. Split `game-ui.tsx`.** Verbatim moves.
- [ ] **6. Subscription.** `GameScreen` selects what it renders (active id, a cash bucket, keys), not the whole `game`. Measure with `usePerfMarks('GameScreen')` (renders per 10 s of idle play) before and after.
- [ ] **7. U19.**

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/components`.

## Fixtures
Run `--only 05_midgame,09_lategame,34_sidewalk,47_hooks,56_u1` and compare with the baseline: **0 changed**.

## Report
Standard format, plus renders per 10 s before and after, and the `index.tsx` and `game-ui.tsx` line counts.
