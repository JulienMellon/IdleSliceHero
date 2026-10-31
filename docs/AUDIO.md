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
GM programs are 1-based here (`compose.py` uses 0-based numbers). The six neighbourhood loops (and Downtown's sparse chart) are mastered to −20 LUFS with a −6 dBFS peak ceiling (lofi round 1; was −18 / −4 in AU52), and encoded as stereo AAC at 96 kbps. They go through the lofi chain in `post.lofi_loop`: tape wow (±6 cents, two slow sines whose periods divide the loop), soft tanh tape saturation, gentle vinyl crackle, and a 7 kHz low-pass, all circular so the seam holds. `downtown_sparse` is mastered 2 LU lower (−22 LUFS) so Nonna's takeover lifts. The MegaSlice HQ loop gets no tape chain: a 10 kHz roll-off, −19 LUFS target (measured −19.3) and a −6 dBFS peak. Each loop's manifest entry carries `barRoots`, the chord degree on every bar's downbeat, so stingers can wait for the tonic.

| Area | Blend | Tempo, meter | Key | Instruments (GM) | Loop | Form |
|---|---|---|---|---|---|---|
| Downtown | Neapolitan mandolinata × tarantella, played slow | ♩.=66 (♩=99), 6/8, straight | F | Accordion 22 lead; Nylon gtr 25 slow arpeggios (a tone a beat; replaces the 16th "mandolin" tremolo); Rhodes 5; Pizzicato 46 (one off-beat a bar); Ac. bass 33 on the dotted quarters; brush kit (no tambourine) | 52 bars, 94.5 s | intro 4, A 16 (motif, answer, development on pizzicato, closing), bed 4, B 16 (nylon guitar, then accordion an octave down), A′ 8 (motif again), bed 4 |
| Downtown (sparse, AU20) | The same chart with only accordion and guitar | same | F | 22, 25 | same, same timeline (52 bars, same `barRoots`) | Plays until downtown-4 (Nonna takes over), then the full band takes over at the same position |
| Suburbs | Sunny Americana × youth-sports marching band, brushed | 86, 4/4, 58% swing | G | Muted trumpet 60 lead; Steel gtr 26 soft backbeat strum; Glockenspiel 10; Rhodes 5; Ac. bass 33; brush kit with soft claps | 32 bars, 89.3 s | intro 4, A 4 (the "Go, Mud-hens!" three soft claps answer the phrase), bed 4, B 8 (glockenspiel and guitar), march 4 (brushed cadence, glockenspiel answer), A′ 4, bed 4 |
| Waterfront | Sea shanty × habanera | 80, 4/4, 56% swing | D Mixolydian | Fiddle 111 lead (softer); Accordion 22 pad; Marimba 13; Rhodes 5 (bVII as Cmaj9); Ac. bass 33 habanera (gentle); shaker, congas and a rim tick. Steel drums are out | 32 bars, 96 s | intro 4, A 4, bed 4, B 8 (marimba), A′ 4 (fiddle with accordion), bed 8 |
| University | Lo-fi hip-hop × chiptune | 76, 4/4, 58% swing | B♭ | Square lead 81 (motif as note-octave-fifth arpeggios, softer); Rhodes 5 with wide maj9/min9 voicings; Vibraphone 12 shimmer and B lead; Synth bass 39; brush kit | 32 bars, 101.1 s | intro 4, A 4 (chip motif), bed 4, B 8 (vibes), bed 8 (the Rhodes plays the motif at half speed), tail 4 (chip chord-tone arpeggios, no motif) |
| Industrial | Shuffle blues × work song | 76, triplet shuffle (66.7%) | A (12-bar blues, true dominant 7ths) | Tenor sax 67 lead (one octave lower than before) with a blue flat-3 grace; Drawbar organ 17 as a soft pad (chorus 3); Clean gtr 28 riff (chorus 1); Rhodes 5 dominant 9ths; Finger bass 34 sparse shuffle; brush kit with a rim click on 2 and 4 (was the cowbell "anvil") | 36 bars (3 choruses), 113.7 s | chorus 1: guitar riff, no lead; chorus 2: the sax states the motif; chorus 3: organ pad, then the sax closes with a ghost accordion doubling the last 4 bars (foreshadows Brother Sal) |
| Uptown | Parisian musette × manouche swing | 84, 60% swing | E♭ | Clarinet 72 lead with chromatic approach notes; Jazz gtr 27 "pompe" only on 2 and 4, very soft; Rhodes 5; Piano 1 (bed and tag); Upright bass 33 walking; brush kit (ride, brush tap and pedal hat on 2 and 4, feathered kick); Accordion 22 (B only) | 32 bars, 91.4 s | intro 4, A 4, B 8 (clarinet low, accordion), bed 4 (piano), A′ 4, tag 8 |

Every loop shares one bed: a Rhodes (rootless maj7/9, add9 and min9 voicings, a long chord on 1 and a quieter answer on the "and" of 2), a brush kit (GM kit 40: low-velocity kick, rim click on the backbeat, closed hat at ±10 velocity and ±8 ms), and a warm bass. Leads play at velocity 80 or lower, state the motif once or twice a loop, and sit about 2–3 dB above the Rhodes while they play.

**Transitions (AU19).** Switching tabs crossfades in 0.6 s. Each loop remembers its position and resumes from it. Two music players exist at most.

**Seams.** The reverb tail past the loop end is folded onto the start. The join step (last sample to first) is below each file's 99th-percentile sample step: `build.py` checks it for every loop and stops if it fails (measured join steps are 0.0004–0.003 against 99th percentiles of 0.02–0.04). AAC adds about 10 ms of padding: **check on a device** that `loop = true` is gapless. If it isn't, crossfade between the two players.

## Story cues (AU12, AU13, AU18)
A scene plays its own neighbourhood's loop, ducked −8 dB. `panelCue()` gives beats 1–3 their defaults; wins and reveals set `cue` in `scenes/home.ts`. Exclusive cues stop the loop (it fades out) while they play. Story cues alternate between two players, so an outgoing cue always fades over 300 ms instead of stopping dead. A triumph is never replaced before its payoff crash plus one beat (`payoffSeconds`); the next cue waits. If the app goes to the background, a cue is paused and resumed on return when more than 0.5 s of it is left. Control Center and notifications don't pause anything. Skip fades story cues and stingers in 0.4 s, and a scene's first panel fades any gameplay stinger in 150 ms.

| Moment | Cue | File | Length | Treatment |
|---|---|---|---|---|
| Beat 1, first panel with a character (downtown-1: the last panel, when Nonna smiles) | `welcome` | `sting/<hood>_welcome` | 3–6.5 s | The character's opening phrase on their neighbourhood's lead instrument, in its (new, slower) meter, with a Rhodes roll; lands on the loop's next bar |
| Beat 2, panel 1 | `warmth` | `sting/<hood>_warmth` | 6–7.5 s | Cadence and closing phrase, softer, over a Rhodes pad |
| Beat 3, MegaSlice HQ panels | `megaslice` | `music/megaslice_hq` | 17 bars, 53.7 s, loop, −19.3 LUFS | C minor at ♩=76, a sneaky march: a one-bar tuba vamp, then the bassoon villain motif `5, 1 ♭3 ♭5 ♭6 5 | ♭6 5 ♭5 4 1`, trombone stabs (staccato; the muted trumpet now belongs to Suburbs), pizzicato, timpani. **Always starts at bar 0**, so every scheme opens on the vamp and the motif |
| Beat 3, first Rep panel | `rep` | `story/megaslice_rep` | 4.7 s, exclusive, −18 LUFS | The villain motif at double speed on bassoon and tuba, plus a trombone glissando down. The loop drops out in 80 ms (no key clash) |
| waterfront-4 panel 1 (after the bid) | `rep` | `story/megaslice_rep_dock` | 4.7 s, exclusive | The same in D minor over a held A pedal, so the bid's A7 is still hanging when the bell triumph resolves it to D. It waits for the bid stinger to finish |
| Beat 4 win | `triumph` | `story/triumph_<hood>` | 6.5–10.6 s (payoff crash at 3.8–7.5 s), exclusive | A two-beat snare swell, then the motif and closing phrase on the lead with brass, strings and timpani, in the neighbourhood's key, tempo and meter, over its own rhythm section (tarantella bass and tambourine; marching snare; habanera and shaker; lo-fi kit and Rhodes; shuffle, ride and organ; pompe and walking bass). It ends on a tutti tonic with a softer crash (velocity 96, timpani 100). Mastered at −18 LUFS (peak −8.8 to −10.0 dBFS) through the story master (tape saturation, 10 kHz roll-off; no wow or crackle), so the jump from a ducked lofi loop is smaller. Panels: downtown-4 p2, suburbs-4 p3, university-4 p3, industrial-4 p4, uptown-4 p1 |
| Dock Saved | `bell-triumph` | `story/triumph_waterfront` | 10.7 s, exclusive | A three-strike ship's bell (Tubular Bells 15) opens the triumph (waterfront-4 p2) |
| Recipe card | `recipe` | `story/recipe` | 10 s, exclusive | Solo accordion, rubato: a slight push into the phrase, then a held breath after every long note that carries forward (downtown-4 p3); −21 LUFS |
| "...Salvatore?" | `reunion` | `story/reunion` | 17 s, exclusive | Solo accordion in F at ♩=60, the tenor sax answers with the closing phrase, then both play it in unison over a string pad (industrial-4 p2). Mastered to −23 LUFS (recipe −21, offline popup −20), the quietest cues in the game |
| Victor's exit | `victor-exit` | `story/victor_exit` | 3.2 s | The tuba deflates and a trombone slides down (uptown-4 p2) |
| City complete | `city-theme` | `story/city_theme` | 26.9 s, exclusive, once, −18 LUFS (peak −8.1) | The six leads enter one bar apart in build order (accordion, trumpet, fiddle, square, sax, clarinet), each adding the opening phrase while the earlier ones hold chord tones over a rising bed. Then the whole band plays A′, with the fiddle and clarinet a diatonic third above. **The panel waits for the cue to finish** before auto-advancing; a tap still advances it (uptown-4 p4) |
| Perk card | `perk` | `sting/<hood>_perk` | 2.6–4.1 s | The opening phrase on glockenspiel and Rhodes, in the scene's key, layered over any story cue still ringing |
| Offline popup opens | `offline` | `sting/<hood>_offline` | 2.6–3.7 s | The closing phrase on celesta over a soft Rhodes chord, in the active key; the loop ducks −8 dB while the popup is open; −22 LUFS |

## Gameplay stingers (AU14, AU31, AU32, AU36)
Every stinger is rendered in all six keys (`sting/<hood>_<kind>`), as mono AAC at 64 kbps, peaking at −6 dBFS or below. Each is written in its neighbourhood's **new** tempo and meter (Downtown's are 6/8, built from `M68`/`CLOSE68`) and swung like its loop. Since lofi round 1 they share the loops' palette: the hood's lead and a Rhodes, no crash or splash cymbals, a bell colour the bed lacks (a glockenspiel an octave above the lead at velocity ~50; celesta in Suburbs, whose loop already has a glockenspiel), shorter reverb (tail trimmed at −46 dBFS, 0.3 s fade), hard tape saturation (headroom 3) and the same 7 kHz roll-off, and a soft mallet swell (vibraphone under a rising expression curve, then a soft low thump) where a timpani roll used to be. Every tier sits 2 LU lower than before, with the loops. Stingers are normalised after the mono fold (AU59), and `build.py` fails any stinger more than 0.5 LU off its tier (or short of it without touching the −6 dBFS ceiling). All 73 land on their tier exactly, peaking at −6.4 to −14.1 dBFS, so the limiter is idle. Measured by tier: bottleneck and offline −22, milestone and welcome −19, manager and build −17, milestone_big −16, upgrade, fleet, drone, warmth and perk −20, bid −18. Beat 1 sits one beat in (`downbeatSeconds`), after its pickup. The director aligns beat 1 with the loop's next **bar** for every chordal stinger, so their tonic lands where the loop's harmony restarts. Only `bottleneck` waits for the next beat (a dotted quarter in Downtown). The instant SFX always plays at the tap.

