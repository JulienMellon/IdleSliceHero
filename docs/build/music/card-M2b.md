# Card M2b — six triumphs and the city theme (R2)

**Goal:** the win moments pay off in the loop language: an arrival you can feel in the harmony and the bass, with no brass and no crash, landing at the same second as today.

**Read first:** your brief and the plan sections it names (2.5 is yours); the "language" section of `docs/build/music/reports/M1a.md`; `tools/audio/jazz.py`; in `compose.py`: the `HOODS` and `LEGACY` tables, `sed -n '/^def groove/,/^def megaslice/p' tools/audio/compose.py` (`groove`, `triumph`), and `sed -n '/^def city_theme/,/^    downtown()/p' tools/audio/compose.py`; the triumph and city-theme entries of the cue sheet: `grep -n "triumph\|city_theme\|City theme" docs/AUDIO.md | cut -c1-400`; `grep -n "STORY_MASTER" -B1 -A2 tools/audio/build.py`.

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/build/music/reports/M2b.md`.
- Do not edit in this card: the loops, the stingers, `megaslice`, `reunion`, `recipe`. Do not edit `src/audio/*.ts`: the director reads `payoffSeconds` from the generated manifest.

## Steps
Run `sh tools/audio/fetch_bank.sh`, then one full build if `tools/audio/build/report.json` is missing.

- [ ] **0. Before.** `grep -n "triumph_\|city_theme" src/audio/manifest.ts | cut -c1-260 > /tmp/story-before.txt`. Copy each cue's `seconds`, `downbeatSeconds` and `payoffSeconds` into the measures file as the "before" columns. These are the targets.
- [ ] **1. Tempos.** Retire `LEGACY`: each triumph plays at its neighbourhood's loop tempo and swing from `HOODS`. Cut bars so the arrival chord lands within 0.25 s of the old `payoffSeconds` and the cue stays within 1.0 s of its old length. If a cue can't meet both, meet the payoff time and say so.
- [ ] **2. The build-up** (`groove`, `triumph`). Swung brushes, the Rhodes and vibraphone rising through the voicing, a slow string (49) or warm pad swell under them, the motif's closing phrase on the neighbourhood's front instrument.
- [ ] **3. The arrival.** A wide maj9 or maj13 voicing of the tonic, a bass note an octave under the loop's bass, a soft bell, and a brush swirl ending on it. No cymbal crash, no timpani, no brass stab. The payoff is the same chord for every neighbourhood in its own key, so wins feel related.
- [ ] **4. Waterfront.** `triumph_waterfront` keeps its three ship's-bell strikes (tubular bells 14 or the bell stem, velocity as today or lower) and opens by resolving the bid's held A7 to D.
- [ ] **5. City theme.** The six neighbourhoods' front instruments take the motif in turn over one slow ii–V–I cycle per phrase, at one loop tempo (84 or under), ending on the same arrival chord as the triumphs. Same payoff rule as step 1.
- [ ] **6. Palette and build.** The seven cues join the `JAZZ` set. `python3 build.py triumph_downtown triumph_suburbs triumph_waterfront triumph_university triumph_industrial triumph_uptown city_theme 2>&1 | tail -8` passes its tier and ceiling checks. Measures file: before and after for seconds, `downbeatSeconds`, `payoffSeconds`; LUFS and peak; the arrival chord's momentary-max loudness against the cue's integrated loudness (the arrival must be the loudest 400 ms of the cue).

## Checks
`python3 -m py_compile tools/audio/*.py`; the build line; `npx jest src/audio 2>&1 | tail -5` (the payoff and perk-duck tests, AU77); `npx tsc --noEmit 2>&1 | tail -3`; `du -sb assets/audio | cut -f1` under 14680064.
