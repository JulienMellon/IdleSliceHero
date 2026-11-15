# v5.16 story review, round 2 (medium re-check): scenes/home/**, COPY-v5.16.md, layer and endgame copy

VERDICT: NOT SATISFIED
SUMMARY: Nearly everything from r1 landed, including the Todd-script rewrites Julien approved (S37, S38, S39, S41, S42, S43). The Pier 9 line, the mustache art, the suburbs and industrial beat-4 hooks and the Scrapbook header are all fixed. One major is left: the downtown-4 caption still says "A hundred and fifty deliveries" at a trigger of 2,217. Several small copy notes carry over.

HOOKS:
- S39 fixed. suburbs-4 now ends on Dale: "Poor Todd lost the 'Senior.' Wonder what they make him do next." It works whatever order the player built in.
- S42 fixed. industrial-4 ends on Big Sal: "Your mustache kid came by. Says he's off to Uptown. Wouldn't say as what."
- S43 fixed. university-4 closes on "Now, about those unlimited slices. I brought a list. It has tabs." That calls back to Raj's "It has tabs." Good.
- The new rival-closed captions (suburbs-4 "One drifts past the window", industrial-4 "The door finally closed") fix S28. Uptown carries it in Victor's HQ line ("My boutique has a For Lease sign. And now THIS?"). Waterfront and University have no extra beat, and that is fine.

STORY & PACING:
- S47 [major] downtown-4 P1 caption: "A hundred and fifty deliveries. Before lunch. Downtown smells like Rosa's again." The trigger is `deliveries: 2217`. The COPY row `fix.downtown-4.p1` only added "Before lunch", so the number is still wrong. downtown-2 now says "Four hundred" against a trigger of 424, which is fine. → "Two thousand deliveries. Before lunch. Downtown smells like Rosa's again." Or round the trigger and the line together.
- S37 fixed. waterfront-3b: "Auction's open, kid. They raise every two minutes. Beat 'em to it." waterfront-3 Victor: "An auction? Against MegaSlice? With pizza money? Ha!"
- S38 half fixed (downtown-2 done, see S47 for downtown-4).
- S41 fixed. university-3c caption "A man wipes off his mustache. With a napkin." industrial-2b "you drew your mustache on upside down."
- S45 fixed. `downtownBeat4GapSeconds` is 120.
- D493 (rival challenge timing) carried as is, per Julien. No note.

PLAYER COMMUNICATION:
- S40 fixed. scrapbook.tsx:51 is now `{/* D476 … */}`, and the header in shot 95 reads "Next: Genevieve's story continues when you build Uptown".
- S30 fixed. `rival.waterfront.title` is "Hold the Boardwalk: {n} pies in 5 minutes".
- S32 fixed. `auction.raise` is "MegaSlice raised it. {bid} wins Pier 9" and `auction.outbid` is "Outbid! You need {bid} for Pier 9".
- S46 fixed. In shot 81 Dale's line ("Somebody dump the cooler on me!") sits in the top banner and is fully readable above the New Recipe card.
- S33 [minor] still open. `offline.headsOnly` is in COPY §7 but not in `src`. Shot 07 shows "Downtown sold 77,774 pies while you were away" with no mention of manager or heads. Ship the line.
- S44 [minor] still open. `endgame/copy.ts` still has `rush.gameday.banner` "Big Game Day!", chip "Game: {time} left", and the Suburbs layer has "Game Day! Fill every seat!" (shot 81 chip "Game Day 4:51"). → Rename the rush "Mudhens Playoff Rush!" and its chip "Playoffs: {time} left".
- S23 [minor] still open. `attack.banner` is "MegaSlice is coming! Defend your shop." → "MegaSlice attacks this week! Out-sell them to win."
- S24 [minor] still open. `mastery.all` ends "Now I can finally sit down." → "Now I sit down. On the bus. To Boston."
- S22 [minor] still open. `rush.friday` and `rush.gameday` have no unlock gate.
- S21 [minor] still open. Locked recipe cards for waterfront.3 and uptown.3 were not rechecked this round. Confirm they show "???" and a hint, so the Pier 9 and review twists stay hidden.

VOICE & COMEDY:
- S34 fixed. Lucia's slammed bark is "Oven's full! Upgrade. Hands off my dial." in `heads.ts`.
- S35 fixed. Deb says "Counter's mine now." in the scene. The cycle-2 Sal cameo is "Hot by midnight. I checked. Hmph. Good." in `rewards.ts`. Industrial-3 still has "Hot by midnight. Cold pizza, you're done." in-scene, which is fine; the cameo reads as the payoff.
- S36 fixed. Scrapbook tile "Nobody Yells at Ox".
- S31 fixed. report.noor.kitchen reads "{lost} gave up and left."
- S27 [minor] fixed in code. Dee's closer is now "Rule one: nobody opens Sal's locker. Rule two: I have the key." Keep the `payoff.dee` pineapple line queued (`rewards.ts`).
- Deb's closer ("Ask me about the bake sale sometime. Dale knows which one.") still ends the scene on a "sometime" promise, with the `payoff.deb` line planned. No change needed.
- Todd's rival-open lines ("Free balloons! Honestly, they're the best part.", "The ovens aren't. The door is.") keep his can't-lie trait. Good.

PROTECT:
- Victor's misnaming run (Tad, Rod, Tom, Dodd, Ted, Toddler) → "You said it right. Took you seven tries."
- The name-tag ladder to "TODD · ROSA'S".
- "No comment. It's not a drone." / "Okay. It was always a drone."
- "Todd Smith. It was on every slip." and "Darling. Everyone knew. The mustache is drawn on."
- Big Sal: "Don't tell me why. I hate why." Skip: "The ferry log from the Great Lobster Escape doesn't add up." Gus: "Mostly water."
- "Big Sal sent him." (uptown-4) and now "Your mustache kid came by." which sets it up.
- Priya: "I brought a list. It has tabs." Marisol: "Beat 'em to it."

FIXED SINCE LAST REVIEW: S27, S28, S30, S31, S32, S34, S35, S36, S37, S39, S40, S41, S42, S43, S45, S46. S38 downtown-2 half.
STILL OPEN FROM LAST REVIEW: S21, S22, S23, S24, S33, S38 (downtown-4, tracked as S47), S44.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S47 | major | T | downtown.ts downtown-4 P1 caption (trigger 2217) | "Two thousand deliveries. Before lunch. Downtown smells like Rosa's again." (closes S38) |
| S21 | minor | U | recipe cards, waterfront.3 / uptown.3 | Locked recipes show "???" plus a hint, never the line, so the Pier 9 and review twists stay hidden |
| S22 | minor | E | rush.friday / rush.gameday | Gate each rush until its neighbourhood unlocks, or give the opener to the current shop's head |
| S23 | minor | U | endgame/copy.ts attack.banner | "MegaSlice attacks this week! Out-sell them to win." |
| S24 | minor | U | endgame/copy.ts mastery.all | End with a pull forward: "Now I sit down. On the bus. To Boston." |
| S33 | minor | U | offline popup, offline.headsOnly | Ship the line (not in src; shot 07): "No manager, so your head cooks kept the shop at half speed." |
| S44 | minor | U | endgame/copy.ts rush.gameday.* | Rename the rush "Mudhens Playoff Rush!", chip "Playoffs: {time} left" |

Next IDs: S48
