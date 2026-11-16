# M1a measures: the jazz language, Downtown and Downtown sparse (R1)

Bank: C, `MuseScore_General_Full.sf3` (Julien, 2026-11-16: "C"; `tools/audio/BANK` = `banks/MuseScore_General_Full.sf3`). Nobody has listened to any of this.
Numbers come from `tools/audio/build/report.json` (seam, LUFS, peak, KB) and `python3 audit.py downtown downtown_sparse` (lead minus bed).

| Cue | Seconds | LUFS (tier) | Peak dBFS | Seam step / 99th pct | KB | GM programs in front | Lead minus bed (LU) |
|---|---|---|---|---|---|---|---|
| downtown | 94.55 | -20.0 (-20.0) | -7.8 | 0.0013 / 0.0222 | 1144.7 | nylon 24 (lead), Rhodes 4, warm pad 89, upright bass 32, brush kit 40 | -3.0 |
| downtown_sparse | 94.55 | -22.0 (-22.0) | -12.0 | 0.0005 / 0.0111 | 1129.8 | nylon 24 (lead and arpeggio), Rhodes 4 | -3.1 |

Audio total: 13.37 MB of 14 (loops 8.74, stingers 3.03, story 1.43, sfx 0.17). Margin 0.63 MB, so no bars were trimmed.

What was measured and done:
- 52 bars, 6/8, 99 bpm quarter (dotted quarter = 66), 94.55 s, same as before. `barRoots` come from the chart; `compose.py` asserts the sparse chart's `barRoots`, bar count, seconds and bpm equal the full chart's. Roots now: 1 on 18 of 52 downbeats.
- Melody: M68 is stated twice (A bar 1, A2 bar 1). Intro (4 bars) and both beds (4 bars each) have no `nylon melody` notes. The pickup before each statement sits in the previous bar's last half beat, as before.
- The whole melody sits an octave lower than the accordion's (it reached G5): pitches 48-67 (C3-G4), velocity 32-56 after humanising (capped at 56).
- Palette: `compose.py` checked 2 cues (downtown, downtown_sparse), 0 errors. No accordion, pizzicato or reed track exists in either chart.
- Voicings: every Rhodes note 48-64 (C3-E4); asserted for all 15 qualities on all 12 roots. Kit notes used: 36, 37, 38, 40, 44, 51.
- Lead level set by track volume only (nylon melody CC7 109 full, 87 sparse; Rhodes 72, bass 84, pad 36, kit 78, arpeggio 96). Mastering is unchanged.
- Other cues still compose (153 cues). They are not rewritten, but their audio in `assets/audio` was re-rendered through bank C by the full build that step 0 required.
- Checks: `npx jest src/audio` 53 passed; `npx tsc --noEmit` clean.

## Language (for M1b and M1c)

All in `tools/audio/jazz.py`; palette in `tools/audio/palette.py`; finish in `compose.jazz_finish`. Keys are `'F'`, `'F4'`, `'Bb'` or a MIDI number. Degrees are 1..7 or roman strings (`'ii'`, `'bVII'`, `'#iv'`, case ignored). Times are beats (a quarter note).

- `voicing(root, degree, quality, near=None)` / `voicing_off(root, semitone_offset, quality, near=None)`: rootless close voicing in C3..E4, any inversion, the one nearest `near` (default 53). Qualities: maj7, maj9, maj7s11, 6/9, min9, min11, dom9, dom13, sus13, dim7, min(maj7), min7b5, and the altered dom7b9, dom7s11, alt7.
- `Harmony(key, bar_beats)`: list of bars (each a list of `Ch(off, q, beats)`); `+` joins; `.roots` is the barRoots list (degree of each bar's first chord; only the tonic is 1); `.chords(start)` gives (beat, Ch).
- `bars(key, bar_beats, *bar_specs)`: a bar spec is `[(degree, quality, beats), ...]`, summing to the bar. `hold(key, bar_beats, degree, quality, n=1)`: whole bars on one chord.
- `i_vi_ii_V(key, bar_beats, degree='I', quals=...)`: two bars, two chords each.
- `ii_V_I(key, bar_beats, target='I', target_q='maj9', shape='half'|'bar', resolve=True, ii_q=None, v_q=None, tritone=False)`: 'half' puts ii and V in one bar; a minor `target_q` gets min7b5 and dom7b9; `tritone=True` swaps V for bII7; `resolve=False` leaves the target to the next section.
- `tritone(harmony)`: every dominant chord replaced by the one a tritone away. `backdoor(key, bar_beats, target='I', target_q='maj9', shape='half', resolve=True)`: iv min9, bVII13, home.
- Feels: `F68` (6/8, swing 0), `SWING44` (4/4, swing 0.58), `SHUFFLE` (4/4, swing 0.667). Each carries its ride, kick, ghost, cross-stick, pedal and comp-answer positions and the ratio to pass to `swing_smooth`.
- `comp(track, harmony, feel, start=0, seed=1, vel=46, strum=0.03, antic_p=0.3, answer_p=0.7, near=None)`: long chord on each chord's downbeat, quieter answer on whole-bar chords, seeded anticipation by `feel.antic`.
- `bass_two_feel(track, harmony, feel, start=0, vel=60)`: root, fifth per `feel.pulse` (C2..B2 roots). `bass_walk(track, harmony, feel, start=0, seed=1, vel=62)`: 4/4 quarters, chromatic approach into the next chord (the last chord approaches the first).
- `brushes(drm, nbars, feel, start=0, seed=1, scale=1.0, swirl_every=8, bar0=0)`: ride 51 (26-40), kick 30-42, ghost taps 16-26, cross-stick 37 and pedal 44 on 2 and 4, a swirl (note 40) on the last bar of every `swirl_every` bars. Positions are straight; swing is applied afterwards.
- `laid_back(tracks, ms, bpm, seed=5)`: kit `ms` late +-3 (12-18 ms at 15), bass 0.33-0.53 of that, kick and snare-family hits a further +-6 ms.
- `compose.jazz_finish(song, ratio, leads=(), lead_cap=56, laid_ms=15)`: `swing_smooth`, then `humanize_ms(6, 10, 12, cap)`, then `laid_back`. Name the lead tracks in `leads=` so `audit.py` finds them (it reads `lofi_finish` and `jazz_finish`). Add each new cue's name to `JAZZ` in `compose.py`.
- `palette.check(song, name)`: raises `PaletteError` naming cue, track and program or kit note.
- Fresh checkout: `bash tools/audio/fetch_bank.sh` (the card says `sh`, which fails on `pipefail`); on a machine with no apt lists run `apt-get update` first.
