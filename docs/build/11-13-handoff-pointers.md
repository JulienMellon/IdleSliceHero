# 2026-11-13 handoff pointers

Handoff files from the 2026-11-13 session (performance audit and screenshot review). Written against `main` at `c761986`.

| Where | File | What it holds |
| --- | --- | --- |
| Repo (`main`) | `docs/build/v5.17/HANDOFF-perf-and-ui.md` | The current handoff: a partial performance audit (feeds card L1 item 4) and outlines for three UI cards for v5.17 (first-session focus, one sky event at a time, rewards that look claimable). Start here. |
| Repo (`main`) | `docs/build/v5.17/VERSION.md` | Edited: a "Handoff notes" section at the end points to the file above. The three UI cards are not yet in its Cards table. |
| Pizza Game project | `claude/HANDOFF-perf-audit-and-v5.16-cards.md` | The first copy of the same content. **Stale:** its title and open questions still say v5.16; Julien chose v5.17. Use the repo copy. |

## Not saved anywhere
- The Node benchmark script behind the timing table (it was in a scratch folder). The doc lists what it imported and the one setup quirk (`import '../engine/features'` first), so it can be rebuilt in a few minutes.
- No device or browser measurements were taken; the audit stopped before them.

## Related, written before this session
`claude/PLAN-v5.16-playtest3.md` in the project and `docs/build/v5.16/`, `docs/build/v5.18/` in the repo hold the neighbouring plans.

## From the pacing playtest session (same day)
A second 2026-11-13 session playtested v5.15 for pacing. It was written against `main` at `11caf1e`, before `ca5300c` added the playtest 3 cards.

| Where | File | What it holds |
| --- | --- | --- |
| Repo (`main`, commit `4836f53`) | `docs/REVIEW-v5.15-pacing.md` | The only handoff file from that session. Findings F1–F6 (the 28-session check-in diary, the day-0 dead sessions, the goal bar at "$2.03K / $1.15B", active play worth about 2% of a night oven, rush and orders in the lull, the build session), seven ideas with which ones need a refit, four decisions for Julien, and how to reproduce the runs. |

- **Check before planning from it:** its ideas were compared with the roadmap and the v5.16 summary as they stood at `11caf1e`. Cards E0 and P1 (v5.16) and V1, V2 (v5.18) came after and were not read, so compare the seven ideas against them first.
- **Not saved anywhere:** the per-session diary script, the session-start save dump and the two real-time browser scripts (scratch files). Section 6 of the review says how to rebuild them. The screenshots and bot logs were in a scratch folder and are gone.
- The branch `claude/loving-thompson-8yducm` holds the same review commit as `main` and nothing else.

## From the playtest 3 planning session (same day)
A third 2026-11-13 session turned Julien's playtest 3 wishlist into cards: economy and pacing, cash rewards, a live shop report, the managers in the story, and the scrolling shop. Julien answered seven decisions in the session. It was written against `main` at `11caf1e`; the cards are commit `ca5300c`.

| Where | File | What it holds |
| --- | --- | --- |
| Pizza Game project | `claude/PLAN-v5.16-playtest3.md` | The plan for Julien: what the sim measured on v5.15 (session 1 over at 16 min, managers costing 5 to 73 seconds of income, one daily task worth 15× Waterfront's crew, rewards missing from the sim), the four changes, the v5.16 waves, and his seven answers. Start here for the why. |
| Repo (`main`) | `docs/build/v5.16/VERSION.md` | Rewritten: 9 cards in 8 waves, the playtest 3 decisions and two rules that follow from them under Defaults, the fix routing for the new cards. The orchestrator's entry point for v5.16. |
| Repo (`main`) | `docs/build/v5.16/card-E0.md` | New. Session 1 to about 40 minutes, separate head and manager prices, heads earn at half speed while away, the reward cuts, rewards in the sim, the cheapest-versus-best metric, a baseline fit and three pacing tests. Wave 1. |
| Repo (`main`) | `docs/build/v5.16/card-P1.md` | New. The shop report: the service feature with its tip and cold line, the strip and sheet, effect lines on upgrade cards, no red frame after the tutorial ("Buy both" stays), and heads' `slammed` barks. Shots 130–137. Wave 3. |
| Repo (`main`) | `docs/build/v5.16/card-W2.md`, `card-T1a.md`, `card-T1b.md`, `card-E2b.md` | Amended. W2 sections 6 and 7 (the five managers and the report copy); T1a's `manager` trigger and five hire scenes (35 → 40 scenes); T1b's manager portraits and in-shop faces (shots 138–139); E2b's refit must also hold E0's targets. |
| Repo (`main`) | `docs/build/v5.18/card-V1.md`, `card-V2.md`, `VERSION.md` | New and amended. The scrolling shop: V1 makes the shop's width data and adds a scroll container with no pixel change (it shares K1's seam verify); V2 adds the wide Restaurant and Flagship, mirrored Waterfront and Industrial, and off-screen cues (shots 140–147). |
| Repo (`main`) | `docs/build/DECISIONS.md` | Rows 19–25: Julien's playtest 3 answers, and the two derived rules (heads earn offline at half speed; the cold line costs value, not walk-ins). |
| Repo (`main`) | `docs/build/ROADMAP.md`, `docs/build/STATE.md` | Updated: the 5.16 and 5.18 rows (38 card runs, was 34), and STATE's `next:` line and log. |

