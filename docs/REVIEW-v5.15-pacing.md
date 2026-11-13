# Pacing Review: Slice Empire v5.15 (2026-11-13)

Playtest requested by Julien, for the next planning session. Nothing here has been built or decided. The seven ideas in section 3 are proposals to accept, correct or drop.

**Main finding:** the five-day length is right, but the shape inside each day is wrong. Everything a neighbourhood has to offer is used up in two sessions, and the next three or four sessions have nothing to do.

## 1. How I played
Build: v5.15 closed (commit `11caf1e`), web export, headless Chromium at 393 × 852.

- **Fresh install, on screen.** `scripts/review/play.py`: a bot that follows the coach, the goal bar and lit sidewalk buttons, with a fake clock. 27 game minutes.
- **Return sessions, on screen.** Saves from the check-in sim at the start of session 5 (day 0.68) and session 12 (day 1.87), loaded as if 4 hours away and played in real time for 150 seconds: once idle, once tapping constantly and accepting the special order.
- **A build session, on screen.** The session-12 save can afford University. A bot followed the goal bar and lit buttons for four minutes in real time.
- **In the engine.** `scripts/pacing-sim.ts` (greedy player, straight through) and `scripts/review/sim2.ts checkin` (5 minutes every 4 hours), plus a per-session diary of the check-in run: purchases, when in the session they happened, and scenes played.
- **Not covered:** touch feel, audio, a real phone, and the v5.16 layers (not built yet). The sims do not model golden pizzas, special orders, rush, daily tasks or the gift calendar.

## 2. Findings

### F1. Each neighbourhood is two full sessions, then up to four empty ones
The check-in player's diary (5 min every 4 h):

| Session | Day | Purchases | When in the session | Scenes | Notable |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.00 | 28 | 29–297 s | downtown-1…4, suburbs-1 | Downtown heads, build Suburbs |
| 2 | 0.17 | 311 | 1–300 s | suburbs-2, -3 | Suburbs heads and manager, fleet, grades, expands |
| 3 | 0.34 | 229 | 1–298 s | suburbs-4 | grades, expands, fleet |
| 4 | 0.51 | 99 | 1–4 s | none | |
| 5 | 0.68 | 0 | | none | |
| 6 | 0.85 | 0 | | none | |
| 7 | 1.02 | 165 | 1–276 s | waterfront-1, -2, -3 | build Waterfront, heads, manager |
| 8 | 1.19 | 57 | 1–202 s | waterfront-4 | Pier 9 bid, fleet |
| 9 | 1.36 | 75 | 1–3 s | none | |
| 10 | 1.53 | 20 | 1 s | none | |
| 11 | 1.70 | 17 | 1 s | none | |
| 12 | 1.87 | 0 | | none | |
| 13 | 2.04 | 154 | 1–284 s | university-1 | build University, heads, manager |
| 14 | 2.21 | 75 | 1–178 s | university-2, -3 | |
| 15 | 2.38 | 48 | 1–2 s | university-4 | |
| 16 | 2.55 | 12 | 1 s | none | fleet |
| 17 | 2.72 | 167 | 1–6 s | none | Downtown and Suburbs expands |
| 18 | 2.89 | 0 | | none | |
| 19 | 3.06 | 187 | 1–7 s | industrial-1 | build Industrial, heads, manager |
| 20 | 3.23 | 68 | 1–94 s | industrial-2, -3 | |
| 21 | 3.40 | 18 | 1 s | industrial-4 | |
| 22 | 3.57 | 109 | 1–300 s | none | |
| 23 | 3.74 | 83 | 1–3 s | none | |
| 24 | 3.91 | 0 | | none | |
| 25 | 4.08 | 0 | | none | |
| 26 | 4.25 | 224 | 1–190 s | uptown-1 | build Uptown, heads, manager |
| 27 | 4.42 | 41 | 1–189 s | uptown-2, -3 | |
| 28 | 4.59 | 26 | 1–90 s | uptown-4 | finale |

- All four story beats of a neighbourhood play within about 8 hours of its build. Then there is no story for 16 to 20 hours.
- 7 of 28 sessions have no purchase at all, and 8 more are over within seven seconds.
- The greedy player playing straight through sees the same thing as scene gaps: 905 minutes of play between suburbs-4 and waterfront-1, then 1,110, 1,060 and 1,597 minutes before University, Industrial and Uptown.

### F2. Day 0 has the worst version of it
Sessions 1 to 3 are dense: 28, 311 and 229 purchases and nine scenes. Session 4's purchases are over in 4 seconds, and sessions 5 and 6 have none. That is the stretch that decides whether a new player comes back on day 1.

### F3. The goal bar shows an unreachable number from minute 5
From the on-screen fresh-install play:

| Game time | Cash | Income | Goal bar |
| --- | --- | --- | --- |
| 5.4 min | $2.03K | | Build a pizzeria in Waterfront $2.03K / $1.15B |
| 10 min | $7.64K | $745/s | $7.70K / $1.15B |
| 25 min | $140K | $1.86K/s | $140K / $1.15B |

Suburbs cost $450, so the next shop is a 2.5-million-fold jump with no goal in between. The bar's fill does not visibly move for the rest of the first session.

### F4. What you do in a session barely changes progress
- Day-0.68 save, 150 seconds: constant play (378 taps, an accepted order) took cash from $939M to $946M; idle took it to $943M. The gap to Waterfront was $211M.
- Progress is counted in night-oven collections. Checking in every 4 hours and every 8 hours both take 28 sessions (4.6 and 9.1 days).
- Doubling the session from 5 to 10 minutes moves the finish from 4.6 to 4.0 days. Two-minute sessions every 2 hours finish in 4.3 days.

