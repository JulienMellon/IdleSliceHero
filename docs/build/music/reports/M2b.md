# M2b measures: six triumphs and the city theme (R2)

Bank C (`MuseScore_General_Full.sf3`). Nobody has listened to any of this. Numbers come from `tools/audio/build/report.json` (LUFS, peak, KB, encoded seconds), `src/audio/manifest.ts` before the card (`/tmp/story-before.txt`) and after, and an ad hoc measure that rebuilds each cue's master the way `build.py` does (render, `story_master`, trim, fade, gain to the -18 LUFS tier) and then slides a 400 ms K-weighted window in 100 ms steps. The lead-minus-bed figures come from splitting the MIDI into the lead tracks and everything else and rendering and mastering each with the same gain. `audit.py` reads loops only, so it was not used.

| Cue | Seconds before / after | downbeatSeconds before / after | payoffSeconds before / after (diff) | LUFS (tier -18) | Peak dBFS | KB | Arrival: loudest 400 ms window (starts at s) vs integrated; loudest window before the payoff | Lead minus bed (LU) |
|---|---|---|---|---|---|---|---|---|
| triumph_downtown | 6.43 / 6.61 | 0.952 / 0.303 | 3.810 / 3.939 (+0.129) | -18.0 | -7.3 | 80.3 | -13.1 (4.0) vs -18.0; earlier -16.3 | -3.4 |
| triumph_suburbs | 8.11 / 8.42 | 1.071 / 0.000 | 5.357 / 5.581 (+0.224) | -18.0 | -6.8 | 102.8 | -13.0 (5.6) vs -18.0; earlier -14.7 | -3.3 |
| triumph_waterfront | 10.53 / 10.54 | 2.500 / 1.500 | 7.500 / 7.500 (0.000) | -18.0 | -6.6 | 128.4 | -12.8 (7.5) vs -18.0; earlier -14.6 | -2.9 |
| triumph_university | 10.55 / 10.40 | 1.429 / 0.789 | 7.143 / 7.105 (-0.038) | -18.0 | -7.1 | 123.2 | -13.0 (7.1) vs -18.0; earlier -14.6 | -3.5 |
| triumph_industrial | 9.70 / 9.56 | 1.304 / 0.000 | 6.522 / 6.316 (-0.206) | -18.0 | -6.7 | 115.9 | -12.6 (6.3) vs -18.0; earlier -14.5 | -3.3 |
| triumph_uptown | 8.73 / 8.68 | 1.154 / 0.000 | 5.769 / 5.714 (-0.055) | -18.0 | -6.6 | 105.4 | -12.1 (5.7) vs -18.0; earlier -16.7 | -3.1 |
| city_theme | 26.73 / 26.52 | 0.577 / 0.714 | 23.654 / 23.571 (-0.083) | -18.0 | -6.0 | 318.2 | -11.9 (23.6) vs -18.0; earlier -14.3 | -3.1 |

All seven pass the build's tier and -6 dBFS ceiling checks (city_theme peaks at -6.0, on the ceiling). Every payoff is within 0.25 s of the old one (largest +0.224 s, Suburbs) and every length within 1.0 s (largest 0.18 s, Downtown). The loudest 400 ms window of every cue starts at or within 0.1 s after the arrival beat (the 100 ms step), and is 1.6 to 4.6 LU above the loudest window before it. Downtown's window starts at 4.0 s, the payoff being 3.939 s.

## Tempo and timing (step 1)
`LEGACY` is gone. Each triumph plays at its neighbourhood's `HOODS` tempo, swing and meter. `downbeatSeconds` is the first bar line (the card did not ask to keep it; the director reads only `payoffSeconds` of the two). Payoff beat P and first bar `t0`, in beats: Downtown 6.5 and 0.5 (99 bpm, 6/8), Suburbs 8 and 0 (86), Waterfront 10 and 2 (80), University 9 and 1 (76), Industrial 8 and 0 (76), Uptown 8 and 0 (84). The old triumph had a pickup, a two-bar motif and a crash; at the slower tempos the same seconds hold only the two-bar build, so the motif's opening phrase is gone from the triumphs and the closing phrase (and for 4/4, the cadence phrase) is what is played. Tail after the arrival (beats): 4.4, 4.0, 4.0, 4.2, 4.0, 4.0, tuned by building until each file was within 0.5 s of its old length (all within 0.32 s).

