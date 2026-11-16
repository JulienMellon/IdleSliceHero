# PLAN — Music rewrite (agent briefing and file map)

> Copy of the project doc `claude/PLAN-music-rewrite.md` (2026-11-15), so agents can read it from the repo. **How the work is run** (sessions, cards, branches, reviews) is in `docs/build/music/`; where sections 6 and 7 below differ from that folder, the folder wins.

Written 2026-11-15 for the session agents doing the work (composer, audiocritic, codecritic, tests). Repo: `JulienMellon/IdleSliceHero`, branch `main`. Owner: Julien.

## 0. Status and what is still open

- **Julien's audition note (2026-11-15), after hearing a 7-minute reel of the current score:** instruments at the front of the mix sound like "an awful set of bagpipes or maybe horns". **The tracks are supposed to be relaxing to listen to.** This is the brief; it overrides anything else in this file.
- **Likely cause (hypothesis, not heard by any agent):** the loop leads are reed and brass General MIDI patches (accordion 22, muted trumpet 60, fiddle 111, tenor sax 67, clarinet 72, square 81), rendered through a small 6 MB soundfont (TimGM6mb). Cheap reeds and brass drone and buzz in that bank, and the leads sit 2–3 dB above the Rhodes bed, so they dominate. The lofi chain (tape wow, saturation, 7 kHz roll-off) does not hide it.
- **Scope (Julien, 2026-11-15): the whole score.** Loops, Downtown sparse, MegaSlice HQ, all gameplay stingers, the six triumphs, the city theme, recipe, reunion, rep stings and Victor's exit. SFX (`sfx.py`) stay out unless Julien adds them; they only need to sit well under the new music.
- **Style (Julien, 2026-11-15): a lofi score with jazz chords and swinging drum patterns that create a relaxed groove.** This replaces the earlier "keep the villain cues and triumphs energetic" scope from 2026-10-31.

## 1. Read these first (in order)

| # | File | Why |
|---|---|---|
| 1 | `HANDOFF.md` | Loop rules, roles, commit and push procedure, owner preferences. Julien likes concrete proposals he can correct over open questions, and evidence over superlatives. Report major notes only. |
| 2 | `AUDIOLOG.md` | Current audio state, the lofi loop history (3 rounds, closed), open items AU76/AU77, the five audition checks, next ID **AU78**. |
| 3 | `docs/AUDIO.md` | The cue sheet. Sections: city motif (AU16), neighbourhood loops (AU17), story cues, gameplay stingers, SFX, mix rules, platform and cost, open items, **Lofi brief (2026-10-31)** at the end. This is the contract the director code and the audiocritic work from. |
| 4 | `.claude/agents/audiocritic.md` | Reviewer brief and severity scale. Verdict is advisory; it cannot listen, it judges the cue sheet, code and moments. |
| 5 | `docs/story/CAST.md`, `STORYLOG.md`, `src/content/scenes/home.ts` | What each moment is meant to feel like (the cue sheet maps cues to scene ids). |
| 6 | `docs/DESIGN.md` | Neighbourhood identities and tone. |

## 2. Direction

**Goal:** a relaxed lofi jazz score you can leave on for an hour. Jazz harmony, swung drums, a laid-back groove. Nothing reedy, brassy or piercing in front. Julien's words: relaxing, lofi, jazz chords, swinging drums.

