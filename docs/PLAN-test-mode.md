# PLAN — Test build with cheats (money, neighbourhood jumps, time skip)

> Copy of the project doc `claude/PLAN-test-mode.md` (2026-11-19), so agents can read it from the repo. This repo copy is the one to keep current; the loop files it leads to will live in `docs/build/v5.19-test/`.

Status: **approved design, not built.** Written 2026-11-17; updated 2026-11-18 at v5.19's close (main `1fa9ffd`). Next: a planning session turns it into loop files (kickoff prompt in section 7), then the usual orchestrator prompt builds it.

## 0. Slot and code as of v5.19's close

**Slot:** its own tooling step, `version: 5.19-test`, folder `docs/build/v5.19-test/`, like `v5.15-loop` was. STATE currently says `version: 5.20` with scope unset; at this step's close STATE goes back to that. Cost estimate: 4 cards, about one session.

**What already exists** (checked on `1fa9ffd`; the planning session re-checks by grep):
- `canAfford(s, cost)` (null-safe) and `pay(s, cost)` in `src/engine/game.ts` (~line 977), 16 call sites (A36, v5.18 r4). Bypasses left: `sidewalk-row.tsx` (~207) and `night-oven.ts` (~95). Diamond checks don't use it: `rewards.ts`, `vanity.ts`, `rewards-ui.tsx`, `endgame/shop-model.ts`. (Codecritic, `docs/build/v5.19/review-r1-code.md`, JULIEN section.)
- `src/engine/clock.ts` `gameNow()` = `Date.now()`, used at 65 game-time sites. The 26 remaining `Date.now()` calls are animation or audio, except `storefront.tsx:231` (C155: `visitAt` is wall time compared with `gameNow()`). Per-frame cost of clock reads: under 20 µs/s, irrelevant.
- Cities: home and Boston only. Everything beyond Boston and the deferred refactor (R2 R2b R3 R4 R5f R6s) are on hold (STATE `open:`), so: no engine split, `components/store` keeps its name, no `createFlag` helper.
- CI (`.github/workflows/ci.yml`) and `eslint.config.js` exist; `src/dev/` must pass them.

## Goal
A separate web build of Slice Empire for Julien's own playtesting where he can buy any upgrade regardless of cash, jump straight to any neighbourhood, and make the game think time has passed — all by tapping. The App Store build and the existing playtest artifact never contain any of it.

## 1. How the test build is kept separate

| Concern | Decision |
| --- | --- |
| Turning it on | Build-time env var `EXPO_PUBLIC_TEST_MODE=1` (Expo inlines `EXPO_PUBLIC_*` at export, like the existing AdMob/RevenueCat keys). New `src/dev/test-mode.ts` exports `TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === '1'`. Every cheat is behind `if (TEST_MODE)` so the normal export dead-code-strips it. |
| Save | Test build uses save key `slice-empire/save/test-v1` and prefs `slice-empire/store/test-v1`, so a cheated save can never become a real one, even on a shared origin. |
| Where it lives | A **new, private** artifact "Slice Empire — TEST build (vX.Y · sha)". The existing public playtest artifact (`2187777c…`) is untouched. Matches the Nov 13 "no public playtest link" decision. |
| Visible marker | Red "TEST" pill in the HUD (40 pt drawn, 44 pt touch area per the tap rule), and Settings shows `Build X.Y · TEST`. |
| Guard | (a) A jest source test: nothing outside `src/dev/` imports `src/dev/*` except through a `TEST_MODE`-guarded lazy `require`. (b) The normal publish greps its own bundle for the marker string `TEST MODE PANEL` and fails if found. |
| Review | The normal export must show **0 changed shots** (the build is unchanged). Panel shots come from a separate test export and are the only new shots the critic sees. |

## 2. The Test panel (tap the TEST pill → bottom sheet, tap-only)

