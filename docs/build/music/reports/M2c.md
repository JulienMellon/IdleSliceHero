# M2c measures: the whole score (R2)

Bank C (`MuseScore_General_Full.sf3`). Nobody has listened to any of this. Numbers come from `tools/audio/build/report.json` of the full build (`python3 build.py`); LUFS is integrated loudness of the file as encoded (measured on the 32-bit float master that went into the encoder), peak is its sample peak. GM programs are 1-based, every pitched track of the cue (the kit is GM kit 40, brushes, in every cue that has one).

## What changed (steps 1 to 7)

| Cue | Seconds before / after | Tier | Front instruments (GM, 1-based) | What it is |
|---|---|---|---|---|
| megaslice_rep | 4.89 / 4.56 | -18 LUFS | dark Rhodes 5 (motif), Rhodes 5 (comp), vibraphone 12, upright bass 33, brush kit (GM kit 40) | 120 bpm, C minor, 9 beats. The HQ loop's motif (`5, 1 b3 b5 b6 5`) then its falling answer; bass climbs C2 Eb2 F2 Gb2 G2 Gb2 and holds Gb2; chords Cm(maj7), Fm9, then C#dim7 (over Gb2 that is F#7b9, the tritone substitute) held to beat 9 with no resolution. Side stick on 2 and 4 at velocity 28 before humanising. No brass, no glissando. |
| megaslice_rep_dock | 5.06 / 5.03 | -18 LUFS | the same plus warm pad 90 | The same in D minor over the held A (pad A2 and A3); the last chord is G#dim7 over A2, which is A7b9 and leaves the bid's A hanging. |
| victor_exit | 3.48 / 3.19 | -16 LUFS | vibraphone 12, upright bass 33 | A vibraphone run falls from C5 to C4 in eighths (velocity 62 down to 41); the upright bass plays D2 and a pitch bend of two semitones takes it down to C2, held (measured on the rendered bass alone: fundamental 73.3 Hz at the attack, 69.6 Hz in the bend, 65.4 Hz from 0.6 s on). Now mastered through `story_master` (it was peak-limited 0.5 LU under tier without it). |
| recipe | 9.94 / 9.82 | -21 LUFS | nylon guitar 25 | Solo, rubato (the old held breath after every long note, 0.45 beat now), the motif then its closing phrase one octave down from the old line (C3 to D4), a strummed F chord to end. Reverb send 90 (half of it survives `jazz_finish`) so the tail lasts the old length. No swing, no kit. |
| reunion | 16.93 / 16.82 | -23 LUFS | nylon guitar 25, vibraphone 12 (velocity 50 or under; measured 35 to 50), warm pad 90 | The nylon guitar states the motif at 60 bpm, the vibraphone answers with the closing phrase where the sax did, then both play both phrases over the pad. |

