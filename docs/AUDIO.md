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
A scene plays its own neighbourhood's loop, ducked −8 dB. `panelCue()` gives beats 1–3 their defaults; wins and reveals set `cue` in `scenes/home.ts`. Exclusive cues stop the loop (it fades out) while they play. Story cues alternate between two players, so an outgoing cue always fades over 300 ms instead of stopping dead. Skip fades story cues and stingers in 0.4 s, and a scene's first panel fades any gameplay stinger in 150 ms.

| Moment | Cue | File | Length | Treatment |
|---|---|---|---|---|
| Beat 1, first panel with a character (downtown-1: the last panel, when Nonna smiles) | `welcome` | `sting/<hood>_welcome` | 3–5 s | The character's opening phrase on their neighbourhood's lead instrument, in its meter, with a harp roll; lands on the loop's next bar |
| Beat 2, panel 1 | `warmth` | `sting/<hood>_warmth` | 5–7 s | Cadence and closing phrase, softer, over slow strings |
| Beat 3, MegaSlice HQ panels | `megaslice` | `music/megaslice_hq` | 17 bars, 53.7 s, loop | C minor at ♩=76, a sneaky march: a one-bar tuba vamp, then the bassoon villain motif `5, 1 ♭3 ♭5 ♭6 5 | ♭6 5 ♭5 4 1`, muted-trumpet stabs, pizzicato, timpani. **Always starts at bar 0**, so every scheme opens on the vamp and the motif |
| Beat 3, first Rep panel; waterfront-4 panel 1 | `rep` | `story/megaslice_rep` | 4.7 s, exclusive | The villain motif at double speed on bassoon and tuba, plus a trombone glissando down. The loop drops out in 80 ms (no key clash) |
| Beat 4 win | `triumph` | `story/triumph_<hood>` | 6.5–10.6 s (payoff crash at 3.8–7.5 s), exclusive | A two-beat snare swell, then the motif and closing phrase on the lead with brass, strings and timpani, in the neighbourhood's key, tempo and meter, over its own rhythm section (tarantella bass and tambourine; marching snare; habanera and shaker; lo-fi kit and Rhodes; shuffle, ride and organ; pompe and walking bass). It ends on a tutti tonic with a crash. Panels: downtown-4 p2, suburbs-4 p3, university-4 p3, industrial-4 p4, uptown-4 p1 |
| Dock Saved | `bell-triumph` | `story/triumph_waterfront` | 10.7 s, exclusive | A three-strike ship's bell (Tubular Bells 15) opens the triumph (waterfront-4 p2) |
| Recipe card | `recipe` | `story/recipe` | 10 s, exclusive | Solo accordion, rubato: a slight push into the phrase, then a held breath after every long note that carries forward (downtown-4 p3); −21 LUFS |
| "...Salvatore?" | `reunion` | `story/reunion` | 17 s, exclusive | Solo accordion in F at ♩=60, the tenor sax answers with the closing phrase, then both play it in unison over a string pad (industrial-4 p2). Mastered to −23 LUFS (recipe −21, offline popup −20), the quietest cues in the game |
| Victor's exit | `victor-exit` | `story/victor_exit` | 3.2 s | The tuba deflates and a trombone slides down (uptown-4 p2) |
| City complete | `city-theme` | `story/city_theme` | 26.9 s, exclusive, once | The six leads enter one bar apart in build order (accordion, trumpet, fiddle, square, sax, clarinet), each adding the opening phrase while the earlier ones hold chord tones over a rising bed. Then the whole band plays A′, with the fiddle and clarinet a diatonic third above. **The panel waits for the cue to finish** before auto-advancing; a tap still advances it (uptown-4 p4) |
| Perk card | `perk` | `sting/<hood>_perk` | 2.7 s | The opening phrase on glockenspiel and harp, in the scene's key, layered over any story cue still ringing |
| Offline popup opens | `offline` | `sting/<hood>_offline` | 2.6 s | The closing phrase on celesta, in the active key; the loop ducks −8 dB while the popup is open; −20 LUFS |

## Gameplay stingers (AU14, AU31, AU32, AU36)
Every stinger is rendered in all six keys (`sting/<hood>_<kind>`), as mono AAC at 64 kbps, peaking at −6 dBFS or below. Each is written in its neighbourhood's meter (Downtown's are 6/8, built from `M68`/`CLOSE68`) and swung like its loop. Beat 1 sits one beat in (`downbeatSeconds`), after its pickup. The director aligns beat 1 with the loop's next **bar** for every chordal stinger, so their tonic lands where the loop's harmony restarts. Only `bottleneck` waits for the next beat (a dotted quarter in Downtown). The instant SFX always plays at the tap.

**Gate (`StingGate`).** `bottleneck` plays at most once per 20 s. While a stinger sounds, any of equal or lower priority is dropped (never restarted, never stacked); a higher one takes over. Priority: `milestone_big` > `manager` = `build` > `milestone` = `welcome` = `warmth` > `upgrade` = `fleet` = `drone` = `perk` = `offline` > `bottleneck`. SFX play at 0.7 gain while a stinger sounds. The active key's set is preloaded 1.5 s after a neighbourhood change.

