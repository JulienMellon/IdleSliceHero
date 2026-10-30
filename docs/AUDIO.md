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
GM programs are 1-based here (`compose.py` uses 0-based numbers). All loops are mastered to −18 LUFS and encoded as stereo AAC at 96 kbps.

| Area | Blend | Tempo, meter | Key | Instruments (GM) | Loop | Form |
|---|---|---|---|---|---|---|
| Downtown | Neapolitan mandolinata × tarantella | ♩.=84 (♩=126), 6/8 | F | Accordion 22 lead; Steel gtr 26 as 16th tremolo "mandolin"; Pizzicato 46 off-beats; Ac. bass 33 on the dotted quarters; tambourine | 64 bars, 91.4 s | intro 8, A 16 (motif, answer, development on pizzicato, closing), bed 8, B 16 (mandolin, then accordion an octave down), A′ 8, bed 8 |
| Downtown (sparse, AU20) | The same chart with only accordion and mandolin | same | F | 22, 26 | same, same timeline | Plays until downtown-4 (Nonna takes over), then the full band takes over at the same position |
| Suburbs | Sunny Americana × youth-sports marching band | 112, 4/4 | G | Trumpet 57 lead; Steel gtr 26 strum; Glockenspiel 10; Ac. bass 33; kit with claps | 48 bars, 102.9 s | intro 8, A 8 (the "Go, Mud-hens!" triple clap answers each phrase), chant 4, B 8 (glockenspiel and guitar), march 8 (snare cadence, glockenspiel answer), A′ 4, bed 8 |
| Waterfront | Sea shanty × habanera | 96, 4/4 | D Mixolydian | Fiddle 111 lead; Accordion 22 pad; Marimba 13; Ac. bass 33 habanera; Steel drums 115 (phrase-end fills only); shaker and congas | 40 bars, 100 s | intro 8, A 8, B 8 (marimba with steel drums; bVII instead of the diminished iii), A′ 4 (fiddle with accordion), bed 12 |
| University | Lo-fi hip-hop × chiptune | 84, 4/4, 58% swing | B♭ | Square lead 81 (motif as note-octave-fifth arpeggios); Rhodes 5 with maj7/9 voicings; Vibraphone 12; Synth bass 39; soft kit; tape roll-off and vinyl crackle | 32 bars, 91.4 s | intro 4, A 8 (chip motif), B 8 (vibes), bed 8 (the Rhodes plays the motif at half speed), A′ 4 |
| Industrial | Shuffle blues × work song | 92, triplet shuffle | A (12-bar blues, true dominant 7ths) | Tenor sax 67 lead with a blue flat-3 grace; Drawbar organ 17 stabs; Clean gtr 28 chops and riff; Finger bass 34 boogie; kit; cowbell 56 "anvil" on 2 and 4 | 36 bars (3 choruses), 93.9 s | chorus 1: guitar riff, no lead; chorus 2: the sax states the motif; chorus 3: organ, then the sax closes with a ghost accordion doubling the last 4 bars (foreshadows Brother Sal) |
| Uptown | Parisian musette × manouche swing | 104, 60% swing | E♭ | Clarinet 72 lead with chromatic approach notes; Jazz gtr 27 "pompe" on every beat; Piano 1; Upright bass 33 walking; ride and pedal hat "brushes"; Accordion 22 (B only) | 40 bars, 92.3 s | intro 4, A 8, B 8 (clarinet low, accordion), bed 8 (piano), A′ 4, tag 8 |

**Transitions (AU19).** Switching tabs crossfades in 0.6 s. Each loop remembers its position and resumes from it. Two music players exist at most.

**Seams.** The reverb tail past the loop end is folded onto the start. The decoded join step is below each file's 99th-percentile sample step (checked at build time). AAC adds about 10 ms of padding: **check on a device** that `loop = true` is gapless. If it isn't, crossfade between the two players.

## Story cues (AU12, AU13, AU18)
A scene plays its own neighbourhood's loop, ducked −8 dB. `panelCue()` gives beats 1–3 their defaults; wins and reveals set `cue` in `scenes/home.ts`. Exclusive cues stop the loop (it fades out) while they play; Skip fades a story cue out in 0.4 s.

| Moment | Cue | File | Length | Treatment |
|---|---|---|---|---|
| Beat 1, first panel with a character | `welcome` | `sting/<hood>_welcome` | 4–6 s | The character's opening phrase on their neighbourhood's lead instrument, with a harp roll; lands on the loop's next beat |
| Beat 2, panel 1 | `warmth` | `sting/<hood>_warmth` | 5–7 s | Cadence and closing phrase, softer, over slow strings |
| Beat 3, MegaSlice HQ panels | `megaslice` | `music/megaslice_hq` | 16 bars, 50.5 s, loop | C minor at ♩=76, a sneaky march: staccato tuba, bassoon villain motif `5, 1 ♭3 ♭5 ♭6 5 | ♭6 5 ♭5 4 1`, muted-trumpet stabs, pizzicato, timpani. Crossfades in and out like a tab change |
| Beat 3, first Rep panel; waterfront-4 panel 1 | `rep` | `story/megaslice_rep` | 4.7 s | The villain motif at double speed on bassoon and tuba, plus a trombone glissando down |
| Beat 4 win | `triumph` | `story/triumph_<hood>` | 14.3 s, exclusive | Snare-roll swell into the full motif on the lead instrument, with brass, strings, timpani and a crash ending, in the neighbourhood's key. Panels: downtown-4 p2, suburbs-4 p3, university-4 p3, industrial-4 p4, uptown-4 p1 |
| Dock Saved | `bell-triumph` | `story/triumph_waterfront` | 14.4 s, exclusive | A three-strike ship's bell (Tubular Bells 15) opens the triumph (waterfront-4 p2) |
| Recipe card | `recipe` | `story/recipe` | 10.7 s, exclusive | Solo accordion, rubato, with the phrase ends stretched (downtown-4 p3) |
| "...Salvatore?" | `reunion` | `story/reunion` | 17 s, exclusive | Solo accordion in F at ♩=60, the tenor sax answers with the closing phrase, then both play it in unison over a string pad (industrial-4 p2). Mastered to −23 LUFS (recipe −21, offline popup −20), the quietest cues in the game |
| Victor's exit | `victor-exit` | `story/victor_exit` | 3.2 s | The tuba deflates and a trombone slides down (uptown-4 p2) |
| City complete | `city-theme` | `story/city_theme` | 49.4 s, exclusive, once | The six leads enter in build order (accordion, trumpet, fiddle, square, sax, clarinet), then the whole band plays the A phrase (uptown-4 p4) |
| Perk card | `perk` | `story/perk` | 2.4 s | The opening phrase on glockenspiel and harp |
| Offline popup opens | — | `story/offline_open` | 2.1 s | The closing phrase on celesta |

