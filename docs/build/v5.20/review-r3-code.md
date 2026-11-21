VERDICT: APPROVED
SUMMARY: The r3 round closes all eight v5.20 code notes it was given: A43, C165, C166, T120, T121 and U30 are fixed, and `coachReporter` turns the storefront's late-measure guard into a pure object with a test. The new code is small and sound (the hand's above/below/beside fallback, the D531 oven-head reach, the D528 goal gate); what is left is two low drift risks, a duplicated "tutorial running" check in Storefront and a bare `11` in the goal gate.

BLOCKERS:
- none

ISSUES:
- C167 [low] storefront.tsx:357 `ovenLook` re-derives the current step with its own check, `game.tutorial >= 1 && < TUTORIAL_DONE && stepsFor(city)[game.tutorial - 1]`. It skips three rules in `current()` (tutorial.ts:68-84): the `managed` early-out, `effective()` (7/8 → 9) and the D374 step-10 → 9 swap. The result is the same today, because only step 11 targets `ovens:all`. But the next step that lights the ovens, or `CHAPTERS_ON = true`, will make this check and the overlay disagree. → Export `coachTargets(s) = current(s)?.step.targets ?? NONE` from tutorial.ts, next to `coachMode`, and use it here. That is what U30 asked for; the cost is the same (one `upgradeCostOf` and no copy).
- C168 [low] app/index.tsx:364 `teaching = coach.id <= 11` hard-codes the step number in the screen. It also conflicts with step 7 (`hud:goal`, tap) once v5.21 sets `CHAPTERS_ON`: Nonna would point at a goal bar that has been made to show the story instead. → Add `teachesFirstShop(step)` (or a `TEACH_LAST = 11` constant) to tutorial.ts, and add a comment on step 7 saying the bar must name the chapter goal when the chapters come in.

ARCHITECTURE:
- A43 is fixed: `engine/coach-types.ts` owns `CoachMode`/`CoachTargetId`, `components/coach/steps.ts` and `targets.ts` re-export them, and `grep` finds no non-test engine file that imports from `components/`.
- Carried: A41.

MEMORY:
- Nothing new. `coachReporter` holds one closure set per Storefront mount (in `useState`), and it is dropped on unmount. `handPose` allocates a two-item array and four small objects, but only inside the overlay's `useMemo` and never per frame. `ovens:all` adds one spread per report, which happens on events, not frames.
- Carried: M70, M71.

CPU:
- U30 is fixed: `ovenLook` is now a WeakMap get plus `includes` per scene frame (under 1 µs, no strings). The D528 gate also skips `pickGoal` and `masteryGoal` on every GameScreen render during steps 1-11, which is a small saving.
- Carried: U27.

TESTS:
- T120 is closed (coach-rects.test.ts "the reporter registers nothing…": it covers no origin, stop → nulls, a late `setOrigin`/`report` that registers nothing, and restart). T121 is closed (oven-gain.test.ts, grades 0-3).
- The new hand cases (below, beside with the card below, the 70 pt dial pill, All on the SE) and the `OVEN_HEAD_PT` reach are pinned in overlay-model.test.ts and coach-rects.test.ts.
- T122 Goal gate: pull the D528 choice out of index.tsx into a pure `goalFor(game, coach)` (or test it through the existing goal model). Case: at steps 1-11 it returns the story goal even when Ovens is affordable; at step 12 it returns the purchase goal.
- Carried: T115, T116, T117.

FIXED SINCE LAST REVIEW: A43, C165 (the param is now `Shop`, and the casts are gone; this differs from the suggested widening but closes the risk), C166 (the comments name `LOOK_MS`/`LOOK_FALLBACK_MS`, which exist in overlay.tsx:22 and coach-view.ts:12), T120, T121, U30
STILL OPEN FROM LAST REVIEW: C158, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, C157, M70 (r3 did not touch services/, dev/, report/, shifts/ or features/layers)

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
| C167 | low | S | storefront.tsx:357 | Use an exported coachTargets(s) built on current(); drop the hand-rolled tutorial-range and step-index check |
| C168 | low | U | app/index.tsx:364 | Name the step-11 teaching bound in tutorial.ts; note step 7 hud:goal conflict for v5.21 |
| T122 | low | U | index.tsx goal choice | Steps 1-11 show the story goal even when Ovens is affordable; step 12 shows the purchase |

Next IDs: K5, C169, A44, M73, U31, T123
