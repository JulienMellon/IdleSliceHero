VERDICT: APPROVED
SUMMARY: The r2 fix round closes every v5.20 r1 code note. The coach flow is now a pure `coachView`/`fallbackStep` pair with a thin `useCoachFlow` hook and a `noteCoach` store action, and the off-screen softlock, the late-measure and the dead-target items are fixed with tests. The Boston founder regression is fixed and the overlay is memoised. What is new is small: Storefront asks `coachStep` (copy lookup and money text) on every scene frame just to read the targets, there is one type cast in `ovenGain`, and two doc comments are stale.

BLOCKERS:
- none

ISSUES:
- C165 [low] scene/oven-gain.ts:17-18 `ovenGain` takes a `Pick<Shop,'ovens'|'grade'>` and casts it with `as Shop` twice to call `ovenRate`. That is correct today because `ovenRate` reads only `ovens` and `grade`, but a later field read would silently give NaN. → Widen `ovenRate`'s first parameter (game.ts:768) to `Pick<Shop,'ovens'|'grade'>` and drop both casts.
- C166 [low] engine/tutorial.ts:5, 21: the comments still say a look ends after "2.5 s". `LOOK_MS` is now 4 s, and `LOOK_FALLBACK_MS` is 8 s. → Reword both to name the constants rather than the numbers.

ARCHITECTURE:
- Carried A43 [low]: the engine still imports `CoachMode`/`CoachTargetId` from `components/coach/*` (tutorial.ts:8-9). The new `coach-view.ts` adds one more consumer of the components-side type.
- Carried A41.

MEMORY:
- M72 fixed: `CoachOverlay` is `memo`, and its interpolations sit in one `useMemo` on `pulse`/`shake`. The props it gets are stable: `targets` comes from the `STEP_CACHE` step, `onDone` is a `useCallback`, and the rest are primitives. So a 5 Hz screen tick that changes nothing re-renders nothing. The dotted leaders add 1 `Line` per extra hole (1 node at step 11).
- M69 fixed (`NO_BARKS`).
- Carried: M70, M71.

CPU:
- U30 [low] storefront.tsx:357 `ovenLook = !!coachStep(game)?.targets.includes('ovens:all')` runs on every 15 fps scene frame. During the tutorial each call builds the step's text: a `t()` template fill and `money()`, plus `upgradeCostOf` and `headCost`, all to read a list of targets. That is roughly 15 to 20 µs and 4 to 6 short strings per frame. It brings back the cost that U29 removed from `hintsAllowed`. After the tutorial `current()` returns null at once, so the cost is zero then. → Export `coachTargets(s)` (or `current(s)?.step.targets`) from tutorial.ts next to `coachMode`, and use it here.
- U28 fixed: `onScroll` reports targets only while `coachRuns`; scroll-end and momentum-end report once.
- U29 fixed: `coachMode` drives `hintsAllowed` and `tutorialOn`.
- Carried: U27.
- Note (no ID): `coachRuns.current = …` (storefront.tsx:652) is a ref written during render. It follows the same latest-value pattern as `askRef` and is harmless under React Compiler. Leave it, but don't let the pattern spread to refs that are read during render.

TESTS:
- T118 and T119 are added (coach-view.test.ts, overlay-model.test.ts "a target off the screen"). T114 is covered in ladder.test.ts:321 and moments.test.ts:281.
- T120 is still open: there is no test that a late `measureInWindow` after unmount leaves the registry empty. The `alive` guard is in place (storefront.tsx:184, 186, 645-650) but nothing pins it. A small render test with a mocked `measureInWindow` that fires after `unmount()` would close it.
- T121 `ovenGain` at a grade change: the same `ovens` with a different `grade` keeps the same pct. This pins that the plaque reports the level gain only (it pairs with C165).

Observations, not notes: `cardDock` moves non-HUD cards to the bottom only when `roomBelow >= cardH`, so a bottom card can never overlap the hull. `fallbackStep` is now not armed while the drawer is open, and it re-arms on close at step 15 (C161). `noteCoach` saves after a note that changed the step, which is good: a kill during step 12/13 no longer loses the note.

FIXED SINCE LAST REVIEW: C156, M69, T114, A42, C161, C162, C163, C164, M72, U28, U29, T118, T119
STILL OPEN FROM LAST REVIEW: C158, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, C157, M70, A43, T120

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
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
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| A43 | low | E | engine/tutorial.ts:8-9 | Own CoachMode/CoachTargetId in engine; components re-export them |
| T120 | low | S | storefront / coach registry test | Late measureInWindow after unmount leaves no scene targets registered |
| U30 | low | S | storefront.tsx:357 | Read step targets via a cheap coachTargets(s), not coachStep's text build per frame |
| C165 | low | S | scene/oven-gain.ts:17-18 | Widen ovenRate param to Pick<Shop,'ovens'|'grade'>; drop the two `as Shop` casts |
| C166 | low | E | engine/tutorial.ts:5, 21 | Stale "2.5 s" look comments; name LOOK_MS / LOOK_FALLBACK_MS instead |
| T121 | low | S | oven-gain test | Same ovens, other grade: pct unchanged (level gain only) |

Next IDs: K5, C167, A44, M73, U31, T122
