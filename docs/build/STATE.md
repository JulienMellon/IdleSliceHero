# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.16
step: fix                      # setup | waves | verify | review | fix | close
round: r2              # r1 | r2 | r3
last_shots: v5.16           # label of the last screenshot set that passed verify
codecritic_range_start: f83d281
cards:                 # todo | running | done | partial | blocked
  W2 done  E0 done  E2a done  P1 partial  E2b done  T1a done
  S2a partial  S2b done  T1b partial  U5 done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.16/review-r1-critic.md (r1 NOT SATISFIED; bug 4 major 8 minor 15; E2 U16 S8 T1)
  code:   docs/build/v5.16/review-r1-code.md (r1 CHANGES REQUESTED; blocker/high 1 medium 5 low 21; bugs C120 C121; E18 U4 S3 A2)
  story:  docs/build/v5.16/review-r1-story.md (r1 NOT SATISFIED; bug 1 major 4 minor 18; E4 U9 T10)
  audio:  AUDIOLOG.md (next ID AU78)
open: T1b Needs: index.tsx:230 + settings.tsx:36 hard-code 24 -> storyGoal/STORY_TOTAL; report-strip.tsx:24 use MANAGERS[hood].id; StoryWaitBanner next to perk banner in index.tsx (all -> U5 extra); scene/cameo.ts linesOf read VISITOR_CAMEO_LINES (S, carried); shots 139+139b accepted. S2b Needs: copy rows missing ("Head Baker fixing… {n}s", "ignores distance", Half/Full/Double pay, pay-rule line, "Expand to open", "Next point: …") (T); jam/jamfixed pulses live in industrial/jam-bus.ts (audio lane); Garlic Knots oven shown but not applied (E). S2a Needs: app/index.tsx goal bar uses PIER9_BID.cost not pier9Price (U -> U5 extra); golden pizza (stack-model holdsBonus) flies over rival notice+offer card (E); copy rows missing: rival info text, LABELS in layer-text.ts, "−20% sales", "from Game Day" (T). S2a step 5 carried rows D471 D475 D450 out of scope. S2a gets P1 Needs (storefront slammedAsks, pulse-bus onServicePulse, pier9Price UI + layer views); P1 fixture shots 130-137 unrun (py playwright missing after restart). v5.16 finale day 5.106 vs 4.8±0.3 (pinned ±0.31; shorten uptown-2b or -3b wait ~1 min, T). v5.16 for later cards: waterfront-3b P4 "Bid two million" vs $120M bid (W/T); scenes mix straight+curly quotes (T); migrated hire scenes raise Scrapbook badge on old saves (T1b); S5 Dale perk text not applied; Downtown beat 4 stays a pizza count. loop_stats.py can't read 'loop:' commits (5.15-loop METRICS row by hand). Shot 18-sold-sign-scene now always taken (93 shots), no fixture expect yet (Q2 lane). v5.15 carried: critic minors (docs/build/v5.15/review-r3-critic.md); code C116, C117 + lows (docs/build/v5.15/review-r2-code.md); story r0 minors; D465 needs copy key.
next: v5.16 fix round r2 in progress (step fix, round r2). Done this round: E0 E2a E2b P1 S2a U5. Still to run, two at a time: S2b (G107, D484, D485 zones-strip part; it died at the usage limit before editing), T1a (S37 S38 S39 D493; died before editing), then writer W2 (COPY-v5.16.md: S30 S32, P1's S31 line + new bark + 'Tipping'/'Cold', S2a/S2b copy asks in open:), then T1b (S/T rows). Use the README section 4.6 fix prompt with docs/build/v5.16/review-r1-*.md. Then verify with L=v5.16-r2, P=v5.16, review_shots --notes, and medium re-checks (sonnet) of critic, story, code (code keeps session model: src/store + migration). Env first: npm ci; pip install playwright==1.63.0. Read docs/build/sessions/S3-v5.16-second-half.md
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-15 01:33 UTC U5 fixed 3 layout clips (no allowlist adds; dev layout 0 new). Waiting on fixture fixes.
- 2026-11-15 01:51 UTC Verify v5.16 PASS: True 0 [], layout 0 new; 129 shots (36 new, 89 changed). r1 reviews launched: critic, story, code.
- 2026-11-15 01:59 UTC r1 gate not met (critic bug4 maj8; code high1 bugs C120 C121; story bug1 maj4). Fix round r2: cards E0 U5 E2a E2b P1 S2a S2b T1a T1b, two at a time; first E0 + U5.
- 2026-11-15 02:01 UTC r2 E0 partial (C121 + S45 fixed; tsc ok, engine+content pass; C107 D495 left). E2a launched (C120).
- 2026-11-15 02:02 UTC r2 E2a partial (C120 engine fixed; tsc ok, 791 pass). Needs for S2a: rival-model.ts rivalCard NONE on 'waiting', sheet-model.ts:105 waiting case. D493 left (story gate, T). E2b launched (+C123).
- 2026-11-15 02:06 UTC r2 U5 done (S40/G104 crash, G106, D494 partial, D488, D487; tsc ok, 717 pass, layout 0 new). P1 launched (D479 D486 D485).
- 2026-11-15 02:09 UTC r2 E2b partial (C123, U16 engine; pacing-fit finale crash fixed; days 1.02/2.04/3.06/4.42; sim gap readout 1808 min uptown-hire, off before too). Needs S2b: stars-model.test.ts:125 expect shopRevenue (1 test red). S2a launched (G105 D480-483 D492 + rival waiting).
- 2026-11-15 02:15 UTC r2 S2a done (G105 D480-D483, rival waiting; tsc ok; components 718/720: Ingredients card (S2b) + 'head barks stay inside the walls' red). S30 S32 need copy file (T). S2b launched.
- 2026-11-15 02:18 UTC r2 P1 partial (D479 D492 S31 S34 fixed; D485 strip part; D486 in attack-model.ts + U17 left; tsc ok, 1 red = S2b Ingredients). Copy-file updates pending for writer: S31 line, new bark, 'Tipping'/'Cold'. T1a launched (S37 S38 S39 D493).
- 2026-11-15 12:47 UTC Session S3 stopped at usage limit mid r2 (S2b, T1a died; no edits on disk). Tree clean: tsc ok, components+engine 1349/1349. PR opened.
- 2026-11-15 13:55 UTC Session S3 resumed r2: S2b + T1a relaunched (fix prompt).
- 2026-11-15 13:57 UTC r2 S2b done (G107 D484 D485-strip already on disk; tsc ok, components 721 pass). W2 launched.
