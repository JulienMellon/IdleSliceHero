# v5.23 story review, round 1 (low effort)

Scope: `docs/story/COPY-v5.23.md` (Store, cards, diamond boosters, carried fixes) against the review shots 194-197, 205-210, 64b, 108. No cut-scene changed in this build, so there are no hook notes.

VERDICT: NOT SATISFIED
SUMMARY: The Store copy is on voice. Nonna sells the Starter Pack like a packed lunch, and the booster flavor lines are strong. One major remains: the Store promises "Every pack gives exactly what it says", but "First buy: 2×" next to "80" does not say what the player receives, and "Most diamonds per dollar" may be false once the doubling applies. Four new minors and seven carried minors keep the count over the limit of three.

HOOKS:
- none. No scene changed.

STORY & PACING:
- S67 [minor] `north-end.ts:16` boston-0 p1 still uses `panel('shop', ...)` with Nonna saying "Port Marinara." Land COPY §7 `downtown`.
- S71 [minor] `downtown.ts:45` still reads "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" Land COPY §7 "Fine. First you bake. I show you how. Watch, then tap!"
- S87 [minor] `chapters.ts:122` has `task.kind.bid` only; no `task.kind.bid.short`. Land "Win Pier 9".
- D545 [minor] `chapter.downtown-1.line` is not in `chapters.ts`. Land COPY §7.

PLAYER COMMUNICATION:
- S99 [major] Store, shot 206 / 207 / 206b: Pinch shows "80" with a "First buy: 2×" badge, Box shows "400 +100 bonus" with the same badge, and the Starter card says (`store.starter.rate`) "Most diamonds per dollar in the store". The player cannot tell whether 80 is what they get or what they get before doubling. If it doubles, Pinch is 160 for $0.99 (about 162 per dollar) and beats the Starter at 400 for $2.99 (about 134 per dollar), so the claim is false for exactly the player who sees it first. This sits under the line "Every pack gives exactly what it says." → Show the real amount: `store.firstbuy` "First buy: 2× diamonds" plus "80 → 160" (Box "500 → 1000"). Change `store.starter.rate` to "Best deal at full price". If the doubling is not real, remove the badge.
- S100 [minor] Booster Shelf, shots 196, 197, 108, 64b: the shelf shows three boosters, yet the old vanity-shelf empty state still says "Shelf's empty. Check back later!" with the empty table drawing. It contradicts the screen above it. → Hide the empty state when boosters or stored boosters are listed, or on this tab use "Nothing on the shelf yet" only when the stored list is empty and say "Your stored boosters show up here."
- S101 [minor] `booster.running` is "{name} running · {time} left", but shots 196 and 197 show "2x income running · 58 m left" with no name. Either the string is not wired or the fixture has no name. → Wire it, so the player sees "Dinner Service running · 12 h 58 m left".
- S102 [minor] `booster.rush.desc` "Double income, 1 hour. The lunch crowd." The tag beside the name already says "2× · 1 h", so the first half says it twice (same for Dinner and Big Night). → Keep only the flavor line: "The lunch crowd." / "All tables full." / "The ovens sing." The "≈ $2.44M" line is the only number the card needs.
- S103 [minor] Plus card, shot 207: "Every ad reward at one tap, no ad." and `store.plus.ads` "You took 5 ad rewards this week. With Plus, they're one tap." say the same thing in the same card. → "You watched 5 ads this week. Plus skips all 5."
- `store.chip.boost` "≈ {cash} at your shop's pace" does not say it is the extra income (24 h at 2× = 24 h of bonus, $58.5M). Fine as is, but if testers read it as total income, use "≈ {cash} extra at your shop's pace". Not counted as a note.
- Shot 195: the `store.nudge` banner and the "Not enough diamonds" toast sit on top of each other at 0 diamonds. The banner sends the player to the Store, which is correct. No change.
- S98 [minor] Still open. Shot 194 still shows the header "Customers 168/min" and the bottom row "Customers 168/min". `report.customers.row` "Hungry crowd" is in COPY §7 but not in the shot. Land it.
- S95 [minor] Still open. `hooks.ts:72` and `voice.ts:201` still say "caro". COPY §7 has the fix. Land it.

VOICE & COMEDY:
- `tutorial.17` "Store in the phone! Modern ideas." Good. Nonna is amazed by the Store and still calls it "my pack". Keep.
- `store.nudge` "In my day, we waited. Today? The Store." The setup is waiting but the player's problem is having no diamonds, so "waited" does not connect. → "In my day, we saved. Today? The Store." Optional.
- `booster.full` "Ay, the slot holds 24 h. Nothing spent." It is clear and in voice, but "Ay" is the only unattributed Nonna line on the card. Fine.

PROTECT:
- `store.starter.nonna` "I pack it myself. Like a lunch, cara."
- `tutorial.17` "Store in the phone! Modern ideas."
- `booster.dinner.desc` "All tables full." and `booster.bignight.desc` "The ovens sing."
- Pack names "Pinch / Box / Crate of Diamonds" (the rule of three, with a size ladder that is its own joke).
- `store.once` "Pay once. Yours forever."
- Carried: `tutorial.report.3` "Served stops at my shortest bar. The rest, I miss." (shot 194, the dashed line now reads clearly).

FIXED SINCE LAST REVIEW: S70 (`tutorial.12` landed), S91 (shot 194 shows the new `tutorial.report.3`).
STILL OPEN FROM LAST REVIEW: S48, S67, S71, S87, S89, S95, S97, S98, D545. S89 and S97 were not re-checked (175d is "same"; no new bark fixtures).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; land COPY §7 `downtown` |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 | Land COPY §7: "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts:122, shot 178j | Add `task.kind.bid.short` "Win Pier 9"; use it on the goal bar |
| S89 | minor | E | goal-model.ts nextTask, shot 175d | Bar must show the first unfinished task in list order; 175d not in review set |
| S95 | minor | T | hooks.ts:72 giftLine, voice.ts:201 | Nonna says "caro" there, "cara" elsewhere; land COPY §7 |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S98 | minor | T | copy/home/report.ts, shot 194 | Land `report.customers.row` "Hungry crowd"; add drivers-bottleneck fixture |
| D545 | minor | T | copy/home/chapters.ts downtown-1 | Add `chapter.downtown-1.line` from COPY §7 |
| S99 | major | N | store.tsx / components/store, shots 206, 207 | Show real first-buy amounts ("80 → 160"); reword "Most diamonds per dollar" to "Best deal at full price" |
| S100 | minor | U | Booster Shelf tab, shots 196, 197, 108 | Hide "Shelf's empty. Check back later!" when boosters are listed |
| S101 | minor | N | booster.running, shots 196, 197 | Show the booster name: "Dinner Service running · 12 h 58 m left" |
| S102 | minor | T | booster.*.desc, shot 196 | Drop "Double income, N hours." (the tag says it); keep the flavor line |
| S103 | minor | T | store.plus.ads, shot 207 | "You watched 5 ads this week. Plus skips all 5." |

Next IDs: S104
