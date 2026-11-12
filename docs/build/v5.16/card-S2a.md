# Card S2a — scene and HUD: Suburbs, Waterfront, the rival (v5.16, lanes S and U)

**Goal:** the player can see each of card E2a's three layers coming, happening and paying. Everything is added through `src/components/slots.tsx`. Strings come from `docs/story/COPY-v5.16.md` sections 1 and 2 by key.

**Read first:** `docs/API.md` (the views in `features/layers/suburbs-gameday.ts`, `waterfront-boats.ts`, `rival.ts`); `src/components/slots.tsx`; `src/components/endgame/` for the banner, chip and challenge-chip components from v5.15: reuse them.

## Files
- Own: `src/components/layers/suburbs/**`, `waterfront/**`, `rival/**` (new; pure `*-model.ts` files with tests beside the components), `scripts/fixtures/74_s2a.py`.
- Shared, append-only: `src/components/slots.tsx`, `src/store/game-store.ts` (actions only: buy rack tier, start rival challenge).
- Read-only helpers you may call: `src/components/scene/**` geometry, palette and people builders. If you need a change there, list it under `Needs:`.
- Do not touch: `src/engine/**`, `src/app/**`, `src/components/layers/university|industrial|uptown/**` (card S2b).

## Steps
- [ ] **1. Suburbs, Game Day.** HUD chip counting down to the next game. During the rush: a banner, a visible wave of family groups entering (reuse the people builders; respect the crowd budgets), free seats highlighted, a whistle pulse for the audio lane (`pulse-bus`, name it `gameday`). After: "+$X from Game Day" pop.
- [ ] **2. Waterfront.** A boat that arrives in the harbour backdrop, docks for 30 s and leaves, as a `SCENE_OVERLAYS` entry. The warming rack drawn by the counter with its fill level in four visible steps; a drawer card to buy its tiers. During the Pier 9 auction: the bid card shows the current price, "MegaSlice raised it" with the time to the next raise, and the cap.
- [ ] **3. The rival.** While `rivalOpen`: a MegaSlice storefront across the street in the shop scene (small, behind the sidewalk, never over the WELCOME mat or the caption zone) and a "−20% sales" tag on the HUD. When the challenge is offered: a Defend-style button and the challenge chip from v5.15 with this layer's copy. On a win: the rival's shutters come down, a coin burst, and the tag goes.
- [ ] **4. Info sheets.** One sheet per layer from a HUD chip tap: what it is, the numbers, what to buy to do better.
- [ ] **5. Carried.** Rows with owner S or U that name these neighbourhoods in the carried-notes file from your spawn prompt.

## Fixtures (`scripts/fixtures/74_s2a.py`, shots 74–81)
74 Game Day countdown chip; 75 Game Day rush with full seats; 76 boat docked, rack at tier 3 half full; 77 rack drawer card; 78 auction bid card after two raises; 79 rival open with the −20% tag; 80 rival challenge behind pace; 81 rival closed. Seeded saves, plausible numbers.

## Rules
Overlap fixes go in pure modules with a budget test that fails on the old code; then run the whole crowd suite. 44 pt targets. Primitive props; progress quantised to 5%.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/74_s2a.py`.
