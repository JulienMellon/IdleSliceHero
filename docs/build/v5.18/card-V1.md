# Card V1 — the shop's width as data, and a scroll container (v5.18, lane S)

**Goal:** the shop drawing can be wider than the screen and can scroll sideways, and **nothing the player sees changes yet**: every footprint still asks for today's width. Card V2 makes the two largest shops wide.

**Why (Julien, 2026-11-13):** "Let's explore the cost of allowing the restaurant to expand horizontally beyond the screen and allow our users to scroll. This will allow us to create richer animations and have some variety in restaurant layouts." He chose to build it in v5.18.

**What is fixed today (measured at v5.15):** the shop is one 393 × 680 drawing scaled to cover the screen (`sceneFit` in `scene/projection.ts`). Rooms are 270 to 358 units wide by footprint (`ROOM_W` in `scene/layout.ts`). `SCENE_W` appears 136 times in 20 files, 88 of them in tests. The perspective's vanishing point is the literal 196.5 in six non-test places. Three places fit themselves to the screen separately: `storefront.tsx`, `floating-bonus.tsx`, `src/app/index.tsx`.

**Read first:** `src/components/scene/projection.ts`, `layout.ts`, and `grep -rn "SCENE_W\|196.5\|sceneFit(" src --include=*.ts --include=*.tsx | grep -v __tests__ | cut -c1-120`.

## Files
- Own: `src/components/scene/**`, `src/components/storefront.tsx`, `src/components/floating-bonus.tsx`, `src/components/coin-layer.tsx`, the scene-area block of `src/app/index.tsx`, `src/store/game-store.ts` (the scroll position only: it is not saved with the game).
- In `src/components/layers/**` and `src/components/report/**`: only the call sites that must take the new frame to compile.
- Do not touch: `src/engine/**`, `src/content/**`.

**Running after card K1** in the same wave: K1 changes import lines in `src/components/**`. Pull its work before you start and re-read a file before each edit.

## Steps
- [ ] **1. One frame object.** `SceneFrame { width; height; vanishX }` in `projection.ts`, from `sceneFrame(footprint)`: width 393 and `vanishX` = width ÷ 2 for every footprint, for now. `P`, `unprojectX`, `sceneFit` and every builder that used `SCENE_W` or 196.5 take the frame. Keep `SCENE_W` exported only for tests that mean "one screen".
- [ ] **2. The scroll container.** When the frame's width at the fitted scale is wider than the screen, the shop drawing sits in a horizontal scroll view; otherwise it is exactly today's tree (no scroll view at all, so today's shots cannot change). A drag under 8 pt is a tap: station taps and the rush tap keep working. No vertical scroll, no zoom.
- [ ] **3. What moves and what stays.** One helper, `sceneToScreen(x, scrollX, fit)`, used by everything anchored to a place in the shop: station tags, head bubbles, coin origins, the scene overlays (boats, the rival's storefront, layer props, cosmetics). Screen-fixed: HUD chips, banners, the order chip, the shop report strip, the golden pizza's lane. Write the list in a comment above the helper.
- [ ] **4. Where it opens.** A shop opens with the counter in view. The scroll position is remembered per shop in the store for the session.
- [ ] **5. Tests.** Every existing budget passes untouched at width 393. A new test builds the layout at width 640 and proves that nothing is placed outside the room, the crowd budgets hold, and `sceneToScreen` round-trips.
- [ ] **6. Prove nothing changed.** The orchestrator's seam verify must show 0 new and 0 changed shots.

## Rules
Overlap fixes go in the pure modules with a budget test that fails on the old code; then run the whole crowd suite (D336, D352, D353, D368, D370). Don't remove the WELCOME mat. Primitive props; `Animated.Value`s from `useState(() => …)`.

## Checks
`npx tsc --noEmit`; `npx jest src/components`.

## Report
Standard format, plus the count of `SCENE_W` and 196.5 uses left outside tests (expect 0 and 0, bar the kept export).
