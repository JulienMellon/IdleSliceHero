# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: R1              # R0 | R1 | R2 | done
step: listen           # cards | verify | review | fix | reel | listen
bank: C MuseScore_General_Full.sf3      # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 done, M1a done, M1b done, M1c done
review: docs/build/music/review-R1-audio.md NOT SATISFIED, bugs 0 major 1 (AU78 fixed) minor 6 open (AU79-AU84), next ID AU85
last_reel: tools/audio/build/reel/R1.mp3 (2026-11-19, notes round 3, sent)
heard: R0 → "C"           # round → Julien's verdict in five words
open: growth eval docs/build/music/notes/R1-growth-eval.md awaits Julien; Rhodes swap A-D (tools/audio/swap_reel.py) awaits pick; city motif AU16 gone from loops (stingers keep it); kit jitter re-rolled (per-track seed would change stingers); banks kept (C), CC-BY sources allowed if revisited
next: await Julien (after notes round 3 of R1): do the new themes and phrasing work, loops relaxing? "go" starts R2; more notes = notes round 4
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-16 M1b DONE. Built: 3 loops plus 37 stingers, audio 13.87 MB of 14, full build pass. Needs: nothing (note: Suburbs walking bass also under the march; a stray full build wiped assets, restored, sfx checked out again).
- 2026-11-16 M1c DONE. Built: 8 loops, audio 13.87 MB of 14 (13867227 B), full build pass, lead minus bed -3.0 to -3.6 LU. Needs: nothing (judgement calls: HQ motif twice per loop; Industrial lead vibes then flute).
- 2026-11-16 R1 verified and committed e950b8f; review NOT SATISFIED (0/1/6), AU78 major: motif tonic held over I maj9; fix pass launched.
- 2026-11-16 R1 fix pass DONE (AU78: 6/9 voicings, clash check in build). Built: 5 cues, audio 13.87 MB of 14 (13866695 B), lead minus bed -2.9 to -3.6 LU. Verified (1581 tests); reel R1 sent; step listen.
- 2026-11-16 Julien heard R1: notes, no yes (droning sustained piano chords on tracks 2, 4, 5; track 3 comping too busy; asks to evaluate music that builds as the restaurant grows). Notes round 1 launched.
- 2026-11-16 Notes round 1 DONE. Built: 8 loops, audio 13877074 B of 14680064, chord overlaps 0 on 6 loops (University 2, melody grace notes), lead minus bed -1.7 to -3.2 LU. Verified (1581 tests); reel R1 sent; step listen. Needs: growth eval choice (trim loops ~20 s or raise cap; director changes outside lane).
- 2026-11-19 Julien heard R1 notes round 1: notes, no yes (more articulate timbre, less smearing, cap to 20 MB allowed). Notes round 2 launched.
- 2026-11-19 Notes round 2 DONE. Built: 8 loops (notes 0.75 length, CC72 release, half reverb, 144 kbps), audio 18586494 B of 20971520 (cap raised in logic.test.ts), lead minus bed -1.4 to -3.9 LU. Verified (2501 tests); reel R1 sent; step listen. Needs: loop peaks at -6 dBFS ceiling; stingers/story not tightened yet.
- 2026-11-19 Julien: solo reel and Rhodes swap reel (A vib, B jazz gtr, C EP2, D damped grand) sent; notes round 3 launched (new themes, phrasing, arrangement; keep drums and bass); keep banks.
- 2026-11-19 Notes round 3 DONE. Built: 8 loops (tools/audio/tunes.py, seven themes), audio 18595860 B of 20971520, lead minus bed -2.5 to -3.3 LU. Verified (157 suites pass); reel R1 sent; step listen. Needs: city motif hint back in loops?; kit jitter seed.
