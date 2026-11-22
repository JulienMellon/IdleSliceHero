# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.22                   # v5.21 r4 fix done 2026-11-22; r4 verify+reviews+close DEFERRED (Julien: cards first)
step: waves                         # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.21-r3                # r3 verify: True 0 [], layout 0 new; 14 new 94 changed vs r2
codecritic_range_start: 12c99bd   # v5.21 start (main at S8 start)
cards:                 # todo | running | done | partial | blocked
  S4 running  E3 todo  W3 todo  U3 todo  S3 todo  U4 todo  E4 todo  A3 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.21/review-r3-critic.md (r3 NOT SATISFIED; bug 1 major 1 minor 13; E4 U9 S2 T1; G118 bug HUD zIndex 2 over sheets/scrim, D543 major night-oven title under HUD; D546 minor lock says Ch 10, Story tab Ch 8)
  code:   docs/build/v5.21/review-r3-code.md (r3 CHANGES REQUESTED; blocker/high 1 medium 2 low 21; E5 U11 S1 N7; K5 high coachLayer zIndex 3 scrim covers OfflinePopup Collect)
  story:  docs/build/v5.21/review-r3-story.md (r3 NOT SATISFIED on minors only; bug 0 major 0 minor 7; E1 U2 T4; advisory, carry)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: S9-v5.22.md waves (Julien 2026-11-22: cards before verify): S4 alone, then E3||W3, U3||S3, U4, E4||A3. DEFERRED v5.21: r4 verify L=v5.21-r4 P=v5.21-r3 (shots never ran: python playwright was missing, now installed), r4 re-checks (PREV=review-r3-*), close v5.21 per README 8. Carry: D546 S87 S89 D530 gift PACING RULE.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-21 S8 r3 U1 done (D532 cash vs price, D541 tick pop + chapter ribbon + toast shot, D536 Go proved 178h2/i/j, S87 Pier 9 short). E2 r3 launched (D530).
- 2026-11-21 S8 r3 fixes done (E2 D530 ribbon via goalCheer, shot 179e; gift needs Julien). 2902/2902, tsc clean, pacing same (downtown-2 +8.9%). Two fix rounds run: session ends before r3 verify.
- 2026-11-21 S8 resumed: deps installed (npm ci, playwright 1.63.0); E1b launched before r3 verify.
- 2026-11-21 S8 E1b done (gate on beat 3 of prior shop; 2917 tests; EAGER max wait 1940.8 vs tuned 1919.8 at uptown-4, so beat 3 kept per acceptance; beat 4 broke 3 pacing tests). Needs index.tsx tasks param -> U1.
- 2026-11-21 S8 r3 U1 done (locked-lot tap opens Story tab, shot 180b; 2918 tests). Verify v5.21-r3 next.
- 2026-11-21 S8 r3 pre-verify: tsc clean, format ok, 2918/2918, pacing same (downtown-2 +8.9%; EAGER max 1940.8 vs tuned 1919.8). Shots v5.21-r3 running.
- 2026-11-21 S8 verify v5.21-r3 FAIL: 2 errors in 153_c1 (scrim leak shot 155-coach-step10, walk-ovens not visible); layout 0. Sent to E2.
- 2026-11-21 S8 r3 E2 done (153_c1: HUD zIndex 2 from U1 covered coach; coach layer raised). Re-verify v5.21-r3. Watch: HUD may cover GiftCalendar/NightOvenSheet/SHEETS.
- 2026-11-21 S8 verify v5.21-r3 pass: True 0 [], layout 0, 14 new 94 changed. r3 re-checks launched.
- 2026-11-21 S8 r3 gate NOT met: critic bug 1 major 1 (G118 D543), code CHANGES REQUESTED (K5 high), story minors carry. Stopped for Julien; PR opened.
- 2026-11-22 S8 r4 (Julien yes): programmer launched on U1+E2 (G118 D543 K5 stacking order); npm ci running.
- 2026-11-22 S8 r4 U1+E2 done (G118 D543 K5: one Z set in z-order.ts, test pins order). Verify v5.21-r4 next.
- 2026-11-22 S8 r4 pre-verify: tsc clean, format ok, 2924/2924, pacing same. Shots v5.21-r4 running.
- 2026-11-22 S8->S9 Julien: go to v5.22 cards before verify/shots. S4 launched alone.
- 2026-11-22 S9 music interleaved (Julien): R2 not a go -> notes round on card-NOTES (composer running beside S4). A3 stays blocked until music round done.
