# Card M1b — Suburbs, Waterfront, University (R1)

**Goal:** three more loops in the language card M1a built. Add data and charts; change a helper in `jazz.py` only if a loop can't be written without it, and say so.

**Read first:** your brief and the plan sections it names; the "language" section of `docs/build/music/reports/M1a.md`; `tools/audio/jazz.py`; `tools/audio/palette.py`; in `compose.py` the `HOODS` table, `play_sections`, and the functions `downtown` (as the worked example), `suburbs`, `waterfront`, `university`; the three rows of the loops table: `grep -n "^| Suburbs\|^| Waterfront\|^| University" docs/AUDIO.md | cut -c1-900`.

## Files
- Own: `tools/audio/**` except `sfx.py`; `docs/build/music/reports/M1b.md`.
- Do not edit in this card: Downtown's charts, the other loops, or any stinger, triumph or story function. Changing a `lead` in `HOODS` changes that neighbourhood's stingers too; that is accepted this round, but their tier checks must still pass.

## Steps
Run `sh tools/audio/fetch_bank.sh`, then one full build if `tools/audio/build/report.json` is missing. Each loop keeps its key, tempo, metre, bar count and section plan, opens on a lead-free bed, states the motif at most twice, and has a lead-free bed before it returns. Each joins the `JAZZ` set, so the palette check covers it.

- [ ] **1. Suburbs** (G, 86 BPM, 58% swing, 32 bars). Vibraphone and clean guitar over Rhodes comping. The brushed march becomes a swung backbeat: cross-stick on 2 and 4, ride pattern, no snare-drum march figure. Out: muted trumpet, steel-guitar strum, claps. The glockenspiel may stay only as single notes at velocity 40 or under. Upright bass, two-feel in the A sections and walking in the B.
- [ ] **2. Waterfront** (D Mixolydian, 80 BPM, 56% swing, 32 bars). Marimba and harp over Rhodes; the ♭VII stays (Cmaj9 as a backdoor colour to D). The habanera bass becomes a gentle two-feel that keeps the habanera's dotted figure once every two bars. Shaker and brushes. Out: fiddle, the accordion pad, congas.
- [ ] **3. University** (B♭, 76 BPM, 60% swing, 32 bars). Rhodes with wide maj9 and min9 voicings; vibraphone or a soft bell on top. The chiptune arpeggios (note, octave, fifth) move to kalimba (108) or celesta at velocity 50 or under. The synth bass becomes a round electric or upright bass. A lofi hip-hop pocket: kick slightly late, the swing a touch heavier than the other loops. Out: the square lead.
- [ ] **4. Lead level.** `python3 audit.py suburbs waterfront university`: lead minus bed between −2 and −4 LU on each.
- [ ] **5. Build and measure.** `python3 build.py suburbs waterfront university 2>&1 | tail -5` passes. Then check that these three neighbourhoods' stingers still land on their tiers: `python3 build.py $(python3 -c "import json;print(' '.join(k for k,v in json.load(open('build/midi/manifest.json')).items() if v.get('kind')=='stinger' and v.get('hood') in ('suburbs','waterfront','university')))") 2>&1 | tail -3`. Write the measures file.

## Checks
`python3 -m py_compile tools/audio/*.py`; the two build lines; the audit line; `npx jest src/audio 2>&1 | tail -5`; `npx tsc --noEmit 2>&1 | tail -3`; `du -sb assets/audio | cut -f1` under 14680064.
