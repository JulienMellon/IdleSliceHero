# Plan: a faster, cheaper build/review loop

Written 2026-11-13 against `main` at `4836f53` (v5.15 closed, v5.16 not started). The audit changed nothing in `src/` or `scripts/`.

**Status, 2026-11-13: approved.** Julien chose to update the loop before the next build session. His answers are in "Decisions" at the end and in `docs/build/DECISIONS.md` (#26 to #32). The cards are written and STATE points at them:
- `docs/build/v5.15-loop/`: `VERSION.md` and cards Q2, Q6, Q1, Q3, Q4, in that running order, plus `poc/` with the audit's scripts.
- `docs/build/v5.16/card-U5.md`: the tap-target and text-size fixes, as the last card of v5.16.
- Q5 (a public playtest build) is parked. The first half of Q6 is done: the screenshots from before v5.0 are in `JulienMellon/idleslicearchive`.

The measurements and the reasoning below are as written before those decisions; where a card file differs from the outline here, the card file is right.

## Summary

The loop's structure is sound (cards passed by path, critics writing to files, an orchestrator that reads three files). The cost is in the review half: every round the critic is handed almost the whole screenshot set again, and programmers ship UI they have never seen. Six cards fix that. The first three touch only `scripts/`, the agent briefs and the loop's README, need no critic round, and pay back inside v5.16.

| # | Card | What changes | Measured problem it removes |
| --- | --- | --- | --- |
| Q1 | Deterministic screenshots | Shots run on a frozen clock | 59 of 92 shots flagged "changed" between two runs of the same build |
| Q2 | Programmers see their own shots | `--only`, fixtures assert their state | UI cards are checked with `tsc`, `jest` and `py_compile` only |
| Q3 | Layout checks in the screenshot run | Tap-target, text-size and clipping checks before the critic | 40 pt HUD buttons and 7.5 to 9 pt text are in the build; no review flags them |
| Q4 | Re-check rules | Scoped review sets, a two-round limit per bug | G95 stayed open through five reviews |
| Q5 | Playable build on every push (**parked**: no public playtest for now) | GitHub Actions, GitHub Pages | The published playtest build is v4.5; the game is at v5.15 |
| Q6 | Repo weight and loop metrics | Old screenshots out of the tree (**done** for v0.1 to v4.9), a metrics line per version | 744 MB to clone; no record of how long a round takes |

## What I measured

All on a 2-core sandbox, on the same code as v5.15 r3 (`git diff b226b9d HEAD -- src scripts` is empty).

### Verify takes about 11 minutes, and 70% of it is screenshots
| Step | Time |
| --- | --- |
| `npx tsc --noEmit` | 9 s |
| `npm test` (69 suites, 939 tests) | 121 s (HANDOFF says about 70 s on your machine) |
| `npx expo export --platform web` | 53 s |
| `scripts/screenshots.py` (92 shots) | 469 s and 465 s on two runs; 5.1 s a shot |

The slowest shots are `70-head-rush-bark` (28 s), `04-after-20s-play` (26 s) and `22-dale-perk-card` (15 s). They wait on the wall clock.

### v5.15 took 7 h 18 min; 2 h 11 min of it was work
From `git log` (wave 1 launched at 18:55 UTC, closed at 02:13 UTC):
- 71 minutes from launch to the first committed build.
- 5 h 07 min waiting on the usage limit, between the r1 reviews (20:15) and the resume (01:22).
- Fix round r2 took 27 minutes and r3 took 22. In each, 7 to 8 minutes passed between the fix commit and the screenshot commit.

Neither v5.14 nor v5.15 reached SATISFIED. Both used all three rounds; v5.14 closed with bug G95 open and v5.15 with 8 minors.

### The "changed shots only" filter does not filter
`review_shots.py` calls a shot changed when 0.5% of its pixels differ. I ran `screenshots.py` twice on one build and compared the two folders:

| Compared | Flagged changed |
| --- | --- |
| Same build, run twice | **59 of 92** (diffs of 0.6% to 7.3%) |
| v5.15 r1 → r2 (a fix round) | 83 of 92 |
| v5.15 r2 → r3 (a fix round) | 78 of 92 |

Every shot that shows the live shop differs from run to run, because cooks, cars, clouds and the golden pizza are wherever the wall clock put them. The 33 shots that stayed the same have no live shop in view: cut-scenes, the City map, the Scrapbook, Settings, the vanity shop, and sheets or popups that cover the scene.

So in r3 the critic was given 78 new and 78 previous images. The open notes it was re-checking name 17 shots. At the 0.45K tokens per half-size image that HANDOFF measured, that is about 70K tokens of images where about 15K would do (an estimate; I did not meter a critic run).

The fix is known to the repo: `marketing/ad/record.py` and `clock_page` in `fixtures/56_u1.py` already use Playwright's fake clock, and the game's only `Math.random` calls are in `src/audio/director.ts`. I tested the idea on two saves, three runs each:

| Clock | Diff between runs |
| --- | --- |
| Wall clock (today) | 0.5% to 5.2% |
| Fake clock, paused after the app loads | 0.8% to 3.8%: the game had already run for a slightly different time in each run |
| Fake clock, paused **before** the app boots | 0.32%, 0.32%, 0.57%, 0.00%; game state identical every run |

The last recipe is not finished. One pair was pixel-identical; the others kept a small residue that I did not trace (I'd look first for an animation that doesn't run on the JS clock). It is close enough to make "two runs, zero changed" a fair acceptance test for Q1.

### Programmers never see what they drew
`.claude/agents/programmer.md` forbids the screenshot script, and card U1's checks were `npx tsc --noEmit`, `npx jest src/components` and `python3 -m py_compile scripts/fixtures/56_u1.py`. The first look at any new screen is the critic's. Three v5.15 notes were about fixtures that did not capture what they claimed (G103, D467, and shot 70 in D459), and one verify failed on a fixture (`7e5dd2d`).

### Fix rounds open the bugs the next round finds
- v5.15 r1 had 5 bugs. After the fix round, r2 had 5 again: G95 and G98 were not fixed, and **G101, G102 and G103 were new**. G101 and G102 are clipped cash and clipped prices on the two bars that r1's fixes had just rearranged (the diamond chip moved to the top row; the ×1 chip joined the sidewalk row). That link is my reading of the notes.
- **G95** (the gift overlapping something) was open in five straight reviews, v5.14 r1 to v5.15 r2. Each fix cleared the configuration in the note and the next review found another.
- Of v5.15's 8 bug IDs, 4 are text clipped or covered in the HUD and the sidewalk row (G95, G98, G101, G102), 2 are scene props hidden behind others (G99, G100), 1 is a fixture (G103) and 1 is contrast (G97). Most of these are checkable without a critic.

### A layout probe finds things no review has
I wrapped `shot()` so that each of the 92 shots also asked the page's DOM four questions: tap-target size, text size, clipped text, and text past the screen edge. It is a rough probe and needs triage (the last question mostly found the scrolling shop tabs), but two results are solid:

- **Tap targets under 44 pt.** `open-scrapbook`, `open-city`, `open-tasks`, `open-gift` and `shop-chip` are 40 × 40 in 63 to 67 shots; `buy-amount` is 36 × 55; `skip-scene` is 74 × 31; `back` is 70 × 22. `tap-targets.ts` says every control is drawn at 44 pt. The 40 and the 36 came in with fix round r3 (`ca8455a` changed `hudIcon` from 44 to 40), because critic notes G101 ("40 pt buttons") and G102 ("×1 chip 36 pt") asked for them. A review note overrode a house rule and nothing caught it. Some of these may be covered by a `hitSlop` on iOS; the check would make each exception explicit.
- **Text under 10 pt.** "DRIVERS" and "COUNTER" at 8.5 pt in 44 shots, "need $…" at 9 pt, and at 7.5 pt on the flagship (shot 13). Neither is in an open-notes table.

One result is not solid: my clipped-text test raised 16 unverified hits and missed the one known case (D477 in shot 05b2). Q3 has to get that test right before it can gate anything.

### Smaller things
- **Clone weight.** A depth-1 clone is 744 MB and took 44 s here. `screenshots/` holds 2,285 PNGs in 72 folders (776 MB); each round adds a 30 MB folder, so v5.15 added 90 MB. Every version starts in a fresh session, so every version pays this.
- **The published playtest build is old.** `WEB-PLAYTEST.md` links a build of v4.5 from 2026-10-30; the game is at v5.15. There is no `.github/` folder and no `eas.json`.
- **No timings are kept.** STATE's log has dates but no times. The figures above came from `git log`.
- **Lint.** `AGENTS.md` says to run lint before calling a task done; the programmer brief forbids `npx expo lint`, and there is no ESLint config. One of the two should change.
- **iPhone SE.** Cards say "every new string fits at iPhone SE width", but every shot is taken at 393 × 852.

## The cards

Outlines, not yet in the repo's card format. Q1 to Q3 all edit `scripts/shots_lib.py` and `scripts/screenshots.py`, so they run one after another with one programmer. None of them changes a pixel of the game, so none needs a critic; each has a command that passes or fails.

### Q1. Deterministic screenshots
**Goal:** two runs of one build produce the same pixels.
**Files:** `scripts/shots_lib.py`, `scripts/screenshots.py`, `scripts/fixtures/*.py`.
1. In `seeded_page`, install the fake clock and pause it before `goto` (`ctx.clock.install(time=T0)`, `page.clock.pause_at(...)`), wait for the network in real time, then move game time only with `page.clock.run_for`. Stamp `lastSavedAt` from `T0`, not `time.time()`.
2. Replace the timed waits with fake-time steps: 37 `time.sleep` calls, 33 `settle` calls and the wait argument on most `shot` calls. `clock_page` in `56_u1.py` becomes the general case.
3. Find and remove the remaining residue (see the test above).
4. Lower `CHANGED_FRACTION` in `review_shots.py` once the noise is gone, so that a real 0.3% change is not called "same".

**Check:** run `screenshots.py` twice on one export; `review_shots.py b a` prints `0 new, 0 changed`.
**Gain:** a re-check round shows the critic only what a fix touched. The slow wall-clock waits (28 s, 26 s) become fake-time jumps; I did not measure the new total.

### Q2. Programmers see their own shots
**Goal:** a UI or scene card ends with the programmer looking at its screens.
**Files:** `scripts/screenshots.py`, `scripts/fixtures/`, `.claude/agents/programmer.md`, `docs/build/README.md` (spawn prompt).
1. Finish the K0b split: move shots 00 to 55 out of the 484-line `screenshots.py` into fixture files, one per screen group.
2. Add `--only <fixture,…>`: `python3 scripts/screenshots.py dev --only 56_u1`.
3. Each fixture asserts the state it claims before it shoots (`challenge-won` is on screen; the pie count is behind pace). A failed assertion goes to `report["errors"]`, so verify fails instead of the critic writing a note.
4. Programmer brief: on a card with a `Fixtures` section, run `npx expo export --platform web`, then the card's own fixture, and open at most three half-size shots. Still never the full suite.

**Check:** `--only 56_u1` writes only that fixture's shots and finishes in under 90 s after the export.
**Cost:** about 53 s of export plus 5 s a shot, and about 1.4K tokens for three images, per UI card.

### Q3. Layout checks inside the screenshot run
**Goal:** mechanical faults fail verify; the critic's rounds go to craft and fun.
**Files:** `scripts/shots_lib.py` (the probe, in `shot()`), `scripts/layout_allow.json` (new), `docs/build/README.md` section 5.
1. At every shot, evaluate one DOM probe and append to `screenshots/<L>/layout.json`: pressables under 44 pt, text under 10 pt, text clipped or ellipsised, text past the screen edge.
2. Get the clipped-text test right: it must find D477 on the current build before it counts.
3. Start from an allowlist of today's findings, each with a reason or a note ID, so the gate is "nothing new". Then burn the list down in normal cards.
4. Add a second viewport, 375 × 667, for the UI-only fixtures.
5. Verify prints the count of new findings; a non-zero count goes to the owning lane like a failed test.

**Check:** verify on the current build prints 0 new; shrinking a button to 40 pt in a scratch branch prints 1.
**Limit:** this sees the DOM, not the SVG scene. Scene overlaps stay with the budget tests in `scene/__tests__/`.

### Q4. Re-check rules (text only: README and the critic brief)
1. **Scoped set.** In r2 and r3, `review_shots.py` builds the set from the shots named in the open-notes table plus the shots that changed. After Q1 that is a few dozen images, not 156.
2. **Two rounds per bug.** A bug still open after two fix rounds is not sent a third time as a note. Its programmer first writes a test that fails for every state the element can be in (G95: every banner, card and chip that can share the sky strip), then fixes. `CLAUDE.md` already asks for Plan Mode on a bug that survives its first fix.
3. **House rules outrank fix suggestions.** The critic brief gets the short list a suggested fix may not break (44 pt, 10 pt text, the WELCOME mat). A note that needs an exception says so.
4. **New minors in a re-check** on shots the round did not touch are logged as carried and don't count against the gate.

### Q5. A playable build on every push
**Goal:** the newest build is one tap away on your phone, and tests run when no session is open.
**Files:** `.github/workflows/ci.yml` (new), `app.json`. Coordinate with card L1 (v5.17), which adds `pages.yml` for the site.
1. On push to `main`: `npm ci`, `tsc`, `jest`, `expo export --platform web`.
2. Deploy the export to GitHub Pages under `/play/`. `WEB-PLAYTEST.md` notes this needs `experiments.baseUrl`; confirm against the SDK 58 docs first, as `AGENTS.md` requires.
3. Show the build number and commit on the page.

GitHub's billing page says standard hosted runners are free in public repositories, and this repo is public.
**Needs you:** turn on Pages for the repo (it is already on your launch list for the site).
**Caveat:** the build would be playable by anyone with the link, before launch. If that is unwanted, keep the Claude artifact route and have the close step republish it.

### Q6. Repo weight and loop metrics
1. Keep one baseline folder of screenshots in the tree, overwritten at each close, plus the folders that open review files cite. Delete the other folders from the tree; they stay in history. After Q1, unchanged shots are byte-identical, so a round adds only the PNGs that really changed.
2. `scripts/loop_stats.py`: read `git log` and print, per round, the wall time, the screenshot time and the usage-limit gaps. At close, the orchestrator appends one line to `docs/build/METRICS.md`: rounds used, bugs opened and closed per round, shots changed, layout findings. STATE's log lines get a time, not only a date.

**Gain:** a fresh clone drops from 744 MB toward the size of one screenshot set plus the code (an estimate, about 50 MB). The metrics are how we find out whether Q1 to Q4 worked.

## Order

1. **Now, before v5.16 wave 1** (`docs/build/v5.15-loop/VERSION.md`): Q2 and Q6 together, then Q1, then Q3, then Q4. Q2 goes first so that Q1 can be developed one fixture at a time; Q4 goes last because it writes the rules for what the others built. v5.16 has five cards with screens (P1, S2a, S2b, T1a, T1b), so these pay back in the same version.
2. **In v5.16:** card U5, last, fixes the controls and text the layout check lists.
3. **Parked:** Q5.
4. **After v5.16 closes:** compare its `METRICS.md` line with v5.15's (3 rounds, 8 bugs, 78 to 83 shots re-reviewed per fix round).

Targets for v5.16, so the plan can be judged: the critic re-checks under 40 images in a fix round (r3 of v5.15 had 156); no bug is open for more than two rounds; verify fails on a 40 pt button; the gate is met in two rounds or fewer.

## Decisions (Julien, 2026-11-13)

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Run the loop update before v5.16 starts, or alongside it | **Before.** It is its own step, `v5.15-loop` |
| 2 | Old screenshot folders | **v0.1 to v4.9 moved** to the private repo `JulienMellon/idleslicearchive` (51 folders, 1,113 files, 354 MB, same paths; every file checked by hash from a fresh clone of the archive). Folders from v5.0 on stay |
| 3 | Public playtest link on GitHub Pages | **No, for now.** Q5 is parked |
| 4 | Lint | Not answered. The default stands: `AGENTS.md` drops the lint line until ESLint is configured (card Q4; DECISIONS #32) |
| 5 | The HUD's round buttons at 40 pt | **Keep 40 pt.** I had proposed restoring 44 pt; that would take 20 pt from the cash (139 pt wide now, 119 pt with five 44 pt buttons). The rule becomes: drawn at 44 pt or more, or at 40 pt or more with a `hitSlop` that a test proves reaches 44 pt; never under 40 pt |
| 6 | Other controls under 44 pt | **Fix all to the rule** in v5.16 (card U5). No exceptions except Close |
| 7 | Minimum text size | **10 pt** |

Measured after the removal: a depth-1 clone is 422 MB and took 31 s (it was 744 MB and 44 s). A baseline-only screenshot folder (the rest of Q6) is still open and waits for Q1.

## What I did not measure
- Token use per agent. The image estimate uses HANDOFF's 0.45K figure.
- Whether the fake clock shortens the full run, and whether running fixtures in parallel helps on your machine.
- Anything on a phone. This plan covers the web loop only; device review starts with v5.17's checklist.
