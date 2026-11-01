# Plan — acting on the v5.9 playthrough review (v5.10 → v5.13)

Source: `docs/REVIEW-v5.9-playthrough.md`. Loop rules: `HANDOFF.md`. Status: **locked with Julien, 2026-11-01.**

## 0. Owner decisions (Julien, 2026-11-01)
| # | Decision |
| --- | --- |
| Scope | Polish (B1–B5, story text, D404, C102, M59, C103) + economy (D3 walk-ins, D5 visible rush, Expand and "Buy both" on the sidewalk) + the visual ladder (D2). **Suburbs Game Day (D6) waits.** |
| Rounds | **Four review rounds in total**, then clean up and hand off whatever is open. **No codecritic this session.** The critic gates; the storycritic is advisory when text changes. |
| D3 walk-ins | **Seated first, full price.** Walk-ins take the kitchen's pies first, up to the seating rate; drivers deliver the rest. Walk-ins pay 100% (was 70%). Dale's perk: Suburbs walk-ins pay ×1.15. Also: let the restaurant grow (a patio) and **show a queue of diners and drivers.** |
| D2 ladder | The review's full table, plus the per-buy bounce, a rising "Lv N" chip, and milestone moments at Lv 25/50/100. |
| Pacing | **Let it shorten.** The D1 multi-day retune comes in a later session. |
| Story end | **Not this run:** "Lately, a drone." and the Boston ending stay as they are. The economy rebalance must decide what drones are for (D4) before that line is touched. |

## 1. Round plan
| Round | Build | Contents |
| --- | --- | --- |
| 1 | v5.10 | Polish + economy (cards A, B, C below) |
| 2 | v5.11 | The visual ladder + the diner/driver queue + the patio, and round 1's critic notes |
| 3 | v5.12 | Fix round |
| 4 | v5.13 | Fix round, then clean up and hand off whatever is still open |

## 2. v5.10 cards
### Card A — economy engine and store (`engine/game.ts`, `content/tuning.ts`, `store/game-store.ts`, engine tests, `scripts/pacing-sim.ts`)
- **D3:** `shopRevenue` and `walkInFraction` go seated-first: `walkIns = min(sold, walkInRate)`, `delivered = sold − walkIns`. Walk-ins pay `perk?.walkInShare ?? TUNING.walkInShare`, with `walkInShare: 1.0` and Dale `1.15`. The `lineRates` price stays the average per pie, so revenue still equals `shopRevenue`. Update the comments that describe the old split. Dale's perk text: "Suburbs walk-ins pay 15% extra".
- **B3:** `lastKitchenTap` is set only by a **successful manual station tap**. A refused tap, a tap on a station a head runs, and a rush tap don't hold scenes back.
- **D5 store support:** `tapShop` on a GM shop records the tap time in `rushTaps: number[]` (the last 8, wall ms, not saved).
- Tests: the walk-in split (walk-ins first, capped by seats; drivers get the rest; the Dale ×1.15 price); revenue = line pay; refused/rush taps leave `lastKitchenTap` alone. The pacing sim's completion bound is relaxed (we let it shorten); print the new completion time.

### Card B — the sidewalk, the goal bar and visible rush (`components/sidewalk-model.ts`, `sidewalk-row.tsx`, `app/index.tsx`, `shop-ui.tsx`, `scene/kitchen-hud.tsx`, new `components/rush-model.ts`, their tests)
- **B1:** the GM hire stays offered on the sidewalk and in the goal bar once the three heads are hired, while you view that shop.
- **B2:** the goal bar never offers a build that `buildLock` refuses.
- **B4:** a station at its level cap shows **EXPAND · $X** (buys Expand) while an expansion exists, never MAX.
- **"Buy both" on the sidewalk:** when stations are tied, a 44 pt pill above the sidewalk row buys the bundle (the same `bundleButton` / `buyBundle` path as the drawer).
- **B5:** "Hire an Uptown manager" (a/an picked from the name).
- **D404:** the University chip while the bid is open: "$1.8M · uses bid cash" on one line.
- **D5, visible rush (GM shops):**
  - A "Tap to rush!" pill when nothing has been tapped for 8 s.
  - While tapping ≥ 2 taps/s, a combo pill: "RUSH ×{taps} · +{pct}%".
  - `rush-model.ts` (pure) computes the combo from `rushTaps`, and the boost as `min(1/(1 − min(0.9, 0.25 × tapsPerSec)) − 1, demand/kitchen − 1)`. The kitchen speeds up but can't sell past demand.

