# Critic log analysis: recurring failures, rounds 1 to 87

Sources: `docs/logs/CRITICLOG-archive.md` (rounds 1 to 60), `CRITICLOG.md` (round 61) and the 26 files `docs/build/v5.14` … `v5.22/review-r*-critic.md` (rounds 62 to 87). Each review was read in full. The counts below are from those texts plus a small ID-tracking script (`ids.py` in this folder).

## 0. Headline numbers

- **About 87 critic rounds, 11 SATISFIED.** The SATISFIED rounds are 14 (v1.5), 17 (v2.2), 37 (v3.6), 38 (v3.7), 53 (v5.5), 57 (v5.9), v5.17 r3, v5.19-test r1, v5.19 r2, v5.20 r3 and v5.22 r2.
- **Under the v5.14+ card loop, a version takes 2 to 3 rounds to pass or close.** r1 nearly always finds new bugs in the feature that just shipped. r2 and r3 converge.
- **About 73 "X → Y" reopen links in the archive.** Each is a note that came back under a new ID because the fix was partial or moved the problem.
- **By owner lane (v5.14+ tables):** U notes (screens) stay open 1.7 reviews on average. S notes (scene art) stay 3.0, T notes (story) 2.3 and E notes (engine/tuning) 4.5. E is inflated by the two parked notes. Scene art is the slowest lane to close.

---

## 1. Crowd overlap: the longest-running failure

People in the cutaway drawn on top of each other. This was the main reason for NOT SATISFIED from round 7 to round 50 and still recurs.

| Thread | Chain | Rounds |
| --- | --- | --- |
| Drivers clump into one body | G33 → G35 → G37 → G39 → G40 → G41 | 7 → 13 (7 rounds) |
| Kitchen vs dining width | G28, G42, G43 (ovens shrink to sticks) | 6 → 14 |
| Bakers fused into one row | D126 → D138 → D153 → D167 → D174 → D184 | 19 → 24 |
| Door / counter pile-up | D166 → G61/D179 → G62/D189 → G63 → G66 → G69 → D237 | 22 → 30 |
| Diners stacked | D114 → D154 → D181 → D188 → D199 → D207 → D258 → D266 → D275 | 18 → 34 |
| Walk-in vs baker | D255 → D264 → D274 → G72 | 31 → 34 |
| Walk-in vs driver at counter | D336 → D353 → D370 → D377 | 44 → 51 |
| Late echoes | D414, D416, D430, D431, D450, D513, D552 | 59 → 87 |

**Why fixes kept failing.** Each fix moved one figure or one lane by a few units, which moved the overlap somewhere else. The log says so in rounds 32 to 34 ("the counter lane moved the walk-in overlap instead of removing it").

**What finally worked:**
- In v1.4, a plan worked out from the floor geometry. The floor is 16 units deep and figures are 15 tall, so lanes must be at least 5 units apart.
- In v3.3, `buildCast()` plus `crowd.test.ts` with screen-space budgets.
- In v4.9, a budget that failed on 541 frames of the old code before the fix.

The CRITICLOG lessons already encode this. Notes that went through a geometry budget mostly closed within 1 to 3 rounds; the ad-hoc nudge chains above ran 4 to 9.

## 2. Space squeeze: a new element breaks neighbouring text

A new HUD, sidewalk or banner element is added without a layout budget, so text elsewhere clips or truncates. The fix then steals space from the next neighbour. The clearest chain, rounds 62 to 67:

> night-oven chip → goal bar clipped (G96) → diamond chip → goal bar clipped again (G98) → chip moved to top row → **cash itself reads "$8.4…"** (G101) → ×1/×10/MAX chip → **sidewalk prices read "$83…."** (G102) → mastery label "Next: Fla" (G98 again) → "Cars · +$83…" (D477)

Other members of this family:
- G49, G89, G117, D88, D409, D466 (truncation with "…")
- D270, D280, D317, D455, D476, D487 (orphan words, a "·" at the line end, "h" alone on a line)
- G21, G48, D489, D511, D512, D519 (cut by the screen edge; D519 is still open)

**Pattern:** every new chip has cost a clipping bug in the round after it shipped. The fix that held was fit-to-width text plus short forms of each label (v5.15 r3, `fit-model.ts`). A layout check on the HUD row and the goal bar would catch this before the critic does.

## 3. Something drawn over something important (z-order and placement)

