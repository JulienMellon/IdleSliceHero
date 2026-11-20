# v5.20 — one spotlight, and a Chapter 1 that teaches

**Scope (Julien, 2026-11-20):** `docs/PLAN-v5.20-onboarding.md`, version v5.20. One way of pointing, everywhere: a full-screen gray scrim with one cut-out over whatever Nonna is talking about (a station and its dial, a sidewalk card, the drawer's hire card, the HUD), the rest of the screen gray, taps outside the cut-out swallowed. The tutorial is rewritten around it: the dials explained, the second oven, the upgrade drawer, hiring Marco.

Steps 7 and 8 of the new script (the goal bar and the task list) need v5.21's task list. In this version their ids exist and are skipped (the tutorial goes 6 → 9).

**Out of scope:** the task list and chapters (v5.21), the report and every bottleneck pointer outside the tutorial (v5.22), the store (v5.23). The economy refit stays parked (STATE). Cities beyond Boston stay on hold. Audio: nothing.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| W1 | T | Nonna's Chapter 1 lines, 15 steps | `card-W1.md` |
| C1 | U | `CoachOverlay` and the target registry; HUD and sidewalk targets; `halo` and `cardCoach` go | `card-C1.md` |
| C2 | S | The scene registers its targets (stations, dials, the oven pair) with the registry; the in-SVG scrim goes | `card-C2.md` |
| C3 | E+U | The 15-step script in `engine/tutorial.ts`, save migration, the drawer targets, story held through step 11 | `card-C3.md` |

## Waves
At most two programmers or writers at once (README section 3). `‖` means the two run together.

0. **Baseline.** Record the current commit as `codecritic_range_start` in STATE. The v5.19-r2 baseline is stale (STATE `next:`), so take a fresh one: `npx expo export --platform web > /tmp/export.log 2>&1 && nohup python3 -u scripts/screenshots.py v5.20-base > /tmp/shots.log 2>&1 &`. Check `report.json` has `"errors": []`; commit the label.
1. **W1 ‖ C1.** Disjoint: W1 writes one markdown file.
2. **C2** alone. It needs C1's registry API.
3. **C3** alone. It needs W1's lines, C1's overlay and C2's scene targets.
4. **Verify** (README section 5, `L=v5.20`, `P=v5.20-base`). Expected changed shots: every tutorial shot and shots that showed the old halo or yellow card. Then commit and review.

## Reviews
- r1:
  - `critic` at **full** effort. Extra line: `Focus: does each tutorial step light exactly one thing, with the rest gray? Is every dial Nonna talks about inside the lit area? Does the coach card ever cover its target? Is the script understandable to someone who has never played an idle game?`
  - `codecritic` at **medium** effort, range `<codecritic_range_start>..HEAD`, paths `src scripts`. Keep the session's model (the paths include `src/store` and a save migration).
  - `storycritic` at **low** effort on `docs/story/COPY-v5.20.md` and the tutorial shots (Nonna's voice, one instruction per line, no line over the card's limit).
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| U | C1 (overlay, registry, HUD/sidewalk targets), C3 (drawer targets) |
| S | C2 (scene targets) |
| E | C3 (steps, migration, story hold) |
| T | W1 (lines); the line change is copied in by C3's programmer |

## Defaults
- **One highlight style.** After this version, no component draws its own tutorial highlight. The overlay is the only one.
- **Free-play steps** (9 and 14) show Nonna's card and no scrim, so the player can play.
- **Scrim colour and opacity:** today's `#2A1408` at 0.6, with the gold outline and the 4 pt glow of D378.
- **Missed taps:** during a tap step a tap outside the cut-out does nothing to the game; the hand gives one small shake (≤ 300 ms).
- **Story pacing:** the tutorial holds story scenes through step 11 (it was 6).
- **Old saves:** a save mid-tutorial is mapped to the new step ids (C3 step 3). A save past the tutorial is untouched.
- **Comments:** strip review IDs and version tags from lines you edit; keep the reason.

## Close
Run README section 8. Report to Julien: the verdicts, the tutorial's step count, and what is open. Then set STATE to v5.21 (`docs/build/v5.21/VERSION.md`), `step: waves`, `round: r1`, and stop.
