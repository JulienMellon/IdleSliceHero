# Slice Empire — audio cue sheet

The score is written as code. `tools/audio/compose.py` writes MIDI and `tools/audio/sfx.py` synthesises the effects. `tools/audio/build.py` then renders the MIDI through a General MIDI soundfont (TimGM6mb, via `spessasynth_core`), folds each loop's tail onto its start, normalises loudness, encodes everything to AAC in `assets/audio/` and generates `src/audio/manifest.ts`. Measured lengths, loudness and sizes are in `tools/audio/build/report.json`, which isn't committed (run the build to get it).

At runtime, `src/audio/director.ts` owns the players and follows the store. The store and components only report what happened, through `src/audio/bus.ts`. The rules (which loop, which cue, beat quantisation, voice limits) are in `src/audio/logic.ts` and tested in `src/audio/__tests__/logic.test.ts`.

## The city motif (AU16)
Notation: scale degrees, with a comma marking the octave below. Durations are e = eighth, q = quarter, dq = dotted quarter, h = half.

- **4/4:** pickup 5, (e) | 1 (q), 3 (e), 5 (e), 6 (dq), 5 (e) | 4 3 2 3 (e), 1 (h).
  - **Opening phrase:** `5, 1 3 5 6`. **Closing phrase:** `4 3 2 3 1`.
- **Answer:** 6 (q), 5 4 (e), 3 (dq), 2 (e) | 7, 1 2 4 (e), 3 (h).
- **Cadence:** 4 (q), 6 5 (e), 4 (q), 2 (q) | 1 (dotted half).
- **B section:** the motif's rhythm sequenced on vi and IV (`6 8 7 6 5`, `4 6 8 9 8`). It develops the motif without stating it.
- **6/8 (Downtown):** 5, | 1 (q) 3 5 (e) 6 (q) | 5 4 3 (e) 2 (q) 3 (e) | 1 (dq).
- **Variation:** meter, mode (Waterfront plays Mixolydian with a flat 7), a blue flat-3 grace note (Industrial), chromatic approach notes (Uptown), chiptune arpeggiation (University), and half speed (the University Rhodes bed).

Every loop opens with a bed with no lead, states the motif at most twice, and has a bed with no lead before it returns.

