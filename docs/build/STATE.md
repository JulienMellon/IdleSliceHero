# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.15
step: fix               # setup | waves | verify | review | fix | close
round: r2              # r1 | r2 | r3
last_shots: v5.15      # label of the last screenshot set that passed verify
codecritic_range_start: 5d82004
cards:                 # todo | running | done | partial | blocked
  W1: done
  E1: done
  U1: done
  S1: done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.15/review-r1-critic.md (r1 NOT SATISFIED; bug 5 major 4 minor 12; U15 S6)
  code:   docs/build/v5.15/review-r1-code.md (r1 CHANGES REQUESTED; blocker/high 0 medium 5 low 19; E10 U9 S3 A2)
  story:  docs/build/v5.15/review-r0-story.md (r0 NOT SATISFIED; bug 0 major 0 minor 6; E1 U2 T3)
  audio:  AUDIOLOG.md (next ID AU78)
open: v5.14 carried notes (G95 + minors): rows in docs/build/v5.14/review-r3-critic.md
next: fix r2: U1 + S1 running; E1 (owner E, incl. A30) after U1 reports; A-owner rows have no card (carry). Then verify r2 (label v5.15-r2), critic + codecritic medium re-check.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-12 E1 done (387 engine tests pass; no node_modules in container, npm ci started). Wave 2 storycritic r0 launched.
- 2026-11-12 E1 checkpoint: tsc clean, 777 tests pass, API digest regenerated. Story r0: 0 major, 6 minor (carry). Wave 3 (U1, S1) launched.
- 2026-11-12 U1 PARTIAL: needs U-lane files outside card (app/index.tsx, shop-ui.tsx, G95/D454); sent back to U1 per OWNERS. Open: buyMany/buyCosmetic in components (owner E may move).
- 2026-11-12 U1 done (G95, D454, D455 fixed in U files; 460 component tests pass). Waiting on S1.
- 2026-11-12 S1 done (D450 fixed; 478 tests pass). Out-of-scope asks sent: features.test pin → E1, Tasks-drawer star → U1.
- 2026-11-12 Waves done. Verify r1: tsc clean, 895 tests pass, export ok; screenshots v5.15 running (pip-installed playwright 1.63.0).
- 2026-11-12 Verify r1 shots v5.15: 1 error (U1 fixture 62, Boston soon overlay blocks gift-close); sent to U1.
- 2026-11-12 Verify r1 passed (True 0 []; 21 new, 64 changed). Pushed; critic + codecritic r1 launched.
- 2026-11-12 r1 critic NOT SATISFIED (5 bugs, 4 major, 12 minor; U15 S6). Waiting on codecritic.
- 2026-11-12 r1 codecritic CHANGES REQUESTED (0 high, 5 medium, 19 low). Gate not met; fix round r2: U1 + S1 sent, E1 queued.
