# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. The game has no audio yet (the design doc defers sound), so its first reviews are a plan; the cue sheet will live in `docs/AUDIO.md` once audio work starts.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** AU78.

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
- Round 3 (1317ee3): stinger saturation headroom 5 + clean bell stem, −9 dB ducks under the big three, 2.5 s tonic cap, perk clamp, orphan fades, rare one-shot preload.
- Round 2 (3a45be1): all round-6 notes; stingers normalised after the mono fold with a tier check; bell doubling; triumphs/city/rep mix pass; HQ, sparse, crackle, claps, SFX tiers.

## Current state — lofi round 3 (1317ee3), audiocritic round 8 (medium, final of 3): ❌ NOT SATISFIED (advisory) — 1 major, 1 minor
Fixed (in code; not auditioned): AU73, AU74, AU75, AU60, AU61. The lofi loop is **closed after three rounds** as Julien asked. AU76 is a regression from the AU61 fix, so the composer gets one follow-up fix (AU76 + AU77) **without a fourth audiocritic round**; the codecritic's next full review covers it.

**Closing assessment (audiocritic):** structurally the score matches the brief. The six loops, Downtown sparse and all gameplay stingers share one lofi chain (tape wow, saturation, crackle, 7 kHz), loops −20 LUFS, stingers by tier; HQ keeps a clean 10 kHz-only chain at −19; rep stings, Dock Saved, triumphs and the city theme get the warmer story master at −18 and replace the loop. The remaining risk is the sound itself: nobody has listened.

| ID | Sev | Note | Fix |
| --- | --- | --- | --- |
| AU76 | major — fixed after the loop (unreviewed) | Collect (claims, chests, weekly, gift, offline popup) can be silenced as it starts: `emitAudio` runs before `set()`, so `warmRare`'s sweep removes the still-loading `collect/*` player (`playing` false) | A `firing` set of keys started by `fire()`, cleared on that play's `onEnd`; `warmRare` removes only the collect player it created and only if not firing; test "claim → store update → player still alive" |
| AU77 | minor — fixed after the loop (unreviewed) | Perk over a triumph: if the payoff is 3–5 s away, the payoff crash lands inside the perk's −6 dB story duck | Cap the duck at `min(perkLen, payoffAt − now − DUCK_UP_MS)`, or if the payoff is ≤ 1 s past the cap, wait for payoff + one beat |
| AU39 / AU40 / AU41 | — | Device checks (+ crackle under a podcast); `react-native-audio-api`; other-audio hint | Open (Julien) |
| AU25 | — | v2 arrangements, rush layer, Boston theme | Deferred |

**Audition checks for Julien (ring switch on; AirPods and speaker):**
1. `downtown_milestone_big` and `industrial_manager` over their loops: bell clear, not brittle; no pump/crunch on the arrival; clearly bigger than a plain milestone.
2. 10 min idle in Suburbs or Uptown: crackle a texture, not a tic; wow warm, not seasick; no audible seam; then a podcast underneath.
3. A MegaSlice scheme into its win: HQ still villainous against the lofi bed; the triumph crash lands with full energy.
4. Pier 9 bid → Dock Saved → bell triumph: the held A7 hands over cleanly; it feels like Waterfront's peak.
5. Fast buying + rush + a milestone: nothing clips or blurs; then a daily claim and the offline Collect: you hear Collect every time (AU76).

**Next ID:** AU78.
