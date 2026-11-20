# Card N1 — packs, first-buy 2×, the Store tab's cards (v5.23, lane N)

**Goal:** the products pay what `docs/PRICING-STRATEGY.md` §3 says, the first buy of each diamond pack pays double, and the Store tab's cards show their contents in game units, with the store's own price strings.

**Read first:** `docs/PRICING-STRATEGY.md`; `src/services/grants.ts`, `purchases-core.ts`, `types.ts`; `src/components/store/**`; `docs/story/COPY-v5.23.md` (W4); C158 in `docs/build/v5.19-test/review-r1-code.md` (the shared ledger key: fix it here if it touches your files).

## Files
- Own: `src/services/**`, `src/components/store/**` (except `starter-sheet.tsx`, which E6 removes), a new copy table `src/content/copy/home/store.ts` merged in `copy/index.ts`, their tests, one fixture `scripts/fixtures/<next free number>_n1.py`.
- Do not touch: `src/app/shop.tsx` (U5), `src/engine/**` (E5).

## Steps
- [ ] **1. Grants.** `starter_pack` diamonds 150 → 400. `diamonds_500` and `diamonds_1200` keep their totals; add `base` and `bonus` to the product info (400 + 100, 800 + 400) for display. Tests: totals unchanged for the packs, Starter 400.
- [ ] **2. First-buy 2×.** The ledger records `first:<productId>` on the first paid-out purchase of each consumable; that purchase pays its diamonds twice. A restore never pays it. Tests: first buy doubles, second doesn't, restore doesn't, a duplicate transaction pays nothing.
- [ ] **3. "Best rate"** computed: the consumable with the most diamonds per unit price from the store's numeric prices (`purchases.products()`); hidden while prices load. Today it is `diamonds_1200`.
- [ ] **4. Cards** (W4's copy): Starter at the top with Nonna's line, three chips (diamonds with "Enough for {n} shop looks", the Founder awning "Only in this pack", 2× 24 h "≈ {cash} at your shop's pace") and "Most diamonds per dollar in the store" when true by the same computation; diamond packs with base, "+{n} bonus", "Enough for {n} looks", "First buy: 2×" until used; Plus with the 7-day ad count line and "Pay once". Remove the "ONE-TIME DEAL" ribbon. "Not now" on the Starter card is as large as Buy and closes the Shop (calls an `onClose` prop U5 provides).
- [ ] **5. Ad count.** A rolling 7-day count of rewarded-ad grants, stored with the store prefs.
- [ ] **6. Analytics** `pack_card_seen{id}`; existing `iap_viewed`/`iap_purchased` unchanged.
- [ ] **7. Fixture** for the Store tab: prices loading, prices in, Starter owned, first buys used.

## Checks
`npx tsc --noEmit`; `npx jest src/services src/components/store`; `npm run format:check`; `scripts/check-no-test-mode.sh`.

## Report
Standard format.
