# Card A3 — the shop's state by ear (v5.22, lane A)

**Prerequisite:** `docs/build/music/STATE.md` says `round: done`. If not, report `BLOCKED` with `Needs: music track done` and change nothing (this card owns the same files as the music rewrite).

**Goal:** three quiet sound effects that tell the player what the shop is doing without looking, each scaling with E3's symptoms.

**Read first:** `docs/AUDIO.md`; `src/audio/director.ts`, `mixer.ts`, `bus.ts`; E3's `symptoms`.

## Files
- Own: `src/audio/**`, `tools/audio/**`, `assets/audio/**` (three new SFX), `docs/AUDIO.md`.

## Steps
- [ ] **1. Sounds:** an oven-timer ding (soft, short) played once per baked batch waiting when the ovens' output is `piling`, at most one every 4 s; an old phone ring, 2 rings then silence, when the floor has a `line`, at most one every 30 s; a small bell on a tip (when the service state is tipping, one per 20 sales at most).
- [ ] **2. Level:** all three on the SFX bus, under the stingers' loudness tier, ducked under cut-scenes and stingers as other SFX are.
- [ ] **3. Settings:** they obey the SFX toggle; no new setting.
- [ ] **4. Tests:** the rate limits.

## Checks
`npx tsc --noEmit`; `npx jest src/audio`; the audio build's own checks (`docs/AUDIO.md`).

## Report
Standard format.
