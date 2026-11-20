# Card C1 — the Coach overlay and its target registry (v5.20, lane U)

**Goal:** one component draws every tutorial highlight: a full-screen gray scrim with one rounded cut-out (or the union of two), the gold pulse outline, Nonna's pointing hand, and her card docked so it never covers the cut-out. Any component can name a target by id and report its screen rect.

**Why (Julien, 2026-11-20):** "I think we need to find one way of focusing the player's attention… I rather like graying out everything but the highlighted items like at the beginning." Today there are three styles: the in-SVG scrim in `storefront.tsx`, the yellow `cardCoach` border in `sidewalk-row.tsx`, and the HUD `halo` in `game-ui.tsx`.

**Read first:** `docs/PLAN-v5.20-onboarding.md` (v5.20); `src/components/coach-card.tsx`; the spotlight block in `src/components/storefront.tsx` (search `D367`) and `tutorialHand` in `src/components/scene/stations.ts`; `halo` in `src/components/game-ui.tsx`; `cardCoach` in `src/components/sidewalk-row.tsx`; how `src/app/index.tsx` passes `coach`.

## Files
- Own: `src/components/coach/**` (new: `targets.ts`, `overlay.tsx`, `overlay-model.ts`, tests), `src/components/coach-card.tsx`, `src/components/game-ui.tsx` (the `halo` prop goes; the cash pill and goal bar register targets), `src/components/sidewalk-row.tsx` (`cardCoach` goes; cards and the All button register targets), the coach block of `src/app/index.tsx`, `src/components/slots.tsx` (append only, if you mount through a slot), one new fixture file `scripts/fixtures/<next free number>_c1.py`.
- Do not touch: `src/components/storefront.tsx` and `src/components/scene/**` (card C2), `src/engine/**` (card C3).

## Steps
- [ ] **1. The registry.** `coach/targets.ts`: `registerTarget(id, rect | null)`, `useCoachTarget(id)` (a ref callback that measures with `measureInWindow` on layout and on scroll end, and unregisters on unmount), `targetRect(id)`. Ids are strings; list today's in a `CoachTargetId` union: `station:prep`, `station:oven`, `station:counter`, `dial:prep`, `dial:oven`, `dial:counter`, `ovens:all`, `hud:cash`, `hud:goal`, `walk:prep`, `walk:ovens`, `walk:counter`, `walk:drivers`, `walk:all`, `drawer:hire:prep`. Scene ids are registered by card C2; drawer ids by card C3. A store keeps rects in screen points; subscribers re-render only when their target's rect changes.
- [ ] **2. The overlay model** (pure, tested): `overlayLayout(targets: Rect[], screen, safe)` → the union cut-out (8 pt pad, 12 pt radius), the hand's position and rotation (reuse `tutorialHand`'s rules: inside the cut-out, over the work surface; on a narrow target, beside it), and the card's dock: below the cut-out if there is room for the card plus 12 pt, else above. Tests: the card never overlaps the cut-out at 393 × 852 and 375 × 667; the hand stays inside the screen.
- [ ] **3. The overlay.** `coach/overlay.tsx`, mounted once above the HUD, the sidewalk and the drawer, below cut-scenes and system sheets. Props: `targets: CoachTargetId[]`, `mode: 'tap' | 'wait' | 'look' | 'free'`, `text`. `free` draws only the card (no scrim). `tap`: the scrim's pressable swallows taps outside the cut-out and shakes the hand once; taps inside pass through to the element below. `wait`: no taps anywhere change the game; the breathing ring of G83. `look`: like `wait`, ended by a tap anywhere or 2.5 s. A target whose rect is missing hides the overlay for that frame (never a scrim with no hole).
- [ ] **4. Remove the other two styles.** `game-ui.tsx`: drop `halo`, `styles.halo`, `styles.haloGoal`; the cash pill and the goal bar call `useCoachTarget('hud:cash' | 'hud:goal')`. `sidewalk-row.tsx`: drop `highlight` and `cardCoach`; each station card registers `walk:<key>`, the All button `walk:all`.
- [ ] **5. Wire it in `index.tsx`.** Until card C3 lands, map today's `coach.target` to targets: `prep`/`oven`/`counter` → `station:*` (plus `dial:*` when `coach.wait`), `cash` → `hud:cash`, `walk-ovens` → `walk:ovens`, `goal` → `hud:goal`. Keep `CoachCard` as the card the overlay draws.
- [ ] **6. Fixture.** `<n>_c1.py`: a fresh save at step 1, step 6 and step 8 (today's ids) with `expect()` on `coach` and the target rect; one shot each.

## Rules
44 pt touch targets and 10 pt text (DECISIONS #29–#31). Primitive props; `Animated.Value`s from `useState(() => …)`. No new dependency.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format, plus the list of target ids registered by this card.
