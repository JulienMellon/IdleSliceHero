# v5.18 story review, round 0 (full): docs/story/BOSTON-SCRIPT.md

Scope: the script document only. Nothing is in the game yet, so no scenes, screenshots or pacing-sim minutes were checked. Home-city facts were checked against `src/content/cities/home/scenes/uptown.ts`, `src/components/endgame/copy.ts` and `docs/story/CAST.md`.

VERDICT: NOT SATISFIED
SUMMARY: The Trish B-plot is a strong retention spine: "Great news" and the name-tag ladder pull through all 32 scenes, and the Dorchester finale pays off. Two things break it: the Southie finale ends with nothing pulling forward, and Cambridge's "next explosion closes my lab" stake is contradicted by its own interlude and by the breakdown layer that goes BOOM every few minutes.

HOOKS:
- S49 [major] `southie-4`, last line "Southie's yours. We don't say that to outsiders. You're not an outsider." It closes the loop at a finale, a likely stopping point. Trish is absent and the tag jumps SENIOR VP → EXECUTIVE VP with no promotion shown. → Keep that line. Add panel 4 (southie · Kayla Dunn neutral): caption *On the bar: a pretzel, chewed to a stub. Under it, a very large tip.* **Kayla Dunn:** "She came back. Same order. If she's from out of town, I'm from Back Bay."
- All other endings pull forward. No note on `fenway-4`: the caption-only star panel is the best closer in the script.

STORY & PACING:
- S50 [major] `cambridge-2` p1 "Next explosion, they close my lab. The dean underlined 'next.'" Then `cambridge-5` p4 goes "BOOM" in her lab with no consequence, and `layer.cambridge.breakdown.banner` says "BOOM. Dr. Ko's oven exploded." all through play. → `cambridge-2` p1: "The dean banned explosions on campus. So I moved the experiment. To your kitchen. Surprise." `cambridge-5` p4 caption: "POP. The thermometer bursts. When the smoke clears, Trish's chair is empty."
- S51 [minor] `southie-5` p2 "A church-supper kid's order. From Dorchester." This answers "where is she from" in scene 9 of 32, and `back-bay-5` then reveals the same thing again. "Never been" is also said eight times. → Southie: "That's a kid's order. A church-supper kid's order. Nobody from away knows it." Let the bus name Dorchester first. Cut the "never been" in `fenway-5` p3 to "Cute photo." and let her sad face do the rest.
- S52 [minor] Beats 3 in North End, Southie, Back Bay, Fenway and Cambridge share one shape: "Great news" opening, confrontation, HQ lie, local rallies. → Vary two. `fenway-3` p3: Victor phones her first ("Great news, Trish?") and she flinches before answering. `cambridge-3` p3: her report is literally true for once ("Her oven is our oven"), so p4's BOOM is the punchline. Drop the "The scientist joined us" lie.
- S53 [minor] `fenway-2` "I don't think 'voice' goes on the form" vs `fenway-3` p4 "The fans pick the vendor on game day." The rules change unexplained. → "Park can't choose. So the fans pick, game day. Loudest cheer wins."
- S54 [minor] `fenway-3` p3 "instead of... Tad? Rod? Whoever." undoes the home finale ("You said it right. Took you seven tries."). → "If only I'd had you instead of... Todd. See? I know it now. Too late." Update the running-gags list.
- S55 [minor] `dorchester-2` p2 "I took an airplane." vs shipped `mastery.all` "Now I sit down. On the bus. To Boston." → "The bus was full. So: an airplane. Modern idea. I hated it. Hello, Beatrice."

PLAYER COMMUNICATION:
- S56 [minor] Ruling on "Kayla Dunn": approved. Use the full name on every bubble and in the cast table; never shorten the speaker label. Bare "Kayla" may stay in Southie-only copy (rating, perk, recipe, barks), because the Suburbs cashier is never on screen in Boston. Optional lampshade in `southie-1` p2, replacing the flour question's lead-in: **You:** "We have a Kayla back home." **Kayla Dunn:** "Is she local?" **You:** "To there." **Kayla Dunn:** "Then she's Other Kayla."
- S57 [minor] `southie-2` p1 "Local tomatoes. Local cheese." and `southie-4` p3 "Top of my rating." state a rating level, but the scenes fire on milestones and the challenge, not on the rating. A player at "From Away" is told otherwise. → p1: "You're trying. I can taste the trying. Who taught you this?" p3: "You're the most local thing on my menu. My mother's furious."
- S58 [minor] "Great News" titles `north-end-3`, `dorchester-5` and `recipe.dorchester.4`. That is two identical Scrapbook entries. → Rename `north-end-3` "Very Visible. Very Holy."
- S59 [minor] `layer.north-end.line.empty` "No line. Ring a bell." reads as an instruction, and there is no bell to tap. → "No line. Mass isn't out yet."
- Perk lines are flavour only. That is fine if the T2 effect line sits on the same card. No ID.