- **The toast was moved 8 times in 15 rounds:** G5 → D30 → G32 → D56 → D60 → D63 → D68, then D271/D281 (content) and G94 (persisting across screens). Each spot it moved to covered something else.
- **Pops over faces or labels:** G11, G27, G31, D36, D347, D368, D410, D439, G91.
- **Banners and gift stacking:** G95 (open 7 rounds, 62 to 68: label on the toast, then on the sign, then on the order card, then on the Defend button), D480, G105, D505, D544.
- **HUD above sheets:** G118 / D543 (v5.21 r3). Raising one layer's zIndex broke every sheet.

**Root pattern:** each overlay picks its own position. There was no shared slot or queue until `slots.tsx` / `banner-state.ts` arrived around v5.16. After that, stacking notes drop sharply.

## 4. Owner-required elements removed or covered

The WELCOME mat is required by the owner and has been removed or hidden about 8 times:
- G54: removed outright (round 19)
- D118, D143, D232: removed, then repaired
- D260, D276: people standing on it
- D405: the Buy-both pill on it
- D456: the ×1/×10/MAX slab
- D479: the report strip

The same happened to the storefront door (G48, G53, G59, G63, G64, G69). Fixes in other lanes kept landing on top of these elements. A fixture or geometry test asserting that "the mat rect is unoccluded" would stop this permanently.

## 5. Dishonest UI: what the screen says doesn't match what happens

