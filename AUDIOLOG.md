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
| AU77 | minor — fixed after the loop (unreviewed) | Perk over a triumph: if the payoff is 3–5 s away, the payoff (the triumph's arrival chord; a crash before the 2026-11-19 rewrite) lands inside the perk's −6 dB story duck | Cap the duck at `min(perkLen, payoffAt − now − DUCK_UP_MS)`, or if the payoff is ≤ 1 s past the cap, wait for payoff + one beat |
| AU39 / AU40 / AU41 | — | Device checks (+ crackle under a podcast); `react-native-audio-api`; other-audio hint | Open (Julien) |
| AU25 | — | v2 arrangements, rush layer, Boston theme | Deferred |

**Audition checks for Julien (ring switch on; AirPods and speaker):**
1. `downtown_milestone_big` and `industrial_manager` over their loops: bell clear, not brittle; no pump/crunch on the arrival; clearly bigger than a plain milestone.
2. 10 min idle in Suburbs or Uptown: crackle a texture, not a tic; wow warm, not seasick; no audible seam; then a podcast underneath.
3. A MegaSlice scheme into its win: HQ's villain motif sits in the lofi bed without brass; the triumph's arrival chord (no crash, no timpani) is still clearly the payoff.
4. Pier 9 bid → Dock Saved → bell triumph: the held A7 hands over cleanly; it feels like Waterfront's peak.
5. Fast buying + rush + a milestone: nothing clips or blurs; then a daily claim and the offline Collect: you hear Collect every time (AU76).

**Next ID:** AU78.

## Music rewrite (2026-11-15)
- R0 (the sound source): the Downtown chart can now be rendered through four soundfonts: A TimGM6mb (today's), B Fluid R3, C MuseScore General, D GeneralUser GS; `render.mjs` takes the bank from `SF2`, `tools/audio/BANK` or A, and `build/bank.json` records it. By the timbre proxy (2-5 kHz share, sustain ratio), D measures lowest on the front instruments; nothing was rendered into the app.
- Stem audit on today's Downtown, Suburbs and Industrial through A: lead minus bed is -5.2, -6.7 and -1.2 LU, so the leads already sit at or below their beds (the plan's guess of +2 to +3 LU is not what these measure).
- Not auditioned yet: `build/reel/R0.mp3` (one nylon-guitar sketch through each bank) is waiting for Julien's listen; no bank is chosen and no asset changed.
- R1 (the loops): all eight loops are lofi jazz now: Downtown and its sparse chart (M1a), Suburbs, Waterfront, University (M1b), Industrial (a 12-bar jazz blues, vibraphone and flute), Uptown (nylon guitar, piano, quiet pompe, harp tag) and MegaSlice HQ (a walking bass, a dark Rhodes villain motif; now on the lofi chain at its own -19 LUFS tier). The rep stings, Victor's exit, triumphs, stingers and story cues are R2 and still the old sound.
- Bank: C, `MuseScore_General_Full.sf3` (Julien, 2026-11-16: "C"). Full build passes every seam, ceiling and tier check; total 13,867,227 bytes of 14,680,064; stem audit lead minus bed -3.0 to -3.6 LU on all eight.
- Not auditioned yet: `build/reel/R1.mp3` (244.9 s) is waiting for Julien's listen; the audiocritic review of R1 is still to come.
- R2 (stingers and story, card M2c closes it): every cue is lofi jazz now. Stingers (M2a), the six triumphs and the city theme (M2b) and, in M2c, the two rep stings (the HQ motif over a stalking upright bass, ending on an unresolved diminished chord; the dock variant over the held A), Victor's exit (a vibraphone run and a bass glide), recipe (solo nylon guitar) and reunion (nylon guitar answered by a vibraphone at velocity 50 or under). No accordion, brass, reed, fiddle, square lead, crash or tambourine remains anywhere: `palette.check` runs on all 153 cues, and the entries are gone from `compose.GM`.
- The build now checks the hierarchy per neighbourhood (`milestone_big` > `manager` ≥ `build` > `milestone` > `upgrade` > `bottleneck` on integrated and on momentary-max loudness) and loops and story cues against their tiers. The M2a stingers failed it in several neighbourhoods; the three full-band kinds got a louder pad and per-neighbourhood bass velocities, and now pass with gaps as small as 0.1 LU (`docs/build/music/reports/M2c.md`).
- Julien's notes (2026-11-19): music, stingers and story cues are encoded at 256 kbps from 32-bit float, the cap is 32 MB (total 33,240,658 bytes, 313,774 under), and `python3 tools/audio/reel.py FULL` (1302 s, 93 tracks, 320 kbps MP3) and `reel.py R2` are waiting for his listen; nobody has listened to R2's cues, and the audiocritic review of R2 is still to come.
- Fix pass on the audiocritic review of R2 (AU79 to AU90, 2026-11-19): the triumphs' and city theme's arrival and the stinger tags are a 6/9 instead of a maj9 (a clash check on both, so no held lead note sits a semitone from the chord), the rep stings play at the HQ's ♩=76 and swing, four stinger leads are 1.5 dB lower, the stinger hierarchy's smallest gap went from 0.1 to 0.3 LU, University's tail and half-speed Rhodes motif and HQ's pizzicato were thinned or moved, and the cue sheet states the measured bitrates and the groove deviations. Total 33,249,842 bytes, 304,590 under the cap; nobody has listened; reels R2, R1 and FULL were rebuilt.
