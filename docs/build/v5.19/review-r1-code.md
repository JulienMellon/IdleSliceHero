# v5.19 r1 — code review (range eafbb5a..HEAD, paths src scripts .github)

VERDICT: APPROVED
SUMMARY: The refactor does what it set out to do. Rates take a `CityFit`, `def` is an O(1) lookup that throws on unknown ids, there is one `shopLayout` for the storefront and every overlay, there is one `t()` copy path with pack overrides, and the art lives behind a registry with the pack guard at zero. Nothing here would ship broken. What is left is home-city words still in core files, the Boston "BUG" overrides that were carried on purpose (one of them has the wrong diagnosis), and CI not running the lint layer rules.

BLOCKERS: none

ISSUES:
- C150 [medium] `engine/game.ts:1085-1086` `placeBid` reasons ("Pier 9 is already saved", "The Pier 9 auction hasn't opened yet") and `store/game-store.ts:614` toast `'Bid on Pier 9'` are home words in core. A pack with a `bid` (the test city has one) says "Pier 9". → Build these from `cityOf(g).bid.name` (it already exists for exactly this) through copy keys `bid.done`, `bid.closed` and `bid.toast` with `{name}`.
- C152 [medium] `content/cities/boston/index.ts:33-42` plus `components/cutscene-player.tsx:47`: five BUG-tagged overrides and the home-only perk lookup mean a Boston player sees no finale perk card, the home prep head in the tutorial, and a night oven that talks of Nonna. The `rewardsScene` comment is also wrong. `features/franchise.ts:162` carries `seenScenes`, so `downtown-4` is always seen in a franchised Boston game: rewards are open from Boston's first second, not "never". The suggested fix (delete `rewardsScene`) would re-lock rewards, the service report and the bonus for existing Boston saves until `north-end-2`. → Fix the perk lookup (`cityHolding(id)?.perks[id]`), `tutorialHead`, `founderHood`, `serviceRows` and night-oven lines in one card. Make `rewardsScene` a product decision and fix its comment now.
- C151 [low] `app/index.tsx:304-306` goal label "Bid on Pier 9 to save Marisol's dock" and `slots.tsx:146` a11y "Nonna's night oven". → Use `bid.name` plus a copy key, and `nightOvenLines.name`.
- C153 [low] `scene/ladder.ts:487` hard-codes `'Nonna'` as the founder voice, so the test city's founder moments say Nonna. → Pass `founderName`.
- C154 [low] `features/layers/{boats,stars,game-day,menu,shifts}.ts` `hoodOf … ?? ''` and `layers/city-layers.ts:10`: there is a `''` sentinel id. `store/game-store.ts:560` evaluates `rackPrice` eagerly, so a pack without a boats layer gets a TypeError on `g.shops['']`. → Return `NeighborhoodId | null` and early-out (the toast cost is `null`).
- C155 [low] `storefront.tsx:231` `visitAt = Date.now()` is compared with `nowMs = gameNow()` (`:544-552`). The two clocks disagree as soon as `gameNow` is offset (the test build's time skip). → `useState(() => gameNow())`.

ARCHITECTURE:
- A38 [medium] `.github/workflows/ci.yml` runs tsc, Prettier and Jest but not `npx expo lint`. The layer errors in `eslint.config.js:26-35` (engine/content may not import components/store/audio/services) are the contract that keeps a pack separate from the core, and nothing enforces them. → Add `- run: npx expo lint`.
- A39 [low] `home-ids-guard.test.ts:18` walks only `.ts` and only literal ids. So the `HOME_CITY` imports in `cutscene-player.tsx:9` and `city-map.tsx:8`, and the `id === 'uptown'` look switches in `scene/room.tsx` and `props.tsx`, pass. → Include `.tsx` and flag `content/cities/home` imports, with an ALLOW list for the look modules. Later, rename look ids to style names in the art registry.
- A40 [low] Copy shims `layers/layer-copy.ts` and `layers/city-dress.ts` are re-exports only. → Point the readers at `content/copy` and delete the shims next version.

MEMORY:
- M69 [low] `storefront.tsx:527` `city.barks ?? {}` allocates a fresh object every 15 fps frame for Boston (no barks), about 15 objects/s. → Hoist a frozen `NO_BARKS`.
- (`shopLayout` cache at `scene/shop-layout.ts:24` is bounded at 64 and keyed by a few small ints, so retained memory is fine. The `HOME_COPY` spread is built once at module load.)

CPU:
- U26 [low] `storefront.tsx:236` calls `shopLayout` on every frame, and the jam, night-tint and critic overlay selectors call it on every store `set` (5 Hz × 3). Each call does 3 floor/min, `tablesShown`, a Map get and a template key of about 8 joined ints, roughly 1 µs and one 30–40 char string. That is about 30 strings/s in total: negligible. → Memo the storefront call on `sceneKey`; leave the overlays alone.
- Nothing else in this range adds to the hot path. `founderHood` and `layerOf` are O(1). The `fit` threading removed no caches. `t()` is one record lookup plus one regex replace, and it only runs from 5 Hz selectors.

JULIEN
1. **Affordability.** The grep finds 15 hits, but `engine/game.ts:979` already has `canAfford(s, cost)` (null-safe) and `pay()`, with 16 call sites (A36, v5.18 r4). Of the hits, 6 are not purchase checks: `offers.ts` and `ad-model.ts` (`>= 1` reward deltas), `boats-model.ts:237` (a threshold crossing) and `sidewalk-model.ts:194` (display). 4 are diamond checks: `rewards.ts:501`, `vanity.ts:30`, `rewards-ui.tsx:628`, `shop-model.ts:57`. Only `sidewalk-row.tsx:207` and `night-oven.ts:95` bypass `canAfford`. They agree today because both guard null first, so the risk is low. Yes, one switch: route those two, add `canAffordDiamonds`, and the "bottomless wallet" becomes a flag in `canAfford`/`pay`. "Need $X" texts and goal-bar progress still read `cash`.
2. **Clock.** 26 `Date.now()` sites remain, not 100. Game time already goes through `engine/clock.ts` `gameNow()` (65 sites). Every remaining `Date.now()` is animation or audio time (scene clock, fades, walks, ramps, purchase ids) except `storefront.tsx:231` (C155). One call costs about 30–50 ns on Hermes. The storefront makes about 6 per frame, the clock interval 1, and the layer selectors about 5 per 5 Hz tick: under 20 µs/s, irrelevant. The single module is worth it for the seam, not for speed, and it exists.

TESTS:
- T111 A pack with every layer `null`: `newGame` → 600 ticks, `boatsView`, `rackPrice` and store `buyRack` return false or inactive and never throw (C154).
- T112 A franchised Boston game: `rewardsUnlocked` is true on tick 1. This pins today's behaviour before C152 changes it.
- T113 Test city: the `placeBid` refusal and the bid toast contain `bid.name`, not "Pier 9" (C150).

FIXED SINCE LAST REVIEW: C146, A32, C149, U25, C147, C148, U24, A36, A37, C134, C136, C137, C133, A34, A33, A29, U21, U19, U17, M62, U12, U8, C107, T110, T109, T103, T104–T105, T94 (v5.18 r4 plus R1 lookup; spot-checked in code)
STILL OPEN FROM LAST REVIEW: none

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C150 | medium | E | game.ts:1085, game-store.ts:614 | Bid reasons and toast from cityOf(g).bid.name via copy keys; no "Pier 9" in core |
| C152 | medium | E | boston/index.ts:33-42, cutscene-player.tsx:47 | Fix perk lookup and BUG overrides; rewardsScene is a decision (franchise keeps seenScenes); correct its comment |
| A38 | medium | E | .github/workflows/ci.yml | Add npx expo lint so layer import rules gate CI |
| C151 | low | U | app/index.tsx:304, slots.tsx:146 | Goal label from bid.name; a11y label from nightOvenLines.name |
| C153 | low | S | scene/ladder.ts:487 | Founder voice from founderName, not 'Nonna' |
| C154 | low | E | features/layers/*.ts hoodOf, city-layers.ts:10 | Null instead of '' sentinel; early-out; buyRack toast cost null |
| C155 | low | S | storefront.tsx:231 | visitAt from gameNow(), same clock as nowMs |
| A39 | low | E | home-ids-guard.test.ts:18 | Walk .tsx and flag content/cities/home imports; ALLOW look modules |
| A40 | low | T | layers/layer-copy.ts, layers/city-dress.ts | Move readers to content/copy; delete shims |
| M69 | low | S | storefront.tsx:527 | Hoist frozen NO_BARKS instead of `?? {}` per frame |
| U26 | low | S | storefront.tsx:236 | Memo shopLayout on sceneKey |
| T111 | low | E | test-city layers | Pack with no layers ticks; rack/boats calls never throw |
| T112 | low | E | rewards / franchise tests | Franchised Boston: rewardsUnlocked true on tick 1 |
| T113 | low | E | test-city smoke | Bid refusal and toast use bid.name |

Next IDs: K5, C156, A41, M70, U27, T114
