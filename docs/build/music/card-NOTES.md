# Card NOTES — Julien's notes on a reel (any round)

**Goal:** every note Julien gave after listening is turned into a change he can hear on the next reel, and nothing else changes.

Your task's `extra:` line names the notes file (`docs/build/music/notes/<round>.md`) and the round. The notes are his own words, the only audition this score gets. Don't argue with one, don't average it with the plan, and don't fix things he didn't mention.

**Read first:** your brief; the notes file; the measures files of that round (`ls docs/build/music/reports/`); `tools/audio/jazz.py`; then only the `compose.py` functions for the cues his notes name.

## Files
- Own: `tools/audio/**` except `sfx.py`; the rows of `docs/AUDIO.md` for cues you change; `docs/build/music/reports/NOTES-<round>.md`.

## Steps
- [x] **1. Table first.** In the measures file, one row per note: his words (quoted, in full) → which cues → what you will change → how it will show in a measurement (for example "vibraphone lead −3 LU", "swing 58% → 62%", "program 73 flute removed from Industrial"). A note about a sound ("still buzzy", "too bright") maps to the instrument most likely to cause it: check the timbre table in `reports/M0.md`, change that program or lower it, and say which you chose and why in one line.
- [x] **2. A note that names the bank** (R0, or "the piano sounds cheap"): change `tools/audio/BANK`, run `sh tools/audio/fetch_bank.sh`, and rebuild everything this track has rewritten so far.
- [x] **3. A note that applies to every cue** ("drums too busy", "everything too bright"): change the helper in `jazz.py` or the chain in `post.py` once, not each chart.
- [x] **4. Make the changes.** Hard constraints and the palette still hold. If a note can't be met without breaking one, do the nearest allowed thing and put the conflict under `Needs:`.
- [x] **5. Rebuild** the cues you changed (a full build if more than five, then `git checkout -- assets/audio/sfx`). Re-run `audit.py` on any loop you touched.
- [x] **6. Finish the table:** a last column with the measured result per note. Update the `docs/AUDIO.md` rows that changed.

## Checks
`python3 -m py_compile tools/audio/*.py`; the build line you used; `npx jest src/audio 2>&1 | tail -5`; `npx tsc --noEmit 2>&1 | tail -3`; `du -sb assets/audio | cut -f1` under 14680064.
