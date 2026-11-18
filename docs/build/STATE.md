# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.18-seam         # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: done  E3: done  T2: running  A2: carried  V2: done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 4; E2 U1 S1; D481 D493 D495 D505)
  code:   docs/build/v5.17/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 20; E10 U3 S3 N3 A2; M68 A32 medium carried)
  story:  docs/build/v5.18/review-r0-story.md (see r0b) docs/build/v5.18/review-r0b-story.md (r0b SATISFIED; bug 0 major 0 minor 3; U1 T2; S48 carried for Julien)
  audio:  docs/build/v5.17/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 2; A5; carried AU41 AU39 AU40 AU82 AU25)
open: V2 Needs: layoutOfShop returns plain plan in mirrored shops (jam-overlay, harbour/critic/gameday scenes) -> owner decides, carried to r1. Julien 2026-11-18: verify shoots only fixtures touched this session. seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: fresh session; read docs/build/sessions/S5-v5.18.md, resume wave 4 fixes (agents hit 5h limit). tsc pass, 2 fails shift-model.test.ts footprint 3/4 (D484) -> V2 (resume: night tint cut-out must follow wide frame; steps 1-7 done). T2 step 6: 106_t2 Boston load "reading 'name'" (shots 108-115,117 missing) -> T2 resume, find pageerror stack. A2 carried to v5.19 (Julien). Then verify r1 (label v5.18), commit, r1 reviews. Setup: npm ci; pip install playwright==1.63.0 (uses /opt/pw-browsers).
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
- 2026-11-17 E3 fix verified: tsc pass, 1721 tests pass, boston-load test. pip playwright 1.63.0 installed (uses /opt/pw-browsers); E3 running 106_t2 fixture.
- 2026-11-17 E3 done (buildLock guard; 106_t2 no longer 'built'). Boston load still blank: audio musicFor/director (-> A2, launched) + report-model.ts:86 home MANAGERS (U -> T2 sent).
- 2026-11-17 A2 partial: Boston audio fix (audioHood, director hoodIds, fallback; tsc + 60 audio tests). Steps 1-6 blocked: docs/build/music/STATE.md round R1, needs done -> asked Julien. V2 launched.
- 2026-11-17 Julien: A2 steps carried to v5.19 (music STATE R1); Boston uses home stand-in tracks.
- 2026-11-17 Restart. T2 partial (shell city-aware, report-model fixed; step 6 open: 106_t2 Boston load "reading 'name'"). V2 steps 1-6 done (140_v2, tiers 1-3 pixel-identical). tsc pass; 2 fails shift-model.test.ts footprint 3/4 (D484) -> V2. Relaunched T2 + V2.
- 2026-11-17 Both relaunched agents hit the 5h limit; session ended. WIP committed (tsc pass, 1764/1766 tests).
- 2026-11-18 S5 resumed (npm ci, playwright, tsc pass). Relaunched T2 (step 6) + V2 (night tint, D484).
- 2026-11-18 V2 done (night tint follows wide/mirrored frame; D484 fixed; tsc pass, 911 component tests). Waiting T2.
