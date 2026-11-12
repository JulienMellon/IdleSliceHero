# Card A3 — three city audio bundles (v5.19, lane A)

**Goal:** Chicago, New York and Los Angeles each have a theme, on the pattern card A2 built for Boston.

**Read first:** the "v2" section of `docs/AUDIO.md` as card A2 left it; the "musical idea" line of each city in `docs/story/CITIES-BIBLE.md` (`grep -n "musical idea" docs/story/CITIES-BIBLE.md`); the Boston entries in `src/audio/manifest.ts`.

## Files
- Own: `src/audio/**`, `tools/audio/**`, `assets/audio/chicago|new-york|los-angeles/**`, `docs/AUDIO.md`.
- Shared, append-only: the `theme` key in each city's `index.ts`.

## Steps
- [ ] **1.** For each city: a motif related to the home city's, six neighbourhood loops with their managed stems, the rush stem if the tempo family is new, stingers re-keyed. Reuse Boston's render pipeline; add data, not code, wherever the pipeline allows.
- [ ] **2.** The showdown: one cue that combines the five city motifs, and the ending cue. These keep their energy; they are not lofi.
- [ ] **3.** Each city is its own bundle, loaded when the city becomes current. Print the size per bundle and the total. If the total app download grows past what card A2 reported plus 30 MB, say so under `Needs:` with the cheapest way to cut it (shared stems, lower bitrate for stems).
- [ ] **4.** Loudness table as on card A2. Update `docs/AUDIO.md`.

## Checks
`npx tsc --noEmit`; `npx jest src/audio`; the render script's check, last 10 lines; `du -sh assets/audio/*`.
