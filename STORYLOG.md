# Story log

The **storycritic** (`.claude/agents/storycritic.md`) reviews the storyline, the cut-scenes and every line the game says to the player: hooks, pacing, character voice, comedy and how clearly the game tells the player what happened and what to do next. Julien's direction: the storyline is one of the game's greatest retention tools, and every cut-scene should leave the player wanting the next one.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** S9.

## Current state — v4.3, round 1 (low effort): ❌ NOT SATISFIED (2 [major], 6 [minor]; advisory)

The jokes and payoffs are strong. The biggest risk: waterfront-4 closes its loop completely right before the ~34-minute stretch with no scene (35.9 → 70.4 min in the pacing sim), where players are most likely to quit. The reviewer worked from `home.ts` and `tuning.ts` only, not the screenshots.

| ID | Sev | Scene / text | Note | Proposed fix |
| --- | --- | --- | --- | --- |
| S1 | major | waterfront-4, last line "Waterfront's yours, Captain. Even the anchovies are on your side now." | Closes the loop before the long dead zone | Add a final MegaSlice HQ panel. Victor Crust: "Fine. Keep the dock. I'll buy their brains instead." This sets up the University poaching plot |
| S2 | major | university-1, last line "Same time tomorrow? Same slice. Same quarters. Probably fewer quarters." | Arrives after the long wait and pulls nothing forward | Priya: "Also, your driver's route is a crime. I'm writing it down." (sets up her routing app in university-2) |
| S3 | minor | suburbs-4, last line "You're family." | No handoff to the next arc | Dale: "Hey, pal, some sailor lady's been asking about you. Says it's urgent." |
| S4 | minor | Every beat 3 | "A rep shows up, then Victor cuts in" five times (uptown-3 already varies it) | industrial-3: drop the rep; Big Sal finds the machines himself ("Who let a robot in my break room?"); Victor only in the closing panel |
| S5 | minor | suburbs-1 / industrial-1; Dale's perk text | The same "hire a manager" tip twice; "walk-ins … 85% of full price (was 70%)" is jargon | Big Sal: "Cold pizza, you're done. Upgrade those ovens."; perk: "Suburbs dine-in customers pay almost full price" |
| S6 | minor | uptown-3 title "Five Stars" | Gives away the cliffhanger if titles show before the scene (the player hides them until the last panel; the Scrapbook shows seen scenes only) | Retitle "The Review" |
| S7 | minor | waterfront-4 "You saved this old dock, kid. Saved me, too, I reckon." | Anyone could say it | "You saved this old dock, kid. Now I've got nowhere left to complain but your shop." |
| S8 | minor | downtown-2 "Twelve pizzas. Is small. Is a start. Keep going, eh?" | Flat | "Twelve pizzas. In my day, twelve was Tuesday." |

**Protect:** "a whisper of patience" (downtown-4) → paid off in uptown-2; Big Sal's "Then I hate Thursdays." → "And so's my Thursday."; "Pineapple. You put pineapple on Mama's pizza." / "And I'd do it again."; "Boats don't PARK, you barnacle!"


## v5.4 — rewards text (low effort, 2026-10-30): SATISFIED (advisory)
S9 day-30 visitor lines (VISITOR_LINES: Nonna "Thirty days. You eat, you come back. Good, eh?", Big Sal "Thirty days, no sick days. Union'd be proud, kid.", Genevieve "Thirty days, darling. Do try to keep up."); S10 clock reason "Your phone's clock looks off. Rewards resume once it catches up."; S11 streak-save copy names the reset; S12 "Day 30 · Nonna Rosa visits"; S13 "30 min" tiles; S14 "7 days" spelled out; S15 one duration style; S16 "Collection: empty. Open a weekly chest or reach day 28."; S17 keep the unlock text; S18 "Show up on 5 different days". All folded into v5.5 except S18 (pending). Next ID S19.
