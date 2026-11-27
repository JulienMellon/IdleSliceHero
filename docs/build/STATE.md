# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.24                   # v5.23b closed 2026-11-23 at r2 (critic SATISFIED 0 bug 0 major 6 minor carried; code APPROVED 1 medium; story advisory 5 minor)
step: fix                           # setup | waves | verify | review | fix | close
round: r3              # r1 | r2 | r3
last_shots: v5.24-r2                # r2 verify: True 0 [], layout 0 new; 2 new 160 changed 1 noted vs v5.24
codecritic_range_start: 04b0abf   # v5.24 start (v5.23b closed commit)
cards:                 # todo | running | done | partial | blocked
  E7 done  W5 done  S4 done  N2 done  S5 done  U6 done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.24/review-r2-critic.md (r2 NOT SATISFIED; bug 0 major 0 minor 11; E3 U3 S6 N1; minors only)
  code:   docs/build/v5.24/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 33; E7 U17 S4 N8 A1)
  story:  docs/build/v5.24/review-r1-story.md (r1 NOT SATISFIED advisory; bug 0 major 0 minor 9; E1 U4 T4)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: Julien 2026-11-23: things may cover the WELCOME mat transiently (protected check: only static/parked elements count); scrolling wide shops are fine, no scroll cue needed. ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S11-v5.24.md. Carried notes: docs/build/v5.23b/review-r2-{critic,code}.md and review-r1-story.md open-notes tables (critic: D571 and D519 CLOSED by Julien 2026-11-23, D572 van behind rival sign still open; code 1 medium; story 5 minor; C179 A45 need a card owning game.ts + content/service.ts / city-model.ts; C196 game-store resetMissedZeroSeen; D564 goal bar word suffix overflow; S97 3 fixtures; S67: Julien 2026-11-23 says create a Boston backdrop for boston-0 panel 1 if Boston has none -> needs an S/scene card in v5.24). Ask Julien: offline earnings ignore paid boosts; periodic free gifts (one early) to plan; splash_theme not wired (U card); 3 shop SFX unheard; Starter Pack App Store Connect description = 400 diamonds is on LAUNCH-TRACK.md.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-23 S10b r1 U7 134 clip fixed; strip-over-mat: decided strip at scene top for unmanaged shops (default: mat never covered), U7 scope widened to index.tsx strip line, strip-clear.ts, protected.ts.
