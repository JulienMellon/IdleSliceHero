# Handoff — Slice Empire (IdleSliceHero), after v5.2 (+ v5.3 work in progress)

For a fresh session. Read this file first, then `CRITICLOG.md` and `CODELOG.md` (current state only; history in `docs/logs/`), `docs/PLAN-v4.7-playtest2.md` (the playtest-2 plan and owner decisions), and `STORYLOG.md` / `AUDIOLOG.md`. The project's `claude/HANDOFF.md` mirrors this file.

## Status: the build/review loop is STOPPED (Julien, 2026-10-30)
- Julien ended the session after critic round 50 (v5.2, NOT SATISFIED, one [major]) and codecritic round 18 (v5.0, APPROVED). Don't restart the loop or run reviewers until he asks.
- **v5.3 is in progress** on `main` (APP_VERSION still `5.2`): only the D377 fix is in (walk-ins order at the counter's left end, drivers pick up at the right end by the door; 213 tests pass). It has not been screenshotted or reviewed.
- **To restart:** finish the v5.3 list in `CRITICLOG.md` / `CODELOG.md` (add the doorway-sign crowd budget for D377 first), bump to 5.3, verify, then run critic (shots v5.2 → v5.3, next IDs G84/D384) and codecritic (range a0a9bee..HEAD, next IDs K1/C90/A24/M53/T66). Stop when both pass on the same build, then storycritic + audiocritic at low effort.
- **Pacing change (flagged to Julien 2026-10-30):** post-Downtown build costs went ×1.5 to offset the GM ×2 boost, so the pacing sim now completes the city at ~184.8 min (was ~227). Nonna still takes over at 5.0 min / 35 taps.
- **Owner decisions from playtest 2** (keep): 3 taps per batch until a manager; no tap-ahead; heads at 20/30/50% of the manager price, GM needs all three (×2 income, offline earning), Downtown heads $25/$60/$120 and Nonna brings missing heads; +2 pies every 20 prep levels (4 → 14), Nonna 150; cash only when pizza leaves, other shops pay quietly; native splash + 2 s title card, tap skips; red awning as piping only outside Downtown; heads are supporting cast (`docs/story/CAST.md`). Post each round's critic notes in chat.
- **Worktree:** builds were made in a git worktree at `/home/claude/wt` (branch `wip-vX`, ff-merged to `main`); it was removed at handoff, so everything is on `main`. A fresh session can work directly in the repo.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; repo `JulienMellon/IdleSliceHero`. Design: `docs/DESIGN.md`; retention features: `docs/REWARDS.md`; prestige design: Claude Doc "Franchise to Boston — Prestige Design".
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with React Compiler on (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`), a pure-TS engine (`src/engine/`). Content and tuning in `src/content/`.
- **Version:** `src/content/version.ts` (drawer footer and Settings). Current build **5.2** (5.3 in progress); builds go up by 0.1. `app.json` (2.0.0) stays the App Store marketing version.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals he can correct over open questions, and evidence over superlatives.

## Reviewers (agent types; briefs in `.claude/agents/`)
| Agent | Reviews | Log | Gates the loop? |
| --- | --- | --- | --- |
| `critic` | Pixels: screenshots vs. top idle games, characters, layout | `CRITICLOG.md` | Yes: SATISFIED = 0 bugs, 0 [major], ≤ 3 [minor] |
| `codecritic` | The git diff: correctness, architecture, memory (the owner's focus) | `CODELOG.md` | Yes: APPROVED = no blocker/[high], ≤ 3 [medium] in ISSUES + MEMORY. |
| `storycritic` | Story, cut-scenes, hooks, voice, comedy, player-facing text | `STORYLOG.md` | Advisory (added 2026-10-29 at Julien's request); low effort at the end of a loop |
| `audiocritic` | Music, SFX, mix vs. emotion; plans audio until it exists (cue sheet: `docs/AUDIO.md`) | `AUDIOLOG.md` | Advisory; low effort at the end of a loop |

**If an agent type isn't found** (e.g. `audiocritic`): agent definitions are read from `.claude/agents/` when a session starts. Pull `main` first (`storycritic` and `audiocritic` arrived in commit 5573264), then start a new session or reload the repo context. If it still isn't listed, run a general-purpose agent and tell it to follow `.claude/agents/<name>.md` as its brief; the result is the same.

## The loop (when Julien restarts it)
1. **Build v5.(n+1)**: fix the open notes in the logs. `sed -i "s/export const APP_VERSION = .*/export const APP_VERSION = '5.3';/" src/content/version.ts`.
2. **Verify:** `npx tsc --noEmit` clean; `npm test` passes (213 tests); `npx expo export --platform web` then `python3 scripts/screenshots.py v5.3` → `screenshots/v5.3/report.json` shows `"errors": []` and `"loaded": true`. Look at the PNGs yourself (00, 03, 03b, 04, 05b2–05b6, 10–12, 25-look-* at least). Shot 22 (perk card) timed out once and passed on a re-run: re-run once before investigating.
3. **Log:** append a `## v5.3 — build` table to `CRITICLOG.md` and `CODELOG.md`.
4. **Commit and push to `main`:** `git -c user.name="Julien Mellon" -c user.email="mellon.julien@gmail.com" commit …`, then `git fetch -q origin main && git rebase origin/main && git push -q origin main` (Julien pushes too). End commit messages with the attribution lines the session gives you.
5. **Review in parallel, in the background:** `critic` (version, new and previous screenshot folders, next IDs) and `codecritic` (git range, next IDs, the memory focus; read-only; never `npx expo lint`). **Don't edit the working tree while the codecritic runs**: it runs `npm test` on it, and a half-made edit once produced a false blocker.
6. **Log the verdicts:** replace each log's "Current state" with the new verdict and its open-notes table **including each note's text** (a later round needs it), bump the next IDs, move the replaced section and build tables to `docs/logs/*-archive.md`, commit, push, report to Julien in 2–4 sentences.
7. **Stop** when the critic is SATISFIED and the codecritic APPROVES on the same build. Then run `storycritic` and `audiocritic` at low effort and log them.

## Where things stand at v5.2
- **Critic, round 50 (v5.2): NOT SATISFIED.** One [major] (D377, fixed in v5.3 WIP but unverified), one bug (G83, no tutorial hand on wait steps) and minors; table in `CRITICLOG.md`. Neighbourhood identity passed in round 48.
- **Codecritic, round 18 (v5.0): APPROVED.** v5.1 and v5.2 are unreviewed. Open mediums C84 and A22/M50 are the ones to fix first.
- **Story / audio:** last reviewed at v4.3 / v4.6 (see their logs); not re-run on the playtest-2 work.
- **Earlier history** (v3.4 → v4.6: crowd fixes, perks, tap targets, sidewalk row, audio score): see `docs/logs/` and the previous version of this file in git (`git show 0d00737:HANDOFF.md`).

## Agreed next work (pick up only when Julien says)
1. Finish v5.3 and the review loop (above). Codecritic's A17 (cached drawer-card model) and C66 (strike bar on a shrunk iOS label, device check) are still open.
2. Daily and weekly tasks (`docs/REWARDS.md`).
3. Audio: **on hold** with a new owner direction, "calmer, more lofi" (see the top of `AUDIOLOG.md`). It comes first when Julien restarts audio work; then the device checks and AU58–AU61.
4. Deferred: the dead zone (design discussion first), franchise-to-Boston (Claude Doc).

## Lessons learned (avoid repeating them)
- **Crowd overlaps:** fix them in the pure modules (`scene/cast.ts`, `timelines.ts`, `layout.ts`) and prove the fix with a budget in `scene/__tests__/crowd.test.ts` that fails on the old code.
- **Tap targets:** draw controls at 44 pt. A hitSlop only works inside space the parent owns on iOS, and web screenshots can't show it. `tap-targets.ts` constants drive the StyleSheets; keep it that way.
- **One rule, one place:** button tone lives in `buttonTone`; the drawer and the sidewalk drifted apart twice before it did (G75, C60, C63).
- **Memo deps:** give a big memoised builder one typed input object and derive the deps from it (`furnitureInputs` / `furnitureDeps`); a hand-listed dep array shipped a bug (v3.5 `prep`).
- **Memoisation:** React skips a subtree only when props equal the previous frame's; keep memoised parts on primitive props; create `Animated.Value`s with `useState(() => …)`, not `useRef(new …)`.
- **Node tests:** Jest runs ts-jest in node; `.ts` tests can't import `.tsx` or `react-native-svg`. Put testable logic in pure `.ts` modules.
- **Owner direction:** don't remove owner-required scene elements (the WELCOME mat) while fixing something else.
- **Moving one figure moves the overlap:** after any crew route or spot change, run the whole crowd suite (D336, D352, D353, D368, D370), not just the budget you're fixing.
- **Engine/scene sync:** carriers start their walk at the engine's dispatch time (`since`); don't add a scene-side fallback that changes who carries (it skewed the walk-in split to 50%).
- **Codecritic and the working tree:** don't ff-merge into the tree it is testing.
- **Critic churn:** each round tends to surface new minors. Fix the bugs and new notes first; carried minors (sky, crowd) are the ones that may stay.

## Outside the loop
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~700 files). Ask Julien before pruning.
- The one-time playtest of v3.0–v3.2 has been acted on (v3.4–v3.7); its dead-zone, endgame and University-chip-during-the-bid items are still open.
