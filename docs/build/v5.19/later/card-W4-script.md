# Card W4s — one city's script (writer; parameter CITY)

Your spawn prompt gives `CITY=chicago`, `new-york` or `los-angeles`. VERSION.md's city table maps it to your script file: `CHICAGO-SCRIPT.md`, `NEW-YORK-SCRIPT.md` or `LOS-ANGELES-SCRIPT.md`.

(Rewritten 2026-11-18 for the refactor cards. Card CITY transcribes this file into the pack fields that card R1 adds (`barks`, `orderCast`, `nightOvenLines`, `founder`), the `plan` field from card R1L, and the copy overrides from card R5c. Anything not written here, CITY has to invent, as Boston's T2 card did in `BOSTON_ASKS`.)

**Write one file:** `docs/story/<SCRIPT>`, in the format of `docs/story/BOSTON-SCRIPT.md`, so the same transcription steps apply. The sections Boston lacks are listed below; add them after its `### Layer copy`.

**Read:**
- `docs/story/CITIES-BIBLE.md`: the Summary, your city's section, and "Rules for the script writers" (not the other cities' sections).
- `docs/story/BOSTON-SCRIPT.md`, for the format and for two neighbourhoods' worth of pacing.
- The previous city's last scene, so your opening follows it: Boston's `dorchester-4` for chicago, `CHICAGO-SCRIPT.md` for new-york, `NEW-YORK-SCRIPT.md` for los-angeles.
- For the voice and the shape of the game's own lines:
  - the home city's barks, order cast and night-oven lines: `grep -rn "slammed\|offers:\|night oven" src/content/cities/home src/content/heads.ts src/content/hooks.ts | head -40` (card R1 moved them into `cities/home`);
  - Boston's layer overrides: `src/content/copy/boston.ts`, or `src/components/layers/city-dress.ts` if card R5c has not moved it yet. It is the list of keys a city re-dresses.

## What to write
1. **24 main scenes:** six neighbourhoods, four beats each, following the bible's arcs. Beat 3 is MegaSlice's move and the rival opening. Beat 4 follows the player's won challenge. Scene ids follow Boston's: `<hood>-1` … `<hood>-4`, interludes `<hood>-5` and on, the opening `<city id>-0`.
2. **6–8 interludes** carrying the bible's B-plot. Each has an `after` delay suggestion and the main beat it holds back.
3. **The returning characters' scenes** the bible lists.
4. **The opening scene** (after the franchise moment) and the last panel. If `CITY=los-angeles`, also the showdown: one short scene before each of the five rounds, the ending scene, and the last panel of the game.
5. **`## Cast ids`**, as Boston's table: every new character with a kebab id that no other city uses. Below it, list any new prop the scenes use (`prop:` in a panel), with a one-line drawing note. Use the existing props (`PROP_IDS` in `src/content/types.ts`) where one fits.
6. **Per neighbourhood** (Boston's sections, plus the new ones):
   - **Perk:** its name.
   - **Recipe cards:** four, each with a name and a line.
   - **Station heads:** three, with names.
   - **Barks:** five per head, **one per trigger**, keyed `bark.<hood>.<station>.<trigger>`, where the trigger is `milestone` (a station level reached), `rush`, `attack` (a MegaSlice counter-attack), `week` (Head of the Week) and `slammed` (the line is long). The engine picks a bark by trigger. Boston's four numbered barks per head don't fit, which is why Boston's heads are still silent.
   - **`### Shop plan`:** `standard`, or `mirrored` with the bible's one-line story reason (key `plan.<hood>`). Only the bible's mirrored shops.
   - **`### General Managers`:** one per neighbourhood: name, id, and a line. Default as in Boston: the neighbourhood's own character.
   - **`### Special orders`** (key `order.<hood>`): who asks (a character id from this city) and their name, two offer lines with `{n}` (the pies wanted), and two thank-you lines. The home city's `ORDER_CAST` is the shape.
   - **`### Layer copy`** for the neighbourhood's layer kind. Give a line for **every key Boston's override table dresses for that kind**, under the same home key (for example `upgrade.waterfront.rack.tier.1`, `label.nextBoat`, `layer.suburbs.gameday.info.body`). The keys keep their home names; only the words change. That covers the banner, the chip, the sheet's title and body, the start line, and these, which Boston's script lacked:
     - `boats`: the rack's four tier names and the four sheet labels (`label.nextBoat`, `label.boatLeft`, `label.rackEmpty`, `label.maxed`);
     - `menu`: the dish line (`menu.cheese.line`) and the zone names;
     - `stars`: the five rating names;
     - `shifts`: the three shift names and the breakdown alert;
     - `gameDay`: the info body.
7. **City-wide**, one section each:
   - **`### Founder`:** the first neighbourhood's character who takes over its kitchen (Father Dom in Boston), their id, and the scene where it happens (Boston: `north-end-2`).
   - **`### Night oven`:** the oven's name (the home city's is "Nonna's night oven") and its sheet line with `{hours}` (keys `nightOven.name`, `nightOven.body`).
   - **`### Rival card`:** `rival.open`, `rival.title` (with `{n}`, the pies to sell in 5 minutes), `rival.win` and `rival.lose`, in this city's voice.

## Limits
Your brief's scene, panel and bubble limits (a bubble is at most 90 characters; the schema test checks it). Keep the bible's names and ids exactly. End every scene on a line that makes the next one wanted.

## Report
Standard writer report: scenes, interludes, longest line, the mirrored shops, and any new props.