- 2026-11-23 S10b r1 U7 strip fix done (cover allowlist entry removed; 3215 tests). Heads-up: order chip may overlap unmanaged strip top band. Verify v5.23b running.
- 2026-11-23 S10b r1 verify v5.23b PASS (True 0 [], layout 0 new, cover 0, 169 changed). r1 reviews launched.
- 2026-11-23 S10b gate r1 not met (critic 7 minor; code CHANGES REQUESTED 5 medium). Fix round r2: U7 || U8 (+E rows), then S6.
- 2026-11-23 S10b r2 U8 done (C195 A44 A46 C193 S89 +tests; 3228 tests). D564 (goal bar word suffix overflow) and S97 (3 fixtures) carried. S6 launched.
- 2026-11-23 S10b r2 U7 done (C194 T139 D556 C196 comment; 3229 tests). Carried: C196 game-store resetMissedZeroSeen, D573, D519 cue, C176. Waiting on S6.
- 2026-11-23 S10b r2 S6 done (D571 D572 C197 C198 C183; 3229 tests). Verify v5.23b-r2 running.
- 2026-11-23 S10b r2 verify v5.23b-r2 PASS (True 0 [], layout 0, cover 0, 64 changed). r2 re-checks launched.
- 2026-11-23 S10b gate r2 met (critic SATISFIED, code APPROVED). v5.23b closed at r2. STATE -> v5.24.
- 2026-11-23 Julien: mat may be covered transiently (D571 closed); wide shops scroll, no cue (D519 closed); create a Boston backdrop for S67.
- 2026-11-27 S11 r1 wave 1: E7 launched (W5 waits for catalog.md). P=v5.23b-r2 (STATE last_shots, per S11).
- 2026-11-27 S11 r1 catalog.md written; W5 launched alongside E7.
- 2026-11-27 S11 r1 W5 done (COPY-v5.24.md). Speaker-before-hire routed to U6 in WAVE-NOTES. Waiting on E7.
- 2026-11-27 S11 r1 E7 done (41 looks / 5,760 diamonds; SAVE_VERSION 10). snapshots regenerated by orchestrator. Needs routed in WAVE-NOTES (S4, U6, S5).
- 2026-11-27 S11 r1 wave 1 committed 91384a1 (3289 tests). Wave 2 S4 || N2 launched.
- 2026-11-27 S11 r1 N2 done (3290 tests; bestRate skips unpriced packs, accepted; cart art Unverified). Waiting on S4.
- 2026-11-27 S11 r1 S4 done (3486 tests). Unverified: tip jar hidden by bag pile/spill, Downtown aprons, Waterfront plank anchor, sign-dockside reads neon; N2 cart art. Wave 2 check running.
- 2026-11-27 S11 r1 wave 2 committed e3162cb (3486 tests). Wave 3 S5 || U6 launched.
- 2026-11-27 S11 r1 U6 done (in scope; 3 E-lane needs sent to E7 resumed). Unverified: all-owned and half-set tab states. Waiting on S5, E7.
- 2026-11-27 S11 r1 S5 done. Unverified: Dorm set (228), jar urn, gear chime, hazard apron, cork menu, plaid cloths, purple scooter, S5 thumbnails, flourish bubble width at 40+ chars. Waiting on E7 follow-up.
- 2026-11-27 S11 r1 E7 follow-up done (3512 tests). All cards done. Verify v5.24 running.
- 2026-11-27 S11 r1 verify v5.24 FAIL: 1 error 205_n1 starter-rate (sent to N2); layout 0 new.
- 2026-11-27 S11 r1 verify v5.24 PASS (True 0 [], layout 0, 11 new 10 changed). r1 reviews launched.
- 2026-11-27 S11 gate r1 not met (critic bug 1 major 2 minor 17; code 1 high 2 medium). Fix round r2: E7 || U6, then S4 || N2, then S5. A row (code, 1 low) has no fix lane: carried.
- 2026-11-27 S11 r2 E7 done (D574 T143; 3515 tests; D574 Unverified; S106 oven names need T). S4 launched (U6 still running).
- 2026-11-27 S11 r2 U6 done (C204 D582 D583 S107 S108; ignored U40 index.tsx outside card). N2 launched (S4 running).
- 2026-11-27 S11 r2 S4 done (D575 D576 D578 D579 D581; 3516 tests; D580 to S5). S5 launched (C202 first); N2 running.
- 2026-11-27 S11 r2 N2 done (G123 D584; 3516 tests; C192 half, route in WAVE-NOTES, carried). Waiting on S5.
- 2026-11-27 S11 r2 S5 done (C202 M77 M78 U41 D585 D580 D577 T142 T144; C203 half; C202 Unverified in shot). founder-awning test fix sent to N2.
- 2026-11-27 S11 r2 fixes done (3520 tests). Verify v5.24-r2 running.
- 2026-11-27 S11 r2 verify v5.24-r2 PASS (True 0 [], layout 0, 160 changed). r2 re-checks launched (critic, code; story advisory had no majors, carried).
- 2026-11-27 S11 r2 critic: 0 bug 0 major 11 minor (lists D571 D519 open though Julien closed them 2026-11-23). Waiting on codecritic.
- 2026-11-27 S11 gate r2 not met (critic 11 minor; code APPROVED). Fix round r3: E7 || U6, then S4 || N2, then S5. After r3: close (minors carry) unless a bug/major appears.
- 2026-11-27 S11 r3 E7 done (no change; C203 low carried, needs S5 test edit). S4 launched; U6 running.
- 2026-11-27 S11 r3 U6 done (C205, C192 half 1; 3521 tests). N2 launched (C192 half 2); S4 running.
- 2026-11-27 S11 r3 N2 done (C192 fixed in code). crowd chime test red mid-S4 edit; waiting on S4.
- 2026-11-27 S11 r3 S4 done (D579; 3521 tests green). S5 launched.
