# Audio log archive

Replaced "Current state" sections and build tables, newest last.

### Rounds 2–4 (2026-10-30, session with Julien's MIDI-score request)
- **Round 2 (plan, full):** NOT SATISFIED (advisory). Plan AU12–AU25: city motif, six style blends, gameplay stingers, 14 SFX, mix/memory rules. Built in v4.4.
- **Round 3 (v4.4):** NOT SATISFIED. AU26–AU41: win cues cut short, loudness inverted, stingers off the beat/harmony and too frequent, too many players. Fixed in v4.5.
- **Round 4 (v4.5):** NOT SATISFIED. AU42–AU56: build/bid stingers cancelled by their own scenes, cross-neighbourhood stinger cut-offs, offline cue in the wrong key, SFX tiers not in the shipped files, loops without a ceiling. Fixed in v4.6.

## Current state — v4.3, round 1 (low effort, a plan): ❌ NOT SATISFIED (advisory; no audio exists yet)

No audio module and no `docs/AUDIO.md`. Per the brief, missing audio isn't a build fault; this round is the plan. The reviewer read part of `home.ts` and `tuning.ts` and `package.json` only (no screenshots, no search), so the Pier 9 bid, the perk card and Victor Crust's exit line still need cues.

| ID | Sev | Moment | Proposed treatment |
| --- | --- | --- | --- |
| AU1 | major | Kitchen tap; queue full | Soft dough-thump plus a short sizzle, 0.12 s, 4 variants, ±1 semitone; a muted wooden "tok" when the 12-pizza queue is full |
| AU2 | major | Purchase OK; refused | Rising two-note marimba with a coin shimmer, 0.35 s, up a semitone per purchase within 2 s (reset after a pause); refused: a low felt "bonk", 0.2 s, with the error haptic |
| AU3 | major | MegaSlice scheme (beat 3) | Comic-villain leitmotif, muted brass and tuba, about 6 s, a minor-key version of the city theme |
| AU4 | major | Win (beat 4); reveal panels | Full-band theme with mandolin and accordion, 4–6 s; reveals get a cymbal swell into a sting |
| AU5 | minor | Milestone level (output ×2) | Oven-door "whoomp" plus a 3-note arpeggio, 0.8 s, above a purchase in the hierarchy |
| AU6 | minor | Scene open / unlock beat | Warm solo accordion phrase, 2 s |
| AU7 | minor | Offline Collect | Register "ka-ching" plus a coin cascade, 1.2 s, scaled to the amount |
| AU8 | major | Music | One Neapolitan-mandolin motif re-orchestrated per neighbourhood (Downtown accordion, Suburbs acoustic, Waterfront marimba and steel drum, University lo-fi, Industrial percussive, Uptown jazz); 90–120 s loops; 0.5 s crossfade between shops; −10 dB duck in cut-scenes |
| AU9 | major | Cash pops and rush taps | 3–5 variants, random pitch, about 8 voices/s cap, gain that drops as they stack, a limiter on the SFX bus; SFX peaks −6 dBFS, music ~−18 LUFS |
| AU10 | major | Platform | `expo-audio` with an ambient session (respects the silent switch, mixes with other apps); separate Music and Sound toggles in Settings |
| AU11 | major | Memory | SFX mono AAC/M4A 22–32 kHz, preloaded once into a pool of ~6 players, never created per tap, under ~1.5 MB total; music streamed stereo AAC 96–128 kbps, at most 2 players (only while crossfading) |

**Build first, in order:** AU2, AU1, AU9, AU5, AU8 (Downtown theme), AU3, AU4, AU7, purchase refused, AU6.

## v4.4 — audio build 1 (Julien, 2026-10-30: MIDI score, neighbourhood style blends, gameplay leitmotifs)
Plan: audiocritic round 2 (full plan, AU12–AU25). Cue sheet: `docs/AUDIO.md`. Pipeline: `tools/audio/` (compose.py → MIDI → spessasynth + GM soundfont → AAC), runtime `src/audio/`.

| Note | Done |
| --- | --- |
| AU16 city motif | `tools/audio/material.py`: motif, answer, cadence, B development, 6/8 version |
| AU17 / AU8 six loops | Downtown tarantella 6/8 F, Suburbs Americana-march G, Waterfront shanty-habanera D Mixolydian, University lo-fi-chiptune B♭, Industrial shuffle blues A, Uptown musette-swing E♭; 91–103 s, −18 LUFS |
| AU20 | `downtown_sparse` (accordion + mandolin) until downtown-4 is seen |
| AU18 | MegaSlice HQ march loop, Rep sting, Victor's exit |
| AU12 / AU13 | `panelCue()` defaults for beats 1–3 plus explicit `cue` on wins and reveals; triumph ×6, bell-triumph, recipe, reunion, city theme, perk chime |
| AU14 | 9 stingers × 6 keys, quantised to the loop's next beat (eighth in Downtown; bar for manager) with ducking |
| AU15 / AU7 | celesta on the offline popup; Collect in 3 sizes |
| AU1, AU2, AU5, AU21 | 14 synthesised SFX, 41 variants, 0.16 MB; purchase chain; voice limiter |
| AU22 / AU9 | levels baked into files (SFX −9 dBFS, stingers −16 LUFS, music −18 LUFS, reveals −21/−23), ramped ducking |
| AU23 / AU11 | ≤ 2 music players, hot SFX preloaded, stingers per active key only, one story player; 12.7 MB total |
| AU24 / AU10 | silent switch respected, mixWithOthers, no background audio; Music/Sound toggles in Settings under their own key |
| Tests | `src/audio/__tests__/logic.test.ts` (13): quantisation, limiter, chain, stinger rules, scene cue coverage, manifest files and budget |
| Verify | tsc clean; 147 tests pass; web export; screenshots v4.4 `errors: []`, new shot 24 (Settings audio), audio probe log in `report.json` |

