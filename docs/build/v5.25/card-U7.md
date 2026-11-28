# Card U7 — renovation UI and the two reward moments (v5.25, lane U)

**Goal:**
- A shop at ★★★ offers renovation. A confirm screen says plainly what resets and what the player gains.
- Renovating plays a full reward moment, and so does opening a free gift.
- Every number on screen is a whole number.
- Fixes U40 and the U-owned carried notes.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md` (E10's `canRenovate`, `renovate` and `renovated`; E9's `free_gift_claimed`; T3's copy keys; S6/S7's components); `src/components/layers/**` and `src/components/endgame/**` (existing reward overlays and the count-up); the existing shop panel that shows stars (`grep -rln "stars" src/components/*.tsx src/app | head -5`).

## Files
- Own: `src/app/**` except `settings.tsx` and `store.tsx`; top-level `src/components/*.ts(x)`; `src/components/{layers,endgame,lib}/**`; their tests; a new fixture `scripts/fixtures/<next number>_u7_moments.py`.
- Do not touch: `src/components/scene/**` (S6, S7), `src/engine/**`, `src/content/**`. If the store card still shows N3's placeholder, swap it to T3's key: that one line in `src/components/store/` is allowed.

## Steps
- [ ] **1. Offer:** when `canRenovate` holds, the shop's panel shows a Renovate button with the level and the cost. When the shop is below ★★★, a locked hint says what is needed.
- [ ] **2. Confirm screen:** two columns, "Resets" (station levels) and "Keeps and gains" (cash, staff, hoods, x2 / x3 / x4 income, the plaque, the fixture, 3 new decor to buy), with T3's copy. The cost sits on the button. Cancel is always visible.
- [ ] **3. Renovation reward moment:**
  - centre stage;
  - the plaque comes in, then the multiplier counts up (x1 → xN);
  - coins fly to the cash display;
  - the cast reacts with T3's barks;
  - nothing else stacks on the moment;
  - it ends on the renovated shop with the 3 new decor items shown in the shop list.
- [ ] **4. Gift reward moment:**
  - on `free_gift_claimed`, the box opens centre stage;
  - the cash counts up, plus the diamonds when there are any;
  - coins fly to the cash display;
  - a cast bark plays;
  - nothing else stacks on it.
- [ ] **5. Whole numbers:** run `grep -rn "toFixed\|\.toLocaleString" src/app src/components --include=*.tsx | grep -v __tests__` and route every cash or rate shown through E8's formatter. A test renders the cash HUD at $0.6/s and finds no decimal point.
- [ ] **6. Carried notes:** fix U40 (medium) and the other rows with owner U in the `extra:` line.
- [ ] **7. Fixture:** shots of the Renovate offer, the confirm screen, the renovation moment mid count-up, the gift moment mid count-up, and the cash HUD at an early-game rate. Use `expect()` before each.

## Checks
- `npx tsc --noEmit`
- `npx jest`
- `npm run format:check`
- the `cover` check (Q8), for anything drawn over the shop

## Report
Standard format, plus the fixture name, the IDs fixed, and `Unverified:` IDs.
