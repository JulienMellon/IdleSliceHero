# Card A2 — Audio v2 and the Boston theme (v5.18, lane A)

**Goal:** the three items `docs/AUDIO.md` lists as v2 work (AU25): arrangements that change once a shop has a manager, a rush rhythm layer kept in time with the loop, and a theme for Boston.

**Read first:** `sed -n '7,38p;115,168p' docs/AUDIO.md` (the city motif, the neighbourhood loops, the mix rules, the platform budget, the lofi brief); `src/audio/manifest.ts`; `src/audio/output.ts` from v5.17; `ls tools/audio` and its README or entry script only.

## Files
- Own: `src/audio/**`, `tools/audio/**`, `assets/audio/**`, `docs/AUDIO.md`.
- Shared, append-only: `src/content/cities/boston/index.ts` (the `theme` key only).

## Steps
- [ ] **1. Managed arrangement.** Each neighbourhood loop gets a second stem that plays only while that shop has a General Manager: a fuller comp or a counter-melody on the same chords, mixed 3 dB under the lead. It is a stem, not a second loop: same length, same tempo, started on the loop clock. Crossfade over one bar when the manager is hired.
- [ ] **2. Rush layer.** A percussion stem per tempo family that fades in with the rush combo (two taps a second and above) and out over two bars when it ends, locked to the loop clock through the v5.17 output's scheduled start. The Game Day, boat and night-shift moments use it too, driven by the `gameday`, boat and shift pulses.
- [ ] **3. Boston theme.** A city motif for Boston related to the home city's (same interval shape, new mode or metre), six neighbourhood loops built from it in the lofi brief's palette, the stingers re-keyed. MegaSlice cues and win triumphs keep their energy, as decided on 2026-10-31.
- [ ] **4. Budget.** The audio folder is at 13.27 MB of a 14 MB cap. Boston's set won't fit in it: load a city's audio as its own bundle (`assets/audio/<city>/`), state the per-city size, and keep the home city's bundle under its cap. Report the totals; if the app's download size grows by more than 15 MB, say so under `Needs:`.
- [ ] **5. Loudness.** Loops −20 LUFS (sparse −22), stingers by tier as the cue sheet says; print the measured table.
- [ ] **6. Update `docs/AUDIO.md`:** the v2 section becomes a description of what exists.

## Tests
The director with a fake output: the managed stem starts and stops on bar lines; the rush layer follows the combo and the three pulses; a city change swaps bundles without a gap in SFX.

## Checks
`npx tsc --noEmit`; `npx jest src/audio`; the render script's own check, with its last 10 lines; `du -sh assets/audio/*`.
