# v5.14 — Retention, then the seams

**Scope:** wishlist section 1 (night oven, welcome-back gift, next-scene teaser, golden-pizza polish, bugs G93 and G94, scene minors), then a no-pixel-change refactor that makes every later feature a new file instead of an edit to the five largest files.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| B3 | S | Scene minors and the cooks' cheer pulse | `card-B3.md` |
| R3 | E+U | Night oven, welcome-back gift, next-scene teaser | `card-R3.md` |
| C3 | U | Golden pizza and special-order fix round | `card-C3.md` |
| K0a | E | Feature registry, scenes split per neighbourhood, API digest | `card-K0a.md` |
| K0b | U+S | UI slots, fixtures split, two open file-size refactors | `card-K0b.md` |

## Waves
1. **B3 + R3** in parallel.
2. **C3** alone. `extra: Cheer pulse name from card B3: <the pulse name in B3's report, or "none">`.
3. Verify, commit, review, fix rounds until the gate is met (README section 4).
4. **K0a + K0b** in parallel, only after the gate is met.
5. Seam verify: run the verify block with label `v5.14-seam` against the last passing label. Required: tsc clean, full tests pass, `report.json` clean, and the review index shows **0 new and 0 changed shots**. Any changed shot goes back to K0b as a bug. No critic round. Commit, then close.

## Reviews
- r1: `critic`, full effort. For this version only, `PREV` is: `CRITICLOG.md, section "Current state" (round 61); next IDs G95, D447`.
- r2, r3: `critic`, medium re-check.
- `codecritic`: skipped (skip rule; v5.15 reviews everything since `5d82004`).
- `storycritic`, `audiocritic`: not run.

## Fix routing
| Owner | Cards |
| --- | --- |
| S | B3 |
| E | R3 |
| U | C3, R3 |

## Defaults
- Night oven prices and unlocks are as written on card R3.
- If B3 reports the cheer pulse cost more than 40 lines and skipped it, C3 ships D444 without the cheer.

## Close
Carried minors go to v5.15 through the last critic review file. Set `codecritic_range_start` unchanged (`5d82004`).
