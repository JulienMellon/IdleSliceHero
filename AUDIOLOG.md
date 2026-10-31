# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. The game has no audio yet (the design doc defers sound), so its first reviews are a plan; the cue sheet will live in `docs/AUDIO.md` once audio work starts.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** AU76.

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
- Round 2 (3a45be1): all round-6 notes; stingers normalised after the mono fold with a tier check; bell doubling; triumphs/city/rep mix pass; HQ, sparse, crackle, claps, SFX tiers.

## Current state — lofi round 2 (3a45be1), audiocritic round 7 (medium): ❌ NOT SATISFIED (advisory) — 1 major, 2 minor
Fixed (from code and measurements only, nothing auditioned): AU62, AU63, AU64, AU65, AU67, AU68, AU69, AU70, AU71, AU72. Round 2 also: stingers on tier exactly (bottleneck/offline −22 … milestone_big −16), triumphs/city/rep −18 LUFS, HQ −19.3, sparse −22, 13.27 MB.

| ID | Sev | Note | Fix |
| --- | --- | --- | --- |
| AU73 | major | `post.lofi_sting` `tape_sat(a, 3.0)` caps peak ≈ 9.5 dB over RMS (RMS measured before the tail is trimmed): ~7.5 dB off the milestone_big/manager/build arrival, heavy odd harmonics, bass modulating the celesta; 7 kHz roll-off dulls the AU62 bell | Headroom 5 on the trimmed file; bell as a separate stem added after saturation with a 10 kHz roll-off; let the limiter catch ms bell transients; size hierarchy by ducking the loop −9 dB under milestone_big/manager/build; listen to downtown_milestone_big and industrial_manager before closing |
| AU74 | minor | Downtown's 1.82 s bar is under `LONG_BAR_SECONDS`, so the tonic search still reaches 2 bars (~5.5 s worst case) | Cap the search by seconds: accept bar k only while `first + k·bar ≤ 2.5` |
| AU75 | minor | Perk waits only when the payoff is < 3 s away; further away it plays at once over the build-up (supersedes AU66); its timer is in `pendingCues`, so a panel change drops it | `delay = clamp(wait, 0, 3)`; duck the story player −6 dB for the perk if the payoff is still ahead; keep the perk timer out of `clearPendingCues()` |
| AU60, AU61 | minor | Carried (orphaned stinger fade; rare one-shot preload) | See archive |
| AU39 / AU40 / AU41 | — | Device checks (+ crackle under a podcast); `react-native-audio-api`; other-audio hint | Open (Julien) |
| AU25 | — | v2 arrangements, rush layer, Boston theme | Deferred |

**Next ID:** AU76.
