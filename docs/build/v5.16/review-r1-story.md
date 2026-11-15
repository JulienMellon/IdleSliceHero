# v5.16 story review, round 1 (full): scenes/home/** and the v5.16 strings

VERDICT: NOT SATISFIED
SUMMARY: The Todd B-plot makes this the strongest story the game has had. Every arc now has a running thread: name-tag demotions, Victor getting Todd's name wrong, the mustache. The hire scenes slot in cleanly with `ifSeen`. The biggest risks are numbers that contradict the game (a "two million" Pier 9 bid that is really $120M to $180M, and "twelve" or "150" deliveries when the triggers are 424 and 2,217), and a stray code comment that shows up as text in the Scrapbook header.

HOOKS:
- S39 [major] suburbs-4 P3, last line: "Hey, pal, some sailor lady's been asking about you. Says it's urgent." Beat 4 now waits for a rival win the player starts, so Waterfront is usually built and Marisol already met by then (shot 81: Waterfront shows "you run it" while Dale's win line plays). → "Poor Todd lost the 'Senior.' Wonder what they make him do next." This pays off suburbs-3b and lands whatever the order. waterfront-3b's "Name tag: ASSOCIATE" answers it.
- S42 [minor] industrial-4 P4, last line: "Industrial's yours. And so's my Thursday." This is the warmest close in the game, but it shuts the loop just before a wait of at least 600 s (uptown-2b needs industrial-4 plus 10 minutes). Keep the line and add a Big Sal line after it: "Your mustache kid came by. Says he's off to Uptown. Wouldn't say as what." That sets up the mascot reveal without spoiling it.
- S43 [minor] university-4 P3, last line: "University is officially Team You. Now... about those unlimited slices." This is the only finale with no MegaSlice reaction. → Close on Priya: "Now, about those unlimited slices. I brought a list. It has tabs." That is a callback to Raj. Or add an HQ panel, Victor: "Drones. DRONES. Fine. Then I'll feed the factories myself."

STORY & PACING:
- S37 [major] waterfront-3b P4: "The auction's open, kid. Bid two million and Pier 9 stays a pier." The bid starts at $120M and rises to $180M (shot 78: "raised its bid to $132M · Cap $180M"). Victor's line in waterfront-3 P3, "The auction closes soon", is also wrong, because the price keeps rising and nothing closes. → Marisol: "Auction's open, kid. They raise every two minutes. Beat 'em to it." Victor: "An auction? Against MegaSlice? With pizza money? Ha!"
- S38 [major] downtown-2 caption "Twelve deliveries." and the line "Twelve pizzas. In my day, twelve was Tuesday." The trigger is 424. downtown-4 caption "150 deliveries." has a trigger of 2,217. → "Four hundred deliveries. The phone is actually ringing." / "Four hundred pizzas. In my day, that was Tuesday." / "Two thousand deliveries. Downtown smells like Rosa's again." Better still, round the triggers to 400 and 2,000 so the next retune can't break the lines again.
- S41 [minor] university-3c P2 caption "A man peels off a mustache." The mustache is drawn on: downtown-5 says "With a marker", uptown-3b says "The mustache is drawn on", and the T1b art draws it that way. → "A man wipes off his mustache. With a napkin." In industrial-2b, "your mustache is on upside down" → "you drew your mustache on upside down."
- S45 [minor] `STORY_PACING.downtownBeat4GapSeconds: 60`. Julien's rule, restated in card T1a, is 120 s. Restore 120, or log the decision that changed it.
- S28 (carried) gains weight now that beat 4 fires on the rival win: suburbs-4, industrial-4 and uptown-4 never mention the shop across the street closing.
- Structure: the beat-3 formula is now varied by the interludes. Every beat 3 still has a Victor HQ panel, but the misnaming run turns that repetition into a payoff ("Took you seven tries"). Keep it as it is.

PLAYER COMMUNICATION:
- S40 [bug] `src/app/scrapbook.tsx:51`: `// D476: one line when it can be…` sits bare inside JSX. It renders as text in the Scrapbook header (shot 95). On iOS, a raw string inside a View throws. → `{/* D476: … */}`.
- S30 [major, raised from minor] `rival.waterfront.title` "Hold the Pier: {n} pies in 5 minutes". In shots 21 and 78 it sits directly under "Bid on Pier 9" while the auction is live, so the player will think the challenge wins the pier. → "Hold the Boardwalk: {n} pies in 5 minutes".
- S44 [minor] Suburbs now has two different events both called Game Day: the old rush `rush.gameday.banner` "Big Game Day!" and the new layer "Game Day! Fill every seat!" (chip "Game Day 4:51", shot 81). → Rename the rush "Mudhens Playoff Rush!" and its chip "Playoffs: {time} left".
- S46 [minor] Shot 81: Dale's rival win line ("…Somebody dump the cooler on me!") is covered by the "A gift, caro" bubble and the New Recipe card, so the payoff can't be read. → Queue the recipe card until the rival line has been on screen for 3 s.
- S33 (carried, owner now U): `offline.headsOnly` is not in `src`. The welcome-back card (shot 07) never says why a shop with all three heads earned half. Ship the line.
- Perk cards are clear (shot 22: "Suburbs walk-ins pay 15% extra"). The Uptown wait hint "Win over Industrial to continue Uptown's story" (shot 96) is clear.

VOICE & COMEDY:
- Voices hold. Todd's "I can't lie" trait runs from suburbs-3b to industrial-3b to uptown-3b, and the Trish Vance line ("She can lie.") pays it off. Victor stays cold and brief.
- Carried and still unchanged in code: S34 Lucia "Upgrade it. Don't touch it." (`heads.ts`); S35 "Hot by midnight. I got a watch." and Deb's "Shop's mine now."; S27 Dee's "Ask me … sometime" closer, the twin of Deb's; S36 "Breaks on Time"; S31 "lost to balking".

PROTECT:
- Victor's misnaming run (Tad, Rod, Tom, Dodd, Ted, Toddler) → "You said it right. Took you seven tries." If any beat-3 Victor line changes, the count must still come to seven.
- The name-tag ladder: VP → SENIOR ASSOCIATE → ASSOCIATE → INTERN → UNPAID INTERN → VENDING RESTOCKER → foam slice → "TODD · ROSA'S".
- "No comment. It's not a drone." → "Okay. It was always a drone."
- "Todd Smith. It was on every slip." and "Darling. Everyone knew. The mustache is drawn on."
- Big Sal: "Don't tell me why. I hate why." Skip: "The ferry log from the Great Lobster Escape doesn't add up." Gus: "Mostly water."
- "Big Sal sent him." (uptown-4 P4), which pays off industrial-2b's "A man who hides from his job needs a new job."

FIXED SINCE LAST REVIEW: S18 (`rewards.ts` "Show up on {n} different days"), S25 (`attack.industrial.open` ends "Your move, pizza person."), S26 (`ifSeen` gates; Anton's line no longer answers the firing), S29 (finale caption cleaned, with Victor's Boston line and the Trish Vance hook in place).
STILL OPEN FROM LAST REVIEW: S21, S22, S23, S24, S27, S28, S30, S31, S32, S33, S34, S35, S36.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S21 | minor | U | recipe cards, waterfront.3 / uptown.3 | Locked recipes show "???" plus a hint, never the line, so the Pier 9 and review twists stay hidden |
| S22 | minor | E | rush.friday / rush.gameday | Gate each rush until its neighbourhood unlocks, or give the opener to the current shop's head |
| S23 | minor | U | endgame/copy.ts attack.banner | "MegaSlice attacks this week! Out-sell them to win." |
| S24 | minor | U | endgame/copy.ts mastery.all | End with a pull forward: "Now I sit down. On the bus. To Boston." |
| S27 | minor | T | industrial-hire P2 l2 | Vary Dee's closer: "Rule one: nobody opens Sal's locker. Rule two: I have the key." Plan payoffs |
| S28 | minor | T | suburbs-4, industrial-4, uptown-4 P1 | Add a rival-closed caption to each beat 4 (lines in review r0) |
| S30 | major | U | layer-copy.ts rival.waterfront.title | "Hold the Boardwalk: {n} pies in 5 minutes"; it sits under "Bid on Pier 9" (shots 21, 78) |
| S31 | minor | E | content/service.ts report.noor.kitchen | Replace "lost to balking" with "gave up and left" |
| S32 | minor | U | layer-copy.ts auction.raise / outbid | Say what number to reach to win Pier 9 |
| S33 | minor | U | offline popup, offline.headsOnly | Ship the line: "No manager, so your head cooks kept the shop at half speed." |
| S34 | minor | E | content/heads.ts downtown oven slammed | "Oven's full! Upgrade it. And hands off my dial." |
| S35 | minor | T | rewards.ts cameo.big-sal.4; suburbs-hire P2 l3 | Rewrite Sal's watch line; Deb: "Counter's mine now." |
| S36 | minor | T | industrial.ts industrial-hire title | "Nobody Yells at Ox" |
| S37 | major | T | waterfront-3b P4; waterfront-3 P3 | Marisol: "Auction's open, kid. They raise every two minutes. Beat 'em to it." Victor: drop "closes soon" |
| S38 | major | T | downtown-2 P1/P3; downtown-4 P1 | Numbers match triggers (424, 2,217): "Four hundred…", "Two thousand deliveries…", or round the triggers |
| S39 | major | T | suburbs-4 P3 last line | "Poor Todd lost the 'Senior.' Wonder what they make him do next." |
| S40 | bug | U | src/app/scrapbook.tsx:51 (shot 95) | Bare `// D476` comment renders in header and throws on iOS; wrap in `{/* */}` |
| S41 | minor | T | university-3c P2; industrial-2b P3 | "A man wipes off his mustache. With a napkin." / "you drew your mustache on upside down." |
| S42 | minor | T | industrial-4 P4 | Add Big Sal: "Your mustache kid came by. Says he's off to Uptown. Wouldn't say as what." |
| S43 | minor | T | university-4 P3 last line | "Now, about those unlimited slices. I brought a list. It has tabs." |
| S44 | minor | U | endgame/copy.ts rush.gameday.* | Rename the rush "Mudhens Playoff Rush!" so it isn't confused with the Game Day layer |
| S45 | minor | E | tuning.ts downtownBeat4GapSeconds | 60 s breaks Julien's 120 s Downtown finale wait; restore it or log the decision |
| S46 | minor | U | rival win toast vs recipe card (shot 81) | Hold the recipe card until the rival win line has shown 3 s |

Next IDs: S47
