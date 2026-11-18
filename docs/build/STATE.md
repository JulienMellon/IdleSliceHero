# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.19
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.18-r3           # label of the last screenshot set that passed verify
codecritic_range_start: 21e4057
cards:                 # todo | running | done | partial | blocked
  K1: done  W3: done  V1: partial  E3: carried  T2: done  A2: carried  V2: partial
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.18/review-r3-critic.md (r3 NOT SATISFIED; bug 0 major 0 minor 6; E2 U1 S3; D512 D514 D481 D493 D495 D505 carry)
  code:   docs/build/v5.18/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 2 low 26; E15 U4 S5 N3 A1)
  story:  docs/build/v5.18/review-r2-story.md (r2 SATISFIED; bug 0 major 0 minor 2; U1 T1; S67 S48 carried)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: T2 Needs: engine heads.ts barkText/nextBark read home BARKS, Boston heads silent (E); Boston shop art reuses home via sceneHood (follow-up card). V2 Needs: layoutOfShop returns plain plan in mirrored shops (jam-overlay, harbour/critic/gameday scenes) -> owner decides, carried to r1. Julien 2026-11-18: verify shoots only fixtures touched this session. seam-noise shots 00/24/104/105 (install id + title rays unpinned) and 29-31b (played_page settle() real-time jitter, shots_lib.py ~514). K1 leftovers home-only (.hood fields in content/layers.ts + ~15 components, ORDER_CAST, endgame events, NIGHT_OVEN, tutorial, audio director, art ids). Script: next city unnamed; props pretzel, phone. v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: T2 picks (placeholder Boston GMs; boston-0 p1 'shop' backdrop; takeover gate north-end-2 at 424 pies); S48 layer copy. D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: v5.19 plan check done (W4b W4s E4 CITY A3 fixed for the refactor; E4 split into E4 showdown + E4f fits; A2 added; waves 7-12 reordered). Wait for Julien's go. FIRST ask Julien how to merge his 2026-11-18 decisions (Log, last 4 lines: one pizza per tap +1/10 lv, home city tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 4 with old saves reset, rival gated at Suburbs 2 stars, A2 + carried audio notes, one more city named by the writer) into the committed v5.19 plan (docs/build/v5.19/VERSION.md: Chicago/NY/LA + bible, showdown E4, refactor R0-R6s). Options: amend the plan with an economy card run before the fits / economy-only v5.19 and the plan moves to v5.20 / replace the plan. v5.18 r4 already fixed notes owned by R2 (A33 A36 A37 M62 U12), R5c (C146 C137), R6s (U21 A29), R3 (A34 C148 C134 T104): tick them off. Still carried: D495 (now part of the economy change), A2 (music round R1). Setup: npm ci; pip install playwright==1.63.0.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-18 Fix r4: T2 partial (C146/C137 city-model halves; 1855 tests). Leftovers (founderName export, index.tsx goal cap + C137, D505, C134 C136 C133 T103) -> widened-scope programmer. shop-ui.tsx:71 piesToGo + storefront A37 -> V2 after it reports.
- 2026-11-18 Fix r4: leftover U/N done (C107 bar, C137, D505 endgame banners, C134 C136 C133 T103; 1919 tests). Left for V2: shop-ui.tsx:72 piesToGo, storefront A37, layer-stack wait-for-reveal (D505).
- 2026-11-18 Fix r4: A2 U8 fixed (director trackNow memo; 1919 tests). A2 card itself still carried (music STATE round R1).
- 2026-11-18 Fix r4: V2 done (D512 D514 lift+frost C149 U25 A29 U21 T110; D481 already in HEAD; 45 strip-clear tests). Leftovers sent to V2: shop-ui piesToGo, storefront A37, layer-stack D505.
- 2026-11-18 Fix r4 closed: V2 leftovers done (C137 shop-ui, A37 storefront, D505 layer-stack; 146 shot frost ok). tsc pass, 1919/1919.
- 2026-11-18 Julien decisions: D493 gate rival until Suburbs 2 stars; hire-stack walkers behind strip stay (closed); D495 refit first goal <$50 AND start with one pizza at a time not four, slow money velocity overall (cost estimate asked); v5.19: write VERSION.md + cards for approval first.
- 2026-11-18 Julien (E4 inputs): pacing minutes unchanged; compress nominal $ so home city tops out ~$10M (Suburbs open ~$30K); first goal <$50; tap batch 1 then +1 per 10 prep levels; ECONOMY 3->4, old saves reset. Next: write v5.19 VERSION.md + cards for approval.
- 2026-11-18 Julien (v5.19 scope): E4 economy + D493 rival gate + A2 audio (after music round) + next city pack + carried audio notes (AU41 AU39 AU40 AU25 AU82, SliceAudioSession). Boston GMs stay placeholder; North End 2 takeover gate set by E4 refit; Boston shop art later; city/day-30 names not in v5.19. Device check not in v5.19.
- 2026-11-18 Found the committed v5.19 plan (3 cities, showdown, refactor), which conflicts with today's scope answers. Julien: save the merge decision for the next orchestration session.
- 2026-11-18 v5.19 plan check (new session): cards checked against R0-R6s; E4 split (E4f fits after the packs), A2 gated on music round, waves 7-12 reordered (3 same-file clashes). v5.18 already closed, STEP 2 has nothing left. Waiting for Julien.
