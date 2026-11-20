# Card W3 — symptom lines, report words, report tutorial (v5.22, lane T, writer)

**Goal:** the cast describes what is going wrong in the shop, in character, without ever saying what to buy. Plus the report's labels and Nonna's three report-tutorial lines.

**Read first:** `docs/build/v5.22/VERSION.md`; `docs/story/CAST.md`; the heads and managers of each home shop (`src/content/cities/home/data.ts`, `cast.ts`); today's barks in `docs/story/COPY-v5.15.md` section 2 for each head's voice.

## Output
`docs/story/COPY-v5.22.md`:
1. **Head symptom barks** `bark.<shop>.<station>.<trigger>` for the six home shops × prep/oven/counter × `pile` and `idle`: 36 lines, ≤ 40 characters.
   - `pile`: this head is swamped or their output is stacking up ("Pies are stacking up on my counter!" from the oven head means the counter is behind). Say where the pile is, not what to do.
   - `idle`: this head is waiting with nothing to do.
2. **Manager symptom lines** `manager.<shop>.line` and `manager.<shop>.drivers-idle`: 12 lines, ≤ 40 characters.
3. **Report words:** the sheet's title, the bar labels (Prep, Ovens, Counter, Drivers), the demand line's label ("Customers"), "Served {n}/min", "Missed {n}/min", the "you" tag for a hand-tapped station ("You"), the strip's one line `report.strip` ("Served {served}/min · Missed {missed}/min").
4. **Report tutorial** `tutorial.report.1..3` (Nonna, ≤ 70 characters): the strip (how your shop is doing), a bar (how many pizzas a minute the ovens can bake), the dashed line (how many customers want one). **No line says what to do about it.**
5. **Chapter task** `task.kind.report` if v5.21's label needs changing ("Open the shop report").

## Rules
Never: "buy", "upgrade", "get more", "need more", "bottleneck", "slow", a station named as the cause of another's problem. Allowed: where the pile is, who is waiting, how it feels.

## Report
Standard format with counts.
