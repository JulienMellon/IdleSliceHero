# v5.23 r1 — critic (full)

VERDICT: NOT SATISFIED
SUMMARY: The Store passes the honesty checks. Every price comes from the store's own string, no card uses "worth", "value", "save", a struck-through price, a countdown or "limited", "Not now" is the same size as Buy, and "Best rate" on the Crate is true. But the Starter's "Most diamonds per dollar in the store" line is false on the very screen that offers "First buy: 2×", the looks count promises more looks than exist, a bought booster never shows on the main screen, and after "Not now" the pack is two taps away, not one.

Opened at full size: `74-gameday-chip.png` (the reminder dot). report.json: loaded true, no errors, cash_after_play $12.

## Focus answers
- **Store's own price strings:** yes. `productRows` takes `price` only from `prices[id]`, and "Loading…" or "Price unavailable" are shown otherwise (102, 205). No `$x.xx` appears in UI source.
- **Banned words:** none in the cards. "ONE PER OWNER" is a plain fact, not urgency. The "58 m left" on the Booster tab (196) is a running boost the player owns, not an offer timer. Pass.
- **"Best rate":** true. Crate 1200/$9.99 = 120 per dollar, Box 100, Pinch 81, and the same order holds with first-buy 2×. **"Most diamonds per dollar" on the Starter is not true** (G120).
- **"Not now" vs Buy:** both are 44 pt minimum, full width, same radius (206, 210). Pass.
- **Finding the pack again in one tap:** no (D558).

BLOCKERS:
- none

BUGS:
- G120 [101, 157, 206, 210 / store-model.ts `starterBestRate`] The Starter says "Most diamonds per dollar in the store" (400/$2.99 = 134 per dollar) while the Crate below it shows "First buy: 2×", which pays 2400/$9.99 = 240 per dollar. The Box (200) and Pinch (162) also beat it. So the claim is false exactly while it is on screen (all first buys unused), and two "best" claims sit side by side. → Show the line only when every first buy is used, or count first-buy diamonds in the comparison. PRICING §3 lists this line, so tag `needs-owner`.
- G121 [206b, 207 / store-model.ts `looksFor`] "Enough for 8 looks" on the Crate (and 3 on the Box), but only 6 looks are sold (`VANITY_IDS` minus the plaque). The card's own default says the count is unowned medium looks, hidden at 0. → Use min(floor(d/150), unowned sold looks) and hide the line at 0. The Starter's "Enough for 2 shop looks" chip needs the same.
- G122 [main HUD / rewards-model.ts `boostSummary`] A diamond booster's slot (`paidUntil`) is not in `runningBoosts`. With only a paid booster running, the HUD shows no boost chip, `hud.mult` is 1, and the citywide rate and shop chips show half the real income. The player pays 220 💎 for Big Night and the main screen doesn't change. → Fold `paidUntil` into `boostSummary` (mult and seconds) so the HUD boost tail shows "2× 12h".

VISUAL DESIGN:
- D559 [major] [206b, 207, 208 / store-art.tsx] The three diamond packs use the identical single gem at the same size, so $0.99 and $9.99 look the same. The Starter's hero art is a flat awning strip floating over nothing. Next to Monopoly GO's escalating pack art, the Store reads as a settings list. → Draw tiered SVG art: 1 gem; a cloth pouch with 3 gems; a wooden crate with a gem pile and a radial highlight. Hang the Founder awning on a mini storefront (door and window, a 2 pt ink outline) with a soft #F6D58E glow behind it.
- D560 [minor] [206b vs 207 / store-tab.tsx] On the Crate, "Best rate" and "First buy: 2×" don't fit on one line, so "First buy" drops to its own row and the Crate's number sits about 20 pt lower than the Box's. The Pinch card is just "80" with no second line. → Put the tags in a row under the title on every pack. Give the Pinch "First buy: 160" or "Enough for a booster" so all four cards have the same rhythm.
- D561 [minor] [74, 79, 86 at full size / diamond-chip.tsx `dot`] The reminder dot is tomato on the tomato HUD with a white border, so it reads as a hollow white ring, like a radio button. It is not a notification dot, and the gift's dot is solid yellow. → Fill it #FFC83D like the gift dot, with a 1.5 pt ink border.
- D562 [minor] [195 / shop.tsx toast, nudge-card.tsx] The "Not enough diamonds" toast sits on the tab row's top edge and covers the Booster Shelf border. Nonna's Store nudge card has no tap affordance. → Drop the toast 8 pt below the tabs. Add a "Store ›" pill on the nudge card's right side.
- D563 [minor] [108, 196, 197 / shop.tsx booster shelf] Under a full Buy list and a "Free booster" button, the tab says "Shelf's empty. Check back later!" over a dashed empty shelf. That contradicts what is shown and leaves about 200 pt of dead space. → Hide the empty-shelf art when paid or free boosters show. Title the free ones "Yours" (64b) and list them first.
- D564 [minor] [64b / engine/format.ts] "≈ $1.04Qa at your shop's pace": no player reads "Qa". → Past T, use words ("$1.04 quadrillion") or the game's own suffix table, with a legend in Settings.
- D566 [minor] [210 / store-model.ts `productChips`] At the intro (the most-watched moment), the boost chip's second line is just "income" because the pace is 0. → Fall back to "Double income for a full day".