- **Check before running v5.16:** these cards were written before `docs/REVIEW-v5.15-pacing.md` (the pacing playtest above) and the v5.17 perf and UI handoff, and were not compared with either. The pacing review's F2 (dead day-0 sessions) and F4 (active play worth about 2% of a night oven) bear on card E0's targets and reward cuts; its F3 (the goal bar) bears on card P1.
- **Not saved anywhere:** the three measurement scripts behind the plan's numbers (build and hire times per shop, manager price in seconds of income at each opening, how often the cheapest buy was also the best). They were thin wrappers around `run()` and `options()` in `scripts/review/sim2.ts` and can be rebuilt in minutes. Card E0 step 5 makes the third one part of the sim.

## From the loop audit session (same day)
A fourth 2026-11-13 session audited the build/review loop itself, wrote a plan, and took Julien's decisions on it. He chose to update the loop **before** v5.16, so STATE now points at a tooling step, `v5.15-loop`, and v5.16 follows it. The audit was measured on `main` at `4836f53` (the same code as v5.15 r3); the handoff was written on top of `4afb69b`.

| Where | File | What it holds |
| --- | --- | --- |
| Repo (`main`) | `docs/PLAN-loop-improvements.md` | Start here for the why. What was measured (verify takes about 11 minutes, 70% of it screenshots; two runs of one build differ in 59 of 92 shots; programmers never see their screens; fix rounds opening new bugs; controls under 44 pt and text under 10 pt), six card outlines Q1 to Q6, and Julien's seven answers. Its "Status" block at the top says what became of each card. |
| Repo (`main`) | `docs/build/v5.15-loop/VERSION.md` | The orchestrator's entry point for the loop update. It overrides four things in the README (no version bump, no critics, programmers may run the screenshot script, its own verify block), lists the waves (Q2 + Q6, Q1, Q3, Q4), the defaults if a check can't be met, and the close step that sets `version: 5.16` and `last_shots: v5.15-loop`. |
| Repo (`main`) | `docs/build/v5.15-loop/card-Q2.md` | New. Split shots 00 to 55 out of `screenshots.py` into fixture files, add `--only`, make fixtures assert the state they shoot. Wave 1. |
| Repo (`main`) | `docs/build/v5.15-loop/card-Q6.md` | New. `scripts/loop_stats.py` and `docs/build/METRICS.md`, with rows for 5.14 and 5.15. Wave 1. |
| Repo (`main`) | `docs/build/v5.15-loop/card-Q1.md` | New. Screenshots on a frozen Playwright clock; the check is two full runs with 0 changed shots. Holds what the proof of concept found and did not find. Wave 2. |
| Repo (`main`) | `docs/build/v5.15-loop/card-Q3.md` | New. A DOM probe at every shot (small tap targets, small text, clipped text, text past the edge), `scripts/layout_check.py`, and `scripts/layout_allow.json` as the to-do list for card U5. Wave 3. |
| Repo (`main`) | `docs/build/v5.15-loop/card-Q4.md` | New. The README, the critic and programmer briefs and `review_shots.py --notes` catch up: self-shots for programmers, two rounds per bug, house rules outrank a note's suggested fix, a scoped review set in r2 and r3, the metrics line at close. Wave 4. |
| Repo (`main`) | `docs/build/v5.15-loop/poc/` | The audit's scratch scripts, saved: `shot_diff.py` (the 59-of-92 measurement), `clock_poc.py` (the frozen-clock recipe), `layout_probe.py` (the DOM probe), and a README with each one's result. |
| Repo (`main`) | `docs/build/v5.16/card-U5.md` | New. Tap targets and text size to Julien's rule; empties the layout allowlist. Runs last in v5.16 (wave 8), after the cards whose files it touches. |
| Repo (`main`) | `docs/build/v5.16/VERSION.md` | Amended: U5 in the Cards table, wave 8 (verify is now wave 9), U5 in the fix routing, and two Defaults (the layout rule; "this version runs after the loop update"). |
| Repo (`main`) | `docs/build/DECISIONS.md` | Rows 26 to 31: Julien's answers (loop update first; old screenshots archived; no public playtest; HUD buttons stay 40 pt with a proven 44 pt touch area; fix every other small control; 10 pt text). Row 32 is a default he has not confirmed (drop the lint instruction). |
| Repo (`main`) | `docs/build/STATE.md` | `version: 5.15-loop`, a new `next:` line, one log line. `last_shots` is still `v5.15-r3` until the loop update closes. |
| Repo (`main`) | `docs/build/ROADMAP.md`, `HANDOFF.md` | ROADMAP: U5 in the 5.16 row, 39 card runs, a sentence on the loop step. HANDOFF: a second pointer line at the top, and the "Outside the loop" note on screenshots. |
| Repo (`main`) | `screenshots/v0.1` … `screenshots/v4.9` | **Removed** from the tree: 51 folders, 1,113 files, 354 MB. Git history keeps them. |
| `JulienMellon/idleslicearchive` (private) | `screenshots/v0.1` … `screenshots/v4.9`, `README.md` | The same 51 folders at the same paths. Every file was compared by SHA-256 against the source from a fresh clone of the archive before anything was removed here. |
| Pizza Game project | `claude/PLAN-loop-improvements.md` | A copy of the repo's plan, updated with the decisions. The repo copy is the one to trust if they differ. |

