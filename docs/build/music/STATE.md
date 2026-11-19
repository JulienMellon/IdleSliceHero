# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: R2              # R0 | R1 | R2 | done
step: listen           # cards | verify | review | fix | reel | listen
bank: C MuseScore_General_Full.sf3      # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 M1a M1b M1c done; M2a done, M2b done, M2c done
review: docs/build/music/review-R2-audio.md NOT SATISFIED, bugs 0 major 1 (AU85 fixed) minor 10
last_reel: tools/audio/build/reel/FULL.mp3 + R2.mp3 + R1.mp3 (2026-11-19, sent)
heard: R0 → "C"; R1 → "Go"           # round → Julien's verdict in five words
open: M2c extra: encode all music/sting/story at 256 kbps, 24-bit/float renders and source WAVs where the codec allows, under 32 MB; full-score reel for Julien at end of R2 (every cue, full length, 320 kbps, from uncompressed renders if present); growth eval docs/build/music/notes/R1-growth-eval.md awaits Julien (stems need +1.5 MB and src/audio director changes); lead minus bed -1.7 LU on one loop (D5 default is -2 to -4)
next: await Julien on R2 after his playtest (positive, not yet a yes): "go" runs card-CLOSE (section 13); notes → notes round; open AU83 delay decision
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-16 M0 DONE. Built: 0 cues shipped, audio 13.28 MB of 14 unchanged, reel R0.mp3 62.85 s. Needs: recommend D (2–5 kHz share 1.9%, sustain ratio 0.59); D licence notes uncertain sample origin.
- 2026-11-16 R0 verified (jest src\/audio 53 pass, assets\/audio + src untouched); reel sent; step listen.
- 2026-11-16 Julien heard R0: "C". Round R1 started; M1a launched.
- 2026-11-16 M1a DONE. Built: 2 cues (downtown, downtown_sparse), audio 13.37 MB of 14, full build pass on bank C. Needs: fetch_bank.sh needs bash; all cues re-rendered through bank C (large diff, expected).
- 2026-11-16 M1b DONE. Built: 3 loops plus 37 stingers, audio 13.87 MB of 14, full build pass. Needs: nothing (note: Suburbs walking bass also under the march; a stray full build wiped assets, restored, sfx checked out again).
- 2026-11-16 M1c DONE. Built: 8 loops, audio 13.87 MB of 14 (13867227 B), full build pass, lead minus bed -3.0 to -3.6 LU. Needs: nothing (judgement calls: HQ motif twice per loop; Industrial lead vibes then flute).
- 2026-11-16 R1 verified and committed e950b8f; review NOT SATISFIED (0/1/6), AU78 major: motif tonic held over I maj9; fix pass launched.
- 2026-11-16 R1 fix pass DONE (AU78: 6/9 voicings, clash check in build). Built: 5 cues, audio 13.87 MB of 14 (13866695 B), lead minus bed -2.9 to -3.6 LU. Verified (1581 tests); reel R1 sent; step listen.
- 2026-11-16 Julien heard R1: notes, no yes (droning sustained piano chords on tracks 2, 4, 5; track 3 comping too busy; asks to evaluate music that builds as the restaurant grows). Notes round 1 launched.
- 2026-11-16 Notes round 1 DONE. Built: 8 loops, audio 13877074 B of 14680064, chord overlaps 0 on 6 loops (University 2, melody grace notes), lead minus bed -1.7 to -3.2 LU. Verified (1581 tests); reel R1 sent; step listen. Needs: growth eval choice (trim loops ~20 s or raise cap; director changes outside lane).
- 2026-11-19 Notes round 2 DONE (crisper: 2-3 note Rhodes voicings, half reverb, quarter chorus, 128 kbps loops; cap raised to 25 MB per Julien). Built: 8 loops, audio 17099115 B of 26214400, lead minus bed -1.2 to -3.1 LU. Verified (2501 tests); reel R1 sent; step listen.
- 2026-11-19 M2a DONE. Built: 73 stingers, audio 17077484 B of 32 MB, all within 0.3 s of old length. Needs: Julien — Waterfront/Industrial tags dom9 not maj9; warm-pad tail rings out plucked tags.
- 2026-11-19 M2b DONE. Built: 6 triumphs + city theme, payoffs within 0.25 s, audio 17073549 B of 32 MB. Needs: city_theme one ii-V-I per bar (kept payoff); AUDIO.md/AUDIOLOG stale (M2c).
- 2026-11-19 M2c DONE. Built: 153 cues, 256 kbps, float masters, FULL reel 1302 s; audio 33240658 B of 33554432 (0.3 MiB margin). Verified (2501 tests). Review next.
- 2026-11-19 R2 fix pass DONE (AU85/86 6/9 arrivals, hierarchy gaps >=0.3 LU). Audio 33249842 B of 33554432. Verified (2501 tests). Reels FULL/R2/R1 sent; step listen.
