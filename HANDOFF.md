# Handoff — Slice Empire (IdleSliceHero), after v3.6

For a fresh session picking up the build/review loop. Read this file, then `CRITICLOG.md` and `CODELOG.md`, which hold only the current state. Leave the archives in `docs/logs/` alone unless you need the history of a recurring issue.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; the repo is `JulienMellon/IdleSliceHero`. The design doc is `docs/DESIGN.md`, and the reward notes the owner added are in `docs/REWARDS.md`.
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with **React Compiler on** (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`) and a pure-TS engine (`src/engine/game.ts`). Content and tuning live in `src/content/`.
- **Version:** `src/content/version.ts`, shown in the drawer footer. The current build is **3.6**. The next build is **3.7**, and builds go up by 0.1 each step.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals over open questions and evidence over superlatives.

## The loop (run each step until both reviewers pass)
1. **Build v3.(n+1).** Fix every open note in `CRITICLOG.md` and every open item in `CODELOG.md`. Set the version with `sed -i "s/export const APP_VERSION = .*/export const APP_VERSION = '3.7';/" src/content/version.ts`.
2. **Verify:**
   - `npx tsc --noEmit` must be clean.
   - `npm test` must pass (89 tests at v3.6, about 100 s).
   - `npx expo export --platform web`, then `python3 scripts/screenshots.py v3.7`. `screenshots/v3.7/report.json` must show `"errors": []` and `"loaded": true`.
   - Look at the PNGs yourself. Crop them with PIL into the scratchpad, especially 03b, 05, 05a, 13, 14 and 01.
3. **Log:**
   - Append a `## v3.7 — build` table (note → fix) to `CRITICLOG.md` and to `CODELOG.md`.
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

## Where things stand at v3.6
- **Critic, round 37: SATISFIED** (0 bugs, 0 [major], 3 [minor]: D302 empty sky above early shops, D303 back-row density, D306 identical chefs). **Codecritic, round 8: APPROVED** (only low items open). Both passed on v3.6, so the loop is parked, not running.
- **What v3.4–v3.6 did:** the crowd fixes (G72, D282–D285, C19–C21, A9, M11), the one-time playtest fixes (cut-scene input lockout and scene gate, hidden spoiler titles, number formatting, offline cap note, build toast with cost, Drivers cap at `levelCap`, Suburbs locked until Nonna takes over, tied-station bundle hint, story polish with two new props) and the furniture memo with typed inputs.
- **Agreed next work (decisions from Julien, 2026-10-29; the full plan is `claude/PLAN-v3.4-v3.6.md` in the project, whose version numbers are now +1):**
  1. **v3.7 — story pacing and perks, one save migration.** One story beat on return, then at most one per 90 s of play from the very start (tutorial included; unlock scenes stay immediate); beat 4 needs ≥ 300 s after beat 3 (Downtown ≥ 120 s); downtown-3 moves 60 → 45 pizzas. Perks scoped to the character's own neighbourhood shop: Dale (Suburbs) walk-ins pay 85% instead of 70%, Marisol (Waterfront) +10% prices via a Pier 9 bid worth ~4–5 min of income (number set from the pacing sim and shown to Julien first), Priya (University) −10% fleet cost, Sal (Industrial) +25% offline earnings, Genevieve (Uptown) decor boost 6% per tier. Update `docs/REWARDS.md` line 7 to allow small neighbourhood-scoped story perks. Update the pacing sim to model scene gaps.
  2. **v3.8 — tap targets** to ≥ 44 px via named layout constants (walk buttons, chips, compact buy buttons), after D285.
  3. Then daily and weekly tasks (`docs/REWARDS.md`). Deferred: the dead-zone fix (design discussion first), sound, franchise-to-Boston (design doc in Claude Docs: "Franchise to Boston — Prestige Design").
- **Open notes:** all in `CRITICLOG.md` and `CODELOG.md` (next IDs G75/D307 and K1/C39/A13/M20/T29).

## Lessons learned (avoid repeating them)
- **Crowd overlaps:** fix them in the pure modules (`scene/cast.ts`, `scene/timelines.ts`, `scene/layout.ts`). Prove the fix with a budget in `scene/__tests__/crowd.test.ts` that **fails on the old code**. In rounds 30–34, fixes made only from screenshots moved the overlap to a new spot every time.
- **Memo deps:** when a memo builds a lot of JSX, give the builder a single typed input object and derive the deps from it (`furnitureInputs` / `furnitureDeps`); a hand-listed dep array already shipped one bug (v3.5 missed `prep`).
- **Memoisation:** React skips a subtree only when the props equal the *previous frame's*, so an LRU of old elements doesn't help (round 3, C12). Keep memoised parts on primitive props, and quantise motion in time (the pose clock), not only in value.
- **Node tests:** Jest runs ts-jest in a node environment, and `.ts` test files can't import `.tsx` or `react-native-svg`. Put testable logic in pure `.ts` modules.
- **Owner direction:** don't remove owner-required scene elements, such as the WELCOME mat, while fixing something else.

## Outside the loop
- The one-time UX playtest of v3.0–v3.2 was acted on at Julien's request (v3.4–v3.6 above). The dead-zone, endgame and tap-target items from it are the only parts still open.
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~640 files, ~200 MB). Ask Julien before pruning; don't delete them unasked.
- The Settings screen shows the app.json version (`2.0.0`), not `APP_VERSION`. Leave it alone unless the critic or Julien raises it.
