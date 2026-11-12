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
