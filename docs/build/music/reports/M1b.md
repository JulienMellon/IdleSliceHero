# M1b measures: Suburbs, Waterfront, University as lofi jazz (R1)

Bank C (`MuseScore_General_Full.sf3`), as in M1a. Nobody has listened to any of this.
Numbers come from `tools/audio/build/report.json` (seam, LUFS, peak, KB), `python3 audit.py suburbs waterfront university` (lead minus bed) and the MIDI in `tools/audio/build/midi/`.

| Cue | Seconds | LUFS (tier) | Peak dBFS | Seam step / 99th pct | KB | GM programs in front | Lead minus bed (LU) |
|---|---|---|---|---|---|---|---|
| suburbs | 89.30 | -20.0 (-20.0) | -7.5 | 0.0004 / 0.0248 | 1085.6 | vibraphone 11 and jazz guitar 26 (leads), glockenspiel 9 (single notes, velocity 40 max), Rhodes 4, upright bass 32, brush kit 40 | -3.1 |
| waterfront | 96.00 | -20.0 (-20.0) | -7.4 | 0.0006 / 0.0254 | 1165.9 | harp 46 and marimba 12 (leads), marimba 12 arpeggio, Rhodes 4, upright bass 32, brush kit 40 with shaker (70) | -3.1 |
| university | 101.05 | -20.0 (-20.0) | -7.8 | 0.0016 / 0.0219 | 1226.0 | kalimba 108 (arpeggios, velocity 50 max) and vibraphone 11 (B lead, 50 max), Rhodes 4, vibes shimmer 11, finger bass 33, brush kit 40 | -3.0 |

Audio total: 13.87 MB of 14 (`du -sb assets/audio` = 13,873,904 bytes, limit 14,680,064; build summary in MiB: loops 8.69, stingers 2.95, story 1.43, sfx 0.17). Sound effects restored with `git checkout -- assets/audio/sfx`. No bars trimmed.

## What was done
- Same key, tempo, metre, 32 bars, section plan and seconds as before (89.302, 96.0, 101.053). `barRoots` come from the chart (`Harmony.roots`); no roots were typed. Each loop opens on 4 lead-free bars, and the one note before the first A (a pickup eighth in the intro's last half beat) is the only lead note in the intro, as in Downtown.
- Palette: `compose.py` reports 5 cues checked (downtown, downtown_sparse, suburbs, waterfront, university), 0 errors. Kit notes used: suburbs 36 37 38 40 44 51; waterfront 36 37 38 40 44 51 70; university 36 37 38 40 51. No trumpet, steel guitar, claps, fiddle, accordion, congas or square lead track exists in the three charts.
- Motif statements (counted in the MIDI): suburbs 2 (A at bar 4, A at bar 24; the march and B carry the answer and development phrases); waterfront 2 (A, A2); university 2 (kalimba in A, then the Rhodes at half speed over the first 4 bars of the 8-bar bed). Lead notes per section: the first bed (bars 8-11) has none in all three, and the last bed before the loop returns has none (suburbs bars 28-31, waterfront 24-31, university 20-27 on the lead tracks; University's second statement there is on the Rhodes).
- Melody against chords: every melody note was checked against the chord under it (root, fifth and the listed chord tones). The only notes outside a chord are eighth-note passing tones on weak beats (suburbs 5, waterfront 6, university 2); one of them, G over D13 in the Suburbs march (an eighth, bar 1 of the 4-bar march) sits a half step above F#, kept as a passing note.
- Lead level is set by track volume only: suburbs vibraphone 110, guitar 110, Rhodes 82, bass 88, kit 84; waterfront harp 112, marimba 112, Rhodes 80, bass 88, kit 80; university kalimba 127, vibraphone 127, Rhodes 60, bass 63, kit 60 (the leads are capped at velocity 50 there, so the bed was lowered instead). Lead notes after humanising: velocity at most 56 (50 in University).

### Suburbs (G, 86 BPM, 58% swing)
Chords: Gmaj9 6/9, Em9, Am9 D13, Cmaj7#11, Bm9 E7b9 (bed), Am9 Db13 into the loop start (second bed). B (`major_b`, bar by bar): Em9, Am11, C6/9, Gmaj9 D13, Em11, Am9, Cmaj9 Am9, D13. Kit: `SWING44` brushes, cross-stick on 2 and 4, ride, feathered kick, pedal hat on 2 and 4; no snare figure. Bass: two-feel in intro, A, beds; walking in the B and the march (the walk's last note approaches the A that follows, `walk_into`). Glockenspiel: 18 single notes, velocity 24-40.

### Waterfront (D Mixolydian, 80 BPM, 56% swing)
Tonic chords are D9, D13 and Dsus13; the minor v and the Cmaj9 bVII stay: Cmaj9 opens the B, is held in both beds, and the loop turns round on Gm9 | Cmaj9 into D. Bass: two-feel half notes, the habanera's dotted figure (dotted eighth, sixteenth, eighth, eighth) in the first half of every second whole-bar chord. Shaker on the eighths, brushes under it. Marimba doubles the A return an octave up at velocity 30.

### University (B-flat, 76 BPM, 60% swing)
Rhodes comps maj9, min9, 6/9, maj7#11 and dominant 13 chords, strum 45 ms. Kalimba arpeggios (note, octave, fifth, note) in eighths at velocity 30-46 replace the sixteenth square arpeggios; tail arpeggios on chord tones at 30-44. Kit: `HIPHOP` feel (a local `jazz.Feel`: ride on every eighth, cross-stick on 2 and 4, kick on 1 with a chance on the swung and-of-2 and and-of-3), kit 18 ms late, then the kick a further 10 ms late. Measured from the MIDI: kick lands 29 ms after the beat on average, ride 17 ms, cross-stick 18 ms, so the kick is about 12 ms behind the ride. Swing 60% set in the loop only (HOODS stays 58%, so the stingers' swing is unchanged).

## Stingers of these three neighbourhoods
`HOODS` leads changed: suburbs mute trumpet to vibraphone 11, waterfront fiddle to marimba 12, university square lead to vibraphone 11. Their 37 stingers were rebuilt (build passes, tier check passes). 34 are within 0.5 LU of their tier. The three `milestone_big` stingers (suburbs -17.0, waterfront -17.3, university -17.1 against -16) are stopped by the -6 dBFS ceiling and pass `tier_ok`; the files in git were already -16.9, -16.4, -16.3 (peaks -3.2 to -4.2 dBFS there, a different mastering). `sting_waterfront_bid` is unchanged.

## Code
- `tools/audio/compose.py`: `suburbs_chart/suburbs`, `waterfront_chart/waterfront`, `university_chart/university` rewritten; new `major_b`, `walk_into`, `kick_late`, `HIPHOP`; `GM['kalimba']` = 108; three `HOODS` leads; `JAZZ` holds all five jazz cues. `jazz.py` and `palette.py` not changed. Step 5's last build was a full build (an earlier partial-build command line wiped `assets/audio`, so the full build restored it); it passed.
- Checks: `python3 -m py_compile tools/audio/*.py`, `npx jest src/audio` 53 passed, `npx tsc --noEmit` clean.
