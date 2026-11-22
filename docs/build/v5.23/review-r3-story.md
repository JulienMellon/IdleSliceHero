# v5.23-r3 story review, round 3 (medium re-check)

Scope: `docs/story/COPY-v5.23.md` against the r3 review shots 207, 208, 208b (Store), 175 and 178i (goal bar, gift bubble). I grepped `src/` for the carried COPY §7 fixes. No cut-scene changed, so there are no hook notes.

VERDICT: NOT SATISFIED
SUMMARY: The two Store notes from r2 landed (S103, S104). The Store money copy is clean, and no pack and Starter now claim "best" on the same screen. The verdict stays NOT SATISFIED only on the count rule: nine minors are still open, and most are COPY §7 lines that are written but not yet in `src/`. Nothing is major.

HOOKS:
- none. No scene changed.

STORY & PACING:
- S67 [minor] Still open. `north-end.ts:16` boston-0 p1 backdrop is still `shop`. Land `downtown`.
- S71 [minor] Still open. `downtown.ts:45` still reads "Fine. First you bake. Tap the kitchen, one batch each tap. Tap, tap, tap!" Land "Fine. First you bake. I show you how. Watch, then tap!"
- D545 [minor] Still open. `chapter.downtown-1.line` is not in `chapters.ts`.

PLAYER COMMUNICATION:
- S103 [minor] FIXED. Shot 207: "You watched 5 ads this week. Plus skips all 5." Optional only: the line above it ends "no ad.", so the card says "ad" four times. "Every ad reward at one tap." would be tighter.
- S104 [minor] FIXED. `store-model.ts:191-193` (D569) drops the pack badge while the Starter claims the best rate. Shot 207 (first buys live): Crate carries "Best diamond-pack rate" and the Starter has no claim. Shot 208 (first buys used): the Starter says "Most diamonds per dollar in the store" and shot 208b shows no pack badge. One claim per screen. The "$2.99 / Not now" at the top of 208b is the Starter card scrolled up, so it is not an error.
- S98 [minor] Still open. `report.customers.row` "Hungry crowd" is not in `src/`.
- S95 [minor] Still open, and visible. Shot 178i shows the gift bubble "A gift, caro. Tap it!" `hooks.ts:72` and `voice.ts:201` still say "caro". Nonna says "cara" everywhere else. Land COPY §7.
- S87 [minor] Still open. `task.kind.bid.short` "Win Pier 9" is not in `src/`, so the bid goal still uses the long label and gets cut off on the bar.
- S89 [minor] Still open, with new evidence. Shot 175: the bar says "Ch 2 · Hire Lucia, head baker", but the list's first unfinished task is "Serve 424 pies in Downtown". This is the same mismatch as the Pier 9 case in r2, so it is not only the bid. Pick one rule, either list order or the task closest to done, and make the bar and the list agree. If the bar shows the closest task on purpose, the list should mark it.
- S97 [minor] Still open. No new bark, manager or Ox fixture in the review set.
- S48 [minor] Still open (Julien's call).

VOICE & COMEDY:
- `store.nudge` "In my day, we waited. Today? The Store." is still optional: "In my day, we saved. Today? The Store."
- The Starter card (shot 208) lists its contents twice: the blurb "400 diamonds, 2× income for 24 hours and the Founder awning", then the three chips. Optional: cut the blurb to Nonna's line plus the chips.

PROTECT:
- `store.starter.nonna` "I pack it myself. Like a lunch, cara."
- `tutorial.17` "Store in the phone! Modern ideas."
- `store.once` "Pay once. Yours forever."
- `booster.dinner.desc` "Every table full, every candle lit." and `booster.bignight.desc` "The ovens sing till morning."
- Pinch / Box / Crate of Diamonds, and "First buy pays double: 160 diamonds".
- `booster.full` "Ay, the slot holds 24 h. Nothing spent."
- `tutorial.report.3` "Served stops at my shortest bar. The rest, I miss."

FIXED SINCE LAST REVIEW: S103, S104.
STILL OPEN FROM LAST REVIEW: S48, S67, S71, S87, S89, S95, S97, S98, D545.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts:16 boston-0 p1 | Backdrop still `shop`; land COPY §7 `downtown` |
| S71 | minor | T | cities/home/scenes/downtown.ts:45 | Land COPY §7: "Fine. First you bake. I show you how. Watch, then tap!" |
| S87 | minor | T | copy/home/chapters.ts:122 | Add `task.kind.bid.short` "Win Pier 9"; use it on the goal bar (long label is cut off) |
| S89 | minor | U | components/goal-model.ts nextTask, shot 175 | Bar says "Hire Lucia" while list leads with "Serve 424 pies"; follow list order or mark the pick |
| S95 | minor | T | hooks.ts:72 giftLine, voice.ts:201, shot 178i | Nonna says "caro" there, "cara" elsewhere; land COPY §7 |
| S97 | minor | E | scripts/review fixtures | No shot shows a symptom bark, manager line or Ox line; add one fixture each |
| S98 | minor | T | copy/home/report.ts | Land `report.customers.row` "Hungry crowd"; add drivers-bottleneck fixture |
| D545 | minor | T | copy/home/chapters.ts downtown-1 | Add `chapter.downtown-1.line` from COPY §7 |

Next IDs: S105
