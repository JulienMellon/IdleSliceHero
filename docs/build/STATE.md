# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.18-seam         # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: done  E3: running  T2: partial  A2: todo  V2: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 4; E2 U1 S1; D481 D493 D495 D505)
  code:   docs/build/v5.17/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 20; E10 U3 S3 N3 A2; M68 A32 medium carried)
  story:  docs/build/v5.18/review-r0-story.md (see r0b) docs/build/v5.18/review-r0b-story.md (r0b SATISFIED; bug 0 major 0 minor 3; U1 T2; S48 carried for Julien)
  audio:  docs/build/v5.17/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 2; A5; carried AU41 AU39 AU40 AU82 AU25)
open: seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: S5-v5.18.md wave 3 running (E3 + T2); then wave 4 (A2 + V2; V1 Needs to V2), verify v5.18, r1 reviews
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-17 Seam v5.18-seam FAIL: tsc + 1650 tests pass, layout 0 new; fixture 90_t1b broke on moved scene path (11 shots removed) -> K1; 4 changed (00 title, 24/104/105 settings, ~0.4%) -> V1 to diagnose. r0 storycritic hit the usage limit, resumed. pip playwright 1.63.0 needed for screenshots.py.
- 2026-11-17 r0 story (script doc): NOT SATISFIED, major 2 (S49 S50) minor 13; Kayla Dunn approved. Sent to W3 writer, pass 1 of 2.
- 2026-11-17 Seam: the 4 changed shots (00, 24, 104, 105) also differ v5.17-r2 -> r3 (random install id + title ray animation): noise, not the seam. Fixture to pin them is a later-card item. Waiting on K1 for fixture 90_t1b, then re-run shots.
- 2026-11-17 W3 pass 1 done (S49-S62 fixed; S48 U-owned, carried for Julien). Needs: next city name; props pretzel, phone (T2). Re-check r0b story (sonnet) launched.
- 2026-11-17 K1 fixture fix done (90_t1b SCENES_DIR; tsc + 1650 tests). Seam shots re-run v5.18-seam.
- 2026-11-17 r0b story re-check SATISFIED (S49-S62 fixed; new minors S63 S64 -> W3 pass 2 of 2; S48 carried).
- 2026-11-17 W3 pass 2 done (S63 S64). Script final; S48 carried. Wave 2 complete. Waiting seam shots, then wave 3 (E3 + T2).
- 2026-11-17 Seam re-run: True 0 [], layout 0, 0 new, 8 changed: 24/104/105 noise; 29 hud-rewards + 30/30b/31/31b tasks changed (same r2->r3) -> K1 to diagnose (K1 data, V1 frame, or wall clock).
- 2026-11-17 Seam PASS: 29-31b re-shot pixel-identical (load jitter), rest noise. Wave 1 committed. Wave 3 launched: E3 + T2.
- 2026-11-17 T2 partial (steps 1-2: boston data + 32 scenes). Needs: types.ts ids patch + teaser.ts -> sent to E3 (E owns). cutscene-player BackdropProp is T's own. 3 picks taken as defaults, flagged for Julien.
