# M2a measures: gameplay stingers and the bid (R2)

Bank C (`MuseScore_General_Full.sf3`). Nobody has listened to any of this. Numbers come from `tools/audio/build/report.json` (LUFS, peak, seconds of the encoded file, KB), the manifest before the card (`seconds` as encoded) and an ad hoc stem split of each stinger's MIDI into the `lead` track and everything else (raw render, no mastering).

Each cell: LUFS / peak dBFS / seconds after (seconds before). Tier in the second column. Every stinger passes the build's tier check (within 0.5 LU, or quieter where the -6 dBFS ceiling stopped it); every length is within 0.5 s of its length before (largest change: 0.30 s).

| Kind | Tier | Downtown | Suburbs | Waterfront | University | Industrial | Uptown | Lead minus bed (LU, 6 hoods) |
|---|---|---|---|---|---|---|---|---|
| bottleneck | -22 | -22.0 / -9.2 / 2.26 (2.42) | -22.0 / -9.0 / 3.43 (3.56) | -22.0 / -7.6 / 3.73 (3.89) | -22.1 / -6.0 / 3.80 (4.07) | -22.0 / -8.6 / 3.79 (4.08) | -22.0 / -7.8 / 3.54 (3.75) | no bed |
| milestone | -19 | -19.1 / -6.0 / 5.95 (6.13) | -19.1 / -6.0 / 6.50 (6.32) | -19.0 / -6.0 / 6.89 (6.76) | -19.0 / -6.0 / 7.22 (7.10) | -19.1 / -6.0 / 7.30 (7.47) | -19.2 / -6.0 / 6.39 (6.63) | -9.1 to -5.3 |
| milestone_big | -16 | -17.1 / -6.0 / 6.43 (6.16) | -17.3 / -6.0 / 6.54 (6.35) | -17.8 / -6.0 / 7.03 (6.83) | -17.8 / -6.0 / 7.05 (7.11) | -17.4 / -6.0 / 7.36 (7.41) | -17.2 / -6.0 / 6.80 (6.65) | -4.9 to -1.5 |
| manager | -17 | -17.5 / -6.0 / 6.48 (6.24) | -17.7 / -6.0 / 6.51 (6.33) | -18.0 / -6.0 / 6.90 (6.79) | -18.2 / -6.0 / 7.03 (7.09) | -17.8 / -6.0 / 7.47 (7.37) | -17.6 / -6.0 / 6.88 (6.61) | -5.1 to -1.2 |
| upgrade | -20 | -20.0 / -8.1 / 3.28 (3.58) | -20.0 / -7.1 / 4.08 (4.29) | -20.0 / -6.4 / 4.02 (4.20) | -20.0 / -6.0 / 4.38 (4.62) | -20.0 / -6.0 / 5.94 (6.17) | -20.0 / -6.5 / 5.43 (5.52) | -7.9 to -1.5 |
| fleet | -20 | -20.0 / -7.4 / 3.43 (3.61) | -20.0 / -6.3 / 4.52 (4.72) | -20.0 / -6.0 / 5.43 (5.13) | -20.1 / -6.0 / 5.62 (5.33) | -20.0 / -6.0 / 6.04 (6.17) | -20.0 / -6.4 / 5.38 (5.51) | -3.9 to -0.1 |
| drone | -20 | -20.0 / -6.7 / 3.55 (3.54) | -20.0 / -6.5 / 5.31 (5.23) | -20.1 / -6.0 / 5.65 (5.65) | -20.1 / -6.0 / 5.94 (6.07) | -20.0 / -6.2 / 5.84 (5.83) | -20.0 / -6.7 / 5.37 (5.41) | -6.0 to -1.9 |
| welcome | -19 | -19.0 / -6.0 / 3.92 (3.67) | -19.0 / -6.1 / 4.57 (4.53) | -19.0 / -6.1 / 4.02 (4.27) | -19.0 / -6.0 / 5.11 (5.01) | -19.2 / -6.0 / 6.54 (6.50) | -19.0 / -6.0 / 6.07 (5.87) | -8.7 to -3.0 |
| warmth | -20 | -20.0 / -6.1 / 5.93 (6.06) | -20.0 / -6.0 / 5.97 (6.20) | -20.0 / -6.1 / 6.93 (6.65) | -20.0 / -6.3 / 6.62 (6.79) | -20.0 / -6.0 / 7.26 (7.26) | -20.0 / -6.0 / 6.37 (6.59) | -8.3 to -4.0 |
| build | -17 | -17.6 / -6.0 / 6.27 (6.13) | -17.6 / -6.0 / 6.42 (6.30) | -17.9 / -6.0 / 6.76 (6.78) | -18.0 / -6.0 / 6.95 (7.09) | -17.8 / -6.0 / 7.55 (7.41) | -17.6 / -6.0 / 6.89 (6.63) | -4.6 to -0.7 |
| perk | -20 | -20.0 / -7.4 / 2.56 (2.60) | -20.0 / -7.9 / 3.46 (3.71) | -20.0 / -7.6 / 3.79 (4.02) | -20.0 / -8.1 / 3.99 (4.19) | -20.0 / -7.9 / 3.93 (4.20) | -20.0 / -7.7 / 3.65 (3.88) | no bed |
| offline | -22 | -22.0 / -10.5 / 2.47 (2.48) | -22.0 / -10.9 / 3.00 (3.15) | -22.0 / -9.5 / 3.63 (3.72) | -22.0 / -10.6 / 3.20 (3.17) | -22.0 / -8.8 / 4.25 (3.96) | -22.0 / -9.8 / 3.87 (3.59) | no bed |
| bid (waterfront) | -18 | -18.1 / -6.0 / 3.07 (3.10) | | | | | | no lead |