`palette.check` runs on every cue now: `compose.py` reports 153 cues checked (stems included), 0 errors, and `JAZZ` is gone. The `GM` table lost accordion, tango accordion, organ, trumpet, trombone, tuba, muted trumpet, horn, brass, tenor sax, bassoon, clarinet, whistle, square lead and fiddle, so none of them can come back by accident (`HOODS` still named three of them in a `lead` field nothing reads; it now names the neighbourhood's real front instrument). `grep -c "accordion|trumpet|tuba|trombone|sax|clarinet|bassoon|fiddle|square" compose.py` prints 4; all four are words in docstrings or comments (the notes that the guitar replaced the accordion, "no fiddle, no accordion", the clarinet's chromatic notes, the sax in reunion's docstring), none is a track.

Every story cue stays within 0.5 s of its old length. Against the last commit's `src/audio/manifest.ts` only `seconds` changed, in 23 of 93 rows (the 18 full-band stingers and the 5 story cues); the largest change is -0.46 s (`industrial_build`), and no `payoffSeconds`, `downbeatSeconds`, `musicSeconds`, tempo or `barRoots` moved.

## The loudness hierarchy (step 6)
`build.py` now stops when, in any neighbourhood, `milestone_big` > `manager` >= `build` > `milestone` > `upgrade` > `bottleneck` fails on integrated loudness or on momentary max (`post.momentary_max`, BS.1770 K-weighting, 400 ms window, 100 ms hop), naming both cues and both numbers. It also checks loops and story cues against their tiers now (it checked stingers and effects only). On the R2 stingers as they came out of card M2a it failed in at least ten places in five neighbourhoods or more: `milestone_big` was not above `manager` on momentary max (Downtown, Waterfront, Uptown) and `manager` was below `build` (Suburbs, Waterfront, University, Industrial; integrated and momentary max). The cause: the three full-band kinds peak on the upright bass and the first and arrival hits at +20 dB of gain, the -6 dBFS limiter takes 5 dB off those peaks, and they all land at about -17.5 LUFS whatever the tier says.

What was changed (arrangement, not the tier table): the warm pad under the three full-band kinds is louder and has an expression fade over its last beat so it does not lengthen the file (`FULL_PAD`, `PAD_FADE`); `milestone_big`'s pad swells in toward the arrival (`PAD_SWELL`); its arrival celesta octave is now the helper `arrival_bell`; the upright bass's velocity on the first beat and on the arrival is set per neighbourhood and kind, a lower bass velocity making the file louder because the limiter then works less (`BASS_HOOD`). Per neighbourhood the pad and bass settings come from building five pad levels times three bass levels for the three kinds, and taking the combination that puts them in order with the widest gaps and the least distance from the tiers; the search is not in the repo, the result is the two tables `FULL_PAD_HOOD` and `BASS_HOOD`. Three things I tried and removed: a string swell under the arrival of `milestone_big` and `manager` (removing it from the manager raised its integrated and momentary max both, Industrial -17.34 / -14.93 to -17.26 / -14.56), a celesta octave on the manager's arrival (no change at 0.1 LU) and a mallet swell on the manager (no change). `milestone_big`'s existing mallet swell stem measures -68 LUFS against -38 for the lead and the bass, so it is inaudible; I left it in.

Result: all five kinds in order in all six neighbourhoods, but the gaps are small: `milestone_big` is 0.3 to 0.6 LU over `manager` on integrated and 0.1 to 0.8 on momentary max (Downtown 0.3, Suburbs 0.2, Waterfront 0.6, University 0.8, Industrial 0.3, Uptown 0.1); `manager` equals `build` at the table's 0.1 LU in University (-17.1 integrated and -15.1 momentary max on both) and on Waterfront's momentary max (-15.4 on both); `build` is 0.1 above `milestone` on momentary max in Waterfront and University. These pass the build's check at its 0.1 LU resolution but a small change in the chart can flip them: the build will say so. `milestone_big` still lands 0.5 to 0.9 LU under its -16 tier (the -6 dBFS ceiling), and `manager` and `build` 0.1 to 0.4 under -17.

## Encoding (R2 notes)
Music, stingers and story cues are encoded as AAC at 256 kbps (loops were 128, stingers 64, story 96); sound effects stay at 64 kbps mono and 16-bit input, and `git status --short assets/audio/sfx` prints nothing after the build. The audio goes into the encoder as 32-bit float (it was 16-bit PCM); the renderer's output was already 32-bit float and every stage in `post.py` runs in 64-bit float, so no 16-bit step is left before the encoder for the score. The 32-bit float masters, as they went into the encoder, are kept as WAVs under `tools/audio/build/master/{music,sting,story}/` (not in git). `ffmpeg`'s AAC encoder lands at 219 to 261 kbps for the stereo files and 93 to 171 kbps for the mono stingers at the 256 kbps setting: it does not spend bits on content that the 7 kHz roll-off removed.

## Reels
`python3 tools/audio/reel.py R2` builds `tools/audio/build/reel/R2.mp3` (304.1 s, 15 tracks, 320 kbps MP3, -16.0 LUFS, peak -2.1 dBFS) and `python3 tools/audio/reel.py FULL` builds `build/reel/FULL.mp3` (1302.3 s = 21:42, 93 tracks, 320 kbps MP3, -16.0 LUFS, peak -3.8 dBFS, 52 MB) with `FULL.txt`, the track list with start times. FULL has every music, sting and story cue whole, cut from the 32-bit float masters, in cue-sheet order: the seven neighbourhood loops, welcome and warmth per neighbourhood, megaslice_hq, the two rep stings, the six triumphs (the Dock Saved bell last), recipe, reunion, victor_exit, city_theme, perk, offline, then the gameplay stingers by kind (bottleneck, milestone, milestone_big, manager, upgrade, fleet, drone, build, all six neighbourhoods each) and the bid. One static gain for the whole reel (+2.2 dB), no per-cue matching. Nobody has listened to either.

## Loops, story cues

| Cue | Seconds | LUFS (tier) | Momentary max | Peak dBFS | Seam step / 99th pct | KB | kbps | GM programs |
|---|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 (-20.0) | -14.6 | -7.4 | 0.00369 / 0.02357 | 2941.9 | 256 | 5, 25, 33, 90 |
| downtown_sparse | 94.55 | -22.0 (-22.0) | -17.0 | -10.9 | 0.00043 / 0.01293 | 2691.0 | 256 | 5, 25 |
| industrial | 113.68 | -20.0 (-20.0) | -14.4 | -7.5 | 0.00515 / 0.02937 | 3551.1 | 256 | 5, 12, 28, 33, 74, 90 |
| megaslice_hq | 53.68 | -19.0 (-19.0) | -14.8 | -6.9 | 0.00233 / 0.02273 | 1660.8 | 256 | 5, 33, 46 |
| suburbs | 89.30 | -20.0 (-20.0) | -14.2 | -8.0 | 0.00014 / 0.02585 | 2770.1 | 256 | 5, 10, 12, 27, 33 |
| university | 101.05 | -20.0 (-20.0) | -14.5 | -7.6 | 0.00065 / 0.024 | 3077.5 | 256 | 5, 12, 34, 109 |
| uptown | 91.43 | -20.0 (-20.0) | -15.1 | -7.3 | 0.00099 / 0.02583 | 2857.2 | 256 | 1, 25, 27, 33, 47 |
| waterfront | 96.00 | -20.0 (-20.0) | -14.2 | -7.4 | 0.0005 / 0.02824 | 3013.8 | 256 | 5, 13, 33, 47 |
| city_theme | 26.52 | -18.0 (-18.0) | -11.9 | -6.0 |  | 828.6 | 256 | 5, 9, 12, 13, 25, 33, 50, 109 |
| megaslice_rep | 4.56 | -18.0 (-18.0) | -16.0 | -8.3 |  | 145.5 | 256 | 5, 12, 33 |
| megaslice_rep_dock | 5.03 | -18.0 (-18.0) | -15.7 | -8.4 |  | 159.7 | 256 | 5, 12, 33, 90 |
| recipe | 9.82 | -21.0 (-21.0) | -18.0 | -9.6 |  | 273.5 | 256 | 25 |
| reunion | 16.82 | -23.0 (-23.0) | -18.7 | -8.9 |  | 449.9 | 256 | 12, 25, 90 |
| triumph_downtown | 6.61 | -18.0 (-18.0) | -13.1 | -7.3 |  | 208.9 | 256 | 5, 9, 12, 25, 33, 50 |
| triumph_industrial | 9.56 | -18.0 (-18.0) | -12.6 | -6.7 |  | 298.0 | 256 | 5, 9, 12, 33, 50 |
| triumph_suburbs | 8.42 | -18.0 (-18.0) | -13.0 | -6.8 |  | 260.1 | 256 | 5, 9, 12, 33, 50 |
| triumph_university | 10.40 | -18.0 (-18.0) | -13.0 | -7.1 |  | 307.4 | 256 | 5, 9, 12, 33, 50, 109 |
| triumph_uptown | 8.68 | -18.0 (-18.0) | -12.1 | -6.6 |  | 267.2 | 256 | 5, 9, 12, 25, 33, 50 |
| triumph_waterfront | 10.54 | -18.0 (-18.0) | -12.8 | -6.6 |  | 323.7 | 256 | 5, 9, 12, 13, 15, 33, 50 |
| victor_exit | 3.19 | -16.0 (-16.0) | -12.1 | -6.5 |  | 93.9 | 256 | 12, 33 |

## Stingers (73)

| Cue | Seconds | LUFS (tier) | Momentary max | Peak dBFS | KB | GM programs |
|---|---|---|---|---|---|---|
| sting_downtown_bottleneck | 2.26 | -22.0 (-22) | -20.0 | -9.2 | 25.8 | 25, 90 |
| sting_downtown_build | 6.11 | -17.4 (-17) | -14.6 | -6.0 | 119.2 | 5, 25, 33, 90 |
| sting_downtown_drone | 3.55 | -20.0 (-20) | -16.8 | -6.7 | 51.7 | 5, 25, 47 |
| sting_downtown_fleet | 3.43 | -20.0 (-20) | -17.1 | -7.4 | 49.5 | 5, 13, 25, 90 |
| sting_downtown_manager | 6.22 | -17.3 (-17) | -14.4 | -6.0 | 114.5 | 5, 25, 33, 90 |
| sting_downtown_milestone | 5.95 | -19.1 (-19) | -15.0 | -6.0 | 97.0 | 5, 25 |
| sting_downtown_milestone_big | 6.15 | -16.7 (-16) | -14.1 | -6.0 | 124.7 | 5, 12, 25, 33, 90 |
| sting_downtown_offline | 2.47 | -22.0 (-22) | -19.1 | -10.5 | 30.1 | 5, 9 |
| sting_downtown_perk | 2.56 | -20.0 (-20) | -16.6 | -7.4 | 36.7 | 5, 9, 90 |
| sting_downtown_upgrade | 3.28 | -20.0 (-20) | -16.6 | -8.1 | 47.4 | 5, 25, 90 |
| sting_downtown_warmth | 5.93 | -20.0 (-20) | -16.1 | -6.1 | 84.5 | 5, 25 |
| sting_downtown_welcome | 3.92 | -19.0 (-19) | -14.7 | -6.0 | 59.0 | 5, 25, 90 |
| sting_industrial_bottleneck | 3.79 | -22.0 (-22) | -18.5 | -8.6 | 47.7 | 12, 90 |
| sting_industrial_build | 7.09 | -17.4 (-17) | -14.8 | -6.0 | 144.2 | 5, 12, 33, 90 |
| sting_industrial_drone | 5.84 | -20.0 (-20) | -15.2 | -6.2 | 83.9 | 5, 12, 47, 90 |
| sting_industrial_fleet | 6.04 | -20.0 (-20) | -15.6 | -6.0 | 86.9 | 5, 12, 13, 90 |
| sting_industrial_manager | 7.08 | -17.2 (-17) | -14.5 | -6.0 | 129.7 | 5, 12, 33, 90 |
| sting_industrial_milestone | 7.30 | -19.1 (-19) | -15.1 | -6.0 | 115.7 | 5, 12, 90 |
| sting_industrial_milestone_big | 7.26 | -16.6 (-16) | -14.2 | -6.0 | 136.0 | 5, 12, 33, 90 |
| sting_industrial_offline | 4.25 | -22.0 (-22) | -18.6 | -8.8 | 55.0 | 5, 9, 90 |
| sting_industrial_perk | 3.93 | -20.0 (-20) | -16.9 | -7.9 | 53.3 | 5, 9 |
| sting_industrial_upgrade | 5.94 | -20.0 (-20) | -16.0 | -6.0 | 85.6 | 5, 12, 90 |
| sting_industrial_warmth | 7.26 | -20.0 (-20) | -15.8 | -6.0 | 101.0 | 5, 12, 90 |
| sting_industrial_welcome | 6.54 | -19.2 (-19) | -14.2 | -6.0 | 95.8 | 5, 12, 90 |
| sting_suburbs_bottleneck | 3.43 | -22.0 (-22) | -18.9 | -9.0 | 43.3 | 12, 90 |
| sting_suburbs_build | 6.18 | -17.3 (-17) | -15.1 | -6.0 | 126.2 | 5, 12, 33, 90 |
| sting_suburbs_drone | 5.31 | -20.0 (-20) | -16.0 | -6.5 | 80.4 | 5, 12, 47, 90 |
| sting_suburbs_fleet | 4.52 | -20.0 (-20) | -16.6 | -6.3 | 67.1 | 5, 12, 13, 90 |
| sting_suburbs_manager | 6.28 | -17.1 (-17) | -14.8 | -6.0 | 112.2 | 5, 12, 33, 90 |
| sting_suburbs_milestone | 6.50 | -19.1 (-19) | -15.6 | -6.0 | 103.1 | 5, 12, 90 |
| sting_suburbs_milestone_big | 6.41 | -16.5 (-16) | -14.6 | -6.0 | 121.2 | 5, 12, 33, 90 |
| sting_suburbs_offline | 3.00 | -22.0 (-22) | -20.2 | -10.9 | 37.9 | 5, 9, 90 |
| sting_suburbs_perk | 3.46 | -20.0 (-20) | -17.1 | -7.9 | 49.7 | 5, 9 |
| sting_suburbs_upgrade | 4.08 | -20.0 (-20) | -16.9 | -7.1 | 60.2 | 5, 12, 90 |
| sting_suburbs_warmth | 5.97 | -20.0 (-20) | -16.3 | -6.0 | 85.1 | 5, 12, 90 |
| sting_suburbs_welcome | 4.57 | -19.0 (-19) | -14.9 | -6.1 | 68.3 | 5, 12, 90 |
| sting_university_bottleneck | 3.80 | -22.1 (-22) | -18.8 | -6.0 | 53.2 | 90, 109 |
| sting_university_build | 6.83 | -17.1 (-17) | -15.1 | -6.0 | 126.9 | 5, 33, 90, 109 |
| sting_university_drone | 5.94 | -20.1 (-20) | -15.5 | -6.0 | 93.5 | 5, 47, 90, 109 |
| sting_university_fleet | 5.62 | -20.1 (-20) | -16.1 | -6.0 | 89.1 | 5, 13, 90, 109 |
| sting_university_manager | 6.91 | -17.1 (-17) | -15.1 | -6.0 | 120.4 | 5, 33, 90, 109 |
| sting_university_milestone | 7.22 | -19.0 (-19) | -15.2 | -6.0 | 120.9 | 5, 90, 109 |
| sting_university_milestone_big | 7.05 | -16.5 (-16) | -14.3 | -6.0 | 128.0 | 5, 12, 33, 90, 109 |
| sting_university_offline | 3.20 | -22.0 (-22) | -20.0 | -10.6 | 39.6 | 5, 9, 90 |
| sting_university_perk | 3.99 | -20.0 (-20) | -16.6 | -8.1 | 57.0 | 5, 9, 90 |
| sting_university_upgrade | 4.38 | -20.0 (-20) | -16.0 | -6.0 | 69.1 | 5, 90, 109 |
| sting_university_warmth | 6.62 | -20.0 (-20) | -16.2 | -6.3 | 100.1 | 5, 90, 109 |
| sting_university_welcome | 5.11 | -19.0 (-19) | -14.9 | -6.0 | 82.2 | 5, 90, 109 |
| sting_uptown_bottleneck | 3.54 | -22.0 (-22) | -19.1 | -7.8 | 45.9 | 25, 90 |
| sting_uptown_build | 6.51 | -17.3 (-17) | -14.7 | -6.0 | 133.4 | 5, 25, 33, 90 |
| sting_uptown_drone | 5.37 | -20.0 (-20) | -16.0 | -6.7 | 77.2 | 5, 25, 47, 90 |
| sting_uptown_fleet | 5.38 | -20.0 (-20) | -15.3 | -6.4 | 77.2 | 5, 13, 25, 90 |
| sting_uptown_manager | 6.63 | -17.2 (-17) | -14.4 | -6.0 | 111.9 | 5, 25, 33, 90 |
| sting_uptown_milestone | 6.39 | -19.2 (-19) | -15.3 | -6.0 | 105.9 | 5, 25 |
| sting_uptown_milestone_big | 6.47 | -16.9 (-16) | -14.3 | -6.0 | 125.2 | 5, 12, 25, 33, 90 |
| sting_uptown_offline | 3.87 | -22.0 (-22) | -19.0 | -9.8 | 51.9 | 5, 9, 90 |
| sting_uptown_perk | 3.65 | -20.0 (-20) | -16.7 | -7.7 | 51.7 | 5, 9, 90 |
| sting_uptown_upgrade | 5.43 | -20.0 (-20) | -15.9 | -6.5 | 81.1 | 5, 25, 90 |
| sting_uptown_warmth | 6.37 | -20.0 (-20) | -15.5 | -6.0 | 91.6 | 5, 25 |
| sting_uptown_welcome | 6.07 | -19.0 (-19) | -14.2 | -6.0 | 90.5 | 5, 25, 90 |
| sting_waterfront_bid | 3.07 | -18.1 (-18) | -14.1 | -6.0 | 42.8 | 5, 12, 33 |
| sting_waterfront_bottleneck | 3.73 | -22.0 (-22) | -18.4 | -7.6 | 46.2 | 13, 90 |
| sting_waterfront_build | 6.51 | -17.3 (-17) | -15.4 | -6.0 | 135.7 | 5, 13, 33, 90 |
| sting_waterfront_drone | 5.65 | -20.1 (-20) | -15.7 | -6.0 | 84.5 | 5, 13, 47, 90 |
| sting_waterfront_fleet | 5.43 | -20.0 (-20) | -16.5 | -6.0 | 81.8 | 5, 13, 90 |
| sting_waterfront_manager | 6.73 | -17.2 (-17) | -15.4 | -6.0 | 112.2 | 5, 13, 33, 90 |
| sting_waterfront_milestone | 6.89 | -19.0 (-19) | -15.5 | -6.0 | 109.3 | 5, 13, 90 |
| sting_waterfront_milestone_big | 6.90 | -16.6 (-16) | -14.8 | -6.0 | 128.5 | 5, 12, 13, 33, 90 |
| sting_waterfront_offline | 3.63 | -22.0 (-22) | -19.6 | -9.5 | 45.4 | 5, 9, 90 |
| sting_waterfront_perk | 3.79 | -20.0 (-20) | -16.7 | -7.6 | 54.5 | 5, 9, 90 |
| sting_waterfront_upgrade | 4.02 | -20.0 (-20) | -16.8 | -6.4 | 58.8 | 5, 13 |
| sting_waterfront_warmth | 6.93 | -20.0 (-20) | -15.5 | -6.1 | 98.9 | 5, 13, 90 |
| sting_waterfront_welcome | 4.02 | -19.0 (-19) | -15.3 | -6.1 | 59.2 | 5, 13 |

## Loudness hierarchy per neighbourhood

Each cell is integrated / momentary max (400 ms window) in LUFS. The build stops if `milestone_big` > `manager` >= `build` > `milestone` > `upgrade` > `bottleneck` fails on either (`build.hierarchy_errors`); it passed.

| Neighbourhood | milestone_big (tier -16) | manager (tier -17) | build (tier -17) | milestone (tier -19) | upgrade (tier -20) | bottleneck (tier -22) |
|---|---|---|---|---|---|---|
| downtown | -16.7 / -14.1 | -17.3 / -14.4 | -17.4 / -14.6 | -19.1 / -15.0 | -20.0 / -16.6 | -22.0 / -20.0 |
| suburbs | -16.5 / -14.6 | -17.1 / -14.8 | -17.3 / -15.1 | -19.1 / -15.6 | -20.0 / -16.9 | -22.0 / -18.9 |
| waterfront | -16.6 / -14.8 | -17.2 / -15.4 | -17.3 / -15.4 | -19.0 / -15.5 | -20.0 / -16.8 | -22.0 / -18.4 |
| university | -16.5 / -14.3 | -17.1 / -15.1 | -17.1 / -15.1 | -19.0 / -15.2 | -20.0 / -16.0 | -22.1 / -18.8 |
| industrial | -16.6 / -14.2 | -17.2 / -14.5 | -17.4 / -14.8 | -19.1 / -15.1 | -20.0 / -16.0 | -22.0 / -18.5 |
| uptown | -16.9 / -14.3 | -17.2 / -14.4 | -17.3 / -14.7 | -19.2 / -15.3 | -20.0 / -15.9 | -22.0 / -19.1 |

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

Music 22.03 MB, stingers 5.97 MB, story 3.53 MB, sfx 0.17 MB (MB = MiB). Files: 33,240,658 bytes = 31.70 MB of the 32 MB cap (33,554,432 B); margin 313,774 bytes.
