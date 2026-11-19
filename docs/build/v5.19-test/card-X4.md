# Card X4 — story and save tools (v5.19-test, lane U; store actions E)

**Goal:** from the Test panel Julien can play the next story beat at once, skip the tutorial, copy the save out, paste one in, and reset the test save (clock offset included).

**Read first:** `docs/API.md`; `docs/PLAN-test-mode.md` section 2 ("Story & save"); `docs/build/v5.19-test/VERSION.md` ("Defaults"); `src/dev/README.md` (card X1).

## Files
- Own: `src/dev/story-save.ts` and `src/dev/story-save-section.tsx` (new), `src/dev/__tests__/story-save.test.ts` (new).
- Shared, append-only: `src/dev/panel-sections.ts` (one line: Story & save), `src/store/game-store.ts` (test-mode actions in a block marked `X4`), `scripts/fixtures/test-mode/x4_story_save.py`.
- Read only: `src/engine/story.ts` (`pendingScenes` at 47, the beat-4 gap at 102-103), `src/content/tuning.ts` (`STORY_PACING` at 76), `src/engine/tutorial.ts` (`TUTORIAL_DONE` at 19), `src/engine/clock.ts` (X2's offset setter).
- Do not touch: `src/content/**`, `src/engine/**` (call their exports only), anything X1 to X3 own.

## Steps
- [x] **1. Play next story beat now.** Make the next scene `pendingScenes` would give due now, skipping the play-time gap (`beat4GapSeconds` / `firstHoodBeat4GapSeconds`), and play it through the store's normal scene path. Do it by moving `playSeconds` or the beat stamp in the test state, never by editing `STORY_PACING`. Disabled with a reason when no beat is waiting on a gap.
- [x] **2. Skip tutorial.** Set `tutorial` to `TUTORIAL_DONE` with whatever the coach steps would have granted (read `tutorialAdvance` at `tutorial.ts:96`), so the game is in the state a player who finished it is in.
- [x] **3. Export save.** Copy the current test save JSON to the clipboard (the web clipboard API; show "Copied" for 2 s). Fallback when the clipboard is refused: show the JSON in a selectable text box.
- [x] **4. Import save.** A paste box and an Import button: parse, `migrate`, back up the current save to the X3 backup slot first, then load. A bad paste shows the parse error and changes nothing.
- [x] **5. Reset test save.** Confirm, then clear `slice-empire/save/test-v1`, the backup slot and the test prefs (free buys back to ON, speed 1×, clock offset 0) and start a new game. Never touches the v1 keys.

## Tests that must exist
Next beat: with a beat waiting on the gap, it plays and the story moves one beat; with none, the row is refused. Skip tutorial leaves `coachStep(s)` null. Export then import gives back the same state. A bad import changes nothing. Reset clears the three test keys, puts the offset at 0, and leaves `slice-empire/save/v1` untouched.

## Checks
`npx tsc --noEmit`; `npx jest src/dev src/store`; `npx expo lint`.

## Fixtures
`scripts/fixtures/test-mode/x4_story_save.py` (new): the Story & save section; the scene that "Play next story beat now" opens; the import box with a parse error. Run it as card X1 says (`SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode … --only x4_story_save`).

## Report
Standard format.
