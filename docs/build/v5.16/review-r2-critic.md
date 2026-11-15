# Review v5.16-r2 (critic, medium re-check)

VERDICT: NOT SATISFIED
SUMMARY: The scrapbook crash, the stacked banners, the zones strip and the night wash are fixed in pixels, and the goal chip now shows an affordable card. Two scene-art majors remain: the MegaSlice store is still cropped under the road, and the waterfront boat is still clipped at the left edge.

report.json: loaded true, errors [], no failed interactions.

Shots opened: 06, 13, 76, 83, 75, 85, 84, 139b, 79, 60, 137, 12, 77, 72, 37, 62, 05 (all half size review PNGs; no full-size opened).

BLOCKERS:
- none (G104 fixed: 06 renders the Scrapbook, and `app/scrapbook.tsx:51` now uses `{/* D476 ... */}`)

BUGS:
- none open. G105 fixed (gift sits over the sky, no banner collision in 12, 60, 84). G106 fixed (139b rows read "Hired", manager row priced). G107 fixed (84 "1 drone up").

VISUAL DESIGN:
- D481 [major] still open. 13, 05, 60, 76, 79: the MegaSlice store is cut off by the bottom edge, so only the sign and shutter top show. Draw it whole at about 60% on the far kerb.
- D482 [major] still open. 76, 37: the boat is cut by the left edge at sea, and the rack sign still sits on the right. Move the boat inboard so the whole hull and sail show.
- D489 [minor] still open. 79, 85: the gift is half off-screen at the left. Clamp x to 8 pt or more.
- D475 [minor] still open. 72: the "6d 4h" tag sits on the cashier's head beside Nonna's bubble. Centre "Nonna · 6d 4h" on Nonna.
- D487 [minor] still open. 77: "Night oven: holds / 8 h" still orphans the "h". Use a non-breaking space.
- D465 [minor] still open. 62: "Rush: 30m left" still wraps to 2 lines. Use "Rush in 30m".
- D471 [minor] carried. 13: the report strip still sits over the Flagship's front wall base. The mat is now visible, so the strip no longer hides it, but it covers the bottom edge of the door.
- D490, D491, D493, D495, D450, D462, D478 [minor] carried. Their shots are unchanged or noted, and I did not re-check them.

DESIGN NOTES:
- D479 fixed in pixels. The report strip is now a one-line pill above the sidewalk with P/O/C/In initials and a state word, and the WELCOME mat shows in 13, 75, 85. D492 is fixed with it.
- D480 fixed in pixels. 60 shows one banner in the sky band, the roof and sign are clear, and the rival card no longer stacks (79).
- D485 fixed. 83: the zones list is inside Priya's Menu sheet, and the dining room is clear in 84.
- D486 fixed ("580 / 2.89K pies" in 60). D488 fixed (green subtitle in 139b and 77).
- D494 fixed. The goal chip shows an affordable card ("Vans +$11.2K/s tap!", "Cars +$241/s", "Hanging ferns tap!"), and the manager goal is a second line.

FUN AND RETENTION:
- [minor] D483 mostly fixed. 75 shows five seated diners and the "Fill every seat!" banner, a clear change from 74, but there is no confetti or family group at the door. Monopoly GO! pays a rush off with a burst, so add 6 confetti dots at the door.
- [minor] D484 fixed. 85 now reads as night with a moon and visible faces. A warm window glow would finish it.
- [minor] D493 and D495 still open: session 1 still shows MegaSlice at once (03, 05), and the first 20 s still ends at $0 (report: `cash_after_play` $0).

FIXED SINCE LAST REVIEW: G104, G105, G106, G107, D479, D480, D483, D484, D485, D486, D488, D492, D494

STILL OPEN FROM LAST REVIEW: D481, D482, D489, D487, D490, D491, D493, D495, D471, D475, D450, D462, D465, D478

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D481 | major | S | 13, 05, 60, 76, 79 / layers/rival | MegaSlice store cropped under road; draw it full at 60% on the far kerb, shutters visible |
| D482 | major | S | 76, 37 / layers/waterfront | Boat clipped at left edge; dock it inboard at sea, rack off the sign |
| D489 | minor | U | 79, 85 / floating-bonus | Gift half off-screen left; clamp x ≥ 8 pt |
| D487 | minor | U | 77, 78 / drawer card | Orphan "h" in "holds 8 h"; non-breaking space or "Night oven · 8 h" |
| D490 | minor | T | 92–94, 97, 138 / portrait.tsx | Only two arm poses reused; add point, clipboard and salute poses |
| D491 | minor | S | 03, 04 / scene traffic | MegaSlice van shows before the rival exists; spawn it only while the rival is open |
| D493 | minor | E | 05 / layers pacing | Session 1 meets every layer at once; open the rival after Suburbs ★2 |
| D495 | minor | E | 04 / tuning | First 20 s ends at $0; first goal under $50, plus pops on first serves |
| D471 | minor | S | 13 / ladder.ts | Strip still covers the Flagship door base; recheck vans |
| D475 | minor | S | 72 / scene/cameo.ts | Tag "6d 4h" and bubble cover the cashier; "Nonna · 6d 4h" centred on Nonna |
| D450 | minor | S | 46 | "4 waiting" pill touches the umbrella; put the pill on the sill |
| D462 | minor | U | 64b / app/shop.tsx | "2× 1h0m" → "2× income · 1 h"; empty-shelf art below the list |
| D465 | minor | U | 62 / event-chip.tsx | "Rush: 30m left" on 2 lines → "Rush in 30m", one line |
| D478 | minor | U | 61, 81, 136 / endgame/recipe-reveal.tsx | Reveal card hides the kitchen; anchor it in the sky band, top ≈ 200 pt |

Next IDs: G108, D496
