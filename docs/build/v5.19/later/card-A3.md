# Card A3 — three city audio bundles (v5.19, lane A)

(Checked 2026-11-18 against the refactor cards and the music round.)

> **Prerequisite:** card A2 (`docs/build/v5.18/card-A2.md`, the Boston theme and the per-city bundle) is done. A2 itself waits for the music rewrite (`grep -n '^round:' docs/build/music/STATE.md` prints `round: done`). If A2 is not done, report `BLOCKED` with `Needs: A2 first` and stop.

**Goal:** Chicago, New York and Los Angeles each have a theme, on the pattern card A2 built for Boston.

**Read first:**
- the "v2" section of `docs/AUDIO.md` as card A2 left it;
- the "musical idea" line of each city in `docs/story/CITIES-BIBLE.md` (`grep -n "musical idea" docs/story/CITIES-BIBLE.md`);
- the Boston entries in `src/audio/manifest.ts`.

## The code as the refactor left it
- **The bus** (card R5f): `src/audio/bus.ts` is built on `src/lib/bus.ts` `createBus`. `emitAudio`, `onAudio` and the `AudioEvent` union keep their names. Add event kinds to the union if you need them; don't bring back a hand-made listener set.
- **Home ids in the director:** `director.ts` still names `'waterfront'` twice: the bid stinger (`mixer.sting('waterfront', 'bid')`, about line 215) and the bell triumph (`'triumph_waterfront'`, about line 131). Card R1 left them to you (its report names them). The bid's neighbourhood is `cityOf(game).bid?.hood`, through `soundOf`. A city with no bid never emits `bid`, so keep the home cue as the fallback. Grep `grep -n "'waterfront'\|'downtown'" src/audio/*.ts`.
- **`audioHood`** (`src/audio/logic.ts`) maps another city's neighbourhoods onto the home neighbourhood at the same build position. It must return the city's own neighbourhood once that city's bundle has its loops.
- **City ids** are `chicago`, `newyork` and `la` (`CITY_ORDER`). Their folders are `src/content/cities/chicago`, `new-york` and `los-angeles` (VERSION.md's city table).
- **Imports:** `engine/game.ts` and the other shims are deleted by card R2b, which runs after you. Import the real modules (`engine/state`, `economy`, `purchases`…).

## Files
- Own: `src/audio/**`, `tools/audio/**`, `assets/audio/chicago|new-york|los-angeles/**`, `docs/AUDIO.md`.
- Shared, append-only: the `theme` key in each pack's `src/content/cities/<folder>/index.ts` (card CITY set it to `'city_theme'`).

## Steps
- [ ] **1.** For each city: a motif related to the home city's, six neighbourhood loops with their managed stems, the rush stem if the tempo family is new, and the stingers re-keyed. Reuse Boston's render pipeline. Add data, not code, wherever the pipeline allows.
- [ ] **2.** The showdown: one cue that combines the five city motifs, and the ending cue. Hook them to the scenes on card E4's `showdown` trigger (rounds 1–5, then 6 for the ending). These keep their energy; they are not lofi.
- [ ] **3.** Each city is its own bundle, loaded when the city becomes current. Print the size per bundle and the total. The audio test (`src/audio/__tests__/logic.test.ts`) caps `assets/audio` (14 MB before A2; A2 may have changed it). Don't raise the cap. If the bundles don't fit, report `PARTIAL` with `Needs:`: the size each bundle needs, and the cheapest cut (shared stems, a lower bitrate for stems, or downloading bundles on first use).
- [ ] **4.** A loudness table, as on card A2. Update `docs/AUDIO.md`.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/audio`; the render script's check (last 10 lines); `du -sh assets/audio/*`.
