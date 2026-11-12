# v5.16 — Neighbourhood layers, the rival, drones, and the Todd story

**Scope:** wishlist section 4 (five neighbourhood layers and "the rival opens"), the drone job and the dead zone from section 3, and the rest of section 6 (Todd B-plot, STORYLOG fold-ins, review text fixes, per-neighbourhood cut-scene backdrops, head story lines, later-cycle visitors).

The layers and the story ship together on purpose: the rival changes what beats 3 and 4 do, the drone job is what makes Genevieve's drone line true, and Todd's interludes are what closes the 34-minute dead zone. All three change the pacing, so they share one refit.

## Prerequisite
`ls docs/story/STORY-v4-final.md docs/specs/PLAN-v4.4-todd-interludes.md` must list both files before wave 2. If the script is missing, T1a is blocked: tell Julien (see `SETUP.md` section 3) and run the other cards meanwhile.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| W2 | T (writer) | Copy for layers, rival, head story lines, visitors, text fixes | `card-W2.md` |
| E2a | E | Suburbs Game Day, Waterfront boats and rack and auction, the rival | `card-E2a.md` |
| E2b | E | University menu and zones and drones, Industrial shifts and jams, Uptown stars; the refit | `card-E2b.md` |
| T1a | T+E | Todd engine rules, 11 interludes, text edits, tests, sim | `card-T1a.md` |
| S2a | S+U | Scene and HUD for Suburbs, Waterfront, the rival | `card-S2a.md` |
| S2b | S+U | Scene and HUD for University, Industrial, Uptown | `card-S2b.md` |
| T1b | T | Todd's looks and props, Scrapbook and hint, cut-scene backdrops | `card-T1b.md` |

## Waves
1. **W2 + E2a.**
2. Doc review: `storycritic`, low effort, on `docs/story/COPY-v5.16.md` only. Review file `review-r0-story.md`. Majors go back to the W2 writer once.
3. **E2b + T1a.** `extra` for T1a: `Rival API: docs/API.md (features/layers/rival.ts). Copy: docs/story/COPY-v5.16.md.`
4. **Refit:** when both have reported, continue the E2b agent: `Run step 7 of your card (the refit) now; card T1a has landed.`
5. **S2a + S2b.** `extra` for both: `Copy: docs/story/COPY-v5.16.md.`
6. **T1b.**
7. Verify, commit, review, fix rounds.

Every card also gets: `extra: Carried notes: rows with your owner letter in <last v5.15 critic review file>`.

## Reviews
- r1: `critic` full effort; `storycritic` full effort on `src/content/scenes/**` and the new strings; `codecritic` full effort, range `<codecritic_range_start>..HEAD`, paths `src/engine src/store src/content/types.ts` (Julien locked this on 2026-10-30: the save migration gets a code review).
- r2, r3: medium re-checks of whoever was not satisfied.
- `audiocritic`: not run.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E2a, E2b |
| U, S | S2a, S2b |
| T | T1a (text, rules), T1b (art, Scrapbook) |

## Defaults
- **Layers run in play time only**, are seeded and deterministic, and never re-roll on a clock or time-zone change.
- **Offline:** a layer's long-run average applies offline only where the review table says the layer is a pay rule (Uptown stars, University menu, Industrial night shift, the rival's 20%). Bursts (Game Day, boats, critic visits, jams) do not happen offline.
- **Rival challenge target:** `ceil(5 min × the shop's current pizza rate × 1.2)` pies in 5 minutes, instead of the review's fixed 2,000.
- **Refit targets:** story days within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8; no gap between scenes longer than 12 minutes of play; no check-in day without a scene; drones bought before `uptown-4` in the sim.
- **Save:** `SAVE_VERSION` 5 → 6 for the Todd rules. Feature slices migrate themselves.

## Close
After APPROVED, set `codecritic_range_start` to this version's closing commit.
