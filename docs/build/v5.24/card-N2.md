# Card N2 — the $19.99 pack (v5.24, lane N)

**Goal:** a fourth diamond pack, `diamonds_2600`: 1,600 + 1,000 bonus, consumable, first buy pays double like the others. "Best rate" moves to it by N1's computation, with no special case.

**Read first:** `docs/PRICING-STRATEGY.md` §3; `src/services/types.ts`, `grants.ts`, `purchases*.ts`, `store.native.ts`; `src/components/store/store-model.ts` (`PRODUCT_ORDER`).

## Files
- Own: `src/services/**`, `src/components/store/**`, their tests.

## Steps
- [ ] **1.** Add `diamonds_2600` to `ProductId`, `GRANTS` (2,600), `CONSUMABLE`, `PRODUCTS` (base 1,600, bonus 1,000, name from W4's pattern or "Cart"), `PRODUCT_ORDER` (last), and the web stub's price list ($19.99).
- [ ] **2.** RevenueCat / StoreKit product lists include it; a missing product on the device shows the card without a price and a disabled button (the existing rule).
- [ ] **3. Tests:** grant, first-buy 2×, "Best rate" on 2600 when prices are in, on 1200 when 2600 has no price.

## Checks
`npx tsc --noEmit`; `npx jest src/services src/components/store`; `npm run format:check`; `scripts/check-no-test-mode.sh`.

## Report
Standard format, plus a reminder that Julien must create the product in App Store Connect and RevenueCat.
