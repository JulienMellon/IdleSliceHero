# v5.18 review r1 (critic)

Scope: `--only 106_t2,140_v2`. All 20 shots are `new`, and there is no `prev/`. I looked at every half-size shot. I opened full-size 116 and 145, plus crops of 109 (sky), 116 (back wall) and 143 (queue). `report.json` has `loaded: false` because 00_boot was not run, and `errors: []`. No reference images were needed.

```
VERDICT: NOT SATISFIED
SUMMARY: The Boston pack and the wide shops both run, and the mirrored plan, the cues and the franchise sheet do what the cards ask. But Boston reads as a re-skin of Port Marinara: the same map, home-city shop art and clone cut-scene bodies. The franchise payoff screen is mostly empty red.
BLOCKERS:
- none (loaded:false is a side effect of the --only run, not a load failure)
BUGS:
- G109 [109, 111, 115 / engine/cutscene-input.ts sceneHeading] The heading capitalises the slug, so it reads "North-end · Act 1" and "Back-bay · Interlude" → use the neighbourhood display name ("North End", "Back Bay").
- G110 [115 / name-tag prop text] "TRISH VANCE · REGIONAL VP" wraps with the "·" starting line 2 → break before the separator (drop it at a line break) or put the title on its own line.
- G111 [145 / scroll-cues.tsx] The right-edge "Tap" cue (x 342-393) overlaps the jam wrench (x 310-350). Two 44 pt targets share pixels, and the cue covers the jammed oven → keep cues 8 pt clear of on-screen tappables, or nudge the cue vertically. Also, the fixture's jam is on screen, not off screen as card V2 asks.
VISUAL DESIGN:
- D506 [major] 107 franchise moment: below Rosa's bubble, about 450 pt of flat #8E2018 is empty. There is no burst, no star count-up, no Boston teaser. It is the biggest moment in the game and it plays as a 700 ms fade. *Monopoly GO!* turns every milestone into a confetti, count-up and stamp sequence. Fix: count the star up from 0 to 10 with a pop per star, add an SVG confetti or slice burst, and put a postcard of Boston's skyline (the six signature objects) under the bubble with "6 new neighbourhoods" above the CTA.
- D507 [major] 108 Boston City screen: the map is Port Marinara's geometry: the same grid, pond, piazza, lake and pier (`city-map.tsx` paths are fixed). A new city should look new. *Monument Valley* never reuses a silhouette between chapters. Fix: give each city its own map data (Boston: the Charles as a river along the top, a curved Fenway block, a brownstone grid) and pick a tint per city.
- D508 [major] 116 Boston shop (Fenway): the live storefront wears home-city art: a purple University awning, a purple steeple in the window and the skyline, and no light towers, pennants or green-monster wall. The `BostonWindow` and `BostonObject` art exists in `backdrop.tsx` but only cut-scenes use it. Fix: route the Boston hood ids to their window and wall objects in the storefront, and give each one its own awning colour from `data.ts`.
- D509 [major] 109-114 cut-scene characters: all six Boston leads share one bust: the same sausage arms, the same thumbs-up and the same torso blob. Only the head and colour change. Kayla reads as a boy. Preston has no blazer or tie, although Victor's suit bust exists (115). Father Dom has no clerical collar. *Is This Seat Taken?* sells each character with one prop or silhouette. Fix: one silhouette detail each: collar tab (Dom), ponytail and bar towel (Kayla), blazer, tie and pocket square (Preston), stadium vendor tray (Manny), coat lapels and goggles (Ko), cardigan and pearls (Bea).
- D510 [minor] 109-114 cut-scene sky, top right: a white blob with sky-coloured circular bites behind the skyline reads as a broken cloud. Fix: draw the cloud as a union of circles in one fill, or remove it.
- D511 [minor] 143, 145 wide shops: the shop sign is clipped by the screen edge ("Rosa's · Downtown" at the left, "Rosa's · Industrial" at the right). Fix: clamp the sign's x to the visible viewport, with 12 pt margins, while scrolled.
- D512 [minor] 145: the jam bubble "Oven jammed! Tap the wrench" is clipped at x 393 ("wrencl"). Fix: clamp the bubbles inside the viewport, like the caption.
- D513 [minor] 143 Flagship rush: the walk-in queue runs through the dining room in front of the seated diners, and three identical red-cap drivers stand side by side. Fix: route the queue along the counter's front, and offset driver cap and skin seeds in lines.
- D514 [minor] 146 cold line: the one queued guest stands on the sidewalk with her body hidden behind the report strip, and nothing in the scene says "cold". Fix: queue inside the door, and add a pale-blue tint or frost puffs over the oven while cold.
DESIGN NOTES:
- D515 [minor] 143, 145 cues: the labels "Slammed" and "Tap" don't say where they lead. Fix: name the station ("Ovens slammed", "Prep table").
- D516 [low] 108: "1 with managers" → "1 with a manager".
FUN AND RETENTION:
- D506 again (the moment) [major]: the franchise is the "one more run" beat. *Balatro* makes a new ante feel like a jackpot, and here the multiplier ×1.0 → ×2.0 is only body text.
- D517 [minor] 108 first look at Boston: there are five locks and "???", and Southie costs $589M with no visible cash. Show the starting cash and a first Boston goal under $1 min away. *AFK Journey* opens each new chapter with a gift chest.
- Positive carry: 116 has a goal bar, the Game Day timer, the night oven (4 h) and the gift box, so a reason to return is visible.
FIXED SINCE LAST REVIEW: n/a (none of the open notes' shots were in this run)
STILL OPEN FROM LAST REVIEW: D481, D493, D495, D505
```

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G109 | bug | E | 109, 111, 115 / cutscene-input.ts | sceneHeading capitalises the slug ("North-end"); use the neighbourhood display name |
| G110 | bug | T | 115 / name-tag prop text | "· REGIONAL VP" wraps with the separator leading; break before it and drop the dot |
| G111 | bug | U | 145 / scroll-cues.tsx | Right cue overlaps the jam wrench target; keep cues 8 pt clear of on-screen tappables |
| D506 | major | U | 107 / franchise/flow.tsx | Empty red payoff; star count-up, confetti burst, Boston postcard teaser under Rosa's bubble |
| D507 | major | U | 108 / city-map.tsx | Boston reuses Port Marinara map geometry; per-city map data (Charles river, Fenway block) and tint |
| D508 | major | S | 116 / storefront | Boston shops wear home-city art (University steeple, purple awning); use BostonWindow/BostonObject and per-hood awning |
| D509 | major | T | 109-114 / portrait.tsx | Six Boston leads share one bust; give each one silhouette prop (collar, ponytail, blazer, tray, lab coat, pearls) |
| D510 | minor | T | 109-114 / backdrop sky | Broken cloud blob with sky-coloured bites top right; single-fill circle union or remove |
| D511 | minor | S | 143, 145 / wide shops | Shop sign clipped at the screen edge when scrolled; clamp it to the viewport, 12 pt margin |
| D512 | minor | S | 145 / scene bubbles | Jam bubble clipped at x 393; clamp bubbles inside the viewport |
| D513 | minor | S | 143 / rush queue | Queue cuts through the dining room, clone drivers adjacent; route along the counter, vary seeds |
| D514 | minor | S | 146 / cold line | Guest hidden behind the report strip, no cold visual; queue inside the door, frost tint while cold |
| D515 | minor | U | 143, 145 / scroll-cues | Cue labels "Tap"/"Slammed" are vague; name the station |
| D516 | low | U | 108 / city.tsx | "1 with managers" → "1 with a manager" |
| D517 | minor | E | 108 / Boston start | First Boston goal not visible; show cash and a goal under one minute away |
| D481 | minor | S | 13, 76, 05 / layers/rival | MegaSlice store sits on the asphalt, 45 pt; put it on the far kerb at about 60%, shutters visible |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | First 20 s ends at $0, first goal $400; first goal under $50, pops on first serves |
| D505 | minor | U | 81 / banner vs recipe card | Dale banner covers recipe card title; queue the banner after the card or move it below the goal strip |

Next IDs: G112, D518
