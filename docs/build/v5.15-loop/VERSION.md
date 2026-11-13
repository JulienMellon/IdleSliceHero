# v5.15-loop — the loop update (no game change)

**Scope:** cards Q1 to Q4 and Q6 of `docs/PLAN-loop-improvements.md`, which Julien approved on 2026-11-13 to run before v5.16. They change `scripts/`, the agent briefs and `docs/build/README.md`. They do not change `src/`, so the game's pixels and `APP_VERSION` stay at 5.15.

**This version overrides the README in four places.** Read these before section 4 of the README:
- **No version bump.** Skip the `sed … APP_VERSION` line.
- **No critics and no fix rounds.** The gate is the Verify section below. Skip README sections 7 and 8.
- **The programmers run the screenshot script.** Their brief forbids it; each card says so and lifts the rule for itself.
- **Verify is the block below**, not README section 5.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| Q2 | scripts | Fixtures split out of `screenshots.py`, `--only`, fixtures assert their state | `card-Q2.md` |
| Q6 | scripts | `loop_stats.py` and `docs/build/METRICS.md` | `card-Q6.md` |
| Q1 | scripts | Screenshots on a frozen clock: two runs, same pixels | `card-Q1.md` |
| Q3 | scripts | Layout checks at every shot, with an allowlist of today's findings | `card-Q3.md` |
| Q4 | docs | README, the critic and programmer briefs, `review_shots.py --notes` | `card-Q4.md` |

Q2 runs before Q1 so that Q1 can be developed one fixture at a time instead of on the 8-minute full run.

## Waves
1. **Q2 + Q6** in parallel (no shared files).
2. **Q1.**
3. **Q3.**
4. **Q4.** It writes the rules that describe what Q1 to Q3 built, so it goes last. `extra` for Q4: `Read the reports' "Changed" lines from Q1, Q2 and Q3 in docs/build/STATE.md's log before you edit the README.` Put each card's one-line result in the log as it reports.
5. Verify, commit, close.

One programmer at a time from wave 2 on; these cards share `scripts/shots_lib.py`.

## Verify (replaces README section 5)
```
npx tsc --noEmit 2>&1 | tail -3
npm test 2>&1 | tail -6
npx expo export --platform web > /tmp/export.log 2>&1; tail -2 /tmp/export.log
nohup sh -c 'python3 -u scripts/screenshots.py v5.15-loop > /tmp/shots-a.log 2>&1; python3 -u scripts/screenshots.py v5.15-loop-b > /tmp/shots-b.log 2>&1' &
```
Wait for both runs (about 16 minutes at today's speed), then:
```
python3 -c "import json;r=json.load(open('screenshots/v5.15-loop/report.json'));print(r['loaded'],len(r['errors']),r['errors'][:3])"
python3 scripts/review_shots.py v5.15-loop-b v5.15-loop 2>&1 | tail -1
python3 -c "import json;print(json.load(open('screenshots/v5.15-loop/layout.json'))['new'])"
( time python3 scripts/screenshots.py dev --only 56_u1 ) 2>&1 | tail -4
```
Must print, in order: `True 0 []`; a line with `0 new, 0 changed`; `0`; a `real` time under 1m30s.

A failure goes to the card that owns the check (determinism Q1, `--only` and the report Q2, layout Q3), with the failing lines, by SendMessage if its programmer is alive.

## Commit and close
- Commit per README section 6, with messages `loop: <card> <one line>`.
- `screenshots/v5.15-loop/` is committed: it becomes the baseline. `screenshots/v5.15-loop-b/` and `screenshots/dev/` are ignored by `.gitignore` (`screenshots/*-b/`, `screenshots/dev/`).
- Set STATE: `version: 5.16`, `step: waves`, `round: r1`, **`last_shots: v5.15-loop`**, `next: v5.16 wave 1 (W2 + E0)`. Leave `codecritic_range_start` and the `reviews:` block as they are.
- Append this version's line to `docs/build/METRICS.md` (card Q6 defines the format).
- Do not append to `CRITICLOG.md` or `CODELOG.md`.
- Report to Julien in 2 to 4 sentences: which checks passed, and any default below that was used. End the session.

## Defaults (apply without asking; Julien may correct them later)
- **If two runs can't be made identical** after Q1's programmer has had one fix message: accept at most 3 changed shots of 92, each under 1%. Record their names in STATE's `open:` line and in `METRICS.md`, and go on. v5.16 does not wait on the last pixel.
- **If the clipped-text check can't be made reliable** (card Q3 step 3): ship the other three checks, leave clipped text out of the gate, and say so in STATE's `open:` line.
- **Tap targets:** a control passes if it is drawn at 44 pt or more in both directions, or at 40 pt or more with a `hitSlop` that a test in `src/components/__tests__/tap-targets.test.ts` proves reaches 44 pt inside space its parent owns. Close keeps its existing exception. (DECISIONS #29, #30.)
- **Text:** 10 pt minimum. (DECISIONS #31.)
- **Lint:** `AGENTS.md` loses its "run lint" instruction until ESLint is configured (DECISIONS #32, a default Julien has not confirmed).
- **Public playtest:** none. Card Q5 of the plan is parked (DECISIONS #28).

## What v5.16 inherits
- Card `docs/build/v5.16/card-U5.md` burns down the allowlist that Q3 writes (tap targets and small text). It is already in v5.16's waves.
- From v5.16 r2 on, the critic's review set comes from `review_shots.py --notes` (card Q4).

## Reference
`poc/` holds the audit's scratch scripts and their results. `docs/PLAN-loop-improvements.md` holds the measurements behind every card.
