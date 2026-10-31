# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. The game has no audio yet (the design doc defers sound), so its first reviews are a plan; the cue sheet will live in `docs/AUDIO.md` once audio work starts.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** AU73.

## Owner direction — ON HOLD until Julien restarts audio work (2026-10-30)
> "Let's move stylistically toward a calmer, more lofi vibe."

- **Hold.** Don't rework the audio until Julien says so. When he does, this note comes first, before AU58–AU61. Composer and audiocritic both read it before planning.
- **Scope.** It changes the brief for the whole score: the six neighbourhood loops, the triumphs and the stingers. The audiocritic should re-plan against it rather than patch the current charts.
- **Constraints.** Keep the shared city motif and the neighbourhood identities, played calmer: they're what holds the score together.
- **First check with Julien:** how far the lofi brief goes into the story peaks. The MegaSlice villain cues and the win triumphs may still need their energy.

## Lofi loop (Julien, 2026-10-31): 3 composer → audiocritic rounds, advisory
- Scope chosen by Julien: the six loops (plus Downtown sparse) and the gameplay stingers go fully lofi; MegaSlice villain cues and win triumphs keep their shape and energy, with a warmer, lighter mix. Verdict is advisory and doesn't gate the build loop.
- Composer works in a worktree (branch `wip-audio`), the audiocritic reviews each commit, fixes go back to the same composer. Merged into `main` with the next build.
- Round 1 (cee8dc5): loops rewritten (Downtown ♩.=66, Suburbs 86, Waterfront 80, University 76, Industrial 76, Uptown 84; Rhodes/brush/bass bed; tape wow, crackle, 7 kHz roll-off), −20 LUFS; stingers lead + Rhodes, 2 LU lower; 13.26 MB. **Nobody has listened to the renders yet.**

## Current state — lofi round 1, audiocritic round 6 (full review): ❌ NOT SATISFIED (advisory) — 3 major, 8 minor

| ID | Sev | Note | Fix |
| --- | --- | --- | --- |
| AU62 | major | Milestone/manager/upgrade/bottleneck stingers now use the bed's own instruments (lead + Rhodes) and measure at or below the loop (bottleneck ~−25 LUFS over a −23 ducked loop) | Fix AU59 (normalise after the mono fold, +3 LU); a colour the bed lacks: celesta doubling the lead an octave up, vel ~50 (glock where the loop has none); brush swirl into the last bar of milestone/manager; drop the bottleneck's Rhodes I chord |
| AU63 | major | Tonic wait: at 76–80 bpm a bar is 3.0–3.16 s, so a stinger can land 9–9.5 s after the tap (supersedes AU58) | `maxBars = 0` when a bar > 2.5 s (next bar, −6 dB extra duck on a non-I bar); caps the wait at ~3.2 s; drop AU58's variant renders |
| AU64 | major | Lofi loop (−28 in a scene) → triumph at −16 LUFS: a 12 LU jump with crash 124, 24–30% faster, unswung; same for city_theme and rep | Mix pass: triumphs, city theme, rep at −18 LUFS through `tape_sat` + 10 kHz roll-off (no wow/crackle); crash 124→96, timpani 124→100; tempos and shapes kept |
| AU65 | minor | milestone_big barely bigger than milestone (2 LU, a soft vib swell) | Bass root + celesta octave on the arrival, brush-swirl crescendo, gap 3 LU (−19/−16) |
| AU66 | minor | Perk over a triumph drifts up to ~1 beat off the old grid | `case 'perk'`: wait for `payoffSeconds` (3 s cap); don't render perks at legacy tempos |
| AU67 | minor | downtown_sparse normalised to −20 like the full band, so Nonna's takeover adds no lift | Master `downtown_sparse` at −22 LUFS |
| AU68 | minor | Vinyl crackle: ~2% of pops reach −10 dB re RMS, ~10 clicks per loop in fixed places | Clip the exponential at 1.5; `pops_per_s` 4, `pop_db` −26 |
| AU69 | minor | Suburbs' muted trumpet is also MegaSlice's HQ stab/second-statement colour | HQ stabs and the villain's second statement → staccato trombone |
| AU70 | minor | (Q1) megaslice_hq is the only file over the ceiling (−4 dBFS) | −19 LUFS, −6 dBFS peak, no tape chain (10 kHz roll-off only) |
| AU71 | minor | (Q3) "Finger snaps" read as soft claps (fine); swing flams them unevenly (~35 ms) | Rename "soft claps"; exclude from swing or place on even triplets after swing |
| AU72 | minor | Constant SFX now 6 LU under the music instead of 8 | tap/full/cash −28, click/bubble −32; keep purchase/upgrade/build/collect tiers |
| AU60, AU61 | minor | Carried (orphaned stinger fade; rare one-shot preload) | See archive |
| AU39 / AU40 / AU41 | — | Device checks (add: crackle under a podcast); `react-native-audio-api`; other-audio hint | Open (Julien) |
| AU25 | — | v2 arrangements, rush layer, Boston theme | Deferred |

**Next ID:** AU73.
