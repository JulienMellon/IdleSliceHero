# Handoff — Slice Empire (IdleSliceHero), after v3.7

For a fresh session picking up the build/review loop. Read this file, then `CRITICLOG.md` and `CODELOG.md`, which hold only the current state. Leave the archives in `docs/logs/` alone unless you need the history of a recurring issue.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; the repo is `JulienMellon/IdleSliceHero`. The design doc is `docs/DESIGN.md`, and the reward notes the owner added are in `docs/REWARDS.md`.
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with **React Compiler on** (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`) and a pure-TS engine (`src/engine/game.ts`). Content and tuning live in `src/content/`.
- **Version:** `src/content/version.ts`, shown in the drawer footer. The current build is **3.7**. The next build is **3.8**, and builds go up by 0.1 each step.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals over open questions and evidence over superlatives.

## The loop (run each step until both reviewers pass)
1. **Build v3.(n+1).** Fix every open note in `CRITICLOG.md` and every open item in `CODELOG.md`. Set the version with `sed -i "s/export const APP_VERSION = .*/export const APP_VERSION = '3.8';/" src/content/version.ts`.
2. **Verify:**
   - `npx tsc --noEmit` must be clean.
   - `npm test` must pass (111 tests at v3.7, about 110 s).
   - `npx expo export --platform web`, then `python3 scripts/screenshots.py v3.8`. `screenshots/v3.8/report.json` must show `"errors": []` and `"loaded": true`.
   - Look at the PNGs yourself. Crop them with PIL into the scratchpad, especially 03b, 05, 05a, 13, 14 and 01.
3. **Log:**
   - Append a `## v3.8 — build` table (note → fix) to `CRITICLOG.md` and to `CODELOG.md`.
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

## Where things stand at v3.7
- **Critic, round 38: SATISFIED** (the same 3 carried minors: D302, D303, D306). **Codecritic, round 9: APPROVED** (one [medium], C39). Both passed on v3.7; the loop is parked.
- **v3.4–v3.6:** crowd fixes, the one-time playtest fixes and the typed furniture memo. **v3.7:** save v3; story pacing (one waiting beat after a launch or return, then 90 s of play between beats from the very start, finales 300 s after beat 3 and Downtown 120 s; player-caused scenes immediate; downtown-3 at 45 pizzas); perks scoped to each neighbourhood (Dale walk-ins 85%, Marisol +10% via the $2.0M Pier 9 bid after 50,000 Waterfront pizzas, Priya University driver upgrades −10%, Big Sal +25% offline, Genevieve 6% per decor tier); `docs/REWARDS.md` notes the story perks.
- **Pacing sim at v3.7:** Nonna takes over at 5.0 min (was 1.4), Suburbs at 5.0 (was 2.0), the bid is won at 35.9 min, University at 70.4 (was 66.1), the city completes at 227 min (was 221). Julien was told the tutorial now runs longer than the 1–2 min estimated; he may want Downtown's finale on the normal 90 s gap (~4.5 min) or the tutorial exempted.
- **Next, v3.8:** fix C39 first (a quick iOS interruption resets the story gap), then the tap targets to ≥ 44 pt via named layout constants (buy button grows to 44 pt; the label strip keeps ~20 pt but gets an upward-only hit area with a 4 pt dead gap; chips to 44 pt; a test asserts every constant ≥ 44; check the curb walkers still clear the taller row). The cheap notes D307/D308 and the C40–C43 lows can ride along.
- **After that:** daily and weekly tasks (`docs/REWARDS.md`). Deferred: the dead-zone fix (design discussion first), sound, franchise-to-Boston (Claude Doc "Franchise to Boston — Prestige Design").
- **Open notes:** all in `CRITICLOG.md` and `CODELOG.md` (next IDs G75/D309 and K1/C44/A14/M22/T33).

## Lessons learned (avoid repeating them)
- **Crowd overlaps:** fix them in the pure modules (`scene/cast.ts`, `scene/timelines.ts`, `scene/layout.ts`). Prove the fix with a budget in `scene/__tests__/crowd.test.ts` that **fails on the old code**. In rounds 30–34, fixes made only from screenshots moved the overlap to a new spot every time.
- **Memo deps:** when a memo builds a lot of JSX, give the builder a single typed input object and derive the deps from it (`furnitureInputs` / `furnitureDeps`); a hand-listed dep array already shipped one bug (v3.5 missed `prep`).
- **Memoisation:** React skips a subtree only when the props equal the *previous frame's*, so an LRU of old elements doesn't help (round 3, C12). Keep memoised parts on primitive props, and quantise motion in time (the pose clock), not only in value.
- **Node tests:** Jest runs ts-jest in a node environment, and `.ts` test files can't import `.tsx` or `react-native-svg`. Put testable logic in pure `.ts` modules.
- **Owner direction:** don't remove owner-required scene elements, such as the WELCOME mat, while fixing something else.

## Outside the loop
- The one-time UX playtest of v3.0–v3.2 was acted on at Julien's request (v3.4–v3.7). The dead-zone, endgame and tap-target items from it are the only parts still open.
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~640 files, ~200 MB). Ask Julien before pruning; don't delete them unasked.
- The Settings screen now shows `APP_VERSION`; `app.json` (`2.0.0`) stays the App Store marketing version.
