# Card A6 — splash theme, the three shop-ear sounds, renovation and gift sounds (v5.25, lane A)

**Goal:**
- `splash_theme` plays on the splash screen.
- `oven_ding`, `phone_ring` and `tip_bell` are actually heard in play (today they have call sites in ShopEars but players never hear them).
- Renovating and opening a free gift each have a sound from the existing bank.

No new audio is composed.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/WAVE-NOTES.md` (event names `renovated` and `free_gift_claimed`); `docs/AUDIO.md` (cue sheet); `src/audio/manifest.ts` (~99 `splash_theme`, ~109-128 SFX); `src/audio/director.ts` (~146, ~211-274); `src/audio/shop-ears.ts`; `docs/build/music/STATE.md` (line 15).

## Files
- Own: `src/audio/**` and its tests, plus `docs/AUDIO.md`. The splash screen's single line that tells the director the splash is showing: if that screen is outside `src/audio`, write `Needs: U7 splash hook <the call>` instead of editing it.
- Do not touch: `tools/audio/**` and `assets/audio/**` (nothing is re-rendered).

## Steps
- [ ] **1. splash_theme:** the director plays it while the splash shows and crossfades it into `city_theme` when play starts. Muted settings are respected.
- [ ] **2. Shop ears:** find why the three sounds are never heard: their gate, a volume of 0, a trigger that never fires, or a duck that always wins. Make each one play at its moment (oven done, phone order, tip). Keep the rate limits so none repeats more than once per 8 s. A test fires each moment and expects one play.
- [ ] **3. New moments:** `renovated` plays the bank's biggest celebratory SFX (`sparkle`, `gavel` or a layered pair, your pick, named in AUDIO.md), and `free_gift_claimed` plays a lighter one. Neither stacks with a third sound in the same 300 ms.
- [ ] **4. AUDIO.md:** update the cue sheet rows for the splash, the three shop ears, renovation and the gift.

## Checks
- `npx tsc --noEmit`
- `npx jest src/audio`
- `npm run format:check`

## Report
Standard format, plus the reason the three were unheard, and any `Needs:` line.
