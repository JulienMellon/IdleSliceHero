# Card CLOSE — close the music rewrite (after Julien's yes on R2)

**Goal:** the logs and the cue sheet say what the score is now and what Julien heard and approved, and the next audio card starts from the right place.

**Read first:** your brief; `AUDIOLOG.md` (whole file, about 5 KB); every file in `docs/build/music/notes/`; the open-notes table at the end of the newest `docs/build/music/review-*-audio.md` (`sed -n '/^## Open notes/,$p' <file>`); `docs/build/v5.18/card-A2.md`.

## Files
- Own: `AUDIOLOG.md`, `docs/logs/AUDIOLOG-archive.md`, `docs/AUDIO.md` (the "open" and "known gaps" lines only), `docs/build/v5.18/card-A2.md` (the prerequisite block at its top only), `docs/build/music/reports/CLOSE.md`.
- No code and no audio in this card. Do not run the build.

## Steps
- [ ] **1. Archive.** Move everything in `AUDIOLOG.md` from `## Owner direction — ON HOLD` through the old "Current state" table into `docs/logs/AUDIOLOG-archive.md`, unchanged, under a heading with today's date.
- [ ] **2. New current state** in `AUDIOLOG.md`: the brief in Julien's words with the date; the bank and its licence name; what each round rewrote; what he said after each reel (quoted from the notes files, with dates); the audiocritic's last verdict line and its open-notes table; the open items that are not this track's (AU39, AU40, AU41, AU25; AU76 and AU77 with their status); the next ID.
- [ ] **3. Audition checks.** Rewrite the five device checks for the new score: the same five situations, with the cue names and what to listen for now (no brass crash to wait for: the arrival chord and bass note instead).
- [ ] **4. Cue sheet.** In `docs/AUDIO.md`, any line that says nothing has been auditioned now says what Julien heard, from which reel, on which date, and that device checks are still open.
- [ ] **5. Next audio card.** In `docs/build/v5.18/card-A2.md`, replace the prerequisite block at the top with one line: the music rewrite is on `main` as of today's date; Boston, the managed stems and the rush layer use `tools/audio/jazz.py`, `tools/audio/palette.py` and the bank in `tools/audio/BANK`.
- [ ] **6. Measures file:** five lines: files changed, the next audio ID, and anything in the notes files that was never acted on.

## Checks
`grep -c "ON HOLD" AUDIOLOG.md` prints 0; `grep -n "^\*\*Next ID\|Next IDs" AUDIOLOG.md | tail -2`; `wc -c AUDIOLOG.md | cut -d' ' -f1` under 7000; `git status --short | grep -v ' docs/\| AUDIOLOG.md' | head -3` prints nothing.
