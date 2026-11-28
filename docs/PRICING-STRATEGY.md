# Slice Empire — Store pricing strategy

Status: **approved by Julien, 2026-11-20** (with diamond-bought timed boosters added the same day). Supersedes the "prices are placeholders" line in `MONETIZATION-PLAN.md` (project doc) and the "diamonds buy vanity items only" line in `docs/REWARDS.md`. Built in v5.23 and v5.24 (`docs/build/v5.23/`, `docs/build/v5.24/`).

Guardrails: cosmetics may be permanent; **income boosts are always timed**; Plus is convenience, not power; no paid random rewards; 13+; no forced ads. **Diamonds buy looks and timed boosters** (changed 2026-11-20; see §4).

---

## 1. What the research says (short)

| Finding | Source | What we take from it |
|---|---|---|
| The first purchase is the hard one; buyers who make one usually buy again (Kongregate: 74% of new-buyer-pack buyers bought again; AppsFlyer 2026: about half of first-time payers buy again). | Kongregate blog; AppsFlyer via GameDev Reports | The Starter Pack's job is to make a payer, not to make money on its own. |
| Starter packs are often priced too low (59% of surveyed F2P staff would go below $5). Kongregate's $8 pack beat a $4 pack with the same resources per dollar. | Deconstructor of Fun 2024; Kongregate | $2.99 at launch; price is a test variable. |
| Anchoring and decoys: a pack next to a slightly worse one sells better. | GameAnalytics / Deconstructor of Fun (Om Tandon); GamesBrief (Will Luton) | Ladder steps are uneven on purpose. |
| Ladders follow dollar-bill steps; diamonds per dollar rise with pack size. | Game Developer (Playliner); PocketGamer.biz | $0.99 / $4.99 / $9.99, then $19.99. |
| "Most popular" badges are often false (1 game in 8 checked). | GamesBrief 2014 | Only provable badges. |
| First-purchase bonus exists but is rare (Candy Crush). | Game Developer / 80.lv | Cheap, honest reason to try each pack once. |
| EU CPC Network (Mar 2025): clear real-money prices; flagged time-limited offers as pressure. | Reed Smith; CMS; Bird & Bird | Real price on every paid item; no countdowns. |
| FTC Guides Against Deceptive Pricing cover former-price and comparable-value claims. | 16 CFR 233 | No "worth $X", no struck-through prices. |
| Idle games commonly sell timed boosts / time warps. | Wikipedia, "Incremental game" (AdVenture Capitalist) | Sell timed boosters for diamonds, capped (§4). |

**Value is stated in the game's own units, never in dollars:** diamonds, how many looks they buy, how long a boost runs, and what a boost earns **in in-game cash at the player's current pace**.

## 2. The spending side

An engaged free player earns about **900 💎 a month** (daily chest 10 × 30 = 300; weekly 50 × 4.3 ≈ 214; gift calendar ≈ 390). Today diamonds buy 6 looks × 150 = 900 and streak saves at 20. Two fixes:
- **Timed boosters for diamonds** (§4), a steady use every day. Built in v5.23.
- **A bigger looks catalog**: three tiers (Small 60 · Medium 150 · Large 400), a 4–5 piece set per neighbourhood, about 30 items and about 6,000 💎 in total, and 4 "Featured this week" items shown first (never limited). Built in v5.24.

## 3. Real-money price list

| Product id | Price | Contents | 💎 per $ | Card shows |
|---|---|---|---|---|
| `starter_pack` (once) | $2.99 | **$7K cash** (a third of the way to Suburbs) · **400 💎** · Founder awning (only here) · 2× income 30 min | 134 | "Most diamonds per dollar in the store" |
| `diamonds_80` | $0.99 | 80 💎 | 81 | — |
| `diamonds_500` | $4.99 | 400 + **100 bonus** | 100 | "+100 bonus" |
| `diamonds_1200` | $9.99 | 800 + **400 bonus** | 120 | "+400 bonus" · **Best rate** (v5.23) |
| `diamonds_2600` (v5.24) | $19.99 | 1,600 + **1,000 bonus** | 130 | "+1,000 bonus" · takes **Best rate** |
| `nonnas_plus` (once) | $4.99 | No ad needed for any ad reward · 2× offline, always | — | "Pay once. Yours forever." |

- **First buy of each diamond pack pays double** ("First buy: 2×" ribbon until used). Stated before purchase; no timer. The Starter Pack and Plus are excluded.
- No $49.99 / $99.99 at launch.
- App Store Connect: the Starter Pack's description must list $7K, 400 diamonds and 2× for 30 minutes before v5.25 ships (card N3); `diamonds_2600` must be created before v5.24 ships (Julien).

## 4. Diamond boosters (approved 2026-11-20)

| Booster | Effect | Price |
|---|---|---|
| Rush Hour | 2× income, 1 h | 30 💎 |
| Dinner Service | 2× income, 4 h | 90 💎 |
| Big Night | 2× income, 12 h | 220 💎 |

Rules:
- **One paid-boost slot.** A bought booster runs in the paid slot at 2×. Buying another while it runs **adds its time** to the slot (capped at 24 h remaining); it never adds a second multiplier. So bought boosters add at most +1 (2×) at any moment.
- Free boosters (shelf, gifts, chests, Starter Pack, day 21, day 30) work as today and add as today (boosts add, not multiply).
- Cash rewards keep ignoring every boost. The 2× offline ad and Plus keep not stacking with timed boosts.
- The card shows the in-game cash the booster earns at the player's pace: "≈ $1.2M at your shop's pace" (income × duration, labelled "about").
- Boosters are bought on the Boosters tab of the Shop, above the free shelf.

## 5. Wording

Banned: "worth", "value", "save X%", struck-through prices, "$X value", "limited time", "only today", countdowns, "X left".
Allowed: diamond counts, "+N bonus", "Enough for N looks" (live), "Only in this pack", "≈ $X at your shop's pace" (in-game cash, labelled as about), "Best rate" (only where the numbers make it true), "Pay once".

## 6. Where and when the Store appears

- The Store is available **from the moment the Starter Pack is first offered** (the end of Chapter 1), with every tab open: Vanity, Boosters, Store (Julien, 2026-11-20; DECISIONS #47). Until v5.23 replaces the pop-up, the chip appears as soon as the pop-up has been shown (v5.20 card U0).
- Starter Pack: introduced by Nonna at the end of Chapter 1 inside the Store, no pop-up, no countdown, stays at the top until bought.
- Two quiet reminders only: a dot on the Store chip at the takeover; one Nonna line the first time an unaffordable look is opened.
- No store interruptions during cut-scenes, the tutorial, or within 60 s of a purchase.

## 7. Measuring (soft launch)

Per product: viewed → purchased, first product bought, time to first purchase, repeat within 30 days. Add `store_opened{from}`, `pack_card_seen`, `booster_bought{id}`. Later tests, one at a time: Starter $2.99 vs $4.99; first-buy 2× on/off; store order. "Most popular" only after a month of sales data.

## Sources
Kongregate, "Using New Buyer Packs…"; Deconstructor of Fun, "Pricing Starter Packs" (2024); GameAnalytics, "5 effective behavioural economic monetization patterns"; GamesBrief (2013, 2014); Game Developer, "Premium currency banks in top games"; PocketGamer.biz, starter-bundle best practices and Clash of Clans currency conversion; AppsFlyer "App Monetization in 2026" via GameDev Reports; Reed Smith / CMS / Bird & Bird on the CPC Network Key Principles (Mar 2025); 16 CFR Part 233; Apple Developer, App Store pricing upgrades (2023); Wikipedia, "Incremental game".
