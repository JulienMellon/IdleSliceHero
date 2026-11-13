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
