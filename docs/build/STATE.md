# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: fix                       # setup | waves | verify | review | fix | close
round: r2              # r1 | r2 | r3
last_shots: v5.18-r2           # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: done  E3: done  T2: done  A2: carried  V2: done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.18/review-r2-critic.md (r2 NOT SATISFIED; bug 0 major 0 minor 9; E2 U2 S4 T1; D506 D510 D512-D514 D481 D493 D495 D505)
  code:   docs/build/v5.18/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 23; E14 U5 S2 N3 A1)
  story:  docs/build/v5.18/review-r2-story.md (r2 SATISFIED; bug 0 major 0 minor 2; U1 T1; S67 S48 carried)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: T2 Needs: engine heads.ts barkText/nextBark read home BARKS, Boston heads silent (E); Boston shop art reuses home via sceneHood (follow-up card). V2 Needs: layoutOfShop returns plain plan in mirrored shops (jam-overlay, harbour/critic/gameday scenes) -> owner decides, carried to r1. Julien 2026-11-18: verify shoots only fixtures touched this session. seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: fresh session; read docs/build/sessions/S5-v5.18.md. Fix round r2 (README 4.6): critic r2 minors only (docs/build/v5.18/review-r2-critic.md; owners E2 U2 S4 T1 -> E3/K1, T2/V2, V1/V2, T2), then round r3: verify label v5.18-r3 with --only 106_t2,140_v2 (Julien: only touched fixtures), r3 re-checks critic (sonnet) + codecritic, close. Code r2 APPROVED, story + audio SATISFIED. layoutOfShop mirroring (shot 145): Julien picked option C on 2026-11-18; owned by v5.19 card R1L step 3, not by this round. Setup: npm ci; pip install playwright==1.63.0.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-18 Verify r1: tsc pass, 1768/1768 tests, shots --only 106_t2,140_v2: 0 errors, 20 new (loaded/layout need a full run). Committed; r1 reviews launched.
- 2026-11-18 r1 gate not met (critic 3 bugs 4 major; code 4 high; story S65, audio AU85 majors). Fix round r1: E3 + T2 first, then V2 + A2, then V1.
- 2026-11-18 Fix r1: E3 partial (A35 partly, C141 C144 T108; tsc pass, 1 schema fail = S67 -> T2). K2 K3 K4 -> K1 launched; founderCountdownText rename + schema fail sent to T2.
- 2026-11-18 Fix r1: T2 partial (G110 S66 D506 D507 D509 D510 D516 fixed; tsc pass, 963 tests). G109/S65/S67 heading + C141 callers -> K1. V2 launched (G111, layoutOfShop mirror). Next: A2, V1.
- 2026-11-18 Fix r1: K1 done (K2 K3 K4 A35 C141 C143 C135 C139 U22 G109 S65 T106 T107 C140; tsc pass, 1664 tests). Not fixed, need decision/card: A32-A37 U17 M62 U12 C107 D493 D495 D517 T94 T104. A2 launched (AU85).
- 2026-11-18 Fix r1: A2 done (AU85 AU86 AU87 AU82 U8 C138; tsc pass, 61 audio tests). AU41 native module, AU39 AU40 device pass carried. V1 launched.
- 2026-11-18 Fix r1: V1 partial (M68 U23 U21 T105; D508 already in tree; A29 carried, needs founder-awning.test.ts). tsc red only from V2's unfinished sign-clamp edit. Waiting V2, then verify r2.
- 2026-11-18 Fix r1: V2 partial (G111 D511 D515 fixed; D508 D512 D514 partly; D513 A29 not). layoutOfShop mirror: no owner card (V2 lists it read-only) -> ask Julien. Round r2 verify.
- 2026-11-18 Verify r2: tsc pass, 1830/1830, --only 106_t2,140_v2: 0 errors, 13 changed 7 same. r2 re-checks launched.
- 2026-11-18 r2: code APPROVED, story/audio SATISFIED, critic 0/0/9 (minors over gate). Context summarised: session ended, fix round r2 next.
