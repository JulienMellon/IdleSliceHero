# v5.19 — a city is only a content pack

**Scope (Julien, 2026-11-18):** cities beyond Boston are on hold. This version makes sure a new city is just a content pack, separate from the core game logic:
- the engine, the store and the shared UI read everything city-specific from the current city's pack;
- a city is one content folder (`src/content/cities/<id>/`) plus one art folder (`src/components/cities/<id>/`) and a few registry lines;
- a test proves that a fresh pack plays without core edits.

Boston is the pack that proves it. No new city, story or audio is written.

The cards come from `docs/PLAN-refactor.md` (phases P0, P1, P5-copy, P6), plus R7a and R7b, which close what the 2026-11-18 plan check found still tying Boston to core files. The rest of the refactor plan, and the held city cards, are in `later/` (see `later/README.md`). **Don't launch them.**

**Behaviour-preserving.** Every card passes `npx tsc --noEmit` and the full `npm test`, with no test edited except imports or a card's named test. The screenshot gate is **0 changed** against the baseline, except the overlays card R1L step 3 moves in home Industrial and Waterfront (a bug fix Julien chose, option C).

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| R0 | E | Safety net: CI, lint with layer rules, home-id guard, the test city | `card-R0.md` |
| R0p | E | Prettier, one whitespace-only commit (run alone) | `card-R0p.md` |
| R1 | E | City-generic engine: rates from the fit, home re-exports gone, generic names, per-city voice fields | `card-R1.md` |
| R6 | S+T | Cut-scene backdrops and portraits split; Boston's art in `components/cities/boston/` | `card-R6.md` |
| R1L | U+S | Layers by kind; one shop layout with `plan: 'mirrored'` as data (option C) | `card-R1L.md` |
| R5c | T+U | One copy system and its generator; city overrides live in the pack (C146) | `card-R5c.md` |
| R7a | E+T | Content side: cast, numbers and teaser in the pack; the audio bid line; pack guard; the test city as a full pack; the pack README | `card-R7a.md` |
| R7b | S+U | Art and UI side: shop looks, sky, map art and the next-city card from the art registry; the art shims deleted; pack guard at zero | `card-R7b.md` |

## Waves
At most two programmers at once (README section 3). In this table, `‖` means the two run together. No two cards in one wave edit the same file, and each card starts on code that has what it needs.

0. **Baseline.** Record the current commit as `codecritic_range_start` in STATE. Then run a full shot run: `npx expo export --platform web > /tmp/export.log 2>&1 && nohup python3 -u scripts/screenshots.py v5.19-base > /tmp/shots.log 2>&1 &` (about 7 to 9 minutes). Julien's "touched fixtures only" rule doesn't apply, because this version touches every screen. Check that `report.json` has `"errors": []`, and commit the label.
1. **R0** alone. Verify (tsc, full test, lint), then commit.
2. **R0p** alone. Commit as the card says: the formatting commit, then `.git-blame-ignore-revs`.
3. **R1 ‖ R6.** Disjoint: R1 doesn't edit `backdrop.tsx`, `portrait.tsx` or `components/cities/`. R6 keeps the old paths as re-exports, so no R1 call site moves.
4. **R1L** alone. It renames `components/layers/**`, which R5c moves copy out of, and it adds a field to `cities/types.ts`.
5. **R5c** alone. It needs R1's `founder` and R1L's folder names.
6. **R7a** alone. It needs R1, R1L and R5c, and adds the `cast` and `teaser` fields.
7. **R7b** alone. It needs R6's art registry and R7a's `teaserFor` and guard.
8. **Verify** (README section 5, `L=v5.19`, `P=v5.19-base`).
   - The gate is **0 changed**, except the overlays card R1L moved (its report names the shots) and the seam-noise shots (00, 24, 104, 105, 29–31b).
   - Any other changed shot is a bug: send it to the card that touched that screen.
   - Then commit and review.

## Reviews
- r1:
  - `codecritic` at **medium** effort, range `<codecritic_range_start>..HEAD`, paths `src scripts .github`. Keep the session's model (the paths include `src/store` and the save migration).
  - `critic` at **medium** effort, only on the shots card R1L moved, reviewed as a bug fix: do the wrench, the rack, the night tint, the Game Day seats and the critic stand on the room that is drawn? Review set: `python3 scripts/review_shots.py v5.19 v5.19-base | tail -3`.
  - No storycritic or audiocritic: no words or sounds change (R5c and R7a move lines byte for byte).
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | R1 (engine, store, tuning), R0 (CI, lint, guards), R7a (cast, numbers, teaser, audio bid line) |
| U, S | R1L (layers, shop layout), R6 (cut-scene art), R7b (city art registry, next-city card) |
| T | R5c (copy), R7a (pack README, the test city) |
| A | R7a (the director's bid line only); everything else in lane A is carried |

## Defaults
- **Refactor cards change no behaviour.** A card that finds a bug reports it under `Needs:` with the fix, unless its card names that bug as a note to fix.
- **Layout fix: option C** (Julien, 2026-11-18). Mirroring becomes pack data (`plan: 'mirrored'` on home Waterfront and Industrial only), and one `shopLayout(id, shop, city)` serves the storefront and every overlay. Boston stays standard.
- **Save keys stay byte-identical:** `LAYER_KEYS` values, `SAVE_KEY`, `x[...]` keys, `slice-empire/boston-seen`, and fixture `testID`s.
- **Shims:** move first, with a re-export at the old path. R7b deletes the art shims. `engine/game.ts` is not split in this version (R2 is in `later/`).
- **Comments:** each card strips review IDs (D477, G95, C112…) and version tags from the comments on lines it edits, and keeps the reason. No sweep of other lines.
- **Out of scope:** cities beyond Boston (on hold), the economy refit (Julien's 2026-11-18 decisions are parked in STATE), A2 and all audio work (waiting for the music round), and the deferred refactor cards.

## Close
Run README section 8. Report to Julien:
- the verdicts;
- the pack guard's `ALLOW` count (it must be 0);
- that `src/content/cities/README.md` is the pack contract;
- what is still open in the last review files.

Then stop. The next version's scope is Julien's call (`later/README.md` lists the candidates).
