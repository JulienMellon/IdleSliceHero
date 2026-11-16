# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.17
step: fix                       # setup | waves | verify | review | fix | close
round: r2              # r1 | r2 | r3
last_shots: v5.17              # label of the last screenshot set that passed verify
codecritic_range_start: aff34d1
cards:                 # todo | running | done | partial | blocked
  (v5.17 cards: see docs/build/v5.17/VERSION.md)
  N1 done  A1 done  U3 done  L1 done  U4 done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r1-critic.md (r1 NOT SATISFIED; bug 1 major 1 minor 17; E2 U12 S4 T1; G108 bug, D496 major)
  code:   docs/build/v5.17/review-r1-code.md (r1 CHANGES REQUESTED; blocker/high 2 medium 7 low 30; E20 U9 S3 N3 A5; K1 C126 high)
  story:  docs/build/v5.16/review-r3-story.md (r3 SATISFIED; bug 0 major 0 minor 1; U1)
  audio:  docs/build/v5.17/review-r1-audio.md (r1 NOT SATISFIED, advisory; bug 0 major 1 minor 6; N1 A7; AU78 major; next ID AU82)
open: v5.16 carried: critic minors (docs/build/v5.16/review-r3-critic.md: D481 D482 D489 D490 D493 D495 D475 D450 D462 D478); story S48 (docs/build/v5.16/review-r3-story.md); code C116 C117 A32 + lows (docs/build/v5.16/review-r2-code.md). W2 card Protected list still names old downtown-4 line (now "Two thousand deliveries", Julien 2026-11-15). Julien approved Todd rewrites S37 S38 S41 S43; D493 carried by choice. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: fresh session; read docs/build/sessions/S4-v5.17.md and resume at Verify (README s5) for v5.17 r1: all cards done, version.ts set, tsc passed; npm test was killed twice (stopped by the session, not a failure) -> rerun with npx jest --maxWorkers=2, then export + screenshots v5.17, commit, r1 reviews. Python playwright 1.63 needs pip install in a fresh container. Before verify, Julien 2026-11-16: (a) tracking prompt YES -> send N1 programmer (card-N1): install expo-tracking-transparency, wire ads.native.ts tracking, set manifest/NSPrivacyTracking per spec, see extra.configNotes.tracking; (b) audio items (SliceAudioSession native module, AU41) are NOT for this session: carry to the next version; (c) site placeholders are in LAUNCH-TRACK.md, not a blocker.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-15 18:31 UTC r3 S2b done (U18; components 723 pass). U5 launched.
- 2026-11-15 18:31 UTC r3 S2a done (D481 D482 fixed + tests; 723 pass). Needs: D491 MegaSlice van only while rivalOpen (scene/street.tsx, storefront.tsx -> P1). T1b launched.
- 2026-11-15 18:34 UTC r3 T1b done (D490 already fixed; no edits). P1 launched (+D491).
- 2026-11-15 18:35 UTC r3 U5 partial (D489 D487 D465 D478 S23 S24 S44; 723 pass, layout dev 0 new). S33 U13 + Big Game Day name -> E0 launched.
- 2026-11-15 18:37 UTC r3 E0 partial (S33 S22-engine U13-engine, Mudhens rename; 657 pass). Wiring sent to U5 (index teaserStep, eventViewNow) and P1 (storefront activeEvent).
- 2026-11-15 18:39 UTC r3 P1 done (U17 D491 + storefront activeEvent; 1353 pass). U5 done (teaserStep ring, eventViewNow). Waiting S2a eventViewNow calls.
- 2026-11-15 18:40 UTC r3 all fixes in (S2a eventViewNow calls). Verify v5.16-r3.
- 2026-11-15 18:57 UTC Verify v5.16-r3 PASS: True 0 [], layout 0 new; 83 changed. r3 re-checks: critic, story (sonnet).
- 2026-11-15 18:58 UTC v5.16 closed: r3 critic minors only (10), story SATISFIED, code APPROVED (r2). Next v5.17.
- 2026-11-15 v5.17 r1 wave 1 launched: N1 + A1.
- 2026-11-15 v5.17 r1 N1 partial (services built, 47 tests). Needs: tracking prompt needs expo-tracking-transparency (ask Julien); game must call onGrant (-> U3); starter 150 diamonds sent back to N1.
- 2026-11-15 v5.17 r1 N1 done (starter 150; 47 pass). Device-time items: AdMob app ID, SKAdNetwork list, privacy manifest, SENTRY_DISABLE_AUTO_UPLOAD.
- 2026-11-15 v5.17 r1 A1 partial (output seam, mixer; audio 50 pass). Needs: native SliceAudioSession.isOtherAudioPlaying (ask Julien; AU41 open); Settings Music shown on while suppressed (-> U3); audio-api plugin + lock (-> N1).
- 2026-11-15 v5.17 r1 wave 2: U3 launched (+onGrant, Settings music). L1 waits for N1 lock fix.
- 2026-11-15 v5.17 r1 N1 lock+audio-api plugin done (97 pass). L1 launched.
- 2026-11-15 v5.17 r1 U3 partial (store/ads/settings; 849 pass; shots not run: no playwright). Needs: awningFounder in facade/storefront + cosmeticName/Style tab; mixer getter (-> A1); links.ts -> L1 re-export; expo-clipboard; daily-task generator export; 98_u3 README row.
- 2026-11-15 v5.17 r1 pip playwright==1.63.0 installed (launch ok). U3 to run 98_u3 shots when a slot frees; A1 getter sent.
- 2026-11-15 v5.17 r1 A1 done (musicSuppressed/onMusicSuppressed; 53 pass). Sent to U3 with shots run.
- 2026-11-15 v5.17 r1 L1 partial (site, a11y, perf ok; 1558 pass; store_shots/perf.py not run). Needs: site placeholders + Pages on (Julien); policy mismatches/_layout tick/events (-> N1); links re-export + settings a11y (-> U3).
- 2026-11-15 v5.17 r1 N1 done (manifest = spec, tracking off, _layout tick paused, 3 events; 1560 pass). Crash link undone (spec: not linked). 4 events -> U3.
- 2026-11-15 v5.17 r1 N1 crash link undone (49 pass). L1 sent to run store_shots + perf.
- 2026-11-15 v5.17 r1 U3 done (settings music, links, a11y, 4 events; 854 pass; 98_u3 0 err, layout 0 new). Open: awning-founder not drawn (facade/storefront, cosmeticName, Style tab) -> P lane; clipboard; Swap generator. Wave 3: U4 launched.
- 2026-11-15 v5.17 r1 L1 done (perf 0/1200 >16ms; 6 store shots 1320x2868). Awning-founder fix launched on v5.16 card-P1.
- 2026-11-15 v5.17 r1 awning-founder done (facade/storefront/rewards/shop-model; 183 pass). Carried: vanity-art icon fallback, copy key.
- 2026-11-15 v5.17 r1 U4 partial (focus, sky queue, task pills, day-30; 828 pass; 148_u4 0 err). Needs: offer clock hold (-> U3). Kept U4 default: event holds strip 15 s. Carried: day-30 name placeholder (writer).
- 2026-11-15 v5.17 r1 U3 offer hold + 148 README row done (820 pass). All cards in. Verify v5.17: tsc pass; npm test running.
- 2026-11-16 Session stopped by Julien (usage limit) during verify; next: resume verify.
- 2026-11-16 18:44 UTC v5.17 r1 new session: npm ci + playwright installed; N1 launched for tracking prompt (Julien YES). Verify waits for N1.
- 2026-11-16 18:45 UTC v5.17 r1 N1 done (tracking prompt wired, manifest tracking on; services 49 pass). Carried for Julien: App Store privacy label must show Tracking = Yes. Verify v5.17 started.
- 2026-11-16 19:08 UTC Verify v5.17 PASS: True 0 [], layout 0 new; 13 new 77 changed. r1 reviews launched: critic, codecritic, audiocritic.
- 2026-11-16 19:12 UTC v5.17 r1 reviews in: critic NOT SATISFIED (G108 bug, D496 major), code CHANGES REQUESTED (K1, C126 high), audio AU78 major. Fix round r2 pair 1: N1 + A1; then U3 + E, U4 + S, L1 + T.
- 2026-11-16 19:14 UTC r2 N1 done (K1 C126-layout C131; services 56 pass). Needs -> U3: index.tsx:133 must not reload on active; UI must re-check ads.ready(). U3 launched.
- 2026-11-16 19:15 UTC r2 A1 done (AU78-AU81 C132 U20 T80 M67; audio 59 pass). E launched on v5.16 card-E0.
- 2026-11-16 19:24 UTC r2 E done (C127 C129 C116 C117 + 12 more; 1502 pass). Left: A32 medium (too wide), lows A34 A33 C107 U17 M62 U12 T94 T97. S+T launched on v5.16 card-S2a.
- 2026-11-16 19:27 UTC r2 U3 partial (G108 D496 C128 C130 D497 D498 D502 D504; 884 pass). Needs: services/index.ts export isOptedOut for C133 (-> N1, then U3 settings). Left: D499 (content/rewards.ts), D500 D501 D503 D478 -> U4. U4 launched.
- 2026-11-16 19:29 UTC r2 S+T partial (D481; layers 155 pass; D482 D490 already fixed). Needs: D475 D450 + A28 A29 M60 U10 U11 in scene/** -> P1 launched (v5.16 card-P1). C133 (low) carried: needs services isOptedOut export.
