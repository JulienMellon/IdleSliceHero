# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.17
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.16-r3           # label of the last screenshot set that passed verify
codecritic_range_start: aff34d1
cards:                 # todo | running | done | partial | blocked
  (v5.17 cards: see docs/build/v5.17/VERSION.md)
  N1 done  A1 done  U3 partial  L1 running  U4 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.16/review-r3-critic.md (r3 NOT SATISFIED, minors only -> close; bug 0 major 0 minor 10; E2 U3 S4 T1)
  code:   docs/build/v5.16/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 3 low 23; E16 U5 S3 A2)
  story:  docs/build/v5.16/review-r3-story.md (r3 SATISFIED; bug 0 major 0 minor 1; U1)
  audio:  AUDIOLOG.md (next ID AU78)
open: v5.16 carried: critic minors (docs/build/v5.16/review-r3-critic.md: D481 D482 D489 D490 D493 D495 D475 D450 D462 D478); story S48 (docs/build/v5.16/review-r3-story.md); code C116 C117 A32 + lows (docs/build/v5.16/review-r2-code.md). W2 card Protected list still names old downtown-4 line (now "Two thousand deliveries", Julien 2026-11-15). Julien approved Todd rewrites S37 S38 S41 S43; D493 carried by choice. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: fresh session; read docs/build/sessions/S4-v5.17.md
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