## Neighbourhood loops (AU17)
GM programs are 1-based here (`compose.py` uses 0-based numbers). The score is lofi jazz (Julien, 2026-11-15; see the end of this file): jazz chords, swung brushes, a walking or two-feel upright bass, a Rhodes or piano comping, soft front instruments only. The eight loops (six neighbourhoods, Downtown's sparse chart and MegaSlice HQ) are rendered through bank C (`MuseScore_General_Full.sf3`, the line in `tools/audio/BANK`; fetch it with `bash tools/audio/fetch_bank.sh`) and all go through the lofi chain in `post.lofi_loop`: tape wow (±3 cents since notes round R1-2, was ±6; two slow sines whose periods divide the loop), soft tanh tape saturation (drive set from 7x the programme's RMS, was 5x), gentle vinyl crackle, and a 9 kHz low-pass (was 7), all circular so the seam holds. Tiers: the six neighbourhood loops −20 LUFS, `downtown_sparse` −22 (so Nonna's takeover lifts), `megaslice_hq` −19; every loop peaks at −6 dBFS or lower (measured −6.0 to −10.1), and is encoded as stereo AAC at 144 kbps (was 96, notes round R1-2). Notes round R1-2 (Julien, 2026-11-19, "more articulate … less smearing … each note more distinct"): every pitched note is cut to 0.75 of its written length (pads 0.9; `jazz.articulate`, run in `jazz_finish`), every pitched channel sends CC72 release 36 (pads CC73 attack 44, CC72 44), and the reverb and chorus sends are halved (`mlib.TIGHT_*`); the measures are in `docs/build/music/reports/NOTES-R1.md`. Each loop's manifest entry carries `barRoots`, the chord degree on every bar's downbeat, written from the chart (`jazz.Harmony.roots`), so stingers can wait for the tonic; the HQ loop has none and carries `restart`. Nobody has listened to these loops yet.

| Area | Blend | Tempo, meter | Key | Instruments (GM) | Loop | Form |
|---|---|---|---|---|---|---|
| Downtown | Neapolitan mandolinata × tarantella, as a slow jazz waltz | ♩.=66 (♩=99), 6/8, straight (the long-short brush ride carries the lilt) | F | Nylon gtr 25 lead (an octave lower than the old accordion line) and slow arpeggios (a tone a beat, beds only); Rhodes 5 comping; Warm pad 90 (very low); Upright bass 33 on the dotted quarters; brush kit (GM kit 40) | 52 bars, 94.5 s | intro 4, A 16 (motif, answer, development, closing), bed 4, B 16, A′ 8 (motif again), bed 4 |
| Downtown (sparse, AU20) | The same chart with only nylon guitar and Rhodes | same | F | Nylon gtr 25 (lead and arpeggio), Rhodes 5 | same, same timeline (52 bars, same `barRoots`; −22 LUFS) | Plays until downtown-4 (Nonna takes over), then the full band takes over at the same position |
| Suburbs | Sunny Americana, brushed and swung | 86, 4/4, 58% swing | G | Vibraphone 12 lead (A and march); Jazz gtr 27 lead (B, the vibraphone doubling very soft); Glockenspiel 10 (single notes, velocity 40 or under); Rhodes 5; Upright bass 33 (two-feel, walking in B and the march); brush kit, cross-stick on 2 and 4 | 32 bars, 89.3 s | intro 4, A 4, bed 4, B 8, march 4 (walking bass, vibraphone answer), A′ 4, bed 4 |
| Waterfront | Sea shanty × habanera, as a gentle two-feel | 80, 4/4, 56% swing | D Mixolydian | Harp 47 lead (A, A′) and Marimba 13 lead (B); Marimba 13 soft arpeggio; Rhodes 5 (D9, D13, Dsus13, Cmaj9 as bVII); Upright bass 33 (half notes with the habanera figure in every second bar); shaker 70 and brushes | 32 bars, 96 s | intro 4, A 4, bed 4, B 8 (marimba), A′ 4 (harp, marimba an octave up at velocity 30), bed 8 |
| University | Lo-fi hip-hop, with the chiptune arpeggios on a kalimba | 76, 4/4, 60% swing | B♭ | Kalimba 109 (motif and tail arpeggios, velocity 50 or under); Vibraphone 12 (B lead, velocity 50 or under, plus a soft shimmer); Rhodes 5 (maj9, min9); Finger bass 34; brush kit with the kick 10 ms behind the rest of the kit | 32 bars, 101.1 s | intro 4, A 4 (kalimba), bed 4, B 8 (vibraphone), bed 8 (the Rhodes plays the motif at half speed), tail 4 (chord-tone arpeggios, no motif) |
| Industrial | Jazz blues in a triplet shuffle | 76, triplet shuffle (66.7%) | A | Vibraphone 12 lead with the blue flat-3 grace; Flute 74 (chorus 3's motif, velocity 50 or under); Rhodes 5 and Clean gtr 28 comping (guitar riff in chorus 1); Warm pad 90 (chorus 3, 8 bars); Upright bass 33 (two-feel in chorus 1, walking in 2 and 3); brushes and ride, rim click on 2 and 4 | 36 bars (3 choruses), 113.7 s | a 12-bar jazz blues: A9, A13, A9, Em9 A7b9; D9, D13 D♯dim7, A9, A13 F♯7b9; Bm9 E13, Dm9 G13, A9 F♯7b9, Bm9 E7b9. Chorus 1: guitar riff, no lead; chorus 2: the vibraphone states the motif, develops it on the IV and answers over the turnaround; chorus 3: pad, the flute states the motif, the vibraphone develops and closes |
| Uptown | Parisian manouche, the pompe turned into a quiet swing | 84, 4/4, 60% swing | E♭ | Nylon gtr 25 lead with chromatic approach notes (an octave down); Piano 1 comping; Jazz gtr 27 "pompe" on 2 and 4, velocity 42 or under; Harp 47 (the tag); Upright bass 33 walking; brush kit | 32 bars, 91.4 s | intro 4, A 4, B 8, bed 4, A′ 4, tag 8 (harp, backdoor and a tritone substitution into the intro) |

Every loop shares one bed, built from `tools/audio/jazz.py`: a Rhodes (or, in Uptown, a piano) comping rootless jazz voicings between C3 and E4 (a chord on the chord's downbeat and a quieter answer, now and then the next chord struck an eighth early; since notes round R1 every chord is released 0.4 beat before the next hit or its own answer begins, a hit is held at most 2.5 beats in 4/4 and 1.9 in 6/8, and Suburbs plays fewer answers and early chords; `tools/audio/keys_release.py` measures it: no chord hit overlaps the next, shortest gap 0.20-0.26 s; the only overlaps left are two grace-note clusters of University's half-speed Rhodes melody), a brush kit (GM kit 40: ride 51, feathered kick, ghost taps, cross-stick on 2 and 4, pedal hat), and an upright bass (a two-feel or a walk with chromatic approach tones; Industrial, Uptown and the HQ walk). The kit is laid 12–18 ms behind the beat and the bass 5–8 ms. Leads are a vibraphone, nylon or jazz guitar, harp, marimba, kalimba, flute or a dark Rhodes at velocity 56 or under (50 in University and Industrial), state the motif at most twice a loop, and sit 1.7 to 3.2 LU below the bed while they play (stem audit; the rule is 0 LU or less).

**Transitions (AU19).** Switching tabs crossfades in 0.6 s. Each loop remembers its position and resumes from it. Two music players exist at most.

**Seams.** The reverb tail past the loop end is folded onto the start. The join step (last sample to first) is below each file's 99th-percentile sample step: `build.py` checks it for every loop and stops if it fails (measured join steps are 0.0004–0.003 against 99th percentiles of 0.02–0.04). AAC adds about 10 ms of padding: **check on a device** that `loop = true` is gapless. If it isn't, crossfade between the two players.

## Story cues (AU12, AU13, AU18)
A scene plays its own neighbourhood's loop, ducked −8 dB. `panelCue()` gives beats 1–3 their defaults; wins and reveals set `cue` in `scenes/home.ts`. Exclusive cues stop the loop (it fades out) while they play. Story cues alternate between two players, so an outgoing cue always fades over 300 ms instead of stopping dead. A triumph is never replaced before its payoff crash plus one beat (`payoffSeconds`); the next cue waits. If the app goes to the background, a cue is paused and resumed on return when more than 0.5 s of it is left. Control Center and notifications don't pause anything. Skip fades story cues and stingers in 0.4 s, and a scene's first panel fades any gameplay stinger in 150 ms.

| Moment | Cue | File | Length | Treatment |
|---|---|---|---|---|
| Beat 1, first panel with a character (downtown-1: the last panel, when Nonna smiles) | `welcome` | `sting/<hood>_welcome` | 3–6.5 s | The character's opening phrase on their neighbourhood's lead instrument, in its (new, slower) meter, with a Rhodes roll; lands on the loop's next bar |
| Beat 2, panel 1 | `warmth` | `sting/<hood>_warmth` | 6–7.5 s | Cadence and closing phrase, softer, over a Rhodes pad |
| Beat 3, MegaSlice HQ panels | `megaslice` | `music/megaslice_hq` | 17 bars, 53.7 s, loop, −19.0 LUFS, peak −7.1 dBFS | C minor at ♩=76, 4/4, 58% swing: a sneaky, slightly comic jazz walk through the lofi chain. A one-bar bass-only vamp, then the villain motif `5, 1 ♭3 ♭5 ♭6 5 | ♭6 5 ♭5 4 1` on a dark Rhodes (Rhodes 5, an octave down from the old line), twice, with its answer fragment into each turnaround. Harmony: Cm(maj7) | Fm9, C♯dim7 and E♭dim7 passing chords, Dm7b5 G7b9, and Dm7b5 | D♭13 (tritone substitution) into the turnaround. Upright bass 33 walking, Pizzicato 46 doubling it an octave up, a second Rhodes comping, brushes with a side stick on 2 and 4 at velocity 40 or under. No tuba, bassoon, trombone or timpani. **Always starts at bar 0** (`restart`), so every scheme opens on the vamp and the motif |
| Beat 3, first Rep panel | `rep` | `story/megaslice_rep` | 4.7 s, exclusive, −18 LUFS | The villain motif at double speed on bassoon and tuba, plus a trombone glissando down. The loop drops out in 80 ms (no key clash) |
| waterfront-4 panel 1 (after the bid) | `rep` | `story/megaslice_rep_dock` | 4.7 s, exclusive | The same in D minor over a held A pedal, so the bid's A7 is still hanging when the bell triumph resolves it to D. It waits for the bid stinger to finish |
| Beat 4 win | `triumph` | `story/triumph_<hood>` | 6.5–10.6 s (payoff crash at 3.8–7.5 s), exclusive | A two-beat snare swell, then the motif and closing phrase on the lead with brass, strings and timpani, in the neighbourhood's key, tempo and meter, over its own rhythm section (tarantella bass and tambourine; marching snare; habanera and shaker; lo-fi kit and Rhodes; shuffle, ride and organ; pompe and walking bass). It ends on a tutti tonic with a softer crash (velocity 96, timpani 100). Mastered at −18 LUFS (peak −8.8 to −10.0 dBFS) through the story master (tape saturation, 10 kHz roll-off; no wow or crackle), so the jump from a ducked lofi loop is smaller. Panels: downtown-4 p2, suburbs-4 p3, university-4 p3, industrial-4 p4, uptown-4 p1 |
| Dock Saved | `bell-triumph` | `story/triumph_waterfront` | 10.7 s, exclusive | A three-strike ship's bell (Tubular Bells 15) opens the triumph (waterfront-4 p2) |
| Recipe card | `recipe` | `story/recipe` | 10 s, exclusive | Solo accordion, rubato: a slight push into the phrase, then a held breath after every long note that carries forward (downtown-4 p3); −21 LUFS |
| "...Salvatore?" | `reunion` | `story/reunion` | 17 s, exclusive | Solo accordion in F at ♩=60, the tenor sax answers with the closing phrase, then both play it in unison over a string pad (industrial-4 p2). Mastered to −23 LUFS (recipe −21, offline popup −20), the quietest cues in the game |
| Victor's exit | `victor-exit` | `story/victor_exit` | 3.2 s | The tuba deflates and a trombone slides down (uptown-4 p2) |
| City complete | `city-theme` | `story/city_theme` | 26.9 s, exclusive, once, −18 LUFS (peak −8.1) | The six leads enter one bar apart in build order (accordion, trumpet, fiddle, square, sax, clarinet), each adding the opening phrase while the earlier ones hold chord tones over a rising bed. Then the whole band plays A′, with the fiddle and clarinet a diatonic third above. **The panel waits for the cue to finish** before auto-advancing; a tap still advances it (uptown-4 p4) |
| Perk card | `perk` | `sting/<hood>_perk` | 2.6–4.1 s | The opening phrase on glockenspiel and Rhodes, in the scene's key, layered over a triumph or the city theme: it waits for the cue's payoff (at most 3 s). If the payoff is still ahead when it fires, the cue ducks −6 dB for the perk's length, cut short so it is back up 400 ms before the payoff crash (AU77). Its timer survives a panel change; Skip drops it (AU66, AU75) |
| Offline popup opens | `offline` | `sting/<hood>_offline` | 2.6–3.7 s | The closing phrase on celesta over a soft Rhodes chord, in the active key; the loop ducks −8 dB while the popup is open; −22 LUFS |

## Gameplay stingers (AU14, AU31, AU32, AU36)
Every stinger is rendered in all six keys (`sting/<hood>_<kind>`), as mono AAC at 64 kbps, peaking at −6 dBFS or below. Each is written in its neighbourhood's **new** tempo and meter (Downtown's are 6/8, built from `M68`/`CLOSE68`) and swung like its loop. Since lofi round 1 they share the loops' palette: the hood's lead and a Rhodes, no crash or splash cymbals, a bell colour the bed lacks (a glockenspiel an octave above the lead at velocity ~50; celesta in Suburbs, whose loop already has a glockenspiel), shorter reverb (tail trimmed at −46 dBFS, 0.3 s fade), the loops' soft tape saturation (headroom 5, set from the trimmed body) and the same 7 kHz roll-off on the body, with the bell as its own stem mixed in after the saturation through a 10 kHz roll-off (AU73), and a soft mallet swell (vibraphone under a rising expression curve, then a soft low thump) where a timpani roll used to be. Every tier sits 2 LU lower than before, with the loops. Stingers are normalised after the mono fold (AU59), and `build.py` fails any stinger more than 0.5 LU off its tier (or short of it without touching the −6 dBFS ceiling). Measured: every tier except these lands on its target within 0.05 LU; `milestone_big` lands 0.3–0.8 LU under −16 (−16.3 to −16.8: the six keys are −0.4, −0.8, −0.4, −0.3, −0.7, −0.3 for Downtown, Suburbs, Waterfront, University, Industrial, Uptown), `manager` up to 0.2 under (Downtown, Suburbs, Industrial) and Suburbs' `build` and the bid 0.1 under, because the limiter catches the bell and arrival transients at −6 dBFS. Peaks and crest factors by tier (peak dBFS, crest dB): bottleneck −12.1 to −9.3, 9.9–12.7; milestone −8.5 to −6.3, 10.5–12.7; milestone_big −6.0, 10.3–10.8; manager −6.0, 11.0–11.2; build −7.5 to −6.0, 9.5–11.1; upgrade −9.2 to −6.3, 10.8–13.7; fleet −9.1 to −7.6, 10.9–12.4; drone −8.9 to −6.8, 11.1–13.2; welcome −10.5 to −6.1, 8.5–12.9; warmth −9.8 to −6.8, 10.2–13.2; perk −7.7 to −6.8, 12.3–13.2; offline −11.2 to −10.4, 10.8–11.6; bid −6.0, 12.1. Tiers: bottleneck and offline −22, milestone and welcome −19, manager and build −17, milestone_big −16, upgrade, fleet, drone, warmth and perk −20, bid −18. Beat 1 sits one beat in (`downbeatSeconds`), after its pickup. The director aligns beat 1 with the loop's next **bar** for every chordal stinger, so their tonic lands where the loop's harmony restarts. Only `bottleneck` waits for the next beat (a dotted quarter in Downtown). The instant SFX always plays at the tap.

**Gate (`StingGate`).** `bottleneck` plays at most once per 20 s. While a stinger sounds, any of equal or lower priority is dropped (never restarted, never stacked); a higher one takes over. Priority: `milestone_big` > `manager` = `build` > `milestone` = `welcome` = `warmth` > `upgrade` = `fleet` = `drone` = `perk` = `offline` > `bottleneck`. SFX play at 0.7 gain while a stinger sounds. The set for the active key (during a scene, the scene's key) is preloaded 1.5 s after a change. A stinger still sounding at a key change is released only when it ends. The duck and the gate last for the stinger's music (`musicSeconds`), not its reverb tail; every 4/4 neighbourhood is now under 100 bpm, so milestone and manager stingers are 2 bars everywhere (Downtown's are 3 bars of 6/8).

**Tonic alignment (AU47, AU63).** Bar-quantised stingers wait for the next bar whose chord is I (from `barRoots`), up to 2 bars ahead, but a candidate bar is only accepted while the wait is at most 2.5 s (`MAX_TONIC_WAIT_SECONDS`, AU74). At the lofi tempos a bar is 2.8–3.2 s, so the stinger takes the next bar; Downtown's 6/8 bar (1.8 s) can still reach one bar further when the next bar line is close. Failing a tonic bar, the stinger takes the next bar and the loop ducks a further −6 dB. The wait stays under about one bar plus the pickup (~3.2 s).

**Build and bid stingers carry into their scene (AU42).** Building opens the neighbourhood's unlock scene at once, and the bid opens Dock Saved. Their stingers keep playing through the scene's first panel, and that panel's `welcome` or `rep` waits for them to end.

| Event (store) | Stinger | Length | Loudness | Duck |
|---|---|---|---|---|
| Station buy that changes the bottleneck (`buy`), ≤ 1 per 20 s | `bottleneck`: opening phrase on the lead with a bell (no Rhodes chord, since it only waits a beat) | 1 bar | −22 LUFS | −3 dB |
| Station level crosses 25/50 | `milestone`: opening and closing phrases over a I–V–I Rhodes bed, a bell doubling the lead, a brush-swirl crescendo into the last bar | 2 bars (Downtown 3) | −19 | −6 dB |
| Station level reaches 100 | `milestone_big`: as above with a longer, louder swirl, a soft mallet swell, then a bass root and a celesta octave on the arrival | 2 bars (Downtown 3) | −16 | −9 dB |
| Hire manager | `manager`: cadence and closing phrase over Rhodes (ii–V–I), a bell and a brush swirl into the last bar | 2 bars (Downtown 3) | −17 | −9 dB |
| Expand, oven grade | `upgrade`: opening phrase on the lead with a rising Rhodes arpeggio | 2 bars | −20 | −6 dB |
| Fleet (scooter, car, van) | `fleet`: the same, plus a soft horn "beep-beeep" | 2 bars | −20 | −6 dB |
| Fleet (drone) | `drone`: on square lead, with a soft chip arpeggio | 2 bars | −20 | −6 dB |
| Build a pizzeria (`build`) | `<new hood>_build`: the new neighbourhood's lead states the motif with a bell, Rhodes and soft claps, played at once | 2 bars (Downtown 3) | −17 | −9 dB |
| Pier 9 bid (`bidPier9`) | `waterfront_bid`: held V7 on Rhodes under a soft mallet swell, unresolved (waterfront-4 resolves it), with the gavel SFX "knock, knock, SOLD" | 2.6 s | −18 | −10 dB |

## Sound effects (AU21)
All effects are mono AAC at 64 kbps: 0.17 MB in total, 42 files. Loudness is set by tier (AU36), so rare big moments are louder than frequent small ones, and every peak is limited to −6 dBFS or below:

| Tier | Effects | Loudness |
|---|---|---|
| UI | click, bubble | −32 LUFS (short files are measured over their own length, not padded with silence) |
| Constant | tap, full, cash | −28 |
| Per purchase | buy, refused, rush (sparkle −24) | −22 |
| Upgrades | milestone, fleet −19; expand ≈ −22 and grade ≈ −21 (transient-limited at the ceiling) | −19 |
| Gavel | gavel | ≈ −22 (transient-limited) |
| Building | build | ≈ −18 |
| Collect, by size | collect | −19, −17.5, −16 |

`build.py` fails if any effect misses its tier by more than 0.5 LU, unless the ceiling stopped it.

The rest of this section: They are synthesised in `sfx.py` from one palette of wood, dough, warm metal and kitchen fire. Runtime pitch jitter is ±1 semitone unless noted, done with `playbackRate` and `shouldCorrectPitch = false`. Variants rotate and never repeat back to back.

| # | Moment (trigger) | File | Length | Variation |
|---|---|---|---|---|
| 1 | Kitchen tap (storefront `onPress`) | `tap_0..3` | 0.12 s | 4 variants: dough thump, slap and sizzle |
| 2 | Queue full | `full_0..1` | 0.10 s | 2 variants of a muted wooden tok, ±0.5 st |
| 3 | Purchase OK (`commit` → `buy`) | `buy_0..7` | 0.35 s | A two-note marimba rising a fourth, with shimmer. Steps up a semitone per purchase within 2 s (`PurchaseChain`), capped at +7; step 0 gets ±0.3 st, so slow play still varies |
| 3b | Decor purchase | `buy` + `sparkle_0` | 0.35 s | Adds a five-note sparkle tail |
| 4 | Refused (`commit` fails) | `refused_0..1` | 0.20 s | Low felt bonk, with the error haptic |
| 5 | Cash pop (storefront payout) | `cash_0..4` | 0.15 s | 5 coin variants, ±2 st; at most 3 voices in 300 ms, 60 ms apart, −3 dB each (`VoiceLimiter`) |
| 6 | Rush tap (managed shop) | `rush_0..3` | 0.25 s | Sizzle-whoosh with a 3-coin flurry; limited like the cash pop |
| 7 | Milestone | `milestone_0` | 0.40 s | Oven-door whoomp, under the milestone stinger |
| 8 | Expand | `expand_0` | 0.50 s | Construction ka-chunk |
| 9 | Oven grade | `grade_0` | 0.60 s | Fire roar with crackle |
| 10 | Fleet | `fleet_0..4` | 0.60 s | One per vehicle: bike bell, scooter, car, van (engine plus horn), drone whirr |
| 11 | Build pizzeria | `build_0` | 0.80 s | Ribbon snip plus a small "yay" with claps |
| 12 | Offline Collect | `collect_0..2` | 0.6, 1.0, 1.5 s | Register ka-ching plus a coin cascade, sized by the payout against cash (< 1×, 1–10×, ≥ 10×) |
| 13 | Tab switch | `click_0` | 0.05 s | Soft click |
| 14 | Speech bubble (each line) | `bubble_0..2` | 0.08 s | 3 variants |
| 15 | Pier 9 bid | `gavel_0` | 0.6 s | Hardwood "knock, knock, SOLD" |

## Mix rules (AU22)
- **No master bus.** `expo-audio` has no master bus, so clipping is prevented in the files. Lofi loops sit at −20 LUFS, peaking at −7 to −8 dBFS (the ceiling is −6; the tape saturation keeps the limiter idle), Downtown's sparse chart at −22; the MegaSlice HQ loop at −19.0 (peak −7.1); triumphs, the city theme and the rep stings at −18 (peaks −8 to −10); other story cues at −16 LUFS (reveals −21/−23); stingers (−17 to −22 by tier) and SFX by tier. A look-ahead limiter keeps every stinger, story cue and SFX at or below −6 dBFS.
- **Worst case: a milestone.** Coincident peaks are summed as amplitudes:

  | Layer | Peak | Amplitude |
  |---|---|---|
  | Loop, ducked −6 dB | −14 dBFS (loop peaks −8) | 0.20 |
  | Stinger | −6 dBFS | 0.50 |
  | Whoomp at 0.7 | −9.6 dBFS | 0.33 |
  | Buy at 0.7 | −13 dBFS | 0.22 |

  The total is 1.25, but only if every peak landed on the same sample, which a 0.4 s whoomp, a 0.35 s marimba and the stinger's beat 1 (aligned to the next bar, not the tap) never do. Measured RMS sums stay below −12 dBFS. **Check on a device with the limiter-free path**; if it clips, the `react-native-audio-api` master compressor (open item) is the fix.
- **Ducking.** The loop's gain is the product of its active ducks: scene −8 dB, stinger −6 dB (bottleneck −3 dB; milestone_big, manager and build −9 dB) for the stinger's length, exclusive story cue to silence. Ramps take 80 ms down and 400 ms up.
- **Music off or app in the background.** The loop pauses rather than playing at volume 0.

## Platform and cost (AU23, AU24)
- **Audio mode.** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false })`. The app follows the ring/silent switch, plays alongside the player's own music or podcast, and stops in the background. The config plugin sets `enableBackgroundPlayback: false`, so there is no `UIBackgroundModes: audio`.
- **Settings.** Music and Sound toggles, stored under `slice-empire/audio/v1` so that Reset game keeps them.
- **Players.**
  - Music: 2.
  - SFX: tap, cash, buy, rush, bubble, full, refused and click are created at start-up, one player per variant (27). Sparkle, milestone and fleet are created on first use and kept. The rare one-shots (collect, build, gavel, grade, expand) are released when they finish (the player's own finish event, or the length + 300 ms after playback actually started). Collect (the size the popup will use), build and gavel are created ahead (the sweep releases only a Collect it warmed itself, never one a play has started and not finished: AU76), while the offline popup is open, a pizzeria can be built, and the Pier 9 bid is on offer (AU61); grade and expand are created at play time. A one-shot is rewound right after it ends, so the next `play()` is immediate; one still sounding is seeked first and played once the seek lands.
  - Stingers: the active key's 9 are preloaded 1.5 s after a neighbourhood change; a key change releases them (`remove()`), except that one still sounding stays in an orphan set that Skip and Music off still fade (AU60), and a held build stinger of the new key is neither released nor re-created by the preload.
  - Story: two players (for fades).
  - Nothing is created per tap.
- **Size.**

| Group | Size |
|---|---|
| Music | 8.7 MB (8 lofi jazz loops; slower tempos, so the bars were trimmed) |
| Stingers | 3.0 MB (73) |
| Story | 1.4 MB |
| SFX | 0.17 MB |
| **Total** | **17.7 MB** (18,587,250 bytes in `assets/audio`; the test caps it at 20 MB, raised from 14 MB by Julien on 2026-11-19) |

- **Web.** Nothing plays until the first pointer press, because browsers block autoplay. `scripts/screenshots.py` logs every `play()` into `report.json` under `audio`.

## Open (device checks and v2)
v5.17 (card A1) moved the output onto a seam. The sections above describe the web build and the music and story players, which are unchanged; where they say "players" for effects and stingers, the phone now has buffers.

- **What moved.**
  - `src/audio/mixer.ts` holds everything the director used to do with players (ducks, the loop crossfade, stinger timing and gating, story cues, the rare-effect release, the launch order). It talks only to `AudioOutput` (`output-core.ts`: `load`, `unload`, `play {gain, rate, at}`, `loop`, `stop`, `resume`, `fade`, `setBus`) and is tested against a fake (`__tests__/mixer.test.ts`).
  - `output.native.ts` runs effects and stingers on `react-native-audio-api`: each file is decoded once, every play is a new source (so a second play of one sound overlaps the first: C102, and the limit of 24 sources stops the oldest), a gain node per bus (`sfx`, `sting`), then the master. A stinger's `at` is passed as `start(currentTime + at)`, so the audio thread places beat 1, not a JS timer.
  - **Master limiter.** audio-api 1.0 has no compressor node, so the master is a WaveShaper with a soft-knee curve (`limiterCurve`: linear to 0.8, then bent by `tanh`). The master gain in front of it is 1/1.25 and the curve is laid out over ±1.25 (`LIMITER_RANGE`), so the 1.25 worst case of the mix table reaches the end of the curve instead of clipping: the output peaks at 0.9956 and never passes 1 (AU78, AU82). It is a static curve, not a look-ahead limiter; the files still carry the −6 dBFS ceiling. Only the effect and stinger buses go through it: music loops and story cues play on `expo-audio` and bypass it.
  - **Launch (AU39).** At start-up: the title set (click, tap, bubble) and the Downtown set (tap, cash, buy, rush), 8 effects, plus 2 loops and 2 story slots when they are first used: 12 players at most (it was 31). After the first frame the other common effects (and sparkle, milestone, fleet) load three at a time every 120 ms; a neighbourhood's nine stingers load 1.5 s after its key becomes active (as before); the rare effects are still made ahead of their moment (AU61).
  - **Overlap (C102).** The mixer counts plays of each rare effect (`RarePlays`, test T78) and unloads one only when its last play ends. Both outputs now sound a second play over the first: audio-api with a second source, the web build with a temporary second player.
  - **Other audio (AU41).** The mixer's `OtherAudioRule`: if the output says another app is playing at launch, Music is off for this session (loop, stingers, story), effects still play, and the saved preference is not written. The player turning Music on or off by hand ends the rule.
- **What stayed.**
  - Music loops and story cues stay on `expo-audio` (one native player with `loop = true`, two slots for the crossfade). Nothing in the code or here shows a looping gap, and moving them would put the loop clock on a new engine for no measured gain. If check M finds a gap, the move is to a looped `AudioBufferSourceNode` on the same context, and stinger timing then becomes exact against the loop (today it is read from the loop's `currentTime` at call time, so it is as exact as that read).
  - The web build is `expo-audio` for everything and logs the same `play()` calls; only the number of players made at start-up is lower.
  - Audio mode (`mixWithOthers`, silent switch, no background) is still `setAudioModeAsync`; the native output sets audio-api's session to the same `ambient` category.
- **What a device must still tell (DEVICE-CHECKLIST K to N).**
  - K: the launch hitch and the time to the title screen; resident memory. Buffers are decoded to 32-bit float, mono at 44.1 kHz (176 KB a second; 192 KB if the context runs at 48 kHz): a key's nine stingers are about 7 MB, all the effects about 2.7 MB, so about 10 MB in all against the 15 MB line. The AAC files are small; the decoded buffers are not.
  - L: the delay from tap to sound (audio-api's `latencyHint: 'interactive'`; under about 50 ms).
  - M: a gap or click at the loop point of the AAC loops, and the stinger landing on the beat.
  - N: a podcast started before the game. **iOS's "other audio is playing" hint is not readable from `expo-audio` or `react-native-audio-api`** (the library only reads it inside `activelyReclaimSession`, which pauses its own engine as an interruption, so effects would stop too). `output.native.ts` therefore asks an optional native module, `SliceAudioSession.isOtherAudioPlaying()` (`AVAudioSession.sharedInstance().secondaryAudioShouldBeSilencedHint`), and treats its absence as "can't tell". Until that module exists, the Music toggle still covers it and N will fail. It is a ten-line Expo module or config plugin outside `src/audio/`.
  - The `±1 st playbackRate` jitter now runs on `AudioBufferSourceNode.playbackRate` (it changes pitch with speed, as before); listen for zipper noise on `cash` at +2 st.
  - The soft limiter's curve at the loudest milestone: no audible distortion on the Whoomp plus the stinger.
- **Other apps' audio (AU41), the remaining part.** The rule and its tests are in; only the reading is missing (above).
- **Boston fallback (AU85, AU86).** Boston has no audio set of its own until v5.19 (AU25), so the director maps it onto the home city's:
  - `audioHood(hood, city)` (`logic.ts`) sends a Boston neighbourhood to the home neighbourhood at the same place in the build order (index mod 6), so its loop, stingers and triumph are the home ones; an unknown hood plays the first (Downtown). A home neighbourhood always plays itself.
  - The director finds a scene through `SCENE_INDEX` (every city's scenes, each with its city), not the home list: Boston's story cues, the MegaSlice HQ bed and its triumphs therefore play. A scene's own city, not the open game's, picks its sounds and decides whether Downtown's sparse chart applies (AU87), so a replay from the Scrapbook sounds the same in either city.
  - A full chart plays outside the home city: Downtown's sparse opening is the home city's alone.
  - The `bell-triumph` cue (the Dock Saved payoff) plays `triumph_waterfront` in any city; `triumph` plays the mapped neighbourhood's.
  - A loop the manifest lacks plays the Downtown bed (`CATALOG.music`), never a throw. A test (`logic.test.ts`) checks that every Boston scene resolves and that each of its cues maps to a manifest cue.
- **v2 work.** Arrangements that change once a shop has a manager, a rush rhythm layer kept in time with the loop, and the Boston theme, each with a per-city bundle (AU25): carried to v5.19.

## Lofi brief (2026-10-31)
**Superseded for the loops by the Lofi jazz brief (2026-11-15) at the end of this file.** The stinger, triumph and story lines below stay until round R2.
Owner direction (Julien): move the score toward a calmer, more lofi vibe. Round 1 covers the six neighbourhood loops (and Downtown's sparse chart) and the gameplay stingers. The MegaSlice villain cues (`megaslice_hq`, `megaslice_rep*`), the win triumphs, the city theme and the reveals keep their shape, tempo and energy, so `triumph_<hood>` still plays at the old tempos (`LEGACY` in `compose.py`: 126 / 112 / 96 / 84 / 92 / 104). SFX tiers moved down 2 LU for the frequent ones (tap, full, cash −28; click, bubble −32), AU72.

- **Tempos:** Downtown ♩.=84 → 66, Suburbs 112 → 86, Waterfront 96 → 80, University 84 → 76, Industrial 92 → 76 (shuffle kept at 66.7%), Uptown 104 → 84. Swing is 56–60% (Downtown's 6/8 is straight).
- **Shared bed:** Rhodes with maj7/9, add9 and min9 voicings; a brush kit; a warm round bass; then in post tape wow (±6 cents), vinyl crackle and a 7 kHz roll-off. Leads are softer (velocity ≤ 80, mid register, motif once or twice per loop).
- **Per hood:** Downtown's mandolin tremolo is slow nylon-guitar arpeggios and the tambourine is gone. Suburbs plays a muted trumpet, soft claps (a hand clap at very low velocity over a rim tick, on their own track so the swing leaves the triplet even) and a brushed march. Waterfront drops the steel drums. Industrial's organ is a pad and the cowbell is a rim click. Uptown's pompe is softened to 2 and 4 over brushes.
- **Form changes:** loops were trimmed (fewer bed bars, one motif statement per A section) so the slower tempos stay inside the size cap: Downtown 64 → 52 bars, Suburbs 48 → 32, Waterfront 40 → 32, Uptown 40 → 32; University stays at 32 and Industrial at 36. University's closing A′ is now a motif-free chord-tone tail (its motif statements are the chip A and the half-speed Rhodes). The sparse Downtown chart still lines up bar for bar.
- **Known gaps:** a perk layered over a triumph or the city theme waits for that cue's payoff (3 s cap) instead of snapping to its old-tempo bar grid (AU66); the loop is ducked −9 dB under `milestone_big`, `manager` and `build` (AU73); nothing here has been auditioned on a device.


## Lofi jazz brief (2026-11-15)
Julien, after hearing the score: the instruments at the front "sound like an awful set of bagpipes or maybe horns", and the tracks are supposed to be relaxing. He asked for "a lofi score with jazz chords and swinging drum patterns that create a relaxed groove", across the whole score. This outranks every older line in this file, including those that say villain cues and triumphs keep their energy. Round R1 (the eight loops) is written; R2 (stingers, triumphs, city theme, story cues) is not, so those sections above still describe the old sound. Nobody has listened to any of it.

- **Palette** (`tools/audio/palette.py`, enforced by the build for every cue in `JAZZ`). In front: Rhodes or electric piano, nylon or clean jazz guitar, vibraphone, marimba, kalimba, harp, celesta, soft flute, a warm pad; bass is upright or soft electric. Out: accordion and harmonica, every brass and reed program, fiddle, shanai, bagpipe, square and saw leads. Organs only at velocity 50 or under. Kit: brushes; no crash, splash or china, no toms, no tambourine, no cowbell.
- **Harmony.** Rootless voicings with extensions (maj7, maj9, min9, min11, dom9, dom13, sus13, altered dominants) between C3 and E4; ii–V and I–vi–ii–V turnarounds, tritone substitutions, a backdoor cadence, diminished passing chords, min(maj7) on the villain's tonic.
- **Swing and groove.**

  | Loop | Feel | Swing | Kit behind the beat |
  |---|---|---|---|
  | Downtown, Downtown sparse | 6/8, brush long-short ride | none (the lilt is in the ride) | 12–18 ms |
  | Suburbs | swung 4/4 | 58% | 12–18 ms |
  | Waterfront | swung 4/4, two-feel bass | 56% | 12–18 ms |
  | University | lofi hip-hop pocket | 60% | 15–21 ms, kick a further 10 ms |
  | Industrial | triplet shuffle, walking bass | 66.7% | 12–18 ms |
  | Uptown | swung 4/4, walking bass | 60% | 12–18 ms |
  | MegaSlice HQ | swung 4/4, stalking walk | 58% | 12–18 ms |

  Bass sits 5–8 ms behind the beat, the kick and snare-family hits a further ±6 ms off the grid; timing ±6 ms and velocity ±10 (kit ±12) are humanised.
- **Lead level.** A lead plays at or below its bed: `python3 tools/audio/audit.py <loop>` renders the lead tracks and everything else separately through the lofi chain and prints lead minus bed in LU. The rule is 0 LU or less, aiming at −2 to −4. Measured on the eight loops: −3.0 to −3.6 LU (`docs/build/music/reports/M1a.md`, `M1b.md`, `M1c.md`). The level is set by track volume, not by changing the master.