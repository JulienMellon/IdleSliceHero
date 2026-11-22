# STATE — music rewrite

Keep this file under 30 lines. It is the only file the music orchestrator edits by hand.

```
round: done            # R0 | R1 | R2 | done
step: cards            # cards | verify | review | fix | reel | listen
bank: C MuseScore_General_Full.sf3      # letter and file name once Julien picks (R0)
cards:                 # todo | running | done | partial | blocked
  M0 M1a M1b M1c done; M2a done, M2b done, M2c done; NOTES(R2) done; NOTES(R2#2) done; NOTES(R2#3) done; CLOSE done
review: docs/build/music/review-R2-audio.md NOT SATISFIED, bugs 0 major 1 (AU85 fixed) minor 10
last_reel: tools/audio/build/reel/R2.mp3 (2026-11-22, notes round 3, 192 kbps, sent)
heard: R0 → "C"; R1 → "Go"; R2 → "Yes, music go"           # round → Julien's verdict in five words
open: M2c extra: encode all music/sting/story at 256 kbps, 24-bit/float renders and source WAVs where the codec allows, under 32 MB; full-score reel for Julien at end of R2 (every cue, full length, 320 kbps, from uncompressed renders if present); growth eval docs/build/music/notes/R1-growth-eval.md awaits Julien (stems need +1.5 MB and src/audio director changes); lead minus bed -1.7 LU on one loop (D5 default is -2 to -4)
next: card-CLOSE done (Julien said yes to R2). When it reports: verify, commit, set round: done (section 13). Open: splash_theme not wired in src (needs a U-lane card); 28 MiB size guard vs 32 MB cap.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-19 M2a DONE. Built: 73 stingers, audio 17077484 B of 32 MB, all within 0.3 s of old length. Needs: Julien — Waterfront/Industrial tags dom9 not maj9; warm-pad tail rings out plucked tags.
- 2026-11-19 M2b DONE. Built: 6 triumphs + city theme, payoffs within 0.25 s, audio 17073549 B of 32 MB. Needs: city_theme one ii-V-I per bar (kept payoff); AUDIO.md/AUDIOLOG stale (M2c).
- 2026-11-19 M2c DONE. Built: 153 cues, 256 kbps, float masters, FULL reel 1302 s; audio 33240658 B of 33554432 (0.3 MiB margin). Verified (2501 tests). Review next.
- 2026-11-19 R2 fix pass DONE (AU85/86 6/9 arrivals, hierarchy gaps >=0.3 LU). Audio 33249842 B of 33554432. Verified (2501 tests). Reels FULL/R2/R1 sent; step listen.
- 2026-11-22 Julien heard R2: notes, no yes ("only the downtown stinger lands wrong"). Notes round 2 on R2 launched with 192 kbps extra.
- 2026-11-22 Notes round 2 on R2 DONE (Downtown sting ladder -2 LU, others reverted, victor_exit -16, 192 kbps). Built: 136 files, 27787604 B of 32 MiB. Verified (2995 tests). Reel R2 sent; step listen.
- 2026-11-22 Julien heard R2 after notes round 2: notes, no yes (Downtown triumph gap ~0:07 in reel; bank ok; game needs a splash screen theme). Notes round 3 on R2 launched with 192 kbps extra.
- 2026-11-22 Notes round 3 on R2 DONE (triumph_downtown timing 0.0/6.0, new splash_theme -18 LUFS). Audio 28030177 B. Audio tests 61 pass. Reel R2 sent; step listen.
- 2026-11-22 Julien said yes to R2 ("Yes on the music reel music go"). card-CLOSE launched.
- 2026-11-22 card-CLOSE DONE (AUDIOLOG rewritten, archive, AUDIO.md heard lines, A2 prereq). Audio tests pass. round: done.
