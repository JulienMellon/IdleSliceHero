# M2c measures: the whole score (R2)

This file was updated by the fix pass on review R2 (notes AU79 to AU90); the last section, "Fix pass", says what changed and what was measured. All tables below are from the full build after that pass.

Bank C (`MuseScore_General_Full.sf3`). Nobody has listened to any of this. Numbers come from `tools/audio/build/report.json` of the full build (`python3 build.py`); LUFS is integrated loudness of the file as encoded (measured on the 32-bit float master that went into the encoder), peak is its sample peak. GM programs are 1-based, every pitched track of the cue (the kit is GM kit 40, brushes, in every cue that has one).

## What changed (steps 1 to 7)

| Cue | Seconds before / after | Tier | Front instruments (GM, 1-based) | What it is |
|---|---|---|---|---|
| megaslice_rep | 4.89 / 4.77 | -18 LUFS | dark Rhodes 5 (motif), Rhodes 5 (comp), vibraphone 12, upright bass 33, brush kit (GM kit 40) | 76 bpm (the HQ loop's), swing 0.58, C minor, 6 beats (fix pass AU87; it was 120 bpm). The HQ loop's motif up to its held sixth (`5, 1 b3 b5 b6`, from beat 0.5) over Cm(maj7); the bass climbs C2 Eb2 F2 and lands on Gb2 on beat 3.5, held to beat 6; the chord there is C#dim7 (over Gb2 that is F#7b9, the tritone substitute), held with no resolution. Side stick on 2 and 4 at velocity 28 before humanising. No brass, no glissando. |
| megaslice_rep_dock | 5.06 / 5.24 | -18 LUFS | the same plus warm pad 90 | The same in D minor at 76 bpm over the held A (pad A2 and A3, let go a beat before the chord does so the file is not longer than its old one); the last chord is G#dim7 over A2, which is A7b9 and leaves the bid's A hanging. |
| victor_exit | 3.48 / 3.19 | -16 LUFS | vibraphone 12, upright bass 33 | A vibraphone run falls from C5 to C4 in eighths (velocity 62 down to 41); the upright bass plays D2 and a pitch bend of two semitones takes it down to C2, held (measured on the rendered bass alone: fundamental 73.3 Hz at the attack, 69.6 Hz in the bend, 65.4 Hz from 0.6 s on). Now mastered through `story_master` (it was peak-limited 0.5 LU under tier without it). |
| recipe | 9.94 / 9.82 | -21 LUFS | nylon guitar 25 | Solo, rubato (the old held breath after every long note, 0.45 beat now), the motif then its closing phrase one octave down from the old line (C3 to D4), a strummed F chord to end. Reverb send 90 (half of it survives `jazz_finish`) so the tail lasts the old length. No swing, no kit. |
| reunion | 16.93 / 16.82 | -23 LUFS | nylon guitar 25, vibraphone 12 (velocity 50 or under; measured 35 to 50), warm pad 90 | The nylon guitar states the motif at 60 bpm, the vibraphone answers with the closing phrase where the sax did, then both play both phrases over the pad. |

`palette.check` runs on every cue now: `compose.py` reports 153 cues checked (stems included), 0 errors, and `JAZZ` is gone. The `GM` table lost accordion, tango accordion, organ, trumpet, trombone, tuba, muted trumpet, horn, brass, tenor sax, bassoon, clarinet, whistle, square lead and fiddle, so none of them can come back by accident (`HOODS` still named three of them in a `lead` field nothing reads; it now names the neighbourhood's real front instrument). `grep -c "accordion|trumpet|tuba|trombone|sax|clarinet|bassoon|fiddle|square" compose.py` prints 4; all four are words in docstrings or comments (the notes that the guitar replaced the accordion, "no fiddle, no accordion", the clarinet's chromatic notes, the sax in reunion's docstring), none is a track.

Every story cue stays within 0.5 s of its length before the rewrite (the rep stings: 4.89 and 5.06 s before, now 4.77 and 5.24). After the fix pass `src/audio/manifest.ts` differs from the one before it only in `seconds` (59 rows); no `payoffSeconds`, `downbeatSeconds`, `musicSeconds`, tempo or `barRoots` moved, and the largest change in a row is +0.21 s (university_drone, megaslice_rep).

## The loudness hierarchy (step 6)
`build.py` now stops when, in any neighbourhood, `milestone_big` > `manager` >= `build` > `milestone` > `upgrade` > `bottleneck` fails on integrated loudness or on momentary max (`post.momentary_max`, BS.1770 K-weighting, 400 ms window, 100 ms hop), naming both cues and both numbers. It also checks loops and story cues against their tiers now (it checked stingers and effects only). On the R2 stingers as they came out of card M2a it failed in at least ten places in five neighbourhoods or more: `milestone_big` was not above `manager` on momentary max (Downtown, Waterfront, Uptown) and `manager` was below `build` (Suburbs, Waterfront, University, Industrial; integrated and momentary max). The cause: the three full-band kinds peak on the upright bass and the first and arrival hits at +20 dB of gain, the -6 dBFS limiter takes 5 dB off those peaks, and they all land at about -17.5 LUFS whatever the tier says.

What was changed (arrangement, not the tier table): the warm pad under the three full-band kinds is louder and has an expression fade over its last beat so it does not lengthen the file (`FULL_PAD`, `PAD_FADE`); `milestone_big`'s pad swells in toward the arrival (`PAD_SWELL`); its arrival celesta octave is now the helper `arrival_bell`; the upright bass's velocity on the first beat and on the arrival is set per neighbourhood and kind, a lower bass velocity making the file louder because the limiter then works less (`BASS_HOOD`). Per neighbourhood the pad and bass settings come from building five pad levels times three bass levels for the three kinds, and taking the combination that puts them in order with the widest gaps and the least distance from the tiers; the search is not in the repo, the result is the two tables `FULL_PAD_HOOD` and `BASS_HOOD`. Three things I tried and removed: a string swell under the arrival of `milestone_big` and `manager` (removing it from the manager raised its integrated and momentary max both, Industrial -17.34 / -14.93 to -17.26 / -14.56), a celesta octave on the manager's arrival (no change at 0.1 LU) and a mallet swell on the manager (no change). `milestone_big`'s existing mallet swell stem measures -68 LUFS against -38 for the lead and the bass, so it is inaudible; I left it in.

Result before the fix pass (superseded by the table below and the fix-pass section): all five kinds in order in all six neighbourhoods, but the gaps are small: `milestone_big` is 0.3 to 0.6 LU over `manager` on integrated and 0.1 to 0.8 on momentary max (Downtown 0.3, Suburbs 0.2, Waterfront 0.6, University 0.8, Industrial 0.3, Uptown 0.1); `manager` equals `build` at the table's 0.1 LU in University (-17.1 integrated and -15.1 momentary max on both) and on Waterfront's momentary max (-15.4 on both); `build` is 0.1 above `milestone` on momentary max in Waterfront and University. These pass the build's check at its 0.1 LU resolution but a small change in the chart can flip them: the build will say so. `milestone_big` still lands 0.5 to 0.9 LU under its -16 tier (the -6 dBFS ceiling), and `manager` and `build` 0.1 to 0.4 under -17.

## Encoding (R2 notes)
Music, stingers and story cues are encoded as AAC at 256 kbps (loops were 128, stingers 64, story 96); sound effects stay at 64 kbps mono and 16-bit input, and `git status --short assets/audio/sfx` prints nothing after the build. The audio goes into the encoder as 32-bit float (it was 16-bit PCM); the renderer's output was already 32-bit float and every stage in `post.py` runs in 64-bit float, so no 16-bit step is left before the encoder for the score. The 32-bit float masters, as they went into the encoder, are kept as WAVs under `tools/audio/build/master/{music,sting,story}/` (not in git). `ffmpeg`'s AAC encoder lands at (bytes x 8 / seconds, from `report.json`) 233 to 257 kbps for the loops, 219 to 259 for the story cues and 94 to 168 for the mono stingers at the 256 kbps setting: it does not spend bits on content that the 7 kHz roll-off removed.

## Reels
`python3 tools/audio/reel.py R2` builds `tools/audio/build/reel/R2.mp3` (304.6 s, 15 tracks, 320 kbps MP3, -16.0 LUFS, peak -2.0 dBFS) and `python3 tools/audio/reel.py FULL` builds `build/reel/FULL.mp3` (1302.8 s = 21:42, 93 tracks, 320 kbps MP3, -16.0 LUFS, peak -3.8 dBFS, 52 MB) with `FULL.txt`, the track list with start times. FULL has every music, sting and story cue whole, cut from the 32-bit float masters, in cue-sheet order: the seven neighbourhood loops, welcome and warmth per neighbourhood, megaslice_hq, the two rep stings, the six triumphs (the Dock Saved bell last), recipe, reunion, victor_exit, city_theme, perk, offline, then the gameplay stingers by kind (bottleneck, milestone, milestone_big, manager, upgrade, fleet, drone, build, all six neighbourhoods each) and the bid. One static gain for the whole reel (+2.2 dB), no per-cue matching. Nobody has listened to either.

## Loops, story cues

| Cue | Seconds | LUFS (tier) | Momentary max | Peak dBFS | Seam step / 99th pct | KB | kbps (measured) | GM programs |
|---|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 (-20.0) | -14.6 | -7.4 | 0.00369 / 0.02357 | 2941.9 | 255 | 5, 25, 33, 90 |
| downtown_sparse | 94.55 | -22.0 (-22.0) | -17.0 | -10.9 | 0.00043 / 0.01293 | 2691.0 | 233 | 5, 25 |
| industrial | 113.68 | -20.0 (-20.0) | -14.4 | -7.5 | 0.00515 / 0.02937 | 3551.1 | 256 | 5, 12, 28, 33, 74, 90 |
| megaslice_hq | 53.68 | -19.0 (-19.0) | -14.9 | -7.0 | 0.0025 / 0.02179 | 1668.4 | 255 | 5, 33, 46 |
| suburbs | 89.30 | -20.0 (-20.0) | -14.2 | -8.0 | 0.00014 / 0.02585 | 2770.1 | 254 | 5, 10, 12, 27, 33 |
| university | 101.05 | -20.0 (-20.0) | -13.7 | -7.6 | 8e-05 / 0.02363 | 3085.4 | 250 | 5, 12, 34, 109 |
| uptown | 91.43 | -20.0 (-20.0) | -15.1 | -7.3 | 0.00099 / 0.02583 | 2857.2 | 256 | 1, 25, 27, 33, 47 |
| waterfront | 96.00 | -20.0 (-20.0) | -14.2 | -7.4 | 0.0005 / 0.02824 | 3013.8 | 257 | 5, 13, 33, 47 |
| city_theme | 26.52 | -18.0 (-18.0) | -11.9 | -6.0 |  | 828.8 | 256 | 5, 9, 12, 13, 25, 33, 50, 109 |
| megaslice_rep | 4.77 | -18.0 (-18.0) | -14.8 | -7.3 |  | 150.3 | 258 | 5, 12, 33 |
| megaslice_rep_dock | 5.24 | -18.0 (-18.0) | -14.7 | -8.3 |  | 164.8 | 258 | 5, 12, 33, 90 |
| recipe | 9.82 | -21.0 (-21.0) | -18.0 | -9.6 |  | 273.5 | 228 | 25 |
| reunion | 16.82 | -23.0 (-23.0) | -18.7 | -8.9 |  | 449.9 | 219 | 12, 25, 90 |
| triumph_downtown | 6.61 | -18.0 (-18.0) | -13.2 | -7.3 |  | 208.8 | 259 | 5, 9, 12, 25, 33, 50 |
| triumph_industrial | 9.56 | -18.0 (-18.0) | -12.7 | -6.7 |  | 299.9 | 257 | 5, 9, 12, 33, 50 |
| triumph_suburbs | 8.41 | -18.0 (-18.0) | -12.9 | -7.0 |  | 260.5 | 254 | 5, 9, 12, 33, 50 |
| triumph_university | 10.41 | -18.0 (-18.0) | -13.0 | -6.9 |  | 307.8 | 242 | 5, 9, 12, 33, 50, 109 |
| triumph_uptown | 8.70 | -18.0 (-18.0) | -12.1 | -6.6 |  | 269.1 | 254 | 5, 9, 12, 25, 33, 50 |
| triumph_waterfront | 10.54 | -18.0 (-18.0) | -12.8 | -6.6 |  | 322.4 | 251 | 5, 9, 12, 13, 15, 33, 50 |
| victor_exit | 3.19 | -16.0 (-16.0) | -12.1 | -6.5 |  | 93.9 | 241 | 12, 33 |

## Stingers (73)

| Cue | Seconds | LUFS (tier) | Momentary max | Peak dBFS | KB | kbps (measured) | GM programs |
|---|---|---|---|---|---|---|---|
| sting_downtown_bottleneck | 2.24 | -22.0 (-22) | -20.0 | -9.1 | 25.6 | 94 | 9, 25, 90 |
| sting_downtown_build | 6.06 | -17.3 (-17) | -14.7 | -6.0 | 121.6 | 164 | 5, 9, 25, 33, 90 |
| sting_downtown_drone | 3.64 | -20.0 (-20) | -16.8 | -6.6 | 52.7 | 119 | 5, 9, 25, 47 |
| sting_downtown_fleet | 3.40 | -20.0 (-20) | -17.5 | -7.6 | 49.1 | 118 | 5, 9, 13, 25, 90 |
| sting_downtown_manager | 6.15 | -17.3 (-17) | -14.5 | -6.0 | 115.8 | 154 | 5, 9, 25, 33, 90 |
| sting_downtown_milestone | 5.95 | -19.0 (-19) | -15.0 | -6.0 | 98.1 | 135 | 5, 9, 25 |
| sting_downtown_milestone_big | 6.13 | -16.7 (-16) | -14.1 | -6.0 | 123.0 | 164 | 5, 9, 12, 25, 33, 90 |
| sting_downtown_offline | 2.47 | -22.0 (-22) | -19.2 | -10.4 | 30.2 | 100 | 5, 9 |
| sting_downtown_perk | 2.56 | -20.0 (-20) | -16.7 | -7.3 | 36.4 | 117 | 5, 9, 90 |
| sting_downtown_upgrade | 3.26 | -20.0 (-20) | -16.8 | -8.0 | 46.7 | 117 | 5, 9, 25, 90 |
| sting_downtown_warmth | 5.93 | -20.0 (-20) | -16.1 | -6.5 | 85.2 | 118 | 5, 9, 25 |
| sting_downtown_welcome | 3.89 | -19.0 (-19) | -14.9 | -6.0 | 58.9 | 124 | 5, 9, 25, 90 |
| sting_industrial_bottleneck | 3.80 | -22.0 (-22) | -18.5 | -8.6 | 47.5 | 102 | 9, 12, 90 |
| sting_industrial_build | 7.11 | -17.4 (-17) | -15.0 | -6.0 | 145.4 | 168 | 5, 9, 12, 33, 90 |
| sting_industrial_drone | 5.97 | -20.0 (-20) | -14.9 | -6.1 | 85.9 | 118 | 5, 9, 12, 47, 90 |
| sting_industrial_fleet | 5.95 | -20.0 (-20) | -15.6 | -6.0 | 85.2 | 117 | 5, 9, 12, 13, 90 |
| sting_industrial_manager | 7.17 | -17.3 (-17) | -15.0 | -6.0 | 126.2 | 144 | 5, 9, 12, 33, 90 |
| sting_industrial_milestone | 7.24 | -19.1 (-19) | -15.6 | -6.0 | 114.1 | 129 | 5, 9, 12, 90 |
| sting_industrial_milestone_big | 7.26 | -16.6 (-16) | -14.3 | -6.0 | 136.1 | 154 | 5, 9, 12, 33, 90 |
| sting_industrial_offline | 4.10 | -22.0 (-22) | -18.6 | -8.7 | 50.9 | 102 | 5, 9, 90 |
| sting_industrial_perk | 3.93 | -20.0 (-20) | -16.9 | -8.0 | 53.2 | 111 | 5, 9 |
| sting_industrial_upgrade | 5.94 | -20.0 (-20) | -16.1 | -6.0 | 85.8 | 118 | 5, 9, 12, 90 |
| sting_industrial_warmth | 7.30 | -20.0 (-20) | -15.8 | -6.0 | 102.4 | 115 | 5, 9, 12, 90 |
| sting_industrial_welcome | 6.55 | -19.2 (-19) | -14.2 | -6.0 | 97.0 | 121 | 5, 9, 12, 90 |
| sting_suburbs_bottleneck | 3.50 | -22.0 (-22) | -19.0 | -9.2 | 44.2 | 103 | 9, 12, 90 |
| sting_suburbs_build | 6.21 | -17.2 (-17) | -15.0 | -6.0 | 118.9 | 157 | 5, 9, 12, 33, 90 |
| sting_suburbs_drone | 5.33 | -20.0 (-20) | -15.4 | -6.5 | 80.9 | 124 | 5, 9, 12, 47, 90 |
| sting_suburbs_fleet | 4.46 | -20.0 (-20) | -16.6 | -6.4 | 65.4 | 120 | 5, 9, 12, 13, 90 |
| sting_suburbs_manager | 6.29 | -17.2 (-17) | -15.0 | -6.0 | 108.6 | 141 | 5, 9, 12, 33, 90 |
| sting_suburbs_milestone | 6.38 | -19.1 (-19) | -15.3 | -6.0 | 102.0 | 131 | 5, 9, 12, 90 |
| sting_suburbs_milestone_big | 6.61 | -16.5 (-16) | -14.6 | -6.0 | 122.3 | 152 | 5, 9, 12, 33, 90 |
| sting_suburbs_offline | 2.98 | -22.0 (-22) | -20.2 | -10.6 | 37.2 | 102 | 5, 9, 90 |
| sting_suburbs_perk | 3.46 | -20.0 (-20) | -17.0 | -7.9 | 48.9 | 116 | 5, 9 |
| sting_suburbs_upgrade | 4.20 | -20.0 (-20) | -16.8 | -7.0 | 62.0 | 121 | 5, 9, 12, 90 |
| sting_suburbs_warmth | 6.00 | -20.0 (-20) | -16.1 | -6.0 | 84.0 | 115 | 5, 9, 12, 90 |
| sting_suburbs_welcome | 4.52 | -19.0 (-19) | -14.8 | -6.0 | 67.1 | 122 | 5, 9, 12, 90 |
| sting_university_bottleneck | 3.75 | -22.1 (-22) | -18.7 | -6.0 | 51.0 | 111 | 9, 90, 109 |
| sting_university_build | 6.83 | -17.4 (-17) | -15.1 | -6.0 | 135.5 | 163 | 5, 9, 33, 90, 109 |
| sting_university_drone | 6.16 | -20.1 (-20) | -15.3 | -6.0 | 96.8 | 129 | 5, 9, 47, 90, 109 |
| sting_university_fleet | 5.59 | -20.2 (-20) | -16.1 | -6.0 | 87.4 | 128 | 5, 9, 13, 90, 109 |
| sting_university_manager | 7.00 | -17.1 (-17) | -15.1 | -6.0 | 116.2 | 136 | 5, 9, 33, 90, 109 |
| sting_university_milestone | 7.19 | -19.0 (-19) | -15.5 | -6.0 | 120.6 | 137 | 5, 9, 90, 109 |
| sting_university_milestone_big | 7.10 | -16.6 (-16) | -14.1 | -6.0 | 127.7 | 147 | 5, 9, 12, 33, 90, 109 |
| sting_university_offline | 3.08 | -22.0 (-22) | -20.5 | -10.7 | 38.2 | 102 | 5, 9, 90 |
| sting_university_perk | 3.99 | -20.0 (-20) | -16.7 | -7.2 | 58.3 | 120 | 5, 9, 90 |
| sting_university_upgrade | 4.38 | -20.0 (-20) | -16.0 | -6.4 | 69.3 | 130 | 5, 9, 90, 109 |
| sting_university_warmth | 6.59 | -20.0 (-20) | -16.3 | -6.0 | 99.8 | 124 | 5, 9, 90, 109 |
| sting_university_welcome | 5.11 | -19.0 (-19) | -14.9 | -6.0 | 82.5 | 132 | 5, 9, 90, 109 |
| sting_uptown_bottleneck | 3.57 | -22.0 (-22) | -19.1 | -7.8 | 46.7 | 107 | 9, 25, 90 |
| sting_uptown_build | 6.51 | -17.4 (-17) | -14.6 | -6.0 | 132.6 | 167 | 5, 9, 25, 33, 90 |
| sting_uptown_drone | 5.37 | -20.0 (-20) | -16.0 | -6.8 | 77.5 | 118 | 5, 9, 25, 47, 90 |
| sting_uptown_fleet | 5.44 | -20.0 (-20) | -15.1 | -6.4 | 79.1 | 119 | 5, 9, 13, 25, 90 |
| sting_uptown_manager | 6.66 | -17.3 (-17) | -14.5 | -6.0 | 114.4 | 141 | 5, 9, 25, 33, 90 |
| sting_uptown_milestone | 6.40 | -19.0 (-19) | -15.3 | -6.0 | 104.5 | 134 | 5, 9, 25 |
| sting_uptown_milestone_big | 6.49 | -16.8 (-16) | -14.2 | -6.0 | 125.4 | 158 | 5, 9, 12, 25, 33, 90 |
| sting_uptown_offline | 3.87 | -22.0 (-22) | -19.0 | -9.8 | 50.4 | 107 | 5, 9, 90 |
| sting_uptown_perk | 3.63 | -20.0 (-20) | -16.9 | -8.0 | 51.9 | 117 | 5, 9, 90 |
| sting_uptown_upgrade | 5.30 | -20.0 (-20) | -15.7 | -6.3 | 79.1 | 122 | 5, 9, 25, 90 |
| sting_uptown_warmth | 6.37 | -20.0 (-20) | -15.4 | -6.1 | 91.6 | 118 | 5, 9, 25 |
| sting_uptown_welcome | 6.07 | -19.0 (-19) | -14.2 | -6.0 | 90.2 | 122 | 5, 9, 25, 90 |
| sting_waterfront_bid | 3.07 | -18.1 (-18) | -14.1 | -6.0 | 42.8 | 114 | 5, 12, 33 |
| sting_waterfront_bottleneck | 3.63 | -22.0 (-22) | -18.5 | -7.7 | 45.5 | 103 | 9, 13, 90 |
| sting_waterfront_build | 6.55 | -17.3 (-17) | -15.3 | -6.0 | 131.2 | 164 | 5, 9, 13, 33, 90 |
| sting_waterfront_drone | 5.64 | -20.1 (-20) | -15.7 | -6.0 | 83.6 | 121 | 5, 9, 13, 47, 90 |
| sting_waterfront_fleet | 5.37 | -20.0 (-20) | -16.6 | -6.0 | 78.5 | 120 | 5, 9, 13, 90 |
| sting_waterfront_manager | 6.73 | -17.2 (-17) | -15.3 | -6.0 | 112.9 | 137 | 5, 9, 13, 33, 90 |
| sting_waterfront_milestone | 6.86 | -19.1 (-19) | -15.8 | -6.0 | 110.4 | 132 | 5, 9, 13, 90 |
| sting_waterfront_milestone_big | 6.99 | -16.5 (-16) | -14.7 | -6.0 | 130.3 | 153 | 5, 9, 12, 13, 33, 90 |
| sting_waterfront_offline | 3.56 | -22.0 (-22) | -19.4 | -9.5 | 43.7 | 101 | 5, 9, 90 |
| sting_waterfront_perk | 3.82 | -20.0 (-20) | -16.6 | -7.6 | 55.3 | 118 | 5, 9, 90 |
| sting_waterfront_upgrade | 4.02 | -20.0 (-20) | -16.8 | -6.4 | 58.8 | 120 | 5, 9, 13 |
| sting_waterfront_warmth | 6.93 | -20.0 (-20) | -15.5 | -6.0 | 98.4 | 116 | 5, 9, 13, 90 |
| sting_waterfront_welcome | 4.02 | -19.0 (-19) | -15.2 | -6.3 | 58.8 | 120 | 5, 9, 13 |

## Loudness hierarchy per neighbourhood

Each cell is integrated / momentary max (400 ms window) in LUFS. The build stops if `milestone_big` > `manager` >= `build` > `milestone` > `upgrade` > `bottleneck` fails on either (`build.hierarchy_errors`); it passed.

| Neighbourhood | milestone_big (tier -16) | manager (tier -17) | build (tier -17) | milestone (tier -19) | upgrade (tier -20) | bottleneck (tier -22) |
|---|---|---|---|---|---|---|
| downtown | -16.7 / -14.1 | -17.3 / -14.5 | -17.3 / -14.7 | -19.0 / -15.0 | -20.0 / -16.8 | -22.0 / -20.0 |
| suburbs | -16.5 / -14.6 | -17.2 / -15.0 | -17.2 / -15.0 | -19.1 / -15.3 | -20.0 / -16.8 | -22.0 / -19.0 |
| waterfront | -16.5 / -14.7 | -17.2 / -15.3 | -17.3 / -15.3 | -19.1 / -15.8 | -20.0 / -16.8 | -22.0 / -18.5 |
| university | -16.6 / -14.1 | -17.1 / -15.1 | -17.4 / -15.1 | -19.0 / -15.5 | -20.0 / -16.0 | -22.1 / -18.7 |
| industrial | -16.6 / -14.3 | -17.3 / -15.0 | -17.4 / -15.0 | -19.1 / -15.6 | -20.0 / -16.1 | -22.0 / -18.5 |
| uptown | -16.8 / -14.2 | -17.3 / -14.5 | -17.4 / -14.6 | -19.0 / -15.3 | -20.0 / -15.7 | -22.0 / -19.1 |

The gaps between neighbours, in LU (the smallest strict gap is 0.3):

| Neighbourhood | measure | milestone_big over manager | manager over build | build over milestone | milestone over upgrade | upgrade over bottleneck |
|---|---|---|---|---|---|---|
| downtown | integrated | 0.6 | 0.0 | 1.7 | 1.0 | 2.0 |
| downtown | momentary max | 0.4 | 0.2 | 0.3 | 1.8 | 3.2 |
| suburbs | integrated | 0.7 | 0.0 | 1.9 | 0.9 | 2.0 |
| suburbs | momentary max | 0.4 | 0.0 | 0.3 | 1.5 | 2.2 |
| waterfront | integrated | 0.7 | 0.1 | 1.8 | 0.9 | 2.0 |
| waterfront | momentary max | 0.6 | 0.0 | 0.5 | 1.0 | 1.7 |
| university | integrated | 0.5 | 0.3 | 1.6 | 1.0 | 2.1 |
| university | momentary max | 1.0 | 0.0 | 0.4 | 0.5 | 2.7 |
| industrial | integrated | 0.7 | 0.1 | 1.7 | 0.9 | 2.0 |
| industrial | momentary max | 0.7 | 0.0 | 0.6 | 0.5 | 2.4 |
| uptown | integrated | 0.5 | 0.1 | 1.6 | 1.0 | 2.0 |
| uptown | momentary max | 0.3 | 0.1 | 0.7 | 0.4 | 3.4 |

## Sound-effect tiers beside the stinger tiers

| Tier (LUFS) | Sound effects (files, measured range) | Stingers |
|---|---|---|
| -16 | 2 files (-18.3 to -16.1): build, collect | 6: milestone_big |
| -17 |  | 12: build, manager |
| -17.5 | 1 files (-17.5 to -17.5): collect |  |
| -18 | 1 files (-21.8 to -21.8): gavel | 1: bid |
| -19 | 9 files (-21.9 to -19.0): collect, expand, fleet, grade, milestone | 12: milestone, welcome |
| -20 |  | 30: drone, fleet, perk, upgrade, warmth |
| -22 | 14 files (-22.0 to -22.0): buy, refused, rush | 12: bottleneck, offline |
| -24 | 1 files (-24.0 to -24.0): sparkle |  |
| -28 | 11 files (-28.0 to -28.0): cash, full, tap |  |
| -32 | 4 files (-32.0 to -32.0): bubble, click |  |

## Total

Music 22.05 MB, stingers 5.95 MB, story 3.54 MB, sfx 0.17 MB (MB = MiB). Files: 33,249,842 bytes (31.71 MB) of the 32 MB cap (33,554,432 B); margin 304,590 bytes (0.29 MB).  `du -sb assets/audio` prints 33249842.

## Fix pass (review R2, notes AU79 to AU90)

Nobody has listened to any of this. Numbers are from `tools/audio/build/report.json` of the full build after the pass, from `audit.py`, and from `/tmp`-style stem renders of the stingers (the lead tracks and everything else rendered apart, mastered with `post.lofi_sting` and no normalisation).

| Note | What was done | What was measured |
|---|---|---|
| AU85 | `arrival_chord` voices the triumph and city-theme arrival as a 6/9 (3 5 6 9 rootless, G3..Bb4) over the tonic bass, where it was a maj9 whose major seventh sat a semitone under the held tonic of the lead; the walk's last chord and the waterfront ship's-bell opener use 6/9 too. `story_cue` now runs `clash_scan` on every lead note against the build's chords and a direct check against the arrival's pitched notes (Rhodes, strings, vibraphone, bell). | 7 story cues pass. As a check that the test bites, the same code with the old maj9 stops the build on triumph_suburbs: `(8.0, 67, 66, 0, '6/9 arrival')`. |
| AU86 | `tag_voicing` is a 6/9 (dom13 where the loop's tonic chord is a dominant: Waterfront, Industrial). `stingers` checks every lead, bell and celesta note of a beat or more against the tag chord, skipping notes that double a chord tone. | 73 stingers pass. With dom9 the check stopped Industrial (`(3.0, 66, 67)`: the held sixth, F#, a semitone under the dominant's seventh G); dom13 carries the sixth as its own 13th, so Industrial and Waterfront use it. |
| AU87 | `megaslice_rep` and `_dock` play at `HQ_BPM` (76, the HQ loop's constant now shared) and swing 0.58, in 6 beats instead of 9: the motif up to its held sixth, then the unresolved dim7 chord on beat 3.5 with the bass landing on its tritone; the falling answer and the Fm9 are gone because they do not fit 0.5 s of the old length at this tempo. The dock's pedal pad lets go 1.2 beats before the chord so the file ends where the old one did. | 4.77 s and 5.24 s (4.89 and 5.06 before the rewrite, 4.56 and 5.03 before this pass), both under 5.5 s. |
| AU88 | `LEAD_TRIM_DB`: the lead track of Downtown's and Uptown's `fleet` and `upgrade` stingers is 1.5 dB lower (CC7 value 73 instead of 80). | Lead minus bed: downtown_fleet -0.2 to -1.5, uptown_fleet -0.1 to -1.5, downtown_upgrade -0.6 to -2.2, uptown_upgrade -1.0 to -2.4. Over all 73 stingers, by kind (min to max): milestone -9.8 to -3.8, milestone_big -17.9 to -5.6, manager -20.4 to -8.6, upgrade -7.8 to -2.2, fleet -4.9 to -1.3, drone -6.8 to -1.9, welcome -7.5 to -1.5, warmth -8.8 to -2.5, build -10.8 to -5.0. `bottleneck` (0.1 to 6.5), `perk` (-8.1 to -5.7) and `offline` (-1.2 to +1.0) have only a bell or a Rhodes chord under the lead, so the figure does not apply to them in the way it does to the rest. |
| AU89 | The gaps in the hierarchy are wider; see the table above and the paragraph below. Manager and build only: pad velocity, bass velocities and the velocity of the Rhodes chord on the arrival (`ARRIVE_RH`) were searched again (`FULL_PAD_HOOD`, `BASS_HOOD`, `ARRIVE_RH`); `milestone_big` was not touched. | Smallest strict gap in the table: 0.3 LU (it was 0.1 before the pass; with the 6/9 tag and the old settings Suburbs' build fell 0.2 under its milestone on momentary max and the build stopped). `manager` over `build` is 0.0 to 0.3, which the rule allows. |
| AU90 | `docs/AUDIO.md` states the measured bitrates instead of a flat 256. | loops 233 to 257 kbps, story 219 to 259, stingers 94 to 168. |
| AU79 | University's tail arpeggio is one kalimba note a beat (it was two) on its own track `kalimba tail`, which is not in `leads=`, velocity 34 or under. | 16 notes, velocities 21 to 34. |
| AU80 | University's half-speed Rhodes motif is on its own track `rhodes motif`, named in `leads=`, capped at 50 by `lead_cap`; its clash check follows it. | 10 notes, maximum velocity 50. `audit.py university`: leads kalimba, vibraphone and rhodes motif -44.3 LUFS, bed -41.7, **-2.6 LU** (-3.0 before). |
| AU81 | The HQ pizzicato doubling is dropped in bars 1-2, 4, 9-10 and 12. | Pizzicato notes now fall in bars 0, 3, 5-8, 11 and 13-16 only. `audit.py megaslice_hq`: -40.5 against -37.3, **-3.1 LU**. |
| AU83 | Not changed in code: recorded in `docs/AUDIO.md` as deviations from the R1 default D4 ("off-beat eighths 8-12 ms late" in Downtown, kit "12-18 ms behind" everywhere) that Julien has not yet agreed to: Downtown has no off-beat delay (its lilt is in the brush ride), University's kit is 15 to 21 ms late and its kick 10 ms further. | None new. |
| AU84 | `docs/AUDIO.md`: "jazz waltz" is now "slow 6/8 jazz lilt", "payoff crash" is "payoff", the stinger text says 6/9 and dom13, the rep rows, the arrival chord, the totals table and the hierarchy line are current, the brush kit is "GM kit 41 (program 40 in `compose.py`)" so every GM number in the file is 1-based. | |

`audit.py` itself had a bug that made it stop on every loop since card M2b (it evaluated the `leads=` argument of `story_cue`'s `jazz_finish` call, which is computed, for every function in `compose.py`); it now reads only the loop's own function.

**The hierarchy and the room between the big and the small.** On momentary max the gap between `milestone_big` and `milestone` is only 0.6 to 1.4 LU in the five other neighbourhoods and 0.9 in Downtown, and `manager` and `build` have to fit between them with a gap to each, so two gaps of 0.5 LU do not fit in Downtown, Suburbs, Industrial or Uptown; the search put the manager and the build as far from both neighbours as the room allows. The levers that moved momentary max: the bass velocity (a softer arrival bass lowers it by up to 1.5 LU, because the limiter works less), the pad velocity, and the velocity of the Rhodes chord struck on the arrival, which has a minimum of momentary max near its old value (a softer chord raised it, a louder one raised it as well). The brush swirl's top velocity (60 to 40) did not move either measure and was dropped. Raising `milestone_big` is the other way to widen the gaps; the note ruled it out, so it was not tried. Suburbs' and Industrial's `milestone` have a louder afterglow pad (`RING_VEL` 64) that lowers its momentary max by 0.1 to 0.5 LU, held to the old file length by a shorter ring (`STING_RING`), 6.38 s and 7.24 s against 6.32 and 7.47 before the rewrite.

**Size.** The total grew by 9,184 bytes over the pass (33,240,658 to 33,249,842); the margin under 32 MB is 304,590 bytes. Grew: university (+8 KB: two more tracks), megaslice_hq (+8 KB), megaslice_rep and megaslice_rep_dock (+5 KB each, the stings now sit at the HQ's swing and tempo). Fell: suburbs_milestone and industrial_milestone (-1 to -2 KB each), the stingers as a group by 0.02 MB.
