# v5.18 story review, round 2 (medium re-check)

Scope: the r1 open IDs against `src/engine/cutscene-input.ts`, `cities/boston/scenes/*.ts` and shots 107, 109 and 115 in `screenshots/v5.18-r2/review/`. Nothing else was re-read in depth. Nothing was edited.

VERDICT: SATISFIED
SUMMARY: The one major from r1 (S65, heading slug) is fixed. The Trish name tag (S66) now has her name on every beat 3 and fits in shot 115. One minor remains open (S67, the `shop` backdrop on boston-0 p1), plus the carried S48. No new notes.

HOOKS:
- No change from r1. Every last line still matches the script and the hold-backs are intact.

STORY & PACING:
- S67 [minor] `boston-0` p1 still uses the `shop` backdrop where `BOSTON-SCRIPT.md` says `downtown`. The heading on this scene now reads "North End · Interlude" (the name is right). It is generic but accurate, so the heading half of S67 is closed. → Switch p1 to the `downtown` backdrop, or change the script line to say `shop` (Port Marinara is the shop city, so `shop` may be the better call).

PLAYER COMMUNICATION:
- S65 fixed. `hoodName()` reads the display name from `def(id)`. Shot 109 shows "North End · Act 1". The scene heading test and `boston-smoke.test.ts` cover it. I did not re-check `scrapbook-model.ts` or `src/app/scrapbook.tsx` for the same slug in this round, so a quick grep by the owner is still worthwhile (no ID, covered by S65's original fix text).
- Shot 107 (franchise card) is clear: stars, multiplier, Nonna line, then "On to Boston". The card text agrees with `boston-0` p1.

VOICE & COMEDY:
- S66 fixed. Tags now read 'TRISH VANCE REGIONAL VP', 'SENIOR VP', 'EXECUTIVE VP', 'PRESIDENT, BOSTON', 'PRES., NEW ENGLAND' and 'HEIR APPARENT'. The name sits on line 1 and the title on line 2 (shot 115). The title ladder still climbs as a running gag.

PROTECT:
- "Lovely city, Boston. I've never been here before in my life." (`boston-0` p5)
- `cambridge-5` whole: "Do you have family in Boston?" / "No." / POP.
- `fenway-4` p4, the silent star (empty lines array).
- "If she's from out of town, I'm from Back Bay."
- The Trish name-tag ladder, now complete with her name on every tag.

FIXED SINCE LAST REVIEW: S65, S66, and the heading half of S67
STILL OPEN FROM LAST REVIEW: S48 (carried, Julien's call), S67 (backdrop half)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 p1 | Backdrop `shop` vs script `downtown`; use `downtown` or update the script to `shop` |

Next IDs: S68
