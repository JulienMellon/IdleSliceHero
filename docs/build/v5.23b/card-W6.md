# Card W6 — two lines for the cleanup step (v5.23b, lane T, writer)

**Goal:** the copy that two carried critic notes need, in Nonna's voice. U8 lands it in code.

**Read first:** `docs/build/v5.23b/VERSION.md`; Nonna's voice (`docs/story/CAST.md`); the Story tab's chapter cards (`src/components/rewards-ui.tsx`, the Chapter 2 to 4 cards have a story line and portrait, so match their length); the report tutorial lines in `docs/story/COPY-v5.22.md` (`tutorial.report.*`); the T rows of `CARRY` (see VERSION.md).

## Output
`docs/story/COPY-v5.23b.md`, one table with keys:
1. **D545:** `story.ch1.line`, Nonna's story line under Chapter 1 "The Keys". It should be no longer than the other chapters' lines, and say she is handing over the keys.
2. **D555:** `tutorial.report.3`, a new version of step 3's line that keeps the dashed-line pointer and adds the one reading rule: Served can never go past the shortest bar. Keep it to 90 characters or fewer, and state it as a rule, not a purchase.
3. **D556:** `report.missedZero`, Nonna's line when a shop has gone 10 s without missing a customer (for example "Not one missed, cara"). 40 characters or fewer.
4. Any other T row in `CARRY` that is a copy change: its key and its new line.

Each row gives the key, the line, its character count, and the card that lands it (U8 for 1 and 2, U7 for 3).

## Rules
No prices, no "buy", no "worth". `tutorial.report.3` must still name the dashed line, because fixture `192_e4` expects "Dashed line, cara". Keep that opening, or name the fixture line that has to change.

## Report
Standard format with the counts.
