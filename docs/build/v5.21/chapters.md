# v5.21 chapters: the table (card E1, step 1; kept in step with `src/content/cities/home/chapters.ts`)

One row per main beat (beats 1-4 of the six neighbourhoods; interludes and manager-hire scenes keep their triggers). Task 1 is today's gate made visible, with its number unchanged. Tasks 2-3 teach and are finished by the tuned player (`scripts/pacing-sim.ts`'s player) before task 1. The "sim" time is when the tuned player finishes the task, in minutes since install, measured with the chapter rules: a `rate` or `noMissed` task only counts while its chapter is open for its neighbourhood (the chapter before it has played, or its shop is built). Keys: `chapter.<sceneId>.title`, `chapter.<sceneId>.teaser`, `task.<sceneId>.<n>`.

Task kinds used: `serve` (the shop's `sold`), `build`, `win` (rival challenge), `bid`, `hire` (a station head: `prep`, `oven` or `counter`), `rate` (pizzas a minute in a shop, held 30 s), `noMissed` (no missed orders for N s), `report` (opens the shop report; done by itself until v5.22 has the report tutorial). No task says "buy", "upgrade" or names a station level.

## Rules the table follows
- Beat 1 of a neighbourhood after Downtown: task 1 is `build`; the teaching task is a `rate` in the shop the player is running at the time (the one before it in the build order), because the new shop does not exist until the build. It opens when the previous finale plays.
- A `hire` of a head is only used where the tuned player's own hire comes before the beat. Waterfront's and University's heads come late, so their early beats teach `rate`.
- `rate` targets are low on purpose: about twice the shop's rate at build, and under the ~2,000 a minute that a shop's demand allows before its late upgrades, so a player who buys a few upgrades reaches them. (The first draft asked for up to 10,000; the EAGER run held a beat for 900 minutes on one, so they were cut.)
- `noMissed` is where the sim's calm streaks are long (Downtown's beat 4, Industrial's and Uptown's finales, which wait on a won challenge anyway).
- Downtown follows the card: ch2 serve 424 / hire the oven head / `rate` 6; ch3 serve 941 / hire the counter head / `report`; ch4 serve 2,217 / `rate` 30 / `noMissed`. Downtown's ch1 is the tutorial's: its beat plays at the start, so the chapter shows its tasks but does not hold the beat (`free`).

