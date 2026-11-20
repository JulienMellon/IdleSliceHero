# Card U2 — the Story tab (v5.21, lane U)

**Goal:** the task list (today's tasks drawer) opens from the start of the game with a first tab, **Story**: the chapter's title, the teaser for the scene it unlocks, its 2–4 tasks with a tick or progress, and its reward. Daily and Weekly stay as they are and stay locked until Nonna's takeover.

**Read first:** `src/components/rewards-ui.tsx` (the drawer, `tab: 'daily' | 'weekly'`), the `open-tasks` button in `src/components/game-ui.tsx` and what hides it before rewards unlock, `src/engine/chapters.ts` (E1), `docs/story/COPY-v5.21.md` (W2).

## Files
- Own: `src/components/rewards-ui.tsx`, `src/components/rewards-model.ts`, a new copy table `src/content/copy/home/chapters.ts` (W2's keys, byte for byte) and its line in `src/content/copy/index.ts`, `src/components/__tests__/rewards*.test.ts`, one new fixture `scripts/fixtures/<next free number>_u2.py`.
- Do not touch: the goal block and `game-ui.tsx` (U1: it makes the `open-tasks` button show from the start), `src/engine/**`.

## Steps
- [ ] **1. Tabs** `story | daily | weekly`; Story first and the default. Before rewards unlock, Daily and Weekly show a padlock and "Opens when Nonna takes over". Accept an initial-tab prop so U1's bar and button open Story.
- [ ] **2. Story tab layout:** chapter number and title; the teaser in italics with the next scene's character portrait (36 pt); task rows (tick, label, progress bar with "212/424", no Claim button: tasks complete themselves); a reward row ("🎬 New scene · 💎 5"). When the chapter is done and waiting: "Next scene in 0:42".
- [ ] **3. Register coach targets** `tasks:story` (the tab's body) and `tasks:close` with `useCoachTarget` for the tutorial (card E2).
- [ ] **4. Tests and fixture:** chapter 1 during the tutorial (three ticks), chapter 2 mid-way, a done chapter waiting; Daily locked before the takeover.

## Rules
44 pt targets, 10 pt text, a teaser that fits two lines at 375 wide.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
