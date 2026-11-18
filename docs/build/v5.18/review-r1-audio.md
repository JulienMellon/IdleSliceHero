# Audio review — v5.18 r1 (full)

Scope: `src/audio/**`, `tools/audio/**`, `docs/AUDIO.md`. Card A2's v2 steps (managed stems, rush layer, Boston theme, per-city bundles) were carried to v5.19 by Julien, so this version only adds the Boston fallback: `audioHood` in `logic.ts`, the director resolving every neighbourhood through `soundOf`, the director's `hoodIds(cityOf(...))` and the catalog's Downtown stand-in for a missing track. I read the code, the tests and the cue sheet, and checked them against the Boston scene files. I can't listen to anything, so I judged routing, not sound. `tools/audio/**` has no v5.18 change. IDs start at AU85 because the music track's R1 review already used AU79 to AU84 (its STATE says the next ID is AU85).

```
VERDICT: NOT SATISFIED
SUMMARY: The Boston fallback maps loops, stingers and triumphs correctly through audioHood, but none of Boston's story cues will ever fire: the director only looks up home-city scenes, so every Boston panel cue (welcome, triumph, reunion, Victor's exit, city theme, the HQ villain bed) is dropped. I can't listen, so this review judges routing and code, not sound.
MOMENTS:
- AU85 [major] Every Boston scene → missing (code drops the cue) → director.ts:22 builds `SCENES` from `HOME_SCENES` only, so `onPanel` returns at `if (!scene) return` for fenway-1, north-end-4 and every other Boston scene. The result: no welcome or warmth stinger, no `triumph_<hood>`, no bell triumph (north-end), no reunion or `victor_exit` or `city_theme` (dorchester, north-end-1). `scenePanelCue` stays 'none', so the 12 `megaslice-hq` panels never switch the bed to `megaslice_hq`, and panel 0 no longer clears gameplay stingers (AU27). Fix: build the map from `Object.values(CITIES).flatMap((c) => c.scenes)` (or read `useGame.getState().playing.scene`). Add a logic test that every city's scene ids resolve, and that every Boston beat 4 resolves to a triumph cue in the manifest through `audioHood`.
- AU87 [minor] Replaying a home Downtown scene from a Boston save → the full Downtown bed instead of the sparse chart (AU50 regresses). `refreshMusic` sets `home` from the *current* city and drops `beat` when it is false. If the City screen or the Scrapbook can replay earlier cities' scenes, take `home` from the scene's own city (for example `HOME_SCENES` membership).
MUSIC:
- No new score this version (music track R1 is separate). The stand-in rule, Boston's nth neighbourhood playing the home city's nth loop, is a fair placeholder: the city still sounds like one world, and the MegaSlice and triumph cues keep their emotional mapping once AU85 is fixed. AU25 (Boston's own theme) stays deferred and is not re-raised.
EFFECTS & MIX:
- AU86 [minor] `docs/AUDIO.md` doesn't describe the fallback. Add a line under "Open": another city plays the home neighbourhood at the same build-order index (`audioHood`), with the full chart (no sparse Downtown outside home). `bell-triumph` always plays `triumph_waterfront`, and a missing loop plays the Downtown bed (`CATALOG.music`).
- AU82 [low, carried] AUDIO.md line 157 still says "never above 0.96"; it is unchanged.
COST & PLATFORM:
- No cost change: no new assets, no new players, and `warmRare` reads the current city's neighbourhoods. The audio session settings are untouched.
- AU41, AU39, AU40 [minor, carried] native other-audio module; device checks.
FIXED SINCE LAST REVIEW: none
STILL OPEN FROM LAST REVIEW: AU82, AU41, AU39, AU40, AU25 (deferred to v5.19)
```

## Notes on what was checked
- `audioHood` (logic.ts:23): a home id returns itself, a Boston id maps by index (modulo 6), and an unknown id or city falls back to Downtown. The test in `logic.test.ts:147` checks that the loop, `triumph_<h>` and `<h>_milestone` exist in the manifest for every Boston neighbourhood. That covers the gameplay path (the active neighbourhood's bed, stingers, build motif, the offline celesta key, the perk). It does not cover the story path, where AU85 sits.
- Boston scenes set their cues explicitly through `kit.ts` (`{ cue: 'welcome' }`, `'triumph'`, `'bell-triumph'`, `'reunion'`, `'victor-exit'`, `'city-theme'`), and `panelCue` would map them correctly. Only the lookup is missing, so AU85 is a one-line fix plus a test.
- The bid path (`mixer.sting('waterfront', 'bid')`) is unchanged; no Boston scene is triggered by a bid.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU85 | major | A | `src/audio/director.ts:22` | Build `SCENES` from every city's scenes; test that every Boston scene id resolves and its beat-4 triumph maps to a manifest cue |
| AU86 | minor | A | `docs/AUDIO.md` "Open" | Describe the Boston fallback: index mapping, full chart outside home, bell-triumph to waterfront, Downtown bed for missing loops |
| AU87 | minor | A | `src/audio/director.ts` `refreshMusic` | Take the sparse-chart `home` flag from the scene's own city, not the current city, for replays |
| AU82 | low | A | `docs/AUDIO.md` line 157 | Update limiter paragraph: gain 1/1.25, curve over +/-1.25, peak 0.9956; say loops and story cues bypass it |
| AU41 | minor | A | native module `SliceAudioSession` | Add `isOtherAudioPlaying()`; until then the other-audio rule never fires (needs native work outside `src/audio/`) |
| AU39 | minor | A | DEVICE-CHECKLIST K | Device: launch hitch, time to title, resident memory of decoded buffers (about 10 MB against 15 MB) |
| AU40 | minor | A | DEVICE-CHECKLIST L, M | Device: tap-to-sound under about 50 ms; loop-point gap; stinger on the beat |
| AU25 | low | A | `tools/audio/**` | Deferred to v5.19: v2 arrangements, rush layer, Boston theme and per-city bundles |

Next IDs: AU88
