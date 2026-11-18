# Audio review — v5.18 r2 (medium re-check)

Scope: `src/audio/**`, `tools/audio/**`, `docs/AUDIO.md`. Card A2's v2 steps stay carried to v5.19 (Julien). I can't listen, so this judges routing, code and the cue sheet only.

```
VERDICT: SATISFIED
SUMMARY: Boston's story cues now reach the mixer: the director finds scenes through SCENE_INDEX (every city, each with its city), so welcome, triumph, bell-triumph, reunion, victor-exit, city-theme and the MegaSlice HQ bed all fire. I can't listen, so this judges routing and code, not sound; the open items left are three device or native checks.
MOMENTS:
- none new
MUSIC:
- none new. Boston plays the home city's loops by build-order index (AU25 deferred to v5.19, not re-raised).
EFFECTS & MIX:
- none new
COST & PLATFORM:
- AU41, AU39, AU40 [minor, carried] native other-audio probe and device checks. Not re-raised in substance.
FIXED SINCE LAST REVIEW: AU85, AU86, AU87, AU82
STILL OPEN FROM LAST REVIEW: AU41, AU39, AU40, AU25 (deferred)
```

## Checks
- AU85 fixed. `logic.ts:32` builds `SCENE_INDEX` from `Object.values(CITIES).flatMap(c => c.scenes)`. `director.ts onPanel` reads it, takes `found.city`, and `soundOf(scene.neighborhood, found.city)` picks the hood. The test at `logic.test.ts:163` checks that every scene of every city resolves with its city, that each triumph, bell-triumph and megaslice cue exists in the manifest, that every beat 4 has an exclusive cue, and that no id is shared between cities.
- AU87 fixed. `cityOfScene` takes the scene's own city for `home`, the sparse chart and `handle`'s `sceneHood`. A replay from a Boston save sounds like home. `downtownFull` still reads the open game's city, which is correct.
- AU86 fixed. `docs/AUDIO.md:173-179` describes the index mapping, the scene-city rule, the Downtown bed for a missing loop, and the v2 carry-over.
- AU82 fixed. The limiter paragraph at line 157 now has 1/1.25 gain, the 0.9956 peak and the bypass note. "never above 0.96" is gone.
- AU41: `output.native.ts` still treats `isOtherAudioPlaying` as an optional native probe that no build ships, so the other-audio rule can't fire. Native work, outside `src/audio/`.
- No new assets, players or load paths. The silent switch and `mixWithOthers` are unchanged.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU41 | minor | A | native module `SliceAudioSession` | Add `isOtherAudioPlaying()`; until then the other-audio rule never fires (native work outside `src/audio/`) |
| AU39 | minor | A | DEVICE-CHECKLIST K | Device: launch hitch, time to title, resident memory of decoded buffers (about 10 MB against 15 MB) |
| AU40 | minor | A | DEVICE-CHECKLIST L, M | Device: tap-to-sound under about 50 ms; loop-point gap; stinger on the beat |
| AU25 | low | A | `tools/audio/**` | Deferred to v5.19: v2 arrangements, rush layer, Boston theme and per-city bundles |

Next IDs: AU88
