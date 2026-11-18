# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.19
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.18-r3           # label of the last screenshot set that passed verify
codecritic_range_start: 203430f
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: partial  E3: carried  T2: done  A2: carried  V2: partial
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.18/review-r3-critic.md (r3 NOT SATISFIED; bug 0 major 0 minor 6; E2 U1 S3; D512 D514 D481 D493 D495 D505 carry)
  code:   docs/build/v5.18/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 2 low 26; E15 U4 S5 N3 A1)
  story:  docs/build/v5.18/review-r2-story.md (r2 SATISFIED; bug 0 major 0 minor 2; U1 T1; S67 S48 carried)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: T2 Needs: engine heads.ts barkText/nextBark read home BARKS, Boston heads silent (E); Boston shop art reuses home via sceneHood (follow-up card). V2 Needs: layoutOfShop returns plain plan in mirrored shops (jam-overlay, harbour/critic/gameday scenes) -> owner decides, carried to r1. Julien 2026-11-18: verify shoots only fixtures touched this session. seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: v5.19 is outside the 11-13 handoff plan; ask Julien before starting it. v5.18 carried: critic D512 D514 D481 D493 D495 D505 (docs/build/v5.18/review-r3-critic.md); code mediums+lows (review-r3-code.md). D512 needs layers/industrial/jam-overlay.tsx + jam-model.ts pillBox to use viewX0/viewX1 (no card owns them). D514 report strip vs cold guest: Julien decides. Setup: npm ci; pip install playwright==1.63.0.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-18 Fix r1: V2 partial (G111 D511 D515 fixed; D508 D512 D514 partly; D513 A29 not). layoutOfShop mirror: no owner card (V2 lists it read-only) -> ask Julien. Round r2 verify.
- 2026-11-18 Verify r2: tsc pass, 1830/1830, --only 106_t2,140_v2: 0 errors, 13 changed 7 same. r2 re-checks launched.
- 2026-11-18 r2: code APPROVED, story/audio SATISFIED, critic 0/0/9 (minors over gate). Context summarised: session ended, fix round r2 next.
- 2026-11-18 Fix r2 (new session): E3 (E rows) + T2 (T/U/S rows) launched; V2 + V1 next.
- 2026-11-18 Fix r2: E3 blocked, nothing in its files; D493 D495 carried (v5.17 choice / Julien pacing decision). V2 launched.
- 2026-11-18 Fix r2: T2 done (D506 D510; tsc pass, 935 component tests). V1 launched.
- 2026-11-18 Fix r2: V2 partial (D513 fixed; viewX0/viewX1 plumbed). Needs: D512 clamp in layers/industrial/jam-overlay.tsx + jam-model.ts pillBox (no card in scope) -> carried; D514 report strip vs cold guest = decision for Julien, carried.
- 2026-11-18 Fix r2: V1 partial (no new edits; D513 confirmed; D512 D514 as V2 said). Round r3 verify.
- 2026-11-18 Verify r3: tsc pass, 1830/1830, --only 106_t2,140_v2: 0 errors, 7 changed 13 same (loaded/layout need a full run). r3 re-checks launched.
- 2026-11-18 v5.18 closed at r3: critic 0/0/6 minors carried, codecritic APPROVED (medium 2). Next: v5.19 after Julien.