## Gameplay stingers (AU14)
Every stinger is rendered in all six keys (`sting/<hood>_<kind>`), as mono AAC at 64 kbps, mastered to −16 LUFS. Beat 1 sits at `downbeatSeconds`, after its pickup. The director aligns beat 1 with the loop's next beat (an eighth note in Downtown), or the next bar for `manager`. The instant SFX always plays at the tap, so feedback never waits for the beat.

| Event (store) | Stinger | Length | Duck |
|---|---|---|---|
| Station buy that changes the bottleneck (`buy`) | `bottleneck`: opening phrase on the lead, plus a splash | 1 bar | −3 dB |
| Station level crosses 25/50 (`buy`) | `milestone`: opening and closing phrases with brass, plus a crash | 2 bars | −6 dB |
| Station level reaches 100 | `milestone_big`: as above, with a timpani roll | 2 bars | −6 dB |
| Hire manager | `manager`: cadence and closing phrase over strings, triangle | 2 bars, waits for the bar | −6 dB |
| Expand, oven grade | `upgrade`: opening phrase on brass, an octave up | 1.5 bars | −6 dB |
| Fleet (scooter, car, van) | `fleet`: the same, plus a horn "beep-beeep" | 1.5 bars | −6 dB |
| Fleet (drone) | `drone`: on square lead, with a chip arpeggio | 1.5 bars | −6 dB |
| Pier 9 bid (`bidPier9`) | `waterfront_milestone_big`, played at once | 2 bars | −6 dB |

## Sound effects (AU21)
All effects are mono AAC at 64 kbps, peaking at −9 dBFS: 0.16 MB in total, 41 files. They are synthesised in `sfx.py` from one palette of wood, dough, warm metal and kitchen fire. Runtime pitch jitter is ±1 semitone unless noted, done with `playbackRate` and `shouldCorrectPitch = false`. Variants rotate and never repeat back to back.

| # | Moment (trigger) | File | Length | Variation |
|---|---|---|---|---|
| 1 | Kitchen tap (storefront `onPress`) | `tap_0..3` | 0.12 s | 4 variants: dough thump, slap and sizzle |
| 2 | Queue full | `full_0..1` | 0.10 s | 2 variants of a muted wooden tok, ±0.5 st |
| 3 | Purchase OK (`commit` → `buy`) | `buy_0..7` | 0.35 s | A two-note marimba rising a fourth, with shimmer. Steps up a semitone per purchase within 2 s (`PurchaseChain`), capped at +7 |
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

## Mix rules (AU22)
- **No master bus.** `expo-audio` has no master bus, so clipping is prevented in the files: SFX peak at −9 dBFS, stingers and story cues at −16 LUFS, loops at −18 LUFS. Every file goes through a soft limiter at −1 dBFS (SFX at −6).
- **Ducking.** The loop's gain is the product of its active ducks: scene −8 dB, stinger −6 dB (bottleneck −3 dB) for the stinger's length, exclusive story cue to silence. Ramps take 80 ms down and 400 ms up.
- **Music off or app in the background.** The loop pauses rather than playing at volume 0.

## Platform and cost (AU23, AU24)
- **Audio mode.** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false })`. The app follows the ring/silent switch, plays alongside the player's own music or podcast, and stops in the background. The config plugin sets `enableBackgroundPlayback: false`, so there is no `UIBackgroundModes: audio`.
- **Settings.** Music and Sound toggles, stored under `slice-empire/audio/v1` so that Reset game keeps them.
- **Players.**
  - Music: 2.
  - SFX: the hot effects (tap, cash, buy, rush, refused, full, click, bubble) are created at start-up, one player per variant. The rest are created on first use, then kept.
  - Stingers: only the active key's are kept, created on first use; a key change releases them (`remove()`).
  - Story: one player.
  - Nothing is created per tap.
- **Size.**

| Group | Size |
|---|---|
| Music | 8.4 MB (7 loops plus the HQ loop) |
| Stingers | 2.1 MB (54) |
| Story | 2.1 MB |
| SFX | 0.16 MB |
| **Total** | **12.7 MB** |

- **Web.** Nothing plays until the first pointer press, because browsers block autoplay. `scripts/screenshots.py` logs every `play()` into `report.json` under `audio`.

## Open (device checks and v2)
- **Device checks.**
  - Gapless looping of AAC.
  - The latency of the first SFX play.
  - The ±1 st `playbackRate` jitter with `shouldCorrectPitch = false` on iOS.
- **v2 work.** Arrangements that change once a shop has a manager, a rush rhythm layer kept in time with the loop, and the Boston theme (AU25).
