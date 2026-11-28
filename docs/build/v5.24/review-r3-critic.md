VERDICT: NOT SATISFIED
SUMMARY: r3 fixes the flourish (D580, D585), the chime (D579) and C192, and every price on the Style tab is 60, 150 or 400 with nothing sold as limited. The Uptown marble still reads as white clapboard at 1x (D577), and nine minors are still open, which is over the three-minor gate.

Opened full-size crops of 230, 224/226/229 (door and chime) and 231 to judge the details.

BLOCKERS:
- none

BUGS:
- none (report.json: loaded, errors empty). C192 is fixed in code: `resetPacksSeen()` is called once per opening from shop.tsx:83, the blur listener is gone, and a test pins it (shop-screen.test.ts).

VISUAL DESIGN:
- D577 [minor] 230 / facade-marble: still open. At 1x the Uptown side wall is cream clapboard with horizontal lines, and the pink interior and black-white awning carry the look. The gold pinstripe cornice is there and the pillar has faint gray veins, but the wall that reads as "marble" has none. Draw 2 or 3 diagonal gray veins (#B8B2AA, 1 pt) per wall panel and drop the clapboard lines on this theme. The 232 thumbnail shows only the awning, so it does not say marble either.
- D579 [minor] 226 / chimeRect: FIXED enough. The chime now hangs clear of the OPEN plate and lintel, at the door edge below the sign, and reads as gray tubes at 1x (about 14 pt). It is gray on a gray-white wall, so give it a brass top bar (#C9A24B) to help it pop. In 229 the "x26" pop still covers the door area, but that pop is transient.
- D580 [minor] 231 / storefront bubble: FIXED. The bubble now sits below the menu board and covers only the hood's lower edge.
- D585 [minor] 231 / set-flourish: FIXED. A gold medal with a red ribbon and a star now sits on the sign, with confetti. The confetti is brown wood-chip rectangles, and a minor polish item would be to make it gold and red.
- Focus check: each set reads as its place at phone size. Waterfront (224) has navy and a lighthouse. Industrial (229) has brick and gray stacks. Uptown (230) has a pink interior and black-white awning. Downtown (231) has a green awning. Nothing covers a station, head, badge or the WELCOME mat; the mat is visible in every shot. In 224 and 230 the speech bubble crosses the menu board, and it is short-lived.

DESIGN NOTES:
- 232 / Style tab prices: 400 (Far too much marble), 150, 60, 60, then "Small looks · 60". Every price is 60, 150 or 400. The 400 button is greyed at 220 gems, which shows correctly that it cannot be afforded. No limited-time or scarcity wording appears on this tab. "Head of the Week" in the Waterfront bubble is flavor text, not an offer.
- D586 [minor] 227b: still no "2/4" chip on the tab itself. The half-set is shown only inside the Style tab ("2/4 pieces").
- D519 and D571 were closed by Julien on 2026-11-23.
- D570 stays needs-owner.
- Carried and not counted against the gate (same or noted shots unchanged): D572, D573, D564.

FUN AND RETENTION:
- D493 and D495 are parked.
- [minor] 231: the set flourish is now a real payoff beat. Monopoly GO! gives each completed set a short celebration and a reward count-up. This could add "+gems" or a next-set teaser to the medal, but it is not a blocker.

FIXED SINCE LAST REVIEW: D579, D580, D585, C192; D571 and D519 closed by Julien.
STILL OPEN FROM LAST REVIEW: D577, D586, D572, D573, D564, D570; D493 and D495 parked.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D577 | minor | S | 230 / facade-marble | Side wall still clapboard at 1x; gray veins per panel, drop clapboard lines on this theme; thumbnail should show the wall |
| D586 | minor | U | 227b / tab strip | Half set invisible outside the tab; "2/4" chip on the hood tab |
| D572 | minor | S | 211, 05 / rival-scene.tsx | The van drives behind its sign and reads "MEGASLICE" twice; keep the van out of that segment |
| D573 | minor | U | 187, 214 / report-model.ts | Strip reads "Missed 0/min · Tips up" during a walk-out; count walk-outs as missed |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter value claim; use "Double income for a full day". needs-owner |
| D493 | parked | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | parked | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G124, D587
