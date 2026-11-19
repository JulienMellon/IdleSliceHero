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

# Round R1, second note (2026-11-19)

His words: "I would like the timbre of the instruments to be more articulate and overall the sound needs less smearing. Overall I want crisper, simpler phrasing with less complex chords on the Rhodes piano because it sounds muddy and has poor articulation. Increase the memory allotment for audio to 25MB". The cap itself was raised by the orchestrator (`src/audio/__tests__/logic.test.ts`, 25 MB); I used some of the room for bitrate.

## Table first

| # | His words | Cues | What I changed | How it shows in a measurement | Measured result |
|---|---|---|---|---|---|
| 1 | "less complex chords on the Rhodes piano because it sounds muddy" | all eight loops (every `jazz.comp`; the keys are Rhodes GM 5, and GM 1 piano in uptown) | `jazz.py`: new `SIMPLE` table, guide tones only: a dyad of 3rd and 7th, a triad on major, 6/9 and diminished chords, no 9th, 11th or 13th. Three exceptions, because the build's lead-clash check (AU78) fails otherwise: min11 keeps the 9th and dom13 keeps the 13th (a held lead note sits on it), dom13 is b7-3-13. Register moved up from C3..E4 (centre 53) to G3..Bb4 (centre 60), above the bass (C2..G3), so the keys stop sharing the 130-250 Hz band with the bass and the pad. | Notes per hit 4 (3 on answers) -> 2.3-2.5; lowest keys note 48 -> 55; median keys pitch 60-62 | Notes per hit: downtown 2.47, suburbs 2.54, waterfront 2.36, university 2.55, industrial 2.27, uptown 2.47, megaslice_hq 2.43. Lowest note 55 (G3) in all eight; median 60-62. |
| 2 | "crisper, simpler phrasing" | all eight | `jazz.comp` defaults: hold 1.25 -> 0.75 pulse (2.5 -> 1.5 beats in 4/4, 1.9 -> 1.1 in 6/8); answer 1.0 -> 0.6 beat; strum 30 -> 18 ms (University 45 -> 30 ms); anticipation odds 0.3 -> 0.15 and answer odds 0.7 -> 0.5 (Suburbs keeps its 0.15 / 0.4). | Hits per bar and longest hold, from `keys_release.py` (it now counts two-note hits) | Hits/bar (before -> after): downtown 1.75 -> 1.63, suburbs 1.69 -> 1.69, waterfront 1.97 -> 1.81, university 1.88 -> 1.75, industrial 1.92 -> 1.86, uptown 1.97 -> 1.84, megaslice_hq 1.82 -> 1.65. Longest hold: 2.15 -> 0.69 s (downtown), 3.30 -> 1.18 (waterfront), 3.46 -> 1.33 (industrial), 3.11 -> 1.15 (uptown). Chord overlap 0 in each loop (University 2, melody clusters, as before). Gap between hits, median: 0.25-0.38 s. |
| 3 | "the sound needs less smearing" / "more articulate" | all eight | `compose.jazz_finish`, once: every pitched track keeps 0.5 of its reverb send (CC91) and 0.25 of its chorus send (CC93) (`WET_REVERB`, `WET_CHORUS`). The Rhodes goes from reverb 32-50 / chorus 30-50 to roughly half / a quarter of that. The kit keeps its sends: he named the brushes as something he likes. The 7 kHz tape roll-off in `post.py` is untouched (the Rhodes attack sits below it, and the stingers share it). | Reverb and chorus CC values in each loop's MIDI | Reverb send of the Rhodes in downtown 45 -> 22, chorus 40 -> 10 (same factors in every cue). Not measured: the audible tail. |
| 4 | "the timbre of the instruments to be more articulate" | all eight | `build.py`: loops encoded at 128 kbps instead of 96 (stereo AAC), to keep the attacks the codec was smoothing. This is what the extra room is spent on. | `kbps` in `report.json`; bytes | 96 -> 128 in all eight; music folder 8.69 -> 11.77 MB. |
| 5 | "Increase the memory allotment for audio to 25MB" | none of mine | Already done by the orchestrator in the test. I updated the size table in `docs/AUDIO.md`. | `du -sb assets/audio` | 17,099,115 bytes = 16.31 MB of 25. |

Sound-cause choice: no program changed. The muddy-Rhodes cause I chose is the voicing (four notes with the 9th/11th/13th in the 130-330 Hz band, next to the upright bass and the pad), the long holds and the chorus/reverb sends, because those are the things that change with what he asked for (fewer notes, shorter, drier). I did not lower the pad: he did not name it.

## Results

| Cue | Seconds | LUFS (tier) | Peak dBFS | Seam step / 99th pct | KB (before) | GM programs in front | Lead minus bed (LU) (before) |
|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 (-20) | -7.4 | 0.00369 / 0.02357 | 1551.7 (1145.5) | nylon 25, Rhodes 5, warm pad 90, upright 33 | -2.2 (-2.4) |
| downtown_sparse | 94.55 | -22.0 (-22) | -10.9 | 0.00043 / 0.01293 | 1513.3 (1130.5) | nylon 25, Rhodes 5 | -1.2 (-1.7) |
| suburbs | 89.30 | -20.0 (-20) | -8.0 | 0.00014 / 0.02585 | 1472.4 (1086.4) | vibraphone 12, jazz guitar 27, glockenspiel 10, Rhodes 5, upright 33 | -2.2 (-2.8) |
| waterfront | 96.00 | -20.0 (-20) | -7.4 | 0.00050 / 0.02824 | 1588.0 (1167.7) | harp 47, marimba 13, Rhodes 5, upright 33 | -2.2 (-2.7) |
| university | 101.05 | -20.0 (-20) | -7.6 | 0.00065 / 0.02400 | 1666.6 (1228.3) | kalimba 109, vibraphone 12, Rhodes 5, finger bass 34 | -2.0 (-2.4) |
| industrial | 113.68 | -20.0 (-20) | -7.5 | 0.00515 / 0.02937 | 1871.8 (1377.9) | vibraphone 12, flute 74, clean guitar 28, Rhodes 5, warm pad 90, upright 33 | -3.0 (-3.2) |
| uptown | 91.43 | -20.0 (-20) | -7.3 | 0.00099 / 0.02583 | 1501.0 (1113.9) | nylon 25, piano 1, jazz guitar 27, harp 47, upright 33 | -3.1 (-3.0) |
| megaslice_hq | 53.68 | -19.0 (-19) | -6.9 | 0.00233 / 0.02273 | 883.7 (651.9) | Rhodes 5, upright 33, pizzicato 46 | -3.1 (-3.2) |

Downtown_sparse's lead sits only 1.2 LU under its bed (the aim is -2 to -4, the rule is 0 or less): its bed is the Rhodes alone and it is now fewer notes. Seconds, bars and `barRoots` are unchanged, so `src/audio/manifest.ts` did not change. Audio total 16.31 MB of 25 (14 MB was the old cap; the card's 14,680,064 B line no longer applies).

Not touched: the kit, the pad, the leads' notes and the charts, the stingers and story cues (their keyboards use `rh_hit`, not `comp`), `post.py`.
