# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.20                   # scope: Julien's call (later/README.md lists candidates); v5.19 closed 2026-11-19
step: waves                      # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.19-r2             # verify r2: 47 changed (~3.3%: R1L far kerb D481, night tint 85), 3 noted; True 0 [], layout 0
codecritic_range_start: eafbb5a
cards:                 # todo | running | done | partial | blocked
  R0: done  R0p: done  R1: done  R6: done  R1L: done  R5c: done  R7a: done  R7b: done   # r2 fix: R1 R6 R1L R0 R7a R7b R5c
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.19/review-r2-critic.md (r2 SATISFIED; bug 0 major 0 minor 4 incl. D493 D495 parked; E2 S2)
  code:   docs/build/v5.19/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 1 low 6; E1 U3 S3; C156 open)
  story:  docs/build/v5.18/review-r2-story.md (r2 SATISFIED; bug 0 major 0 minor 2; U1 T1; S67 S48 carried)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: wait for Julien to set v5.20 scope and write docs/build/v5.20/VERSION.md. Carried from v5.19: C156 (Boston North End milestones speak as Nonna after founderHood removal; storefront.tsx/ladder.ts), C151 C153 M69 (no v5.19 card owned the files), D481 (reduced) D519, home-ids guard ALLOW 9 (report-strip, city-map need P6).
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-18 Fix r4: A2 U8 fixed (director trackNow memo; 1919 tests). A2 card itself still carried (music STATE round R1).
- 2026-11-18 Fix r4: V2 done (D512 D514 lift+frost C149 U25 A29 U21 T110; D481 already in HEAD; 45 strip-clear tests). Leftovers sent to V2: shop-ui piesToGo, storefront A37, layer-stack D505.
- 2026-11-18 Fix r4 closed: V2 leftovers done (C137 shop-ui, A37 storefront, D505 layer-stack; 146 shot frost ok). tsc pass, 1919/1919.
- 2026-11-18 Julien decisions: D493 gate rival until Suburbs 2 stars; hire-stack walkers behind strip stay (closed); D495 refit first goal <$50 AND start with one pizza at a time not four, slow money velocity overall (cost estimate asked); v5.19: write VERSION.md + cards for approval first.
- 2026-11-18 Julien (E4 inputs): pacing minutes unchanged; compress nominal $ so home city tops out ~$10M (Suburbs open ~$30K); first goal <$50; tap batch 1 then +1 per 10 prep levels; ECONOMY 3->4, old saves reset. Next: write v5.19 VERSION.md + cards for approval.
- 2026-11-18 Julien (v5.19 scope): E4 economy + D493 rival gate + A2 audio (after music round) + next city pack + carried audio notes (AU41 AU39 AU40 AU25 AU82, SliceAudioSession). Boston GMs stay placeholder; North End 2 takeover gate set by E4 refit; Boston shop art later; city/day-30 names not in v5.19. Device check not in v5.19.
- 2026-11-18 Found the committed v5.19 plan (3 cities, showdown, refactor), which conflicts with today's scope answers. Julien: save the merge decision for the next orchestration session.
- 2026-11-18 v5.19 plan check (new session): cards checked against R0-R6s; E4 split (E4f fits after the packs), A2 gated on music round, waves 7-12 reordered (3 same-file clashes). v5.18 already closed, STEP 2 has nothing left. Waiting for Julien.
- 2026-11-18 Julien: hold every city beyond Boston; v5.19 = city is only a content pack. VERSION.md rewritten (R0 R0p R1 R6 R1L R5c + new R7a R7b); held and deferred cards moved to v5.19/later/. Next: wave 0.

- 2026-11-19 v5.19 waves 0-7 done (R0 R0p R1 R6 R1L R5c R7a R7b; dev deps eslint/prettier approved by Julien). Verify: True 0 [], layout 0, 9 changed = seam 00 24 104 105 + R1L 145 86 86b 76 + 116 (open). Pack guard ALLOW 0. Session ended by Julien before reviews.
- 2026-11-19 116 bisect: eafbb5a, R0, R0p all give the new 116 (deterministic) -> baseline flake; v5.19-base 116 re-shot at eafbb5a. review_shots: 8 changed (seam + R1L only), gate met.
- 2026-11-19 Fix r2 done: R1 (C150 C152 A39 T111-T113), R1L (D518 D481 U26 C155 C154), R0 (A38), R5c (A40); R6 R7a R7b no rows. C151 C153 M69 carry (no v5.19 card owns the files). tsc pass, 2501/2501.
- 2026-11-19 v5.19 closed at r2: critic SATISFIED (minor 4, D493 D495 parked), codecritic APPROVED (medium 1: C156). Pack guard ALLOW 0. Pack contract: src/content/cities/README.md.
