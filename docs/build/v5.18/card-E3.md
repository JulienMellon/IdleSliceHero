# Card E3 — the franchise (v5.18, lane E)

**Goal:** the player can franchise to Boston: give up the home city's shops for a permanent multiplier and start the next city.

**Spec:** `docs/specs/PRESTIGE.md`. It is Julien's design and it decides the formula, what resets and what the multiplier applies to. If the file is missing, report BLOCKED at once. Where the spec is silent, use the defaults below and list each one you used in the report.

**Read first:** `docs/API.md` (`src/content/cities`, `cityOf`, the feature registry).

## Files
- Own: `src/engine/features/franchise.ts` and its test, `src/engine/game.ts` (the reset path and the multiplier's one call site), `src/content/franchise.ts` (numbers), `src/engine/__tests__/number-ceiling.test.ts` (new), `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`.
- Shared, append-only: `src/engine/features/index.ts`, `src/store/game-store.ts` (one action: `franchise()`).
- Do not touch: `src/content/cities/boston/**` (card T2), `src/components/**`.

## Defaults where the spec is silent
- A franchise is offered when the current city's last finale has been seen.
- It **keeps**: diamonds, owned and worn cosmetics, recipe cards, mastery stars already earned (as a count), the Scrapbook, purchases, settings, lifetime stats.
- It **resets**: cash, shops, upgrade levels, fleet, layer state, the night-oven tier, open orders, the weekly counter-attack.
- The multiplier applies to value per pizza in every later city and shows as one number.
- The reset is one pure function, `franchise(g, now): GameState`, and it is not undoable; the UI (card T2) confirms twice.

## Steps
- [ ] **1. `franchise.ts`:** `canFranchise(g)`, `franchiseGain(g)` (what the player would get, for the confirm sheet), `franchise(g, now)`. Saves made before this version migrate to "home city, no franchises".
- [ ] **2. The number ceiling.** `number-ceiling.test.ts`: for each of the five planned cities, using the fitted set of each city pack that exists and the growth rule of the spec for those that don't yet, compute the largest cash, cost and income a player can reach with every upgrade bought and 30 days of offline earnings. Assert each is below 1e300 with a factor of 1e20 to spare, and that `format.ts` has a suffix or scientific form for every magnitude reached. If this can't pass with resets, stop and report: the fallback is a big-number library, which is a separate card.
- [ ] **3. `format.ts`:** make sure numbers past the last named suffix print in a readable form. Test the boundaries.
- [ ] **4. Sim and fit.** The check-in player franchises when it can. Fit Boston's set (card T2 fills in the pack; you own the numbers) so that Boston's story takes about the same days as the home city's, given the multiplier. Put the targets in a pacing test.
- [ ] **5. Counter-attack and mastery after a franchise:** stars already earned stay counted; the new city's shops earn their own. The weekly attack targets the current city's shops only.

## Tests that must exist
The reset keeps and resets exactly the lists above (one assertion per field group, so a new save field added later fails the test until someone decides which list it is in); `franchiseGain` equals what `franchise` gives; migrate; the ceiling test; format boundaries.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; the sim.

## Report
Standard format, plus: the defaults you used, the largest magnitude the ceiling test found, and the sim's day table for Boston.
