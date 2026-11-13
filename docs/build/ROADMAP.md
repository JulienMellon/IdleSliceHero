# Slice Empire: the wishlist in six versions

For Julien. The orchestrator does not read this file. Written 2026-11-11 against the repo at v5.13 (commit 07e9d8e) and `PLAN-wishlist.md`.

## The six versions

| Version | What ships | Cards | Reviews that run |
| --- | --- | --- | --- |
| **5.14** | Retention (night oven, welcome-back gift, teaser, golden-pizza polish, scene minors), then the seams | B3, R3, C3, K0a, K0b | critic |
| **5.15** | Endgame, economy close-out, recipe cards, head reactions, events, cosmetics drawn, shops | W1, E1, U1, S1 | critic, codecritic, storycritic on the copy doc |
| **5.16** | Playtest 3 (economy and session 1, manager prices, reward cuts, the shop report, the five managers in the story), then five neighbourhood layers, the rival, the drone job, the Todd B-plot and every pending story item | W2, E0, E2a, P1, E2b, T1a, S2a, S2b, T1b | critic, codecritic, storycritic |
| **5.17** | Ads, purchases, analytics, crash reporting, audio on device, Settings, the site, accessibility, store assets. The TestFlight candidate | N1, A1, U3, L1 | critic, codecritic, audiocritic |
| **5.18** | The city as data, the scrolling shop, the franchise, Boston, Audio v2 | K1, V1, W3, E3, T2, A2, V2 | all four |
| **5.19** | Chicago, New York, Los Angeles, the Victor Crust showdown | W4b, W4s × 3, E4, CITY × 3, A3 | all four, mostly at low effort |

That is 38 card runs (34, plus E0 and P1 in 5.16 and V1 and V2 in 5.18 from playtest 3 on 2026-11-13) for the wishlist's 65 items. I recommend submitting to the App Store after 5.17 and shipping 5.18 and 5.19 as content updates; the "Coming soon: Boston" card from 5.15 covers the gap.

## Why six and not fewer
A version boundary costs one full verify, one screenshot run and one round of critics, so fewer is cheaper, up to the point where a single round can no longer tell which change broke what. Five things force a boundary:

1. **One economy refit per version.** The tuning is a fitted set. Mastery and events (5.15), then the layers and the rival (5.16), then the franchise (5.18) each change income. Fitting them one group at a time is what lets the sim say which group moved the pacing.
2. **The seams come first.** Splitting the five largest files before the feature work is what makes the later cards small. It has to be its own no-pixel-change step, so it closes out 5.14.
3. **One native build.** AdMob, RevenueCat, Sentry, PostHog and `react-native-audio-api` all need a development build. They go into 5.17 together.
4. **Things that depend on each other.** Cosmetics must be drawn before mastery can award them. The drone job must exist before Genevieve's drone line is true. The franchise must exist before Boston.
5. **Scripts before scenes.** Boston and the three later cities have no script. Each is written and reviewed as a document before anyone transcribes it.

Merging 5.15 into 5.16 would make five versions, with eleven cards behind one refit and one critic round. I don't recommend it.

One rule changes: **fix rounds no longer bump the version number.** A version keeps its number until its gate is met, with screenshot labels `v5.15`, `v5.15-r2`, `v5.15-r3`. At most two fix rounds; leftover minors carry into the next version's cards.

## How the token cost is kept down
Measured, not estimated, unless marked.

- **The orchestrator reads three files per session** (`README.md`, `STATE.md`, one `VERSION.md`) and never opens a card, a review, a diff body, a log or a screenshot. Cards and review notes travel as file paths.
- **Critics write their review to a file and return a few lines** (verdict, counts, owners, one line per bug or major). The fix programmer reads only the open-notes table from that file.
- **The seams.** The ten files every card used to open or edit add up to about 71K tokens (285 KB; estimate at 4 bytes per token). `game.ts` alone is about 14K, `room.tsx` 15K, `home.ts` 9K, `screenshots.py` 8K. After 5.14 a feature is a new file plus one registry line, and programmers read a generated `docs/API.md` (under 300 lines) instead.
- **Narrow agents only.** A general-purpose agent costs about 60K tokens before doing anything; the `programmer` finished a small task in about 16K (your measurement, 2026-10-30). The plan uses `programmer`, the new `writer`, the four critics and the three Haiku helpers, and nothing else.
- **Two programmers at a time.** Three in parallel exhausted the 5-hour limit twice on 2026-11-11.
- **Text is reviewed as text.** Copy and scripts get their storycritic pass as a markdown file, before any code or screenshot exists.
- **Tests replace repeat critic notes.** Clamps, overlap budgets, text-fit, pacing targets, the city schema and the number ceiling are tests, so a later round can't reopen them.
- **Critics run only when their inputs changed**, at reduced effort on re-checks. Each fixture file adds 8 to 12 shots; the critic sees only new and changed ones at half size (about 0.45K tokens each).
- **One session per version.** Cards have tick boxes, so a programmer killed by a usage limit resumes from the first unticked step.

## Where each wishlist item goes

