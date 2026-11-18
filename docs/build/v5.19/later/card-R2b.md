# Card R2b: callers off the barrels (v5.19, lane E; this card's Files override OWNERS)

**Run last and alone** (VERSION.md wave 12). Every other card's files import these shims, so nothing else may be in flight.

**Goal:** every importer of `engine/game` (and `components/layers/menu/sheet-state`, if card R5f left it) imports the real module. The `backdrop.tsx` and `portrait.tsx` shims were already removed by v5.19 card R7b. The re-export shims are then deleted. Import lines only.

## Files
- Own: every `import` line that names a shim, in `src/**` and `scripts/**`; the shim files themselves.

## Steps
- [ ] **1.** Replace `import * as G from '../engine/game'` and named imports with imports from `engine/state`, `economy`, `purchases`, and so on. A file that needs four or more of them may keep a namespace import from one module per line. Don't change any other line.
- [ ] **2.** Delete the shims. `npx tsc --noEmit` proves nothing still names them.
- [ ] **3.** Update `docs/API.md` (it is generated: `npx tsx scripts/api-digest.ts > docs/API.md`).

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full).

## Report
Standard format, plus the number of files touched.
