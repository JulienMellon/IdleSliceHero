# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. The game has no audio yet (the design doc defers sound), so its first reviews are a plan; the cue sheet will live in `docs/AUDIO.md` once audio work starts.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** AU62.

## Current state — v4.6, round 5 (full review): ❌ NOT SATISFIED (advisory) — one blocker, fixed after the review

The audiocritic reports no other blockers for v1 audio. The first five device checks below must pass before submitting.

| ID | Sev | Note | Status |
| --- | --- | --- | --- |
| AU57 | major | Dock Saved: a `rep` cue held for the bid stinger (no `musicSeconds`, 3.99 s) could fire after the bell triumph and cut the win | **Fixed after the review:** pending cues are dropped when the panel changes (`onPanel` → `clearPendingCues`, `afterHeld` checks the panel); `waterfront_bid` `musicSeconds` 2.6 s |
| AU58 | minor | Tonic wait: Downtown B (bars 33–48) has no I bar; the Industrial and Uptown waits can reach 7–8 s | Open: cap the wait at 1.5 s; render a deceptive-cadence variant for vi bars |
| AU59 | minor | Stingers measure about 3 LU under their tiers (normalised in stereo, then folded to mono); no check; doc counts drift (29 SFX players at start-up, 33 total) | Open: normalise after the mono fold; extend the 0.5 LU check to stingers; fix the tables in docs/AUDIO.md |
| AU60 | minor | A stinger orphaned by a key change (the build stinger after the preload) can't be faded by Skip or Music off | Open: keep orphans in a set that `stopStings` fades; skip `build` in the preload while it is held |
| AU61 | minor | Rare one-shots are created at play time (latency), and their release timer counts from the call | Open: preload collect, build and gavel when they become relevant; release on finish or after length + 300 ms |
| AU39 / AU40 / AU41 | — | Device measurements; the `react-native-audio-api` decision; no "other audio playing" hint | Open (Julien) |
| AU25 | — | v2: manager-state arrangements, a rush layer, the Boston theme | Deferred |

**Device checks (priority order):**
1. The silent switch and a podcast underneath; resume after a call or Siri.
2. Tap-to-sound time (< 50 ms), and first-sound time for gavel, build and collect.
3. Gapless AAC loops.
4. Worst-case stacking for clipping.
5. Memory and launch hitch (< ~15 MB).
6. `playbackRate` jitter.
7. Dock Saved, tapped quickly and hands-off.
8. The offline celesta on a cold launch and on a return from the background.
