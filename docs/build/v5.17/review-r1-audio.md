# Audio review — v5.17 r1 (low effort)

Scope: `src/audio/**` (card A1: output seam, `react-native-audio-api` for effects and stingers) and the open items AU76 and AU77. Read from code, tests and `docs/AUDIO.md`; nothing was run or listened to.

```
VERDICT: NOT SATISFIED
SUMMARY: The moment-to-cue mapping is unchanged and intact through the new mixer/output seam, and AU76 and AU77 are fixed in code with tests. The biggest gap is the new master "limiter": it hard-clips exactly the stacked peak it is documented to protect, which is the game's biggest gameplay moment.
MOMENTS:
- AU80 [minor] Perk card over a triumph, app backgrounded during the perk's duck: `duckStory`'s timer finds `pausedAt` set and skips the fade up; on resume the triumph plays its payoff at -6 dB. Restore gain 1 in `setAppActive`'s resume branch (or re-arm the fade).
MUSIC:
- none this round (score not in scope).
EFFECTS & MIX:
- AU78 [major] Big milestone (Whoomp + `milestone_big` + buy + cash pops): `limiterCurve` is defined on -1..1 and a WaveShaper clamps input beyond that, so every sum from 1.0 to the documented 1.25 worst case is flat-topped at 0.952. That is hard clipping on the rare big moment, not a soft knee. Scale before the shaper (master gain 0.8, so 1.25 maps to 1.0) and make the gain back after it, or build the curve over +/-1.25; add a test that 1.0 < x <= 1.25 is strictly increasing. Loops and story cues (expo-audio) bypass the shaper entirely; say so in AUDIO.md.
- AU79 [minor] Rush + fast buying at the 24-voice cap: the stolen voice is the oldest of all, which is the long stinger (up to 4 s), so small sounds cut the big one. Steal the oldest `sfx`-bus voice first; never a `sting` voice.
COST & PLATFORM:
- AU81 [minor] Hopping neighbourhoods on the City map: `unload` during a decode deletes the `loading` entry, then the decode's `then` stores the buffer anyway. Nothing tracks it, so it is never released (about 7 MB per key's stingers, against a 15 MB line). Keep a generation or cancelled set and drop the buffer if unloaded meanwhile.
- AU41 [minor, carried] Podcast before launch: the rule and tests are in, but `SliceAudioSession` does not exist, so `otherAudio()` is always null and Music starts over the podcast. Needs the ten-line native module (outside `src/audio/`).
FIXED SINCE LAST REVIEW: AU76 (`RarePlays` count per key; the sweep releases only a Collect `warm` made and only when not firing or playing; both outputs call `onEnd` on a failed load; mixer test covers claim then sweep), AU77 (`perkDuckSeconds` caps the duck at payoff minus the 400 ms ramp; logic test; cue sheet row updated).
STILL OPEN FROM LAST REVIEW: AU39, AU40, AU41 (device checklist K to N), AU25 (deferred).
```

Notes on the fixes:
- AU76: no mixer-level test of `perk()` timing against the fake output exists (only the pure `perkDuckSeconds`); worth one test when AU80 is fixed.
- AU77 residue: when the 3 s wait cap is hit and the payoff is 3 to 7 s away, the perk (2.6 to 4.1 s) still sounds across the payoff. The duck no longer covers the payoff, which was the note; whether the overlap reads cleanly is for the audition list (check 3).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU78 | major | A | `output-core.ts` `limiterCurve` / `output.native.ts` master | Sums of 1.0 to 1.25 hard-clip at 0.952; pre-scale by 0.8 or widen the curve to 1.25; test monotonic above 1.0 |
| AU79 | minor | A | `output.native.ts` `start()` voice cap | Steal the oldest `sfx`-bus voice at the 24 cap; never stop a sounding stinger |
| AU80 | minor | A | `mixer.ts` `duckStory` / `setAppActive` | Backgrounding during a perk duck leaves the triumph at -6 dB; restore gain 1 on resume; add a mixer test |
| AU81 | minor | A | `output.native.ts` `decode` / `unload` | Unload during decode resurrects the buffer untracked; drop the result if unloaded meanwhile |
| AU41 | minor | N | native module `SliceAudioSession` | Add `isOtherAudioPlaying()` (AVAudioSession `secondaryAudioShouldBeSilencedHint`); until then the other-audio rule never fires |
| AU39 | minor | A | DEVICE-CHECKLIST K | Device: launch hitch, time to title, resident memory of decoded buffers (about 10 MB against 15 MB) |
| AU40 | minor | A | DEVICE-CHECKLIST L, M | Device: tap-to-sound under about 50 ms; loop-point gap; stinger on the beat |
| AU25 | low | A | `tools/audio/**` | Deferred: v2 arrangements, rush layer, Boston theme |

Next IDs: AU82