**Gate (`StingGate`).** `bottleneck` plays at most once per 20 s. While a stinger sounds, any of equal or lower priority is dropped (never restarted, never stacked); a higher one takes over. Priority: `milestone_big` > `manager` = `build` > `milestone` = `welcome` = `warmth` > `upgrade` = `fleet` = `drone` = `perk` = `offline` > `bottleneck`. SFX play at 0.7 gain while a stinger sounds. The set for the active key (during a scene, the scene's key) is preloaded 1.5 s after a change. A stinger still sounding at a key change is released only when it ends. The duck and the gate last for the stinger's music (`musicSeconds`), not its reverb tail; every 4/4 neighbourhood is now under 100 bpm, so milestone and manager stingers are 2 bars everywhere (Downtown's are 3 bars of 6/8).

**Tonic alignment (AU47, AU63).** Bar-quantised stingers wait for the next bar whose chord is I (from `barRoots`), up to 2 bars ahead, but only when a bar is 2.5 s or shorter (`LONG_BAR_SECONDS`: Downtown's 6/8 at 1.8 s). At the lofi tempos a bar is 2.8–3.2 s, so the search is off: the stinger takes the next bar, and on a non-I bar the loop ducks a further −6 dB. The wait stays under about one bar plus the pickup (~3.2 s).

**Build and bid stingers carry into their scene (AU42).** Building opens the neighbourhood's unlock scene at once, and the bid opens Dock Saved. Their stingers keep playing through the scene's first panel, and that panel's `welcome` or `rep` waits for them to end.

| Event (store) | Stinger | Length | Loudness | Duck |
|---|---|---|---|---|
| Station buy that changes the bottleneck (`buy`), ≤ 1 per 20 s | `bottleneck`: opening phrase on the lead with a bell (no Rhodes chord, since it only waits a beat) | 1 bar | −22 LUFS | −3 dB |
| Station level crosses 25/50 | `milestone`: opening and closing phrases over a I–V–I Rhodes bed, a bell doubling the lead, a brush-swirl crescendo into the last bar | 2 bars (Downtown 3) | −19 | −6 dB |
| Station level reaches 100 | `milestone_big`: as above with a longer, louder swirl, a soft mallet swell, then a bass root and a celesta octave on the arrival | 2 bars (Downtown 3) | −16 | −6 dB |
| Hire manager | `manager`: cadence and closing phrase over Rhodes (ii–V–I), a bell and a brush swirl into the last bar | 2 bars (Downtown 3) | −17 | −6 dB |
| Expand, oven grade | `upgrade`: opening phrase on the lead with a rising Rhodes arpeggio | 2 bars | −20 | −6 dB |
| Fleet (scooter, car, van) | `fleet`: the same, plus a soft horn "beep-beeep" | 2 bars | −20 | −6 dB |
| Fleet (drone) | `drone`: on square lead, with a soft chip arpeggio | 2 bars | −20 | −6 dB |
| Build a pizzeria (`build`) | `<new hood>_build`: the new neighbourhood's lead states the motif with a bell, Rhodes and soft claps, played at once | 2 bars (Downtown 3) | −17 | −14 dB |
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
- **No master bus.** `expo-audio` has no master bus, so clipping is prevented in the files. Lofi loops sit at −20 LUFS, peaking at −8 to −9 dBFS (the ceiling is −6; the tape saturation keeps the limiter idle), Downtown's sparse chart at −22; the MegaSlice HQ loop at −19.3 / −6; triumphs, the city theme and the rep stings at −18 (peaks −8 to −10); other story cues at −16 LUFS (reveals −21/−23); stingers (−17 to −22 by tier) and SFX by tier. A look-ahead limiter keeps every stinger, story cue and SFX at or below −6 dBFS.
- **Worst case: a milestone.** Coincident peaks are summed as amplitudes:

  | Layer | Peak | Amplitude |
  |---|---|---|
  | Loop, ducked −6 dB | −14 dBFS (loop peaks −8) | 0.20 |
  | Stinger | −6 dBFS | 0.50 |
  | Whoomp at 0.7 | −9.6 dBFS | 0.33 |
  | Buy at 0.7 | −13 dBFS | 0.22 |

  The total is 1.25, but only if every peak landed on the same sample, which a 0.4 s whoomp, a 0.35 s marimba and the stinger's beat 1 (aligned to the next bar, not the tap) never do. Measured RMS sums stay below −12 dBFS. **Check on a device with the limiter-free path**; if it clips, the `react-native-audio-api` master compressor (open item) is the fix.
- **Ducking.** The loop's gain is the product of its active ducks: scene −8 dB, stinger −6 dB (bottleneck −3 dB) for the stinger's length, exclusive story cue to silence. Ramps take 80 ms down and 400 ms up.
- **Music off or app in the background.** The loop pauses rather than playing at volume 0.

## Platform and cost (AU23, AU24)
- **Audio mode.** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false })`. The app follows the ring/silent switch, plays alongside the player's own music or podcast, and stops in the background. The config plugin sets `enableBackgroundPlayback: false`, so there is no `UIBackgroundModes: audio`.
- **Settings.** Music and Sound toggles, stored under `slice-empire/audio/v1` so that Reset game keeps them.
- **Players.**
  - Music: 2.
  - SFX: tap, cash, buy, rush, bubble, full, refused and click are created at start-up, one player per variant (27). Sparkle, milestone and fleet are created on first use and kept. The rare one-shots (collect, build, gavel, grade, expand) are created for each play and released when it ends. A one-shot is rewound right after it ends, so the next `play()` is immediate; one still sounding is seeked first and played once the seek lands.
  - Stingers: the active key's 9 are preloaded 1.5 s after a neighbourhood change; a key change releases them (`remove()`).
  - Story: two players (for fades).
  - Nothing is created per tap.
- **Size.**

| Group | Size |
|---|---|
| Music | 8.6 MB (7 lofi loops plus the HQ loop; slower tempos, so the bars were trimmed) |
| Stingers | 3.0 MB (73) |
| Story | 1.4 MB |
| SFX | 0.17 MB |
| **Total** | **13.3 MB** (the test caps it at 14 MB) |

- **Web.** Nothing plays until the first pointer press, because browsers block autoplay. `scripts/screenshots.py` logs every `play()` into `report.json` under `audio`.

## Open (device checks and v2)
- **Device checks (AU39, AU40).** On an iPhone SE 2 or XR, measure:
  - the launch hitch and resident memory: 31 players at start-up (27 SFX, 2 music, 2 story), at most about 45 with the active key's stingers and the kept effects;
  - the delay from tap to sound;
  - gapless looping of AAC;
  - the ±1 st `playbackRate` jitter with `shouldCorrectPitch = false`.
  - **If the delay is over 50 ms or memory is over about 15 MB**, move SFX and stingers to `react-native-audio-api`: buffers decoded once, gain per bus, a compressor as master limiter, sample-accurate stinger timing. It needs a development build rather than Expo Go, so it's Julien's call.
- **Other apps' audio (AU41).** `expo-audio` doesn't expose iOS's "other audio is playing" hint, so the loops can't mute themselves when a podcast is on; the Music toggle covers it. Revisit with `react-native-audio-api` or a small config plugin.
- **v2 work.** Arrangements that change once a shop has a manager, a rush rhythm layer kept in time with the loop, and the Boston theme (AU25).

## Lofi brief (2026-10-31)
Owner direction (Julien): move the score toward a calmer, more lofi vibe. Round 1 covers the six neighbourhood loops (and Downtown's sparse chart) and the gameplay stingers. The MegaSlice villain cues (`megaslice_hq`, `megaslice_rep*`), the win triumphs, the city theme and the reveals keep their shape, tempo and energy, so `triumph_<hood>` still plays at the old tempos (`LEGACY` in `compose.py`: 126 / 112 / 96 / 84 / 92 / 104). SFX tiers moved down 2 LU for the frequent ones (tap, full, cash −28; click, bubble −32), AU72.

- **Tempos:** Downtown ♩.=84 → 66, Suburbs 112 → 86, Waterfront 96 → 80, University 84 → 76, Industrial 92 → 76 (shuffle kept at 66.7%), Uptown 104 → 84. Swing is 56–60% (Downtown's 6/8 is straight).
- **Shared bed:** Rhodes with maj7/9, add9 and min9 voicings; a brush kit; a warm round bass; then in post tape wow (±6 cents), vinyl crackle and a 7 kHz roll-off. Leads are softer (velocity ≤ 80, mid register, motif once or twice per loop).
- **Per hood:** Downtown's mandolin tremolo is slow nylon-guitar arpeggios and the tambourine is gone. Suburbs plays a muted trumpet, soft claps (a hand clap at very low velocity over a rim tick, on their own track so the swing leaves the triplet even) and a brushed march. Waterfront drops the steel drums. Industrial's organ is a pad and the cowbell is a rim click. Uptown's pompe is softened to 2 and 4 over brushes.
- **Form changes:** loops were trimmed (fewer bed bars, one motif statement per A section) so the slower tempos stay inside the size cap: Downtown 64 → 52 bars, Suburbs 48 → 32, Waterfront 40 → 32, Uptown 40 → 32; University stays at 32 and Industrial at 36. University's closing A′ is now a motif-free chord-tone tail (its motif statements are the chip A and the half-speed Rhodes). The sparse Downtown chart still lines up bar for bar.
- **Known gaps:** a perk layered over a triumph or the city theme waits for that cue's payoff (3 s cap) instead of snapping to its old-tempo bar grid (AU66); nothing here has been auditioned on a device.
