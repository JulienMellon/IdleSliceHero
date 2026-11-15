# v5.16 r1 — critic

Shots opened at full size: 72, 76, 81, 85.

```
VERDICT: NOT SATISFIED
SUMMARY: The v5.16 systems are all on screen (shop report, layers, the rival, Todd's interludes), and the new cut-scene art is the best in the game. But the Scrapbook renders a source comment as text, which is a red-screen crash on a native build, and the report strip plus up to three stacked banners now bury the storefront, so the scene no longer reads as one clear idea.
BLOCKERS:
- B1 (G104) [Scrapbook, 06/55/63/95; src/app/scrapbook.tsx:51] A JSX `// D476: …` line sits as raw text inside a <View>; the web build prints it in a serif font, and React Native on iOS throws "Text strings must be rendered within a <Text> component". → wrap it as {/* … */}.
BUGS:
- G105 [12, 75, 81] The golden gift and its "A gift, caro. Tap it!" bubble are drawn over the rival and Dale banners ("Showdown", "balloons" unreadable). → park the gift below the lowest banner, or hide it while a banner is up.
- G106 [137, 139b; shop-ui.tsx:94, app/index.tsx:242] With all three heads hired, the tab still says "you run it" in tomato and the HUD shows "Baking…" instead of a rate. → key on runsItself: show $/s plus "heads run it".
- G107 [84] The HUD chip reads "1 drones up". → pluralise: "1 drone up".
VISUAL DESIGN:
- D479 [major] [every shot after the tutorial: 34, 41, 72, 130…] The shop-report strip (≈45 pt) covers the front wall, the WELCOME mat (owner-required), the A-frame and the bike. Compare 03, before the strip appears. → dock the strip under the HUD goal bar, or shrink it to a 28 pt pill above the sidewalk row; the mat must stay visible.
- D480 [major] [13, 49, 60, 75, 76] The rival's "Start" card sits on top of the scene in almost every Suburbs/Waterfront/Industrial shot, stacked with order, challenge or layer banners: two or three cards over the sky, the roof and the Flagship's pizza sign. The jury reel for *Is This Seat Taken?* shows one idea per frame. → one banner slot at a time; collapse the rival offer into a 40 pt HUD chip after the first view.
- D481 [major] [36, 76, 79–81] The "across the street" MegaSlice storefront sits below the road, cropped by the bottom edge, so only its sign shows; the win moment (81, shutters down) is invisible. → draw it full, at ≈60% scale, on the far kerb behind the traffic lane (y ≈ 760–800 pt), with a coin burst on the shutters.
- D482 [major] [76] The docked boat is a ≈60 pt sliver clipped by the right edge, behind the PIZZA blade sign; the warming rack covers "PIZ" of the PIZZERIA window. → dock the boat left of the shop (x 0–70, y 330–380, the open sea); move the rack left of the register.
- D483 [major] [74 vs 75] The Game Day rush looks the same as the countdown: the same four diners plus green floor ellipses, and no family wave. → spawn two or three family groups at the door with pennants or foam fingers, make every seat full, add a confetti puff per seat.
- D484 [major] [85] Night shift is a flat #0B1E4A wash at 42% that greys every face and the ovens; it reads as a broken filter, not night. → tint the sky and backdrop only, keep the interior at full brightness with warm window light (#FFD58A), and add a moon and lit factory windows. *Alto's Odyssey* changes the time of day without dulling the figures.
- D485 [major] [83, 84] The University zones strip plus the report strip cover the whole dining room. → fold the zones into the HUD chip's sheet (82) and keep at most one strip on the scene.
- D486 [minor] [13, 36, 41] Challenge targets are unformatted: "793881 pies", "307944 pies". → use the K/M formatter, e.g. "794K pies".
- D487 [minor] [77, 78] "Night oven: holds 8 h" leaves an orphan "h" on line 2. → use a non-breaking space or the short title "Night oven · 8 h".
- D488 [minor] [05a, 77, 139b] The drawer subtitle prints good news ("Tips up 10%") in alarm red. → use basil green for the good states, red only for the bottleneck.
- D489 [minor] [05b, 37, 85, 130] The golden gift is parked half off-screen at the left edge, with "0/5" cut off. → clamp x ≥ 8 pt.
- D490 [minor] [92/93, 94/97/138] The cut-scenes reuse two arm poses: hands-up surprise and thumbs-up. → add a point, a clipboard hold and a salute.
- D491 [minor] [03, 04] A MegaSlice van drives past during the tutorial, before the rival exists, which spoils the reveal. → only spawn it while the rival is open.
- D492 [minor] [130, 131, 133] The report strip's four dots have no labels, and "tipping" shows no state word. → put P/O/C/In initials under the dots and always show the state word.
DESIGN NOTES:
- D493 [minor] [05, $3.9K] In session 1 the player meets Game Day, the rival's −20%, a challenge, the report and boats at once. → open the rival after Suburbs ★2, and give each layer its own first session.
FUN AND RETENTION:
- D494 [major] (5, goal) [37, 139b] The goal bar reads "Hire a manager $68.3K / $8.00B", a target 117,000× away. AFK Journey always shows the next reachable milestone. → when the gap is more than about 30 minutes of income, show the next affordable card (rack, decor) and keep the manager as a second line.
- D495 [minor] (1, first 60 s) The 20 s run ends at $0 (earned $24). Balatro escalates numbers from the first hand. → a coin shower plus "+$" pops on the first three serves, and the first goal under $50.
- (2) [minor] Each tap reads well (rings, pops, LUCKY SLICE ×4 in 47c), and the report sheet (134) finally gives real choices. Keep it.
- (3, 4) [ok] The return moment is a gift (53: coins, counting, +$8.43M), and timers abound (next boat, Game Day, critic in 83:17, night oven 4 h).
FIXED SINCE LAST REVIEW: D476 (the teaser fits one line, but see G104), D477
STILL OPEN FROM LAST REVIEW: D471 (the Flagship front is now hidden under the strip, so it cannot be verified), D475 (the tag still reads "6d 4h", and the bubble now covers the cashier's face), D450 (the "4 waiting" pill still touches the umbrella, 46), D462 (64b same), D465 ("Rush: 30m left" is still on 2 lines, 62), D478 (the recipe card still covers the kitchen, 61, 81, 136)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G104 | blocker | U | 06, 55, 63, 95 / app/scrapbook.tsx:51 | Raw "// D476" text in a View crashes on native; make it {/* */} |
| G105 | bug | U | 12, 75, 81 / floating-bonus | Gift and bubble drawn over banners; park below the lowest banner or hide while a banner shows |
| G106 | bug | U | 137, 139b / shop-ui.tsx, app/index.tsx | Three heads hired still say "you run it" and "Baking…"; show the rate when runsItself |
| G107 | bug | U | 84 / layers/university | "1 drones up" → "1 drone up" |
| D479 | major | U | 34, 41, 72, 130 / report strip | Strip hides front wall and WELCOME mat; dock under HUD or 28 pt pill above sidewalk |
| D480 | major | U | 13, 49, 60, 75, 76 / slots | Rival Start card plus stacked banners cover roof and sign; one banner slot, rival offer becomes HUD chip |
| D481 | major | S | 36, 76, 79–81 / layers/rival | MegaSlice store cropped below road; draw it full at 60% on the far kerb, shutters visible |
| D482 | major | S | 76 / layers/waterfront | Boat clipped at right edge behind sign; dock it left at sea; rack off the PIZZERIA sign |
| D483 | major | S | 74 vs 75 / layers/suburbs | Game Day rush looks unchanged; spawn family groups at the door, fill seats, confetti |
| D484 | major | S | 85 / industrial/night-tint | Flat navy wash greys the faces; tint sky only, warm interior windows, add moon |
| D485 | major | U | 83, 84 / layers/university | Zones strip plus report strip cover the dining room; move zones into the sheet |
| D486 | minor | U | 13, 36, 41 / challenge banner | "793881 pies" → "794K pies" |
| D487 | minor | U | 77, 78 / drawer card | Orphan "h" in "holds 8 h"; non-breaking space or "Night oven · 8 h" |
| D488 | minor | U | 05a, 77, 139b / drawer header | Good-news subtitle in red; green for good states |
| D489 | minor | U | 05b, 37, 85 / floating-bonus | Gift half off-screen left; clamp x ≥ 8 pt |
| D490 | minor | T | 92–94, 97, 138 / portrait.tsx | Only two arm poses reused; add point, clipboard and salute poses |
| D491 | minor | S | 03, 04 / scene traffic | MegaSlice van shows before the rival exists; spawn it only while the rival is open |
| D492 | minor | U | 130, 131, 133 / report strip | Unlabelled dots; add P/O/C/In initials and always a state word |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs ★2 |
| D494 | major | U | 37, 139b / goal-model.ts | Goal $68K/$8B unreachable; show next affordable card, manager as second line |
| D495 | minor | E | 04 / tuning | First 20 s ends at $0; first goal under $50, plus pops on first serves |
| D471 | minor | S | 13 / ladder.ts | Flagship front hidden by the strip; recheck the vans once D479 lands |
| D475 | minor | S | 72 / scene/cameo.ts | Tag "6d 4h" and bubble cover the cashier; "Nonna · 6d 4h" centred on Nonna |
| D450 | minor | S | 46 | "4 waiting" pill touches the umbrella; put the pill on the sill |
| D462 | minor | U | 64b / app/shop.tsx | "2× 1h0m" → "2× income · 1 h"; empty-shelf art below the list |
| D465 | minor | U | 62 / event-chip.tsx | "Rush: 30m left" on 2 lines → "Rush in 30m", one line |
| D478 | minor | U | 61, 81, 136 / endgame/recipe-reveal.tsx | Reveal card hides the kitchen; anchor it in the sky band, top ≈ 200 pt |

Next IDs: G108, D496
