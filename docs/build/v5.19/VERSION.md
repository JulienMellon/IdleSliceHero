# v5.19 — Chicago, New York, Los Angeles, and the Victor Crust showdown

**Scope:** the rest of wishlist section 9 (three cities as content packs on the v5.18 schema, and the ending), with the refactor of `docs/PLAN-refactor.md` interleaved. Julien decided on 2026-11-18 that there is no separate refactor build.

No cast exists yet for these cities, so this version starts with a short story bible and **one stop for Julien's approval** before three scripts are written against it. Writing 80 scenes on a cast he then changes is the most expensive mistake available in this plan.

The refactor cards (R…) run beside the writer waves, on code no writer touches. R0–R6s must all be done before the checkpoint (wave 6). R3, R4 and R2b run after it, beside the city packs. The refactor is behaviour-preserving, so its gate is **0 changed shots** against a baseline taken before it starts.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| R0 | E | Safety net: CI, lint with layer rules, home-id guard, the test city | `card-R0.md` |
| R0p | E | Prettier, one whitespace-only commit (run alone) | `card-R0p.md` |
| R1 | E | City-generic engine: rates from the fit, home re-exports gone, lookup, generic names, per-city voice | `card-R1.md` |
| R1L | U+S | Layers by kind; one shop layout (step 3 waits for Julien's pick) | `card-R1L.md` |
| R6 | S+T | Cut-scene backdrops and portraits split by city | `card-R6.md` |
| R6s | S | Storefront hooks (U21, A29) | `card-R6s.md` |
| R2 | E | Split `engine/game.ts`; `canAfford`/`pay`, `gameNow`, registry guard (A33 A36 A37 M62 U12) | `card-R2.md` |
| R5c | T+U | One copy system and its generator (C146, half of C137) | `card-R5c.md` |
| R5f | U | One flag store, one bus | `card-R5f.md` |
| W4b | T (writer) | The bible: three casts, three lieutenants, the showdown outline | `card-W4-bible.md` |
| W4s | T (writer) | One city script; run three times | `card-W4-script.md` |
| E4 | E | The showdown (engine, trigger, store action) | `card-E4.md` |
| A2 | A | Audio v2 and the Boston theme (carried from v5.18; waits for the music round) | `../v5.18/card-A2.md` |
| CITY | T+S | One city pack; run three times (files updated for R1, R1L, R5c, R6) | `card-CITY.md` |
| E4f | E | The fits for three cities, once their packs exist | `card-E4f.md` |
| R3 | E | Store layering and slices; `components/store` becomes `components/monetization` (A34 C148 C134 T104) | `card-R3.md` |
| R4 | U | Goal bar and HUD as models; `game-ui.tsx` split (C137, U19) | `card-R4.md` |
| A3 | A | Three city audio bundles | `card-A3.md` |
| R2b | E | Callers off the re-export shims; the shims deleted | `card-R2b.md` |

Cards W4s and CITY take a parameter. Add to the spawn prompt: `extra: CITY=chicago` (then `new-york`, `los-angeles`).

| CITY | Script | Pack folder | `CityDef.id` (`CITY_ORDER`) | Fixtures |
| --- | --- | --- | --- | --- |
| chicago | `docs/story/CHICAGO-SCRIPT.md` | `src/content/cities/chicago/` | `chicago` | 160–169 |
| new-york | `docs/story/NEW-YORK-SCRIPT.md` | `src/content/cities/new-york/` | `newyork` | 170–179 |
| los-angeles | `docs/story/LOS-ANGELES-SCRIPT.md` | `src/content/cities/los-angeles/` | `la` | 180–191 |

## Waves
At most two programmers or writers at once (README section 3). In this table, `‖` means the two run together.

0. **Baseline.** `npx expo export --platform web > /tmp/export.log 2>&1 && nohup python3 -u scripts/screenshots.py v5.19-base > /tmp/shots.log 2>&1 &` (a full run, about 7 min; Julien's "touched fixtures only" rule doesn't apply, because the refactor touches every screen). Check `report.json` has `"errors": []`. Commit the label.
1. **R0** alone. Verify (tsc, full test, lint), then commit.
2. **R0p** alone. Commit as the card says (the formatting commit, then `.git-blame-ignore-revs`).
3. **W4b ‖ R1.** Then `storycritic`, low effort, on `docs/story/CITIES-BIBLE.md` (review file `review-r0-bible.md`).
4. **Stop for the bible.** Report to Julien the bible's path and its one-page summary (`sed -n '/^## Summary/,/^## /p' docs/story/CITIES-BIBLE.md | head -40`). While he reads, run **R1L ‖ R6**. Writers continue only on his go, with his corrections sent to the W4b writer first.
5. **W4s(chicago) ‖ R6s**, then **W4s(new-york) ‖ R2**, then **W4s(los-angeles) ‖ R5c**, then **R5f ‖ the pending storycritic fixes**. After each W4s, `storycritic` at full effort on that script (`review-r0-<city>.md`), with one pass of fixes back to its writer.
6. **Refactor checkpoint** (gate for wave 7):
   - `nohup python3 -u scripts/screenshots.py v5.19-refactor …` (full run), then `python3 scripts/review_shots.py v5.19-refactor v5.19-base | tail -3`.
   - The gate is **0 changed**, except the shots card R1L step 3 and card R5c's Boston pin were allowed to change (their reports name them) and the seam-noise shots (00, 24, 104, 105, 29–31b).
   - Then `codecritic` at **medium** on `<v5.19-base commit>..HEAD`, paths `src scripts .github`. Its notes go to the owning R card, up to two fix rounds.
   - Any other changed shot is a bug in the refactor: send it to the card that touched that screen.
7. **E4 ‖ A2.** A2 runs only if `grep -n '^round:' docs/build/music/STATE.md` prints `round: done`; otherwise E4 runs alone, and A2 and A3 stay `carried`.
8. **CITY(chicago) ‖ R3.** R3 moves E4's store action into the `layers` slice.
9. **CITY(new-york) ‖ R4.**
10. **CITY(los-angeles)** alone. It edits `layer-stack.tsx` (the showdown strip's mount line) after R4's U19 change.
11. **E4f ‖ A3.** Both need the three packs. A3 needs A2 done; otherwise E4f runs alone.
12. **R2b** alone. It sweeps the import lines of every file, so nothing else may be in flight.
13. Verify, commit, review, fix rounds.

Wave-order check (2026-11-18). Each card starts on code that already has what it needs, and no two cards in one wave edit the same file:
- E4 needs R1 (rates read the fit) and R2 (modules, `canAfford`/`pay`, `gameNow`, the registry guard).
- R3 needs E4's action to exist.
- R4 needs R3.
- CITY(los-angeles) needs E4's `showdownView` and trigger, and R3's slice.
- E4f needs all three packs (its sim plays each story) and the showdown.
- A3 needs A2 and the three packs (it edits each pack's `theme` key).
- R2b deletes the shims, so it goes last.

The old order clashed in three places:
- E4 ‖ CITY(chicago): both edited `cities/chicago/index.ts`, and now `content/types.ts` too.
- CITY(los-angeles) ‖ R4: both edited `layer-stack.tsx`.
- A3 ‖ R2b: both edited the `src/audio` import lines.

## Reviews
- r1:
  - `critic` at full effort on the new shots.
  - `codecritic` at medium effort, range `<v5.19-refactor commit>..HEAD`, paths `src/engine src/store src/app src/content/franchise.ts src/components/goal-model.ts src/components/hud-model.ts src/components/game-ui.tsx src/components/layers/showdown-strip.tsx scripts/pacing-fit.ts scripts/pacing-sim.ts` (E4, E4f, R3, R4, R2b; the packs are data, gated by the schema test). The refactor before the checkpoint was reviewed at wave 6.
  - `storycritic` at low effort on the transcribed scenes.
  - `audiocritic` at low effort.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E4 (showdown), E4f (fits, pacing scripts), or the R card that owns the file (R1, R2, R3, R2b) |
| T, S, U | CITY, with `extra: CITY=<the city the note names>`; a note that names no city goes to all three. A note on a refactored file with no city in it goes to its R card (R1L, R4, R5c, R5f, R6, R6s) |
| A | A2 (Boston), A3 (the three cities) |

## Defaults
- **Order:** Chicago, New York, Los Angeles; the showdown follows Los Angeles's last finale.
- **Returning characters:** one or two per city, in three or four scenes, as `docs/DESIGN.md` says; each has grown since the player last saw them.
- **Layers:** each city reuses the existing layer kinds by data, with one neighbourhood that has none.
- **Fits** (card E4f): each city takes about the same days as the home city, given the franchise multiplier; the number-ceiling test from v5.18 stays green.
- **City ids:** a pack's `id` is its `CITY_ORDER` entry (`chicago`, `newyork`, `la`), not its folder name (the table under Cards).
- **Layers per city:** each of the five kinds on exactly one neighbourhood, and none on the first (`layerHood` plays one neighbourhood per kind).
- **Showdown:** five rounds, one per city, each a rush challenge at 1.5 × the rival formula; the reward is the ending, a cosmetic and the credits; the weekly counter-attack continues afterwards.
- **Layout pick (card R1L step 3): option C** (Julien, 2026-11-18). Mirroring becomes city data (`plan: 'mirrored'` on home Waterfront and Industrial only), and one `shopLayout(id, shop, city)` serves the storefront and every overlay. Boston stays standard. Review the moved overlays in home Industrial and Waterfront as a bug fix.
- **Comments:** every card strips review IDs (D477, G95, C112…) and version tags from the comments on lines it edits, and keeps the reason. It does no sweep of lines it doesn't edit.
- **Refactor cards change no behaviour.** A refactor card that finds a bug reports it as `Needs:` with the fix, unless its card names the bug as a note to fix.

## Close
This is the last version in the plan. At close, report what is still open in the last review files and stop.
