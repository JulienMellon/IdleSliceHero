# v5.23b r1 critic review

```
VERDICT: NOT SATISFIED
SUMMARY: The cleanup landed: 16 of the 19 countable carried rows are fixed in the pixels, including the long-carried rival store (D481). The run is clean and every buy button is basil, flat no-gain, neutral or the allowed sidewalk Expand amber. Still open: wide shops cut off with no scroll cue (D519), a walk-out standing on the WELCOME mat (214), and four other minors, so the gate fails on the minor count.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $12)
BUGS:
- none
VISUAL DESIGN:
- D571 [minor] [214 (full size opened), and prev 187 / scene/walkout.ts spotOf] The customer at the door spot stands on the WELCOME mat and covers "OME". walkout.ts says the door customer "never stands on the mat", but the pixels show he does. He also smiles, with no frown bubble, while he is supposedly giving up. → Put the door spot at least 6 pt past the mat's far edge (mat rect from ladder.ts matRect). Add the walkers' standing spots to the Q8 protected test. Use mood "cross" while he is at the spot.
- D519 [minor, carried] [211, 213, 79, 81, 25-look-suburbs, 13] Wide Suburbs and Industrial shops are still cut at the screen edge: tables, diners and the "PIZZA BY THE SLICE" A-frame are sliced, and there is no scroll cue. Julien ruled that wide shops scroll, so the cue is the only fix left. → In scroll-cues.tsx, show a 24 pt chevron tab with a 0.6-opacity fade on the cut edge while the room's span passes [12, 381] pt.
- D572 [minor] [211, 76, 79, 05 (211 full size opened) / layers/rival/rival-scene.tsx] The rival store is whole now, but its sign and roof sit across the road lane. The purple MEGASLICE van drives behind the sign, so it reads "MEGASLICE MEGASLICE". It is a flat purple box: no shadow, no depth, and smaller than the cars around it. A jury would call it a sticker. Monument Valley gives every prop a lit face and a shadow face. → Seat the slab entirely on the near kerb below the lane. Add a 20% darker right face (2 pt) and a #000 18% contact shadow. Keep the rival's van out of lane 1 while the store is up.
DESIGN NOTES:
- D573 [minor] [187, 214, 183 / report-model.ts stripModel] In the "short drivers" state the strip says "Missed 0/min · Tips up" while a customer walks out in the same frame. The strip and the scene contradict each other. → Count a walk-out as a missed order in the strip's window, or drop "Tips up" while a walk-out is playing.
- D556 [minor, carried] [221b] The code has a flash and 6 coins, but the shot shows only Nonna's line. There is no basil flash, no coin and no cast reaction, and the README reward-moment rule wants the fixture shot taken mid-moment. → Shoot 221b about 150 ms after the line appears. Add a cheer pose for the cashier, like the head-rush bark.
- D564 [minor, carried, E, 64b same] "$1.04Qa" still unreadable.
- D570 [minor, carried, N, 206 same] The paid Starter still makes a value claim.
FUN AND RETENTION:
- [minor] Beating the rival removes the store completely (81: the band is empty afterwards). Monopoly GO! leaves the trophy on the board. → Keep the shuttered store with a "CLOSED · Rosa's won" card for the rest of the session. Tapping it replays the coin burst.
- [minor] The Missed-zero payoff is a strip line at the bottom edge (221b, 12, 81). Balatro would make the "perfect" moment the loudest thing on screen. → Raise the line as a 1.2 s banner over the shop, then dock it into the strip (see D556).
- Return and next goal are healthy: there is an offline oven with "2 h of 4 h" (07), a gift box with pips (05, 10), and the goal bar is always visible. D493 and D495 are parked, so they are not raised here.
FIXED SINCE LAST REVIEW: D562 (178e, toast below the tabs), D557 (215, no stack; 216 has a stack), D550 (16, basil Expand · $500), D551 (189, 191, one "a→b" format), D552 (214/137: walk-out body shows; 189/216/36: idle drivers by the door, apart from the line), D553 (221, 211: ink "no manager"/"you run it", halo only on the visited Waterfront), D554 (133, "· Word's spreading"), D547 (220d, 178i: gold outline on the rival band), D544 (178f/220e: tick badge at the bar's right end; ribbon 900 ms + fades, about 1.4 s), D545 (220, 179b: Nonna's line and portrait), D542 (179b: the hand sits under "Next: Chapter 2"), D535 (220b: SVG clapper and gem, one lock glyph), D537 (220b, 176: "6/6 · holding" with a full bar), D538 (220c: "New scene · Daily tasks open"), D540 (221 map pin "Opens after Ch 8"; 05b chip), D481 (13, 76, 79, 156, 211: about 60 pt store, whole, above the home indicator)
STILL OPEN FROM LAST REVIEW: D519, D556, D564, D570; parked D493, D495
```

## Focus answers
- **Carried rows:** the verdict for each row is in FIXED and STILL OPEN above.
- **WELCOME mat and door:** I checked all 183 changed and new shots with a bottom-band contact sheet. The mat is whole and the door is clear in every shop shot except 214, where the walk-out stands on the mat (D571). The full-size shots I opened were 214, 211 and 216 (crops).
- **Buy-button colours:** every buy is basil, the flat no-gain look or the neutral look. The only amber is the sidewalk's single-cap Expand (34, 35, 65, 70), which D407 allows. The drawer's Expand is basil (16).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D571 | minor | S | 214 / scene/walkout.ts spotOf | Door customer stands on the WELCOME mat and smiles; move the spot 6 pt past the mat, frown, add to protected test |
| D519 | minor | U | 211, 213, 79, 25-look-suburbs / scroll-cues.tsx | Wide shops cut at the edge with no cue; 24 pt chevron and edge fade while the room overflows |
| D572 | minor | S | 211, 76, 79 / rival-scene.tsx | Rival store straddles the road, the van runs behind its sign; seat it on the kerb, add a side face and a shadow |
| D573 | minor | U | 187, 214 / report-model.ts | Strip reads "Missed 0/min · Tips up" during a walk-out; count walk-outs as missed |
| D556 | minor | U | 221b / report-strip.tsx, fixture | Pixels show only the line; shoot mid-flash, add a cashier cheer |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter shows "≈ $58.5M at your pace", a value claim; use "Double income for a full day". needs-owner |
| D493 | parked | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | parked | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G123, D574
