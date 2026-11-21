VERDICT: APPROVED
SUMMARY: v5.20 swaps the scene-only spotlight for one screen-level Coach overlay. It has a small module-state target registry, pure geometry with tests, a 15-step engine script with a v7 save migration (`legacyTutorial`), and screen notes for the steps only the UI can end. The engine and geometry are clean and tested. What is left: the screen-side tutorial orchestration in `index.tsx` has no tests, plus a handful of low items (scroll-driven measuring outside the tutorial, dead targets, one possible tap-mode softlock).

BLOCKERS:
- none

ISSUES:
- C161 [low] app/index.tsx:270-275 `lookId` 6 s fallback: it also fires while the drawer covers the overlay (`coachOn` false). Hiring Marco from the drawer (13 → 15) can end step 15 ("Bravo!") before the player ever sees it. → Run the fallback only when `coachOn` is false for a reason other than `drawerOpen`, or restart it when the drawer closes.
- C162 [low] storefront.tsx:619-627 `measureOrigin` → `coachAt`: a `measureInWindow` answer that comes back after unmount re-registers the scene targets after the cleanup cleared them (stale `station:*` rects until the next Storefront measures). → Keep an `alive` ref that is set false in the unmount cleanup, and return early in `coachAt` when it is false.
- C163 [low] coach/overlay-model.ts:156 `overlayLayout`: a target that is fully off-screen (a wide shop scrolled away from the station) clamps to a zero-area cut. In `tap` mode, `blockers` then covers the whole screen, swallowing the scroll gesture too, so the player is stuck. → Return null when `padded[0]` has zero width or height after clamping, or have the Storefront scroll the target in (`askRef`).
- C164 [low] dead code: the `drawer:close` target (index.tsx:259, 539) is never lit by any step; `CoachProps` (coach/steps.ts:6) and `useTargetRect` (targets.ts:159) have no callers; shop-ui.tsx:468 builds a `drawer:hire:prep` ref for every StationCardView. → Drop them, or split a `CoachTargetView` wrapper like `Registered` in sidewalk-row.

ARCHITECTURE:
- A42 [medium] app/index.tsx:250-282: the tutorial flow (drawer-open/closed notes, the 6 s look fallback, the step-13 `lookedAt` trick that turns `look` into `free`, `coachOn`) lives in the 684-line screen. It writes `useGame.setState({ game })` directly instead of going through a store action, and has no tests. → Move it into `components/coach/use-coach-flow.ts` (one hook that returns `{ step, mode, onDone } | null`) on top of a pure `coachView(step, { drawerOpen, isFirst, lookedAt })`. Add a store action `noteCoach(note)` next to `tutorialAdvance`.
- A43 [low] engine/tutorial.ts:8-9: the engine imports `CoachMode`/`CoachTargetId` from `components/coach/*` (type-only, but the layering points the wrong way). → Declare both in `engine/tutorial.ts` (or `engine/coach-types.ts`) and have `coach/steps.ts` and `coach/targets.ts` re-export them.

MEMORY:
- M72 [low] coach/overlay.tsx:281-285, 322: each render builds 5 `interpolate` nodes, one `Animated.multiply` per cut and fresh style objects. While the tutorial runs, the screen re-renders at 5 Hz and passes a new `coach` object each time. React Compiler (app.json:181) probably caches these, but nothing enforces it. Without the cache that is about 8 to 12 native animated nodes detached and re-attached per tick. → Wrap the component in `memo` (its props are already primitives or stable: `DEFS` arrays, text, a stable `onLook`) and put the interpolations in a `useMemo` keyed on `pulse` and `shake`.
- Carried: M69, M70, M71 (files not touched).

