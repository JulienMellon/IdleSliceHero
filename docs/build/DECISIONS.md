# Decisions for Julien

The build never waits on these. Each has a default the cards already use. Correct any of them before the version in the "Bites in" column starts and tell the orchestrator; it will pass the correction to the card's programmer. The orchestrator does not read this file.

| # | Decision | Default the plan uses | Bites in |
| --- | --- | --- | --- |
| 1 | Economy: keep the post-build tap spree, or strict fit (order values ×6,000 per shop) | Keep the v5.13 fit. Add a ×1 / ×10 / MAX buy toggle so the spree is a few taps. The strict fit makes older shops stop mattering | 5.15 |
| 2 | Booster shop currency | Boosters are never sold for diamonds (your own guardrail: diamonds are vanity-only). The shelf activates inventory; boosters come from tasks, one ad a day, and the Starter Pack | 5.15 |
| 3 | What mastery stars unlock | 6 and 12 stars each grant the next weekly cosmetic you don't own; 18 grants a new one, the master plaque | 5.15 |
| 4 | Pre-retune saves (C106) | Stamp `economy: 2`, change no cash. No outside players exist yet | 5.15 |
| 5 | Vanity prices | 150 diamonds per weekly cosmetic | 5.15 |
| 6 | Rival challenge size | 5 minutes, target = 1.2 × what the shop sells in 5 minutes now (the review said a flat 2,000 pies) | 5.16 |
| 7 | Interstitial ads and a "remove ads" purchase (October) versus the 2026-10-30 plan | Follow the 2026-10-30 plan: rewarded video only, no interstitials; Nonna's Plus is the paid way to skip ads | 5.17 |
| 8 | Analytics and crash vendors | PostHog and Sentry | 5.17 |
| 9 | Products and prices | Starter Pack $2.99 (150 diamonds, 24 h 2× boost, a founder's awning); Nonna's Plus $4.99; diamonds 80 / 500 / 1,200 for $0.99 / $4.99 / $9.99 | 5.17 |
| 10 | Home city name: real or fictional | Unnamed in the site, policy and listing drafts until you choose. My suggestion: fictional, since the later cities are real and the home city has an invented team and pier | 5.17 listing |
| 11 | Final title | "Slice Empire" in every draft, pending the trademark check | 5.17 listing |
| 12 | Who draws the final art | Keep the code-drawn SVG art the game already has; commission only the app icon | 5.17 listing |
| 13 | Audio device checks AU39–AU41 and the five lofi checks | Card A1 moves SFX and stingers to `react-native-audio-api` without waiting; you run the checks on the development build | 5.17 |
| 14 | Big numbers past 1e300 | No library; cash resets at each franchise, proven by a test | 5.18 |
| 15 | What a franchise keeps | Diamonds, cosmetics, recipe cards, stars earned, Scrapbook, purchases. Everything else per your prestige doc | 5.18 |
| 16 | The casts of Chicago, New York and Los Angeles | Written as a bible first; the build stops for your approval before any script is written | 5.19 |
| 17 | When to submit to the App Store | After 5.17. Boston and the later cities ship as updates | after 5.17 |
| 18 | Version numbering | Fix rounds keep the version number | now |

## Decided by Julien, 2026-11-13 (playtest 3)
| # | Decision | Answer | Bites in |
| --- | --- | --- | --- |
| 19 | Session 1 length | About 40 minutes; Suburbs opens at 16 | 5.16 · E0 |
| 20 | When a later shop's manager arrives | About a full day after the build, just before the next neighbourhood | 5.16 · E0 |
| 21 | Cash rewards | Cut 70 to 80% | 5.16 · E0 |
| 22 | Service stakes | Consequences: +10% at 90% served, −10% after a minute under 60% | 5.16 · P1 |
| 23 | The bottleneck guidance | The red "buy this" frame goes after the tutorial; "Buy both" stays | 5.16 · P1 |
| 24 | The five managers | Deb (Suburbs), Skip (Waterfront), Noor (University), Dee (Industrial), Anton (Uptown) | 5.16 · W2, T1a, T1b |
| 25 | The scrolling shop | Build it in 5.18, after the city as data | 5.18 · V1, V2 |

Two rules follow from 20 and 22 and are the cards' defaults; correct them before v5.16 starts if you disagree. With the manager a day away, a shop with all three heads earns at half speed while you're away (otherwise the newest shop would earn nothing offline for a day). The cold line costs 10% of value rather than walk-ins, because fewer walk-ins changes nothing while the kitchen is the limit; the shorter queue is drawn in 5.18.

## Decided by Julien, 2026-11-13 (loop update)
| # | Decision | Answer | Bites in |
| --- | --- | --- | --- |
| 26 | Update the loop before the next build | Yes. `docs/build/v5.15-loop/` (cards Q2, Q6, Q1, Q3, Q4) runs before v5.16 | now |
| 27 | Screenshots from before v5.0 | Moved to the private repo `JulienMellon/idleslicearchive` (51 folders, v0.1 to v4.9), same paths. Screenshots from v5.0 on stay here | done 2026-11-13 |
| 28 | A public playtest link (GitHub Pages) | No, for now. Card Q5 of `docs/PLAN-loop-improvements.md` is parked | n/a |
| 29 | The HUD's five round buttons, drawn at 40 pt since v5.15 r3 | Keep 40 pt. The rule becomes: drawn at 44 pt or more, or at 40 pt or more with a `hitSlop` that a test in `tap-targets.test.ts` proves reaches 44 pt. Never under 40 pt | loop · Q3, Q4; 5.16 · U5 |
| 30 | Other controls under 44 pt (the ×1 chip, the Collect, Claim and night-oven buttons, Back, the goal bar) | Fix all of them to the rule in v5.16. No exceptions except Close | 5.16 · U5 |
| 31 | Minimum text size | 10 pt | loop · Q3; 5.16 · U5 |

One default from the same plan is still unconfirmed and follows the rule at the top of this file:

| # | Decision | Default the plan uses | Bites in |
| --- | --- | --- | --- |
| 32 | Lint: `AGENTS.md` says to run it, the programmer brief forbids it, and no ESLint config exists | Drop the instruction from `AGENTS.md` until ESLint is set up. `tsc`, the tests and the layout check are the gates | loop · Q4 |

## Decided by Julien, 2026-11-13 (handoff pointers plan)
| # | Decision | Answer | Bites in |
| --- | --- | --- | --- |
| 33 | The seven ideas in `docs/REVIEW-v5.15-pacing.md` | Only idea 5 (special orders that can be won by playing) is built. Ideas 1 (spread the beats over check-ins), 2 (a ladder of sub-goals, or a nearer goal on the bar) and 7 (the 8-hour oven on day 0) are not planned. Ideas 3 and 6 are met by card E0's manager timing. Idea 4 (a meter paying 30 minutes of income) contradicts the reward cuts and is dropped | 5.16 · E0 step 3b |
| 34 | How a cloud session's work reaches `main` | Each session pushes its own `claude/` branch and opens one pull request when it ends; Julien merges | README section 6 |

## Decided by Julien, 2026-11-20 (onboarding, reading the shop, store pricing)
Source: `docs/PLAN-v5.20-onboarding.md` and `docs/PRICING-STRATEGY.md`. Supersedes #2, #9 and the "Buy both" part of the 2026-11-13 playtest decisions, and idea 2 of #33 (a nearer goal on the bar).

| # | Decision | Answer | Bites in |
| --- | --- | --- | --- |
| 35 | One highlight method | A full-screen gray scrim with one cut-out (union allowed) over any element; taps outside the cut-out are swallowed during tap steps | 5.20 |
| 36 | The goal bar | Shows the current chapter's next task; a tap always opens the task list (no buying from the bar) | 5.21 |
| 37 | Story gating | Main beats unlock when their chapter's 2–4 visible tasks are done; interludes stay timed. Chapter tasks are outcomes, never "buy X" | 5.21 |
| 38 | Bottleneck pointers | All removed after Chapter 1: "Buy both", tomato tied badges (G80), station names on the drivers pill, red/amber/green lamps, the drawer's "Bottleneck" header. Reverses 2026-11-13's "keep Buy both" | 5.22 |
| 39 | Upgrade card numbers | Capacity in pizzas a minute ("18/min → 22"), not "+$/min" | 5.22 |
| 40 | The shop's state | Shown six ways: piles, workers, customers, sound, symptom lines (never "buy X"), the report's same-coloured capacity bars against a demand line | 5.22 |
| 41 | When the report goes live | From a shop's first head hire; a 3-step tutorial explains how to read it and stops there | 5.22 |
| 42 | Starter Pack | $2.99: 400 diamonds, the Founder awning, 2× income for 24 h; introduced in the Store at the end of Chapter 1; no pop-up, no countdown | 5.23 |
| 43 | Diamond packs | 80 / 400+100 / 800+400 for $0.99 / $4.99 / $9.99; 1,600+1,000 for $19.99 in v5.24; the first buy of each pays double | 5.23, 5.24 |
| 44 | Diamonds buy timed boosters | Yes (was looks only). Rush Hour 1 h 30 💎, Dinner Service 4 h 90 💎, Big Night 12 h 220 💎, 2×, one paid-boost slot that extends (cap 24 h left) and never adds a second multiplier | 5.23 |
| 45 | Value wording | Game units only. Never "worth", "value", "save X%", struck-through prices, countdowns or "limited time" | 5.23 |
| 46 | Looks catalog | About 30 items in three tiers (60 / 150 / 400 💎), a 4–5 piece set per home neighbourhood, a weekly Featured row (never limited) | 5.24 |
| 47 | When the Store becomes available | The moment the Starter Pack is first offered, with every Shop tab open, for good. v5.20 card U0 does it for today's pop-up; v5.23's intro keeps it | 5.20 · U0; 5.23 · U5 |
