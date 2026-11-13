# v5.15-r2 — critic review r2 (round 66, medium re-check)

```
VERDICT: NOT SATISFIED
SUMMARY: Most r1 notes are fixed in the pixels. The ×1 chip clears the WELCOME mat, the recipe art now varies, the plaque, the neon sign and Nonna are all visible, the stars show on the gold tile, and the Boston card and vanity buttons read well. But both space fixes have broken the text they squeezed: the cash and rate in the HUD and the sidewalk prices now end in "…" on most late-game screens, the gift still covers the attack banner's Defend button, and the challenge-won moment can't be checked because shot 61 never reaches it.
BLOCKERS:
- none (report.json: loaded true, errors [], cash_after_play $5)
BUGS:
- G102 [14, 36, 41, 67, 68, 69, 70 / sidewalk-row.tsx] The ×1 chip took width from the four cards, so their prices clip. 14 shows "$83…." and "$63…."; 36 shows "$44…." "$34…." "$39…."; 69 shows "$20…." and "$24….". The need line clips too ("need $26…", 67). In 70, "EXPAND to Double storefront" runs past both edges of the bundle card. A buy button whose price you can't read is broken → set the price to adjustsFontSizeToFit with minimumFontScale 0.7; make the ×1 chip 36 pt wide with the cards' 8 pt gaps at 6 pt; shorten the bundle title to "EXPAND · Double" on 1 line.
- G101 [65, 56, 59, 61, 62, 62b, 41, 36, 69, 05b2 / game-ui.tsx Hud] Moving the diamond chip into the top row (G98's fix) narrowed the cash column. In 65 the cash itself reads "$8.4…", the most important number in the game. The rate reads "$42.1B/s citywi…" on every late screen, and the coach line reads "Tap the prep ta…" (05b2) → put cash on adjustsFontSizeToFit (min 0.75) and drop " citywide" when the rate string is over 9 characters, or make the five round buttons 40 pt instead of 44.
- G95 [59 / app/index.tsx, floating-bonus.tsx] Narrowed. 50 and 60 are fixed. In 59 the gift is now drawn after the banners, so the winged box and "A gift, caro. Tap it!" sit on the attack banner. They cover "Defend your shop." and most of the Defend! button, and a tap there opens the gift (full size) → while the attack banner is up, put the gift's lane 8 pt below the banner's bottom edge, or hold the gift until the banner is dismissed.
- G98 [62 / goal-model.ts masteryGoal] Narrowed. 05, 14 and 56 fit now. With the event chip up (62), the mastery label still clips to "Next: Fla" under "3/4 sizes", and "Flagship in W." is a cryptic shortening everywhere → label "★10/18 · Flagship: Waterfront" and drop "3/4 sizes" when a HUD chip is showing.
- G103 [61 / fixtures 56_u1.py, counterattack.ts T85] Shot 61 shows the running chip at "2.9K / 2.9K pies" with 0:34 left, not the win. E1's T85 change moves startSold forward by the pies sold while the page loads, so the fixture's "three pies short" is no longer three short. D469's flip, cheer and coins can't be verified → wait for testID challenge-won before the shot, or seed lastSavedAt = the page clock.
VISUAL DESIGN:
- D471 [minor] 56, 59, 61, 62, 62b, 41, 70 — The front-step slab used to hide this. Two Rosa's vans now park overlapped on the sidewalk and read as one double van ("ROSA'S ROSA'S"). In 70 a red car sits inside the van → one parked vehicle per slot; put the second 64 pt left, by the A-frame, or keep only the newest parked.
- D474 [minor] 72 (full size) — Nonna now stands in front of the counter (G100 fixed). But the grey-bun walk-in in an orange apron stands right beside her, so Nonna reads as a second customer → dress her in her portrait's cardigan (#B8322A) with a cream shawl, draw her 1.1× larger, and keep grey-haired walk-ins off the cameo spot.
- D472 [minor] 69 (full size) — The plaque has the right size and place now (D458 fixed), but its "M" is cut by the plate's left edge, so it reads "IASTER" → make the plate 4 pt wider or set the text 1 pt smaller.
- D450 [minor] 46 — Still open. "4 waiting" sits on the left umbrella's canopy, and the poles still cross the diners → draw the poles behind the diners and move the pill onto the sill.
- D459 [minor] 70, 71 — Narrowed. The pins now carry 25/50/100 and read well, and the star sits clear of the poster. 70 still shows no head bark, only the RUSH ×8 strip → fix the fixture timing so a bark is on screen.
- D462 [minor] 64b (same as r1, carried) — "2× 1h0m" → "2× income · 1 h", and empty-shelf art below the list.
DESIGN NOTES:
- D465 [minor] 62 — Still "Rush: 30m left" on 2 lines before the rush has started → "Rush in 30m" on 1 line.
FUN AND RETENTION:
- D469 [major] 61 — Narrowed. The recipe toast (41) now has RecipeArt under "NEW RECIPE", which is good. Winning the fight against Victor is still unproven on screen (see G103). Monopoly GO! turns every win into a centre-screen card flip → once G103 is fixed, show recipe 4 at 96 pt in the middle of the scene, with coins flying to the cash and the cooks cheering.
- D470 [minor] 62b — Narrowed. During Friday Night Rush the string lights come on and the patio fills ("2 waiting"), but the sky is the same noon blue as 62 → a #F6A26B → #6B4E8C dusk gradient while the event runs (AFK Journey reskins the hub for events).
- [ok] First 60 s: the coach card points at the prep table, and the pips no longer clutter the new tab (03). Something to tap: green cards, the gift, rush. Reasons to come back: the attack's "2d 22h left", Mastery 10/18 and the "0/5" gift. The return still pays out of the oven (07).
FIXED SINCE LAST REVIEW: G97, G99, G100, D456, D457, D458, D460, D461, D463, D464, D466, D467, D468
STILL OPEN FROM LAST REVIEW: G95 (narrowed to 59), G98 (narrowed to 62), D469 (narrowed), D450, D459 (narrowed to the bark), D462, D465, D470 (narrowed)
```

