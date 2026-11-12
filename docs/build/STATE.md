# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.14
step: waves            # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.13      # label of the last screenshot set that passed verify
codecritic_range_start: 5d82004
cards:                 # todo | running | done | partial | blocked
  B3: todo
  R3: todo
  C3: todo
  K0a: todo
  K0b: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: CRITICLOG.md "Current state" (round 61, NOT SATISFIED; next IDs G95, D447)
  code:   CODELOG.md "Current state" (round 24, APPROVED at v5.12; next IDs K1, C110, A30, M62, U12, T85)
  story:  STORYLOG.md (next ID S21)
  audio:  AUDIOLOG.md (next ID AU78)
open: round 61 notes, all written into the v5.14 cards
next: v5.14 wave 1 (B3 + R3). Missing for Julien (export as Markdown): docs/story/STORY-v4-final.md (before v5.16 w2), docs/specs/PRESTIGE.md (before v5.18 w2), docs/specs/PRIVACY-POLICY-DRAFT.md + APP-PRIVACY-LABEL-AND-AGE-RATING.md (before v5.17 w2).
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-11 Plan delivered. Repo at 07e9d8e (v5.13). Nothing started.
- 2026-11-12 Setup done: writer agent, critic review-file rule, HANDOFF pointer, Todd plan spec. 4 spec exports still missing.