A thread from round 2 to round 87:
- **The bottleneck hint points the wrong way:** G4, G10, G29, D20, D21, D164, D281, D286/D287, G86, D521 (the tutorial taught an upgrade that the drawer then called "no gain now").
- **A green or bright button that adds $0/s:** G36, D42, D45, D46, D53, D86, D103, D263 (the `useless` prop was declared but never used), D272, D294, D313, D319, D320, D325, D351, G75, D550, D553.
- **The struck-through "no gain" price that players read as unaffordable:** D359, open 10 rounds (47 to 56) before D402 resolved it.
- **Numbers that lie:** G14 (HUD $/s higher than actual), G19, G30, G84 (boost not shown), G92 ("Capped" when not capped), G113 (5 💎 promised, never paid), G119 (Drivers bar can never reach the line), G90 (the queue doesn't track the count).

**Pattern:** this class keeps reappearing because a single visual rule ("green means adds income") has to be re-applied on every new surface: the sidewalk, the drawer, chips, Fleet, Expand, the store. It only stopped recurring once `buttonTone` became the single source (G75, v4.2). Every new button surface since then (D550's amber Expand, D553's red labels) has broken it again.

## 6. "Fixed" in the build table but not in the pixels

The critic marks a fix open if the screenshot doesn't show it. Cases where the build log claimed a fix that wasn't there:
- **D67:** the v1.5 table claimed the rush pill was fixed; the clamp centred it, so it still covered the menu.
- **G70:** "window ledge" drew no ledge, just two stools.
- **D450:** "has not changed by a single pixel". The r3 commit touched only STATE.md and a test.
- **D454:** the halo was drawn behind the dome, and the coins were drawn under the modal.
- **D105 / D132 / D141:** the entrance glass stayed invisible for 3 rounds.
- **D263:** a prop was declared but never used.
- **G113:** a reward was shown in the label but never paid.

**Fixture and harness gaps** that hid states from review: the early harness notes (rounds 4 to 10), D389, D422, D434, D467, G103 (a fixture silently broke when engine rule T85 changed), D459 (bark timing), D502 (3 ad placements in no shot).

## 7. Regressions caused by the previous round's fix

D50 → G38 (billboard), G39b → G40 (drivers walking on the wall), D54 → G42 (pickup strip shrank the dining room), G37 → G41, D202 → G65 → G68 (menu clamped on one side only), D241 → G71, D260 → D276, D150 → D154, G98 → G101/G102.

These are a minority of fixes, but they recur in every era of the log. Most were geometry changes made without re-running the whole crowd/layout suite. That is CRITICLOG lesson 4.

## 8. Sameness: clones and look-alike art

- **Characters:** G57 (the `lookFor` mod hashes made twins), G67, D112, D125, D139 (traits invisible), D156, D172, D187, D204, D208, D306, D337, D416, D513.
- **Art:** D75, D241, D362 (neighbourhoods look alike), D457 (24 recipe cards share 4 drawings), D490 (two arm poses), D507/D508 (Boston reuses the home city's map and shop art), D509 (six Boston leads share one bust).

This flares every time content is multiplied: a new city, a collection, a cast. The first round of each such feature has drawn a [major] here.

## 9. Too small to read at phone size

- Flour sacks: D169 → D185 → D193 (3 rounds, then removed)
- Kerchiefs: D337 (3 rounds)
- Worker traits: D139
- Plaque: D458 (8×12 pt)
- Rank pins: D459 (9 pt)
- Stand mixer: D222 → D226
- Fishing net: D242 → D246
- Piles and poses: D548, D549, D557

Detail drawn at 1 to 3 pt does not survive the critic's 1x review. The same applies on device.

## 10. Flat reward moments, since round 59 (the FUN AND RETENTION standard)

Every feature with a payoff shipped flat in its first round and drew a [major]:
- **Milestones and orders:** D415 (milestone), D436 (order success), D444 (lucky slice)
- **Return and endgame:** D447/D454 (return gift), D469/D478 (challenge win), D483 (Game Day), D506 (franchise)
- **Tutorial and goals:** D522 (oven upgrade), D530/D541 (tutorial and task completion), D556 (Missed = 0)

The critic cites Monopoly GO! or Balatro almost every time. The fix is always the same recipe: centre stage, count-up, coin burst to cash, the cast reacting, and no stacking on the scene's subject. That recipe can go into the feature card template.

## 11. Long-carried minors, and gate dynamics

Since round 18 (SATISFIED needs ≤ 3 minors), many rounds fail on minor count alone. Examples: rounds 27 to 33 (no majors, 7 to 8 minors each), v5.15 r3 (6), v5.16 r3 (10), v5.17 r2 (7), v5.18 r3 (6) and v5.20 r2 (4).

Notes that sit in the carry list for many reviews:

| ID | What | Open since | Status |
| --- | --- | --- | --- |
| D481 | MegaSlice store on the asphalt, cut by the screen bottom | round 68 (v5.16 r1) | open, ~20 reviews, S lane |
| D493 | Session 1 meets every layer at once | round 68 | parked by Julien |
| D495 | First 20 s ends at $0; first goal $400 | round 68 | parked by Julien |
| D519 | Wide shops clip at the screen edges | round 78 | open |
| D304 / D305 / D297 / Pier 9 chip | Banner reads as a label; locked Suburbs looks buildable; goal-bar label contrast | rounds 36 to 56 | closed in v5.8, after ~17 rounds |
| D302 | Empty sky above early shops | rounds 36 to 48 | closed |
| D450 | Patio "N waiting" pill on the umbrella | rounds 62 to 72 | closed |
| D465 | One copy string, "Rush in 30m" | 5 rounds | closed |

**Pattern:** fix rounds prioritise bugs and majors, so cheap minors ride along until they alone block the gate. D465 and D487 were one-line copy fixes that took 4 to 5 rounds. The two parked first-session notes (D493, D495) are the critic's most-repeated retention point (around 21 mentions). Every review re-flags them as first-minute problems.

---

## Recommendations, in order of payoff

1. **Clear cheap minors in r1.** Batch every copy, format and clamp minor into the first fix round of each version, not the last. Many gate failures were one-liners carried 4 or more rounds.
2. **Make the layout budgets cover the HUD and the overlays, not just the crowd.** Add tests that the goal bar, cash, rate and sidewalk prices never truncate at 393 pt, and that the WELCOME mat and door rects stay unoccluded. Patterns 2 and 4 would then fail in CI instead of in review.
3. **Keep one source for each visual rule.** `buttonTone` worked for "green means income". Every new button surface should go through it, and a lint/test can flag a raw basil, amber or tomato fill outside it (D550, D553).
4. **Check that a fixture reaches its state.** Each fixture should assert the testID it is meant to capture (G103, D459, D467), so a state can't silently disappear from review.
5. **Template the reward moment.** Put the "centre stage, count-up, coins to cash, cast reacts, nothing stacks" recipe into every feature card with a payoff. That pre-empts pattern 10's first-round major.
6. **Size floor for scene details.** No readable detail under about 6 pt at 1x (pattern 9).
7. **Decide on D481, D493 and D495.** Either schedule them or formally accept them with Julien, so they stop counting toward the minor gate and re-appearing in every review.
8. **Treat "multiply content" features as high-risk for sameness.** For a new city, collection or cast, review variety in the card itself, before the critic.
