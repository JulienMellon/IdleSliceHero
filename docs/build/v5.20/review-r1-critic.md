# v5.20 r1 — critic (full)

VERDICT: NOT SATISFIED
SUMMARY: The single scrim works: the whole screen, HUD included, now goes dark around one cut-out, the card never covers its target, and the old halo and yellow card are gone. But the thing Nonna names is often not the thing that is lit or pointed at: the oven's number sits under the gold outline, the hand taps the table while she talks about the dial, and step 11 shows off an oven that has not changed.

Report: `loaded: true`, `errors: []`, cash_after_play $0 (earned 12). Full-size shots opened: 153, 161, 162, 163, 166, 168, 169.

BLOCKERS:
- none

BUGS:
- G112 [162, 159, 161, 169 / scene/kitchen-hud.tsx `dial-${st}`] The dial target registers only the ring. The count pill ("×4", the oven's number) falls outside the cut-out, and the gold outline runs straight through its digit. Step 4 says "The number? How many pies are inside", and that number is the one thing you can't read. The prep pill's "×4" is half lit in steps 2 and 15 and never explained. → Put the testID group around the ring and the pill, so the cut-out holds both and the digit reads.

VISUAL DESIGN:
- D520 [major] Steps 2, 4 and 15 (161, 162, 169). The overlay's hand always goes on the first target (the station) and is drawn in wait and look modes too. Nonna says "See the dial?" while a white tapping hand sits on the prep table, and any tap there is swallowed. In step 15, "Marco rolls on his own now" comes with a hand telling you to tap. In *Is This Seat Taken?* the cue always points at the one thing the line is about. Fix: on wait and look steps, put the hand beside the last target (the dial), pointing at it with no bounce. On step 15, drop the hand and let the breathing ring carry it.
- D522 [major] Step 11 (166 vs 162). "A better oven bakes more pizzas. Now this is a kitchen!" lights an oven drawn exactly as at Lv 1, because `ovenTier` only changes at 25 and 50 and a second oven only appears at Lv 9. The payoff moment shows nothing new. In Eatventure an upgraded station flashes and gets a visible "x2" stamp. Fix: during step 11, play the upgrade flash on the oven, add a gold "Lv 2" plaque and a 2 pt brass band to the dome, and light the oven dial and its pill too.
- D523 [minor] 153, 162, 163, 165, 167. The prep dial's own "ready" hand (kitchen-hud) still shows, dimmed, as a second pointer on every step. That breaks the plan's rule of one highlight style. Hide it while a non-free coach step is up.
- D524 [minor] 161, 162, 169. The dial cut-out and the station cut-out are about 120 pt apart with nothing linking them, so the eye has to make the jump itself. Draw a 2 pt dotted gold leader line between the two holes. In 169 the cut-out also cuts Marco's star pin in half: grow the dial rect to take in the face chip and the pins.
- D525 [minor] 167, 04, 148: on the narrow All target the hand lands on the Drivers card and hides "$7". In 166 the hand covers the cashier's cap. When the target is narrow, put the hand above it instead of beside it, clear of other controls.
- D526 [minor] 153, 03, 165, 166. The card docks right under the cut-out, so in steps 1–5 and 10–12 it hides the seating area and diners. In step 11 it covers the whole kitchen floor and cuts the baker in half. If there is room, dock it at the street band (y ≥ 760), as the v5.19 card did.
- D527 [minor] 169. In step 15, Marco's "Me? Head of the Week? Nonna, look!" bark sits under the scrim, so two people talk at once. Gate barks on `hintsAllowed` the way the toasts are gated.

DESIGN NOTES:
- D521 [major] (needs-owner) 165 → 168. The tutorial's one taught upgrade is Ovens. Two steps later the drawer it opens shows "Ovens Lv 2 · no gain now" and "Bottleneck: drivers & seats", so someone new to idle games learns that Nonna's advice was useless. Fix: either step 10 lights whichever sidewalk card the game marks as the bottleneck (with a line for each case), or Ovens Lv 2 gives a real gain at that point. Julien fixed the ladder on 2026-11-21, so this is his call.
- D528 [minor] 164. In step 9 Nonna says "Save $12 to upgrade the oven" while the goal bar says "hire Marco (prep) $4 / $400". Two goals at once. Until v5.21's goal step lands, make the goal bar show Nonna's current goal during steps 1–11.
- D529 [minor] overlay.tsx `LOOK_MS = 2500`. Steps 11 and 15 are 11–13-word lines plus something to look at, and they vanish after 2.5 s. A slow reader loses the tutorial's closing line. Make it 4 s, or wait for a tap.

FUN AND RETENTION:
- D495 (carried, parked) [minor]. The new script makes it worse. 04/148 reach "Tap All" with $0 at 20 s. Step 14 ("Marco won't hire himself") then asks for $400 at roughly $0.6/s, about 10 minutes of free play under a static card. AFK Journey never leaves a new player waiting more than a minute for the next unlock. Still parked by Julien.
- D530 [minor] 169. The tutorial ends with no graduation. The "Bravo!" card fades after 2.5 s and the next goal is "hire Lucia $0 / $800". In Monopoly GO! and AFK Journey, finishing onboarding gives a stamp and a gift. Fix: after step 15, a "Chapter 1 done" ribbon and Nonna's golden pizza (this also covers the old D445 idea).
- First 60 s: there is a hook. The first sale lands by step 6 and the cash is lit at that moment. It would hit harder if CoinLayer flew coins from the counter into the lit cash hole, the way Balatro makes a number feel earned. That works today (CoinLayer sits above the scrim); make sure the first sale fires it.
- Something worth tapping: yes, at every tutorial step, and taps outside the hole now give a small shake instead of doing nothing.
- Return reason and return gift: not touched this round (same shots as v5.19-test); nothing new to note.

Focus answers: (1) Each step lights one thing or one station-and-dial pair, and the rest is gray, HUD and sidewalk included. The leftovers are the prep dial's own hand (D523) and the bark (D527). (2) No: the dials' numbers are outside the lit area (G112). (3) In 153–169 the card never covers its target. It does cover the dining room (D526). (4) Mostly yes, except "The number?" (G112), the hand that contradicts the line (D520), the "better oven" that looks the same (D522) and that the drawer calls useless (D521).

FIXED SINCE LAST REVIEW: n/a
STILL OPEN FROM LAST REVIEW: D481, D519, D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G112 | bug | S | 162, 161, 169 / kitchen-hud.tsx | Register the dial target around ring and count pill so the number Nonna names sits inside the cut-out |
| D520 | major | U | 161, 162, 169 / coach/overlay-model.ts | Wait and look steps: hand beside the last target (the dial), no bounce; step 15 no hand |
| D522 | major | S | 166 / storefront.tsx | Step 11: upgrade flash, "Lv 2" plaque and brass band on the oven; light the oven dial too |
| D521 | major | E | 165, 168 / engine/tutorial.ts | needs-owner: teach the bottleneck card, or make Ovens Lv 2 a real gain; drawer says "no gain now" |
| D523 | minor | S | 153, 162, 163 / kitchen-hud.tsx | Hide the dial's own "ready" hand while a non-free coach step is up |
| D524 | minor | U | 161, 162, 169 / coach/overlay.tsx | Dotted gold leader between station and dial holes; dial rect includes face chip and pins |
| D525 | minor | U | 167, 166 / coach/overlay-model.ts | Narrow targets: hand above, never over another control (Drivers "$7", cashier's cap) |
| D526 | minor | U | 153, 165, 166 / coach/overlay-model.ts | Dock the card at the street band when it fits, not over the dining room |
| D527 | minor | S | 169 / storefront.tsx | Gate head barks on hintsAllowed like toasts, so only Nonna talks |
| D528 | minor | U | 164 / goal-model | During steps 1–11 the goal bar shows Nonna's goal, not "hire Marco $400" |
| D529 | minor | U | coach/overlay.tsx LOOK_MS | Look steps last 4 s or until a tap; step 15's closing line vanishes at 2.5 s |
| D530 | minor | E | 169 / engine/tutorial.ts | Tutorial graduation: "Chapter 1 done" ribbon plus Nonna's golden pizza gift |
| D481 | minor | S | 76, 13, 156 / street rival band | Pavement band is right, but the shop is a 40 pt corner sprite cut by the screen bottom; draw at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Suburbs and flagship cutaways clip at screen edges with no pan; scale to about 0.9x or centre with a 12 pt margin |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Session 1 meets every layer at once; open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. First 20 s ends at $0; step 14 asks $400 at about $0.6/s; first goal under $50 |

Next IDs: G113, D531
