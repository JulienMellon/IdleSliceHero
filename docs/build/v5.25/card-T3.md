# Card T3 — land W6's copy (v5.25, lane T)

**Goal:** every string in `docs/story/COPY-v5.25.md` is in code under a key, and the story fixes are applied, so U7, N3, S7 and the renovation data show real words, not placeholders.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md`; `docs/story/COPY-v5.25.md`; `src/content/copy/**` (how existing copy modules are laid out and exported).

## Files
- Own:
  - `src/content/copy/**`, with new `renovation.ts`, `free-gift.ts` and `store/starter.ts` (or the folder pattern already used);
  - `src/content/scenes/**` and `src/content/cities/home/voice.ts` (story fixes and barks only);
  - the item name map in `src/content/renovation.ts` (names only, keyed by E10's ids);
  - their tests (`grep -rln "copy/" src/**/__tests__ | head` for the copy tests).
- Do not touch: `src/components/**`. U7 and N3 switch their placeholders to T3's keys; the keys go in WAVE-NOTES.

## Steps
- [x] **1. Modules:** one copy module per W6 section, keys as W6 wrote them, with placeholders typed (`{cash}`, `{diamonds}`, `{level}`).
- [x] **2. Names:** the 72 renovation item names attached to E10's ids. A test checks that every id has a name and that every name is ≤ 18 characters.
- [x] **3. Story fixes:** apply each W6 story correction (the 9 review-r1-story rows, S97, and S106 oven names). Name each row ID in the report as fixed or kept.
- [x] **4. Starter Pack:** export the three item lines for N3's card. The store component swap is U7's, or N3's if it is still alive.
- [x] **5. WAVE-NOTES lines:** the export names and keys, ready to paste.

## Checks
- `npx tsc --noEmit`
- `npx jest`
- `npm run format:check`
- `npm run lint` (exit 0; the copy module is `home/store-copy.ts`, renamed in S12 so content never matches the store-import rule)

## Report
Standard format, plus the keys list (for WAVE-NOTES) and the row IDs fixed.
