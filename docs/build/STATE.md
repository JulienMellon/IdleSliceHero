# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.23b                  # v5.23 closed 2026-11-22 at r3 (critic 0 bug 0 major 21 minor carried; code APPROVED 3 medium; story advisory 9 minor)
step: waves                         # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.23-r3                # v5.23 r3 verify: True 0 [], layout 0 new; 16 changed vs v5.23-r2
codecritic_range_start: 688f26f   # v5.23b start (v5.23 closed commit)
cards:                 # todo | running | done | partial | blocked
  Q7 todo  Q8 todo  S6 done  U7 running  U8 done  W6 done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.23/review-r3-critic.md (r3 NOT SATISFIED; bug 0 major 0 minor 21; E3 U12 S4 T1 N1)
  code:   docs/build/v5.23/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 3 low 29; E5 U16 S2 N8 A1; C192 A46 A44 medium)
  story:  docs/build/v5.23/review-r3-story.md (r3 NOT SATISFIED advisory; bug 0 major 0 minor 9; E1 U2 T6; S103 S104 fixed)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S10b-v5.23b.md (cleanup step), then S11-v5.24.md. Carried notes: docs/build/v5.23/review-r3-{critic,code,story}.md open-notes tables (critic 21 minor; code C192 A46 A44 medium; story 9 minor; C179 A45 need a card owning game.ts + content/service.ts / city-model.ts). Ask Julien: offline earnings ignore paid boosts; periodic free gifts (one early) to plan; splash_theme not wired (U card); 3 shop SFX unheard. Starter Pack App Store Connect description = 400 diamonds is on LAUNCH-TRACK.md.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-22 S10 r2 verify v5.23-r2 PASS (True 0 [], layout 0). r2 re-checks launched.
- 2026-11-22 S10 gate r2 not met (critic 0 bug 0 major 22 minor; code APPROVED 2 medium). Fix round r3: U5 || N1, then E5 || E6, then W4.
- 2026-11-22 S10 r3 U5 done (C190). E5 launched.
- 2026-11-22 S10 r3 E5 done (no rows in its files; C179 A45 need a card owning game.ts + content/service.ts / city-model.ts, carried). E6 launched.
- 2026-11-22 S10 r3 N1 done (D569 C188 C189; 3093 tests). D570 decided per VERSION default: keep the pace chip. W4 launched.
- 2026-11-22 S10 r3 W4 done (S103 S104) -> N1 puts them into store.ts.
- 2026-11-22 S10 r3 N1 copy landed (S103 S104; 3093 tests). Waiting on E6.
- 2026-11-22 S10 r3 E6 done (C191 T133 D567; 3096 tests). r3 verify v5.23-r3 running.
- 2026-11-22 S10 r3 verify v5.23-r3 PASS (True 0 [], layout 0, 16 changed). r3 re-checks launched.
- 2026-11-22 S10 v5.23 closed at r3 (critic minors only, code APPROVED). STATE -> v5.23b per VERSION.md close line (Julien 2026-11-22).
- 2026-11-22 S10b r1 wave 1 launched (W6 || S6).
- 2026-11-22 S10b r1 W6 done (COPY-v5.23b.md, 9 rows). Waiting on S6.
- 2026-11-22 S10b r1 S6 done (D481 D552 D557; D519 needs projection.ts) -> VERSION default sent back. U8 launched.
- 2026-11-22 Julien: D519 allow scrolling (no scale-down). Scroll cue for cut-off wide shops -> U7.
- 2026-11-22 S10b r1 S6 done (D481 D552 D557; D519 scrolls per Julien). U7 launched with the scroll-cue need.
- 2026-11-22 S10b r1 U8 done (D537 D542 D544 D545 D547 D555; D535 D538 already in) -> 4 T copy files granted; D540 -> U7.
- 2026-11-22 S10b r1 U8 done (S95 x2 S71 landed; S67 carried: downtown backdrop not allowed in Boston pack, needs backdrop decision). Waiting on U7.
