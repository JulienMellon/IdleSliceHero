# NOTES-R2 measures: Julien's notes on the R2 reel (2026-11-19 to 2026-11-22)

Fresh checkout: the soundfont (bank C, sha256 f9a37b36...) was fetched, and one full build on the unchanged code reproduced `assets/audio` byte for byte (33,249,842 B), so the "before" numbers below come from that build's `report.json`. Loops were not touched, so no loop audit was re-run.

## The table

| # | His words | Cues | What I changed | Measured result |
|---|---|---|---|---|
| 1 | "I am going to need to hear the entire score when you are finished please. Sample at a bitrate that is higher than the one used for the recent reel. Raise the cap on file size limit to 32MB" (2026-11-19) | every cue | Nothing new: already done in card M2c (`KBPS = 256` in `build.py`, `src/audio/__tests__/logic.test.ts` caps the total at 32 * 1024 * 1024, full-score reel built). Checked, not rebuilt. | `KBPS` 256 for music, stingers and story; total 33,015,520 B against the 33,554,432 B cap (0.51 MiB margin). The card's check line still says 14,680,064; Julien's 32 MB replaces it. |
| 2 | "Encode at 256kbps and increase the bit depth where possible while staying within the size limit" (2026-11-19) | every cue | Nothing new: already done in card M2c. AAC has no bit depth; the encoder is fed 32-bit float (`post.encode`, `float_in=True`) and the 32-bit float WAV masters are kept in `build/master`. SFX stay 16-bit in at 64 kbps because they did not change. | Same total as row 1. Stingers measure 94 to 168 kbps (little above 7 kHz to code), loops and story at the requested 256. |
| 3 | "No the stingers and story moments do not sit well over the music" (2026-11-22) | the 12 stinger kinds that play over a ducked loop (all six neighbourhoods) and `victor_exit` | He named no cue and no direction. I measured the three differences that I can: brightness (median share of energy above 5 kHz: loops 0.29%, stingers 0.05%, story 0.09%, so the stingers are darker than the loops, not brighter, and I left the 7 kHz and 10 kHz roll-offs alone), key and bar (already aligned to chord I by the director) and level (the stinger sat +3 to +13 LU above the ducked loop). I changed the level only: `STING_LUFS` in `build.py` down 2 to 3.5 LU (bottleneck and offline included), `victor_exit` -16 to -19. Kept: perk at -20 (layered over exclusive cues, where the loop is silent), triumphs, city theme, rep stings, recipe and reunion (exclusive: the loop is off). The ladder keeps D5's order with 1 LU between rungs, because a first try with manager = build failed the build's momentary-max check by up to 0.8 LU. | Mean LUFS over the six neighbourhoods, before to after, then the cue over its ducked loop (loop -20, minus the director's duck): bottleneck -22.0 to -24.0 (+1.0 to -1.0 LU), upgrade, fleet, drone -20.0 to -23.0 (+6.0 to +3.0), milestone -19.1 to -22.0 (+6.9 to +4.0), welcome -19.0 to -22.0 (+9.0 to +6.0), warmth -20.0 to -23.0 (+8.0 to +5.0), manager -17.2 to -19.5 (+11.8 to +9.5), build -17.3 to -20.5 (+11.7 to +8.5), milestone_big -16.6 to -18.6 (+12.4 to +10.4), offline -22.0 to -25.0 (+6.0 to +3.0), bid -18.1 to -21.0, victor_exit -16.0 to -19.0, perk unchanged. Hierarchy check (manager, build, milestone, upgrade, bottleneck, integrated and momentary max) passes in all six neighbourhoods. |
| 4 | "Record as deviations (Recommended)" (2026-11-22, AU83) | `downtown`, `university` | `docs/AUDIO.md` (the groove table's deviation note): "not yet confirmed by Julien" now says it was agreed on 2026-11-22. No code change. | Loops identical to the baseline build (git shows no change under `assets/audio/music`). |

Row 3 is a guess at the cause, so say which cue and which way if it is wrong. The bottleneck is now 1 LU under its ducked loop (its duck is -3 dB); the duck is in `src/audio`, which is not mine.

## Cues rebuilt

Full build (more than five cues changed), then `git checkout -- assets/audio/sfx`. 67 stingers and `victor_exit` changed; the 8 loops, 11 other story cues and the SFX are byte-identical to before. Per-cue seconds, LUFS, peak and KB for every file are in `tools/audio/build/report.json`; the tier check passes for all of them.

| Cue group | Seconds | LUFS (tier) | Peak dBFS | Seam | KB | GM programs in front | Lead minus bed |
|---|---|---|---|---|---|---|---|
| 67 stingers (`sting/*`, not the six perks) | unchanged | see row 3 | -13.7 to -6.0 | n/a | 5.73 MB in all 73 (was 5.95) | unchanged | not asked |
| `victor_exit` | 3.2 | -19.0 (-19.0) | -9.5 | n/a | unchanged length | unchanged (vibraphone 12, upright bass 33) | not asked |

Audio total: 33,015,520 B = 31.49 MiB, under the 32 MiB cap (33,554,432 B).
