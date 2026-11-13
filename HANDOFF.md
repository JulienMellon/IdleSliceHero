> **2026-11-11: the build loop now runs from `docs/build/`. Start at `docs/build/README.md`, then `docs/build/STATE.md`. The sections below are history and lessons.**
>
> **2026-11-13: the loop itself is being updated before v5.16.** `docs/build/STATE.md` points at `docs/build/v5.15-loop/VERSION.md`; the why is in `docs/PLAN-loop-improvements.md`.

# Handoff — Slice Empire (IdleSliceHero), after v5.9

For a fresh session. Read this file first, then `CRITICLOG.md` and `CODELOG.md` (current state only; don't open `docs/logs/` unless you need one note's history), `docs/PLAN-v5.4-rewards.md` (daily/weekly tasks + gift calendar; defaults D1–D10 confirmed by Julien), `docs/PLAN-v4.7-playtest2.md`, and `STORYLOG.md` / `AUDIOLOG.md`, and **`docs/REVIEW-v5.9-playthrough.md`** (Claude's full playthrough review of 2026-11-01: pacing, bugs B1–B5, story text fixes, per-neighbourhood layers, decisions D1–D6 waiting on Julien). The project's `claude/HANDOFF.md` mirrors this file.

## Status (2026-11-11, evening): v5.13 on `main`; v5.14 planned but NOT started — start here
- **Next step:** read `docs/PLAN-v5.14-retention.md` and launch its three cards (C3 hooks fix round, B3 scene minors, R3 return hooks: night oven, welcome-back gift, next-scene teaser) as `programmer` agents in parallel. All three hit the usage limit on 2026-11-11 before writing anything, and the tree was clean at `fbc481a`. Then verify, take screenshots, and run the critic (the codecritic skips v5.14). v5.15 = endgame + codecritic on `5d82004..HEAD`.
- **Julien, 2026-11-11:**
  - Goal: make the game fun, addictive, and paced to bring players back.
  - The critic's bar is award-winning games (see the critic brief), with a FUN AND RETENTION section every round.
  - **Report only verdicts, bugs and majors to him.**
  - The loop runs until the plan is done; he approved it with "go".
- **Shipped this session:**
  - **v5.12:** economy at about 5 days (`scripts/pacing-fit.ts`).
  - **v5.13:**
    - Golden pizza: `engine/bonus.ts`, `components/floating-bonus.tsx`.
    - Special orders from the cast: `engine/orders.ts`, `components/order-chip.tsx`.
    - Numbers and lines in `content/hooks.ts`.
    - Economy refit: 4 h cap; costMult = order value (2.5K / 200K / 6M / 60M); builds $1.15B / $230B / $15T / $900T; Pier 9 $120M; Suburbs in session 1.
    - Sim days 1.0 / 2.0 / 3.1 / 4.4 / 4.8.
    - `WHAT_IF_CASH = 1e300` in game.ts (MAX_SAFE_INTEGER hid gains above 9e15).
- **Tuning is a fitted set:** refit with `pacing-fit.ts`; don't edit one number.
- **Open economy choice for Julien:** keep the post-build "tap spree", or take a strict fit with order values ×6,000 per shop. Details are in the plan.
- **Reviews:**
  - `CRITICLOG.md`: round 61 NOT SATISFIED; next IDs G95, D447. Its majors are the cards' content.
  - `CODELOG.md`: round 24 APPROVED at v5.12; next IDs K1, C110, A28, M60, U12, T85.
- **Screenshots:** `scripts/screenshots.py` closes each seeded page. Run it detached (`nohup … &`, about 7 min). The `review/` folders are git-ignored.
- **Usage limits:** three parallel Sonnet programmers plus reviews used up the 5-hour limit twice in one day. Consider two cards at a time.
- The "Where things stand at v5.9" section below is history. The owner decisions and loop rules below still hold.

## What this is
- **Game:** an idle pizza-tycoon game for the iOS App Store. Working title **Slice Empire**; repo `JulienMellon/IdleSliceHero`. Design: `docs/DESIGN.md`; retention features: `docs/REWARDS.md`; prestige design: Claude Doc "Franchise to Boston — Prestige Design".
- **Stack:** Expo SDK 58, Expo Router, React 19.3 with React Compiler on (`app.json`), react-native-svg, zustand 5 (`src/store/game-store.ts`), a pure-TS engine (`src/engine/`). Content and tuning in `src/content/`.
- **Version:** `src/content/version.ts` (drawer footer and Settings). Current build **5.9**; builds go up by 0.1. `app.json` (2.0.0) stays the App Store marketing version.
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
3. **Verify once** (orchestrator): bump `APP_VERSION`; `npx tsc --noEmit`; `npm test` (full, once, ~70 s; TZ is pinned to America/New_York by `jest.global-setup.js`); `npx expo export --platform web`; `python3 scripts/screenshots.py v5.10`; `python3 scripts/review_shots.py v5.10 v5.9`. Check `report.json` has `"errors": []`, `"loaded": true`. If shot 22 times out, re-run once.
4. **Commit and push** to `main`: `git -c user.name="Julien Mellon" -c user.email="mellon.julien@gmail.com" commit …`, then `git fetch -q origin main && git rebase origin/main && git push -q origin main`. End commit messages with the session's attribution lines. Append a short `## v5.10 — build` table to each log.
5. **Review in parallel, in the background.** Only run a critic whose inputs changed:
   - `critic` when `review/index.json` has any `new`/`changed` shot. Paste the open-notes table and next IDs into its task.
   - `codecritic` when `src/` changed. Pass the git range, the open items, next IDs, and the tsc/test results from step 3, so it doesn't re-run them.
   - `storycritic` when `src/content/scenes/` or player-facing strings changed. `audiocritic` when `src/audio/`, `tools/audio/` or `docs/AUDIO.md` changed. Low effort unless Julien asks.
   - **Re-check rounds** (the step only fixed listed notes): run at **medium** effort and ask for a verdict on those IDs plus anything new. Full effort for a new feature step, or `review_shots.py --all`.
   - Don't edit the working tree while the codecritic runs.
6. **Hand critiques back:** copy only the actionable lines (ID, severity, where, fix) into the next card. **Send** them to the same programmer if it's still alive and the files match (it keeps its context). Otherwise start a fresh one with a new card.
7. **Log:** replace each log's "Current state" with the new verdict and its open-notes table (with note text). Move the old section to `docs/logs/*-archive.md` **every round**, so the live logs stay short. Update this file's "Where things stand". Commit, push, report to Julien in 2–4 sentences.
8. **Stop** when the critic is SATISFIED and the codecritic APPROVES on the same build. On a build where the codecritic is skipped (rule above), its last APPROVED carries, so critic SATISFIED is enough.

### Token notes (measured 2026-10-30)
- A general-purpose agent costs ~60K tokens before doing anything. The `programmer`, with 6 tools, finished a small task in ~16K. Use the narrow agent types, never general-purpose, for loop work. Prefer fewer, larger cards, and continue an agent with SendMessage for fix rounds.
- Screenshots: a full round used to send ~78 full-size PNGs (~1.5K tokens each). The review set for v5.2 vs v5.1 is 20 half-size shots + 19 prev (~0.45K each), about 85% less.
- The live logs are ~4 KB each after archiving finished rounds (was ~33 KB together). Archive every round to keep them that way.

## Where things stand at v5.9
- **Critic, round 57 (v5.9): SATISFIED.** Open: D404 [minor] University chip overfull with the "uses bid cash" line (fix: "$1.8M · uses bid cash" on one line, or a 15 pt title). Known limit accepted: on SE/wide web the caption can overlap Dale's treetop by 10–15 pt (D398). Table in `CRITICLOG.md`.
- **Codecritic, round 23 (v5.9): APPROVED.** Mediums: C102 (an overlapping second play of the same rare SFX gets cut — task + chest claim within 1.5 s), A22/M50, A17/M32. Lows C103, C104, A27 (`buyMany`), M59, U8, U9; tests T78–T80. Table in `CODELOG.md`.
- **Audio:** lofi score in `assets/audio` (13.27 MB / 14 cap): loops −20 LUFS (sparse −22), stingers by tier (bottleneck −22 … milestone_big −16), triumphs/city/rep −18, HQ −19.3. Next audio ID AU78. Device checks AU39–AU41 still Julien's.
- **Story:** not re-run this session (no story text changed). Next ID S19.
- **Cut-scene art:** hands per pose (`figure-art.ts`: clasp with crossed thumbs, `collar`, `card` with a back layer), head shading clipped, signs/billboards kept out of the 61 pt caption zone, string lights dropped on captioned panels; staging keeps 8 pt hand clearance (T76).
- **UI:** sidewalk cards show "need $X" under the price only when cash > 0; two-tone goal label; "Buy both" bundle button; locked Suburbs padlock + countdown on the City screen; University chip "uses bid cash" while the Pier 9 bid is open.

## Agreed next work (pick up only when Julien says)
0. **Playthrough review (2026-11-01), not yet acted on.** Read `docs/REVIEW-v5.9-playthrough.md`. Nothing in it has been built. Julien still has to answer D1–D6 (target length, visual ladder, walk-ins as demand, fleet zones, visible rush, first neighbourhood layer). Suggested order: a polish build with bugs B1–B5 and the story text table, then economy changes, then one layer per build. Re-verify the "inferred" items in its confidence section first. Tools are in `scripts/review/`.
1. Julien listens to the lofi score on a device (5 checks in `AUDIOLOG.md`); fold his notes into an audio round.
2. A small polish build: D404, C102 (+T78), M59, C103 (+T79). Codecritic skips it under the rule.
3. Ad draft 2 after Julien's notes: re-record with the lofi score; TikTok-safe caption position (y ≈ 1350).
4. Draw the cosmetics (gold oven, storefront skin, weekly items) and Nonna's day-30 cameo; ad buttons when AdMob lands (`MONETIZATION-PLAN.md`).
5. Todd interludes (`PLAN-v4.4`, save v6). Deferred: dead zone, franchise-to-Boston.

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
- **Worktree symlinks:** a `node_modules` symlink in a worktree is NOT matched by a `node_modules/` ignore pattern; `git add -A tools/audio` committed one and the merge replaced the real install with a self-link (fixed; `.gitignore` now says `node_modules`). Add paths explicitly in worktrees.
- **Fake-clock capture:** Playwright's `page.clock.install()` + `run_for(33)` per frame gives smooth, deterministic 30 fps footage of the web build (`marketing/ad/record.py`). Read the HUD's "Tap to serve/bake/prep" to tap only stations that can start.
- **Screenshot runs under load:** the late shots can hang while an audio render runs alongside; re-run once with `timeout 560 python3 -u`.
- **Fix one note, open another:** removing the struck price (D359) replaced the station name with "need $X" (D402). Check that a fix keeps what the element already told the player.

## Outside the loop
- **Screenshots** from v5.0 on are committed (`screenshots/`). The 51 folders from before v5.0 (v0.1 to v4.9) were moved on 2026-11-13 to the private repo `JulienMellon/idleslicearchive`, at the same paths; this repo's git history still holds them. Ask Julien before pruning anything else.
- The one-time playtest of v3.0–v3.2 has been acted on (v3.4–v3.7); its dead-zone, endgame and University-chip-during-the-bid items are still open.
