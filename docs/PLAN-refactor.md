# Refactoring plan (review of 2026-11-18, at `e0100e1`)

Status: **plan only, nothing built.** This came from a read-only review: `node_modules` was not installed, so tsc and jest were not run. Every number below comes from grep or `wc` on the tree.

## What is already sound (leave it alone)
- **Layering at the bottom is clean.** `src/engine` and `src/content` import nothing from `components`, `store`, `audio` or `services`. The engine is pure and node-tested: 20.5k lines of tests against 39.8k of source.
- **City packs** (`content/cities/<id>/`, `CityDef`, `cityOf(game)`) are the right shape for v5.19's three cities.
- **Feature hooks** (`engine/features/types.ts`) give tick, value, demand and offline hooks, with per-feature saved state under `GameState.x`.
- **The scene's pure modules** (`scene/layout.ts`, `cast.ts`, `timelines.ts`, `crew.ts`, …) are well tested. Their memo discipline is documented and was measured.
- **Services** split by platform (`*.native.ts` / `*.web.ts`) behind one `services/index.ts`.

## What needs work, by impact
| # | Problem | Evidence | Why now |
|---|---|---|---|
| 1 | The engine is not fully city-generic | `game.ts:624-631` `ovenRate`, `tripSeconds`, `tripCapacity` and `tablesShown` read the home `OVEN_GRADES` / `VEHICLES` / `FOOTPRINTS`. `migrate` and `buyVehicle` already use `city.fit`. Boston only works because its fit copies the home speeds and capacities. `tuning.ts` still re-exports 9 home tables, read in 22 files (~70 sites). There are 55 hard-coded home ids in 12 non-content files: `id === 'downtown'` (sidewalk-model:340, storefront:375), `'industrial'` (storefront:472), `'waterfront'` (director:199). | v5.19 adds three cities with their own fits. A fit with different speeds would be silently wrong. |
| 2 | Shop layout is derived twice and ignores mirroring | `components/layers/shop-layout.ts` `layoutOfShop(shop)` has no id, so it can't mirror. It re-derives oven, cook and staff counts from the home `FOOTPRINTS`. 5 overlays use it, while the storefront plans its own. `content/shop-layout.ts` `MIRRORED` is keyed by home ids, so no Boston shop can be mirrored. | Open owner question in STATE (shot 145: wrench at x330, oven at 256). |
| 3 | `engine/game.ts` is a 1,464-line monolith | One file holds state types, migration, the rate model, costs, purchases, offline, story triggers, hints and bundles, plus open notes A33 and A36. | Every engine card touches it, so parallel cards conflict. |
| 4 | The store depends on the UI layer | `store/game-store.ts:5-8` imports `components/store/ad-model`, `store-model`, `endgame/banner-state` and `stack-model`. 712 lines and ~60 actions mix persistence, ad flows, audio and analytics. | A34 (open). Blocks testing the store without the component tree. |
| 5 | The game screen holds the goal-bar logic | `app/index.tsx:197-280`: about 80 lines of candidate building, sorting and fallbacks inline in `GameScreen`, rebuilt on every 200 ms tick (the screen subscribes to the whole `game`). It hard-codes "Bid on Pier 9 to save Marisol's dock". The drawer encodes actions as strings (`'decor:<kind>'`). | Untestable in node. Copy will leak into the next city with a bid (C137). |
| 6 | Art files grow by one city at a time | `backdrop.tsx` is 1,808 lines, and Boston added `BostonScene`, `BostonWindow`, `BostonObject` and `BostonSignature` to it. `portrait.tsx` is 834 lines, with `BOSTON_OUTFIT` inline. | v5.19's CITY card runs three times. Without a split, backdrop.tsx heads for about 3k lines and three cards edit one file. |
| 7 | Copy is in five systems | `endgame/copy.ts`, `layers/layer-copy.ts`, and the University, Industrial and Uptown `copy.ts` files each have their own `copy()`, `lc()` or `fillText`. `city-dress.ts` overrides per city. `content/hooks.ts` and `heads.ts` hold more lines, and models still hard-code text ("Nonna in …" in city-model:32, ad-model and rewards-model). The files say "GENERATED … regenerate", but **no generator exists in the repo**: the tests only compare. | C146 (open). Every new city has to dress all five systems. |
| 8 | Hand-rolled micro-stores and buses | 4 copies of the same `useSyncExternalStore` flag (`report/sheet-state`, `layers/sheet-state`, `endgame/banner-state`, `university/sheet-state`), plus 3 wrappers. 4 copies of the same listener-set bus (`pulse-bus`, `reveal-bus`, `jam-bus`, `audio/bus`). | Cheap win; each new layer adds another copy. |
| 9 | Feature registry fills on a side-effect import | `FEATURES` stays empty until something imports `engine/features/index.ts` (the store does it). Any script or test that calls `game.ts` without that import runs with no features, and nothing errors. | A silent wrong-answer trap for scripts (`pacing-fit.ts`, `scripts/review/*`). |
| 10 | No safety net outside the loop | No CI for tsc or jest (`.github/workflows` only has `pages.yml`). No lint config (AGENTS.md admits it). No formatter: 130 source lines are over 250 chars. | Refactors need a mechanical gate. |
| 11 | Wall-clock reads everywhere | 84 `Date.now()` calls outside services and audio. | A37 (open). Tests and rollbacks need one clock. |
| 12 | Comment noise | 1,268 review-ID references (D477, G95, C112…) and 238 version tags in `src` comments. | Comments say which ticket, not why. Low priority, but it raises the cost of reading every file. |
| 13 | Repo weight | `screenshots/` is 785 MB tracked, and `.git` is 973 MB. | Every cloud session clones it fresh. |

