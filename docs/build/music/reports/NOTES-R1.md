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
