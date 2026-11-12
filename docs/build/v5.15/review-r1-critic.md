# v5.15-r1 — critic review r1 (round 65)

```
VERDICT: NOT SATISFIED
SUMMARY: The endgame is in and mostly works: the mastery goal bar, stars on tiles and the map, Boston, the attack banner and challenge chip, events, recipes, the vanity shop, cosmetics, barks and Nonna's cameo all render, and the return gift now spills coins from the oven. But the new HUD chip clips the goal bar on almost every screen, and the ×1/×10/MAX slab covers the WELCOME mat. Two cosmetics can't be seen (neon sign, master plaque), Nonna hides behind the box stack, and the new reward moments (challenge won, recipe drop) are flat strips.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $6)
BUGS:
- G95 [50, 59, 60 / bonus.ts laneY, floating-bonus.tsx] Still open, and now worse in 50: the gift and its label are drawn on top of Dale's success card and cover "That's a W… owe you big". In 59 and 60 the attack banner and the challenge chip cover the gift; only the 0/5 pips peek out → hold the gift while any BANNERS/order card is up, or give it the sky lane below the card.
- G97 [56, 59–62, 13, 14, 68 / star-pips.tsx] The selected city tile is #FFC531, and so are lit stars, so they vanish: Suburbs shows ☆☆☆ in 56 but ★★★ on the City map (57) → on the selected tile, draw lit stars #E08A00 with a white 1.2 pt stroke, or give every pip an ink outline.
- G98 [05, 14, 15, 50, 56, 62, 67, 69, 05b2 / app/index.tsx goal bar] Adding the diamond chip took about 55 pt from the goal bar. Now every goal clips: "Waterfront: hire Finn (", "Expand Uptown · Re…", "Upgrade fleet to Vans · +$4…". The mastery hint loses its point: "Next: Flagship in" with no shop (56), and "Next: I" when the event chip is also up (62). In 05b2 "Upgrade" touches the bar's left edge → move the diamond count into the top row beside the gift, or stack moon and diamond as 2×34 pt; shorten the mastery label to "★10/18 · Flagship: Waterfront".
- G99 [67 / scene/cosmetics.ts neonSpot] The neon counter sign is drawn in the slot behind the menu chalkboard. Only a ~6 pt magenta hook shows at its right edge, so a 150-diamond item can't be seen → hang it in front, over the register (≥ 40×14 pt), drawn after the menu board.
- G100 [72 / Nonna cameo] Nonna stands behind the pizza-box stack on the counter: only her grey bun and one ear show beside the boxes. The "6d 4h" tag floats over nobody (full-size crop) → stand her in front of the counter's left end, facing the room, and add a crowd budget so the box stack can't hide her.
VISUAL DESIGN:
- D456 [major] 05, 14, 56, 65, 66, 68 — The ×1/×10/MAX slab (≈140×44 pt, #3B1F14 + green) sits over the shop's front step. It hides the owner-required WELCOME mat (visible in prev/05 and prev/14) and half-hides the parked scooter and van (68's mint scooter is the cosmetic being shown). It reads as a second HUD laid on the scene → make it a single 44 pt cream chip that cycles ×1 → ×10 → MAX, docked at the left end of the sidewalk row, with the four cards each 12 pt narrower. That is AdVenture Capitalist's one-button buy cycle.
- D457 [major] 63 — The 24 recipe cards share 4 pizza drawings (recipe-art.tsx keys the art on the card number only), so Downtown 1 and Suburbs 1 are clones, and a locked card is a flat grey disc. Balatro's collection works because every card is a distinct object → vary the art per hood and per number: crust shape (round, square, calzone, slice) and hood toppings (basil leaf, pepperoni, olive ring, shrimp curl), plus a hood-tinted ribbon. A locked card should show its own silhouette at 20% ink with a "?".
- D458 [major] 69 — The master plaque, the 18-star capstone, is an ~8×12 pt gold chip on the outer right wall below the display case. Nobody will find it (full-size crop) → a 34×22 pt brass plaque beside the door at eye height, with three engraved stars, a #FFF3B0 highlight stroke and a 1 s shine sweep, plus Nonna's line the first time it's seen.
- D450 [minor] 46 (full-size crop) — Narrowed. "4 waiting" now clears the umbrella tip. But it now hides most of the right umbrella's canopy, and the left umbrella's pole runs through a seated diner's face → draw the poles behind the diners and move the pill 10 pt right, onto the sill.
- D459 [minor] 70, 71 (full-size crops) — The rank pins are 9 pt discs. Bronze reads as the old brown dot. The Head-of-the-Week star lands on the PIZZA! poster's own star, so it reads as poster art. 70 shows no bark at all → 12 pt pins with a white ring and the level ("25", "50", "100") in the pin; nudge the star pin 4 pt right of the poster; fix the 70 fixture's timing.
- D460 [minor] 58 — The Boston card is the title card's sunburst and logo with new text. Nothing says Boston. "cold." is orphaned, and a 110 pt gap separates the text from Nonna. Monument Valley's chapter cards show the next place → add a brownstone and bridge skyline silhouette (#B8322A) at the sunburst's base and a sauce crate, balance the line breaks, and close the gap.
- D461 [minor] 64 — "Wear" and "◆ 150 diamonds" are the same green button, and "Worn" is only a paler green. The 32 pt icons don't preview the look → make buy buttons diamond blue #3BA3E0, keep wearing green, give "Worn" an outline style, and use 64 pt thumbnails cut from the scene builders.
- D462 [minor] 64b — "2× 1h0m", no word for what is doubled, and 70% of the screen is empty → "2× income · 1 h", the bolt in a yellow disc, and a drawn empty-shelf illustration below the list.
- D463 [minor] 57, 05c — The bottom row's star pips on the map are cut in half by the list panel's top edge (Suburbs, Waterfront) → raise the bottom-row labels 8 pt or pad the map 10 pt.
- D464 [minor] 03, 04 — Three dim stars sit under "you run it" from the first second, and a new player can't decode them for days → hide the pips until the shop's first head is hired.
DESIGN NOTES:
- D465 [minor] 62 — Before the event starts, the countdown chip reads "Rush: 30m left", which says the rush is already running, and it wraps onto 2 lines in a 60 pt pill → "Rush in 30m" before the start (needs a copy key), on one line.
- D466 [minor] 56 — The "3/4" at the mastery bar's right end has no unit → "Lv 3/4" or "footprint 3/4", or drop it and let the bar carry it.
- D467 [minor] 60 — The "behind pace" fixture is ahead of pace (1.63K / 2.9K with 2:25 left), so "tap to rush!" can't be checked here (it shows on the order chip in 49) → seed a target taken from the shop's real rate.
- D468 [minor] 63 — The header reads "12/24" and the tab "Recipes 9/24": two /24 counts on one screen → "Stories 12/24".
FUN AND RETENTION:
- D469 [major] 61, 41 — The endgame's two new rewards fall flat. Winning the weekly fight against Victor (61) gets the same yellow strip as a special order: no coins, no cheer, and recipe card 4, which the win pays, is never shown. The recipe drop toast (41) has an empty 26 pt icon slot, and no "New recipe" header to say what "The Right Net" is. Monopoly GO! flips a new sticker to the centre with a sparkle → on a win, flip recipe 4 at 96 pt in the middle of the scene for 1.5 s, send 10 coins to the cash, and make the cooks cheer. In the toast, put RecipeArt in the icon slot under the header "NEW RECIPE · Suburbs 3/4".
- D470 [minor] 62b — Friday Night Rush changes only a yellow strip. The shop itself doesn't change → while it runs: a dusk sky gradient, the string lights on and two extra walk-ins. AFK Journey's events reskin the hub.
- [ok] Reason to come back: the attack banner's "3d 3h left", the mastery bar at 10/18 and the weekly chest give specific goals. The return gift now pays out of the oven (53: coins arc from the door, and "Collect" is clear). The first 60 s are unchanged.
FIXED SINCE LAST REVIEW: D454 (door halo, coins from the mouth, stars off "Collect"), D455 ("were away", no single-word orphan), D427 (Mastery n/18 goal bar exists; its clipping is G98)
STILL OPEN FROM LAST REVIEW: G95, D450 (narrowed)
```

