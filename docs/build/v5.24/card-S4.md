# Card S4 — looks art, part 1 (v5.24, lane S)

**Goal:** the Downtown, Suburbs and Waterfront sets and the generic small looks are drawn in the shop, in the game's code-drawn SVG style, each on its part and never over a station, head, badge or the WELCOME mat.

**Read first:** `docs/build/v5.24/catalog.md` (E7's list: your rows are sets `downtown`, `suburbs`, `waterfront` and every generic small look); `src/components/scene/cosmetics.ts`, `cosmetic-props.tsx`, `facade.tsx`, `room.tsx`, `palette.ts`; E7's `dressFor(g, shopId)`; the crowd budgets in `scene/__tests__/`.

## Files
- Own: `src/components/scene/**`, `src/components/storefront.tsx`, one fixture `scripts/fixtures/<next free number>_s4.py`.
- Do not touch: `src/engine/**`, `src/content/**`, `endgame/**`.

## Steps
- [x] **1. Read worn looks per shop** from `dressFor`, replacing the global `Dress` for the parts it covers.
- [x] **2. Draw** each of your rows: storefront themes (facade colours, trim, sign shape), medium hero pieces, small pieces (menu board, aprons on the crew, table cloths, tip jar, door chime). Reuse primitives; one palette entry per set in `palette.ts`.
- [x] **3. Thumbnails:** a `LookThumb` component (48 pt) for each look for U6's tab (export from `scene/`; U6 imports it).
- [x] **4. Budget tests:** every new prop's rect clears stations, heads, badges, the WELCOME mat and the coach targets.
- [x] **5. Fixture:** each set worn in its shop, plus all generic small looks at once.

## Rules
Overlap fixes in pure modules with a budget test; run the whole crowd suite. Don't remove the WELCOME mat. No per-frame allocations.

## Checks
`npx tsc --noEmit`; `npx jest src/components`; `npm run format:check`.

## Report
Standard format.
