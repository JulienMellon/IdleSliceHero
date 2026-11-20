# Card U1 — the goal bar is the next chapter task (v5.21, lane U)

**Goal:** the bar at the top shows `Ch <n> · <task label>` and the task's progress ("212/424"), changes only when a task completes, and a tap always opens the task list on its Story tab. It never buys.

**Why (Julien, 2026-11-20):** "The progress meter at the top that displays 'downtown hire Marco (prep)' is not communicating that it is a goal very well… have a task list open when you tap the progress bar. The progress bar can still show progress to the next task."

**Read first:** the goal block of `src/app/index.tsx` (from `// Goal bar` to the story fallback), `src/components/goal-model.ts`, the goal bar in `src/components/game-ui.tsx`, `src/engine/chapters.ts` (E1), `docs/story/COPY-v5.21.md` (W2).

## Files
- Own: the goal block of `src/app/index.tsx`, `src/components/goal-model.ts`, the goal bar and the `open-tasks` button in `src/components/game-ui.tsx`, `src/components/__tests__/goal*.test.ts`, one new fixture `scripts/fixtures/<next free number>_u1b.py`.
- Do not touch: `src/components/rewards-ui.tsx` (U2), `src/engine/**`.

## Steps
- [ ] **1. The bar's goal** = `nextTask(g)` with its label and progress; `chapterReady` shows `chapter.ready` with the countdown; after the last chapter, today's mastery goal, then the story count. Keep the short and tiny forms (G98) for narrow bars.
- [ ] **2. Remove the purchase candidates** (`candidates`, `bigGoals`, `pickGoal`'s use here, the Pier 9 bid candidate, `goalHidesOwnHire`'s use for the bar). Keep `pickGoal` only if another caller uses it.
- [ ] **3. Tap opens the list.** `onPress` opens the tasks drawer on the Story tab (U2 adds the tab; until it lands, open the drawer). A full bar is basil with "Ready" for a done chapter waiting on pacing; no buy path remains.
- [ ] **3b. The `open-tasks` button** shows from the start of the game (today it waits for rewards to unlock); it opens the list on the Story tab.
- [ ] **4. A task completing** flashes the bar once (≤ 600 ms) and moves to the next task.
- [ ] **5. Tests** for the label, progress and fallbacks; **fixture** with shots of chapter 2 at 0, half, done-waiting.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
