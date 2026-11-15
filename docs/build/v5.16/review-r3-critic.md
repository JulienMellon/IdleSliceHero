# v5.16 r3 critic (medium re-check)

VERDICT: NOT SATISFIED
SUMMARY: report.json is clean (loaded, no errors). Both r2 majors are now minor: the MegaSlice store is fully drawn and the boat is inboard, but ten minors remain, which is over the three-minor gate.

BLOCKERS: none
BUGS: none

## Open-note check (shots opened: 13, 76, 79, 04, 05, 03, 46, 61, 62, 72, 77, 85, 64b; full-size crops of 13, 76, 79)

- D481 (was major) now minor. 13 and 76 show the MegaSlice store in full, with sign, awning, door and kerb base. It is about 45 pt wide and sits on the asphalt, left of the lane line, so it reads as a kiosk in the road. No shutters. Move it to the far kerb and scale it to about 60%.
- D482 (was major) now minor. The boat in 76 is whole and inboard (x 3 to 75 pt). It sits on the sand beside the palm, not on the water, and its hull touches the shop wall. Move it up to the sea band, around y 345.
- D489 still open. In 46 the "A gift, caro. Tap it!" bubble and the gift are half off-screen left, x about -10 to 30 pt. Clamp x to 8 pt or more.
- D487 fixed. 77 reads "Night oven · 8 h" on one line.
- D465 fixed. 62 reads "Rush in 30m" on one line.
- D462 partly fixed. 64b now says "2x income · 15 m" and "2x income · 1 h". The lower 60% of the screen is still blank cream with no shelf art or empty-state line.
- D491 fixed. 03 and 04 show no MegaSlice van before the rival exists.
- D471 fixed. The Flagship door base and mat in 13 are clear of the road strip.
- D495 open. 04 still ends at $0 against a $400 goal, with "Ovens: need $12" as the only feedback.
- D493 open. 05 shows the rival store, Game Day chip, Waterfront tile and unlock tiles together in session 1.
- D490 carried (138 noted, pixels unchanged). Arm poses are still two.
- D475 open. 72 still shows the "6d 4h" tag and Nonna's bubble over the cashier.
- D450 open. 46 shows the "4 waiting" pill touching the umbrella.
- D478 open. 61 shows the New Recipe card covering the kitchen from y 185 to 380.

## VISUAL DESIGN
- D481 [minor] See above.
- D482 [minor] See above.
- D475, D450, D478 [minor] Still open, see above.
- D490 [minor] Carried.

## DESIGN NOTES
- D493 [minor], D495 [minor]: see above. The first 20 s still ends at $0.

## FUN AND RETENTION
- D495 [minor] Balatro pays out in the first 10 s. Here the first 20 s ends at $0, with the first goal at $400. Fix: first goal under $50, and pop coins on the first serves.
- D493 [minor] Session 1 meets every layer at once (rival, Game Day, Waterfront). Open the rival after Suburbs 2 stars, as AFK Journey does.

FIXED SINCE LAST REVIEW: D487, D465, D491, D471 (D481 and D482 downgraded from major; D462 partly)
STILL OPEN FROM LAST REVIEW: D481, D482, D489, D490, D493, D495, D475, D450, D462, D478

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D481 | minor | S | 13, 76 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D482 | minor | S | 76 / layers/waterfront | Boat is on the sand and touches the wall; float it on the sea band |
| D489 | minor | U | 46 / floating-bonus | Gift and bubble half off-screen left; clamp x to 8 pt or more |
| D490 | minor | T | 92–94, 97, 138 / portrait.tsx | Only two arm poses reused; add point, clipboard and salute poses |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04 / tuning | First 20 s ends at $0; first goal under $50, plus pops on first serves |
| D475 | minor | S | 72 / scene/cameo.ts | Tag "6d 4h" and bubble cover the cashier; "Nonna · 6d 4h" centred on Nonna |
| D450 | minor | S | 46 | "4 waiting" pill touches the umbrella; put the pill on the sill |
| D462 | minor | U | 64b / app/shop.tsx | Lower 60% of the shelf is blank; add shelf art or an empty-state line |
| D478 | minor | U | 61, 81, 136 / endgame/recipe-reveal.tsx | Reveal card hides the kitchen; anchor it in the sky band, top about 200 pt |

Next IDs: G108, D496
