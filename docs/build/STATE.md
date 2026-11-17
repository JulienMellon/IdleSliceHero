# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: verify                    # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.17-r3           # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: partial  W3: done  V1: done  E3: todo  T2: todo  A2: todo  V2: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 4; E2 U1 S1; D481 D493 D495 D505)
  code:   docs/build/v5.17/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 20; E10 U3 S3 N3 A2; M68 A32 medium carried)
  story:  docs/build/v5.18/review-r0-story.md (r0 NOT SATISFIED; bug 0 major 2 minor 13; U1 T14)
  audio:  docs/build/v5.17/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 2; A5; carried AU41 AU39 AU40 AU82 AU25)
open: seam-noise shots 00/24/104/105 (install id + title rays unpinned in fixtures). v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: S5-v5.18.md: seam verify v5.18-seam running + r0 story doc review; then wave 3 (E3 + T2; K1 leftovers as extra), V1 Needs to V2 as extra
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-17 02:07 UTC v5.17 closed: r3 critic SATISFIED (4 minors carry), code APPROVED (r2), audio SATISFIED (r2). Next v5.18.
- 2026-11-17 S5 start: v5.18 wave 1 launched (K1 programmer, W3 writer).
- 2026-11-17 W3 done (docs/story/BOSTON-SCRIPT.md, 32 scenes). Writer asks: confirm speaker name 'Kayla Dunn'; next city unnamed. K1 running.
- 2026-11-17 K1 partial: built, no behaviour change claimed; real jest not run (node_modules was absent -> npm ci). Needs (out of scope, home-only): .hood fields in content/layers.ts + ~15 component sites; shop-only helpers on home fit tables; ORDER_CAST, endgame events, NIGHT_OVEN, tutorial copy, audio director, art ids. V1 launched.
- 2026-11-17 K1 tree: tsc clean, 1633 tests pass (real jest).
- 2026-11-17 V1 done (frame + scroll container, 17 new tests). Needs for V2: thread frame through ~200 P() calls or translate by (width-393)/2; widen Backdrop art, clouds, rival-shop position. Seam verify v5.18-seam started (APP_VERSION left at 5.17 so shots compare).
- 2026-11-17 Seam v5.18-seam FAIL: tsc + 1650 tests pass, layout 0 new; fixture 90_t1b broke on moved scene path (11 shots removed) -> K1; 4 changed (00 title, 24/104/105 settings, ~0.4%) -> V1 to diagnose. r0 storycritic hit the usage limit, resumed. pip playwright 1.63.0 needed for screenshots.py.
- 2026-11-17 r0 story (script doc): NOT SATISFIED, major 2 (S49 S50) minor 13; Kayla Dunn approved. Sent to W3 writer, pass 1 of 2.
- 2026-11-17 Seam: the 4 changed shots (00, 24, 104, 105) also differ v5.17-r2 -> r3 (random install id + title ray animation): noise, not the seam. Fixture to pin them is a later-card item. Waiting on K1 for fixture 90_t1b, then re-run shots.
- 2026-11-17 W3 pass 1 done (S49-S62 fixed; S48 U-owned, carried for Julien). Needs: next city name; props pretzel, phone (T2). Re-check r0b story (sonnet) launched.