## Front instruments (GM programs, 0-based; the bank is not changed)
- Downtown: nylon guitar 24 (lead, an octave down), Rhodes 4, warm pad 89, upright bass 32, brush kit 40. 6/8: `phrases` returns `M68` and `CLOSE68`, the kit is `jazz.F68`, swing 0, beat 1 at `T0` (`downbeatSeconds` 0.6061, as before).
- Suburbs: vibraphone 11 (lead), Rhodes, kit `SWING44`. Waterfront: marimba 12 (lead), kit `SWING44`. University: kalimba 108 (lead), kit `HIPHOP`. Industrial: vibraphone 11 (lead), kit `SHUFFLE`. Uptown: nylon guitar 24 (lead, an octave down), kit `SWING44`. All use Rhodes 4, warm pad 89 and upright bass 32 where the kind has them.
- Bell colour (the `__bell` stem, as before): celesta 8 in every neighbourhood (`bell_program`), velocity 60 or under (checked in the MIDI: maximum 60). `milestone_big` also has a `bell arrival` celesta chord at velocity 54 (before humanising).
- `fleet`: the horn is gone; two short low marimba notes. `drone`: the square lead and square arpeggio are gone; the lead is the neighbourhood's, plus a six-note harp flutter. `milestone_big` swell: vibraphone only (the timpani thump is gone; the bass note carries the arrival). The `bid`: Rhodes, upright bass and vibraphone, no timpani.
- Palette: `compose.py` palette-checked every stinger and every `__bell` stem and the bid (141 names in the run, 0 errors). All 73 stinger names and their stems are in `JAZZ`. Programs in the stinger MIDI: 4, 8, 11, 12, 24, 32, 46, 89, 108; the kit notes are the brush kit's (36, 37, 38, 40, 44, 51 from `jazz.brushes`, and the swirl 40).

## What the tag is
- One chord per neighbourhood: the maj9 voicing of the tonic (7 9 3 5, rootless, in G3..Bb4, `jazz.voicing_off`). Waterfront and Industrial are Mixolydian and their loops' tonic chord is a dominant, so their tag chord is **dom9** (3 5 b7 9), not maj9: a maj9 would put the natural 7th against the loop's flat 7th under it. This is the one departure from the card's wording.
- The melody is the city motif (`bottleneck`: its first three notes; the others the opening, opening and closing, or the cadence phrase from `phrases`), swung by `jazz_finish` at the neighbourhood's own ratio (0.58, 0.56, 0.58, 0.667, 0.60; 0 in Downtown).
- The Rhodes strikes the voicing once on beat 1 and once on the arrival bar, held 0.4 and 0.7 of a bar, so no chord is left sounding into the next sound. `bottleneck` has no Rhodes chord, as before.
- Full band (`milestone_big`, `manager`, `build`): pad, upright bass note on beat 1 and a longer one under the arrival, brushes (`jazz.brushes`) on the bars the swirl does not cover, a brush swirl rising into the arrival (`milestone_big`'s to velocity 70, `manager`'s 60). `milestone` has the swirl only.
- Finish: `jazz_finish` (reverb sends halved, chorus quartered, timing humanising, kit and bass laid back), lead velocity capped at 58. Lead track volume 100 in the full-band kinds and 80 elsewhere; Rhodes 88 and 100.

## Lengths
- Every stinger's `musicSeconds`, `seconds` in the generated manifest and `downbeatSeconds` are the old ones (the composer's `end` is unchanged). The encoded file length is what the card compares: the struck and plucked tag dies away sooner than the old sax, accordion and fiddle did, so 35 of the 73 files came out more than 0.5 s off (up to 1.9 s too short, a few 0.5 to 0.6 s too long). A soft warm-pad chord (velocity 28, from the last lead note) now rings out the end, its length per neighbourhood and kind in `STING_RING` in `compose.py`, found by building and measuring (full-band kinds: the bed pad's end, in beats from `end`). Result: all 73 files within 0.3 s of their old length.
- The `bid` ends on A: Rhodes B3 C#4 E4 G4 (the seventh, G, on top) with the upright bass on A2 and a vibraphone swell on A3 and A4, all let go at beat 4.0-4.2 with nothing after; `musicSeconds` 2.6 and `downbeatSeconds` 0 unchanged.

## Not done / flagged
- Lead minus bed is 0 LU or under in every kind that has a bed (table). `bottleneck`, `perk` and `offline` are the lead (a bell, for the last two) with the tag chord under it, so there is no bed to measure against.
- `docs/AUDIO.md` and `AUDIOLOG.md` were not updated by this card (not named in it).

Stinger bytes total 2.92 MB (73 files, 64 kbps mono).

Audio total: 16.29 MB of 25 (`du -sb assets/audio` = 17,077,484 bytes; cap 26,214,400). No bars trimmed (stingers are not loops).