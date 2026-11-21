# Card S4 — sharded screenshot run

**Lane:** S (scripts and shots). **Added:** 2026-11-21 by session S8, at Julien's request.

## Goal
The full screenshot run (`python3 scripts/screenshots.py <label>`) takes about 25 minutes, and its 30-minute timeout is getting close. It keeps about one core busy on a 4-core container. Split it into shards that run in parallel, and merge their output, so that a full run takes about half the time or less. The verify commands and `scripts/review_shots.py` must see exactly what they see today.

## Files in scope
- `scripts/screenshots.py`
- `scripts/screenshots_merge.py` (new, only if the merge doesn't fit cleanly in `screenshots.py`)
- `docs/build/README.md`: section 5 only, the `nohup … screenshots.py $L …` line and the "Wait about 9 minutes" sentence
- A test or self-check script under `scripts/` if you add one

Don't touch fixtures, the app, or `scripts/review_shots.py`. If the merge can't be done without changing `review_shots.py`, stop and report `Needs:`.

## Steps
- [ ] 1. Read `scripts/screenshots.py` and `scripts/fixtures/README.md`. Write down in this card, in at most 5 lines, how fixtures are ordered and how `report.json` and `layout.json` are built, and whether any fixture depends on state that an earlier fixture left behind (a shared browser, files or a server). Shards are safe only if none does.
- [ ] 2. Add `--shard K/N` (e.g. `--shard 1/2`). Shard K runs its share of the fixtures into its own working folder and writes partial `report.json` and `layout.json` files. Balance the shards by each fixture's run time from the last full run if one is recorded; otherwise interleave them (fixture i goes to shard i mod N). Leave `--only` and the `dev` label working as they do now.
- [ ] 3. Add `--jobs N` (default 1, so nothing changes unless it's asked for). It starts N shard processes, each with its own browser and, if the script serves the export itself, its own port. It waits for all of them, merges their output into `screenshots/<label>/`, and writes one `report.json` and one `layout.json` with the same keys and meanings as a single run: `loaded` is the AND of all shards, `errors` is the concatenation, and the layout `new`/`allowed`/`stale` counts are summed over shards (de-duplicated if two shards could see the same entry). A crashed shard counts as an error in `report.json` and must never be dropped silently.
- [ ] 4. Equivalence check. On the current tree, run `--jobs 1` into label `s4-a` and `--jobs 2` into label `s4-b`, redirecting output to `/tmp`. Compare: the same set of shot file names, `report.json` loaded and errors equal, and layout counts equal. Then run `python3 scripts/review_shots.py s4-b s4-a 2>&1 | tail -3`: every shot must be `same` apart from known seam-noise shots (STATE `open:` lists them). Record the wall time of each run and then try `--jobs 3`, keeping whichever N is fastest without new errors. Delete the `s4-*` folders afterwards.
- [ ] 5. Update README section 5: the run line uses `--jobs <best N>`, and the wait sentence gives the measured time. Keep `timeout 900` for the re-run of a hung shot.

## Checks
- `python3 scripts/screenshots.py dev --only <any fixture>` still behaves as before.
- Step 4's comparison passes and its timings are written in this card.
- `npm run format:check 2>&1 | tail -3` passes (it covers only JS/TS, but run it anyway).

## Report
Standard format. In `Checks`, give the wall times for `--jobs 1`, 2 and 3 and the N you chose.
