# Card W5 — names for the looks catalog (v5.24, lane T, writer)

**Goal:** a name for every new look and set, short and funny in the neighbourhood's character, plus the Vanity tab's few new lines.

**Read first:** `docs/build/v5.24/VERSION.md` (tiers, sets, parts, ids); `docs/build/v5.24/catalog.md` (card E7's id list, once written; otherwise use the ids pattern in VERSION.md Defaults); `docs/story/CAST.md` for each neighbourhood's flavour; `COSMETIC_NAMES` in `src/content/rewards.ts`.

## Output
`docs/story/COPY-v5.24.md`:
1. `look.<id>` for every new look (≤ 22 characters).
2. `set.<set>` for the six sets (≤ 18 characters) and `set.<set>.done` (≤ 40 characters, the shop's reaction when the set is complete, said by its head or manager).
3. `shop.featured` (the row's header, ≤ 20 characters, no "limited"), `shop.set.progress` ("{have}/{need} pieces").

## Rules
No real brands. No "limited", "exclusive" (except the Founder awning, which already says "Only in this pack" elsewhere), "rare".

## Report
Standard format with counts.