## Ground rules for every phase
- **Behaviour-preserving.** Each card passes `npx tsc --noEmit` and the full `npm test` with **no test edited except imports**. On screenshots, `review_shots.py` must report **0 changed** shots (seam-noise shots 00/24/104/105/29–31b excepted). Changed pixels mean it was not a refactor.
- One phase = one or two programmer cards with disjoint files, run through the normal loop. Codecritic at medium on each range.
- Keep save keys and saved strings byte-identical (`LAYER_KEYS` values, `SAVE_KEY`, `x[...]` keys). Renames are code-only.
- Move first with a re-export shim, migrate callers, then delete the shim in a later card. Never do both in one diff.

## Phases

### P0: Safety net (small; first)
- `.github/workflows/ci.yml`: `npm ci`, `npx tsc --noEmit`, `npm test` on push and PR.
- ESLint via `expo lint` (flat config, `eslint-config-expo`), warnings only at first. Turn on `import/no-cycle` and a `no-restricted-imports` rule for `src/engine/**` and `src/content/**`: they must not import `components`, `store`, `audio` or `services`. Do the same for `src/store/**`, so it can't import `components` once P3 lands.
- Extend `home-ids-guard.test.ts` (T109) to every non-art module, with an allowlist that P1 shrinks to zero.
- A **test city fixture** (`src/content/cities/__fixtures__/test-city.ts`) with deliberately different fit speeds, capacities, footprints, a bid and a mirrored shop. A smoke test plays it like `boston-smoke.test.ts`. It fails today because of item 1, which proves the guard works.

