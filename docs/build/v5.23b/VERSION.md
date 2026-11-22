# v5.23b — the cleanup step: carried critic notes, and the loop fixes from the critic-log analysis

**Scope (Julien, 2026-11-22):** runs after v5.23 closes and before any v5.24 work. Two halves:
1. **Clear the critic's carry list.** Every critic row still open when v5.23 closes, by lane, including the long-carried D481 (the rival store) and D519 (wide shops clipping), which Julien wants fixed, not accepted.
2. **Fix the loop where the critic log shows repeat failures** (`docs/build/CRITIC-ANALYSIS-2026-11-22.md`, rounds 1 to 87): owner-required elements getting covered (the WELCOME mat, about 8 times), a buy-button colour rule that each new surface breaks, "fixed" claims that the pixels don't show, flat reward moments, details too small to read, and cheap minors carried for 4 or more rounds.

**Out of scope, moved to v5.25 (Julien, 2026-11-22):** all economy refit and pacing work, D493 (session 1 meets every layer at once) and D495 (first goal and first-minute pacing) included. No card here touches `src/content/tuning.ts`, `scripts/pacing-*.ts` or a story trigger threshold. Q7 makes the critic carry D493/D495 as `parked` until then.

**This version overrides the README in two places:**
- **No version bump.** Run README section 5 with `V=5.23` (APP_VERSION stays) and `L=v5.23b` (r2: `v5.23b-r2`, r3: `v5.23b-r3`), `P` = the `last_shots` v5.23 closed on.
- **Q7 changes the README itself.** It runs in the last wave, and its README changes apply from v5.24 on. The fix rounds of this version use README section 4.6 as it stands when the version starts.

## Carried notes
`CARRY` = the critic review file v5.23 closed on (STATE `reviews: critic:` at v5.23's close). Each programmer card reads only the `## Open notes` table at its end (`sed -n '/^## Open notes/,$p' <CARRY>`) and takes the rows with its owner letter, minus D493 and D495. Pass it as `extra: Carried notes: rows with your owner letter in <CARRY>`.

The cards list the rows that were open at v5.22 r2 (`docs/build/v5.22/review-r2-critic.md`) with their fixes. A row v5.23 fixed is gone from `CARRY`; skip it. A row v5.23 added with your owner letter is in scope too.

## Cards
| ID | Lane | What | Card |
|---|---|---|---|
| W6 | T | Two lines: Nonna's Chapter 1 story line (D545) and the report's reading rule (D555), plus any T copy row in `CARRY` | `card-W6.md` |
| S6 | S | The rival store drawn whole (D481), wide shops fit the screen (D519), the walk-out and idle drivers apart (D552), no dough stack when balanced (D557) | `card-S6.md` |
| U7 | U | Shop-surface minors: Expand tone (D550), capacity line (D551), red labels (D553), strip suffixes (D554), Missed-zero payoff (D556); a test that keeps buy colours in `buttonTone` | `card-U7.md` |
| U8 | U | Story-tab and coach minors: D535, D537, D538, D540, D542, D544, D545, D547, and landing W6's lines | `card-U8.md` |
| Q8 | scripts + S | The protected-element check: the WELCOME mat, the door and the staff faces are never covered, as a scene test and a layout-probe kind | `card-Q8.md` |
| Q7 | docs | Loop rules: fix claims name their shot, cheap minors first, parked notes, the reward-moment recipe, the 6 pt floor, the variety check | `card-Q7.md` |

## Waves
1. **W6 ‖ S6.**
2. **U7 ‖ U8.** Their files don't overlap: U7 owns the sidewalk, drawer, shop tabs, City list and map, and `report/**`. U8 owns `rewards-ui`, `rewards-model`, `coach/**`, the goal bar and ribbon in `game-ui.tsx`, the shop chips in `app/index.tsx`, and `src/content/copy/home/tutorial.ts` plus the file that holds the chapter story lines. U7 owns `src/content/copy/home/report.ts`. Both need W6's lines.
3. **Q8** alone. It runs after S6 and U7 so it measures their final layout; it shares `storefront.tsx` with S6.
4. **Q7** alone (docs only).
5. **Verify** (README section 5 with the overrides above), plus the check that `layout.json` has no new `cover` findings (Q8's kind). Commit, review.

## Reviews
- r1:
  - `critic` at **full**. Extra line: `Focus: verdict on every row of the carried table (fixed in pixels, or still open with the shot). Is the WELCOME mat whole and the door clear in every shop shot? Is any buy button coloured other than basil, the flat no-gain look or the neutral look? D493 and D495 are parked until v5.25: carry them, don't count them.`
  - `codecritic` at **medium**, paths `src scripts`, session's model.
  - `storycritic` at **low** on `docs/story/COPY-v5.23b.md`.
- r2, r3: medium re-checks.

## Fix routing
| Owner | Cards |
|---|---|
| S | S6, Q8 (a protected-element failure in the scene) |
| U | U7 (sidewalk, drawer, tabs, City, report strip), U8 (Story tab, coach, goal bar, chips) |
| T | W6 (copy), U8 (where the copy lands) |
| E | none planned. An E row in `CARRY` goes to a programmer with U8's prompt shape and the row's own file. |

## Defaults
- **Tone of a buy button:** `basil` when it adds income, the flat `nogain` look, or `neutral` (muted / unmanaged). Amber stays only on the sidewalk's single-cap Expand (D407). Red (`tomato`) is only for the bottleneck the report names, never on a label that sells something.
- **Protected elements:** the WELCOME mat (`matRect`), the entrance (`doorRect`), and the faces of the staff at their stations. "Covered" means more than 10% of the rect lies under another opaque element that isn't a walker passing by. A moving walker is the crowd budget's job, not this check's.
- **Missed-zero payoff (D556):** once per shop per session, after Missed has been 0 for 10 s: a 0.6 s basil flash on the strip, 6 coins from the strip to the cash, and Nonna's line from `COPY-v5.23b.md`.
- **Rival store (D481):** drawn whole inside the safe area, at about 60 pt wide, on the far-kerb pavement band, with shutters visible (down while the rival is beaten).
- **Wide shops (D519):** at the widest footprint the cutaway fits 393 pt with a 12 pt margin on each side. Scale down (not below 0.88×) before scrolling.

## Close
README section 8 with `V=5.23b`. Report: verdicts, how many carried rows closed, the `cover` count, and what is still open. Set STATE to `version: 5.24`, `step: waves`, `round: r1`, then stop.
