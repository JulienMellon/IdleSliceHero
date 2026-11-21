# Card E1b — the next shop waits for the current chapter

**Lane:** E. **Added:** 2026-11-21 by session S8. **Decision:** Julien, 2026-11-21, option 1.

## Why
The story must advance in order. Today a player who rushes can build the next shop without growing the current one, and then a chapter whose tasks need that shop never finishes. In the pacing sim, the EAGER player waits about 500 minutes at waterfront-2. Julien: "allowing a scene to just not happen because the player didn't need to grow that shop in order to move on is a pacing issue." Path-independent scenes are fine when that is intentional. A scene that stalls is not.

## Rule
Building the next shop in the home city needs the current chapter's beat to have played. That means the chapter of the shop the player would leave behind, the one whose tasks need it. While the build is locked:
- the build button or map slot shows that it is locked and why, in one short line (e.g. "Finish Chapter 6 first"), and tapping it opens the task list on the Story tab;
- the goal bar keeps showing the chapter's next task.

Scenes marked as path-independent, interludes and manager-hire scenes keep their own triggers. Boston has no chapters, so it is unchanged. Old saves that already own a later shop are never locked out of it.

## Files in scope
- `src/engine/chapters.ts`, `src/content/cities/home/chapters.ts`
- the engine function that allows a shop build. Find it through `docs/API.md` and name it in this card before you edit it.
- the build button or map slot component, for the lock line and the tap target (one small change; say which file)
- tests next to each of these files, and `scripts/pacing-sim.ts`
- `docs/story/COPY-v5.21.md` and `src/content/copy/home/chapters.ts`, for the lock line only: one key, `chapter.buildLocked`, ≤ 32 chars, with `{n}` for the chapter number

## Steps
- [x] 1. Name the build-gate function and the UI file here. GATE: `buildLock` (src/engine/game.ts), asking `buildChapter` (src/engine/chapters.ts); `buildShop` calls it. UI: `lotView` in src/components/city-model.ts (model) + src/app/city.tsx (row and map tap). Each shop waits for the beat 3 of the shop before it: suburbs <- downtown-3 (the founder's takeover, downtown-4, already holds it), waterfront <- suburbs-3, university <- waterfront-3, industrial <- university-3, uptown <- industrial-3. List every shop build and the chapter that must be done before it.
- [x] 2. Engine gate plus tests: the build is refused while the chapter is open and allowed once its beat has played. An old save that already owns the shop keeps it. Boston is untouched.
- [x] 3. UI lock line and tap-to-Story-tab, with a test. (The lot sends `router.dismissTo(LOCKED_LOT_TAP)`; src/app/index.tsx must read the `tasks` param to open the list: out of scope, see report.)
- [x] 4. `npx tsx scripts/pacing-sim.ts 2>&1 | tail -12`: the tuned run's beats must not move more than they do now (only downtown-2 +8.9%). The EAGER run must not wait at any beat much longer than the tuned run does. Report the EAGER run's longest wait and the beat where it happens.
- [x] 5. Fixture: one shot of a locked build with its line, under `scripts/fixtures/` (follow `scripts/fixtures/README.md`).

## Checks
`npx tsc --noEmit`, `npm test`, `npm run format:check`, the pacing line from step 4, and `--only <your fixture>`.