CPU:
- U28 [low] storefront.tsx:652, 991 `coachAt` runs on every `onScroll` (throttled to 16 ms, so about 60 Hz while dragging) on every shop, long after the tutorial. Each call runs `coachRects`: `stationRects`, `badgeXs`, 2 `P()` per oven and 7 snapped rect objects, roughly 25 allocations. The rects change on every event, so `registerTarget` writes 7 entries each time. That is cheap in itself, but it is pure waste once the tutorial is over. → Return early unless `coachStep(useGame.getState().game)` is non-null. Alternatively, export `hasTargetListeners(ids)` from targets.ts and return early when nobody is listening.
- U29 [low] engine/tutorial.ts:69-90 `coachStep` now runs `t()` (a template fill), `money()`, `upgradeCostOf` and `headCost` on every call. During the tutorial it runs 15 times a second from storefront.tsx:335 (`hintsAllowed`), plus about 3 times per 200 ms game tick from index.tsx:196, 250 and 618. Roughly 30 µs per frame: small, but these calls only need the mode. → Add `coachMode(s)` (step, mode and the step-6 rule, no text) for `hintsAllowed`/`tutorialOn`, and keep the text in `coachStep`.
- Carried: U27.

TESTS:
- T118 `coachView` (after A42): step 13 `look` → `free` after `onDone`; the overlay hides while the drawer is open except at 13; the look fallback is not armed at 13; drawer-closed at 12 changes nothing.
- T119 `overlayLayout` with a target fully off-screen (x0 > screen.w) → null (C163), and `blockers` never covers the whole screen in `tap` mode.
- T120 coach-rects / Storefront: no `registerTarget` writes after unmount when a late origin callback fires (C162).

FIXED SINCE LAST REVIEW: n/a (this range does not touch services/, dev/, report/, shifts/, features/layers or ladder.ts; storefront.tsx:516 still has `city.barks ?? {}`)
STILL OPEN FROM LAST REVIEW: C158, C156, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, C157, M69, M70, T114

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C156 | medium | S | storefront.tsx:488, scene/ladder.ts:487 | Milestone speaker from city.founder?.name, not 'Nonna' for any first shop (Boston regression) |
| A42 | medium | U | app/index.tsx:250-282 | Extract coach flow into use-coach-flow hook + pure coachView; store action noteCoach, no direct setState |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op, not purchases.web by file name |
| C160 | low | N | dev/jumps.ts:8, game-store.ts:53 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T116 | low | N | services ledger test | Test-mode ledger key differs and reset clears it |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | app/index.tsx:306, slots.tsx:146 | Goal label from bid.name; a11y label from nightOvenLines.name |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| C157 | low | U | report/report-strip.tsx:24 | Founder portrait from firstHood(city) and city.founder, not 'downtown' |
| M69 | low | S | storefront.tsx:516 | Hoist frozen NO_BARKS instead of `?? {}` per frame |
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| T114 | low | S | ladder / storefront test | Boston North End milestone never speaks as Nonna |
| C161 | low | U | app/index.tsx:270-275 | Don't let the 6 s look fallback end step 15 while the drawer hides it |
| C162 | low | S | storefront.tsx:619-627 | alive ref: late measureInWindow after unmount must not re-register scene targets |
| C163 | low | U | coach/overlay-model.ts:156 | Null layout when first cut clamps to zero area; avoids full-screen tap blocker softlock |
| C164 | low | U | index.tsx:259, coach/steps.ts:6, targets.ts:159, shop-ui.tsx:468 | Drop unused drawer:close, CoachProps, useTargetRect; no hire ref on every card |
| A43 | low | E | engine/tutorial.ts:8-9 | Own CoachMode/CoachTargetId in engine; components re-export them |
| M72 | low | U | coach/overlay.tsx:281-285 | memo CoachOverlay; useMemo interpolations on pulse/shake |
| U28 | low | S | storefront.tsx:652, 991 | Skip coachAt on scroll unless the tutorial runs or targets have listeners |
| U29 | low | E | engine/tutorial.ts:69 | coachMode(s) without t()/money() for hintsAllowed and tutorialOn |
| T118 | low | U | coach flow model | Step 13 look→free, drawer gating, no fallback at 13, closed-at-12 no-op |
| T119 | low | U | overlay-model test | Off-screen target gives null layout; tap blockers never cover all |
| T120 | low | S | coach-rects / storefront | No registerTarget after unmount on late origin callback |

Next IDs: K5, C165, A44, M73, U30, T121
