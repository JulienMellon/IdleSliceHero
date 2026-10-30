# Handoff — Slice Empire (IdleSliceHero), after v4.3

For a fresh session. Read this file first, then `CRITICLOG.md` and `CODELOG.md` (current state only; history in `docs/logs/`), and `STORYLOG.md` / `AUDIOLOG.md`. The project's `claude/HANDOFF.md` mirrors this file.

## Status: the build/review loop is PAUSED (Julien, 2026-10-30)
- The loop stopped after the critic's review of v4.3. **The codecritic is paused**: don't run it until Julien says so.
- Don't start a new build step unless Julien asks. When he does, the loop below applies.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; repo `JulienMellon/IdleSliceHero`. Design: `docs/DESIGN.md`; retention features: `docs/REWARDS.md`; prestige design: Claude Doc "Franchise to Boston — Prestige Design".
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with React Compiler on (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`), a pure-TS engine (`src/engine/`). Content and tuning in `src/content/`.
- **Version:** `src/content/version.ts` (drawer footer and Settings). Current build **4.6**; builds go up by 0.1 (3.9 → 4.0 → … → 4.6; next 4.7). `app.json` (2.0.0) stays the App Store marketing version.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals he can correct over open questions, and evidence over superlatives.

## Reviewers (agent types; briefs in `.claude/agents/`)
| Agent | Reviews | Log | Gates the loop? |
| --- | --- | --- | --- |
| `critic` | Pixels: screenshots vs. top idle games, characters, layout | `CRITICLOG.md` | Yes: SATISFIED = 0 bugs, 0 [major], ≤ 3 [minor] |
| `codecritic` | The git diff: correctness, architecture, memory (the owner's focus) | `CODELOG.md` | Yes: APPROVED = no blocker/[high], ≤ 3 [medium] in ISSUES + MEMORY. **Paused.** |
| `storycritic` | Story, cut-scenes, hooks, voice, comedy, player-facing text | `STORYLOG.md` | Advisory (added 2026-10-29 at Julien's request); low effort at the end of a loop |
| `audiocritic` | Music, SFX, mix vs. emotion; plans audio until it exists (cue sheet: `docs/AUDIO.md`) | `AUDIOLOG.md` | Advisory; low effort at the end of a loop |

**If an agent type isn't found** (e.g. `audiocritic`): agent definitions are read from `.claude/agents/` when a session starts. Pull `main` first (`storycritic` and `audiocritic` arrived in commit 5573264), then start a new session or reload the repo context. If it still isn't listed, run a general-purpose agent and tell it to follow `.claude/agents/<name>.md` as its brief; the result is the same.

## The loop (when Julien restarts it)
1. **Build v4.(n+1)**: fix the open notes in the logs. `sed -i "s/export const APP_VERSION = .*/export const APP_VERSION = '4.4';/" src/content/version.ts`.
2. **Verify:** `npx tsc --noEmit` clean; `npm test` passes (155 tests, ~110 s); `npx expo export --platform web` then `python3 scripts/screenshots.py v4.4` → `screenshots/v4.4/report.json` shows `"errors": []` and `"loaded": true`. Look at the PNGs yourself (03, 05, 05a, 05b, 13, 16, 21 at least). Shot 22 (perk card) timed out once and passed on a re-run: re-run once before investigating.
3. **Log:** append a `## v4.4 — build` table to `CRITICLOG.md` and `CODELOG.md`.
4. **Commit and push to `main`:** `git -c user.name="Julien Mellon" -c user.email="mellon.julien@gmail.com" commit …`, then `git fetch -q origin main && git rebase origin/main && git push -q origin main` (Julien pushes too). End commit messages with the attribution lines the session gives you.
5. **Review in parallel, in the background:** `critic` (version, new and previous screenshot folders, next IDs) and, unless paused, `codecritic` (git range, next IDs, the memory focus; read-only; never `npx expo lint`). **Don't edit the working tree while the codecritic runs**: it runs `npm test` on it, and a half-made edit once produced a false blocker.
6. **Log the verdicts:** replace each log's "Current state" with the new verdict and its open-notes table **including each note's text** (a later round needs it), bump the next IDs, move the replaced section and build tables to `docs/logs/*-archive.md`, commit, push, report to Julien in 2–4 sentences.
7. **Stop** when the critic is SATISFIED and the codecritic APPROVES on the same build. Then run `storycritic` and `audiocritic` at low effort and log them.

## Where things stand at v4.3
- **Critic, round 44 (v4.3): NOT SATISFIED.** One [major], D336 (walk-ins on top of the pickup driver at the counter), plus D302 (empty sky) and D337 (neckerchiefs too small). v4.3 changed no crowd code, so D336 is likely intermittent crowding caught on a different frame: reproduce it in `crowd.test.ts` first (lesson below).
- **Codecritic, round 14 (v4.2): CHANGES REQUESTED.** Its blockers (C63 [high], C64) are fixed in v4.3 but **not re-reviewed** (paused): when it resumes, review d25b801..HEAD first.
- **Story (advisory, low effort, v4.3):** see `STORYLOG.md` (2 [major]: the loop-closing waterfront-4 ending right before the long dead zone, and university-1's flat ending).
- **Audio (2026-10-30, v4.4 → v4.6, three compose/review loops at Julien's request):**
  - **What exists.** A MIDI score written as code in `tools/audio/` (`compose.py` → spessasynth + GM soundfont → AAC; `python3 build.py` rebuilds everything plus `src/audio/manifest.ts`). It has six neighbourhood style blends on one city motif, gameplay stingers in every key, story cues and 15 synthesised SFX. The runtime is `src/audio/` (director over expo-audio, pure rules in `logic.ts` with tests). Music and Sound toggles are in Settings.
  - **Where to look.** `docs/AUDIO.md` is the cue sheet; `AUDIOLOG.md` holds the round-5 verdict (AU57 fixed after it; AU58–AU61 minors open) and the iPhone device checks.
  - **Note.** Screenshots now log every audio `play()` under `audio` in `report.json`.
  - **Open for Julien.** The device checks, and whether to move SFX and stingers to `react-native-audio-api` if latency or memory fails.
- **Done since the v3.3 handoff** (v3.4 → v4.3): the one-time playtest fixes; crowd fixes; save v3 with story pacing (one beat on return, then 90 s of play between beats from the very start; finales 300 s after beat 3, Downtown 120 s; short iOS interruptions keep the gap); neighbourhood perks (Dale walk-ins 85%, Marisol +10% via the $2.0M Pier 9 bid, Priya University driver upgrades −10%, Big Sal +25% offline, Genevieve 6%/decor tier); 44 pt tap targets, all **drawn** (iOS doesn't deliver hitSlop outside a parent; web ignores hitSlop); the sidewalk row as `components/sidewalk-row.tsx` over a cached, tested `components/sidewalk-model.ts`; one `buttonTone` rule for every purchase button (locked/maxed → normal, muted → neutral, gain ≤ 0 → nogain with a struck price); the "saving for" bottleneck (basil face, dashed basil outline, progress line).
- **Pacing sim (v3.7, greedy buyer):** Nonna takes over at 5.0 min (was 1.4: Julien was told; he may want Downtown's finale on the normal 90 s gap, ~4.5 min, or the tutorial exempt), Pier 9 bid won at 35.9 min, University opens at 70.4 min (the deferred dead zone), the city completes at ~227 min.

## Agreed next work (pick up only when Julien says)
1. Remaining critic and code notes in the logs (codecritic's A17, a cached drawer-card model, is the big one; C66 strike bar on a shrunk iOS label needs a device check).
2. Daily and weekly tasks (`docs/REWARDS.md`).
3. Audio: the device checks in `AUDIOLOG.md`, then AU58–AU61.
4. Deferred: the dead zone (design discussion first), franchise-to-Boston (Claude Doc).

## Lessons learned (avoid repeating them)
- **Crowd overlaps:** fix them in the pure modules (`scene/cast.ts`, `timelines.ts`, `layout.ts`) and prove the fix with a budget in `scene/__tests__/crowd.test.ts` that fails on the old code.
- **Tap targets:** draw controls at 44 pt. A hitSlop only works inside space the parent owns on iOS, and web screenshots can't show it. `tap-targets.ts` constants drive the StyleSheets; keep it that way.
- **One rule, one place:** button tone lives in `buttonTone`; the drawer and the sidewalk drifted apart twice before it did (G75, C60, C63).
- **Memo deps:** give a big memoised builder one typed input object and derive the deps from it (`furnitureInputs` / `furnitureDeps`); a hand-listed dep array shipped a bug (v3.5 `prep`).
- **Memoisation:** React skips a subtree only when props equal the previous frame's; keep memoised parts on primitive props; create `Animated.Value`s with `useState(() => …)`, not `useRef(new …)`.
- **Node tests:** Jest runs ts-jest in node; `.ts` tests can't import `.tsx` or `react-native-svg`. Put testable logic in pure `.ts` modules.
- **Owner direction:** don't remove owner-required scene elements (the WELCOME mat) while fixing something else.
- **Critic churn:** each round tends to surface new minors. Fix the bugs and new notes first; carried minors (sky, crowd) are the ones that may stay.

## Outside the loop
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~700 files). Ask Julien before pruning.
- The one-time playtest of v3.0–v3.2 has been acted on (v3.4–v3.7); its dead-zone, endgame and University-chip-during-the-bid items are still open.
