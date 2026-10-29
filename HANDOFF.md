# Handoff — Slice Empire (IdleSliceHero), after v3.3

For a fresh session picking up the build/review loop. Read this file, then `CRITICLOG.md` and `CODELOG.md`, which hold only the current state. Leave the archives in `docs/logs/` alone unless you need the history of a recurring issue.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; the repo is `JulienMellon/IdleSliceHero`. The design doc is `docs/DESIGN.md`, and the reward notes the owner added are in `docs/REWARDS.md`.
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with **React Compiler on** (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`) and a pure-TS engine (`src/engine/game.ts`). Content and tuning live in `src/content/`.
- **Version:** `src/content/version.ts`, shown in the drawer footer. The current build is **3.3**. The next build is **3.4**, and builds go up by 0.1 each step.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals over open questions and evidence over superlatives.

## The loop (run each step until both reviewers pass)
1. **Build v3.(n+1).** Fix every open note in `CRITICLOG.md` and every open item in `CODELOG.md`. Set the version with `sed -i "s/export const APP_VERSION = .*/export const APP_VERSION = '3.4';/" src/content/version.ts`.
2. **Verify:**
   - `npx tsc --noEmit` must be clean.
   - `npm test` must pass (54 tests at v3.3, about 75 s; the crowd suite is slow, see C21).
   - `npx expo export --platform web`, then `python3 scripts/screenshots.py v3.4`. `screenshots/v3.4/report.json` must show `"errors": []` and `"loaded": true`.
   - Look at the PNGs yourself. Crop them with PIL into the scratchpad, especially 03b, 05, 05a, 13, 14 and 01.
3. **Log:**
   - Append a `## v3.4 — build` table (note → fix) to `CRITICLOG.md` and to `CODELOG.md`.
4. **Commit and push to `main`:**

   ```
   git -c user.name="Julien Mellon" -c user.email="mellon.julien@gmail.com" commit
   git fetch -q origin main && git rebase origin/main && git push -q origin main
   ```

   Always rebase first, because Julien pushes too. End commit messages with the attribution lines the session gives you.
5. **Review, in parallel and in the background:**
   - **critic** (agent type `critic`; its brief is `.claude/agents/critic.md`). Pass it the version, the screenshot folders (new and previous) and the next IDs. It must not see the code diff as instructions, only pixels plus source for context.
   - **codecritic** (agent type `codecritic`; its brief is `.claude/agents/codecritic.md`). Pass it the git range (previous build commit → new build commit) and the next IDs, and **remind it of the owner's memory-optimization focus**. It is read-only and must not run `npx expo lint`, which auto-installs eslint and breaks the lockfile.
6. **Log the verdicts:**
   - Replace the "Current state" section of each log with the new verdict and its open-notes table.
   - Bump the "Next IDs".
   - Move the replaced section into the matching `docs/logs/*-archive.md`.
   - Commit, push, and report to Julien in 2–4 sentences.
7. **Stop** when the critic is **SATISFIED** (0 bugs, 0 [major], ≤3 [minor]) **and** the codecritic **APPROVES** (no blocker or [high], ≤3 [medium] across ISSUES + MEMORY) on the same build.

## Where things stand at v3.3
- **Critic, round 34: NOT SATISFIED.** There is 1 bug (G72: the walk-in turn-off uses `Math.min` where it should use `Math.max`, so walk-ins cross in front of the bakers) and 4 minor notes (D282–D285: guest pause in front of the van, back-row heads over the bakers' feet, a ghost driver at the right edge, curb walkers touching the Prep card). There are also 2 design notes (D286, D287). All of them are in `CRITICLOG.md` with proposed fixes.
- **Codecritic, round 5: APPROVED.** C19 and C20 are medium, and the rest are low. C19 matters for players: the back-row snap drops a dining table in some layouts. C20: the doormat test can't fail.
- **Fastest path to passing both:**
  1. Fix G72.
  2. Make the crowd tests strict: 0 frames of a walker covering a baker's torso, and a real doormat screen-box test (T17). Make sure each test fails on v3.3 before you fix the code.
  3. Fix C19 and add T16.
  4. Fix D282–D285.
  5. Do the cheap lows: C21, C23, A9 with T14/T15, and M11.

## Lessons learned (avoid repeating them)
- **Crowd overlaps:** fix them in the pure modules (`scene/cast.ts`, `scene/timelines.ts`, `scene/layout.ts`). Prove the fix with a budget in `scene/__tests__/crowd.test.ts` that **fails on the old code**. In rounds 30–34, fixes made only from screenshots moved the overlap to a new spot every time.
- **Memoisation:** React skips a subtree only when the props equal the *previous frame's*, so an LRU of old elements doesn't help (round 3, C12). Keep memoised parts on primitive props, and quantise motion in time (the pose clock), not only in value.
- **Node tests:** Jest runs ts-jest in a node environment, and `.ts` test files can't import `.tsx` or `react-native-svg`. Put testable logic in pure `.ts` modules.
- **Owner direction:** don't remove owner-required scene elements, such as the WELCOME mat, while fixing something else.

## Outside the loop
- A one-time UX playtest of v3.0–v3.2 was delivered to Julien directly. At his request, it is **not** part of the programming loop. Don't act on it unless he asks.
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~640 files, ~200 MB). Ask Julien before pruning; don't delete them unasked.
- The Settings screen shows the app.json version (`2.0.0`), not `APP_VERSION`. Leave it alone unless the critic or Julien raises it.