## Deviations and what the sim says
- **`noMissed` 120 s in downtown-4 is missed by the sim** (the tuned player's longest unbroken run with no missed orders in that chapter is 32 s), so it is **30 s** (the sim gets there at 10.2 min, 1.2 min before the beat).
- **downtown-2 moves: 4.5 -> 4.9 min (+9%).** The sim hires the oven head at 4.9 min; the beat plays at 4.5 min today. The sim's buy order is greedy and knows nothing about chapters; a player who reads the task list hires the oven head earlier. Reported, not tuned (Downtown is fixed by the card). downtown-3 stays at 7.9 min; every other beat of the 24 plays at the same minute as in v5.20.
- downtown-3's hire (counter head, 7.0 min) is 50 s before the beat (7.9 min): tight, but inside.
- Downtown's ch1 "second oven" is left out: it names a station level. "Earn $10" is `serve` 4 (Downtown's pizza is worth $3).
- The EAGER player of `pacing-sim.ts` (builds every shop the moment it can, upgrades little) is a different run: all 40 scenes still play and the hint still shows, but its beats come later (it is held about 500 minutes at Waterfront's beat 2 by `rate` 500/min, because it never upgrades that shop), because the player does not do the tasks. The tuned player is the pacing check.

## The table
| sceneId | gate today | plays in v5.20 (min) | tasks (kind, shop, target; sim time the tuned player finishes it) |
| --- | --- | --- | --- |
| downtown-1 | unlock (plays at start) | 0.0 | 1. serve 1, downtown; 2. serve 4, downtown; 3. hire prep head, downtown (sim 2.4 min) |
| downtown-2 | deliveries 424 | 4.5 | 1. serve 424, downtown; 2. hire oven head, downtown (sim 4.9 min); 3. rate 6/min, downtown (sim 0.5 min) |
| downtown-3 | deliveries 941 | 7.9 | 1. serve 941, downtown; 2. hire counter head, downtown (sim 7.0 min); 3. report, downtown (sim 4.5 min) |
| downtown-4 | deliveries 2,217 | 11.4 | 1. serve 2,217, downtown; 2. rate 30/min, downtown (sim 8.4 min); 3. noMissed 30 s, downtown (sim 10.2 min) |
| suburbs-1 | unlock | 17.8 | 1. build suburbs; 2. rate 300/min, downtown (sim 11.9 min) |
| suburbs-2 | deliveries 12,430 | 23.7 | 1. serve 12,430, suburbs; 2. hire prep head, suburbs (sim 17.8 min); 3. rate 500/min, suburbs (sim 18.8 min) |
| suburbs-3 | deliveries 28,045 | 30.8 | 1. serve 28,045, suburbs; 2. hire oven head, suburbs (sim 23.7 min); 3. rate 1,000/min, suburbs (sim 24.1 min) |
| suburbs-4 | challenge | 38.0 | 1. win rival, suburbs; 2. hire counter head, suburbs (sim 30.8 min); 3. rate 2,000/min, suburbs (sim 31.3 min) |
| waterfront-1 | unlock | 174.9 | 1. build waterfront; 2. rate 2,000/min, suburbs (sim 38.5 min) |
| waterfront-2 | deliveries 3,000 | 183.6 | 1. serve 3,000, waterfront; 2. rate 500/min, waterfront (sim 176.3 min) |
| waterfront-3 | deliveries 15,000 | 217.0 | 1. serve 15,000, waterfront; 2. rate 1,000/min, waterfront (sim 184.1 min) |
| waterfront-4 | bid (opens at 50,000 served: waterfront-3b) | 239.6 | 1. serve 50,000, waterfront; 2. bid, waterfront; 3. hire prep head, waterfront (sim 223.9 min) |
| university-1 | unlock | 800.0 | 1. build university; 2. rate 2,000/min, waterfront (sim 240.1 min) |
| university-2 | deliveries 30,000 | 884.3 | 1. serve 30,000, university; 2. rate 500/min, university (sim 804.5 min) |
| university-3 | deliveries 135,000 + requires waterfront-5 | 939.4 | 1. serve 135,000, university; 2. hire prep head, university (sim 892.1 min); 3. rate 1,000/min, university (sim 884.8 min) |
| university-4 | challenge | 1401.4 | 1. win rival, university; 2. hire oven head, university (sim 939.4 min); 3. hire counter head, university (sim 984.9 min) |
| industrial-1 | unlock | 1620.5 | 1. build industrial; 2. rate 2,000/min, university (sim 1401.9 min) |
| industrial-2 | deliveries 100,000 | 1711.8 | 1. serve 100,000, industrial; 2. hire prep head, industrial (sim 1647.2 min); 3. hire oven head, industrial (sim 1680.1 min) |
| industrial-3 | deliveries 360,000 + requires industrial-2b | 1741.5 | 1. serve 360,000, industrial; 2. hire counter head, industrial (sim 1711.8 min); 3. rate 1,000/min, industrial (sim 1712.2 min) |
| industrial-4 | challenge | 2234.4 | 1. win rival, industrial; 2. noMissed 120 s, industrial (sim 1749.1 min); 3. rate 2,000/min, industrial (sim 1742.0 min) |
| uptown-1 | unlock | 2281.7 | 1. build uptown; 2. rate 2,000/min, industrial (sim 2234.8 min) |
| uptown-2 | deliveries 200,000 | 2379.4 | 1. serve 200,000, uptown; 2. hire prep head, uptown (sim 2314.2 min); 3. hire oven head, uptown (sim 2350.3 min) |
| uptown-3 | deliveries 625,000 + requires uptown-2b | 2518.5 | 1. serve 625,000, uptown; 2. hire counter head, uptown (sim 2413.9 min); 3. rate 1,000/min, uptown (sim 2379.9 min) |
| uptown-4 | challenge | 4438.4 | 1. win rival, uptown; 2. noMissed 120 s, uptown (sim 2520.5 min); 3. rate 1,000/min, uptown (sim 2519.0 min) |
