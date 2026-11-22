VERDICT: NOT SATISFIED
SUMMARY: The Store work from r1 landed: G120, G121, G122, D558, D559, D560, D561, D563, D565, D566 and D568 are fixed in pixels or code. The report is clean (loaded, no errors), but 23 older minors are still open, and the Store now has two new honesty nits (a "Best rate" that contradicts the Starter's line, and a projected-cash line on the Starter).

Opened: review set 206, 206b, 208, 208b, 207, 209, 210, 195, 196, 64b, 74, 108-booster-ad, 81 (half size); one crop of full-size 74-gameday-chip.png for the chip glyph. No console errors.

## Focus questions
- Is every price the store's own string? Yes. $2.99 / $4.99 / $0.99 / $4.99 / $9.99 come from `prices?.[id]`; while loading it says "Loading…" and after a failure "Price unavailable" (102 not re-opened). No placeholder price anywhere.
- "worth", "value", "save", struck-through price, countdown, "limited"? None on any card. A unit test also bans /ONE-TIME|worth|value|save \d|limited|left/ on the rows. The nearest thing is "≈ $58.5M at your shop's pace" on the Starter's boost chip (see D570).
- Is "Best rate" true by diamonds per dollar? Among the three packs, yes: first buys live, Crate 2,400/$9.99 = 240, Box 200, Pinch 162. With first buys used, Crate 1,200/$9.99 = 120, Box 100, Pinch 81. G120 is fixed because `bestRate` counts what the player gets today. But the Starter is 400/$2.99 = 134 per dollar, which beats the Crate's 120 (see D569).
- Is "Not now" as big as Buy? Yes. Same width, `minHeight: 44` (206, 208), white with a heavy outline. It is a calm but equal-size button.
- Can a player who said "Not now" find the pack again in one tap? Yes. `shopHref` now returns `/shop?tab=store&from=chip` while the Starter is unowned (D558). The chip also has a bag glyph and a filled gold dot (74 crop), and the Style tab nudge carries a "Store ›" pill (195). I did not find a screenshot of the chip tap after "Not now", so this is verified from code only.

## BUGS
(none new)

## VISUAL DESIGN
- D569 [minor] 208 vs 208b. With every first buy used, the Starter card says "Most diamonds per dollar in the store" while the Crate below it wears "Best rate". Each is true by its own scope, but a player reading the two gets contradicting messages. Fix: when the Starter's line is live, drop the Crate's tag, or reword the Crate's tag to "Best pack rate". Owner N.
- D570 [minor, needs-owner] 206 and 196. "≈ $58.5M at your shop's pace" is a projected cash figure on a paid card, which is close to the "worth" claim the Store copy swears off ("exactly what it says"). At pace 0 (210) it already reads "Double income for a full day". Fix: use that plain line on the paid Starter card everywhere, and keep the "≈ $ at your pace" figure on the free and diamond boosters only. Owner N.
- D564 [minor, still open] 64b. "$1.04Qa" on the Big Night line is still unreadable. Words past T, or cap the figure.
- Fixed and verified:
  - D559: the Starter has a mini striped-awning storefront, and the packs have a gem pair, a pouch and a crate (206b, 207).
  - D560: the tags are one row under the title; the Crate's "Best rate" and "First buy: 2×" sit together without pushing the number down.
  - D561: the dot is gold with a tomato rim (74 crop).
  - D563: "Yours" shows first; the empty shelf art is gone (64b).
  - D568: the shopping-bag glyph sits on the chip. It touches the "20" a little, which is a polish nit only.
- D562: the "Store ›" pill is fixed (195). The toast over the tab row is carried unchecked (178e is `noted`).

## DESIGN NOTES
- D565 fixed: a greyed booster reads "28 more" and the tap goes to the Store tab (196, code). Good.
- D566 fixed: the boost chip says "Double income for a full day" at pace 0 (210).
- G121 fixed: "Enough for 6 looks" on the Crate (capped at the looks that are sold); the Pinch shows none.
- G122 fixed: `boostSummary` now merges the paid-booster slot into the HUD multiplier.
- D567 [low, still open]: shot 81 still shows the Act 4 cut-scene. Re-shoot past it.

## FUN AND RETENTION
- The first-buy "pays double: 2,400" lines and the Starter's Nonna quote give the Store a warm, honest voice. Monopoly GO! shows its value stack more loudly, but this honesty fits the brief.
- [minor] The Store now has a visible way back after "Not now" (chip, plus the tab nudge). Eatventure keeps a persistent offer icon; the bag glyph here does the same job. Fine.
- Carried unchanged: D493 and D495 (parked by Julien), and the older goal and ribbon notes below.

FIXED SINCE LAST REVIEW: G120, G121, G122, D558, D559, D560, D561, D563, D565, D566, D568 (D562 half: the Store pill)
STILL OPEN FROM LAST REVIEW: D562 (toast), D564, D567, D557, D550, D551, D552, D553, D554, D556, D547, D544, D545, D542, D535, D537, D538, D540, D481, D519, D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| D569 | minor | N | 208, 208b / store-model.ts bestRate, starterBestRate | Starter says "Most diamonds per dollar" while Crate says "Best rate"; drop the Crate tag or reword "Best pack rate" |
| D570 | minor | N | 206 / store-model.ts productChips | Paid Starter shows "≈ $58.5M at your pace", a value claim; use "Double income for a full day". needs-owner |
| D562 | minor | U | 178e / toast | Toast overlaps the tab row; keep it clear of the tabs (Store pill on nudge card is fixed) |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D567 | low | E | 81 / fixture, chapters.ts | Shot now captures the Act 4 cut-scene; confirm the beat, re-shoot past it |
| D557 | minor | S | 186 vs 191 / pile-art.tsx | Dough stack on stand identical when balanced; hide or shrink to 2 discs when balanced |
| D550 | minor | U | 16 / drawer Expand | Amber Expand is the loudest button and points at drivers; draw it basil like other buys |
| D551 | minor | U | 189, 13, 178f / sidewalk cards | One capacity format, abbreviate both sides, never drop the current value; raise line 2 pt |
| D552 | minor | S | 137, 143 / walkout, waiting | Walk-out hidden behind strip; idle drivers merge with walk-in queue |
| D553 | minor | U | 180, chips | "no manager" / "you run it" in red plus gold halo; ink text, no halo |
| D554 | minor | U | 133, 130 / report-strip | Cold line invisible on strip; append "Word's spreading" |
| D556 | minor | U | 181, 184 / report-strip.tsx | Missed reaching 0 has no payoff; basil flash, coin burst, Nonna line |
| D547 | minor | U | 178i / Go on win row | Glow the rival challenge band after Go on a "Beat" row |
| D544 | minor | U | 178e, 178f / goal ribbon | Ribbon hides the shop chips; keep it under 1.5 s; tick badge crowds "Ch 2" |
| D545 | minor | T | 179b / Chapter 1 card | Add Nonna's story line and portrait under "The Keys" |
| D542 | minor | U | 179b / coach hand | Tutorial hand covers the "Chapter 2" label; offset it 24 pt |
| D535 | minor | U | 175 / rewards-ui | SVG clapper/gem, one lock glyph on tabs |
| D537 | minor | U | 175 / rewards-model | Rate rows show "6/6 · holding" with a full ring when over target |
| D538 | minor | U | 175 / rewards-model | Reward row names the gameplay unlock, e.g. "Daily tasks open" |
| D540 | minor | U | 175, 179b / index.tsx chips | Suburbs chip reads "Opens after Ch 4" while a chapter gates it |
| D481 | minor | S | 76, 13, 156 / street rival band | Draw the shop at about 60 pt with shutters |
| D519 | minor | S | 79, 13 / wide shop overflow | Scale wide cutaways to about 0.9x or add 12 pt margins |
| D493 | minor | E | 05 / layers pacing | Parked by Julien. Open the rival after Suburbs 2 stars |
| D495 | minor | E | 04, 148 / tuning | Parked by Julien. Step 14 asks $400 at about $0.6/s |

Next IDs: G123, D571