### Money
- **Free buys** (ON by default in the test build): a test-mode branch in `canAfford` (true) and `pay` (takes nothing). Route the two bypasses through `canAfford`, and add `canAffordDiamonds`/`payDiamonds` for the four diamond checks. Real cash keeps counting on screen; turning it off is straight back to normal play. `totalEarned` and stats are untouched.
  - "Need $X" texts and goal-bar progress still read `cash`. Default: hide the need-text while free buys are on; leave the goal bar as is.
- **+10 min income / +1 h income**: adds that much of current $/s (for testing with free buys off).
- **Cash → $0**: test "can't afford" states and the need-text.
- **Diamonds +100.**
- **Store purchases succeed** toggle: the web purchase stub already answers from `?buy=purchased`, but the artifact host's route script strips the query string, so the toggle sets the same answer in memory instead.

### Neighbourhoods
- **Jump to…** a list per city, read from `cityOf(s).neighbourhoods`: each neighbourhood "just built", then "city complete", for home and Boston (later cities get rows automatically when their packs land).
  - Each jump loads a **snapshot from the pacing sim**, so levels, heads, story scenes seen and pizzas sold are what a real greedy player has at that moment. New script `scripts/test-snapshots.ts` runs the sim (`scripts/review/sim2.ts` `run('continuous')` with its `onSecond` hook, and `franchiseRun` from `scripts/pacing-fit.ts` for Boston) and captures the state the second each shop is built. Output: `src/dev/snapshots.json` (~14 states). A jest test fails when the snapshots no longer load under the current `migrate`, so a tuning change that breaks them is caught.
  - Before any jump the current save is copied to a backup slot; panel shows **Undo last jump**.
- **Build next shop now (ignore story lock)**: labelled "may break story order".

### Time
- **Away for 15 min · 1 h · 8 h · 1 day · 3 days** (wall clock). Adds to an offset inside `engine/clock.ts` (new `setGameClockOffset(ms)`; `gameNow()` = `Date.now() + offset`, offset always 0 in the normal build), then runs the **real return path** (`loadSave` → `applyOffline`, rewards refresh, return story beat): offline popup, 2× offer, offline cap, boost expiry, daily gift and streak.
- Fix C155 first (`storefront.tsx:231` onto `gameNow()`), or visits break under an offset.
- **Next day** (00:01 local tomorrow) and **Next Monday**: daily tasks, daily gift, 30-day streak, weekly tasks.
- **Play forward 1 min · 10 min · 1 h** (play clock): runs the normal foreground tick (`playTick` + bonus + orders) in 1-second steps without rendering, so `after`-triggered scenes, story countdowns, orders and events advance. Run in chunks so the UI stays responsive.
- **Game speed 1× · 4× · 16×**: multiplies `dt` in the tick.
- Clock readout "Test clock +1 d 8 h". Only moves forward (`rewards.lastSeen` treats a clock going back as a rollback); **Reset test save** resets it too. Offset saved with the test prefs.

### Story & save
- **Play next story beat now** (skips the 90 s gap) and **Skip tutorial**.
- **Export save** (copies JSON) / **Import save** (paste).
- **Reset test save.**

## 3. Publishing it (addition to the project doc `claude/PUBLISH-RUNBOOK.md`)
The existing prompt stays as is. Add a second section, "Publish the TEST build":
- Same `onebox.sh`, with changes driven by an env var `TEST=1`: export with `EXPO_PUBLIC_TEST_MODE=1 npx expo export --platform web`; work folder `/home/claude/wp-test`; `TITLE=Slice Empire — TEST build (v$V · $SHA)`.
- In normal mode, add the grep guard: fail if `TEST MODE PANEL` appears in the bundle.
- First run: no slug yet → `publish_files` without `slug` (creates a private artifact, full replace); then write the new slug into that runbook section so later runs patch it.
- Julien runs it after the step's pull request is merged: "Read claude/PUBLISH-RUNBOOK.md and carry out the TEST build prompt inside it exactly."

