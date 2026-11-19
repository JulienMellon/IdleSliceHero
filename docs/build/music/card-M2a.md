# Card M2a — gameplay stingers and the bid (R2)

**Goal:** every gameplay stinger, in all six neighbourhoods, is a short jazz tag in the loop language, on the same tiers and timings as today.

**Read first:** your brief and the plan sections it names (2.5 is yours); any `extra:` notes file in your task; the "language" section of `docs/build/music/reports/M1a.md`; `tools/audio/jazz.py`; `tools/audio/palette.py`; in `compose.py`: `sed -n '/^# =.* STINGERS/,/^def groove/p' tools/audio/compose.py` (`STING_KINDS`, `phrases`, `rh_bed`, `mallet_swell`, `brush_swirl`, `bell_program`, `stingers`, `bid_sting`); the stinger section of the cue sheet: `sed -n '/^## Gameplay stingers/,/^## /p' docs/AUDIO.md | cut -c1-500`; `grep -n "STING_LUFS" -A 3 tools/audio/build.py`.

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/build/music/reports/M2a.md`.
- Do not edit in this card: the loops, `groove`, `triumph`, `megaslice`, `reunion`, `recipe`, `city_theme`.

## Steps
Run `sh tools/audio/fetch_bank.sh`, then one full build if `tools/audio/build/report.json` is missing. Before changing anything, save today's stinger lengths and `downbeatSeconds`: `grep -n "downbeatSeconds" src/audio/manifest.ts | cut -c1-140 > /tmp/stings-before.txt`.

- [x] **1. The tag.** One shape for all twelve kinds (`bottleneck`, `milestone`, `milestone_big`, `manager`, `upgrade`, `fleet`, `drone`, `welcome`, `warmth`, `build`, `perk`, `offline`): a swung phrase from the city motif over one maj9 or min9 voicing of the neighbourhood's tonic, on that neighbourhood's R1 front instruments, with a soft bell colour (celesta, vibraphone or glockenspiel at velocity 60 or under; `bell_program` and the bell stem stay). Kinds differ by length, register and how much of the band plays, as they do today: `bottleneck` is two or three notes; `milestone_big`, `manager` and `build` get the full bed, a brush swirl into the arrival and a bass note under it.
- [x] **2. All six keys.** Downtown's tags use the 6/8 helpers. Beat 1 stays at `T0`, so `downbeatSeconds` stays what the director expects. Each stinger's length stays within 0.5 s of its value in `/tmp/stings-before.txt`.
- [x] **3. The bid.** `waterfront_bid` still ends on a held A7 (voiced as A13 or A9 is fine; the root and the seventh must sound) with nothing after it, so the Dock Saved triumph can resolve it to D.
- [x] **4. Palette.** Every stinger and its bell stem joins the `JAZZ` set. No program from the banned list anywhere in `stingers` or `bid_sting`.
- [x] **5. Build and measure.** Build all stingers (the names with kind `stinger` in `build/midi/manifest.json`, as one `python3 build.py <names…> 2>&1 | tail -6`). Every tier check passes. Measures file: one row per kind with the six neighbourhoods' LUFS, peak and seconds, the tier, and the length before and after.

## Checks
`python3 -m py_compile tools/audio/*.py`; the stinger build line; `npx jest src/audio 2>&1 | tail -5` (the stinger timing tests); `npx tsc --noEmit 2>&1 | tail -3`; `du -sb assets/audio | cut -f1` under 14680064.
