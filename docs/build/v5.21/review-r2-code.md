# v5.21 r2 code review (range 12c99bd..HEAD, r2 commits c1d0c3c..HEAD)

VERDICT: APPROVED
SUMMARY: The r2 engine fixes are sound. Chapter diamonds are now paid once in `markSceneSeen` through `payChapter`, banked before the rewards unlock and saved through migration. `sceneReady` and `chapterReady` share one `sceneWaitSeconds` rule, and both have tests. One medium is new: the free chapter's reward row promises diamonds that the engine never pays for that chapter. The goal-bar toast and the Story "Go" button have small edge cases.

BLOCKERS: none

ISSUES:
- C173 [medium] rewards-model.ts:484 `storyReward`: chapter 1 (`free`) shows "Next: Chapter 2 · 💎 5", but `payChapter` (chapters.ts:231) pays 0 for a free chapter. The 5 is chapter 2's, and chapter 2's own row shows it again, so a player who finishes chapter 1 expects 5 diamonds that never arrive. The rewards-story test (:66) pins the mismatch. → Add an engine `chapterDiamonds(c)` (0 for `free`) that `payChapter` and `storyReward` both read. For a free chapter, drop the diamonds from the row or label them "Chapter 2 pays 💎 5". Move `CHAPTER_DIAMONDS` to tuning, the part of C169 still left.
- C174 [low] app/index.tsx:224 `onGo`: for a `build` row it calls `setActive(shop)`, and the store ignores that for an unbuilt shop (game-store.ts:683 `if (g.shops[id].built …)`). The Go only closes the list, even though the comment says it opens the shop tabs. → Either scroll or flash the shop tab for the unbuilt shop, or fix the comment and give `build` no Go (drop it from `GO_KINDS`).
- C175 [low] app/index.tsx:313-329: the goal toast keeps its own copy of the store's toast timer (game-store.ts:272). The effect's cleanup cancels the 2.2 s clear whenever the key changes again into a state that shows no toast (`.ready` → next task, or the goal going to undefined). The toast then stays until the next toast or a blur. → Add a store `flashToast(text, ms)` action that owns the timer, and call it from the effect with no cleanup.

ARCHITECTURE:
- A44 [medium] still open: step 8's `listSeen` and the tasks-open/closed notes are still in GameScreen (index.tsx:272-287), not in `useCoachFlow`.

MEMORY:
- No new findings. The `chaptersTick` working copy (`cur`) allocates only when a counter moves, which closes M73. Carried: M70, M71 [low].

CPU:
- U32 [low] goal-model.ts:122 `cityStory`: the story-count fallback runs on every GameScreen render (5 Hz). Each time it builds a Set of about 40 ids and filters `seenScenes`. → Cache the id Set per `scenes` array in a WeakMap, or key the result on `seenScenes.length` and `city`.
- `chapterGoal` now formats only the next task (U31 closed). It still walks `currentChapter` three times per render (`chapterGoal`, `nextTask`, `chapterReady`), which is well under 0.1 ms. Not worth an ID.

TESTS:
- T126 rewards-story test: for every chapter, the `storyView(g).reward.diamonds` it shows equals what `markSceneSeen` adds for its scene (0 for the free chapter). This catches C173.
- T125 still open (step 8 after a relaunch with the list closed).

FIXED SINCE LAST REVIEW: C169 (payout and bank are in; the constant-to-tuning part moves into C173), C170, C171, C172 (no teaser or portrait; the reward row was kept on purpose per S75, see C173), M73, U31, T123, T124.
STILL OPEN FROM LAST REVIEW: A44, T125, C158, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, C157, M70, C167.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C173 | medium | U | rewards-model.ts:484 storyReward | Free chapter row shows 💎5 never paid; one chapterDiamonds(c) for payChapter and the row; constant to tuning |
| A44 | medium | U | app/index.tsx:272-287 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C174 | low | U | app/index.tsx:224 onGo | Build Go: setActive ignores unbuilt shops; flash its tab, or no Go for build |
| C175 | low | U | app/index.tsx:313-329 | Goal toast via a store flashToast that owns its timer; no effect cleanup cancelling it |
| U32 | low | U | goal-model.ts:122 cityStory | Cache the city's scene-id Set per scenes array; no Set per render |
| T125 | low | U | coach-view test | Step 8 after relaunch with list closed never strands the player |
| T126 | low | U | rewards-story test | Row diamonds equal markSceneSeen payout for every chapter, 0 for the free one |
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

Next IDs: K5, C176, A45, M74, U33, T127
