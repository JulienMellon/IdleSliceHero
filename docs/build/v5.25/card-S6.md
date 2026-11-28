# Card S6 — renovation art, Downtown / Suburbs / Waterfront (v5.25, lane S)

**Goal:** in the shop scene, a renovated Downtown, Suburbs or Waterfront shop shows its plaque (I/II/III) and that level's fixture upgrade, and each bought renovation decor item stands where `renovation.md` says. Each piece reads at phone size. If E8 reported it missing, the first serves pop cash.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md`; `docs/build/v5.25/renovation.md` (the rows for these three shops); `src/components/scene/cosmetics.ts`, `cosmetic-props.tsx` (how looks are drawn today); `src/components/scene/protected.ts` (Q8).

## Files
- Own: `src/components/scene/**` (new `renovation-props.tsx` and its wiring), `storefront.tsx`, plus their tests (`src/components/scene/__tests__/*`), and a new fixture `scripts/fixtures/<next number>_reno_a.py`.
- Do not touch: `src/engine/**`, `src/content/**`. Read the state through E10's selectors (WAVE-NOTES).

## Steps
- [x] **1. Plaque** by the door, I/II/III, ≥ 10 pt (a state cue).
- [x] **2. Fixtures:** the 9 fixture upgrades for these shops, drawn on their part (oven trim, sign lights, counter top and so on), each ≥ 6 pt in detail and told apart from the base fixture by shape, not only by colour.
- [x] **3. Decor:** the 27 decor items for these shops, each with its own silhouette or prop as `renovation.md` lists. A diamond look worn on the same part sits on top of the fixture.
- [x] **4. First-serve cash pop** (only if WAVE-NOTES has `Needs: S6 first-serve cash pop`): a `+$N` pop rises from the counter on each of the first serves, in whole dollars.
- [x] **5. Fixture:** shots of Downtown at I, II and III with all its decor; of Suburbs and Waterfront at III; and a first-serve shot if step 4 ran. Use `expect()` before each shot.

## Checks
- `npx tsc --noEmit`
- `npx jest src/components/scene`
- `npm run format:check`
- the `cover` check (Q8): nothing drawn here covers a station, a head, a badge or the WELCOME mat

## Report
Standard format, plus the fixture file name and any `Unverified:` IDs.
