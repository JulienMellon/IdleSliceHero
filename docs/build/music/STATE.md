# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: R1              # R0 | R1 | R2 | done
step: cards            # cards | verify | review | fix | reel | listen
bank: C MuseScore_General_Full.sf3      # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 done, M1a done, M1b done, M1c done
review: docs/build/music/review-R1-audio.md NOT SATISFIED, bugs 0 major 1 (AU78 fixed) minor 6 open (AU79-AU84), next ID AU85
last_reel: tools/audio/build/reel/R1.mp3 (2026-11-16, sent)
heard: R0 → "C"           # round → Julien's verdict in five words
open: none
next: notes round 1 on R1 running (card-NOTES.md, notes/R1.md); then verify, commit, reel R1, stop
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-15 track set up from docs/PLAN-music-rewrite.md. Nothing built.
- 2026-11-16 M0 DONE. Built: 0 cues shipped, audio 13.28 MB of 14 unchanged, reel R0.mp3 62.85 s. Needs: recommend D (2–5 kHz share 1.9%, sustain ratio 0.59); D licence notes uncertain sample origin.
- 2026-11-16 R0 verified (jest src\/audio 53 pass, assets\/audio + src untouched); reel sent; step listen.
- 2026-11-16 Julien heard R0: "C". Round R1 started; M1a launched.
- 2026-11-16 M1a DONE. Built: 2 cues (downtown, downtown_sparse), audio 13.37 MB of 14, full build pass on bank C. Needs: fetch_bank.sh needs bash; all cues re-rendered through bank C (large diff, expected).
- 2026-11-16 M1b DONE. Built: 3 loops plus 37 stingers, audio 13.87 MB of 14, full build pass. Needs: nothing (note: Suburbs walking bass also under the march; a stray full build wiped assets, restored, sfx checked out again).
- 2026-11-16 M1c DONE. Built: 8 loops, audio 13.87 MB of 14 (13867227 B), full build pass, lead minus bed -3.0 to -3.6 LU. Needs: nothing (judgement calls: HQ motif twice per loop; Industrial lead vibes then flute).
- 2026-11-16 R1 verified and committed e950b8f; review NOT SATISFIED (0/1/6), AU78 major: motif tonic held over I maj9; fix pass launched.
- 2026-11-16 R1 fix pass DONE (AU78: 6/9 voicings, clash check in build). Built: 5 cues, audio 13.87 MB of 14 (13866695 B), lead minus bed -2.9 to -3.6 LU. Verified (1581 tests); reel R1 sent; step listen.
- 2026-11-16 Julien heard R1: notes, no yes (droning sustained piano chords on 4 loops; likes track 1 and the swung hats). Notes round 1 launched.
