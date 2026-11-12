# Card E2a — layers: Suburbs, Waterfront, the rival (v5.16, lane E)

**Goal:** three feature modules under `src/engine/features/layers/`, each registered in `features/index.ts`, each with a pure `view(g, now)` for the UI. No edits to `game.ts` except the two named below.

**Read first:** `docs/API.md`. Then `sed -n '128,129p;133p' docs/REVIEW-v5.9-playthrough.md` (your three rows of the layer table; the numbers there are the starting numbers). Use `features/counterattack.ts` as the pattern for a timed challenge and `engine/bonus.ts` for seeded spawning.

## Files
- Own: `src/engine/features/layers/suburbs-gameday.ts`, `waterfront-boats.ts`, `rival.ts`, their tests; `src/content/layers.ts` (new: every number; card E2b appends to it later).
- Shared, append-only: `src/engine/features/index.ts`.
- Minimal edits in `src/engine/game.ts`: the Pier 9 bid price reads the auction multiplier (step 2); nothing else.
- Do not touch: story triggers (`sceneTriggered`, `pendingScenes`): card T1a owns them and will read your `challengeWon`.

## Rules for every layer
Play time only. Seeded from the save and a counter, so the same save replays the same schedule. Never re-roll when the clock or time zone changes. A layer is inactive until its neighbourhood's shop is built. Old saves migrate to "inactive, schedule starts now".

## Steps
- [ ] **1. Suburbs, Game Day.** Every 8 minutes of play a 45-second rush: walk-in demand × 6, but only into free seats, so seating and Dale's perk matter. `view` gives: next game in N seconds, rush active, seconds left, seats free.
- [ ] **2. Waterfront, boats and the warming rack.** A boat docks every 3 minutes of play: 30 seconds of demand × 3. New upgrade, the warming rack, four tiers holding 20 / 40 / 80 / 160 pies: it fills from spare oven output between boats and empties into the boat rush. Price each tier at 5 / 15 / 45 / 120 minutes of the shop's income at purchase time. **Live auction:** while the Pier 9 bid is open and unpaid, MegaSlice raises the price by 5% of the base every 2 minutes of play, capped at +50%. Export `pier9AuctionMult(g)`; edit the bid-price function in `game.ts` to multiply by it.
- [ ] **3. The rival.** When a neighbourhood's beat 3 has been seen, a MegaSlice shop is open there: that shop's value × 0.8. A challenge becomes available: sell `ceil(5 min × the shop's current pizza rate × 1.2)` pies in 5 minutes. Winning closes the rival for good and sets `challengeWon(g, id)` true. Losing costs nothing; retry after 2 minutes. Existing saves: a neighbourhood whose beat 4 is already seen has the rival closed and the challenge won. Export `rivalOpen(g, id)`, `challengeWon(g, id)`, `rivalView(g, id, now)`.
- [ ] **4. Sim.** Teach `scripts/pacing-sim.ts`'s player to buy the warming rack and to take each rival challenge when its rate allows. Don't refit: card E2b does that after card T1a lands.

## Tests that must exist
Per layer: schedule determinism from a seed; inactive before the shop is built; rush only fills free seats; rack fill and drain; auction cap; rival multiplier on and off; challenge target formula, win, lose and retry; migrate of a v5.15 save, including one with beat 4 seen.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`.
