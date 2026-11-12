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
  E1: running
  U1: todo
  S1: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.14/review-r3-critic.md (r3 NOT SATISFIED; bug 1 major 0 minor 4; E1 U3 S1)
  code:   CODELOG.md "Current state" (round 24, APPROVED at v5.12; next IDs K1, C110, A30, M62, U12, T85)
  story:  STORYLOG.md (next ID S21)
  audio:  AUDIOLOG.md (next ID AU78)
open: v5.14 carried notes (G95 + minors): rows in docs/build/v5.14/review-r3-critic.md
next: wait for W1 + E1, then wave 2 (storycritic low on docs/story/COPY-v5.15.md). Carried notes: docs/build/v5.14/review-r3-critic.md.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-12 r1 critic NOT SATISFIED (2 bugs, 1 major, 7 minor). Fix round r2 started.
- 2026-11-12 r2 verify passed (True 0 []); pushed to main; r2 critic launched.
- 2026-11-12 r2 critic NOT SATISFIED (1 bug G95, 3 minor). Fix round r3 started.
- 2026-11-12 r3 verify passed (True 0 []); pushed to main; r3 critic launched.
- 2026-11-12 r3 critic NOT SATISFIED (G95 still open, 4 minor). Stopped per README 4.5; asked Julien.
- 2026-11-12 Julien accepted G95 overlap; carried to v5.15. Wave 4 (K0a, K0b) launched.
- 2026-11-12 K0a done (golden hashes unchanged; digest needs re-run after K0b).
- 2026-11-12 Seam: 45 changed vs r3, but identical code re-run gives 41 (same top shots) = clock noise; accepted. tsx not installed (digest via node --experimental-strip-types); python playwright 1.63.0 pip-installed this session. v5.14 closed.
- 2026-11-12 v5.15 wave 1 (W1, E1) launched.
- 2026-11-12 W1 done (COPY-v5.15.md; open questions for Julien: Kayla name clash suburbs vs Boston; shop display names ≤19 chars).
