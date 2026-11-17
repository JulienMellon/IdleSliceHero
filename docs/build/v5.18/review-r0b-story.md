# v5.18 story review, round 0b (re-check): docs/story/BOSTON-SCRIPT.md

Scope: the script document only, against the open notes in `review-r0-story.md`. Nothing is in the game yet, so no scenes or screenshots were checked.

VERDICT: SATISFIED
SUMMARY: Both majors are fixed. Southie now ends on Kayla's pretzel clue, and the Cambridge stake no longer contradicts its own interlude or the breakdown layer. Every minor was fixed in the script. Two small new minors came from the fixes, and S48 is carried, so the total is three.

HOOKS:
- No scene is left without a forward pull. `southie-4` now closes on "If she's from out of town, I'm from Back Bay." That pays off the pretzel and sends the player to Back Bay. The Trish name-tag ladder still runs unbroken: SENIOR VP in Southie, EXECUTIVE VP in `back-bay-3`.

STORY & PACING:
- S63 [minor] `fenway-3` p3 "Great news, Victor. I've seen the envelope." and p4 "Park can't choose. So the fans pick, game day." The p3 phone-first variation works, but "the envelope" is never set up. The line also reads as a callback to the "P." envelope from North End. Nothing says why the park can't choose. This is a small fix on top of the S53 rewrite. → p3: "Great news, Victor. I've seen the bids." p4: "Park's board is tied. So the fans pick, game day. Loudest cheer wins."

PLAYER COMMUNICATION:
- No new notes. The `north-end-3` title no longer clashes with `dorchester-5`. The `recipe.dorchester.4` card named "Great News" is a recipe, not a scene, so it is not a duplicate scrapbook entry. The `layer.north-end.line.empty` copy ("No line. Mass isn't out yet.") is clear. The perk lines are unchanged and flavour only.

VOICE & COMEDY:
- S64 [minor] `southie-1` p2 now holds three Kayla Dunn bubbles carrying four ideas: name, family, "already got a Kayla", flour. Over the mobile-first limit of about 3 seconds per panel. → Move "You're the pizza people? Where's your flour from?" to the top of p3 as her first line. p2 keeps the name and the Kayla lampshade. The "Both names, always." line then lands as the p2 closer.

Checked and clean:
- S50: `cambridge-2` p1 now has the dean ban and the move to your kitchen. `cambridge-5` p4 is a thermometer POP. The `layer.cambridge.breakdown.banner` "BOOM. Dr. Ko's oven exploded." now fits, because the experiments happen in your shop.
- S51: Southie says "From around here". The bus names Dorchester first. Fenway says "Cute photo."
- S52: Fenway has Victor jump in first. Cambridge has the literally true report ("Every page"), and the BOOM is the punchline.
- S54: Victor now says "Todd", and the running-gags list was updated.
- S55: "The bus was full. So: an airplane." fits the shipped `mastery.all` line.
- S56: "Kayla Dunn" is on every speaker label, and the lampshade is in `southie-1`.
- S57: no scene states a rating level any more.
- S60, S61, S62 all landed as written.

PROTECT:
- "Lovely city, Boston. I've never been here before in my life."
- "I've heard a lot of confessions, miss. You lie better than all of them."
- "It sounds so right. Like a cash register."
- "I signed my name. I didn't sign my hands. Teach me faster."
- "Chowderheads lose. Fans want pizza."
- `cambridge-5` whole: "Do you have family in Boston?" / "No." / POP.
- "...Great news, Victor." (`dorchester-3`) and "Louder, sweetheart. He's old."
- "The bus was full. So: an airplane. Modern idea. I hated it. Hello, Beatrice."
- `fenway-4` p4, the silent star.
- New: `southie-4` p4, "If she's from out of town, I'm from Back Bay."
- New: "And the Chowderheads won. I didn't know the scoreboard went that high."

FIXED SINCE LAST REVIEW: S49, S50, S51, S52, S53, S54, S55, S56, S57, S58, S59, S60, S61, S62
STILL OPEN FROM LAST REVIEW: S48 (carried; Julien's call, outside the script)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S63 | minor | T | BOSTON-SCRIPT `fenway-3` p3, p4 | "I've seen the bids." / "Park's board is tied. So the fans pick, game day. Loudest cheer wins." |
| S64 | minor | T | BOSTON-SCRIPT `southie-1` p2 | Move the flour question to the top of p3; p2 keeps name, family and the Kayla lampshade |

Next IDs: S65
