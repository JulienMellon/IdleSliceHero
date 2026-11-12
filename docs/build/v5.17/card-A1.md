# Card A1 — audio on device (v5.17, lane A)

**Goal:** fix the three device risks the audio plan left open (AU39 launch hitch and memory, AU40 tap-to-sound delay and gapless looping, AU41 other apps' audio) in the same development build that the ad and purchase SDKs already force.

**Read first:** `sed -n '115,160p' docs/AUDIO.md` (mix rules, platform and cost, the open device checks); `src/audio/manifest.ts`; then only the parts of `src/audio/director.ts` (704 lines) that create and play players: `grep -n "createAudioPlayer\|useAudioPlayer\|\.play(\|playbackRate" src/audio/*.ts`.

## Files
- Own: `src/audio/**`, `docs/AUDIO.md` (the "Open" section only), `package.json` (one dependency).
- Do not touch: `tools/audio/**`, `assets/audio/**`, anything outside `src/audio/`.

## Steps
- [ ] **1. An output interface.** `src/audio/output.ts`: `load(id)`, `play(id, { gain, rate, at? })`, `loop(id)`, `stop(id)`, `setBus(bus, gain)`. The director calls only this. `output.web.ts` keeps today's `expo-audio` behaviour, so the web build and its audio log in the screenshot run are unchanged.
- [ ] **2. `output.native.ts` on `react-native-audio-api`** for SFX and stingers: each buffer decoded once, a gain node per bus, a compressor as the master limiter, sample-accurate stinger timing against the loop clock. Music loops stay on `expo-audio` unless you can show a looping gap in code or docs; if you move them, loop by buffer source, not by restart.
- [ ] **3. Launch cost.** Load the title and Downtown sets first; load the rest after the first frame, a neighbourhood's stingers when its key becomes active. No more than about 12 players alive at start-up.
- [ ] **4. Other audio (AU41).** If the audio session reports that another app is playing, start with Music off for that session and leave the saved preference alone. Sound effects still play.
- [ ] **5. C102.** A second play of the same rare SFX within 1.5 s must not cut the first; with buffers this is two sources. Keep test T78 passing or update it.
- [ ] **6. Update `docs/AUDIO.md` "Open".** Say what moved, what stayed, and what only a device can still tell (the measurements in `docs/build/v5.17/DEVICE-CHECKLIST.md`).

## Tests
The director against a fake output: bus gains, stinger scheduling, overlap of the same SFX, the lazy-load order, the other-audio rule. Pure `.ts` only.

## Checks
`npx tsc --noEmit`; `npx jest src/audio`; `npx expo export --platform web > /tmp/e.log 2>&1; tail -2 /tmp/e.log`. You may run `npx expo install react-native-audio-api`.
