# NOTES-R1 measures: Julien's notes on the R1 reel (2026-11-16)

Reel order and times, computed from the R1 preset (30 s clips, 0.7 s of silence between; `build/reel/R1.txt` was not on disk): downtown 0:00, downtown_sparse 0:30, suburbs 1:01, waterfront 1:32, university 2:02, industrial 2:33, uptown 3:04, megaslice_hq 3:35. His 0:30-1:01 is downtown_sparse, 1:01-1:33 suburbs, 1:33-2:02 waterfront, 2:03-2:30 university. He gave no times for industrial, uptown and HQ; he named the cause as applying to the whole file, so they get the same change.

Measure used for the sustain notes: `python3 keys_release.py` reads each loop's final MIDI (after swing, humanising, laid-back) and groups the Rhodes/piano notes into chord hits (starts within 150 ms). "Overlap" counts hits whose last note is still sounding when the next hit begins. "Gap" is the silence between a hit's last note-off and the next hit's first note-on, in seconds.

## Step 1: the table

| # | His words | Cues | What I change | How it will show in a measurement |
|---|---|---|---|---|
| 1 | "0:00 I like this excerpt, it might be my favorite of the six tracks" | downtown | Nothing of its own: lead, pad, bass, kit, chart, levels stay. It only gets the shared keys change of rows 2-6, because he said the cause applies to the whole file. | Seam passes; LUFS, seconds and barRoots identical; lead minus bed -2.9 -> -2.4 LU (the bed's Rhodes is quieter, so the lead sits 0.5 LU closer to it; still below 0). |
| 2 | "0:30-1:01 this track seems to have a ln electric piano whose chords have a bit of a drone to them that is creating a similar problem as what I described as bagpipes albeit in a different timbre and frequency range- a muddy droning set of chords" | downtown_sparse (and downtown, same Rhodes) | `jazz.comp`: every chord hit now releases before the next hit begins (rows 5-6). Sound-cause check: the Rhodes is GM 5 (Rhodes) and stays; a render of one chord on bank C shows its dry level falls 20 dB within 0.12 s of note-off and the rest of the tail is the reverb send (CC72 release time changes nothing: 0.12 s vs 0.09 s), so the drone is the note lengths, not the program. | Overlapping hits 46/91 -> 0/91; median gap -0.017 s -> +0.242 s; longest hold 2.15 s -> 1.15 s. |
| 3 | "101-1:33 I rather like the swinging hi hats and brushed snare in the drum kit." | suburbs (and the kit in every loop) | Nothing: `brushes`, `laid_back` and the kit tracks are not touched. | Kit MIDI events and kit track volume identical to the baseline build. |
| 4 | "The piano chords don't feel quite as muddy in this section of the audition but feel like they are too busy at times" | suburbs | Suburbs only: fewer extra hits on the keys. `answer_p` 0.7 -> 0.4 (the quieter second hit in a whole-bar chord) and `antic_p` 0.3 -> 0.15 (the chord struck an eighth early). Chart, chords and kit unchanged. | Chord hits per bar 1.88 -> 1.69 (60 -> 54 hits in 32 bars); the chord changes themselves are unchanged. |
| 5 | "1:33-2:02 droning piano again." / "2:03-2:30 the droning piano again." | waterfront, university | Same `jazz.comp` change (waterfront SWING44, university HIPHOP with strum 0.045). | Overlap 34/63 -> 0/63 (waterfront) and 35/60 -> 2/60 (university: two grace-note clusters of the half-speed Rhodes melody, which is a melody line, not comping); shortest gap 0.255 s and 0.375 s median. |
| 6 | "I think the piano issues in the whole file stem from the unnatural sound of the piano sustain not releasing just before the next chord begins" | all eight loops with keys: downtown, downtown_sparse, suburbs, waterfront, university, industrial, uptown (piano), megaslice_hq | One change in `jazz.py` `comp`, not eight: (a) no note sounds within `RELEASE_GAP` = 0.4 beats of the next hit's first note, counting an anticipated chord from its early onset; (b) a hit is held at most 1.25 pulses (2.5 beats in 4/4, 1.9 in 6/8) instead of 0.92 of the chord's length; (c) the downbeat chord lets go 0.4 beat before its own answer; (d) the notes of one hit end together (the strum delays attacks, not releases). 0.4 beat is 0.19-0.24 s at these tempos; swing can shorten it to 0.27 beat (0.13-0.19 s), longer than the 0.12 s the Rhodes needs to fall 20 dB. | `keys_release.py` on all eight (table below): chord overlap 0 in each loop (University 2 melody clusters), shortest gap 0.199-0.257 s, above the 0.12 s the Rhodes needs to fall 20 dB. I did not render the Rhodes stem alone to measure the audible tail; the reverb send (45) is unchanged, so a reverb tail after each chord remains. |
| 7 | "Let's evaluate writing the music so it builds and becomes more complex as the restaurant in each neighborhood grows" | none | Nothing built. Evaluation only. | `docs/build/music/notes/R1-growth-eval.md`. |

Not changed: pads (Downtown's warm pad and Industrial's pad are a different instrument from the electric piano and he did not name them), the stinger and story keyboards (`rh_hit`, Round 2), reverb sends, instrument programs, levels, charts.

## Step 6: results

Keyboard comping, final MIDI of each loop, before (baseline full build) and after (`python3 keys_release.py`):

| Loop | Hits/bar | Overlapping hits | Shortest gap (s) | Median gap (s) | Median hold (s) | Longest hold (s) |
|---|---|---|---|---|---|---|
| downtown, downtown_sparse | 1.75 -> 1.75 | 46/91 -> 0/91 | -0.89 -> 0.231 | -0.017 -> 0.242 | 0.93 -> 0.67 | 2.15 -> 1.15 |
| suburbs | 1.88 -> 1.69 | 33/60 -> 0/54 | -1.664 -> 0.225 | -0.033 -> 0.315 | 1.56 -> 1.16 | 3.06 -> 1.81 |
| waterfront | 1.97 -> 1.97 | 34/63 -> 0/63 | -1.794 -> 0.255 | -0.030 -> 0.331 | 1.68 -> 0.84 | 3.30 -> 1.92 |
| university | 1.88 -> 1.88 | 35/60 -> 2/60 | -1.865 -> -1.684 | -0.079 -> 0.375 | 1.79 -> 0.89 | 3.55 -> 2.96 |
| industrial | 1.92 -> 1.92 | 32/69 -> 0/69 | -1.821 -> 0.199 | 0.028 -> 0.413 | 1.72 -> 1.37 | 3.46 -> 2.11 |
| uptown | 1.97 -> 1.97 | 27/63 -> 0/63 | -1.686 -> 0.220 | 0.037 -> 0.337 | 1.58 -> 0.81 | 3.11 -> 1.86 |
| megaslice_hq | 1.82 -> 1.82 | 12/31 -> 0/31 | -1.702 -> 0.257 | 0.046 -> 0.358 | 1.75 -> 0.89 | 3.00 -> 2.04 |

Baseline numbers come from the committed `compose.py` and `jazz.py` run into a scratch folder, counted with the same rules (hits of three or more notes within 150 ms). University's 2 remaining overlaps are two grace-note clusters of the half-speed Rhodes melody (bed bars 20 and 23); the longest hold there (2.96 s) is a melody note, not comping.

Loops rebuilt (partial build of all eight, then `git checkout -- assets/audio/sfx`). Numbers from `tools/audio/build/report.json` (KB: after, baseline in brackets) and `python3 audit.py` (lead minus bed):

| Cue | Seconds | LUFS (before) | Peak dBFS | Seam step / 99th pct | KB | GM programs in front | Lead minus bed (LU) |
|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 (-20.0 before) | -7.8 | 0.00104 / 0.02312 | 1145.5 (1145.2) | nylon 25 (lead), Rhodes 5, warm pad 90, upright 33, brush kit | -2.4 |
| downtown_sparse | 94.55 | -22.0 (-22.0 before) | -11.5 | 0.00036 / 0.01229 | 1130.5 (1130.0) | nylon 25, Rhodes 5 | -1.7 |
| suburbs | 89.30 | -20.0 (-20.0 before) | -7.9 | 5e-05 / 0.02497 | 1086.4 (1084.1) | vibraphone 12, jazz guitar 27, glockenspiel 10, Rhodes 5, upright 33, brush kit | -2.8 |
| waterfront | 96.00 | -20.0 (-20.0 before) | -7.4 | 0.00052 / 0.02631 | 1167.7 (1165.9) | harp 47, marimba 13, Rhodes 5, upright 33, brush kit | -2.7 |
| university | 101.05 | -20.0 (-20.0 before) | -7.7 | 0.00127 / 0.02288 | 1228.3 (1226.4) | kalimba 109, vibraphone 12, Rhodes 5, finger bass 34, brush kit | -2.4 |
| industrial | 113.68 | -20.0 (-20.0 before) | -7.7 | 0.00252 / 0.02838 | 1377.9 (1375.1) | vibraphone 12, flute 74, clean guitar 28, Rhodes 5, warm pad 90, upright 33, brush kit | -3.2 |
| uptown | 91.43 | -20.0 (-20.0 before) | -7.2 | 0.00181 / 0.02568 | 1113.9 (1113.2) | nylon 25, piano 1, jazz guitar 27, harp 47, upright 33, brush kit | -3.0 |
| megaslice_hq | 53.68 | -19.0 (-19.0 before) | -7.1 | 0.00026 / 0.02164 | 651.9 (652.0) | Rhodes 5, upright 33, pizzicato 46, brush kit | -3.2 |

Seconds, barRoots and tiers did not change, so `src/audio/manifest.ts` is unchanged. Audio total: 13.24 MB of 14 (`du -sb assets/audio` = 13,877,074 bytes, limit 14,680,064). Checks: `python3 -m py_compile tools/audio/*.py` pass; `npx jest src/audio` 53 passed; `npx tsc --noEmit` clean; sound effects byte-identical (`git status assets/audio/sfx` empty).

Code: `tools/audio/jazz.py` `comp` (new `gap`, `hold`, `answer_len`; `RELEASE_GAP`), `tools/audio/compose.py` (Suburbs' `comp` call: `antic_p=0.15, answer_p=0.4`), `tools/audio/keys_release.py` (new measure).

# Notes round 2 (2026-11-19)

## Table

| # | His words | Cues | What I changed | How it shows in a measurement | Measured |
|---|---|---|---|---|---|
| 8 | "I would like the timbre of the instruments to be more articulate and overall the sound needs less smearing." | the eight loops (not on the R1 reel's stingers and story, which he did not name and which are not yet rewritten) | (a) Release: every pitched channel sends CC72 = 36 (pads CC73 attack 60, CC72 44). Chosen because a tail after note-off is what runs notes together, and the bank honours CC72. (b) Reverb and chorus sends halved (`mlib.TIGHT_SEND`). (c) `jazz.articulate`: every pitched note cut to 0.75 of its written length (pads 0.9), one rule in `jazz_finish`. (d) Loop master: low-pass 7 -> 9 kHz, tape wow 6 -> 3 cents, saturation drive 5x -> 7x RMS (`post.LOOP_*`). | CC72 effect, one C4 note, dry, bank C (time for the level to fall 20 dB after note-off): vibraphone 0.24 -> 0.10 s, marimba 0.70 -> 0.10 s, Rhodes 0.025 -> 0.012 s. Pad attack to peak 0.88 -> 0.15 s (CC73 60); pad release 0.88 -> 0.52 s. | Table A below. Comping hold median 0.67-1.37 s -> 0.51-1.04 s; longest hold 1.15-2.96 s -> 0.87-2.22 s; shortest chord gap 0.199-0.257 s -> 0.311-0.554 s (University one melody cluster, 1 overlap, was 2). |
| 9 | "Increase the memory allotment for audio to 20MB if that will help and make each note more distinct" | the eight loops | Loops encoded at 144 kbps stereo AAC (were 96). Cap raised 14 -> 20 MB (20,971,520 B) in `src/audio/__tests__/logic.test.ts`, the only place that enforces it (`build.py` has no size check). Stingers, story and sfx keep their bitrates (sfx byte-identical). | Bytes per loop +52% | Audio total 18,586,494 B = 17.73 MB of 20 (2.27 MB left). |

## Table A: decoded loop, old committed file against new (stereo folded to mono)

Crest: peak over RMS in dB. 3-9 kHz: share of spectral power. Valley depth: median over one-second windows of the 10th percentile over the 90th percentile of the 20 ms RMS, in dB (deeper = more silence between notes). Scratch script, not in the repo.

| Loop | Crest dB | 3-9 kHz share % | Valley depth dB |
|---|---|---|---|
| downtown | 14.2 -> 15.7 | 0.81 -> 1.01 | -8.6 -> -14.3 |
| downtown_sparse | 12.9 -> 14.4 | 0.00 -> 0.00 | -9.6 -> -22.5 |
| suburbs | 14.3 -> 15.9 | 0.94 -> 1.18 | -9.7 -> -16.2 |
| waterfront | 14.9 -> 16.1 | 1.06 -> 1.29 | -10.8 -> -15.2 |
| university | 15.2 -> 16.4 | 0.59 -> 0.75 | -6.8 -> -21.7 |
| industrial | 14.5 -> 16.1 | 1.26 -> 1.56 | -9.2 -> -14.1 |
| uptown | 14.4 -> 15.6 | 1.15 -> 1.45 | -7.8 -> -17.7 |
| megaslice_hq | 13.4 -> 14.3 | 0.51 -> 0.65 | -9.1 -> -24.0 |

## Loops rebuilt (full build, then `git checkout -- assets/audio/sfx`; programs in front unchanged from the table above)

| Cue | Seconds | LUFS | Peak dBFS | Seam step / 99th pct | KB (before) | Lead minus bed (LU) (before) |
|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 | -6.0 | 0.0002 / 0.02899 | 1742.8 (1145.5) | -2.7 (-2.4) |
| downtown_sparse | 94.55 | -22.0 | -10.1 | 0.00027 / 0.01346 | 1714.8 (1130.5) | -1.4 (-1.7) |
| suburbs | 89.30 | -20.0 | -6.0 | 0.00043 / 0.03107 | 1642.2 (1086.4) | -2.9 (-2.8) |
| waterfront | 96.00 | -20.0 | -6.0 | 0.00037 / 0.03338 | 1784.9 (1167.7) | -2.2 (-2.7) |
| university | 101.05 | -20.0 | -6.0 | 0.0018 / 0.02647 | 1864.3 (1228.3) | -1.6 (-2.4) |
| industrial | 113.68 | -20.0 | -6.0 | 0.00192 / 0.034 | 2090.2 (1377.9) | -3.5 (-3.2) |
| uptown | 91.43 | -20.0 | -6.0 | 0.00039 / 0.03296 | 1680.7 (1113.9) | -3.4 (-3.0) |
| megaslice_hq | 53.68 | -19.0 | -6.0 | 0.00099 / 0.02804 | 981.2 (651.9) | -3.9 (-3.2) |

Peaks now sit on the -6 dBFS ceiling (were -7.1 to -7.9): the 9 kHz roll-off and the gentler saturation let more of the attack through, so the limiter touches the loudest hits. Seconds, tiers, barRoots and manifest unchanged (`src/audio/manifest.ts` not modified). I did not render a stem alone to measure the Rhodes tail inside the mix. Checks: `py_compile` pass; `npx jest src/audio` 61 passed; `npx tsc --noEmit` clean; sfx byte-identical (`git status assets/audio/sfx` empty); `du -sb assets/audio` 18,586,494.

# Notes round 3 (2026-11-19)

Note: "Reimagine the melodic phrasing, themes, and arrangements. The Lofi jazz vibe with the brushed snares and bass is good and  but the main melody has a lot of room for change"
Extra instruction from the orchestrator: keep the bed (kit, bass, grooves, tempos, keys, metres, bar counts, round-2 articulation and smear settings); new theme per neighbourhood; new phrasing (call and response, breaths, varied phrase lengths, displacement, development rather than repetition); new arrangement around it. Keep the chord-tone clash check, lead minus bed -2 to -4 LU (D5), the 20 MB cap, seams and tiers. Rhodes instrument unchanged.

## Table (step 1, written before the build)

| # | His words | Cues | What I change | How it will show in a measurement | Measured |
|---|---|---|---|---|---|
| 10 | "Reimagine the melodic phrasing, themes, and arrangements." / "the main melody has a lot of room for change" | the eight loops | One new module `tools/audio/tunes.py`: every loop's lines are text (pitch:beats), placed by `compose.play_tune`. Each loop gets its own theme (Downtown a lilt on an eighth rest, Suburbs a dotted G5 and falling G6 arpeggio, Waterfront a long A4 then a fall to the 13th, University a repeated-note hook, Industrial a blues riff C#-E-G, Uptown a broken Eb6 landing on the 6th, HQ a staccato chromatic tiptoe). The city motif (`material.MOTIF` and friends) is no longer in the eight loops (still in stingers and triumphs). | Build check `tune_check`: chord-tone clash check over every added note, no lead note in a lead-free bed bar, a theme text is stated at most twice per loop (counted as same pitches and same lengths). Lines per loop and phrase lengths in the table below. | all eight build; `tune_check` passes in every loop (clash check, lead-free beds, theme at most twice: counted 2, 2, 2, 1, 1, 2, 2 for Downtown, Suburbs, Waterfront, University, Industrial, Uptown, HQ). Table C |
| 11 | same note: "phrasing" | the eight loops | Phrase shapes: A is call (2 bars) and response (2 bars, other instrument); B is one long arch (4 + 4 bars), the response augmented; a 4-bar run of one-bar trades (Suburbs march); rests in every phrase (an eighth to a beat); rhythmic displacement (Suburbs pick-ups on the 'and' of 4, Uptown B's first note late, Industrial call displaced by a half beat, HQ second tiptoe a beat late); development rather than repetition (inversion of rhythm in B, augmentation, sequence, quarter notes across the dotted pulse in Downtown). | Number of lead notes per loop, longest rest between phrases, lines per voice (table below). | Table C: lead notes 30-116 per loop; the longest lead-free stretch between lead notes is 4.5-5.5 bars (1.5 in Industrial, whose lead-free bed is chorus 1) |
| 12 | same note: "arrangements" | the eight loops | Who plays when: two or three voices trade the tune (vibraphone/guitar, harp/marimba, kalimba/vibraphone/Rhodes, vibraphone/flute with the guitar answering, nylon/harp, Rhodes/pizzicato echo; Downtown full chart adds a celesta in the rests and a halo, the sparse chart keeps the nylon guitar and Rhodes only). Comping density per section: thin in beds (antic 0.1, answer 0.25-0.4), fuller in the B (up to 0.4 / 0.85), thin under Downtown's quarter-note development. Drop-outs: the bass rests for one bar at the end of an A or a bed (Downtown bars 7, 23, 39; Suburbs 7, 11, 27; Waterfront 7, 23; University 7, 11, 23; Industrial 11, 23; Uptown 7, 19; HQ two beats before bar 9); Waterfront's marimba arpeggio rests in the coda; University's Rhodes comp is one soft chord a bar under its hook. Kit, bass lines, grooves, tempo, keys, bar counts, articulation and smear settings are untouched. | Audit: lead minus bed per loop; bass notes removed (bars listed); comp hits per bar by section. | Table B (lead minus bed -2.5 to -3.3 LU on all eight); kit pattern identical to the committed build in all seven kit loops (same notes on the same 1/3-beat grid; only the humanise jitter is re-rolled, because the loops' random stream now runs over different lead notes); bass notes removed 2-8 per loop |

## Table B: loops rebuilt (full build, then `git checkout -- assets/audio/sfx`)

Lead minus bed from `python3 audit.py` (leads= tuples: downtown nylon melody; suburbs vibraphone and clean guitar; waterfront harp and marimba; university kalimba, vibraphone and rhodes melody; industrial vibraphone and flute; uptown nylon melody and harp; HQ rhodes villain and pizzicato echo). To land in -2 to -4 LU I first measured -7.3 to -0.9 with the new sparser lines, then set the lead levels: Downtown lead track volume 109 -> 112 (sparse 87 -> 84), lead velocity 44 -> 58, cap 56 -> 72; Suburbs velocity 54 / 52, cap 68; Waterfront 52 / 50, cap 64; University kalimba and vibraphone volume 127 -> 110; Industrial velocity 40; Uptown volume 100 -> 112, velocity 60 / 50, cap 72; HQ velocity 52 / 46, cap 64. The raw (before mastering) lead minus bed is -1.5 to -2.8 LU.

| Cue | Seconds | LUFS (tier) | Peak dBFS | Seam step / 99th pct | KB (before) | GM programs in front | Lead minus bed (LU) |
|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 | -6.0 | 0.0008 / 0.03337 | 1745.8 (1742.8) | nylon 25 (lead), celesta 9, Rhodes 5, warm pad 90, upright 33, brush kit | -2.8 |
| downtown_sparse | 94.55 | -22.0 | -9.5 | 0.00175 / 0.0201 | 1716.0 (1714.8) | nylon 25, Rhodes 5 | -2.8 |
| suburbs | 89.30 | -20.0 | -6.0 | 0.00019 / 0.03112 | 1641.0 (1642.2) | vibraphone 12, jazz guitar 27, glockenspiel 10, Rhodes 5, upright 33, brush kit | -2.9 |
| waterfront | 96.00 | -20.0 | -6.0 | 0.00023 / 0.03383 | 1785.9 (1784.9) | harp 47, marimba 13, Rhodes 5, upright 33, brush kit | -2.6 |
| university | 101.05 | -20.0 | -6.5 | 0.00035 / 0.02596 | 1861.8 (1864.3) | kalimba 109, vibraphone 12, Rhodes 5 (comp and melody), finger bass 34, brush kit | -3.3 |
| industrial | 113.68 | -20.0 | -6.1 | 0.00172 / 0.03545 | 2096.0 (2090.2) | vibraphone 12, flute 74, clean guitar 28, Rhodes 5, warm pad 90, upright 33, brush kit | -2.9 |
| uptown | 91.43 | -20.0 | -6.0 | 0.00033 / 0.03627 | 1683.0 (1680.7) | nylon 25, harp 47, piano 1, jazz guitar 27, upright 33, brush kit | -2.9 |
| megaslice_hq | 53.68 | -19.0 | -6.0 | 0.00262 / 0.02811 | 981.0 (981.2) | Rhodes 5, pizzicato 46, upright 33, brush kit | -2.5 |

Audio total: 18,595,860 B = 17.73 MB of 20 (cap 20,971,520 B; was 18,586,494 B). Seconds, `barRoots`, tiers and `src/audio/manifest.ts` unchanged (no diff in `src/`). Stingers, story cues and sfx: `git status assets/audio` lists only the eight loops.

## Table C: the lines (from the MIDI, lead tracks only)

| Loop | Lead notes | Bars with a lead | Lead range (MIDI) | Theme stated literally | Voices | Phrase plan |
|---|---|---|---|---|---|---|
| downtown (and sparse) | 116 | 37 of 52 | 67-81 | 2 | nylon guitar; celesta (full only) | A: lilt 4 bars, answer 4, development in quarter notes 4, close 4; B 8 + 8 (second half a step higher); lilt 4, coda 4 |
| suburbs | 79 | 22 of 32 | 67-81 | 2 | vibraphone, clean guitar | call 2 + response 2 (other voice); B 4 (guitar) + 4 (vibraphone, augmented); march 4 one-bar trades; A' 4 with the guitar a third under |
| waterfront | 72 | 22 of 32 | 66-78 | 2 | harp, marimba | harp call 2 + marimba response 2; B marimba 4 + harp 4; A' call 2 + response 2 that resolves; coda 4 |
| university | 55 | 14 of 32 | 70-82 | 1 (the half-speed Rhodes is a development) | kalimba, vibraphone, Rhodes | hook 4 bars; B vibraphone 4 + 2, kalimba 2; Rhodes at half speed 4; tail 3 |
| industrial | 76 | 23 of 36 | 69-81 | 1 | vibraphone, flute, guitar (answers) | chorus 1 none; chorus 2 call 2, answer 1, IV call 2, displaced call 2, turnaround 4; chorus 3 flute and vibraphone trade one bar each for 8 bars, flute 4 |
| uptown | 80 | 22 of 32 | 65-79 | 2 | nylon guitar, harp | A 4; B 4 guitar + 2 harp + 2 guitar; A' 4; tag 8 harp |
| megaslice_hq | 30 | 9 of 17 | 48-67 | 2 | Rhodes villain, pizzicato echo | tiptoe 2 bars + echo 2; bed 4; tiptoe a beat late 2 + echo 2; bed 3 |

Checks: `python3 -m py_compile tools/audio/*.py` pass; `python3 build.py` (full) pass, seam checks pass; `npx jest src/audio` 61 passed; `npx tsc --noEmit` clean; sfx byte-identical. Not measured: how any of it sounds (nobody has listened). Counter-line levels were not audited on their own: Industrial's guitar answer and Downtown's celesta count in the bed (not in `leads=`).
