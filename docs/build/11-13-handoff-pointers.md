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
