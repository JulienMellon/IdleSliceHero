# v5.24-r1 story review (low effort)

Scope: `docs/story/COPY-v5.24.md` and `src/content/copy/home/looks.ts`. They match line for line, and the char counts hold. I also read the tab strings U6 added (tier titles, "Shows in", "Owned", "Complete"), the "Cart of Diamonds" pack title, `shop-model.ts` and `rewards.ts` names. No cut-scene beat changed, so there are no hook notes. I did not open shots.

VERDICT: NOT SATISFIED
SUMMARY: The v5.24 copy is funny and in voice. The set-complete lines are the best part, and the five new GM voices (Deb, Skip, Noor, Dee, Anton) match their scenes. NOT SATISFIED only because six minors are open, over the three-minor limit. Nothing is major.

HOOKS:
- none. No scene changed. The set-complete lines are rewards, not scene endings.

STORY & PACING:
- S67 [minor] Carried. `north-end.ts:16` boston-0 p1 still uses `panel('shop', ...)` under the caption "Port Marinara. Every Rosa's has a manager now". Change `'shop'` to `'downtown'`.

PLAYER COMMUNICATION:
- S106 [minor] New. The same cosmetic has two names depending on the screen. The shop card says "Golden Oven", "Golden Awning" and "Wood-Fired Oven" (`shop.item.*.name`, Title Case). The reward card uses `COSMETIC_NAMES`: "Gold oven", "Gold awning" and "Wood-fired oven". The W5 file says "sentence case, like COSMETIC_NAMES" and "the seven existing looks keep their current names", but those two sets disagree. A player who wins "Gold oven" then looks for it in the shop sees "Golden Oven". Pick one name per item. Suggest `shop.item.oven-gold.name` → "Gold oven", `shop.item.awning-gold.name` → "Gold awning", `shop.item.oven-woodfired.name` → "Wood-fired oven", and the same for the rest of the seven.
- S107 [minor] New. Card labels in `shop-model.ts:76-77` are hard-coded English and inconsistent: "Worn", "Wear", and lowercase `earn 12 stars`. Move them into copy and use "Earn {n} stars" or "Earned at {n} stars". Same for the 💎 glyph in the tier title (`shop-model.ts:171`). It works but is outside the copy system.
- S108 [minor] New. "Shows in {hood}" (U6's own string) names the place but not the set. A set piece reads like a one-off. Suggested: "Rosa's classic · shows in Downtown", or at least add the set name on the card. The set name is only visible in the set header, so the player may not link a piece to "3/4 pieces".
- S105 [minor] Carried. `tutorial.report.3` "Served never goes past my shortest bar" is still 90 chars. Trim to "Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss."
- S89 [minor] Carried. The goal bar says "Hire Lucia" while the list leads with another task (`goal-model.ts` nextTask).
- S97 [minor] Carried. No review fixture shows a symptom bark, manager line or Ox line.
- S48 [minor] Carried (Julien's call). "Game Day" vs the Playoff Rush: one name per feature (`layers/layer-copy.ts`, 8 uses across `layers.ts`, `copy/home/layers.ts` and tests).

VOICE & COMEDY:
- S109 [minor] New. `set.classic.done` "Now it looks like Rosa’s. Good, eh?" is the only Nonna line since v5.23b that drops "cara". Rewrite (38 chars): "Looks like Rosa’s now, cara. Good, eh?" Keep "Good, eh?" as the closer.
- Names checked: the "Cart of Diamonds" ladder (Pinch, Box, Crate, Cart) reads in the right order, and "Cart" is clearly the biggest. "Small looks · 60 💎", "Owned" and "Complete" are plain and clear.
- Weakest names, optional: "Sunday-best awning" and "Candy-stripe awning" are generic compared to the rest. Candidate for Classic: "Church-hat awning" (17). "Notebook-paper cloths" shortens "tablecloths" only to fit; fine.

PROTECT:
- `set.dockside.done` "Full set. Counted it twice. Still full." (Skip's running gag, with the punchline word last).
- `set.brick.done` "Whole set. Ox nodded. That’s a speech." (Dee, and Ox's silence from `voice.ts`).
- `set.diner.done` "Matching set. Coach cried. I didn’t." (Deb vs Dale).
- `set.marble.done` "The set is complete. Madame may sit." (Anton, formal; it pays off the folded napkin).
- `look.facade-marble` "Far too much marble"; `look.tipjar-dockside` "Counted-twice tip jar"; `look.facade-dockside` "Seen-worse boathouse"; `look.oven-brick` "No-sick-days oven".
- "Cart of Diamonds" (keep the Pinch, Box, Crate, Cart ladder).

FIXED SINCE LAST REVIEW: n/a (no S-note from v5.23b was addressed in this build).
STILL OPEN FROM LAST REVIEW: S48, S67, S89, S97, S105.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; change to `downtown` |
| S89 | minor | U | components/goal-model.ts nextTask, shot 175 | Bar says "Hire Lucia" while list leads with "Serve 424 pies"; follow list order or mark the pick |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S105 | minor | T | copy/home/tutorial.ts `tutorial.report.3` | Trim to "Dashed line, cara: my customers. Served stops at my shortest bar. The rest, I miss." |
| S106 | minor | T | copy/home/endgame.ts shop.item.*.name vs rewards.ts COSMETIC_NAMES | Same item has two names (Golden Oven vs Gold oven, Wood-Fired vs Wood-fired); use the sentence-case name in both |
| S107 | minor | U | components/endgame/shop-model.ts:76-77,171 | Move "Worn", "Wear", `earn N stars` and the 💎 tier suffix into copy; capitalise "Earn" |
| S108 | minor | U | shop-model.ts descOf, `shop.look.shows` | Name the set on set pieces: "Rosa's classic · shows in Downtown" |
| S109 | minor | T | copy/home/looks.ts `set.classic.done` | "Looks like Rosa’s now, cara. Good, eh?" (38 chars) |

Next IDs: S110
