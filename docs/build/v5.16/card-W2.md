# Card W2 — copy for v5.16 (writer)

**Write one file:** `docs/story/COPY-v5.16.md`. Every entry has a key.

**Read:** `docs/story/CAST.md`; `sed -n '91,112p' docs/DESIGN.md`; `sed -n '86,112p;122,133p' docs/REVIEW-v5.9-playthrough.md` (the story text table and the layer table); the six files under `src/content/scenes/home/`; `docs/story/STORY-v4-final.md` if it exists (the Todd script: do not rewrite it, match it); `docs/story/COPY-v5.15.md` for the head names and bark voice.

## Sections
1. **Layer copy**, per neighbourhood. For each layer: a banner (≤ 28 chars), a HUD chip (≤ 20 chars, with a `{time}` or `{n}` slot where it counts down or counts), an info-sheet title and body (≤ 160 chars), and one start line from the neighbourhood's character (≤ 60 chars).
   - Suburbs, Game Day (Dale).
   - Waterfront, boats, the warming rack (upgrade name, four tier names), the live Pier 9 auction: MegaSlice's raise notice and the outbid warning (Marisol).
   - University, menu (names and one-liners for Cheese, Pepperoni, Garlic Knots) and campus zones (Dorms, Library, Stadium), drones (Priya).
   - Industrial, three shift names, the night-shift line, the oven-jam alert and the fixed line (Big Sal, Ox).
   - Uptown, the star rating, the Ingredients track's four tier names (Store-brand, Imported, Farm, Truffle: keep these), the critic's arrival, pass and fail lines (Genevieve).
2. **The rival opens**, per neighbourhood. One line when the MegaSlice shop opens across the street (≤ 90 chars, from Victor or Todd), the challenge title (≤ 44 chars, with `{n}` pies and 5 minutes), a win line and a lose line from the neighbourhood's character. Then, for each beat-4 scene, list any existing line that no longer makes sense now that beat 4 follows a won challenge, with its replacement. Change as little as possible.
3. **Text fixes held for the rebalance.** `uptown-4`'s drone line ("Lately, a drone.") is now true: confirm it or tune it. The Boston ending: rewrite the last panel so it points at the "Coming soon: Boston" card without promising a date. Then every other row of the review's story text table that is not yet applied (check each against the scene files and list only the ones still open), each as `scene id · panel · old → new`.
4. **Head story lines.** Give each of Downtown's three heads (Marco, Lucia, Benny) and one head from each other shop a speaking line in an existing scene where they are plausibly in the room: `scene id · panel · speaker · line`. At most one added line per scene, and stay within 3 lines per panel.
5. **Later-cycle visitors.** For Big Sal (cycle 2) and Genevieve (cycle 3): six in-shop lines each (≤ 40 chars), in the pattern of Nonna's cameo lines in `COPY-v5.15.md`. Keep their existing visitor lines.

## Protected
The tutorial lines in `downtown-1`, the en-dash scores, "A hundred and fifty deliveries.", and every line in the Todd script.

## Report
Standard writer report with counts per section.