### P1: City-generic engine and content (before v5.19 wave 4: E4 and CITY)
- **Rates from the fit:** `ovenRate`, `tripSeconds`, `tripCapacity`, `deliveryRate`, `tablesShown`, `patioTables` and `queueSizes` take the `CityFit` (or `city`), and callers pass `cityOf(s)`.
- **Delete the home re-exports** in `tuning.ts` (`OVEN_GRADES`, `FOOTPRINTS`, `VEHICLES`, `NEIGHBORHOODS`, `HEADS`, `MANAGERS`, `PERKS`, `PIER9_BID`, `CITY_NAME`). Migrate the ~70 sites in 22 files (index.tsx 9, drawer-model 7, shop-ui 4, stars-model 4, city.tsx 4, …) to `cityOf(game)`.
- **Lookup:** one lazy `Map<NeighborhoodId, {city, def}>` in `content/cities/index.ts` (U24). `def` stays total and `findHood` returns `| undefined` (C147). Drop the `HOME_CITY` defaults in `mastery.ts:48,53` and `jamShare`.
- **Generic names:** `nonnaPizzasLeft`/`nonnaCountdownText` become `founder*`, and `pier9Available`/`pier9Price`/`bidPier9` become `bidAvailable`/`bidPrice`/`placeBid` (store, screen, teaser, boats-model, drawer). `STORY_PACING.downtownBeat4GapSeconds` becomes `firstHoodBeat4GapSeconds`.
- **Home-id checks become data:** `id === 'downtown'` becomes `id === firstHood(city)`. The `'industrial'` jam check becomes `layerOf(city, id) === 'shifts'`. Director `'waterfront'` becomes `city.bid.hood`.
- **Layers by kind, not by hood:** remove `hood` from `GAME_DAY`, `BOATS`, … in `content/layers.ts`. Callers use `layerHood(city, kind)`. Rename the feature and component folders by kind: `features/layers/suburbs-gameday.ts` becomes `game-day.ts`, and `components/layers/suburbs/` becomes `layers/game-day/`, and so on. `LAYER_KEYS` values stay.
- **Per-city voice into `CityDef`:** `BARKS`/`HEAD_BARKS` (Boston heads are silent today: T2's open need), `ORDER_CAST`, night-oven and tutorial lines, and the founder's name.
- **One shop layout (needs-owner: answers the open layoutOfShop question):** add `plan: 'standard' | 'mirrored'` to `NeighborhoodDef` (or a `CityDef.mirrored` set). Then one `shopLayout(id, shop, city)` in `scene/` returns the draw-space layout. The storefront and the 5 overlays (jam-overlay, night-tint, critic-scene, gameday-scene, harbour-scene) all call it. `components/layers/shop-layout.ts` goes away. *Note: this is the one card in the plan that changes pixels, in mirrored shops. Get Julien's go first and review it as a fix, not a refactor.*
- Acceptance: the P0 test-city smoke test passes, the home-ids-guard allowlist is down to the art modules only, and there are 0 changed shots outside the mirrored-shop fixtures.

### P2: Split `engine/game.ts`
Keep `game.ts` as a barrel that re-exports, so no caller changes in this phase. Under `src/engine/`:
- `state.ts`: interfaces, `new*`, `STAT_KEYS`, `SAVE_VERSION`, `ECONOMY`.
- `migrate.ts`: `migrate`, `migrateLine`, `migrateRewards`, `migrateStats`, `migrateBonus`, `migrateOrders`.
- `economy.ts`: costs, milestones, rates, `featureMults`, `shopRevenue`, `valuePerPizza`, earnings, stages, bottleneck.
- `purchases.ts`: `upgradeCostOf`, locks, `buy*`, `build*`, bid, vehicle, decor. Add `canAfford(s, cost)` and `pay(s, cost)`, used by every spend site, including night-oven, uptown, boats and vanity (A36).
- `offline.ts`: `offlineTick`, `applyOffline`, `offlineCapOf`.
- `story.ts`: triggers, `pendingScenes`, `storyWaitHint`, `markSceneSeen`, `applyReward`, plus `migrateStory` and `challengeOffered` moved out of game.ts's imports of rival and scenes (A33).
- `hints.ts`: `upgradeGain`, `vehicleGain`, `buildGain`, `bottleneckBundle`, `bundleHint`, `shopBuildKey`, `shopLevelKey`.
- `clock.ts`: `gameNow()`, for every game-time `Date.now()` in the store and the views. Animation keeps `Date.now` (A37).
- **Registry:** a function that touches features (`playTick`, `featureMults`, `offlineTick`) throws in dev and test when `FEATURES` is empty, and scripts import `engine/features` explicitly. The cycle fix A31 stays.
- A follow-up card migrates imports from the barrel to the modules, then the barrel shrinks to nothing.

### P3: Store layering and slices
- Move the domain maths out of `components/store/ad-model.ts` and `store-model.ts` (`claimDelta`, `applyDouble`, `offlineBoost`/`Extra`/`Factor`, `repairByAd`, `rerollDaily`, `applyGrant`, `parsePrefs`) into `src/engine/monetization.ts` (pure) or `src/store/`. The components keep only the view text. `banner-state` and `stack-model.offerWaits` become store state or an engine predicate (A34).
- Split `game-store.ts` into slice files composed in one `create()`: `core` (load, save, tick, background), `shop` (buy, tap, build, fleet, decor), `rewards` (daily, weekly, chest, gift, booster), `monetization` (claims, doubles, ads, grants, Plus), `layers` (rival, rack, menu, jam, ingredients, critic, defend), and `story` (scene queue, finish, replay). The `Store` type stays the same.
- Persistence goes through `services/kv.ts` (no direct `AsyncStorage` import in the store).
- Fold in C148 (franchise uses `whenLoaded`; false while loading) and C134 (one AppState handler, in GameRunner).
- Acceptance: the P0 lint rule bans `store → components` and passes.

### P4: Game screen and HUD
- `goal-model.ts`: `goalCandidates(game, id, now): GoalView[]` (pure). It covers hires, build, fleet, bid, big buys, mastery and story, with the D494 far-away rule and D341/B1 ordering. Actions come back as a typed `GoalAction` union, not closures. The screen maps an action to a store call, and the result is memoised on `shopLevelKey` plus the cash bucket. The bid label comes from `city.bid` copy. Tests port the current behaviour first (a golden test over seeded saves).
- `hud-model.ts`: the subtitle chain (`index.tsx:282-301`).
- Drawer: typed `DrawerBuy` union instead of `'decor:<kind>'` strings (C137). `lotView` returns numbers plus `founderName` (C146).
- Split `game-ui.tsx` (851 lines) into `buy-button.tsx`, `hud.tsx` (with GoalLine and ProgressRing), `offline-popup.tsx` (with the oven art), `night-oven-sheet.tsx` and `toast.tsx`.
- Narrow `GameScreen`'s subscription (selectors for `active`, `cash` bucket and keys). Measure with the existing `usePerfMarks` before and after, and record both in the card report.

### P5: Shared UI infrastructure and copy
- `src/lib/flag-store.ts` with `createFlag<T>(initial)` returning `{get, set, subscribe, useValue}`. It replaces the 4 flag stores and the 3 wrappers (named `use…` hooks kept for React Compiler).
- `src/lib/bus.ts` with `createBus<T>()`. It replaces pulse, reveal, jam and the audio bus internals. `grant-bus` stays, because it buffers.
- **Copy, one system:** `src/content/copy/`, with one `fill(template, vars)`, a home table, and a per-city override table (`city-dress.ts` generalised and moved out of components). The generated tables move from `components/` to `content/copy/`. Write the generator the headers promise (`scripts/gen-copy.ts`: docs/story/COPY-*.md to the .ts tables) and keep the existing compare tests as its check. Hard-coded lines in models ("Nonna in", ad-model, rewards-model, the goal bar) become keys with a `{founder}` var.

### P6: Art modules that scale per city (before the v5.19 CITY cards)
- `backdrop.tsx` becomes `cutscene/backdrops/`: `index.tsx` (the `Backdrop` component, the `SCENES` registry, zoom), `shared.tsx` (Ground, Billboard, sky and glow tables), `props.tsx` (OrderSlip, NameTag, PhoneFootage, IconProp, VendingMachine, SoldSign), and one file per city (`home.tsx`, `boston.tsx`). A new city is one new file plus one registry line.
- `portrait.tsx` becomes `portrait/`: `look.ts` (`LOOKS`, `AGED`, `lookFor`, `DISPLAY_NAMES`), `bust.tsx`, `stage.tsx`, `hair.tsx`, `outfits/home.ts` and `outfits/boston.ts`.
- `storefront.tsx` (846 lines): pull out `useBarks`, `useCrewStep` and `useMoments` hooks (run `stepMoments` only on a key change: U21), plus the cue-placement block, so the component only assembles the frame. Keep `'use no memo'` and the 15 fps clock as they are.
- `scene/identity.ts` and the Boston looks go into a per-city look registry, alongside the backdrops.

### P7: Hygiene (any time no cards are in flight)
- **Formatting:** adopt Prettier (`printWidth: 160`) in **one** formatting-only commit, listed in `.git-blame-ignore-revs`. Turn on the lint rule after it.
- **Comments:** comments say *why*. Review IDs and version tags go into commit messages and review files. Strip them from files a card already touches; no big-bang pass.
- **`components/store/`** (in-app purchases and ads) is easily confused with `src/store/` (zustand). Rename it to `components/shop-iap/` or `components/monetization/` with P3.
- **Screenshots:** move `v5.0`–`v5.17*` to `idleslicearchive`, as was done for the pre-v5.0 folders on 2026-11-13, or move them to Git LFS. Needs Julien: it's his rule to ask before pruning.

## Order and sizing
| Phase | Cards | Depends on | Blocks | Risk |
|---|---|---|---|---|
| P0 | 1 (E) | — | everything | low |
| P1 | 2–3 (E: rates + re-exports + names; U: layers by kind + layout; T: per-city voice) | P0 | v5.19 E4 and CITY | **medium** (touches many call sites; the layout card changes pixels in mirrored shops) |
| P6 | 2 (S: backdrop + portrait; S: storefront hooks) | — | v5.19 CITY | low (pixel-identical gate) |
| P2 | 2 (E: split; E: callers off the barrel) | P1 | P3 | low |
| P3 | 2 (E: monetization maths; E: slices) | P2 | P4 | medium (save and load paths) |
| P4 | 2 (U: goal and HUD models; U: game-ui split) | P3 | — | medium (goal-bar ordering is subtle; port it with golden tests) |
| P5 | 2 (U: flags and buses; T: copy) | P1 | — | low |
| P7 | as needed | P0 | — | low |

**Recommended slot:** run P0, P1 and P6 as a refactor build (v5.18.5) before v5.19's wave 4. Wave 1–3 is writer work and doesn't conflict with it. P2–P5 then interleave with v5.19 waves wherever their files don't overlap a running card.

## Open-note mapping
P1 closes C146, C147, U24, T109, the K1 leftovers and the layoutOfShop question. P2 closes A33, A36, A37, M62 and U12 (the early-out lands naturally in `economy.ts`). P3 closes A34, C134, C148 and T104. P4 closes C137 and U19. P6 closes U21 and A29. A32 and T94 (the station-rate hook) fit P2's `economy.ts`, but they change behaviour, so they stay a separate E card.

## Decisions for Julien
1. Go on the layout plan: mirroring as city data, one `shopLayout`. Mirrored shops' pixels change.
2. Slot: a v5.18.5 refactor build before v5.19 wave 4, or interleaved?
3. Prettier one-shot reformat: yes or no?
4. Archive or LFS for `screenshots/v5.0–v5.17*`.
