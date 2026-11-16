# v5.17 — critic review r1 (full effort)

Reviewed: `screenshots/v5.17/review/` (13 new, 77 changed, 53 same) against `prev/`; `report.json` (loaded, 0 errors, cash after play $0, earned 24). Looked at all 13 new shots and 27 of the 77 changed ones; the other 50 changed shots were judged from a pixel diff against `prev/` (their differences sit in the sky strip, y 185–350, where the golden pizza now waits or is clamped) and not opened. Full-size opened: `03-new-game.png`. No reference JPGs opened. Code read: `store/starter-sheet.tsx`, `store/claim-sheet.tsx`, `store/ad-button.tsx`, `store/ad-model.ts`, `rewards-ui.tsx` (gift actions), `endgame/stack-model.ts`.

```
VERDICT: NOT SATISFIED
SUMMARY: The money build loads clean and its plumbing is honest (no placeholder prices, "Not now" as big as "Buy", one sky event at a time, the golden box now stays on screen), but the paid surfaces look like system alerts, and the Starter Pack sheet ships with its icon off-centre. One bug, one major and a tail of minors, eight of them new.
BLOCKERS:
- none
BUGS:
- G108 [103 / store/starter-sheet.tsx] The gift icon sits at the card's top-left while the title, blurb and buttons are centred (`modal` has `alignItems: 'stretch'`, the icon has no `alignSelf`) → icon centred above "Starter Pack".
VISUAL DESIGN:
- D496 [major] 103, 101, 102 — The only screens that ask for money are the plainest in the game. The Starter sheet is a 56 pt stock gift icon and one grey sentence: the Founder awning it sells is never drawn, and the three contents are not shown as things. The Store tab is five identical white cards with a flat blue (#2D8FD9) button that appears nowhere else in the palette; Starter Pack and Nonna's Plus carry no more weight than "80 diamonds". Monopoly GO! draws every offer as its contents on a shelf with one ribbon. Fix: on the sheet, a 200 × 90 SVG hero of the red-and-white Founder awning over the shop door, then three chips in a row (diamond "150", bolt "2× 24 h", awning "Founder"). In the tab, Starter card gets a #FFC533 3 pt border and a "One time" corner ribbon; the Plus card uses Nonna's portrait in place of the star; buy buttons in the game's green (#3DAE5C, the Claim colour) so the page stays on palette.
- D497 [minor] 98, 99 — The "Task reward" card floats over the task list with no scrim: a cut-off "Deliver 100 pizzas" row above it and a stray "0%" below it. "Double it" does not say what doubling pays. Fix: `rgba(30,14,8,0.45)` scrim under the card; label "Double it · +$81.2K".
- D498 [minor] 30, 151 — The new progress pill repeats the label already inside the bar ("3 / 5" twice per row), is drawn as a grey disabled button, and its text size changes by row ("0 / 10" about 13 pt, "234 / 9.6K" about 10 pt). Fix: drop the label inside the bar, keep the pill, fixed 12 pt, cream fill #F3E6D0 with no bottom edge so it does not read as a button.
- D499 [minor] 152, 32, 33 — The last cell is now the largest, but it is titled "Day 30 prize" with a generic star: the card asked for a name. Fix: a name from content ("Nonna's Golden Oven") and a 36 pt gold-oven icon in place of the star.
- D500 [minor] 03 (full size) — "One instruction at a time" still has three cues in the first frame: a hand on the prep table, a second hand on the "×4" dough chip, and a dashed green highlight on Drivers. Fix: only the prep-table hand until the first pizza is rolled.
- D501 [minor] 56 — At Flagship shops the golden box and its wing sit on the rooftop pizza sign. Fix: cap the flight lane 24 pt above the roof sign's top when the shop has one.
- D503 [minor] 03, 04, 38 — The lone second tab reads "+ Suburbs / Nonna in 2.21K": a new player cannot tell 2.21K of what. Fix: "2.21K pies to go".
- Carried, checked in pixels and still open: D481 (13, 47, 149: MegaSlice store on the asphalt), D450 (46: "4 waiting" pill on the umbrella), D475 (72: "6d 4h" tag and bubble over the cashier), D462 (64b: lower 60% blank), D478 (61: reveal card over the hood and sign). Carried unchanged on `same` shots: D482 (76), D490 (92–94, 97, 138).
DESIGN NOTES:
- D502 [minor] 30, 33, 64b — Three of the five ad placements are in no shot: the daily reroll, the streak-save ad (33 shows only the 20-diamond repair; the button is in `rewards-ui.tsx:406` but the web stub reports no ad) and the shelf's free booster. They ship unseen. Fix: fixtures with the stub's ad-ready flag for all three.
- D504 [minor] 99 — A Nonna's Plus owner still gets the prompt and an extra tap on every claim. Fix: for Plus, pay double at once and show a 1 s "×2 · Nonna's Plus" stamp on the row.
FUN AND RETENTION:
- D495 [minor, carried] 04, 148 — First 20 s: cash $0, goal "$0 / $400", earned 24. The frame is calmer now (padlocked tabs gone), but there is still no first reward. Balatro pays a visible win inside the first hand. Fix as logged: first goal under $50, pops on the first serves.
- D493 [minor, carried] 05 — Session 1 still meets every layer at once (rival store, game-day chip, "-20% sales", night oven).
- (2) Always something to tap: yes. The one-at-a-time sky queue (149, 150) is a real gain; the offer chip shows its reward.
- (3)/(4) Session end and return: 100 has the away meter, the oven and a 2× button above "Open the oven"; it reads as a gift. Small: "2x earnings" uses a letter x where the store uses "2×".
- (5) New goal: always visible in every shot checked.
- The claim prompt on every task (98) is a cadence risk: Monopoly GO! celebrates the claim first and offers the extra after. Covered by D497 and D504.
FIXED SINCE LAST REVIEW: D489 (46, 47, 25-look-university: box and bubble fully on screen)
STILL OPEN FROM LAST REVIEW: D481, D482, D490, D493, D495, D475, D450, D462, D478
```

