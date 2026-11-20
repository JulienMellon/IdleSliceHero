# Card U6 — the Vanity tab (v5.24, lane U)

**Goal:** the Vanity tab shows the Featured four first, then each set with its progress, then the generic looks by tier; every card shows the look's thumbnail, name, tier price, and owned / wear / buy state.

**Read first:** `src/app/shop.tsx`; `src/components/endgame/shop-model.ts` (`vanityViews`); E7's `LOOKS`, `featured`, `setProgress`, `dressFor`; S4's `LookThumb`; `docs/story/COPY-v5.24.md`.

## Files
- Own: `src/components/endgame/**`, `src/app/shop.tsx`, a new copy table `src/content/copy/home/looks.ts` merged in `copy/index.ts`, their tests, one fixture `scripts/fixtures/<next free number>_u6.py`.
- Do not touch: `src/components/scene/**`, `src/engine/**`.

## Steps
- [ ] **1. Model:** sections `featured` (header `shop.featured`, no timer), one per set (title, `shop.set.progress`, its pieces), `small` / `medium` / `large` for generic looks. Wearing a set piece says which shop it shows in.
- [ ] **2. Cards:** thumbnail, name (W5), the price as "{n} 💎" on the button, or "Owned" / "Wear" / "Worn". Unaffordable: the button reads the price, disabled, and the first tap shows v5.23's nudge.
- [ ] **3. Set complete:** the set's section shows a ✓ and its `set.<set>.done` line.
- [ ] **4. Tests and fixture:** a fresh tab, a half set, a complete set, all owned.

## Rules
44 pt targets, 10 pt text; the tab scrolls; the Featured row fits at 375 wide.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
