VERDICT: CHANGES REQUESTED
SUMMARY: Chapters are a clean, well-tested engine addition (`engine/chapters.ts`, a gate in `sceneTriggered`, a v8 migration), and the goal bar is much simpler now that it no longer scores purchases. One promise is not kept: the Story tab shows "💎 5" on every chapter, but no code pays it. There are also two medium duplications: the pacing countdown, and the step-8 look-then-free rule.

BLOCKERS:
- none

ISSUES:
- C169 [high] `rewards-model.ts:537 CHAPTER_DIAMONDS`, `storyRewardText`. Every chapter's reward row says "🎬 New scene · 💎 5", and VERSION.md Defaults says the diamonds are paid, with a bank before unlock. Nothing in `src/engine` or `src/store` pays them (grep shows `CHAPTER_DIAMONDS` is read only by the text). It also shows on the free chapter 1, which "pays nothing" (`chapters.ts:221`). The game ships a reward it never pays. → Move the number to `content/tuning`. Pay it in the engine when a chapter's beat is marked seen (`applyReward` path), skipping `free` chapters. Bank it in `x.chapters.banked` before `rewardsUnlocked` and pay it at unlock. Hide the row for a `free` chapter (see C172).
- C170 [medium] `chapters.ts:250 chapterReady` copies `sceneReady`'s pacing (`cutscene-input.ts:50`): the trigger-kind list, the 90 s gap and the beat-4 gaps. The "Next scene in 0:42" countdown will drift from the queue the first time one of them changes. → Extract `sceneWaitSeconds(game, scene, lastEnd): number` next to `sceneReady`. Then `sceneReady = wait === 0`, and `chapterReady` returns `{ secondsLeft: sceneWaitSeconds(...) }`.
- C171 [low] `rewards-ui.tsx:296 TasksDrawer` is now both controlled and uncontrolled (`initialTab`, `tab`, `onTab`, `ownTab`). The only caller (`index.tsx:510`) always passes `tab`, so `initialTab` and `ownTab` are dead. → Keep the controlled form only: `tab` is required, and the `story`→`daily` fallback stays.
- C172 [low] `rewards-model.ts:617 storyView` gives the free chapter 1 the opening scene's teaser and "New scene" after that scene has played, during the tutorial. → Add `kind: 'tutorial'` (or `free: true`) to the view, so the tab drops the teaser's "next scene" framing and the reward row.

ARCHITECTURE:
- A44 [medium] `app/index.tsx:97-112` (`tasksWas`, `listSeen`, `coachDone`, `coachView` spread) rebuilds, for step 8, the look-then-free rule that `coach/coach-view.ts:33` already has for `DRAWER_STEP`. It also adds the tasks-open/closed note effect beside the drawer's in `useCoachFlow`. → Pass `tasksOpen` into `useCoachFlow`, move the effect there, and make `coachView`'s "seen → free" rule take a set of steps (`DRAWER_STEP`, 8). This removes about 15 lines of tutorial state from the screen and puts the rule under coach-view's pure tests.

MEMORY:
- M73 [low] `chapters.ts:205`. For every task of every open chapter, every tick, `taskProgress(withSave(g, {...c, ...}), t)` spreads the whole GameState, `x` and the save. Mid-game that is up to 6 chapters × 3 tasks = about 54 short-lived objects (about 2-3 KB) per 200 ms tick. Each held task also respreads `run`, `calm` or `best`. → Split `taskProgress` into `progressFrom(save, g, task)` and call it with the local `{done, best}`. Copy each map once per tick on first write.

CPU:
- U31 [low] `goal-model.ts:472 chapterGoal` runs on every GameScreen render (5 Hz). It builds the whole `storyView`: title, teaser, `chapter.done`, the portrait lookup, and the spoken string for every task, about 7 `t()` interpolations and 6 number formats. It also calls `currentChapter` 3 times (storyView, chapterReady, nextTask), each a 24×40 `seenScenes.includes` scan. Estimated 50-100 µs per tick, all of it thrown away except one label. → Find `currentChapter` once and format only the next task. Or memoise on `(seenScenes, x.chapters, task's current)` with a one-entry cache.

TESTS:
- T123 (E) `chapterReady` against `sceneReady`: over a pacing-sim run, `chapterReady(g, end)?.secondsLeft === 0` exactly when `sceneReady(g, scene, end)` holds for the current chapter's scene, at every tick.
- T124 (E) The chapter diamonds: paid once when a non-free chapter's beat plays, banked before `rewardsUnlocked` and paid at unlock, never paid for `downtown-1`.
- T125 (U) coach-view: at step 8 with the list closed (a relaunch), the overlay cannot strand the player. A seen look turns `free`, and opening then closing the list ends the step.

FUN AND RETENTION
- The goal bar is now a chapter's task, not "the next buy". The flash when a task completes and the basil "Ready" bar give a clear loop of small wins. Paying the diamonds (C169) is what makes "💎 5" mean something.

FIXED SINCE LAST REVIEW: C168 (the teaching bound is gone: the goal bar never shows a purchase); T122 (obsolete for the same reason, now covered by the chapterGoal tests); C151 is half fixed (the bid goal label was removed; the night-oven a11y label at slots.tsx:146 is still open).
STILL OPEN FROM LAST REVIEW: C158, C159, C160, A41, M71, U27, T115, T116, T117, C151 (a11y half), C154, C157, M70, C167

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C169 | high | E | rewards-model.ts:537, engine | Pay CHAPTER_DIAMONDS when a non-free chapter's beat plays; bank before unlock; constant to tuning |
| C170 | medium | E | chapters.ts:250, cutscene-input.ts:50 | One sceneWaitSeconds shared by sceneReady and chapterReady |
| A44 | medium | U | app/index.tsx:97-112 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C171 | low | U | rewards-ui.tsx:296 | TasksDrawer controlled only; drop dead initialTab and ownTab |
| C172 | low | U | rewards-model.ts:617 | Free chapter 1: no reward row, no next-scene teaser framing |
| M73 | low | E | chapters.ts:205 | progressFrom(save, g, task); no GameState spread per task per tick |
| U31 | low | U | goal-model.ts:472 | One currentChapter; format only the next task; skip full storyView at 5 Hz |
| T123 | low | E | chapters test | chapterReady secondsLeft 0 iff sceneReady over a sim run |
| T124 | low | E | chapters test | Diamonds paid once, banked before unlock, none for downtown-1 |
| T125 | low | U | coach-view test | Step 8 after relaunch with list closed never strands the player |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op, not purchases.web by file name |
| C160 | low | N | dev/jumps.ts:8, game-store.ts:53 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T116 | low | N | services ledger test | Test-mode ledger key differs and reset clears it |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:146 | Night-oven a11y label from nightOvenLines.name, not a hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| C157 | low | U | report/report-strip.tsx:24 | Founder portrait from firstHood(city) and city.founder, not 'downtown' |
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| C167 | low | S | storefront.tsx:357 | Use an exported coachTargets(s) built on current(); drop the hand-rolled tutorial-range and step-index check |

Next IDs: K5, C173, A45, M74, U32, T126
