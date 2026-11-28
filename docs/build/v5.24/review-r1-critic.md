# v5.24 review r1 (critic, full)

VERDICT: NOT SATISFIED
SUMMARY: The six sets mostly read as their neighbourhoods (Dockside planks, Dorm pennants, Industrial brick and hazard band are the strongest), every price on the tab is 60, 150 or 400, and nothing is presented as limited. But the $19.99 pack promises the same "6 looks" as the $9.99 one, Featured sells looks for shops the player has not opened, and the Dorm set's 150 💎 scooter sits under the status strip.

Opened at full size: 206b, 222, 223, 224, 225, 226, 228, 229, 230. 104, 105 and 24 differ only by the random Install ID (I opened 104 and its prev). 05a2 and 69 differ only by the gift's and clouds' positions.

**Check first:**
- Tip jar vs bag pile in the starter shop: no starter-shop shot in the set. In 225 and 226 the jar sits clear beside the register, and `protected.ts` now protects `tipJarRect`. Unverified in pixels, so I log no note.
- Downtown aprons (222): the cream apron shows only on the centre cook, as a pale panel over the red check. It is weak (folded into D581).
- Waterfront plank anchor (224): not visible. The plate ends in two rivet dots. Still open (D576).
- sign-dockside reads neon-ish (224): yes, still. It has pink glow text and a pink halo on a navy plate (D576).
- $19.99 Cart art and "+1,000 bonus" (206b, 208b): the bonus line is right. The art is the Crate on wheels at the same size (D584). The "Enough for 6 looks" line is wrong (G123).
- Dorm set (228): it reads as campus (pennant awning, quoined brick, blue-check cloths). But the menu is under the Head bubble and the scooter is under the strip (D575, D580).
- Jar urn (230) and plaid/notebook cloths (228) read fine. The gear chime (229) sits on the driver's cap (D579). The hazard apron is hard to find (D581). The cork menu is not in any shot. The purple scooter is mostly hidden (D575).
- S5 oven/scooter thumbnails: the scooter thumb reads (227). The brick oven thumb is not on screen, so it is unverified. The brick oven in the scene (229) reads.
- Set-complete bubble at 40+ chars: Nonna's 46-character line fits at about 275 pt in 231. Skip's line ("Set complete. The queue approves. Noted.", 46 with name) goes through the same wall-clamped `HireBubble`. It passes by inference; there is no shot of it.
- Vanity all-owned and half-set: 227b shows 4/4 Classic with "Worn ✓". The Diner 2/4 half set is asserted in the fixture but scrolled out of frame. There is no all-owned shot (D583).

BLOCKERS:
- none

BUGS:
- G123 [206b, 208b / store-model.ts looksUnowned] The Crate (1,200) and the Cart (2,600) both say "Enough for 6 looks". `looksUnowned` still counts the old seven `VANITY_IDS`, so the $19.99 pack claims no more than the $9.99 one. Expected: count unowned looks from the 41-look catalog at real tier prices.