Not checked: 50 of the changed shots were not opened (diff only), so a regression outside the sky strip in those would be missed only if it is under the diff threshold. Native paths (real ads, purchases, tracking prompt) are not in the web shots.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G108 | bug | U | 103 / store/starter-sheet.tsx | Gift icon top-left, rest centred; add `alignSelf: 'center'` to the icon |
| D496 | major | U | 103, 101, 102 / store/** | Draw the Founder awning hero and three content chips; ribbon on Starter, Nonna on Plus; green buy buttons |
| D497 | minor | U | 98, 99 / store/claim-sheet.tsx | Add a 0.45 scrim under the card; label "Double it · +$81.2K" |
| D498 | minor | U | 30, 151 / rewards-ui.tsx | Progress shown twice; drop the bar label, pill fixed 12 pt, cream, not button-shaped |
| D499 | minor | U | 152, 32, 33 / rewards-ui.tsx, content/rewards.ts | Name the prize ("Nonna's Golden Oven"); gold-oven icon in place of the star |
| D500 | minor | U | 03 / index.tsx, sidewalk-row | Three cues in the first frame; show only the prep-table hand until the first roll |
| D501 | minor | U | 56 / floating-bonus | Golden box sits on the rooftop sign; cap the lane 24 pt above it |
| D502 | minor | U | 30, 33, 64b / fixtures/98_u3.py | Reroll, streak-save ad and free booster are in no shot; add ad-ready fixtures |
| D503 | minor | U | 03, 04, 38 / shop-ui.tsx | "Nonna in 2.21K" is unclear; say "2.21K pies to go" |
| D504 | minor | U | 99 / store/claim-sheet.tsx | Plus owners still get a prompt per claim; pay double at once with a "×2" stamp |
| D481 | minor | S | 13, 76 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D482 | minor | S | 76 / layers/waterfront | Boat is on the sand and touches the wall; float it on the sea band |
| D490 | minor | T | 92–94, 97, 138 / portrait.tsx | Only two arm poses reused; add point, clipboard and salute poses |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | First 20 s ends at $0; first goal under $50, plus pops on first serves |
| D475 | minor | S | 72 / scene/cameo.ts | Tag "6d 4h" and bubble cover the cashier; "Nonna · 6d 4h" centred on Nonna |
| D450 | minor | S | 46 | "4 waiting" pill touches the umbrella; put the pill on the sill |
| D462 | minor | U | 64b / app/shop.tsx | Lower 60% of the shelf is blank; add shelf art or an empty-state line |
| D478 | minor | U | 61, 81, 136 / endgame/recipe-reveal.tsx | Reveal card hides the kitchen; anchor it in the sky band, top about 200 pt |

Next IDs: G109, D505
