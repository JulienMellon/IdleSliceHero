# Card R5c: one copy system (v5.19, lanes T and U; this card's Files override OWNERS)

**Goal:** every player-facing line lives in one keyed system: the home tables under `src/content/copy/`, and each city's overrides **in its own pack** (`CityDef.copy`), so a city is one folder. The tables headed "GENERATED" really are generated. Card CITY then dresses a new city in one place. **The player sees the same words in home and Boston.**

**Why:** `docs/PLAN-refactor.md`, phase P5 (copy). Notes to fix:
- **C146** [medium]: `city-model.ts:32` `lotView` hard-codes `Nonna in ${…}` / 'Nonna soon' (and `kind: 'nonna'`). The Boston City-map pin reads "Nonna in 424". Fix: `pinsLeft: number | null` plus `founder` from `founderName` (exported by card R1). shop-ui formats from the number.
- **C137** [low]: shop-ui.tsx:69, app/index.tsx:113, city.tsx:21. `lotView` returns pies-to-go text, and the buy handler should be typed. This card takes the `lotView` half; the typed handler already exists (v5.18 r4).

**Status at the plan check (2026-11-18):** v5.18 r4 already fixed C146 and the `lotView` half of C137: `city-model.ts` has no "Nonna in" literal, and `founderName` is exported. Step 4 is then only the remaining literals in `ad-model.ts` and `rewards-model.ts` that name the founder (for example "Unlocks when Nonna takes over"; "Nonna's Plus" is a product name and stays) and the step 5 guard. Card CITY dresses new cities through this card's `t()` and override tables: keep the home keys as they are, so a city's overrides use them.

## Files
- Own: new `src/content/copy/` (`fill.ts`, `home/*.ts`, `index.ts`) and `scripts/gen-copy.ts`; `src/content/cities/types.ts` (one optional field, `copy?: Readonly<Record<string, string>>`); `src/content/cities/boston/copy.ts` and `index.ts` (Boston's overrides, from `city-dress.ts` `BOSTON` and `BOSTON_ASKS`, set as `copy`).
- Moved there, with a re-export left at the old path: `components/endgame/copy.ts`, `copy-text.ts`, `components/layers/layer-copy.ts`, `layer-text.ts`, `city-dress.ts` (its lookup only: its Boston table goes into the pack), and the menu, shifts and stars `copy.ts` tables. `content/copy` may import `content/cities`, but a pack never imports `content/copy` (no cycle).
- Also own: `components/city-model.ts`, `shop-ui.tsx` (pin text only), `components/store/ad-model.ts` and `components/rewards-model.ts` (string literals only), and the copy tests (`components/**/__tests__/*copy*.test.ts`).
- Read-only: `docs/story/COPY-*.md`.

## Steps
- [ ] **1. One `fill(template, vars)`.** It replaces `copy()`'s, `lc()`'s and `fillText`'s three bodies. A placeholder with no value is left as written, as today.
- [ ] **2. Generator.** `scripts/gen-copy.ts` reads `docs/story/COPY-v5.15.md` and `COPY-v5.16.md` (the sections each current header names) and writes the `.ts` tables byte-for-byte as they are now. Run it and confirm `git diff --stat` shows no change to the tables. Every header then names the command. The compare tests stay as they are.
- [ ] **3. One lookup.** `t(key, vars, city)` looks in the city pack's `copy` first (`CITIES[city]?.copy`, today's `city-dress.ts` `BOSTON` plus `BOSTON_ASKS`), then in home. `city-dress.ts`'s `dressed` and `isDressed` become wrappers over that lookup, so their callers don't change. `copy()` and `lc()` become thin wrappers over `t`, so the components don't change.
- [ ] **4. C146 and the literals.** `lotView` returns `{ kind: 'founder', pinsLeft, founder }`. `shop-ui` formats from the number (no string slicing). Move the "Nonna …" literals in `city-model.ts`, `ad-model.ts` and `rewards-model.ts` to copy keys with `{founder}`, resolved through `cityOf(g).founder.name` (card R1 adds `founder`).
- [ ] **5. Guard.** Add a test that, for the Boston fixture save, no string the models in step 4 return contains "Nonna".

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/components src/content`; `npx tsx scripts/gen-copy.ts && git diff --stat -- src | tail -3` (no change).

## Fixtures
Run `--only 106_t2,24_settings,29_rewards` and compare with the baseline. Only the Boston City-map pin may change ("Nonna in 424" becomes Father Dom's line).
