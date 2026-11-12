# v5.19 — Chicago, New York, Los Angeles, and the Victor Crust showdown

**Scope:** the rest of wishlist section 9. Three cities as content packs on the v5.18 schema, and the ending.

No cast exists yet for these cities, so this version starts with a short story bible and **one stop for Julien's approval** before three scripts are written against it. Writing 80 scenes on a cast he then changes is the most expensive mistake available in this plan.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| W4b | T (writer) | The bible: three casts, three lieutenants, the showdown outline | `card-W4-bible.md` |
| W4s | T (writer) | One city script; run three times | `card-W4-script.md` |
| E4 | E | The showdown, and the fits for three cities | `card-E4.md` |
| CITY | T+S | One city pack; run three times | `card-CITY.md` |
| A3 | A | Three city audio bundles | `card-A3.md` |

Cards W4s and CITY take a parameter. Add to the spawn prompt: `extra: CITY=chicago` (then `new-york`, `los-angeles`).

## Waves
1. **W4b** alone. Then `storycritic`, low effort, on `docs/story/CITIES-BIBLE.md` (review file `review-r0-bible.md`).
2. **Stop.** Report to Julien: the bible's path and its one-page summary section (print it with `sed -n '/^## Summary/,/^## /p' docs/story/CITIES-BIBLE.md | head -40`). Continue only on his go, with his corrections sent to the W4b writer first.
3. **W4s × 3**, two at a time. After each, `storycritic` full effort on that script (review files `review-r0-<city>.md`), one pass of fixes back to its writer.
4. **E4 + CITY(chicago).**
5. **CITY(new-york) + CITY(los-angeles).**
6. **A3.**
7. Verify, commit, review, fix rounds.

## Reviews
- r1: `critic` full effort on the new shots; `codecritic` medium effort, range `<codecritic_range_start>..HEAD`, paths `src/engine` only (the packs are data and are gated by the schema test); `storycritic` low effort on the transcribed scenes; `audiocritic` low effort.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E4 |
| T, S, U | CITY, with `extra: CITY=<the city the note names>`; a note that names no city goes to all three |
| A | A3 |

## Defaults
- **Order:** Chicago, New York, Los Angeles; the showdown follows Los Angeles's last finale.
- **Returning characters:** one or two per city in three or four scenes, as `docs/DESIGN.md` says; each has grown since the player last saw them.
- **Layers:** each city reuses the existing layer kinds by data, one neighbourhood with none.
- **Fits:** each city takes about the same days as the home city, given the franchise multiplier; the number-ceiling test from v5.18 stays green.
- **Showdown:** five rounds, one per city, each a rush challenge at 1.5 × the rival formula; the reward is the ending, a cosmetic and the credits; the weekly counter-attack continues afterwards.

## Close
This is the last version in the plan. At close, report what is still open in the last review files and stop.
