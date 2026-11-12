# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.15
step: waves            # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.14-seam      # label of the last screenshot set that passed verify
codecritic_range_start: 5d82004
cards:                 # todo | running | done | partial | blocked
  W1: done
  E1: done
  U1: done
  S1: running
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.14/review-r3-critic.md (r3 NOT SATISFIED; bug 1 major 0 minor 4; E1 U3 S1)
  code:   CODELOG.md "Current state" (round 24, APPROVED at v5.12; next IDs K1, C110, A30, M62, U12, T85)
  story:  docs/build/v5.15/review-r0-story.md (r0 NOT SATISFIED; bug 0 major 0 minor 6; E1 U2 T3)
  audio:  AUDIOLOG.md (next ID AU78)
open: v5.14 carried notes (G95 + minors): rows in docs/build/v5.14/review-r3-critic.md
next: wave 3 (U1 + S1) running; then verify r1.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-12 r3 critic NOT SATISFIED (G95 still open, 4 minor). Stopped per README 4.5; asked Julien.
- 2026-11-12 Julien accepted G95 overlap; carried to v5.15. Wave 4 (K0a, K0b) launched.
- 2026-11-12 K0a done (golden hashes unchanged; digest needs re-run after K0b).
- 2026-11-12 Seam: 45 changed vs r3, but identical code re-run gives 41 (same top shots) = clock noise; accepted. tsx not installed (digest via node --experimental-strip-types); python playwright 1.63.0 pip-installed this session. v5.14 closed.
- 2026-11-12 v5.15 wave 1 (W1, E1) launched.
- 2026-11-12 W1 done (COPY-v5.15.md; open questions for Julien: Kayla name clash suburbs vs Boston; shop display names ≤19 chars).
- 2026-11-12 E1 done (387 engine tests pass; no node_modules in container, npm ci started). Wave 2 storycritic r0 launched.
- 2026-11-12 E1 checkpoint: tsc clean, 777 tests pass, API digest regenerated. Story r0: 0 major, 6 minor (carry). Wave 3 (U1, S1) launched.
- 2026-11-12 U1 PARTIAL: needs U-lane files outside card (app/index.tsx, shop-ui.tsx, G95/D454); sent back to U1 per OWNERS. Open: buyMany/buyCosmetic in components (owner E may move).
- 2026-11-12 U1 done (G95, D454, D455 fixed in U files; 460 component tests pass). Waiting on S1.
