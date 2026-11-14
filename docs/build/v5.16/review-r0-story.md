# v5.16 story review, round 0 (low effort): COPY-v5.16.md only

VERDICT: NOT SATISFIED
SUMMARY: The copy is in voice and often very funny (Deb's "Out of my kitchen", Noor's "I've never been happier", Dee's "Mostly."), and the hire scenes plant good open questions. The biggest risk is continuity: the five managers speak in beat 3 and 4 lines before the hire scenes introduce them, and Anton's "why I was fired" is answered in uptown-3 and then promised again in uptown-hire.

HOOKS:
- S27 [minor] The five hire scenes all end on the same device, "ask me later": Deb "Ask me about the bake sale sometime. Dale knows which one.", Dee "Ask me what Sal keeps in his locker sometime. Never ask Sal.", Anton "Then I will. Another evening." Deb and Dee are word-for-word the same shape, and the doc schedules no payoff for any of the five (bake sale, Lobster Escape log, thesis title, locker, firing). Open threads with no payment will cost trust. → Vary Dee: "Rule one: nobody opens Sal's locker. Rule two: I have the key." Add a payoff column to this doc, for example a manager report line or a cycle-2 cameo that pays each one off.
- S28 [minor] The beat-4 table is "none" for suburbs-4, waterfront-4, university-4, industrial-4 and uptown-4. The player has just watched the rival close (`rival.*.win`) and beat 4 never mentions it. The scene can read as if MegaSlice is still across the street. Only downtown-4 has a callback. → Add a P1 caption to each, tied to the rival's gag:
  - suburbs-4: "Across the street, the MegaSlice balloons are gone. One drifts past the window."
  - waterfront-4: "A gull stands on the fallen MegaSlice sign. It looks pleased."
  - university-4: "The MegaSlice Wi-Fi is still on. Nobody is using it."
  - industrial-4: "The MegaSlice door is unlocked all night. It's a very quiet door."
  - uptown-4: "The marble boutique has a For Lease sign. The doorman stays at his post."
- S29 [minor] `fix.uptown-4.p4.boston`: "Next stop: Boston, as soon as the road opens." This is the last caption of the home city. "As soon as the road opens" sounds like an excuse for a delay and names a mechanic that does not exist. It also drops Victor's "I'll be waiting in Boston." → "Port Marinara is yours. Next stop: Boston. Victor Crust is already there."

STORY & PACING:
- S26 [major] Section 6: `gm.skip.beat` (waterfront-3), `gm.anton.beat` (uptown-3), `gm.deb.beat` (suburbs-4), `gm.dee.beat` (industrial-3) and `gm.noor.beat` (university-4) put the managers in beats 3 and 4. But each hire scene introduces them: Marisol "Kid, meet Skip.", Genevieve "Your new manager, darling. Anton.". If the hire plays after those beats, the player sees a stranger speak and is then introduced to them. Worse, `gm.anton.beat` "‘Pretty sure’ is how I got fired." answers the question that `uptown-hire` then promises: "She never told you why she fired me? Then I will. Another evening." → State in the doc when each hire scene fires, and keep the beat lines only if the hire comes first. If it comes after, change Anton's uptown-3 line to "I worked for her once. I still have the scars. Pressed ones." and keep the reason for the later payoff. For the others, give the speaker a caption tag ("Skip, ferry purser") rather than rewriting the lines.

PLAYER COMMUNICATION:
- S30 [minor] `rival.waterfront.title` "Hold the Pier: {n} pies in 5 minutes". The Pier 9 auction is a separate waterfront mechanic, so "Pier" blurs two events. Victor's open and Marisol's lose line both say "boardwalk". → "Hold the Boardwalk: {n} pies in 5 minutes".
- S31 [minor] `report.noor.kitchen` "{lost} lost to balking." "Balking" is jargon the player won't know. → "Queue: {served} of {wanted} a minute. {lost} gave up and left."
- S32 [minor] `layer.waterfront.auction.raise` and `.outbid` are two near-identical toasts, and neither says what to do. The info body says "have the cash before they raise again." → raise: "MegaSlice raised to {bid}. Have {bid} to win Pier 9." outbid: "Outbid! Reach {bid} before the next raise." Use whichever matches the real win condition.
- S33 [minor] `offline.headsOnly` "No manager: the heads kept it at half speed". "Heads" is not a word the player has seen on a welcome-back card. → "No manager, so your head cooks kept the shop at half speed."
- S36 [minor] `scrapbook.industrial-hire` "Breaks on Time" is the flattest of the five tiles. → "Nobody Yells at Ox" (a callback to Dee's rules line).

VOICE & COMEDY:
- S34 [minor] `bark.downtown.oven.slammed` Lucia: "Oven's full! Upgrade it. Don't touch it." It gives the player two opposite instructions on the one line that is meant to teach the fix. → "Oven's full! Upgrade it. And hands off my dial."
- S35 [minor] `cameo.big-sal.4` "Hot by midnight. I got a watch." The joke doesn't land, because the watch has no point. → "Midnight, I eat. I got a watch. It's hungry." Also `scene.suburbs-hire.p2.l3` Deb: "Shop's mine now." The player owns the shop. → "Counter's mine now."
- Running gag to protect and finish: Todd's four openers (downtown, suburbs, university, industrial) each damn MegaSlice with faint praise. The thread has no payoff in this doc. → Give Todd a last cameo, either in a rival win line or in Boston: "Todd, in a Rosa's apron: 'Is it too late to switch? They fed me balloons.'"

PROTECT:
- `rival.industrial.open` "Open all night! The ovens aren't. The door is." and `rival.university.open` "The pizza is… also there."
- `gm.noor.beat` "No queue at all. My thesis is ruined. I've never been happier."
- `scene.industrial-hire.p1.caption` "The crew stands up straighter. It isn't for Sal." and Dee's "Mostly."
- `scene.suburbs-hire` "Trust a coach. Now, uh… trust Deb." and Dale's "Yes, ma'am."
- `report.skip.tipping` "Counted twice. Then once more, for joy." and `report.nonna.tipping` "Of course they do."
- `rival.waterfront.win` "The gulls are sitting on it." and `rival.suburbs.win` "Somebody dump the cooler on me!"
- The "I'm not X. I'm just Y" trio (`cameo.big-sal.3`, `cameo.genevieve.3` and Nonna's cameo from v5.15) works as a rule of three. Keep Sal's, "I'm just large", as the strongest.

FIXED SINCE LAST REVIEW: n/a. This document does not contain the v5.15 text.
STILL OPEN FROM LAST REVIEW: S18, S21, S22, S23, S24, S25. None of these strings appears in this document, so I could not check them.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S18 | minor | U | rewards text | Use "Show up on 5 different days" (pending since v5.4) |
| S21 | minor | U | recipe cards, waterfront.3 / uptown.3 | Locked recipes show "???" plus a hint, never the line, so the Pier 9 and review twists stay hidden |
| S22 | minor | E | rush.friday / rush.gameday | Gate each rush until its neighbourhood unlocks, or give the opener to the current shop's head |
| S23 | minor | T | attack.banner | State the win condition: "MegaSlice attacks this week! Out-sell them to win." |
| S24 | minor | T | mastery.all | End with a pull forward: "Now I sit down. On the bus. To Boston." |
| S25 | minor | T | attack.industrial.open | "MegaSlice in every break room, all week. Your move, pizza person." |
| S26 | major | T | gm.*.beat vs *-hire scenes | Fix hire-vs-beat order; Anton uptown-3 line must not answer the firing mystery |
| S27 | minor | T | *-hire P2 last lines | Vary Dee's closer; add a payoff plan for the five "ask me later" threads |
| S28 | minor | T | beat4 table, five scenes | Add a rival-closed caption to each beat 4 (lines in review) |
| S29 | minor | T | fix.uptown-4.p4.boston | "Next stop: Boston. Victor Crust is already there." |
| S30 | minor | T | rival.waterfront.title | Rename to "Hold the Boardwalk" |
| S31 | minor | T | report.noor.kitchen | Replace "lost to balking" with "gave up and left" |
| S32 | minor | T | auction.raise / auction.outbid | Say what number to reach and how to win Pier 9 |
| S33 | minor | T | offline.headsOnly | "No manager, so your head cooks kept the shop at half speed." |
| S34 | minor | T | bark.downtown.oven.slammed | "Oven's full! Upgrade it. And hands off my dial." |
| S35 | minor | T | cameo.big-sal.4, suburbs-hire.p2.l3 | Rewrite the Sal watch line; Deb: "Counter's mine now." |
| S36 | minor | T | scrapbook.industrial-hire | "Nobody Yells at Ox" |

Next IDs: S37
