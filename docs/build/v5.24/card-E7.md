# Card E7 — the catalog as data (v5.24, lane E)

**Goal:** every look is a row of data (id, part, tier, price, set, where it shows), the vanity shop sells all of them at their tier's price, the Featured four rotate by week, and completing a set raises one event.

**Read first:** `docs/build/v5.24/VERSION.md`; `src/content/endgame.ts` (`VANITY_PRICE`, `VANITY_IDS`); `src/engine/vanity.ts` (`buyCosmetic`); `src/content/rewards.ts` (`COSMETIC_NAMES`, `WEEKLY_COSMETICS`); `src/components/scene/cosmetics.ts` (`Dress`, to see how a worn id reaches the scene).

## Files
- Own: `src/content/endgame.ts`, a new `src/content/catalog.ts`, `src/engine/vanity.ts`, `src/engine/game.ts` (save fields and migration only), `src/content/rewards.ts` (names only), their tests, `docs/build/v5.24/catalog.md` (new).
- Do not touch: `src/components/**` (S4, S5, U6).

## Steps
- [x] **1. The list first:** write `docs/build/v5.24/catalog.md`, every look with `id | part | tier | price | set | shows in`, for the 7 existing looks plus the new ones (6 sets × 4 pieces, plus generic small looks to reach about 30 and about 6,000 💎 in all). Report `Needs: catalog.md written` and continue (W5, S4 and S5 read it).
- [x] **2. `catalog.ts`:** `LOOKS: LookDef[]` with `TIER_PRICE = { small: 60, medium: 150, large: 400 }`. `VANITY_IDS` and `VANITY_PRICE` become derived (keep the exports for callers). `plaque-master` stays earned, never sold.
- [x] **3. Buying and wearing:** `buyCosmetic` charges the look's tier price. `worn` holds at most one id per part; a set piece is worn only in its set's shop, a generic look everywhere, and a set piece beats a generic look of the same part in its shop. A selector `dressFor(g, shopId)` returns the ids the scene should draw.
- [x] **4. Featured:** `featured(g, now)` = 4 unowned looks by ISO week over the catalog (stable within a week; every look within about 8 weeks).
- [x] **5. Sets:** `setProgress(g, set)`; when a purchase completes a set, push `{ set, at }` to `rewards.setsDone` (saved) and emit `set_complete` for the scene (S5) and the tab (U6).
- [x] **6. Migration:** bump the save; existing `cosmetics` and `worn` keep working (a worn id with no part conflict stays worn).
- [x] **7. Tests:** every price is a tier price; total within 5,500–6,500 💎; wearing rules; Featured stable for a week; set completion fires once.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`; `npx tsx scripts/api-digest.ts`.

## Report
Standard format, plus the count of looks and the total price.
