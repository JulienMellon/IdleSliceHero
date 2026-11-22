# Card E6 — the Store intro (v5.23, lane E, with the pop-up removal in lane N)

**Goal:** at the end of Chapter 1, Nonna lights the Store chip, the Shop opens on the Store tab with the Starter Pack card lit, and her line plays. "Not now" or Buy ends it. The 30-seconds-later pop-up sheet is gone.

**Read first:** `src/engine/tutorial.ts`; `src/components/store/starter-sheet.tsx` and its slot in `src/components/slots.tsx`; `starterAt` in `src/store/game-store.ts`; U5's `hud:store` and N1's Starter card; `docs/story/COPY-v5.23.md` (`tutorial.16`, `tutorial.17`).

## Files
- Own: `src/engine/tutorial.ts`, `src/engine/game.ts` (`TUTORIAL_DONE` and migration only), `src/store/game-store.ts` (`starterAt` and `prefs.starterOffered` only), `src/components/store/starter-sheet.tsx` (delete), its line in `src/components/slots.tsx`, the Starter card's `useCoachTarget('store:starter')` call in `src/components/store/` (one line), the coach overlay's mount in `src/app/shop.tsx` (one line, so the overlay draws on the Shop screen), tests, one fixture `scripts/fixtures/<next free number>_e6.py`.

## Steps
- [x] **1. Steps 16 and 17.** 16: `hud:store` tap → opens `/shop?tab=store` (`store_opened{from:'intro'}`). 17: `store:starter` look, ends on "Not now", Buy, or leaving the Shop. `TUTORIAL_DONE` = 18. A save at 16 (done in v5.20–v5.22) is mapped to 18 only if the Starter Pack is owned; otherwise to 16, so existing players see the intro once.
- [x] **2. Hold** everything else that can cover the screen (story, gifts, offers) during 16–17.
- [x] **3. Remove the pop-up:** delete `starter-sheet.tsx`, its slot entry, `starterAt`, `starterShows` and `STARTER_DELAY`; keep `prefs.starterOffered` as "the intro has run".
- [x] **4. Tests and fixture:** both steps on a fresh save; an owner of the pack skips them; no sheet anywhere.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`.

## Report
Standard format.
