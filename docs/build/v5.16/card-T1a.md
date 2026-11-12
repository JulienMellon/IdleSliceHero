# Card T1a — the Todd B-plot: rules, scenes, tests (v5.16, lanes T and E)

**Goal:** 35 scenes instead of 24, with interludes that fire on play time and hold main beats back, the rival challenge as beat 4's trigger, and every pending text change applied.

**Spec:** `docs/specs/PLAN-v4.4-todd-interludes.md`, sections 2–4, 7 and 9. **Script:** `docs/story/STORY-v4-final.md` (copy its text exactly). **Other copy:** `docs/story/COPY-v5.16.md`, sections 2–4. If the script file is missing, report BLOCKED at once.

## What to rebase from the spec (it was written at save v3, with a 4-hour economy)
- **Save:** `SAVE_VERSION` 5 → 6. The idempotent "mark required interludes seen" migration is as specified.
- **Scenes** now live in `src/content/scenes/home/<neighbourhood>.ts`.
- **Delays:** keep the spec's `after` seconds as the starting point, then adjust with the sim (step 5). Card E2b runs the final economy refit after you.
- **Beat 4 trigger:** add a fourth trigger kind, `{ kind: 'challenge'; neighborhood }`, true when `challengeWon(g, id)` from `features/layers/rival.ts` is true (see `docs/API.md`). Every neighbourhood's beat 4 uses it, on top of its `requires`. The finale wait rule (300 s after beat 3; Downtown 120 s) now gates when the challenge is **offered**, not when the scene plays; export `challengeOffered(g, id)` for the UI.
- **Pier 9:** the spec's `pier9Available` rule stands. The bid's price is now a live auction (card E2a); don't touch the price.

## Files
- Own: `src/content/types.ts`, `src/content/scenes/**`, the story functions in `src/engine/game.ts` (`sceneTriggered`, `pendingScenes`, `sceneHeading`, `pier9Available`, `storyWaitHint`, the story part of `migrate`), `src/engine/cutscene-input.ts`, `src/engine/__tests__/story-content.test.ts` (new), `story-pacing.test.ts`, `scenes-golden.test.ts` (re-record), `scripts/pacing-sim.ts` (story modelling only).
- Do not touch: `src/engine/features/**`, `src/components/**` (card T1b draws the looks, props, Scrapbook and hint).

**Running beside you:** card E2b (delivery rates, sim player) edits other functions in `src/engine/game.ts` and `scripts/pacing-sim.ts` at the same time. Re-read each of those two files immediately before every edit, change only your own functions, and never reformat or reorder the file.

## Steps
- [ ] **1. Types and engine rules** (spec sections 2 and 4, plus the `challenge` trigger above). Characters `mr-smith`, `todd-coat`, `slicey` and the three new props are added to the types here; T1b draws them. Until then they may render as the `megaslice-rep` bust.
- [ ] **2. Tests** (spec section 7), plus: beat 4 waits for the challenge; `challengeOffered` respects the finale wait; a v5 save with beat 4 seen keeps it seen.
- [ ] **3. The 11 interludes**, copied from the script, with the triggers and `requires` of spec section 3.
- [ ] **4. Text edits:** the 12 scene edits in the script; the fold-ins S1–S3 and S5–S8 from spec section 9 (not S4); then `COPY-v5.16.md` sections 2 (beat-4 line changes), 3 (held fixes and still-open review rows) and 4 (head story lines). Dale's perk text changes as S5 says: find it with `grep -rn "dine-in" src/content`.
- [ ] **5. Sim.** Model `after`, `requires` and `challenge`. Print all 35 scenes and assert all 35 play. Tune the `after` delays so no gap between scenes exceeds 12 minutes of play. Add the run where University is built before the bid.
- [ ] **6. Fixture seeds.** `grep -n "industrial-3" scripts/screenshots.py scripts/fixtures/*.py`: any seeded save meant to have exactly one scene due needs the new interludes in its seen list. This is the one edit you may make outside your files; keep it to the seen lists.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; `npx tsx scripts/pacing-sim.ts | tail -45`.

## Report
Standard format, plus: scenes that play in the sim (expect 35), the longest gap, and the final `after` delays if you changed any.
