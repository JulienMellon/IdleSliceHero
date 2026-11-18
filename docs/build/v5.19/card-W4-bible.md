# Card W4b — the cities bible (writer)

(Checked 2026-11-18 against the refactor cards: the layer-kind rule, the ids, the shop plan and the founder were added.)

**Write one file:** `docs/story/CITIES-BIBLE.md`. It is a planning document for Julien to approve and for three script writers to follow. Keep it under 250 lines.

**Read:** `sed -n '91,139p' docs/DESIGN.md`; `docs/story/CAST.md`; `docs/story/BOSTON-SCRIPT.md` (skim the structure; read the six finales and Trish Vance's scenes); the home city's ending.

## Structure of the file
1. `## Summary` (one page, at most 35 lines: this is what Julien reads on his phone). For each city: a one-line premise, the six neighbourhoods with character and a five-word arc each, the lieutenant in one line, the returning characters. Then the showdown in five lines.
2. `## Chicago`, `## New York`, `## Los Angeles`. For each:
   - Six neighbourhoods, in unlock order, each with:
     - its id (lower-case kebab, unique across every city: not a home or Boston id);
     - the character (name, job, want, flaw, how they talk in one line);
     - the arc across four beats, in four lines;
     - what MegaSlice does in beat 3;
     - the perk's name;
     - the layer kind, with how it is re-dressed for this place. The kind is one of the code's names: `none`, `gameDay` (game day), `boats` (timed orders and the warming rack), `menu` (menu and delivery zones), `shifts` (shifts and breakdowns), `stars` (a rating). **Use each kind exactly once per city**, with `none` on the first neighbourhood. The engine plays one neighbourhood per kind (`layerHood`), so a second neighbourhood with the same kind would play nothing;
     - the shop plan: `standard`, or `mirrored` (kitchen on the right, door on the left), and then only with a reason in the place, as home's Waterfront has (the harbour across the street) and Industrial has (the loading dock). Most shops are standard.
   - The founder: the first neighbourhood's character, who takes over its kitchen when the player has learned the ropes (Nonna at home, Father Dom in Boston), and the beat where that happens.
   - The lieutenant: who they are, how they differ from Todd and Trish Vance, how they lose.
   - The B-plot for the interludes, in five lines, and what it pays off.
   - One or two returning characters, what has changed for them, and the three or four scenes they appear in.
   - The city's musical idea in one line (for the audio card).
3. `## The showdown`. Victor Crust's last move, across all five cities; five rounds, one per city, and who from that city stands with the player in each; the ending scene's beats; what Todd is doing by now; the last panel.
4. `## Rules for the script writers`. Voice notes that hold across cities, running jokes to keep and to retire, and a list of names and ids already used so nothing repeats: characters (`CHARACTER_IDS` in `src/content/types.ts`), neighbourhood ids, heads and venues.

## Limits
Invented teams, venues and businesses only. Neighbourhoods may use real place names. Nothing that depends on a real person.

## Report
Standard writer report.
