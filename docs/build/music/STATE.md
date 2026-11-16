# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: R0              # R0 | R1 | R2 | done
step: cards            # cards | verify | review | fix | reel | listen
bank: not chosen       # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 todo
review: AUDIOLOG.md (next ID AU78)      # latest audio review file, verdict and counts
last_reel: none
heard: none            # round → Julien's verdict in five words
open: none
next: start R0; read docs/build/music/R0-bank.md
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-15 track set up from docs/PLAN-music-rewrite.md. Nothing built.