| Event (store) | Stinger | Length | Loudness | Duck |
|---|---|---|---|---|
| Station buy that changes the bottleneck (`buy`), ≤ 1 per 20 s | `bottleneck`: opening phrase on the lead, plus a splash | 1 bar | −20 LUFS | −3 dB |
| Station level crosses 25/50 | `milestone`: opening and closing phrases with brass and a I–V–I bed, plus a crash | 3 bars | −17 | −6 dB |
| Station level reaches 100 | `milestone_big`: as above, with a timpani roll | 3 bars | −15 | −6 dB |
| Hire manager | `manager`: cadence and closing phrase over strings (ii–V–I), triangle | 3 bars | −15 | −6 dB |
| Expand, oven grade | `upgrade`: opening phrase on brass, an octave up | 2 bars | −18 | −6 dB |
| Fleet (scooter, car, van) | `fleet`: the same, plus a horn "beep-beeep" | 2 bars | −18 | −6 dB |
| Fleet (drone) | `drone`: on square lead, with a chip arpeggio | 2 bars | −18 | −6 dB |
| Build a pizzeria (`build`) | `<new hood>_build`: the new neighbourhood's lead states the motif with glockenspiel and claps, played at once | 3 bars | −15 | −14 dB |
| Pier 9 bid (`bidPier9`) | `waterfront_bid`: held V7 over a timpani roll, unresolved (waterfront-4 resolves it), with the gavel SFX "knock, knock, SOLD" | 2.6 s | −16 | −10 dB |

## Sound effects (AU21)
All effects are mono AAC at 64 kbps: 0.17 MB in total, 42 files. Loudness is set by tier (AU36), so rare big moments are louder than frequent small ones, and every peak is limited to −6 dBFS or below:

| Tier | Effects | Loudness |
|---|---|---|
| UI | click, bubble | −30 LUFS |
| Constant | tap, full, cash | −26 |
| Per purchase | buy, refused, rush (sparkle −24) | −22 |
| Upgrades | milestone, expand, grade, fleet | −19 |
| Gavel | gavel | ≈ −22 (transient-limited) |
| Building | build | ≈ −18 |
| Collect, by size | collect | −19, −17.5, −16 |

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
- **No master bus.** `expo-audio` has no master bus, so clipping is prevented in the files. Loops sit at −18 LUFS; story cues at −16 LUFS (reveals −21/−23); stingers and SFX by tier. A look-ahead limiter keeps every stinger, story cue and SFX at or below −6 dBFS. The worst case is a milestone: stinger, ducked loop, buy, whoomp and three cash pops, with SFX at 0.7 under the stinger. That keeps a ≥ 3 dB margin before 0 dBFS.
- **Ducking.** The loop's gain is the product of its active ducks: scene −8 dB, stinger −6 dB (bottleneck −3 dB) for the stinger's length, exclusive story cue to silence. Ramps take 80 ms down and 400 ms up.
- **Music off or app in the background.** The loop pauses rather than playing at volume 0.

## Platform and cost (AU23, AU24)
- **Audio mode.** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false })`. The app follows the ring/silent switch, plays alongside the player's own music or podcast, and stops in the background. The config plugin sets `enableBackgroundPlayback: false`, so there is no `UIBackgroundModes: audio`.
- **Settings.** Music and Sound toggles, stored under `slice-empire/audio/v1` so that Reset game keeps them.
- **Players.**
  - Music: 2.
  - SFX: tap, cash, buy, full, refused and click are created at start-up, one player per variant (20). The rest are created on first use, then kept. A one-shot is rewound right after it ends, so the next `play()` is immediate; one still sounding is seeked first and played once the seek lands.
  - Stingers: the active key's 9 are preloaded 1.5 s after a neighbourhood change; a key change releases them (`remove()`).
  - Story: two players (for fades).
  - Nothing is created per tap.
- **Size.**

| Group | Size |
|---|---|
| Music | 8.4 MB (7 loops plus the HQ loop) |
| Stingers | 3.3 MB (73) |
| Story | 1.4 MB |
| SFX | 0.17 MB |
| **Total** | **13.3 MB** (the test caps it at 14 MB) |

- **Web.** Nothing plays until the first pointer press, because browsers block autoplay. `scripts/screenshots.py` logs every `play()` into `report.json` under `audio`.

## Open (device checks and v2)
- **Device checks (AU39, AU40).** On an iPhone SE 2 or XR, measure:
  - the launch hitch and resident memory with about 40 players;
  - the delay from tap to sound;
  - gapless looping of AAC;
  - the ±1 st `playbackRate` jitter with `shouldCorrectPitch = false`.
  - **If the delay is over 50 ms or memory is over about 15 MB**, move SFX and stingers to `react-native-audio-api`: buffers decoded once, gain per bus, a compressor as master limiter, sample-accurate stinger timing. It needs a development build rather than Expo Go, so it's Julien's call.
- **Other apps' audio (AU41).** `expo-audio` doesn't expose iOS's "other audio is playing" hint, so the loops can't mute themselves when a podcast is on; the Music toggle covers it. Revisit with `react-native-audio-api` or a small config plugin.
- **v2 work.** Arrangements that change once a shop has a manager, a rush rhythm layer kept in time with the loop, and the Boston theme (AU25).
