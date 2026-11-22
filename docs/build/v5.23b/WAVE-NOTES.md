# v5.23b wave notes
- W6: copy is docs/story/COPY-v5.23b.md (9 rows: D545, D555, D556 + carried T rows S98, S95 x2, S71, S87, S67).
- W6 key clash: card names `story.ch1.line`, but chapters.ts uses `chapter.<id>.teaser` and COPY-v5.22/v5.23 used `chapter.downtown-1.line`. U8 picks one key for the Ch 1 line and drops the old one.
- W6 key clash: `report.missedZero` replaces `report.missed.zero` (v5.22 §7). U7 picks one key and drops the old one.
- U8: rewards-story.test.ts:61 expects the Ch 1 teaser empty with no portrait (G114); change that test when landing D545.
- W6: tutorial.report.3 still opens "Dashed line, cara", so fixture 192_e4 is unchanged.