Opened at full size: 56 (HUD, tiles, vans), 14 (sidewalk prices), 67 (neon), 69 (plaque), 72 (Nonna), 59 (gift over banner), 70 (bundle overflow, pins). Code checked: the bd14144 diffs of `app/index.tsx` (FloatingBonus moved after BANNERS), `sidewalk-row.tsx` (AmountChip in the row), `star-pips.tsx`, `challenge-chip.tsx` (the flip exists) and `56_u1.py` (fixture 61 unchanged while T85 changed the offline rules).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G102 | bug | U | 14, 36, 41, 67–70 / sidewalk-row.tsx | Card prices clip "$83…."; bundle title overflows; prices shrink-to-fit, ×1 chip 36 pt, title "EXPAND · Double" |
| G101 | bug | U | 65, 56, 59, 62, 05b2 / game-ui.tsx Hud | Cash "$8.4…", rate "citywi…" clip; cash shrink-to-fit, drop "citywide" when long, 40 pt buttons |
| G95 | bug | U | 59 / app/index.tsx, floating-bonus.tsx | Gift covers attack banner's text and Defend button; lane below banner or hold until dismissed |
| G98 | bug | U | 62 / goal-model.ts | Mastery label clips to "Fla" with event chip; "★10/18 · Flagship: Waterfront", drop "3/4 sizes" then |
| G103 | bug | U | 61 / fixtures 56_u1.py | Won state never captured since T85; wait for challenge-won testID or seed lastSavedAt to page clock |
| D469 | major | U | 61 / challenge-chip.tsx | Challenge win unproven on screen; centre card flip of recipe 4, coins to cash, cooks cheer |
| D471 | minor | S | 56, 59, 62, 70 / scene parked vehicles | Two parked vans overlap as one; one vehicle per slot, second 64 pt left |
| D474 | minor | S | 72 / scene/cameo.ts | Nonna reads as a walk-in beside a grey-bun clone; red cardigan, shawl, 1.1× scale |
| D472 | minor | S | 69 / scene/cosmetic-props.tsx | Plaque "M" clipped by plate edge; plate 4 pt wider or text 1 pt smaller |
| D450 | minor | S | 46 | Waiting pill on umbrella; poles cross diners; poles behind diners, pill onto sill |
| D459 | minor | S | 70 / kitchen-hud.tsx, fixture | Pins fixed; no head bark visible in 70; fix fixture timing |
| D462 | minor | U | 64b / app/shop.tsx | "2× 1h0m" → "2× income · 1 h"; empty-shelf art below list |
| D465 | minor | U | 62 / event-chip.tsx | Pre-event chip says "30m left" on 2 lines; "Rush in 30m", one line |
| D470 | minor | S | 62b / scene/event-look.ts | Lights and walk-ins added; sky unchanged; dusk gradient while event runs |

Next IDs: G104, D475
