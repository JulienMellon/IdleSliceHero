# v5.18 — Franchise to Boston

**Scope:** wishlist section 9's first two items (the franchise reset with a permanent multiplier; Boston's six neighbourhoods, cast and lieutenant Trish Vance), the big-number question, and Audio v2 from section 10 (arrangements that change with a manager, a rush rhythm layer, the Boston theme).

This version first turns "the city" from constants into data, with no behaviour change, so that Boston here and three more cities in v5.19 are content packs and not engine work.

## Prerequisite
`ls docs/specs/PRESTIGE.md` before wave 2. It is Julien's prestige design (a Claude Doc; see `SETUP.md` section 3). Without it card E3 is blocked: don't let a programmer invent a competing design.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| K1 | E | City as data: no behaviour change | `card-K1.md` |
| W3 | T (writer) | The Boston script | `card-W3.md` |
| E3 | E | Franchise reset, permanent multiplier, the number ceiling | `card-E3.md` |
| T2 | T+S | Boston pack: data, scenes, portraits, backdrops | `card-T2.md` |
| A2 | A | Audio v2 and the Boston theme | `card-A2.md` |

## Waves
1. **K1 + W3.** K1's gate is the same as the v5.14 seam: after it, run the verify block with label `v5.18-seam`; the review index must show 0 new and 0 changed shots and every test must pass. Commit.
2. Doc review: `storycritic`, **full effort**, on `docs/story/BOSTON-SCRIPT.md` only. Review file `review-r0-story.md`. Send its majors and minors back to the W3 writer; allow two passes. A script is far cheaper to fix as a document than as scenes and screenshots.
3. **E3 + T2.** `extra` for T2: `Script: docs/story/BOSTON-SCRIPT.md. City schema: docs/API.md (src/content/cities).`
4. **A2**, with T2's or E3's fix work if any.
5. Verify, commit, review, fix rounds.

## Reviews
- r1: `critic` full effort; `codecritic` full effort, range `<codecritic_range_start>..HEAD`, paths `src/engine src/store src/content/cities/*/index.ts` (a reset that touches every save field gets a code review); `storycritic` low effort on the transcribed scenes (the script was already reviewed: this pass checks only that nothing was lost or cut off); `audiocritic` full effort on `src/audio/**`, `tools/audio/**`, `docs/AUDIO.md`.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E3 (K1 for city-data plumbing) |
| T, S | T2 |
| A | A2 |
| U | T2 (city picker and franchise screens are in its files) |

## Defaults
- **No big-number library.** Cash and costs reset on a franchise and each city's curve stays under 1e300; card E3 proves it with a test over all five planned cities. Only if that test can't be made to pass does a library go in, as its own card in a later session.
- **What a franchise keeps:** diamonds, cosmetics, recipe cards, mastery stars already earned, the Scrapbook, purchases. Everything else follows `docs/specs/PRESTIGE.md`.
- **Boston's layers:** each Boston neighbourhood reuses one of the six existing layer types by data; no new layer code in this version.
- **Refit:** Boston is fitted to the same day targets as the home city, shifted by the multiplier the prestige design gives.

## Close
After APPROVED, set `codecritic_range_start` to this version's closing commit.
