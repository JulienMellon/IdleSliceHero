# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. The game has no audio yet (the design doc defers sound), so its first reviews are a plan; the cue sheet will live in `docs/AUDIO.md` once audio work starts.

- Added after v3.8 at Julien's request. It runs at **low effort** at the end of the build loop. Until Julien says otherwise it is advisory: its verdict doesn't gate the loop.
- **Next IDs:** AU12.

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