## What is in each triumph (steps 2 to 4)
- Build, two bars: ii min9, then V sus13 for half a bar and V 13 for half a bar, in the neighbourhood's key (Waterfront and Industrial are Mixolydian: ii and V are built on the same scale degrees, the closing phrase has no 7th in it, so the A13 under Waterfront's phrase does not meet a C natural).
- Lead: the neighbourhood's front instrument, the loops' choice (`STING_FRONT`): nylon 24 (Downtown, Uptown, an octave down), vibraphone 11 (Suburbs, Industrial), marimba 12 (Waterfront), kalimba 108 (University). 4/4: the cadence phrase over ii, then the closing phrase placed so its held tonic is the arrival note. 6/8: the two bars of the closing phrase then the tonic on the arrival. Velocity 54 to 70 before humanising, cap 72. Track volume and velocity per cue were found by measuring lead minus bed (all seven between -2.9 and -3.5 LU).
- Under it: swung brushes (`jazz.brushes`, ride and feathered kick) on the first bar and the first half of the second, a brush swirl rising 22 to 62 over the last pulse that ends on the arrival; Rhodes 4 striking each chord a little higher than the last (two-note guide-tone voicings, the loops' `SIMPLE` table); vibraphone 11 rising through the V chord's voicing, four notes; slow strings 49 holding the guide tones of each of the three chords under a CC11 swell from 34 to 100; upright bass 32 walking (two-feel in 6/8), laid back by `jazz_finish`.
- Arrival, the same chord in every key (`arrival_chord`): maj9 of the tonic. Upright bass an octave under the loops' bass root (MIDI 24 to 35 at velocity 86) with the loops' own octave under it at 56; Rhodes rootless maj9 (four notes, A3 to F#4 in Waterfront's D); strings on root, fifth and ninth; vibraphone on the ninth and fifth an octave up; a celesta 8 bell on root and fifth an octave and a fifth up (velocity 50 to 60, capped at 60); a feathered kick and a brush tap on the beat. No cymbal, no timpani, no brass.
- Waterfront: tubular bells 14 strike A4 three times, half a beat apart (0.375 s, as before) at velocities 92, 82 and 72 (before: 110, 100, 90) over a soft D maj9 (Rhodes at velocity 40, upright bass D2) that opens the cue, so the bid's A7 (Rhodes B3 C#4 E4 G4, bass A2) resolves to D at 0 s: G falls to F#, C# stays. The build starts at beat 2 (1.5 s).

## City theme (step 5)
84 bpm, Eb (Uptown's tempo, key and swing). Six bars from beat 1, one neighbourhood each in build order (Downtown nylon, Suburbs vibraphone, Waterfront marimba, University kalimba, Industrial vibraphone, Uptown nylon), each stating the motif over its own ii-V-I (ii min9 two beats, V 13 one beat, I maj9 one beat). Then two bars of the triumphs' build with all six leads playing the cadence and the closing phrase together (velocity 30), into the same arrival chord on beat 33 (23.571 s). One ii-V-I per 4-beat bar is not slow; a slower cycle (two bars each) would put the payoff near 37 s, so the payoff time won over the cycle's speed, as the card allows.

## Palette and build (step 6)
`compose.py` palette-checked the seven cues (148 names in the run, 0 errors) and the seven are in `JAZZ`. Programs: 4, 8, 11, 12, 14 (Waterfront), 24, 32, 49, 108; kit 40 with notes 36, 37, 38, 40, 44, 51 only. Leads' track names: `lead` (triumphs) and `lead <hood>` (city theme). The build's `STORY_MASTER` (tape saturation, 10 kHz roll-off) and -18 LUFS tier are unchanged.

## Not done / flagged
- Only a partial build was run (the card asks for none); `build/report.json` held the other cues from the previous full build. `src/audio/manifest.ts` was regenerated by it: only the seven story lines differ.
- `docs/AUDIO.md` and `AUDIOLOG.md` were not updated (not named in the card): the triumph and city-theme rows still describe brass, timpani and a crash.
- `beatsPerBar` for Downtown's triumph is now 3 and `bpm` 99 (a quarter note), as in the loop; before it was 126.

Audio total: 17,073,549 bytes = 16.28 MB (MiB) of the 32 MB cap (33,554,432 B). The card's 14,680,064 limit is stale. Story cues: 974 KB for the seven.
