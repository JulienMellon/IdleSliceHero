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