DESIGN NOTES:
- D558 [major] [209, 210 / diamond-chip-model.ts `shopHref`] After "Not now", the chip opens `/shop?from=chip` on Shop Style, so the pack is two taps away (chip, then Store). No dot shows until the takeover (D561), and the chip only says "0" with no Store label. Julien's note 7 ("the pack seems to vanish") is only half fixed. → While the Starter isn't owned, the chip opens `?tab=store`. Otherwise reopen the last tab.
- D565 [minor] [108 / shop.tsx BoosterBuy] Greyed booster buttons (62 of 90 💎) give no reason and no route. → Tapping one says "28 more 💎" and scrolls to the Store tab. That is a tap, not a pop-up.
- D568 [minor] [178, 175 / diamond-chip.tsx] From Chapter 2 the HUD carries a "0" diamond pill, which reads as an empty wallet. → Label it with a small "Store" caption, or a shop-bag glyph beside the gem, until the first diamond arrives.
- D567 [low] [81 vs prev] "81-rival-closed" now captures the Suburbs Act 4 cut-scene, so the shot no longer shows the closed rival shop. → Confirm the beat is intended after the chapters.ts gating edit, then re-shoot past the scene.

FUN AND RETENTION:
- G122 [major]: the paid booster, the game's newest "come back before it ends" timer, is invisible on the main screen. AFK Journey keeps every running buff on the HUD with its time left. Fix it as in G122, and pulse the HUD tail basil for 2 s on purchase.
- D558 [major]: the second chance at the Starter has to be findable. Marvel Snap's shop tab opens on the offer you last looked at. Fix as above.
- [minor] The booster buy has no celebration in the shots (196 shows only the green running line). Balatro would stamp the new multiplier. → After a buy, a basil "2×" stamp flies from the card to the Back button, plus a cash-register "ding".
- [minor] The first 60 seconds, the next goal (goal bar plus task list) and the return gift are unchanged since v5.22 (the same shots). Carried notes cover them.

FIXED SINCE LAST REVIEW: D555 (194: "Served stops at my shortest bar" is in).
STILL OPEN FROM LAST REVIEW: D557, D550, D551, D552, D553, D554, D556, D547, D544, D545, D542, D535, D537, D538, D540, D481, D519, D493, D495

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| G120 | bug | N | 206, 210 / store-model.ts starterBestRate | "Most diamonds per dollar" is false while first-buy 2× is live; show only when all first buys used. needs-owner |
| G121 | bug | N | 206b / store-model.ts looksFor | "Enough for 8 looks" but 6 looks are sold; cap at unowned sold looks, hide at 0 |
| G122 | bug | U | HUD / rewards-model.ts boostSummary | Paid booster slot missing from HUD boost and mult; HUD rate shows half the real income |
| D558 | major | U | 209, 210 / diamond-chip-model.ts shopHref | After "Not now" the chip opens Shop Style; open the Store tab while the Starter is unowned |
| D559 | major | N | 206b / store-art.tsx | Same gem on all three packs; tiered SVG art (gem, pouch, crate); awning on a mini storefront |
| D560 | minor | N | 206b / store-tab.tsx | Crate tags wrap and push its number down; one tag row under the title; give Pinch a second line |
| D561 | minor | U | 74 / diamond-chip.tsx dot | Tomato-on-tomato dot reads as a hollow ring; fill #FFC83D like the gift dot |
| D562 | minor | U | 195 / toast, nudge-card.tsx | Toast overlaps the tab row; nudge card needs a "Store ›" pill |
| D563 | minor | U | 108, 196 / shop.tsx shelf | "Shelf's empty" art under a full booster list; hide it, title owned boosters "Yours", list them first |
| D564 | minor | E | 64b / engine/format.ts | "$1.04Qa" unreadable; words past T |
| D565 | minor | U | 108 / shop.tsx BoosterBuy | Greyed booster gives no reason; tap says "28 more 💎" and goes to the Store tab |
| D566 | minor | N | 210 / store-model.ts productChips | Boost chip says only "income" at pace 0; "Double income for a full day" |
| D568 | minor | U | 178 / diamond-chip.tsx | "0" diamond pill reads as an empty wallet; add a Store caption or bag glyph |
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

Next IDs: G123, D569
