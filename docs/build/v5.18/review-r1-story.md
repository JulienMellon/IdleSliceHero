# v5.18 story review, round 1 (low effort): Boston transcription check

Scope: `src/content/cities/boston/scenes/*.ts` and `copy.ts` against `docs/story/BOSTON-SCRIPT.md`, plus screenshots 109, 113, 114 and 115. Nothing was edited.

VERDICT: NOT SATISFIED
SUMMARY: The transcription is faithful. All 31 scenes (boston-0, 24 beats, 7 interludes) have every panel, caption and bubble from the script, the interlude delays and holds match, and the perks, 24 recipes, 18 heads, 72 barks and layer copy are complete. One visible bug: the cut-scene heading prints "North-end" and "Back-bay".

HOOKS:
- No loss. Every scene's last line matches the script, including `southie-4` "If she's from out of town, I'm from Back Bay.", `cambridge-5` POP, `fenway-4` p4 (silent star) and `dorchester-4` "...And I know where that pin is."
- Hold-backs are wired as scripted: `north-end-4` requires `north-end-5`, `southie-4` requires `southie-5`, `back-bay-4` requires `back-bay-5`, `fenway-4` requires `fenway-5`, `cambridge-4` requires `cambridge-5`, `dorchester-3` requires `dorchester-5`, `dorchester-4` requires `dorchester-6`.

STORY & PACING:
- S67 [minor] `boston-0` is tagged `neighborhood: 'north-end'`, `beat: 'interlude'`, so its heading reads "North-end · Interlude" (shot 115) over a franchise-promotion scene set in Port Marinara. Its p1 also uses the `shop` backdrop where the script says `downtown`. → Keep the title "Promotion" as the heading for this scene. Use a `downtown` backdrop for p1 if the type allows it; otherwise note the fallback in the script.

PLAYER COMMUNICATION:
- S65 [major] `src/engine/cutscene-input.ts:31` builds the heading with `cap(scene.neighborhood)`. That turns the slugs `north-end` and `back-bay` into "North-end · Act 1" (shot 109) and "Back-bay · Act n". Home had only one-word ids, so this never showed. It appears on 13 scenes (North End: boston-0, 1-5; Back Bay: 1-5). → Map slug to display name (`north-end` → "North End", `back-bay` → "Back Bay"), using the neighbourhood name from the city pack. Check `scrapbook-model.ts` and `src/app/scrapbook.tsx` for the same slug.
- Perk and reward flags are as scripted: `perk: true` on all six beat 4s, and `reward: 'city-complete'` on `dorchester-4` only. The perk card text in `copy.ts` matches the script line for line.

VOICE & COMEDY:
- S66 [minor] `cambridge-3` p1 `propText: 'VANCE · PRESIDENT, NEW ENGLAND'` drops "TRISH". The script has 'TRISH VANCE · PRESIDENT, NEW ENGLAND', and the name-tag ladder is a running gag. Shot 115 also shows the tag wrapping with "· REGIONAL VP" starting the second line, so the longest tag is likely to overflow. → Shorten both so the tag fits on two lines: 'TRISH VANCE' on line 1 and the title on line 2 (a line-break in `propText`, or a title-only field). Do not drop the name from the one scene that has the longest title.

Checked and clean: S63 ("I've seen the bids." / "Park's board is tied. So the fans pick, game day. Loudest cheer wins.") and S64 (flour question now opens `southie-1` p3) are both in the script and in the code. Speaker labels are "Kayla Dunn", "Dr. Ko", "Trish". Dorchester finale has 5 panels, as scripted. The extra props `pretzel`, `scorecard` and `apron` are additions and harmless.

PROTECT:
- "Lovely city, Boston. I've never been here before in my life." (`boston-0` p5, intact)
- "I've heard a lot of confessions, miss. You lie better than all of them."
- `cambridge-5` whole: "Do you have family in Boston?" / "No." / POP.
- "Louder, sweetheart. He's old." and "If she's from out of town, I'm from Back Bay."
- `fenway-4` p4, the silent star (empty lines array; keep it).

FIXED SINCE LAST REVIEW: S63, S64 (both folded into the script and transcribed)
STILL OPEN FROM LAST REVIEW: S48 (carried, Julien's call)

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| S48 | minor | U | layers/layer-copy.ts:6-8 "Game Day" vs the Playoff Rush | One name per feature: rename the layer ("Mudhens Night") or explain it in the info sheet; Julien's call. Carried |
| S65 | major | E | src/engine/cutscene-input.ts:31 `cap(scene.neighborhood)`, shot 109 | Heading prints "North-end"/"Back-bay"; map slug to display name "North End"/"Back Bay"; check scrapbook for same |
| S66 | minor | T | cities/boston/scenes/cambridge.ts cambridge-3 p1 propText | Restore "TRISH VANCE" on the name tag; shorten or wrap so the longest tag fits (shot 115 wraps) |
| S67 | minor | T | cities/boston/scenes/north-end.ts boston-0 | Heading shows "North-end · Interlude" for the franchise scene; use title as heading; p1 backdrop `shop` vs script `downtown` |

Next IDs: S68