### 2.1 Keep (the code, tests and story depend on these)
- **The city motif** (AU16) as the thread, and each neighbourhood's **key, tempo family and flavor**, voiced as jazz. The motif is hinted, not announced.
- **Cue names, file names, cue roles, loop seams, loudness tiers, −6 dBFS ceilings, the audio size cap** and the build checks in `tools/audio/build.py`.
- Hard constraints in section 5 (Downtown 6/8, sparse chart shares the full chart's timeline and `barRoots`, HQ starts at bar 0, bid A7 resolving to D).

### 2.2 Harmony: jazz chords
- Voice everything with extensions: maj7, maj9, min9, min11, dominant 9ths and 13ths, sus chords, a few altered dominants as passing colour. Rootless voicings on the keys, close-voiced and low in register (roughly C3–E4).
- Progressions built on ii–V–I, I–vi–ii–V turnarounds, tritone substitutions and backdoor cadences, with a tonic that resolves softly. The 12-bar blues in Industrial becomes a jazz blues (ii–V turnarounds in bars 9–12, passing diminished chords).
- Chord changes mostly every bar or two; each loop keeps one slow "home" harmonic area so it is easy to leave on.
- The bed is the star: warm electric piano or Rhodes comping, a soft guitar or vibraphone doubling, a round upright or electric bass. No leads in the front.

### 2.3 Rhythm: swinging drums, relaxed groove
- **Swing everywhere**, per-neighbourhood amount (suggest 56–62% for the 4/4 loops, true 12/8 or 6/8 swing feel for Downtown, a gentle triplet shuffle for Industrial), with the drums slightly **behind the beat** (laid-back, ~10–20 ms) and kick and snare lightly off the grid for a hand-played, lofi feel.
- Drum kit: brushes and a soft stick-on-rim ride pattern (the jazz "spang-a-lang"), feathered kick, ghosted snare notes, cross-stick on 2 and 4, pedal hat on 2 and 4, an occasional light brush swirl. No crashes, no loud toms, no tambourine or cowbell.
- Velocity humanisation (±8–12), a soft ghost-note layer, tempo in the 70–86 BPM range kept from today's loops. Drums sit under the keys.
- Bass: upright or soft electric bass walking or playing a two-feel (half notes), sitting just behind the drums.

### 2.4 Instrumentation (replace every reed and brass lead in the front)
- Allowed in front: Rhodes or electric piano, nylon or clean jazz guitar, vibraphone, marimba, kalimba, harp, soft flute at low velocity, a warm pad. Reeds and brass (accordion, trumpet, tuba, trombone, fiddle, sax, clarinet, bassoon, shanai, square lead) are **out of the front**.
- Per-neighbourhood proposal (Julien to correct):
  - **Downtown:** nylon guitar and Rhodes, 6/8 swing, warm pad (replaces the accordion). Sparse chart: nylon guitar and Rhodes only.
  - **Suburbs:** vibraphone and clean guitar, light march feel turned into a swung backbeat.
  - **Waterfront:** marimba and harp, habanera bass shaped as a gentle two-feel, shaker and brushes.
  - **University:** Rhodes and soft bell or vibraphone, the chiptune arpeggios become a soft kalimba or celesta, lofi hip-hop swing.
  - **Industrial:** muted Rhodes and warm clean guitar, jazz-blues shuffle with a ride and brushes; a soft vibraphone or flute carries the motif.
  - **Uptown:** nylon or jazz guitar and piano, manouche-style gentle "pompe" turned into a quiet swing, harp or celesta for the tag.
- Leads, when present, play at or below the bed's level (today they sit 2–3 dB above it), with low velocity, slow attacks and a little reverb.

### 2.5 The rest of the score (whole-score scope)
Everything keeps its job and length role; only the timbre, harmony and groove change. Julien's 2026-10-31 rule that villain cues and triumphs keep their energy is **superseded**: they get the same lofi jazz treatment, still readable as a moment.
- **MegaSlice HQ loop and rep stings** (`megaslice_hq`, `megaslice_rep`, `megaslice_rep_dock`, `victor_exit`): the villain is a sneaky, slightly comic jazz idea, not brass and bassoon. Suggest a minor jazz walk with a low muted vibraphone or contrabass-clarinet-free "stalking" bass line, finger snaps, and a motif on a dark Rhodes or low pizzicato bass. Tension through harmony (min(maj7), diminished, tritone) rather than loud brass. `megaslice_rep` stays short and exclusive; `victor_exit` is a comic slide on soft instruments (a descending vibraphone or bass glide), 3.2 s.
- **Triumphs (six) and the city theme:** payoff without brass. Build with swung brushes, rising Rhodes and vibraphone, a string or pad swell and a soft bell or cymbal-free "arrival" chord (a big maj9 or maj13 voicing, a deep bass note), still ending on a clear tonic at the existing payoff-crash time so `payoffSeconds` timing in the director stays correct. Keep the Waterfront bell triumph's three-strike ship's bell and the held A7 → D hand-off.
- **Recipe and reunion:** solo accordion becomes solo nylon guitar or Rhodes, rubato; reunion's sax answer becomes a soft vibraphone or flute. Keep them the quietest cues (−21 and −23 LUFS).
- **Gameplay stingers (all hoods and kinds):** regenerate in all six keys from the new leads; short jazz tags built on a maj9 or min9 chord, swung, with a soft bell colour. Same tiers and ceilings.
- **Perk, offline popup, welcome, warmth, drone, bottleneck:** same timings and ducking rules; the sound changes only.

### 2.6 Mix and mastering
- Keep the lofi chain from `post.py` (tape wow, soft saturation, vinyl crackle, 7 kHz roll-off) and the loudness tiers. With softer sources, **check the level hierarchy again**: rare big moments must still sound bigger than frequent small ones.
- Warmer and rounder: gentle high roll-off, no harsh upper mids, mild sidechain-free compression. Crackle stays a texture, not a tic.

### 2.7 Sound source: test before rewriting notes
- Suspected cause of the "bagpipe/horn" sound is the small TimGM6mb General MIDI bank. **First step for the composer: render the same Downtown chart through two or three alternative soundfonts** (a larger free GM soundfont with good Rhodes, vibraphone, nylon guitar and upright bass) and report. Pick the bank before writing the new charts. Check licence and size: audio is already at its cap, so any bank only changes the offline render, not the app, but the output AAC sizes must not grow.

### 2.8 Process (small rounds, ears before more rounds)
1. **Round 0, sound source:** soundfont comparison on one loop (above), a 60-second sample reel for Julien.
2. **Round 1, loops:** six loops, Downtown sparse and HQ, rewritten as lofi jazz. Julien listens to the reel.
3. **Round 2, stingers and story:** stingers, triumphs, city theme, recipe, reunion, villain stings, from the loop language Julien approved.
4. audiocritic reviews each round against `docs/AUDIO.md` (advisory); **Julien's listen is the gate**. No unheard rounds back to back.
5. After each round: update `docs/AUDIO.md` (instruments, tempo, form, key, loudness) and `AUDIOLOG.md` (next ID AU78).

## 3. Where the music is made

| Path | Role |
|---|---|
| `tools/audio/compose.py` (60 KB) | **The score as code.** Writes the MIDI for loops, stingers, triumphs, story cues. This is the main file the composer edits. |
| `tools/audio/mlib.py` | Music helpers (notes, bars, swing, voicings) used by `compose.py`. |
| `tools/audio/material.py` | Shared musical material (motif, scales, chord data). |
| `tools/audio/post.py` | Mastering chain: `post.lofi_loop` (tape wow, tanh saturation, crackle, 7 kHz low-pass), story master, loudness, circular seam handling. |
| `tools/audio/render.mjs` | Renders MIDI through the General MIDI soundfont (TimGM6mb) via `spessasynth_core`. |
| `tools/audio/build.py` | Runs everything: compose, render, post, AAC encode into `assets/audio/`, measure, regenerate `src/audio/manifest.ts`, write `tools/audio/build/report.json` (not committed). Fails on seam, tier or ceiling violations. |
| `tools/audio/sfx.py` | Synthesised sound effects. Out of scope unless Julien widens it. |
| `tools/audio/package.json` | Node dependency (`spessasynth_core` 4.4.2). |

Build: `cd tools/audio && npm install && pip install mido numpy scipy pyloudnorm && python3 build.py`. Needs `ffmpeg`.

## 4. Outputs the composer must regenerate (do not hand-edit)

- `assets/audio/music/` — `downtown`, `downtown_sparse`, `suburbs`, `waterfront`, `university`, `industrial`, `uptown`, `megaslice_hq` (.m4a, stereo AAC 96 kbps; loops are −20 LUFS, sparse −22, HQ −19.3).
- `assets/audio/sting/<hood>_<kind>.m4a` — gameplay stingers, 6 hoods × kinds (bottleneck, build, drone, fleet, manager, milestone, milestone_big, offline, perk, upgrade, warmth, welcome; plus `waterfront_bid`). Mono 64 kbps, tiered loudness, beat 1 at `downbeatSeconds`.
- `assets/audio/story/` — city_theme, recipe, reunion, megaslice_rep, megaslice_rep_dock, victor_exit, six `triumph_<hood>`. **In scope (whole score).**
- `assets/audio/sfx/` — out of scope; check they still sit well under the new music.
- `src/audio/manifest.ts` — generated by `build.py`. Never edit by hand.
- Audio budget: the bundle's audio is about 14 MB, **at its cap**. A rewrite must not grow it; check `report.json` sizes.

## 5. Runtime code that depends on the music (change only if a cue's shape changes)

| Path | What it assumes |
|---|---|
| `src/audio/director.ts` | Owns the players; crossfades tabs in 0.6 s, resumes each loop from its saved position, ducks under story and stingers, aligns chordal stingers to the loop's next **bar**. Line ~47 starts a 30 ms ramp timer (perf audit item: check it stops when idle). |
| `src/audio/logic.ts` | Which loop and cue, beat quantisation, voice limits, duck lengths (AU77 cap). Tested in `src/audio/__tests__/logic.test.ts`. |
| `src/audio/manifest.ts` | Per-cue file, length, tempo, meter, bar roots, loudness. **Tempo and `barRoots` changes here change when stingers land**, so a rewrite that moves a loop's tempo, meter or chord roots must come with a clean rebuild and a logic test pass. |
| `src/audio/bus.ts`, `src/audio/prefs.ts` | Event bus and Music/Sound settings. Not affected. |

Hard constraints from the cue sheet that a rewrite must keep:
- Loops are circular: the reverb tail is folded onto the start; the seam step must stay below each file's 99th-percentile sample step (build checks it).
- Downtown is 6/8 (♩.=66); its stingers use 6/8 helpers. Downtown sparse shares the full loop's **timeline and `barRoots`** because Nonna's takeover swaps one for the other at the same position.
- Every loop opens with a lead-free bed, states the motif at most twice, and has a lead-free bed before it returns.
- MegaSlice HQ always starts at bar 0.
- Waterfront's bid stinger ends on A7; the Dock Saved bell triumph must resolve it to D (AU77 behaviour).

## 6. Review and verification (the loop for this work)

1. **Composer** (Sonnet, high effort, brief limited to `tools/audio/` plus the files in sections 1 and 5): edits `compose.py` and friends in a worktree branch (the lofi loop used `wip-audio`), runs `build.py`, reports measured LUFS, peaks, seam steps, sizes. At most a 12-line report.
2. **Verify once** (orchestrator): `npx tsc --noEmit`; `npm test` (full, about 70 s; includes `src/audio/__tests__/logic.test.ts`); confirm `src/audio/manifest.ts` regenerated cleanly; confirm audio size has not grown past the cap.
3. **audiocritic** reviews the cue sheet after `docs/AUDIO.md` is updated by the composer. Advisory. It cannot hear the renders, so it will say so; do not treat its verdict as an audition.
4. **codecritic** only on its normal cadence (APPROVED means skip the next two rounds).
5. **Audition by Julien** is the real gate. Give him an audition reel the same way as this session's: loops (30 s each), triumphs, stingers, with a timestamped track list. A throwaway script that builds it is described in section 7.
6. Log: replace the "Current state" in `AUDIOLOG.md` with the new round, next ID AU78, and move the old section to `docs/logs/` (the loop rule: archive every round). Update `docs/AUDIO.md` for anything that changed (tempo, form, key, loudness).
7. Commit to `main` per `HANDOFF.md` step 4 (rebase on origin, push). Bump `APP_VERSION` in `src/content/version.ts` by 0.1 only with a real build.

## 7. Making the audition reel (what was done on 2026-11-15)

- The reel (`Slice_Empire_Music_Reel.mp3`, 7:01) was built with ffmpeg from the committed `assets/audio/*.m4a` files: about 30 s from the start of each loop, the villain stings, all six triumphs, recipe, reunion, and a sample of stingers. Each clip got a short fade in, a fade out, a gap, and one overall `loudnorm` to about −16 LUFS. Loudness was flattened across tiers, so it does **not** reflect the in-game mix.
- Reuse the same approach for the next audition, or per-loop reels at full length (a loop is 89–114 s). The script is not committed.

## 8. Open items that touch the same files

- **AU76 and AU77** (Collect silenced as it starts; perk duck over a triumph's payoff): fixed after the lofi loop, **unreviewed**. Whoever touches `director.ts` or `logic.ts` should re-read the tests for both.
- **AU39 / AU40 / AU41** (device checks: launch hitch, gapless AAC looping, "other audio is playing" hint): need a development build with `react-native-audio-api`; waiting on Julien. Gapless looping matters more if loops get longer.
- **AU25** (audio v2: arrangements that change with a manager, a rush rhythm layer, a Boston theme): deferred. Do not fold into this rewrite unless Julien asks.
- **Five audition checks** in `AUDIOLOG.md` still apply to the new render.
- Marketing: the 15 s promo ad draft in `marketing/ad/` uses current audio; revisit if loops change.

## 9. Do not

- Do not change `manifest.ts` by hand, rename cue files, or change cue keys. Do not change the director's timing rules (`payoffSeconds`, ducks) unless a cue's shape forces it.
- Do not touch pacing, economy, story text or scene triggers.
- Do not exceed the audio size cap.
- Do not run unheard rounds back to back; stop after each round plus review and get Julien's ears on it.
- Do not put brass, reeds or fiddle in the front of any cue.
