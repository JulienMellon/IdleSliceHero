# Handoff — Slice Empire (IdleSliceHero), after v5.6

For a fresh session. Read this file first, then `CRITICLOG.md` and `CODELOG.md` (current state only; don't open `docs/logs/` unless you need one note's history), `docs/PLAN-v5.4-rewards.md` (daily/weekly tasks + gift calendar, with the owner-correctable defaults D1–D10), `docs/PLAN-v4.7-playtest2.md`, and `STORYLOG.md` / `AUDIOLOG.md`. The project's `claude/HANDOFF.md` mirrors this file.

## Status: the build/review loop is STOPPED for handoff (Julien, 2026-10-30 23:00)
- Session of 2026-10-30 night shipped **v5.3 → v5.6** on `main`. **v5.5 passed both reviewers** (critic round 53 SATISFIED, codecritic round 21 APPROVED). **v5.6** (owner-requested cut-scene upscale + rewards follow-ups): codecritic round 22 APPROVED; critic round 54 NOT SATISFIED with 2 [major] on the new cut-scene art (D391 clipped signs, D392 hands). Don't restart the loop or run reviewers until Julien asks.
- **To restart (v5.7):** one programmer card for the cut-scene notes D391–D396 (files: `src/components/portrait.tsx`, `backdrop.tsx`, `cutscene-player.tsx`, `src/components/cutscene/*`) + C100/T77 (cast ≤ 2 tuple in `content/types.ts`), C101/T76 (`HANDS_BOX` per pose in `cutscene/staging.ts` — this also guards D392's crossing hands), U7 (`rewards-ui.tsx` strip state in a ref). Then verify, screenshots `v5.7` vs `v5.6`, critic (full effort on cut-scenes 01, 02, 08, 18, 19, 22; next IDs G86/D397) and codecritic (range from 0d6d3a4; next IDs K1/C102/A27/M59/U8/T78). Stop when both pass on the same build.
- **New tonight:** the codecritic brief has a **CPU** section (U IDs, counts toward the verdict); the critic has read-only Bash for grep. The weekly diamonds are now 6 per task + 8 on the final chest (50 total) — Claude's call, flagged to Julien.
- **Owner decisions still in force** (playtest 2): 3 taps per batch until a manager; no tap-ahead; heads at 20/30/50% of the manager price, GM needs all three (×2 income, offline earning), Downtown heads $25/$60/$120, Nonna brings missing heads; +2 pies every 20 prep levels (4 → 14), Nonna 150; cash only when pizza leaves; native splash + 2 s title card; red awning as piping only outside Downtown; heads are supporting cast. Post each round's critic notes in chat.
- **Rewards defaults awaiting Julien's word** (`docs/PLAN-v5.4-rewards.md` §0): no ad buttons until AdMob (reroll, watch-ad-to-double, ad streak save); boosters are an inventory; cosmetics saved but not drawn in the shop; Nonna's day-30 shop cameo deferred; HUD clipboard + gift icons instead of a clipboard on the counter; "Tap floating bonuses" dropped; save v5 went to rewards, so the Todd interludes plan (`PLAN-v4.4`) takes **save v6**.
- **Worktree:** builds were made in `/home/claude/wt` (branch `wip-rewards`, ff-merged to `main`); removed at handoff. Work directly in the repo or make a new worktree.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; repo `JulienMellon/IdleSliceHero`. Design: `docs/DESIGN.md`; retention features: `docs/REWARDS.md`; prestige design: Claude Doc "Franchise to Boston — Prestige Design".
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with React Compiler on (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`), a pure-TS engine (`src/engine/`). Content and tuning in `src/content/`.
- **Version:** `src/content/version.ts` (drawer footer and Settings). Current build **5.6**; builds go up by 0.1. `app.json` (2.0.0) stays the App Store marketing version.
- **Owner:** Julien (mellon.julien@gmail.com). He likes concrete proposals he can correct over open questions, and evidence over superlatives.

## Roles (briefs in `.claude/agents/`)
| Agent | Model | Job | Gates? |
| --- | --- | --- | --- |
| orchestrator (main session) | Opus | Plans, writes task cards, runs checks and screenshots, commits, logs, reports | — |
| `programmer` | Sonnet, high | One task card: edits only the files in scope, runs the checks on the card, ≤ 12-line report | — |
| `critic` | inherit | Pixels, from the review set | SATISFIED = 0 bugs, 0 [major], ≤ 3 [minor] |
| `codecritic` | inherit | The git diff | APPROVED = no blocker/[high], ≤ 3 [medium] |
| `storycritic`, `audiocritic` | inherit | Story/text; music/SFX | Advisory; only when their files change |
| `search`, `docs`, `tests` | Haiku | Find code; fetch API docs; run tests | — |

## The loop (token-lean)
1. **Plan the step** into 1–3 task cards. Each card has: goal, **files in scope**, the **full text** of the notes to fix (never "see CRITICLOG"), and checks (`npx tsc --noEmit` + the targeted `npx jest` files). One programmer per card. Cards with disjoint files can run in parallel.
2. **Programmer** works and reports. Read `git diff --stat` and only the hunks you need to judge the report. Don't re-read whole files.
3. **Verify once** (orchestrator): bump `APP_VERSION`; `npx tsc --noEmit`; `npm test` (full, once, ~70 s; TZ is pinned to America/New_York by `jest.global-setup.js`); `npx expo export --platform web`; `python3 scripts/screenshots.py v5.7`; `python3 scripts/review_shots.py v5.7 v5.6`. Check `report.json` has `"errors": []`, `"loaded": true`. If shot 22 times out, re-run once.
4. **Commit and push** to `main`: `git -c user.name="Julien Mellon" -c user.email="mellon.julien@gmail.com" commit …`, then `git fetch -q origin main && git rebase origin/main && git push -q origin main`. End commit messages with the session's attribution lines. Append a short `## v5.7 — build` table to each log.
5. **Review in parallel, in the background.** Only run a critic whose inputs changed:
   - `critic` when `review/index.json` has any `new`/`changed` shot. Paste the open-notes table and next IDs into its task.
   - `codecritic` when `src/` changed. Pass the git range, the open items, next IDs, and the tsc/test results from step 3, so it doesn't re-run them.
   - `storycritic` when `src/content/scenes/` or player-facing strings changed. `audiocritic` when `src/audio/`, `tools/audio/` or `docs/AUDIO.md` changed. Low effort unless Julien asks.
   - **Re-check rounds** (the step only fixed listed notes): run at **medium** effort and ask for a verdict on those IDs plus anything new. Full effort for a new feature step, or `review_shots.py --all`.
   - Don't edit the working tree while the codecritic runs.
6. **Hand critiques back:** copy only the actionable lines (ID, severity, where, fix) into the next card. **Send** them to the same programmer if it's still alive and the files match (it keeps its context). Otherwise start a fresh one with a new card.
7. **Log:** replace each log's "Current state" with the new verdict and its open-notes table (with note text). Move the old section to `docs/logs/*-archive.md` **every round**, so the live logs stay short. Update this file's "Where things stand". Commit, push, report to Julien in 2–4 sentences.
8. **Stop** when the critic is SATISFIED and the codecritic APPROVES on the same build.

### Token notes (measured 2026-10-30)
- A general-purpose agent costs ~60K tokens before doing anything. The `programmer`, with 6 tools, finished a small task in ~16K. Use the narrow agent types, never general-purpose, for loop work. Prefer fewer, larger cards, and continue an agent with SendMessage for fix rounds.
- Screenshots: a full round used to send ~78 full-size PNGs (~1.5K tokens each). The review set for v5.2 vs v5.1 is 20 half-size shots + 19 prev (~0.45K each), about 85% less.
- The live logs are ~4 KB each after archiving finished rounds (was ~33 KB together). Archive every round to keep them that way.

## Where things stand at v5.6
- **Critic, round 54 (v5.6): NOT SATISFIED.** D391 [major] signs clipped in cut-scenes 02/08/18/19; D392 [major] hands (clone clasp for Nonna and Marisol, Sal's finger into the suit man, box mittens); minors D393–D396; carried notes D359, D297, D304, D305, Pier 9 chip. Table with full text in `CRITICLOG.md`.
- **Codecritic, round 22 (v5.6): APPROVED.** Mediums: C100 (3+ figure panel would crash), A22/M50 (facade out of room.tsx), A17/M32 (drawer card model). Lows and tests in `CODELOG.md`. Heaviest cut-scene panel ~160 SVG nodes.
- **Story:** storycritic ran low-effort on the rewards text (S9–S18, folded in; next ID S19). Not re-run on the new cut-scene art (no text changed). **Audio:** last reviewed at v4.6; on hold for "calmer, more lofi".
- **Rewards feature (v5.4–v5.6):** `src/content/rewards.ts` (data), `src/engine/rewards.ts` (pure; day/week keys only move forward, clock-rollback guard + far-forward recovery), `GameState.rewards`/`stats` (save v5; progress = lifetime counter − baseline), boosts multiply `lineRates.price` (pops = revenue), `src/components/rewards-model.ts` (tested view models) + `rewards-ui.tsx` (memo'd, 1 Hz snapshot only while open). Shots 29–33.
- **Cut-scene art (v5.6):** `portrait.tsx` has `variant: 'bust' | 'stage'` (stage = waist-up, cut-scenes only); path data in `src/components/cutscene/figure-art.ts` and `backdrop-art.ts`; staging in `cutscene/staging.ts` (tested).

## Agreed next work (pick up only when Julien says)
1. v5.7: the cut-scene notes above, until both reviewers pass.
2. Julien to confirm or correct the rewards defaults (D2–D10) and the 6/8 diamond split.
3. Draw the cosmetics (gold oven, storefront skin, weekly items) and Nonna's day-30 cameo; ad buttons when AdMob lands (`MONETIZATION-PLAN.md`).
4. Todd interludes (`PLAN-v4.4`, save v6). Audio "calmer, more lofi". Deferred: dead zone, franchise-to-Boston.

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
- **Agent types missing?** They load from `.claude/agents/` at session start: pull `main` and reload. As a last resort, run a general-purpose agent with the brief (~4× the cost).
- **Session restarts kill background agents** without a report: check `git status`/`tsc` in the worktree; the work on disk is usually usable (v5.6 art was).
- **Rewards & time:** never re-roll on a key *change* — only when the day/week number increases (C94: time-zone toggling farmed chests). Keep `stats` identity on quiet ticks (U6) or memo'd panels re-render every tick.
- **Critic churn:** each round tends to surface new minors. Fix the bugs and new notes first; carried minors (sky, crowd) are the ones that may stay.

## Outside the loop
- **Screenshots** for every version since v0.1 are committed (`screenshots/`, ~700 files). Ask Julien before pruning.
- The one-time playtest of v3.0–v3.2 has been acted on (v3.4–v3.7); its dead-zone, endgame and University-chip-during-the-bid items are still open.
