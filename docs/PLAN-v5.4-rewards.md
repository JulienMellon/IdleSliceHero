# Plan — Daily tasks, weekly tasks, daily gift (v5.4+)

Source spec: `docs/REWARDS.md` (Oct 29). Loop rules: `HANDOFF.md`. Status: **proposed by Claude 2026-10-30 night, building now; every [D#] below is a default Julien can overrule.** Save v5 goes to this feature; the Todd interludes plan (`PLAN-v4.4`) moves to save v6.

## 0. Scope decisions (defaults, correct any)
| # | Decision | Why |
| --- | --- | --- |
| D1 | Ship daily tasks (5/day) + Slice Points chests, weekly tasks (7/week) + final chest, the 30-day gift calendar, timed boosts, diamonds, owned cosmetics. | The whole REWARDS.md loop minus ads. |
| D2 | **No ad buttons yet** (reroll, "watch ad to double", ad streak save). They come with AdMob. The data model keeps a `rerollUsed` flag and a `doubled` slot so adding them is UI-only. | No ad SDK in the app; a fake button would fail App Review. |
| D3 | Streak save costs **20 diamonds** (works now). | REWARDS.md's non-ad path. |
| D4 | Boosters are **inventory**: claimed boosters go to a "Boosters" strip in the tasks drawer and start on a tap. Gift-calendar and Nonna's-visit boosts start at once. | "Use 1 booster" needs a use action; players pick their moment. |
| D5 | Cosmetics are saved and listed ("Collection" line in the drawer) but **not drawn in the scene yet**. Gold oven skin, day-28 storefront skin and weekly items are drawn in a later build. | Keeps the scene (and crowd budgets) untouched in this feature. |
| D6 | Nonna's day-30 **cameo in the shop is deferred**; her visit's 7-day 2× boost, 300 diamonds and gold oven skin ship. Later cycles: Big Sal, then Genevieve, then repeat. | Same reason as D5. |
| D7 | Task progress uses **lifetime counters** (`stats`) with a baseline stored per task (progress = counter − baseline), instead of an event bus. | Pure and testable; same result as listening to events; no listeners to leak. |
| D8 | "Tap 3 floating bonuses" is **dropped** (no floating bonuses exist). Replaced by "Bake N pizzas". | — |
| D9 | The **clipboard and gift icons go in the HUD** (book · clipboard · cash · gift · map), not on the counter in the scene. Hidden until unlock. | The counter is the most crowded spot in the cutaway (D336/D377 history). |
| D10 | Unlock = Nonna's takeover scene seen (tutorial done). The gift calendar opens on the first open of each day, after the title card, the offline popup and any story scene. | REWARDS.md. |

## 1. Content (`src/content/rewards.ts`, data only)
- `DAILY_TASK_REWARD = { minutes: 15, points: 20 }`; `DAILY_TASK_COUNT = 5`; `WEEKLY_TASK_COUNT = 7`.
- `DAILY_CHESTS = [{ points: 40, minutes: 30 }, { points: 70, minutes: 60 }, { points: 100, diamonds: 10, booster: { mult: 2, minutes: 15 } }]`.
- `WEEKLY_TASK_REWARD = { minutes: 120 }`; `WEEKLY_DIAMONDS = [8, 7, 7, 7, 7, 7, 7]` (50 total).
- `WEEKLY_COSMETICS = ['oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold']` (rotates by ISO week number).
- Daily pool (kind, scaling, eligibility):
  | Kind | Target | Eligible when |
  | --- | --- | --- |
  | `upgrades` | 10 upgrades of any kind | always |
  | `walkins` | walk-in rate × 600 s | walk-in rate > 0 |
  | `deliveries` | driver rate × 600 s | always |
  | `baked` | city pizza rate × 600 s | always |
  | `earn` | income × 1,200 s | always |
  | `offline` | collect offline earnings once | always |
  | `booster` | start 1 booster | a booster in inventory |
  | `hire` | hire 1 head or manager | an unhired head/GM exists |
  | `decor` | buy 1 decor tier | a decor tier left in a built shop |
  Targets round to 2 significant figures, minimum 5 (counts) or $100 (cash).
- Weekly pool: `dailyDone` 20; `days` 5; `hire` 1; `build` 1 (a neighbourhood left); `ovens` 5 (oven levels or grades); `earn` income × 3 h; `fleet` 1 (not maxed); `upgrades` 60; `deliveries` driver rate × 1 h. Ineligible tasks are skipped at generation.
- `GIFT_DAYS[30]`: days 1–6, 8–13, 15–20, 22–27, 29 rotate `cash 30 min` → `booster 2× 15 min` → `5 diamonds`; day 7 `50 diamonds`; day 14 `3 boosters 2× 30 min`; day 21 `boost 2× 24 h (starts now)`; day 28 `cosmetic storefront-skin-<cycle>`; day 30 `visit`: boost 2× 7 days + 300 diamonds + `oven-gold`.
- `VISITORS = ['nonna', 'big-sal', 'genevieve']` by cycle.
- `STREAK_SAVE_DIAMONDS = 20`.

## 2. State (save v5, `GameState.rewards`)
```ts
interface Rewards {
  day: string;            // local YYYY-MM-DD of the current daily set ('' = none yet)
  daily: Task[];          // { kind, target, base, claimed }
  points: number; chests: boolean[]; rerollUsed: boolean;
  week: string;           // the Monday's YYYY-MM-DD
  weekly: Task[]; weeklyChest: boolean;
  gift: { streak: number; last: string; saveUsed: boolean; cycle: number };
  diamonds: number;
  boosters: { mult: number; seconds: number }[];   // inventory
  boosts: { mult: number; until: number; source: string }[]; // running, wall ms
  cosmetics: string[];
  lastSeen: number;       // highest device ms seen (clock-rollback guard)
}
stats: { upgrades, ovens, hires, builds, fleet, decor, walkins, deliveries, baked, offline, boosters, dailyDone, days }
```
Earned cash for tasks reads `totalEarned`. v4 saves get empty rewards and zero stats.

## 3. Engine (`src/engine/rewards.ts`, pure)
- `dayKey(ms)` / `weekKey(ms)` from the device's local date.
- `refreshRewards(s, now)`: no-op before unlock or when `now < lastSeen` (clock rolled back); otherwise raise `lastSeen`, prune expired boosts, roll a new daily set when `day` changed (seeded by the day key, `stats.days += 1`, points/chests reset) and a new weekly set when `week` changed. Targets are fixed at generation.
- `taskProgress(s, task)`; `claimDaily(s, i, now)`, `claimChest(s, i, now)`, `claimWeekly(s, i, now)`, `claimWeeklyChest(s, now)`; `startBooster(s, i, now)`.
- `giftStatus(s, now)` → `{ kind: 'locked' | 'claimed' | 'ready' | 'save', day, gift }`: ready when `last` is before today; `save` when exactly one day was missed and `saveUsed` is false (saving costs 20 diamonds, then the claim continues the streak; otherwise claiming starts over at day 1). `claimGift(s, now, { repair })`. After day 30 the next claim is day 1 of the next cycle and `saveUsed` resets.
- **Reward income** = `earningsPerSecond(s)` (no boosts). Cash rewards are paid at claim time.
- **Boosts:** `boostMult(s, now) = 1 + Σ(mult − 1)` over running boosts. `lineRates` gets the multiplier on `price`, so departures, pops and revenue all agree. Offline: each boost pays `(mult − 1) ×` its overlap with the offline window, as a share of the window's earnings (4 h cap still applies).
- Counters bump in `buyUpgrade` (upgrades/ovens/hires), `buildShop`, `buyVehicle`, `buyDecor`, `lineTick`/`offlineTick` (walk-ins, deliveries, baked — `advanceLine` reports them), offline collect, booster start, daily claim.
- Claims refuse with a reason while the clock is behind `lastSeen` ("Your clock changed — rewards return soon").

## 4. UI
- **HUD:** clipboard (badge = claimable count) after the book; gift (dot when ready) before the map; both hidden until unlock.
- **Tasks drawer** (sheet over the shop, same style as the upgrades drawer): header with diamonds and boosters strip; tabs Daily / Weekly with the reset countdown; task rows (title, progress bar "12 / 40", reward, Claim button when done, ✓ when claimed); the Slice Points track with three chests (40/70/100) under the daily list; the weekly final chest naming this week's cosmetic; a "Collection" line.
- **Gift calendar** modal: 30 tiles (5 × 6), today's tile highlighted and tappable, claimed days ticked, milestone days (7/14/21/28/30) drawn larger in colour; "Repair streak · 20 💎" / "Start over" when a day was missed; a running-boost chip ("2× · 6 d 23 h") also shows in the HUD subtitle.
- Tap only, 44 pt targets, money via `money()`, pizzas via `pizzas()`.

## 5. Tests
`rewards.test.ts`: day/week keys around midnight and Mondays; generation is deterministic per day and respects eligibility; targets frozen; progress from baselines; claim rules (once, only when complete, points → chests); weekly diamonds total 50; gift streak (consecutive, one miss + save, one miss without save, two misses, day 30 → next cycle, cycle visitor); clock rollback blocks claims and resets; boost stacking is additive (2× + 2× = 3×); offline boost overlap; v4 → v5 migration; corrupt reward fields clamp. Pacing sim unchanged (rewards are off in the sim).

## 6. Build order
1. **v5.3** — the open critic/codecritic notes (in progress).
2. **v5.4 engine** — §1–3 + tests, save v5. UI: HUD icons + tasks drawer + gift modal. Screenshots: 30 tasks drawer (daily), 31 weekly tab, 32 gift calendar (day 7 ready), 33 streak-save state. Critic + codecritic.
3. **v5.5+** — fix rounds until both pass on the same build; then storycritic on the new strings (low effort).