VOICE & COMEDY:
- S60 [minor] `cambridge-2` p2 "They call me 'boss.' I'm still getting used to it." Anyone could say it. → "Hi! Priya. I lead a tech team now. I made them a list. It has tabs."
- S61 [minor] `boston-0` p3 "New city. New shop. Same sauce." It misses the sweater from `soon.boston.signoff`. → "New city. Same sauce. Ugly sweater."
- S62 [minor] `fenway-4` p3 "Same day! Somebody pinch me!" → "Fenway's yours. And the Chowderheads won. I didn't know the scoreboard went that high."

PROTECT:
- "Lovely city, Boston. I've never been here before in my life."
- "I've heard a lot of confessions, miss. You lie better than all of them."
- "It sounds so right. Like a cash register."
- "I signed my name. I didn't sign my hands. Teach me faster."
- "Chowderheads lose. Fans want pizza."
- `cambridge-5` whole: "Do you have family in Boston?" / "No." / BOOM (keep the beat, even as POP).
- "...Great news, Victor." (`dorchester-3`) and "Louder, sweetheart. He's old."
- "I took an airplane. Modern idea. I hated it."
- `fenway-4` p4, the silent star.

FIXED SINCE LAST REVIEW: n/a (S48 is outside this document and was not re-checked).
STILL OPEN FROM LAST REVIEW: S48.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call |
| S49 | major | T | BOSTON-SCRIPT `southie-4` | Add panel 4: chewed pretzel, big tip, "If she's from out of town, I'm from Back Bay." |
| S50 | major | T | BOSTON-SCRIPT `cambridge-2` p1, `cambridge-5` p4 | Dean bans campus explosions, experiment moves to your kitchen; interlude BOOM becomes thermometer POP |
| S51 | minor | T | BOSTON-SCRIPT `southie-5` p2, `fenway-5` p3 | Don't name Dorchester in Southie; cut one "never been" (Fenway: "Cute photo.") |
| S52 | minor | T | BOSTON-SCRIPT `fenway-3` p3, `cambridge-3` p3 | Vary two beat 3s: Victor phones first; Cambridge report is literally true |
| S53 | minor | T | BOSTON-SCRIPT `fenway-3` p4 | "Park can't choose. So the fans pick, game day. Loudest cheer wins." |
| S54 | minor | T | BOSTON-SCRIPT `fenway-3` p3, running-gags list | Victor now knows "Todd": "instead of... Todd. See? I know it now. Too late." |
| S55 | minor | T | BOSTON-SCRIPT `dorchester-2` p2 | "The bus was full. So: an airplane. Modern idea. I hated it. Hello, Beatrice." |
| S56 | minor | T | BOSTON-SCRIPT `southie-1` p2, speaker label | "Kayla Dunn" approved on every bubble; optional "Other Kayla" lampshade |
| S57 | minor | T | BOSTON-SCRIPT `southie-2` p1, `southie-4` p3 | Don't state a rating level: "most local thing on my menu. My mother's furious." |
| S58 | minor | T | BOSTON-SCRIPT `north-end-3` title | Rename to "Very Visible. Very Holy."; "Great News" stays on `dorchester-5` |
| S59 | minor | T | BOSTON-SCRIPT `layer.north-end.line.empty` | "No line. Mass isn't out yet." |
| S60 | minor | T | BOSTON-SCRIPT `cambridge-2` p2 | Priya: "I lead a tech team now. I made them a list. It has tabs." |
| S61 | minor | T | BOSTON-SCRIPT `boston-0` p3 | "New city. Same sauce. Ugly sweater." |
| S62 | minor | T | BOSTON-SCRIPT `fenway-4` p3 | "And the Chowderheads won. I didn't know the scoreboard went that high." |

Next IDs: S63
