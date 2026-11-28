# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.25                   # v5.24 closed 2026-11-27 at r3 (critic 0 bug 0 major 6 minor carried; code APPROVED 1 medium U40; story advisory 9 minor)
step: waves                         # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.24-r3                # r3 verify: True 0 [], layout 0 new; 7 changed vs v5.24-r2
codecritic_range_start: afa3189   # v5.25 start (v5.24 closed commit)
cards:                 # todo | running | done | partial | blocked
  E8 partial | N3 done | E10 done | W6 done | E9 running | S6 running | S7 todo | T3 todo | U7 todo | A6 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.24/review-r3-critic.md (r3 NOT SATISFIED, minors only -> close; bug 0 major 0 minor 6; E1 U2 S2 N1; D577 D586 D572 D573 D564 D570 carried)
  code:   docs/build/v5.24/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 1 low 33; E6 U16 S4 N7 A1; U40 carried)
  story:  docs/build/v5.24/review-r1-story.md (r1 NOT SATISFIED advisory; bug 0 major 0 minor 9; E1 U4 T4)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: Julien 2026-11-23: things may cover the WELCOME mat transiently (protected check: only static/parked elements count); scrolling wide shops are fine, no scroll cue needed. ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. Economy refit and pacing: now v5.25 (docs/build/v5.25/VERSION.md, Julien 2026-11-28; ECONOMY 4 full reset, hood ladder 20K-1.5M, shop renovation, free gifts). Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D505 D512 D514 (D493 D495 owned by v5.25 E8/E9). Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start docs/build/sessions/S13-v5.25.md (wave 1: E8 || N3). Julien: create diamonds_2600 ($19.99, consumable) in App Store Connect and RevenueCat before v5.24 ships; after v5.25 paste N3's Starter Pack description into App Store Connect.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-27 S11 gate r2 not met (critic 11 minor; code APPROVED). Fix round r3: E7 || U6, then S4 || N2, then S5. After r3: close (minors carry) unless a bug/major appears.
- 2026-11-27 S11 r3 E7 done (no change; C203 low carried, needs S5 test edit). S4 launched; U6 running.
- 2026-11-27 S11 r3 U6 done (C205, C192 half 1; 3521 tests). N2 launched (C192 half 2); S4 running.
- 2026-11-27 S11 r3 N2 done (C192 fixed in code). crowd chime test red mid-S4 edit; waiting on S4.
- 2026-11-27 S11 r3 S4 done (D579; 3521 tests green). S5 launched.
- 2026-11-27 S11 r3 S5 done (D577 D580 D585 C206 T145 C203). Verify v5.24-r3 running.
- 2026-11-27 S11 r3 verify v5.24-r3 PASS (True 0 [], layout 0, 7 changed). r3 re-checks launched.
- 2026-11-27 S11 gate r3: critic 6 minor (no bug/major), code APPROVED. v5.24 closed at r3; catalog 41 looks / 5,760 diamonds. STATE -> v5.25.
- 2026-11-28 S12 planning: STATE step waves -> setup (VERSION.md says setup; v5.25 cards written with Julien). PR #47 merged.
- 2026-11-28 S12 planning: v5.25 scoped with Julien (full reset, ladder 20K/80K/200K/500K/1.5M, renovation x2-x4, 7-day city, gifts, offline boosts, splash_theme, ShopEars SFX, Starter Pack retune, whole numbers). 10 cards written; STATE -> waves r1.
- 2026-11-28 S13 wave 1 launched: E8 || N3.
- 2026-11-28 S13 N3 partial (Needs: offers.ts applyGrant cash -> routed to E8; STARTER_CASH 7000 placeholder). ASC description: "Nonna's Starter Pack: about $7K in cash, 400 diamonds and 2x income for 30 minutes, plus the Founder awning. One per player."
- 2026-11-28 S13 E8 partial (D495 fixed; Suburbs 19.8 min; gap 6.7 min; costs 1e11-1e20 past Waterfront). Resumed E8: lower income potential, scale takeover rewards, add Downtown beat(s), update reset test data; N3 applyGrant cash done by E8; STARTER_CASH 7000 kept.
- 2026-11-28 S13 wave 1 end: E8 partial again (tests 3589 green, tsc pass; flat ladder past Waterfront not held, gap 6.7 min, takeover reward $540K). Asking Julien how to proceed.
- 2026-11-28 S13 Julien: fold E8 retune into E10. Wave 2 E10 launched.
- 2026-11-28 S13 E10 partial (renovation + retune done; ladder 20.5 min/0.68/0.85/4.25/4.77, finale 6.98 d; old-shop low 18.7%; 7 test files red -> E10 resumed). W6 launched (+ interludes for 3-min gap).
- 2026-11-28 S13 E10 done (193 suites / 3617 tests green). Waiting on W6.
- 2026-11-28 S13 W6 done (COPY-v5.25.md; 4 interludes). Wave 2 end. Wave 3 E9 || S6 launched.