VISUAL DESIGN:
- D574 is in DESIGN NOTES (it is not visual).
- D575 [major] 228, 225, 222 / storefront scooter spot: the parked scooter shows only its top 10 pt above the "Served…" strip. The Dorm set's 150 💎 hero piece (Finals-week scooter) and the 150 💎 red scooter are paid looks the player cannot see. Fix: park the scooter 24 pt higher, beside the A-frame, so its whole body and wheels clear the strip.
- D576 [minor] 224: sign-dockside still glows pink like the default neon, and its anchor is not drawn. Fix: cream #F3E3C3 stencil text, no halo, a 14 pt anchor glyph on the left end, and rope coils at the ends.
- D577 [minor] 230: the Uptown marble facade reads as white clapboard, the same as Suburbs in 226. Fix: replace the siding lines with 2–3 soft gray (#C9C3BC) veins per panel and a gold #C9A24A pinstripe at the cornice.
- D578 [minor] 223: the Diner counter (the set's medium piece) is still the brown wood front; only a checker strip shows under it. Fix: a red #D8443A front with a 3 pt chrome #DDE3E8 lip, visible above the cashier's waist.
- D579 [minor] 229, 224: the door chime hangs at head height, so the gear and the ship's bell sit on the incoming driver's cap. Fix: hang it from the lintel, 12 pt higher, so heads pass below.
- D580 [minor] 228, 224, 231: the manager bubble lane sits exactly over the menu board. In 231 the set-complete line hides the Classic menu you just completed. Fix: put the bubble 30 pt lower (over the oven hood), or under the board while a set flourish plays.
- D581 [minor] 222, 225, 226, 229: the 60 💎 small looks are hard to tell apart at 1x. Cream versus white aprons, glass versus brass jars (about 11×15 pt), and the hazard apron are lost on busy figures. Fix: jars and chimes at 1.3×, and aprons in a full contrasting colour on every cook.
- D584 [minor] 206b: the Cart icon is the Crate on two wheels at the same size, so the top pack does not look biggest. Fix: draw it 1.2× with a heaped gem pile and a gold rim.

DESIGN NOTES:
- D574 [major] 227, 227b, 195 / engine/vanity.ts featured: Featured shows four University and Industrial looks (Finals-week scooter, Peer-reviewed menu, Notebook-paper cloths, Union-built front 400 💎) to a player whose University still "Opens after Ch 8". A 400 💎 buy shows up nowhere. Fix: skip looks whose hood is not open.
- D582 [minor] 227: Featured tiles drop the "Shows in {hood}" line that set rows carry. Fix: add it under the name at 11 pt.
- D583 [minor] 227b / fixture 227_u6: the half set (Diner 2/4) and the all-owned tab are never framed. Fix: shoot the Diner header and a fully owned tab.

FUN AND RETENTION:
- D585 [minor] 231: the set-complete flourish is 3 s of small confetti and arms-up cooks; it pays nothing and leaves no trace. *Monopoly GO!* makes a finished album set a full-screen moment with a reward and a permanent badge. Fix: a 1.5 s "SET COMPLETE" ribbon over the sign, 10 coins, and a small set crest on the sign plate afterwards.
- D586 [minor] 227b: a half-built set (2/4) only shows inside the tab, and the shop never hints at it. Monopoly GO's album says "1 away!" on the main screen. Fix: a "2/4" set chip on the hood tab, or a faint dashed outline where a missing piece would go.
- The weekly Featured row gives a return reason without a timer, which suits the "never limited" rule. A 5,760 💎 catalog against about 900 💎 a month is a long goal. The return moment and the first 60 s are unchanged (D493 and D495 are parked).

FIXED SINCE LAST REVIEW: n/a (no carried note's shot changed)
STILL OPEN FROM LAST REVIEW: D571, D519, D572, D573, D564, D570, D493 (parked), D495 (parked)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G123 | bug | N | 206b, 208b / store-model.ts looksUnowned | Crate and Cart both "Enough for 6 looks"; count unowned catalog looks at tier prices |
| D574 | major | E | 227, 195 / engine/vanity.ts featured | Featured sells University/Industrial looks before those shops open; skip looks for unopened hoods |
| D575 | major | S | 228, 225 / storefront scooter spot | Paid scooter looks hidden under the status strip; park 24 pt higher, whole scooter visible |
| D576 | minor | S | 224 / look-art.ts sign-dockside | Still pink neon, no anchor; cream stencil text, no halo, 14 pt anchor, rope ends |
| D577 | minor | S | 230 / facade-marble | Reads as white clapboard; gray veins per panel, gold cornice pinstripe |
| D578 | minor | S | 223 / counter-diner | Counter still brown wood; red front with chrome lip visible above the cashier |
| D579 | minor | S | 229, 224 / chimeRect | Chime sits on the driver's cap at the door; hang it from the lintel 12 pt higher |
| D580 | minor | S | 228, 224, 231 / storefront bubble y | Manager and flourish bubble covers the menu board; drop the bubble 30 pt |
| D581 | minor | S | 222, 225, 226, 229 / look-art.ts | Small looks indistinguishable at 1x; jars and chimes 1.3×, aprons in full contrast on every cook |
| D582 | minor | U | 227 / vanity-card.tsx | Featured tiles lack "Shows in {hood}" |
| D583 | minor | U | 227b / fixture 227_u6 | Half set and all-owned tab never framed; shoot both |
| D584 | minor | N | 206b / pack art | Cart is the Crate on wheels; 1.2×, heaped gems, gold rim |
| D585 | minor | S | 231 / set-flourish.ts | Flourish small, no payoff; ribbon, coins, set crest on the sign |
| D586 | minor | U | 227b / tab strip | Half set invisible outside the tab; "2/4" chip on the hood tab |
| D571 | minor | S | 214 / scene/walkout.ts spotOf | Pixels unchanged: customer still on the mat; re-shoot at the turn pause, measure against the drawn mat, add "cross" mood |
| D519 | minor | U | 211, 213, 25-look-suburbs / scroll-cues.tsx | Wide shops cut at the edge with no cue; 24 pt chevron and edge fade |
| D572 | minor | S | 211, 05 / rival-scene.tsx | Store is on the kerb now; the van still drives behind its sign and reads "MEGASLICE" twice; keep the van out of that segment |
| D573 | minor | U | 187, 214 / report-model.ts | Strip reads "Missed 0/min · Tips up" during a walk-out; count walk-outs as missed |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter value claim; use "Double income for a full day". needs-owner |
| D493 | parked | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | parked | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G124, D587
