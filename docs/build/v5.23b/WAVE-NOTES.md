# v5.23b wave notes
- W6: copy is docs/story/COPY-v5.23b.md (9 rows: D545, D555, D556 + carried T rows S98, S95 x2, S71, S87, S67).
- W6 key clash: card names `story.ch1.line`, but chapters.ts uses `chapter.<id>.teaser` and COPY-v5.22/v5.23 used `chapter.downtown-1.line`. U8 picks one key for the Ch 1 line and drops the old one.
- W6 key clash: `report.missedZero` replaces `report.missed.zero` (v5.22 §7). U7 picks one key and drops the old one.
- U8: rewards-story.test.ts:61 expects the Ch 1 teaser empty with no portrait (G114); change that test when landing D545.
- W6: tutorial.report.3 still opens "Dashed line, cara", so fixture 192_e4 is unchanged.
- S6: removed RIVAL_SHOP.x / .top; FAR_KERB.top is now FAR_KERB.rise; rival placement comes from `rivalPlace` in scene/viewport.ts (also FOOT_SAFE, wideFit, roomSpan, WIDE_MIN_SCALE).
- S6: walkout `away` now means "turned against the line's way"; piles use `pileCount(backlog, batch, piling)` (non-piling station <= 2 items, piling >= 4).
- S6: fixture scripts/fixtures/211_s6.py (shots 211-216). Rival pavement band now hides lane-1 traffic while the rival is open (Q8: rival shop is not a protected element).
- S6 (in progress): D519 wide shops scale via projection.ts sceneView (floor 0.88x, then scroll). A scroll cue for cut-off wide shops is a U-lane need (scroll-cues-model.ts) -> U7.
