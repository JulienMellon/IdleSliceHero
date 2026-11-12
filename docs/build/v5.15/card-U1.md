# Card U1 — endgame screens (v5.15, lane U)

**Goal:** everything card E1 built becomes visible and tappable. Add each piece through `src/components/slots.tsx` (`HUD_CHIPS`, `BANNERS`, `SHEETS`, `DRAWER_CARDS`). All strings come from `docs/story/COPY-v5.15.md` by key; don't write copy.

**Read first:** `docs/API.md` (the views: `nextStar`, `masteryTotal`, `attackView`, `eventView`, `collectionView`); `src/components/slots.tsx`; `src/components/order-chip.tsx` and `order-model.ts` as the pattern for a timed challenge chip.

## Files
- Own: `src/components/endgame/**` (new: one file per piece plus pure `*-model.ts` files and tests), `src/components/goal-model.ts`, `src/components/title-card.tsx`, `src/components/city-map.tsx`, `src/components/sidewalk-model.ts`, `sidewalk-row.tsx`, `src/components/rewards-ui.tsx`, `rewards-model.ts`, `src/app/scrapbook.tsx`, `src/app/shop.tsx` (new screen), `scripts/fixtures/56_u1.py`.
- Shared, append-only: `src/components/slots.tsx`, `src/store/game-store.ts` (actions only: defend, equip, activate booster, set buy amount).
- Do not touch: `src/engine/**`, `src/components/scene/**`.

## Steps
- [ ] **1. Post-story goal bar.** When the story is complete, the goal bar shows `Mastery {n}/18` with a progress bar and the next-star hint. Pure addition to `goal-model.ts`, tested. This closes D427.
- [ ] **2. Mastery stars.** Three star pips per shop on the City screen and in the shop header; a star toast on the `mastery` pulse with a coin burst (reuse `emitCoin`).
- [ ] **3. "Coming soon: Boston" card.** Shown once after the last finale, and again from the City screen as a locked seventh tile. Built on `title-card.tsx`.
- [ ] **4. Counter-attack.** A banner while an attack is open, naming the shop; the City tile of that shop marked; a Defend button that starts the challenge; a challenge chip with the pie count, a draining bar and "tap to rush!" when behind pace; win and lose states with the lines from the copy file.
- [ ] **5. Events.** A countdown chip in `HUD_CHIPS` in the hour before an event; a banner while it runs; nothing otherwise.
- [ ] **6. Recipe collection.** A "Recipes" section in the Scrapbook: 24 tiles grouped by shop, unowned ones as silhouettes with their drop condition. In the tasks drawer, replace "Collection: empty" with `Collection: {n}/24 recipes` and a tap through to the Scrapbook section.
- [ ] **7. Shop screen** (`app/shop.tsx`, opened from a diamond chip). Tab 1, vanity: the seven cosmetics, each owned / wear / 150 diamonds; `plaque-master` shows "earn 18 stars" and is never sold. Tab 2, booster shelf: the inventory with an Activate button each, and the empty-shelf line. No diamond prices on boosters.
- [ ] **8. ×1 / ×10 / MAX.** A three-way toggle on the sidewalk; cards show the total price and the level gain for the chosen amount; one rule in `sidewalk-model.ts`, tested. Reuse the engine's `buyMany`.
- [ ] **9. Carried.** D404 (University chip overfull with "uses bid cash"): one line, "$1.8M · uses bid cash", or a 15 pt title. Plus the rows with owner U in the carried-notes file named in your spawn prompt, and anything card E1 listed under `Needs:`.

## Fixtures (`scripts/fixtures/56_u1.py`, shots 56–65)
56 post-story goal bar; 57 City screen with stars and the Boston tile; 58 Boston card; 59 attack banner and marked tile; 60 challenge chip behind pace; 61 challenge won; 62 event countdown chip and banner; 63 Scrapbook recipes, 9 of 24 owned; 64 vanity tab; 65 sidewalk on MAX. Seed the saves; make the numbers plausible.

## Rules
44 pt tap targets drawn, not hit-slopped. Primitive props on memoised parts. No re-render per tick: quantise progress to 5% steps. Every new string fits at iPhone SE width.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `python3 -m py_compile scripts/fixtures/56_u1.py`.