PR #1 (`docs/loop-improvement-plan`) carried all of the above into `main`.

- **Check before running the loop update:** no card in `v5.15-loop` has been run. The frozen-clock recipe got two saves to between 0.00% and 0.57% difference, not to zero; the cause of the residue is not known, and VERSION.md has a default for that. The clipped-text check in the probe is unreliable (it missed D477), and VERSION.md has a default for that too. The fixture file names in card Q2 are a proposal.
- **Check before running v5.16:** its cards were written for the old screenshot tools. After the loop update, fixtures move time with `advance()` and assert with `expect()`; card Q4 adds a line to the README's spawn prompt so each programmer is told. v5.17's card L1 (`scripts/store_shots.py`) builds on the same library and has the same gap. Card U5 was not compared with the three UI card outlines in `docs/build/v5.17/HANDOFF-perf-and-ui.md`; U5 covers that file's finding 6 (tiny text) and nothing else from it.
- **Timings** in the plan were taken on a 2-core sandbox (`npm test` took 121 s there; HANDOFF says about 70 s). Compare ratios, not seconds.
- **Not saved anywhere:** the screenshots of the two same-build runs and the probe's full output (scratch folders, gone). The counts are in the plan and the scripts in `poc/` reproduce them: about 8 minutes a run. Two earlier frozen-clock attempts that failed are described in the plan's table, not kept as code.
- `docs/logs/CRITICLOG-archive.md` still names paths under `screenshots/v2.0/`; those files are now in the archive repo.

## Status after the planning session of 2026-11-13 (evening)
Everything above is placed. It is built in the versions that already existed (the loop update, then v5.16, v5.17 and v5.18); no version was added. Nothing is built yet.

| Open item above | Resolved how |
| --- | --- |
| The three UI cards "not yet in the Cards table" | Written as one card, `docs/build/v5.17/card-U4.md`, wave 3 of v5.17 |
| The performance audit "feeds card L1 item 4" | Written into `docs/build/v5.17/card-L1.md` step 4 (measure first with `scripts/review/perf.py`, then fix only what the numbers show). Phone measurements are items V and W of `DEVICE-CHECKLIST.md` |
| The pacing review's seven ideas | Julien chose idea 5 only: `docs/build/v5.16/card-E0.md` step 3b. The rest are not planned (DECISIONS #33) |
| Pacing F2 and F4 against card E0 | F2: E0's session-1 and manager targets already change day 0; no edit. F4: its fix was idea 4, dropped because it contradicts the reward cuts |
| Pacing F3 (the goal bar) against card P1 | Not planned (idea 2 was not chosen); P1 is unchanged |
| Card U5 against the three UI outlines | U5 covers the small text only. U4 runs a version later, in files U5 has sized, and carries the layout rule |
| v5.16's cards and L1 written for the old screenshot tools | Card Q4 adds the line to every spawn prompt; L1 step 5 and U4 now say it themselves |
| Sessions told to push to `main` | README section 6: push the session's branch and open one pull request (DECISIONS #34) |

**Running order:** (1) the loop update; (2) v5.16 waves 1 to 5, ending on a `tsc` and tests checkpoint; (3) v5.16 waves 6 to 8, verify and reviews; (4) v5.17; (5) v5.18. Each is a fresh session that ends with a pull request.

**For the orchestrator, to keep tokens down** (on top of the README): re-check rounds (r2, r3) and low-effort document reviews run their critic with `model: sonnet`; the codecritic on money, consent and save-migration paths keeps the session's model. Scratch scripts listed above as "not saved anywhere" are not rebuilt unless a card asks for one.