### Card C — story text, audio and cut-scene fixes (`content/scenes/home.ts`, `audio/director.ts`, `audio/logic.ts`, `components/cutscene-player.tsx`, `components/cutscene/staging.ts`, their tests)
- The review's story table **except the uptown-4 rows** (drone line and Boston stay):
  - downtown-1 P4: both lines.
  - downtown-4 P1: "A hundred and fifty deliveries."
  - suburbs scores: en dashes.
  - suburbs-2 P3: "We lost 6–1, but that's the BEST loss…"
  - university-4 P1, industrial-4 P4: as in the table.
  - uptown-1 P2: "*one dainty bite*" becomes a caption.
  - Curly quotes and … in every scene.
- **C102 + T78:** `RarePlays` acquire/release counter, so a second play of the same rare SFX isn't cut.
- **M59:** run `warmRare`'s release loop before the sound check.
- **C103 + T79:** `cardHolder(panel)` in staging.ts returns −1 when Rosa is absent.

## 3. v5.11 cards (planned; adjusted after round 1)
### Card D — the visual ladder (D2)
- Pure `scene/ladder.ts`: which props show at a station's level, and where (station-relative, per footprint).
- Drawing in a new `scene/ladder-props.tsx`.

| Station | Lv 10 | 20 | 30 | 40 | 60 | 80 | 100 | 120 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Prep | 2nd rolling pin | flour sacks | (3rd cook, exists) | dough sheeter | stand mixer | topping rail | (gold hats, exist) | conveyor |
| Counter | box stack | (2nd cashier, exists) | warmer shelf | ticket rail | order screen | 2nd register | neon ORDER HERE | conveyor pass |
| Drivers | dispatch board | uniform jackets | 2nd parking row | vehicle wrap | radio headsets | DRIVER OF THE MONTH photo | gold helmets | — |

- Per buy: the station bounces 0.6 s and a "Lv N" chip rises from its badge.
- At Lv 25/50/100: a 1.5 s moment with confetti in the shop colour and a one-line bubble from that station's head (or Nonna in Downtown before the heads).
- Crowd budget: every prop misses every route, seat and badge.

### Card E — the queue and the patio (D3 follow-up)
- **Diner queue:** when the kitchen can't keep up with seated demand, up to 4 diners wait outside the door on the sidewalk, with a "+N" tag beyond that.
- **Driver queue:** idle drivers (`drivers × (1 − delivered / deliveryRate)`) wait in a line by the parked vehicle, up to 3 plus a "×N waiting" tag. This shows driver oversupply at a glance.
- Both sizes come from a pure `queueSizes(shop, vehicle)` in game.ts.
- **Patio:** seating levels past the footprint's indoor table cap put up to 2 umbrella tables on the sidewalk. Walk-ins use them, and the neighbourhood's signature sidewalk props stay.
- Walk-ins can sit at every table (today they use only the first 2).
- Crowd budgets for the queue, the patio and the walk-in routes.

## 4. Screenshots to add
- v5.10:
  - 34: sidewalk EXPAND at the cap
  - 35: Buy-both pill on the sidewalk
  - 36: rush combo
  - 37: GM hire on the sidewalk after three heads
  - 38: Suburbs goal bar before Nonna
- v5.11:
  - 39–41: ladder props at Lv 10/40/120
  - 42: milestone moment
  - 43: diner queue
  - 44: driver queue
  - 45: patio
