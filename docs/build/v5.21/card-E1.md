# Card E1 — chapters: data, gate, progress (v5.21, lane E)

**Goal:** each of the home city's 24 main beats (beats 1–4 of six neighbourhoods) has a chapter of 2–4 tasks, and `sceneTriggered` plays a beat when its chapter is done. Selectors give the UI the current chapter, its tasks with progress, and the next task. Nothing about pacing moves.

**Read first:** `docs/build/v5.21/VERSION.md` (Defaults: task kinds), `docs/API.md`, `src/engine/story.ts`, `src/content/types.ts` (`Scene`, `trigger`), `src/content/cities/types.ts`, the home scenes' triggers (`grep -n "trigger:" src/content/cities/home/scenes/*.ts`), `src/engine/features/service.ts` (`flowOf`, `perMin`), `scripts/pacing-sim.ts`.

## Files
- Own: `src/content/cities/types.ts` (optional `chapters` field), `src/content/cities/home/chapters.ts` (new), `src/content/cities/home/index.ts` (one line), `src/engine/chapters.ts` (new), `src/engine/story.ts`, `src/engine/game.ts` (save fields and migration only), `src/store/game-store.ts` (tick hook only), `scripts/pacing-sim.ts` (print a chapter column), tests under `src/engine/__tests__/`, `docs/build/v5.21/chapters.md` (new).
- Do not touch: `src/components/**`, `src/app/**`.

## Steps
- [x] **1. Draft table first.** Write `docs/build/v5.21/chapters.md`: one row per main beat, `sceneId | gate today | tasks (kind, shop, target)`. Rules:
  - Task 1 is today's gate made visible: `unlock` → `build`; `deliveries` → `serve` with today's count; `after` → `playtime` with today's seconds; `challenge` → `win`; `bid` → `bid`. Never change a number.
  - Tasks 2–3 teach, and are chosen from `hire` (the shop's next head), `rate` and `noMissed`, sized so the pacing sim's tuned player finishes them **before** task 1 (record the sim's time for each).
  - Downtown is fixed: ch1 (tutorial, `downtown-1` plays at start, so ch1's tasks are the tutorial's: bake, serve, earn $10, second oven, hire Marco) · ch2 `downtown-2`: serve 424, hire the oven head, `rate` 6/min · ch3 `downtown-3`: serve 941, hire the counter head, open the shop report (kind `report`, done by v5.22; until then auto-done) · ch4 `downtown-4`: serve 2,217, rate 30/min (check against the sim and lower if the sim misses it), `noMissed` 120 s.
  - No task says "buy", "upgrade" or names a station level. A head hire is allowed (it is a story person, and the hire scenes exist).
  Then report progress with `Needs: chapters.md written` and continue.
- [x] **2. Types and data.** `ChapterTask { kind; shop; target; key }` and `Chapter { sceneId; key; tasks }` in `cities/types.ts`; `CityDef.chapters?: Chapter[]`. `home/chapters.ts` from the table. Keys `chapter.<sceneId>.title`, `chapter.<sceneId>.teaser`, `task.<sceneId>.<n>` (W2 writes the text).
- [x] **3. Progress.** `engine/chapters.ts`: `taskProgress(g, task) → { current, target, done }` for every kind. Counters: `serve` from the shop's `sold`; `rate` from the shop's served-per-minute held 30 s (store the best held value in the save so it can't un-tick); `noMissed` from a missed-orders counter (add the minimal reader to `service.ts`: missed = wanted − sold over the last N s while the app is open); `hire`, `build`, `win`, `bid` from the save; `playtime` from `sceneAt` like today's `after`; `report` from a save flag set by v5.22 (auto-done while no reader exists). A done task stays done (saved in `chapters.done: string[]`).
- [x] **4. The gate.** In `story.ts`: a scene with a chapter is triggered when every task is done and its `requires` are seen; a scene without one keeps today's trigger. `storyWaitHint` becomes unused (the chapter's `win`/`bid` task says it); delete it and its callers' use through U1 (`Needs:` to U1 if a call site is outside your files).
- [x] **5. Selectors.** `currentChapter(g)`, `chapterTasks(g)` (rows with progress), `nextTask(g)` (first unfinished), `chapterReady(g)` (done, waiting on pacing) with the seconds left on the 90 s rule.
- [x] **6. Migration.** Bump the save version. Chapters of seen beats are done; the current chapter's tasks tick from the save. Test: a save at each home beat loads with the right current chapter.
- [x] **7. Pacing.** `pacing-sim.ts` prints, per beat, the time it plays now and before. Every beat within ±5% of v5.20's time, or report the beat and the task that moved it.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`; `npx tsx scripts/pacing-sim.ts | tail -30`; `npx tsx scripts/api-digest.ts`.

## Report
Standard format, plus the pacing comparison (beats that moved, if any).
