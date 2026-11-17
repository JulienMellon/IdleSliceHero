# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.18-seam         # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: done  E3: partial  T2: running  A2: todo  V2: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 4; E2 U1 S1; D481 D493 D495 D505)
  code:   docs/build/v5.17/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 20; E10 U3 S3 N3 A2; M68 A32 medium carried)
  story:  docs/build/v5.18/review-r0-story.md (see r0b) docs/build/v5.18/review-r0b-story.md (r0b SATISFIED; bug 0 major 0 minor 3; U1 T2; S48 carried for Julien)
  audio:  docs/build/v5.17/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 2; A5; carried AU41 AU39 AU40 AU82 AU25)
open: seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: fresh session; read docs/build/sessions/S5-v5.18.md, resume at wave 3 fix then wave 4. First send E3 (lane E, buildLock in src/engine/game.ts) the T2 crash: Boston save -> "Cannot read properties of undefined (reading 'built')" in buildLock on load (fixture 106_t2, shots 108-117). Shell still home-only (app/index.tsx, shop-ui.tsx, components/layers/**, app/scrapbook.tsx) = K1 leftovers: route per OWNERS. Then finish T2 step 6, then A2 + V2.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-17 W3 pass 1 done (S49-S62 fixed; S48 U-owned, carried for Julien). Needs: next city name; props pretzel, phone (T2). Re-check r0b story (sonnet) launched.
- 2026-11-17 K1 fixture fix done (90_t1b SCENES_DIR; tsc + 1650 tests). Seam shots re-run v5.18-seam.
- 2026-11-17 r0b story re-check SATISFIED (S49-S62 fixed; new minors S63 S64 -> W3 pass 2 of 2; S48 carried).
- 2026-11-17 W3 pass 2 done (S63 S64). Script final; S48 carried. Wave 2 complete. Waiting seam shots, then wave 3 (E3 + T2).
- 2026-11-17 Seam re-run: True 0 [], layout 0, 0 new, 8 changed: 24/104/105 noise; 29 hud-rewards + 30/30b/31/31b tasks changed (same r2->r3) -> K1 to diagnose (K1 data, V1 frame, or wall clock).
- 2026-11-17 Seam PASS: 29-31b re-shot pixel-identical (load jitter), rest noise. Wave 1 committed. Wave 3 launched: E3 + T2.
- 2026-11-17 T2 partial (steps 1-2: boston data + 32 scenes). Needs: types.ts ids patch + teaser.ts -> sent to E3 (E owns). cutscene-player BackdropProp is T's own. 3 picks taken as defaults, flagged for Julien.
- 2026-11-17 E3 partial: franchise feature + Stars + ceiling 2.4e38; Boston days 0.85/2.04/3.23/4.42/5.45 (finale target 4.8). Sent back: format.ts sci form, migrate by city shops. T2 resumed (types patch in).
- 2026-11-17 E3 done (format sci from 999.5e33; migrate by savedHoods(city) incl. rival.ts; 724 engine/content tests). Waiting T2.
- 2026-11-17 T2 partial (steps 1-5: boston data on BOSTON_NUMBERS, portraits, backdrops, franchise UI, city picker; 106_t2 fixture, shots 108-117 crash on Boston save in buildLock). Wave 3 checks: tsc pass, 1718 tests pass. Session ended early (context), per S5 step 2.
- 2026-11-17 S5 resumed: E3 sent buildLock Boston crash (106_t2); T2 resumed at step 6 + U-lane shell leftovers (index, shop-ui, layers, scrapbook).
- 2026-11-17 E3 partial: buildLock/buildShop city guard + boston-load test; no node_modules -> npm ci run, E3 re-running checks. Cause: audio/director.ts:126 iterates home NEIGHBORHOODS -> A2 (use hoodIds(cityOf)).
