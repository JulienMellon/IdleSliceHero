# Card E2 — tutorial steps 7 and 8 on (v5.21, lane E)

**Goal:** after the first sale, Nonna lights the goal bar ("Nonna keeps a list. Tap it."), the task list opens on Chapter 1 with its first three tasks already ticked, and the next task is the second oven.

**Read first:** `src/engine/tutorial.ts` (`CHAPTERS_ON`, steps 7 and 8 from v5.20 card C3), `docs/story/COPY-v5.20.md` lines `tutorial.7` and `tutorial.8`, `src/engine/chapters.ts`.

## Files
- Own: `src/engine/tutorial.ts`, its tests, the coach block of `src/app/index.tsx` (the drawer-open signal only), one fixture `scripts/fixtures/<next free number>_e2.py`.

## Steps
- [x] **1.** `CHAPTERS_ON = true` (or remove the constant). Step 7: `hud:goal`, tap, ends when the task list is open. Step 8: `tasks:story`, look, ends when the list is closed (`tasks:close`).
- [ ] **2.** Chapter 1's tasks are the tutorial's (bake, serve, earn $10, second oven, hire Marco); at step 8 the first three are done. The bar during step 9 shows "Second oven" with `$12/$25`-style progress, so step 9's line can point at it.
- [x] **3.** Saves are unaffected: v5.20 never stored 7 or 8, and a save at 9 or later keeps its step (it doesn't go back to 7).
- [x] **4. Tests and fixture:** steps 7 and 8 with shots.

## Checks
`npx tsc --noEmit`; `npx jest src/engine`; `npm run format:check`.

## Report
Standard format.