### F5. Rush and special orders don't work during the lull
- The rush pill read "RUSH ×3 · +1%". Rush is capped by customer demand (`rushBoost` in `src/components/rush-model.ts`), and the shops are demand-limited by then.
- Nonna's order asked for 82K pies in two minutes. With constant tapping the shop was at 57.6K with 20 seconds left, a pace of about 69K. I did not capture the end, so the failure is projected. It can only be won by buying upgrades.
- Its reward was $8.52M, about 4% of the gap to Waterfront. On the day-1.87 save Dale's order paid $1.87B with $244B in hand.
- For scale: each daily task paid 15 minutes of income ($25.6M) and the day-1 gift 30 minutes.

### F6. A build session goes by too fast to register
University, four minutes on screen: 126 purchases and 6 story panels. The goal bar then went straight to "Build a pizzeria in Industrial $370M / $15.0T". The sim hires all three heads and the manager within about a minute of every build.

### Smaller things seen on the way
- In the fresh-install play Downtown stayed at $66/s from minute 10 to minute 25 while Suburbs went from $678/s to $1.79K/s. Nothing on screen sent the player back to Downtown.
- At minute 25 the sidewalk lit only the unaffordable bottleneck (Ovens $158K) while Prep, Counter and Drivers were affordable with $140K in hand. The bot, which presses only lit buttons, logged over 20 minutes without a purchase. I did not check whether the unlit buttons were tappable.

## 3. Ideas
None of these are in the v5.16–5.19 version summaries or the roadmap. I did not open the cards themselves, so check E2a, E2b and T1a for overlap before planning.

| # | Idea | Fixes | Changes income? |
| --- | --- | --- | --- |
| 1 | **Spread the story beats across the cycle.** Beat 2 on the first return after the build, beat 3 at the halfway point of saving for the next shop, beat 4 at about 80%. Each of the six sessions then has a scene, with no new content. | F1 | No |
| 2 | **A ladder of sub-goals for the long save.** Split each build into three or four paid stages (permit, foundation, fit-out, grand opening), each shown on the City map's construction site. The goal bar would read "Waterfront permit $40K / $50K" at minute 10. | F2, F3 | Yes |
| 3 | **A mid-cycle purchase in each shop.** One expensive, visible item per shop priced at about 40% of the next build (a second floor, a patio, a delivery dock). The catch-up levels in older shops are cheap enough to buy in seconds; this gives sessions 3 and 4 a real decision. | F1 | Yes |
| 4 | **Active play counts for a known amount.** Golden pizzas, orders and rush fill a per-session meter that pays up to about 30 minutes of income once full: roughly an eighth of a night oven, where a session today is about 2%. | F4 | Yes |
| 5 | **Fix orders and rush for demand-limited shops.** Either let rush pull in extra customers while an order runs, or set the order target from what rush can reach. Scale the reward to the gap to the next goal (5–10%). | F5 | Slightly |
| 6 | **Slow the build session down.** Hold the manager hire back until the shop has sold a set number of pies (about 3 minutes of play). Show the next shop's goal only after the finale, so the bar does not jump to $15T in the same minute. | F6 | No |
| 7 | **Soften the 4-hour cap for people who sleep.** Offer the 8-hour night-oven tier on day 0 (today it needs Waterfront). It gives session 4 something to buy and helps the first overnight. | F2, F4 | Yes |

**Suggested order.** Idea 1 first: it is timing only and the cheapest. Idea 6 is also timing only. Ideas 2, 3, 4 and 7 change income, so they need a refit with `scripts/pacing-fit.ts` and belong in a version that already has one (v5.16's refit is card E2b, step 7).

**Interaction with v5.16.** Todd's interludes (T1a) are meant to close the dead zone, and the sim is to assert no gap over 12 minutes of play. That covers continuous play. The check-in player's empty sessions (F1) are a different measure; a test on "sessions with no scene and no purchase after the first 10 seconds" would cover it.

## 4. Decisions for Julien
- Which of ideas 1–7 to plan, and into which version.
- Idea 2: whether a build's stages add to its price or split the current one.
- Idea 4: the meter's size (default: 30 minutes of income per session, once per night-oven fill).
- Idea 6: the hold on the manager (default: about 3 minutes of sales at the shop's opening rate).

## 5. Confidence
- **Measured:** the diary, the check-in day counts, the goal-bar readings, the 150-second cash figures, the rush pill text, the order numbers up to 20 seconds before its end.
- **Projected:** the order failing (pace, not the end screen).
- **One run each:** the two return saves and the build session. The fresh-install bot presses only lit buttons, so a human who also buys unlit affordable upgrades would be somewhat ahead of its cash figures.

## 6. Reproducing
- `npm install`, then `npx expo export --platform web`.
- Python Playwright must match the installed browser: `pip install playwright==1.63.0`.
- `npx tsx scripts/pacing-sim.ts` and `npx tsx scripts/review/sim2.ts checkin`.
- `python3 scripts/review/play.py dist <out dir> 30` for the fresh install (about one real minute per game minute).
- The diary, the session-start save dump and the two real-time browser scripts were temporary and are not in the repo. The diary is `run('checkin', 300, 4 * 3600)` from `sim2.ts`, grouped by `buys[].session`; the dump is the same call with `stop.maxWall = (n − 1) × 14,700 − 1`. The browser scripts follow `scripts/review/seeded.py` with `lastSavedAt` set 4 hours back.
