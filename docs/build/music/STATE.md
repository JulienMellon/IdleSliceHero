# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: R0              # R0 | R1 | R2 | done
step: listen           # cards | verify | review | fix | reel | listen
bank: not chosen       # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 done
review: AUDIOLOG.md (next ID AU78)      # latest audio review file, verdict and counts
last_reel: tools/audio/build/reel/R0.mp3 (2026-11-16, sent)
heard: none            # round → Julien's verdict in five words
open: none
next: await Julien: which bank, A, B, C or D (default D)?
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-15 track set up from docs/PLAN-music-rewrite.md. Nothing built.
- 2026-11-16 M0 DONE. Built: 0 cues shipped, audio 13.28 MB of 14 unchanged, reel R0.mp3 62.85 s. Needs: recommend D (2–5 kHz share 1.9%, sustain ratio 0.59); D licence notes uncertain sample origin.
- 2026-11-16 R0 verified (jest src\/audio 53 pass, assets\/audio + src untouched); reel sent; step listen.