Opened at full size (crops): 56 (goal bar, tiles, toggle), 66, 67, 73 (cosmetics), 69 (plaque, bark), 70, 71 (pins), 72 (Nonna), 46 (patio), 41 (recipe toast). Code checked: `endgame/star-pips.tsx` (GOLD = tile colour), `goal-model.ts` masteryGoal (the label clips at its end), `endgame/recipe-art.tsx` (4 variants), `endgame/news-toast.tsx` (icon only for stars), `scene/kitchen-hud.tsx` RankPin and StarPin, `scene/cosmetics.ts` neonSpot, and fixtures 56_u1.py and 66_s1.py.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G95 | bug | U | 50, 59, 60 / bonus.ts, floating-bonus.tsx | Gift covers order card text and hides under attack banner/chip; hold it while any card or banner is up |
| G97 | bug | U | 56, 59–62 / star-pips.tsx | Lit stars #FFC531 vanish on the selected #FFC531 tile; darker gold with white stroke there |
| G98 | bug | U | 05, 14, 15, 50, 56, 62 / app/index.tsx | Diamond chip narrows goal bar: every goal clips, mastery loses its shop; move chip to top row, short label |
| G99 | bug | S | 67 / scene/cosmetics.ts neonSpot | Neon counter sign hidden behind menu board; draw it in front over the register, at least 40×14 pt |
| G100 | bug | S | 72 / Nonna cameo | Nonna hidden behind counter box stack, tag floats over nobody; stand her in front of the counter, add budget test |
| D456 | major | U | 05, 14, 56, 66, 68 / sidewalk-row.tsx | ×1/×10/MAX slab hides WELCOME mat and vehicles; one 44 pt cycle chip at the row's left end |
| D457 | major | U | 63 / endgame/recipe-art.tsx | 24 recipe cards share 4 drawings; vary crust shape and hood toppings, real silhouettes when locked |
| D458 | major | S | 69 / scene/cosmetic-props.tsx | Master plaque is an 8×12 pt chip; 34×22 pt brass plaque by the door, stars, shine |
| D469 | major | U | 61, 41 / challenge-chip, news-toast.tsx | Challenge won and recipe drop are flat strips; card-flip reveal, coins, cheer; RecipeArt plus "NEW RECIPE" header |
| D450 | minor | S | 46 | Waiting pill hides right umbrella; poles cross diners' faces; poles behind diners, pill 10 pt right |
| D459 | minor | S | 70, 71 / kitchen-hud.tsx | 9 pt pins unreadable, star on poster art; 12 pt pins with level number; fix 70 bark timing |
| D460 | minor | U | 58 / boston-sheet.tsx | Boston card is the title sunburst; add skyline silhouette, balance breaks, close 110 pt gap |
| D461 | minor | U | 64 / app/shop.tsx | Buy and Wear identical green; buy diamond blue, Worn outlined, 64 pt previews |
| D462 | minor | U | 64b / app/shop.tsx | "2× 1h0m" → "2× income · 1 h"; empty-shelf art below list |
| D463 | minor | U | 57, 05c / city-map.tsx | Bottom-row map stars cut by list panel; raise labels 8 pt |
| D464 | minor | U | 03, 04 | Hide star pips until the shop's first head is hired |
| D465 | minor | U | 62 / event-chip.tsx | Pre-event chip says "30m left"; "Rush in 30m", one line (needs copy key) |
| D466 | minor | U | 56 / goal-model.ts | Unitless "3/4" on mastery bar; add unit or drop |
| D467 | minor | U | 60 / fixtures 56_u1.py | "Behind pace" fixture is ahead; seed target from the real rate |
| D468 | minor | U | 63 / app/scrapbook.tsx | Two /24 counts; header "Stories 12/24" |
| D470 | minor | S | 62b | Events change only a strip; dusk sky, string lights on, +2 walk-ins while running |

Next IDs: G101, D471