## 4. Cards
1. **X1 — Gate + shell** (lane N + U): `TEST_MODE`, test save keys, TEST pill, empty sheet, Settings label, source-guard test, the test export and its fixture in verify.
2. **X2 — Money and time** (lane E, store + engine): free buys in `canAfford`/`pay` + diamonds + the two bypasses, income buttons, cash → 0, purchase toggle; C155, clock offset, Away-for, Next day/Monday, Play forward, speed.
3. **X3 — Jumps** (lane E for the script and loader, U for the list): `scripts/test-snapshots.ts`, `snapshots.json` and its load test, per-city Jump list, backup/undo, build-next-shop.
4. **X4 — Story & save tools** (lane U, store actions under E): next beat now, skip tutorial, export/import, reset.

Waves: X1, then X2 ‖ X3, then X4. Reviews: r1 `codecritic` full effort on `src/dev src/engine/clock.ts src/engine/game.ts src/store` and the touched views; `critic` low effort on the panel shots only, plus the 0-changed-shots check on the normal export. No storycritic or audiocritic.

## 5. Not in v1 (later)
- A TestFlight test build: an EAS profile `preview-test` with `EXPO_PUBLIC_TEST_MODE=1` and a `.test` bundle id suffix, so cheats work on a real iPhone.
- Per-feature toggles (force a Waterfront boat, a rival attack, an Uptown critic visit).

## 6. Open decisions (defaults above; the planning session uses them without asking)
1. Slot `5.19-test` before v5.20. 2. Free buys ON by default. 3. Separate private artifact. 4. Speeds 1×/4×/16×. 5. Snapshots from the greedy sim. 6. Need-text hidden while free buys are on.

## 7. Kickoff prompt for the planning session
Paste into a new session in the Pizza Game project:

```
Plan the Slice Empire test build into the build loop. Write loop files and docs only; change nothing under src/ or scripts/.

1. Clone github.com/JulienMellon/IdleSliceHero with push access. Read docs/PLAN-test-mode.md, all of it. It is the approved design; its section 6 defaults are decided, so don't ask about them.
2. Re-check section 0's facts with greps only (canAfford/pay and their bypasses, the diamond checks, engine/clock.ts and storefront.tsx C155, which cities exist, ci.yml and eslint.config.js). Where the code differs, follow the code and say so in the plan.
3. For format, read only: docs/build/README.md, STATE.md, OWNERS.md, docs/build/v5.18/VERSION.md, docs/build/v5.18/card-E3.md, docs/build/sessions/README.md, docs/build/sessions/S5-v5.18.md. Open a source file only to name an exact symbol or line in a card.
4. Write docs/build/v5.19-test/VERSION.md (scope, cards table, waves, defaults, critics per round, fix routing) and card-X1.md to card-X4.md in the repo's card format (Goal; Files: own / shared append-only / do not touch; Steps as checkboxes; Tests that must exist; Fixtures), from plan sections 1, 2 and 4.
5. Write docs/build/sessions/S6-v5.19-test.md modelled on S5. At close it sets STATE back to version: 5.20, step: waves, round: r1, next: "wait for Julien to set v5.20 scope", and tells Julien to run the TEST publish prompt.
6. OWNERS.md: add src/dev/** (lane N; the panel UI under U). sessions/README.md: add row 6. STATE.md: version: 5.19-test, step: waves, round: r1, next: naming S6; keep the open: line.
7. Delete the "Julien's questions (one time)" section from .claude/agents/codecritic.md; v5.19 r1 answered it.
8. In this Project: add the "Publish the TEST build" section to claude/PUBLISH-RUNBOOK.md (plan section 3). In the repo, set docs/PLAN-test-mode.md's status to "cards written".
9. Commit on this session's branch and open one pull request to main. Reply in under 8 lines: the PR link, any default you had to add, and the orchestrator prompt to paste after merging (the one in docs/build/sessions/README.md).
```
