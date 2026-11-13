# v5.16 — Playtest 3 economy, the shop report, managers; neighbourhood layers, the rival, drones, and the Todd story

**Scope:** Julien's playtest 3 wishlist of 2026-11-13 (the economy and session 1, cash rewards, manager prices, a live shop report, managers in the story), then the original v5.16: wishlist section 4 (five neighbourhood layers and "the rival opens"), the drone job and the dead zone from section 3, and the rest of section 6 (Todd B-plot, STORYLOG fold-ins, review text fixes, per-neighbourhood cut-scene backdrops, head story lines, later-cycle visitors).

Everything that changes the pacing ships together and shares one refit: the new economy rules, the service tip, the rival, the drone job and Todd's interludes. Card E0 fits a baseline first, so the final refit can tell what the layers moved.

## Prerequisite
`ls docs/story/STORY-v4-final.md docs/specs/PLAN-v4.4-todd-interludes.md` must list both files before wave 4. If the script is missing, T1a is blocked: tell Julien (see `SETUP.md` section 3) and run the other cards meanwhile.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| W2 | T (writer) | Copy for layers, rival, head story lines, visitors, text fixes, the five managers, the shop report | `card-W2.md` |
| E0 | E | Economy rules: session 1, manager prices, heads away at half speed, reward cuts, rewards in the sim, baseline fit | `card-E0.md` |
| E2a | E | Suburbs Game Day, Waterfront boats and rack and auction, the rival | `card-E2a.md` |
| P1 | E+U | The shop report: service feature, strip and sheet, effect lines on cards, no "buy this" frame after the tutorial | `card-P1.md` |
| E2b | E | University menu and zones and drones, Industrial shifts and jams, Uptown stars; the refit | `card-E2b.md` |
| T1a | T+E | Todd engine rules, 11 interludes, 5 manager hire scenes, text edits, tests, sim | `card-T1a.md` |
| S2a | S+U | Scene and HUD for Suburbs, Waterfront, the rival | `card-S2a.md` |
| S2b | S+U | Scene and HUD for University, Industrial, Uptown | `card-S2b.md` |
| T1b | T | Todd's looks and props, the managers' faces, Scrapbook and hint, cut-scene backdrops | `card-T1b.md` |
| U5 | U | Tap targets and text size to the rule; empties the layout allowlist (added 2026-11-13 with the loop update) | `card-U5.md` |

## Waves
1. **W2 + E0.** E0 is the long card of this wave; W2 will report first.
2. Doc review: `storycritic`, low effort, on `docs/story/COPY-v5.16.md` only. Review file `review-r0-story.md`. Majors go back to the W2 writer once. Wave 3 starts when E0 has reported and the writer has answered the majors (P1 copies strings from the file).
3. **E2a + P1.** `extra` for P1: `Copy: docs/story/COPY-v5.16.md section 7.`
4. **E2b + T1a.** `extra` for T1a: `Rival API: docs/API.md (features/layers/rival.ts). Copy: docs/story/COPY-v5.16.md.`
5. **Refit:** when both have reported, continue the E2b agent: `Run step 7 of your card (the refit) now; card T1a has landed.`
   **Session break (2026-11-13).** After the refit, run `npx tsc --noEmit 2>&1 | tail -3` and `npm test 2>&1 | tail -6`, commit, set STATE's `next:` to `v5.16 wave 6 (S2a + S2b)`, open the pull request and end the session. No screenshots and no critics here: the version still has one verify and one review round, in the next session.
6. **S2a + S2b.** `extra` for both: `Copy: docs/story/COPY-v5.16.md.`
7. **T1b.**
8. **U5.** Alone and last: it edits sizes in files that P1, S2a, S2b and T1b own.
9. Verify, commit, review, fix rounds.

Every card also gets: `extra: Carried notes: rows with your owner letter in <last v5.15 critic review file>`.

## Reviews
- r1: `critic` full effort; `storycritic` full effort on `src/content/scenes/**` and the new strings; `codecritic` full effort, range `<codecritic_range_start>..HEAD`, paths `src/engine src/store src/content/types.ts src/content/tuning.ts scripts/review/sim2.ts` (Julien locked this on 2026-10-30: the save migration gets a code review; the sim now carries the reward rules).
- r2, r3: medium re-checks of whoever was not satisfied.
- `audiocritic`: not run.

## Fix routing
| Owner | Cards |
| --- | --- |
| E | E0 (numbers, rewards, sim, offline rule), E2a, E2b; P1 for `features/service.ts` |
| U | P1 (strip, sheet, sidewalk row, drawer), S2a, S2b; U5 for tap-target sizes, text sizes and any layout finding |
| S | S2a, S2b; T1b for the managers' faces in the shop |
| T | T1a (text, rules, hire scenes), T1b (art, Scrapbook) |

## Defaults
- **Layers run in play time only**, are seeded and deterministic, and never re-roll on a clock or time-zone change.
- **Offline:** a layer's long-run average applies offline only where the review table says the layer is a pay rule (Uptown stars, University menu, Industrial night shift, the rival's 20%). Bursts (Game Day, boats, critic visits, jams) do not happen offline. The service tip and the cold line do not apply offline.
- **Rival challenge target:** `ceil(5 min × the shop's current pizza rate × 1.2)` pies in 5 minutes, instead of the review's fixed 2,000.
- **Refit targets:** story days within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8; no gap between scenes longer than 12 minutes of play; no check-in day without a scene; drones bought before `uptown-4` in the sim; plus card E0's session-1, manager and reward targets.
- **Save:** `SAVE_VERSION` 5 → 6 for the Todd rules. Feature slices migrate themselves. The economy marker goes 2 → 3 (card E0).
- **Julien's playtest 3 decisions (2026-11-13):** session 1 about 40 minutes with Suburbs at 16; from Waterfront on the manager arrives about a full day after the build; cash rewards cut 70 to 80%; service has consequences (+10% at 90% served, −10% after a minute under 60%); the red "buy this" frame goes after the tutorial and "Buy both" stays; the managers are Deb, Skip, Noor, Dee and Anton; the scrolling shop waits for v5.18.
- **Two rules that follow from those decisions.** A shop with all three heads and no manager earns at half speed while the player is away (`HEADS_OFFLINE_SHARE`, card E0). The cold line costs value, not demand, because thinner demand changes nothing while the kitchen is the limit (card P1).
- **Layout rule (Julien, 2026-11-13, DECISIONS #29 to #31).** A control is drawn at 44 pt or more, or at 40 pt or more with a `hitSlop` proven in `tap-targets.test.ts`; never under 40 pt. Text is 10 pt or more. The HUD's five round buttons stay 40 pt drawn. Verify's layout line must print 0 new findings; a note from a critic does not outrank this rule.
- **This version runs after the loop update** (`docs/build/v5.15-loop/`). If STATE's `last_shots` is not `v5.15-loop`, the loop update has not closed: stop and tell Julien.

## Not in this version
The shorter queue while the line is cold (`reportView`'s `queueShare`) is not drawn yet: it goes to the scene cards of v5.18 with the scrolling shop.

## Close
After APPROVED, set `codecritic_range_start` to this version's closing commit.
