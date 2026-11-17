# Audio review — v5.17 r2 (medium re-check)

Scope: `src/audio/**`, the open IDs from r1 (AU78 first). Read from code, tests and `docs/AUDIO.md`. Nothing was run or listened to; the game can't be heard from here, so Julien's device checks (AU39, AU40) stay the only judge of how it sounds.

```
VERDICT: SATISFIED
SUMMARY: The limiter now carries the 1.25 worst case without hard clipping, and AU79, AU80 and AU81 are fixed in code with tests; the moment-to-cue mapping is unchanged. Nothing new above low severity; what remains is the device checks, the native module for other-audio, and a stale paragraph in AUDIO.md.
MOMENTS:
- none new.
MUSIC:
- none (score not in scope).
EFFECTS & MIX:
- AU82 [low] `docs/AUDIO.md` line 157 still describes the old curve ("never above 0.96") and does not say that music loops and story cues (expo-audio) bypass the shaper. Real values: master gain 1/1.25, curve laid over +/-1.25, linear to 0.8, peak about 0.9956. Update the paragraph.
- AU79 residue (no ID, ignorable): if every live voice is a stinger and the new voice is an effect, nothing is stolen and the count reaches 25. Harmless; the test covers the all-stinger case.
COST & PLATFORM:
- AU41 [minor, carried] `SliceAudioSession` still does not exist, so `otherAudio()` is always null. Native module owner.
- AU39, AU40 [minor, carried] device checks.
FIXED SINCE LAST REVIEW: AU78, AU79, AU80, AU81
STILL OPEN FROM LAST REVIEW: AU41, AU39, AU40, AU25 (deferred)
```

## Verdicts on the open IDs

- **AU78 fixed.** `output.native.ts` sets master gain to `1 / LIMITER_RANGE` (0.8) in front of the WaveShaper. `limiterCurve` in `output-core.ts` maps its -1..1 input to a signal of -1.25..1.25: linear to the 0.8 knee, then `tanh`, so the last point is about 0.9956. The signal range 1.0 to 1.25 therefore reaches the curve's end instead of clamping at 0.952, and below the knee the output level equals the input level (no loss). The tests in `mixer.test.ts` check this directly: strictly rising across 1.05, 1.1, 1.15, 1.2 and 1.25, the last point above 0.99 and below 1, and a monotonic, odd curve.
- **AU79 fixed.** `voiceToSteal` picks the oldest `sfx`-bus voice and never a `sting`; `start()` uses it and skips the stolen voice from the count at once. Test covers under cap, mixed, all-stinger.
- **AU80 fixed.** The resume branch of `setAppActive` calls `out.fade(story, 1, DUCK_UP_MS)` after `out.resume`. The new mixer test pauses during a perk duck, lets the restore timer fall due, resumes, and expects the fade to 1.000 after the resume. The r1 suggestion of a perk-timing mixer test is met.
- **AU81 fixed.** `decode` captures `loadEpoch` and drops the buffer if `unload` bumped it, so nothing resurrects untracked and `bytes` stays consistent. Only the `Epochs` helper is tested, not the decode race itself; that is acceptable for a minor.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU82 | low | A | `docs/AUDIO.md` line 157 | Update limiter paragraph: gain 1/1.25, curve over +/-1.25, peak 0.9956; say loops and story cues bypass it |
| AU41 | minor | A | native module `SliceAudioSession` | Add `isOtherAudioPlaying()`; until then the other-audio rule never fires (needs native work outside `src/audio/`) |
| AU39 | minor | A | DEVICE-CHECKLIST K | Device: launch hitch, time to title, resident memory of decoded buffers (about 10 MB against 15 MB) |
| AU40 | minor | A | DEVICE-CHECKLIST L, M | Device: tap-to-sound under about 50 ms; loop-point gap; stinger on the beat |
| AU25 | low | A | `tools/audio/**` | Deferred: v2 arrangements, rush layer, Boston theme |

Next IDs: AU83