| Wishlist section | Item | Version · card |
| --- | --- | --- |
| 1 Retention | Night oven, welcome-back gift, next-scene teaser | 5.14 · R3 |
| | Golden pizza and special-order polish, G93, G94 | 5.14 · C3 |
| | Scene minors D428–D440, cheer pulse | 5.14 · B3 |
| 2 Endgame | Mastery stars, Victor's weekly counter-attack | 5.15 · E1, U1 |
| | Post-story goal bar | 5.15 · U1 |
| | Golden ovens and Flagship never reached | 5.15 · E1 (they become stars 2 and 3; the refit targets all 18 stars by day 10–14) |
| 3 Economy | Dead zone | 5.16 · T1a, E2b (Todd's interludes fill it; the sim asserts no gap over 12 minutes of play) |
| | Drones have no job | 5.16 · E2b, S2b (University zones; drones ignore distance) |
| | Walk-ins, visible rush, Expand and Buy both: the remainder | 5.15 · E1 audit, U1 |
| | Strict fit versus tap spree | 5.15 · default: keep the spree, add ×10 / MAX |
| | Economy marker C106 | 5.15 · E1 |
| 4 Layers | Suburbs Game Day; Waterfront boats, rack, live auction; the rival | 5.16 · E2a, S2a |
| | University menu and zones; Industrial shifts and jams; Uptown stars | 5.16 · E2b, S2b |
| 5 Fun extras | 24 recipe cards | 5.15 · W1, E1, U1 |
| | Head personalities, Head of the Week | 5.15 · W1, S1 |
| | Rush-hour events | 5.15 · E1, U1 |
| 6 Story | Todd B-plot, 35-scene Scrapbook, STORYLOG fold-ins | 5.16 · T1a, T1b |
| | Text fixes incl. the drone line and the Boston ending | 5.16 · W2, T1a |
| | Per-neighbourhood cut-scene backdrops | 5.16 · T1b |
| | "Boston: coming soon" card | 5.15 · W1, U1 |
| | Nonna's day-30 cameo | 5.15 · W1, S1 |
| | Big Sal and Genevieve visits | 5.15 · S1 (shown), 5.16 · W2, T1b (their lines) |
| | Story lines for the station heads | 5.16 · W2, T1a |
| 7 Rewards | Cosmetics drawn | 5.15 · S1 |
| | Diamond sinks, vanity shop, booster shelf | 5.15 · U1 |
| | Ad buttons | 5.17 · U3 |
| | Collection line in the tasks drawer | 5.15 · U1 |
| 8 Monetization | AdMob, tracking prompt, UMP | 5.17 · N1 |
| | RevenueCat purchases, Restore | 5.17 · N1, U3 |
| | Analytics events for ads and purchases | 5.17 · N1, U3 |
| | Interstitials and "remove ads" | Not built; see DECISIONS |
| 9 Franchise | Franchise to Boston | 5.18 · K1, E3, T2 |
| | Boston cast and Trish Vance | 5.18 · W3, T2 |
| | Chicago, New York, Los Angeles, the showdown | 5.19 |
| | Big-number library | 5.18 · E3 proves it isn't needed, or it becomes its own card |
| 10 Audio | Device checks AU39–AU41 | 5.17 · A1 (code), DEVICE-CHECKLIST (you) |
| | Five lofi audition checks | DEVICE-CHECKLIST (you) |
| | Audio v2, Boston theme | 5.18 · A2 |
| | AU76, AU77 unreviewed | 5.17 · audiocritic |
| 11 Launch | Settings links, opt-out, install ID | 5.17 · U3 |
| | Sentry and PostHog | 5.17 · N1 |
| | Support and privacy site; label and age-rating answers | 5.17 · L1 |
| | Listing copy, store screenshots | 5.17 · L1 (drafts) |
| | Accessibility, performance and battery | 5.17 · L1 |
| | Accounts, programs, products, icon, promo ad, TestFlight, soft launch, press kit, trademark | LAUNCH-TRACK (you) |
| 12 Decisions | All six | DECISIONS, each with a default and a deadline |

## What I found while planning
- **The Todd plan is two saves out of date.** It says save v3 → v4; the game is at v5. Card T1a rebases it to v6 and re-times the interludes against the 5-day economy.
- **Two specs are Claude Docs, not repo files:** the Todd script and the prestige design. Until they are exported, 5.16's story card and 5.18's franchise card are blocked. `SETUP.md` lists both with links.
- **The booster shop contradicts a guardrail.** `REWARDS.md` and the monetization plan both say diamonds buy vanity items only. The default here is a booster shelf that never sells boosts for diamonds.
- **A big-number library is probably unnecessary.** If cash resets at each franchise, no city needs to pass 1e300. Card E3 proves that with a test before anyone rewrites the arithmetic, which would be the single most expensive item on the list.
- **"Mudhens."** The Toledo Mud Hens are a real minor-league baseball team. Add the name to the trademark check, or rename the team.
- **Native code can't be verified here.** The web loop covers the screens through stubs; ads, purchases and device audio are verified only by you, on a phone, with `v5.17/DEVICE-CHECKLIST.md`.