## v4.5 — audio build 2 (fixes for round 3, AU26–AU41)
| Note | Fix |
| --- | --- |
| AU26 | Triumphs rewritten: 2-beat swell, motif + closing phrase, tutti crash at 3.8–7.5 s (`payoffSeconds` in the report); city theme 26.9 s, entries one bar apart then A′ tutti, panel holds until it ends; story cues on two players with a 300 ms fade; perk chime is a per-key stinger layered over the story cue |
| AU27 | Gavel SFX "knock, knock, SOLD" + `waterfront_bid` (held V7 over timpani, unresolved), duck −10 dB; a scene's first panel fades gameplay stingers in 150 ms |
| AU28 | `rep` is exclusive (the loop drops out in 80 ms) |
| AU29 | HQ march: one-bar tuba vamp (17 bars), always restarts at 0 (`RESTART_TRACKS`) |
| AU30 | downtown-1 `welcome` on p5 (Nonna's smile); offline cue per key, loop ducked −8 dB while the popup is open |
| AU31 | Stingers in each hood's meter (Downtown from `M68`), swung like the loop, beat 1 one beat in; chordal stingers wait for the bar, Downtown's pulse is the dotted quarter |
| AU32 | `StingGate`: bottleneck ≤ 1 per 20 s, priority ladder, never restart/stack (tested) |
| AU33 | Chip line: straight 16ths, melody note on every other step at vel 82, the rest 48; excluded from swing |
| AU34 | Industrial graces placed after swing; Uptown beat 4 walks a semitone into the next root; recipe rubato accumulates; city tutti fiddle/clarinet a diatonic third above |
| AU35 | Each triumph over its neighbourhood's rhythm section (`groove()`), in its tempo and meter |
| AU36 | Loudness tiers for SFX and stingers (build.py `SFX_LUFS`, `STING_LUFS`); new `build` stinger in the new hood's key |
| AU37 | ±0.3 st on purchase step 0 |
| AU38 | Look-ahead limiter, all one-shots ≤ −6 dBFS; SFX at 0.7 while a stinger sounds |
| AU39 | `fire()`: rewind after each play, seek-then-play if still sounding; start-up players 29 → 24 (20 SFX + 2 music + 2 story). Device measurement and the `react-native-audio-api` decision stay open (Julien) |
| AU40 | Active key's stingers preloaded 1.5 s after a neighbourhood change; gapless loop stays a device check |
| AU41 | sparse → full Downtown keeps its position; "mute when other audio plays" isn't exposed by expo-audio (documented; Music toggle) |
| Verify | tsc clean; 151 tests pass (17 audio); screenshots v4.5 `errors: []` (settle() now waits for two quiet checks) |

## v4.6 — audio build 3 (fixes for round 4, AU42–AU56)
| Note | Fix |
| --- | --- |
| AU42 | Build/bid stingers are "held": a scene's first panel fades other stingers but keeps them; `welcome`/`rep` wait for them (`afterHeld`); Dock Saved uses `megaslice_rep_dock` (D minor over an A pedal) |
| AU43 | During a scene, stingers preload in the scene's key; a key change releases a still-playing stinger only when it ends |
| AU44 | Offline celesta fires from the store subscription when `offline` appears (saved key); no music before `loaded` |
| AU45 | `payoffSeconds` in the manifest; the next story cue waits for a triumph's payoff + 1 beat |
| AU46 | Perk chime snaps to the ringing story cue's next bar (bpm/downbeat now in the manifest) |
| AU47 | Loops export `barRoots`; `stingTiming()` waits up to 2 bars for a tonic bar, else −6 dB extra duck (tested on the 12-bar blues) |
| AU48 | Snare swells, timpani rolls and the drone arp excluded from swing; the University chip line now swung per 16th (`swing_smooth`) |
| AU49 | City theme held notes are tones of each entry's own chord |
| AU50 | `musicFor`: Downtown scenes before beat 4 stay sparse (replays too) |
| AU51 | Full clean build; short files measured over their own length; build fails if an effect misses its tier by > 0.5 LU unless ceiling-limited |
| AU52 | Loops peak-limited at −4 dBFS; worst-case sum recomputed in docs/AUDIO.md |
| AU53 | Duck and gate use `musicSeconds`; milestone/manager are 2 bars under 100 bpm |
| AU54 | Only `background` pauses; story cues resume on return with > 0.5 s left |
| AU55 | rush and bubble preloaded; rare one-shots released after each play |
| AU56 | Music off stops story cues and stingers |
| Verify | tsc clean; 155 tests pass (21 audio); screenshots v4.6 `errors: []`; web probe: recipe now starts 4.3 s after the Downtown triumph (payoff 3.8 s) |
