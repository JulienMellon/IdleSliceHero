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
6. **The five General Managers** (Julien, 2026-11-13: "I want the managers to become part of the storyline"). Today only Nonna is a character; the other five are a badge. Names and hooks are Julien's picks; keep them.

   | Shop | Id | Manager | Hook | Introduced by |
   | --- | --- | --- | --- | --- |
   | Suburbs | `deb` | Deb | Runs the Mudhens snack bar; Dale is a little afraid of her | Dale |
   | Waterfront | `skip` | Skip | Retired ferry purser; counts everything twice | Marisol |
   | University | `noor` | Noor | Priya's TA, writing a thesis on queues | Priya |
   | Industrial | `dee` | Dee | Big Sal's shift steward | Big Sal |
   | Uptown | `anton` | Anton | A maître d' Genevieve once fired | Genevieve |

   For each, write:
   - a two-sentence cast entry for `docs/story/CAST.md` (put the text in this file under key `cast.<id>`; a programmer copies it) and a one-line look for the portrait artist (age, hair, one signature item);
   - **a hire scene**, id `<shop>-hire`, two panels, at most 3 lines a panel, every bubble ≤ 90 chars, set in that shop. It plays the moment the player hires the manager. Panel 1: the introducer hands over. Panel 2: the manager takes the shop and says one thing that makes the player want to see them again. Dale's and Big Sal's existing "hire a manager" lines set these up: don't change them, pay them off;
   - one line in that shop's beat 3 or beat 4: `scene id · panel · speaker · line`, on top of section 4's limit of one added line per scene (never both in the same panel);
   - a Scrapbook tile title (≤ 24 chars).
   Nonna needs nothing new: `downtown-4` is her hire scene.
7. **The shop report** (card P1). The manager is the voice of the shop's live performance report; before a manager is hired the copy is neutral and the heads complain.
   - Neutral strip lines (≤ 56 chars after the slots are filled with 3-character numbers): `report.kitchen` with `{served}`, `{wanted}` and `{lost}` a minute (the model: "Serving 30 of 42 orders a minute. $3.6K a minute is walking out."; split it over two short lines if it will not fit); `report.quiet` with `{could}` and `{wanted}`; `report.tipping`; `report.cold`.
   - The same four states in each manager's voice, Nonna included: `report.<id>.kitchen`, `.quiet`, `.tipping`, `.cold`, with the same slots and the same limit. Six managers, 24 lines.
   - Lamp words: keep Slammed, Busy, Idle, and for the floor Line out the door, Steady, Quiet, unless one will not fit a 52 pt label; then give the shorter word.
   - Card effect lines: `effect.gain` with `{gain}` a minute and `{time}` to pay back (≤ 34 chars), `effect.nogain` with `{station}` (≤ 34 chars), and one each for a head and for the manager saying what hiring them does (the manager: earns at full speed while you're away, income × 2).
   - The sheet: a title, three "ways to fix it" row titles (faster stations, more customers, pricier pizzas) with one line each (≤ 70 chars), and one line each explaining the tip (service at 90% or more: + 10%) and the cold line (under 60% for a minute: − 10% until it recovers).
   - Heads' `slammed` barks: one per station per shop, 18 lines, ≤ 40 chars, in each head's bark voice from `COPY-v5.15.md`.
   - `offline.headsOnly` (≤ 44 chars): the welcome-back row for a shop whose three heads kept it going at half speed with no manager.

## Protected
The tutorial lines in `downtown-1`, the en-dash scores, "A hundred and fifty deliveries.", and every line in the Todd script.

## Report
Standard writer report with counts per section. For sections 6 and 7, also list the longest line of each kind with its length.
