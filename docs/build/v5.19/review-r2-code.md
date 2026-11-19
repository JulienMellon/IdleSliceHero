# v5.19 r2 code review (eafbb5a..HEAD, r2 fixes after ba3cd05)

VERDICT: APPROVED
SUMMARY: The r2 round closes all three r1 mediums (C150 bid copy, C152 Boston overrides, A38 lint in CI) and most of the lows, with real tests (city-r2.test.ts). Saved Boston games still load correctly. Deleting `founderHood` introduced one regression: Boston's first shop now has "Nonna" announce milestones. The remaining items are one medium and some lows.

## Boston save compatibility (C152 check)
- The save *inputs* are unchanged: `boston/__tests__/fixtures/v5.18-save.json` and `saves-v5.18.json` `boston.save` still carry the home-id service rows that a v5.18 build wrote (the Boston input has 12 rows, home and Boston). Only the expected `migrated` / `v5.18-loaded.json` outputs changed, to the six Boston ids.
- That is correct. `service.migrate` is `(_raw, _now, city) => fresh(city)`, which ignores the saved rows. Before r2, `fresh` used `city.serviceRows` (the home ids); now it uses `hoodIds(city)`. The slice holds only transient counters (below/cold/slam timers), so the dropped stale rows cost the player nothing. No other slice reads the removed fields (`founderHood`, `tutorialHead`, `serviceRows`). `git grep` finds no reader left.
- A v5.18 Boston player sees these changes on load: the first shop loses the sidewalk hire stack (it now matches home), the tutorial head and night-oven lines change, and the cut-scene perk card now shows. None of these touches the save.

BLOCKERS: none

ISSUES:
- C156 [medium] storefront.tsx:488 `downtown: id === Game.firstHood(city)` → scene/ladder.ts:487 `milestoneSpeaker` returns `'Nonna'`. Before r2 this was `founderHood(city)`, which was null for Boston. Now an unhired station in Boston's North End that reaches level 25/50/100 has Nonna speak, which is the home-voice leak city-generic.test.ts says can never happen. The BadgeRail fix two screens down already guards on `city.founder`. Fix: pass `founder: id === firstHood(city) ? (city.founder?.name ?? null) : null` and have `milestoneSpeaker(hired, headName, founder)` return `hired ? headName : founder`. This also closes C153.
- C154 [low, partly fixed] features/layers/*.ts `hoodOf` still uses `?? ''`. Only `rackPrice` got the early-out. The other readers are safe through `g.shops['']?.built`, but `valuePerPizza(hoodOf(g), shop…)` in boats.ts:186 relies on `built` being checked first. Fix: return `NeighborhoodId | null` and early-out in each tick/hook.
- C151 [low, open] app/index.tsx:306-307 still says 'Bid on Pier 9 to save Marisol's dock'. slots.tsx:146 still says "Nonna's night oven". Fix: use `t('bid.toast', {bid})` and `nightOvenView(g).name`.
- C157 [low] report/report-strip.tsx:24 `hood === 'downtown'` → Nonna portrait (newly listed in the guard's ALLOW). Fix: `hood === firstHood(city) && city.founder` → `city.founder.id` portrait.
- The `rewardsScene: 'downtown-4'` decision is documented clearly (boston/index.ts, types.ts) and pinned by T112. Note: a Boston `newGame` that is not franchised (QA/test build only) never unlocks the rewards. This is acceptable while franchising is the only way into Boston.

ARCHITECTURE:
- none new. A39 is done well: the guard now walks `.tsx` and flags imports of `content/cities/home`. The seven new ALLOW entries are honest because the walk got wider. Each one names its exit card (P6).

MEMORY:
- M69 [low, open] storefront.tsx:529 `city.barks ?? {}` still allocates a new object on every 15 fps frame for a city with no barks. Fix: use a module-level `const NO_BARKS = Object.freeze({})`.
- M70 [low] shifts/night-tint.tsx:48 `nightFeather(shape)` builds 4 path strings plus an array on every render, and mounts 4 full-scene translucent evenodd Paths where there used to be 1. That is +3 SVG nodes and about 4x sky overdraw on the GPU. Renders happen only when the `key` changes, so the JS cost is negligible. Fix: wrap it in `useMemo` on `[L, R, frame.width]`. If overdraw shows up on device, use a 12-unit linear-gradient mask instead.

CPU:
- U26 is fixed. `shopLayout` is memoised on `sceneKey`, which covers footprint, prep, ovens, counter, drivers, tables and decor (everything `shopLayout` keys on). This removes one key string and one Map lookup per frame. `sceneKey` was already built every frame, so there is no new cost.
- No new hot-path work. `placeBid` and the bid toast call `t()` only on user actions.

TESTS:
- T114 milestoneSpeaker / storefront ladder props: in a Boston game, an unhired North End station at 25 has speaker `null` (or Boston's founder), never 'Nonna'. Home Downtown still gives 'Nonna'.
- T111, T112 and T113 are present and match their notes (city-r2.test.ts).

FIXED SINCE LAST REVIEW: C150, C152, A38, A39, A40, C155, U26, T111, T112, T113 (C153 folded into C156)
STILL OPEN FROM LAST REVIEW: C151, C154 (partial), M69

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C156 | medium | S | storefront.tsx:488, scene/ladder.ts:487 | Milestone speaker from city.founder?.name, not 'Nonna' for any first shop (Boston regression) |
| C151 | low | U | app/index.tsx:306, slots.tsx:146 | Goal label from bid.name; a11y label from nightOvenLines.name |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| C157 | low | U | report/report-strip.tsx:24 | Founder portrait from firstHood(city) and city.founder, not 'downtown' |
| M69 | low | S | storefront.tsx:529 | Hoist frozen NO_BARKS instead of `?? {}` per frame |
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| T114 | low | S | ladder / storefront test | Boston North End milestone never speaks as Nonna |

Next IDs: K5, C158, A41, M71, U27, T115
