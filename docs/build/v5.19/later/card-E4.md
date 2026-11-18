# Card E4 — the showdown (v5.19, lane E)

(Rewritten 2026-11-18 for the refactor cards, which have all landed when this card runs. The three cities' fits moved to card E4f, which runs once the three packs exist, because the pacing sim plays each city's story.)

**Goal:** the game's last challenge: five rounds, one per city, after Los Angeles's last finale.

**Read first:**
- `docs/API.md`;
- `src/engine/features/franchise.ts`;
- `src/engine/features/layers/rival.ts` (the challenge pattern: `rivalTarget`, `rivalView`, `startRivalChallenge`);
- `src/engine/story.ts` (`triggerPasses`);
- `sed -n '/^## The showdown/,/^## /p' docs/story/CITIES-BIBLE.md`, and the showdown section of `docs/story/LOS-ANGELES-SCRIPT.md`.

## The code as the refactor left it
- **Imports.** `engine/game.ts` is only a barrel now (card R2), and card R2b deletes it after you. Import from the modules:
  - `engine/state` (types, `GameState`);
  - `engine/economy` (`shopRate`, `featureMults`);
  - `engine/purchases` (`canAfford`, `pay`, `BuyResult`);
  - `engine/story`;
  - `engine/clock` (`gameNow`).
  Never import `engine/game`.
- **Rates read the fit** (card R1). `shopRate(shop, vehicle, fx, fit)` takes `cityOf(g).fit`, so the round target follows the city's own speeds.
- **No spend.** The showdown costs nothing. If you add a spend, it goes through `canAfford` and `pay`.
- **Time.** The engine takes `now` as an argument, as `rivalView` does. The store and the views pass `gameNow()`, never `Date.now()`.
- **City ids** are `CITY_ORDER`'s (`content/franchise.ts`): `home`, `boston`, `chicago`, `newyork`, `la`. "Los Angeles's last finale" means the last finale scene in `CITIES.la`.

## Files
- Own:
  - `src/engine/features/showdown.ts` and its test;
  - `src/content/showdown.ts`;
  - `src/engine/__tests__/migrate-showdown.test.ts` (new).
- Shared, append-only (re-read each file immediately before editing it; add, change nothing that exists):
  - `src/engine/features/index.ts`: the registration line.
  - `src/engine/features/franchise.ts`: `showdown` in `KEPT_FEATURES` or `RESET_FEATURES` (every feature is listed in one of them; there is no city after LA, so pick the one that keeps a won round).
  - `src/content/types.ts`: one `SceneTrigger` member, `{ kind: 'showdown'; round: number }`. Rounds 1–5 play before each round; round 6 is the ending.
  - `src/engine/story.ts`: that kind in `triggerPasses`.
  - `src/content/rewards.ts`: `'crown-empire'` in `COSMETIC_NAMES`.
  - **The store, one action, `startShowdownRound()`.** It goes in `src/store/game-store.ts` beside `startRival`, because card R3 has not split the store yet. R3 runs next and moves it into `src/store/slices/layers.ts` with `startRival`. Call `startShowdown…(get().game, gameNow())` there, as `startRival` does.
- At the end, regenerate `docs/API.md`: `npx tsx scripts/api-digest.ts`. CITY(los-angeles) finds `showdownView` there.
- Do not touch: the city packs (`src/content/cities/**`), `scripts/pacing-*.ts` (card E4f).

## Steps
- [ ] **1. Showdown** (`showdown.ts`, a `Feature` with its own saved state under `GameState.x`, like rival's).
  - It is available when Los Angeles's last finale has been seen.
  - Five rounds, one per city, in `CITY_ORDER`.
  - A round is a 5-minute challenge to sell `ceil(5 min × the current shop's pizza rate × 1.5 × 1.2)` pies. Build it from rival's target helper, so the 1.2 stays one constant.
  - A lost round can be retried after 2 minutes. Rounds won stay won.
  - Winning the fifth sets the ending as due and grants the cosmetic `crown-empire` and 100 diamonds, once. Grant the cosmetic with `grantCosmetic` (`engine/rewards.ts`), the way the weekly chest does.
  - `showdownView(g, now)` for the UI: round, target, progress, time left, retry time.
- [ ] **2. Scenes.** The `showdown` trigger passes for round `r` when round `r` is next (before it starts), and for 6 once the fifth is won. CITY(los-angeles) writes the scenes.
- [ ] **3. After the ending:** the weekly counter-attack continues unchanged. The franchise multiplier keeps growing if the spec allows repeat franchises; otherwise, state that the multiplier is final.

## Tests that must exist
Round order; win, lose and retry; rounds persist across a save and load; the reward pays once; a v5.18 save migrates (no `showdown` state, nothing due); the trigger passes only in LA after the last finale.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/engine src/content src/store`.

## Report
Standard format, plus the `SceneTrigger` member and the store action's name.
