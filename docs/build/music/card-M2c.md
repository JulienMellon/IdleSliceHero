# Card M2c — villain stings, Victor's exit, recipe, reunion; hierarchy; full build; cue sheet (R2)

**Goal:** the last cues join the language, the build proves the whole score obeys the palette and the loudness hierarchy, and the cue sheet describes what exists.

**Read first:** your brief and the plan sections it names (2.5 and 2.6 are yours); the "language" section of `docs/build/music/reports/M1a.md`; `tools/audio/jazz.py`; `tools/audio/palette.py`; in `compose.py`: `sed -n '/megaslice_hq.*restart=True/,/^def city_theme/p' tools/audio/compose.py` (the rep stings, the dock variant, Victor's exit, `reunion`, `recipe`); `grep -n "megaslice_rep\|victor_exit\|recipe\|reunion" docs/AUDIO.md | cut -c1-400`; `sed -n '30,48p' tools/audio/build.py` (the loudness tables).

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/AUDIO.md`; `AUDIOLOG.md` (step 8); `marketing/ad/README.md` (one appended line, step 8); `docs/build/music/reports/M2c.md`.
- Do not edit: `src/audio/*.ts`, `sfx.py`, scene files.

## Steps
Run `sh tools/audio/fetch_bank.sh`, then one full build if `tools/audio/build/report.json` is missing. First: `grep -n "megaslice_rep\|victor_exit\|recipe:\|reunion:" src/audio/manifest.ts | cut -c1-160 > /tmp/story2-before.txt`. Each cue stays within 0.5 s of its length there.

- [x] **1. `megaslice_rep` and `megaslice_rep_dock`.** The HQ loop's villain idea, short: the stalking bass figure and the dark Rhodes motif over a min(maj7), ending on a diminished or tritone colour that doesn't resolve. No trombone glissando, no brass. Under 5.5 s each; the dock variant keeps whatever sets it apart today, on allowed instruments.
- [x] **2. `victor_exit`.** A comic slide on soft instruments: a descending vibraphone run or an upright-bass glide (pitch bend), ending on a single low note. About 3.2 s.
- [x] **3. `recipe`.** Solo nylon guitar or solo Rhodes, rubato, the motif at its plainest. −21 LUFS as now.
- [x] **4. `reunion`.** The same solo instrument states the phrase; a soft vibraphone or a flute at velocity 50 or under answers where the sax did. −23 LUFS as now; about 17 s.
- [x] **5. Whole-score palette.** `JAZZ` becomes every cue: the palette check runs on all of them with no exceptions. Delete the accordion, brass, reed, fiddle and square entries that nothing uses from the `GM` table, so they can't come back by accident.
- [x] **6. Hierarchy check in `build.py`.** After encoding, for each neighbourhood: `milestone_big` > `manager` ≥ `build` > `milestone` > `upgrade` > `bottleneck`, on integrated loudness and on momentary-max loudness (400 ms window). An inversion stops the build with the two cue names and their numbers. If a softer source makes a big moment measure smaller on momentary max, fix the arrangement (more of the band, a lower bass note), not the tier table.
- [x] **7. Full build and reel preset.** `python3 build.py > /tmp/build.log 2>&1; tail -6 /tmp/build.log`, then `git checkout -- assets/audio/sfx`. Total under 14 MB. Add preset `R2` to `reel.py`: each triumph whole, preceded by the last 8 s of its neighbourhood's loop at the loop's own level (so the hand-over is audible); the city theme; `megaslice_hq` for 15 s into `megaslice_rep`; `megaslice_rep_dock`; `victor_exit`; `waterfront_bid` straight into `triumph_waterfront`; `recipe`; `reunion`; then for Downtown and Industrial each: 6 s of the loop, then `bottleneck`, `upgrade`, `milestone`, `manager`, `milestone_big` each mixed over the running loop with the loop turned down by the duck the cue sheet's mix rules give. Labels say which cue starts when.
- [x] **8. Cue sheet and log.** `docs/AUDIO.md`: the story cues, gameplay stingers and mix-rules sections now describe the new cues (instruments, lengths, loudness, `payoffSeconds`); the totals table is current; the "Lofi jazz brief (2026-11-15)" section covers the whole score and the old "Lofi brief (2026-10-31)" is marked superseded in full. `AUDIOLOG.md`: three lines on R2 under `## Music rewrite (2026-11-15)`. `marketing/ad/README.md`: append one line saying the draft ad uses the score from before 2026-11-15.
- [x] **9. Measures.** One table for the whole score from the fresh `report.json`: every cue's seconds, LUFS against tier, peak, KB. Then the hierarchy table per neighbourhood (integrated and momentary max). Then the SFX tiers beside the stinger tiers. Then the total.

## Checks
`python3 -m py_compile tools/audio/*.py`; the full build line; `python3 compose.py /tmp/midi-check > /tmp/c.log 2>&1; tail -2 /tmp/c.log` (0 palette errors, every cue); `grep -c "accordion\|trumpet\|tuba\|trombone\|sax\|clarinet\|bassoon\|fiddle\|square" tools/audio/compose.py` (report the count and what the remaining lines are; comments are fine, tracks are not); `npx tsc --noEmit 2>&1 | tail -3`; `npx jest src/audio 2>&1 | tail -5`; `du -sb assets/audio | cut -f1` under 14680064; `git status --short assets/audio/sfx | head -2` prints nothing; `python3 tools/audio/reel.py R2 2>&1 | tail -2`.
