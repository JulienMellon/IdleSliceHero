# Card M1c — Industrial, Uptown, MegaSlice HQ, the full build, the cue sheet (R1)

**Goal:** the last three loops, then one clean full build of the whole score and a cue sheet that describes it.

**Read first:** your brief and the plan sections it names; the "language" section of `docs/build/music/reports/M1a.md`; `tools/audio/jazz.py`; `tools/audio/palette.py`; in `compose.py` the `HOODS` table, `play_sections`, and the functions `industrial`, `uptown` and `megaslice` (only the part up to the `megaslice_hq` manifest line); `grep -n "^| Industrial\|^| Uptown" docs/AUDIO.md | cut -c1-900`; `grep -n "megaslice_hq\|HQ" docs/AUDIO.md | cut -c1-300`.

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/AUDIO.md` (steps 6 and 7); `AUDIOLOG.md` (step 7); `docs/build/music/reports/M1c.md`.
- Do not edit in this card: the five loops already rewritten; the rep stings and Victor's exit inside `megaslice`; any stinger, triumph or story function.

## Steps
Run `sh tools/audio/fetch_bank.sh`, then one full build if `tools/audio/build/report.json` is missing. Each loop joins the `JAZZ` set.

- [ ] **1. Industrial** (A, 76 BPM, triplet shuffle, 36 bars = three 12-bar choruses). A jazz blues: dominant 9ths and 13ths, a ♯IV diminished passing chord in bar 6, ii–V turnarounds in bars 9–12. Muted Rhodes and warm clean guitar comping; a soft vibraphone (or flute at velocity 50 or under) carries the motif with the blue flat-3 grace note. Ride and brushes in the shuffle feel; the rim click replaces nothing louder. Out: tenor sax, the drawbar organ pad (a warm pad 89 instead).
- [ ] **2. Uptown** (E♭, 84 BPM, 60% swing, 32 bars). Nylon or jazz guitar and piano. The "pompe" becomes a quiet swing: guitar chords on 2 and 4 at velocity 44 or under. Chromatic approach notes stay in the melody, now on guitar. Harp or celesta plays the tag. Walking upright bass, brushes. Out: clarinet.
- [ ] **3. MegaSlice HQ** (C minor, 76 BPM, 17 bars, `restart=True`: it always starts at bar 0). Sneaky and slightly comic through harmony, not weight: a stalking walking bass (upright, or pizzicato 45 doubling it), a dark Rhodes low in its register playing the villain motif, a min(maj7) on the tonic, diminished passing chords, a tritone substitution into the turnaround. For finger snaps use side stick 37 or claves 75 at velocity 40 or under on 2 and 4. Out: tuba, bassoon, trombone, timpani. In `build.py`, move it onto the lofi chain with the other loops and keep its own tier (−19 LUFS).
- [ ] **4. Lead level.** `python3 audit.py industrial uptown megaslice_hq`: lead minus bed between −2 and −4 LU on each.
- [ ] **5. Full build.** `python3 build.py > /tmp/build.log 2>&1; tail -6 /tmp/build.log`, then `git checkout -- assets/audio/sfx`. Every seam, ceiling and tier check passes; the total is under 14 MB. If it is over, trim bed bars from the longest loop (Downtown first), keep `downtown_sparse` on the same timeline, rebuild, and say what you cut.
- [ ] **6. Cue sheet.** In `docs/AUDIO.md`: rewrite the eight rows of the neighbourhood loops table and the HQ entry (blend, tempo and metre, key, instruments with GM numbers, loop length, form), the "shared bed" paragraph, and the totals table in "platform and cost". Add a section `## Lofi jazz brief (2026-11-15)` at the end with Julien's two sentences, the palette rule, the swing table and the lead-level rule; put one line under the old "Lofi brief (2026-10-31)" heading saying it is superseded for loops. Leave the stinger, triumph and story sections for R2.
- [ ] **7. Log and measures.** Add three lines on R1 under `## Music rewrite (2026-11-15)` in `AUDIOLOG.md`: what was rewritten, the bank, "not auditioned yet". Write the measures file with all eight loops in one table (copy the M1a and M1b rows from a fresh `report.json`, not from their files) and the total.

## Checks
`python3 -m py_compile tools/audio/*.py`; the full build line; `python3 audit.py downtown downtown_sparse suburbs waterfront university industrial uptown megaslice_hq | tail -9`; `npx tsc --noEmit 2>&1 | tail -3`; `npx jest src/audio 2>&1 | tail -5`; `du -sb assets/audio | cut -f1` under 14680064; `git status --short assets/audio/sfx | head -2` prints nothing; `python3 tools/audio/reel.py R1 2>&1 | tail -2`.
