# Card M1a — the jazz language, Downtown and Downtown sparse (R1)

**Goal:** the lofi-jazz language exists once, as helpers and a palette check that the build enforces, and Downtown and its sparse chart are written in it.

**Read first:** your brief and the plan sections it names; the `extra:` files in your task (Julien's bank answer and notes; the letter table); `sed -n '/^## The city motif/,/^## Story cues/p' docs/AUDIO.md | cut -c1-600`; `tools/audio/mlib.py`; `tools/audio/material.py`; `sed -n '1,181p' tools/audio/compose.py` (tables and helpers); `sed -n '/^def downtown/,/^# =.* 4\/4 shared/p' tools/audio/compose.py`.

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/build/music/reports/M1a.md`.
- Do not edit in this card: `stingers`, `bid_sting`, `groove`, `triumph`, `megaslice`, `reunion`, `recipe`, `city_theme` in `compose.py`, or the other five loops. They must still build.

## Steps
- [ ] **0. Bank.** Write the chosen bank's path to `tools/audio/BANK` (Julien's letter; if his answer names none, the recommendation in `reports/M0.md`). Run `sh tools/audio/fetch_bank.sh`. Then one full `python3 build.py > /tmp/build.log 2>&1; tail -3 /tmp/build.log` so `build/report.json` exists for this bank, and `git checkout -- assets/audio/sfx`.
- [ ] **1. Palette check** (`tools/audio/palette.py`). Program numbers are 0-based GM.
  - Banned: 21–23 (accordion, harmonica, tango accordion), 56–63 (brass), 64–71 (reeds), 80–81 (square and saw leads), 109–111 (bagpipe, fiddle, shanai). Organs 16–20 only on a track whose notes are all at velocity 50 or under.
  - Kit, banned notes: 41, 43, 45, 47, 48, 50 (toms), 49, 52, 55, 57 (crash, china, splash), 54 (tambourine), 56 (cowbell).
  - `check(song, name)` raises with the cue, track and program. `compose.py` calls it for every cue in a set `JAZZ` (the cues rewritten so far). This card puts `downtown` and `downtown_sparse` in it; later cards add theirs; card M2c makes it every cue.
- [ ] **2. The language** (`tools/audio/jazz.py`), built on what `mlib.py` and `compose.py` already have (`swing_smooth`, `rh_voicing`, `humanize_ms`); don't fork them.
  - `voicing(root, degree, quality)`: rootless, close-voiced, every note between C3 and E4. Qualities: maj7, maj9, 6/9, min9, min11, dom9, dom13, sus13, dim7, min(maj7), and altered dominants (♭9, ♯11) for passing chords.
  - `comp(track, harmony, feel)`: a long chord on 1 and a quieter answer, anticipating the next chord by a swung eighth now and then (seeded, so the render is repeatable).
  - `bass_two_feel` and `bass_walk`: roots and fifths in half notes; quarter-note walking with chromatic approach tones into each new chord.
  - `brushes(drm, bars, feel)`: the ride pattern ("spang-a-lang": quarter, swung pair) on a brush tap or ride 51 at low velocity, a feathered kick (velocity 30–42), ghosted snare notes, cross-stick 37 on 2 and 4, pedal hat 44 on 2 and 4, a brush swirl every four or eight bars. A 6/8 feel and a triplet-shuffle feel as well as swung 4/4.
  - `laid_back(tracks, ms)`: shifts the kit 12–18 ms late and the bass 5–8 ms late; kick and snare get ±6 ms of their own.
  - Velocity humanising of ±8–12 through the existing `humanize_ms`.
  - Harmony helpers that return a bar-by-bar chord list **and** the `barRoots` that go to `finish()`: ii–V–I, I–vi–ii–V, tritone substitution, backdoor cadence (♭VII7 to I).
- [ ] **3. Downtown.** F major, 6/8, dotted quarter = 66, 52 bars, the same section plan (intro, A, bed, B, A2, bed). Rhodes comping is the centre; nylon guitar takes every line the accordion had, at velocity 56 or under, an octave lower where it sat above C5; a warm pad (89) very low; upright bass in a 6/8 two-feel; brushes in the 6/8 feel. Pizzicato strings are gone. The accordion track is deleted, not muted. Reharmonise with the helpers; keep one slow home area on F. The motif is stated at most twice and both beds stay lead-free.
- [ ] **4. Downtown sparse.** Nylon guitar and Rhodes only, on the same timeline. Add an assert in `compose.py` that its `barRoots` equal the full chart's.
- [ ] **5. Lead level.** Mark the nylon guitar's melody as the lead for `audit.py`. `python3 audit.py downtown downtown_sparse`: lead minus bed between −2 and −4 LU. Adjust track volume, not the mastering.
- [ ] **6. Build and measure.** `python3 build.py downtown downtown_sparse 2>&1 | tail -4` passes its seam, ceiling and tier checks. Write the measures file; add a short "language" section listing the helpers and their parameters, for the next two composers.

## Checks
`python3 -m py_compile tools/audio/*.py`; the build line above; `python3 audit.py downtown downtown_sparse | tail -3`; `python3 compose.py /tmp/midi-check > /tmp/c.log 2>&1; tail -2 /tmp/c.log` (every other cue still composes, 0 palette errors on the `JAZZ` set); `npx jest src/audio 2>&1 | tail -5`; `npx tsc --noEmit 2>&1 | tail -3`.

## Report
Add to `Needs:` the line `Bank: <letter> <file name>`.
