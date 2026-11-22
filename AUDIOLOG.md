# Audio log

The **audiocritic** (`.claude/agents/audiocritic.md`) reviews music, sound effects and the mix against the emotion of each moment. It runs at low effort at the end of the build loop and is advisory. The cue sheet is `docs/AUDIO.md`. Older state (the 2026-10-30 hold, the 2026-10-31 lofi loop, lofi round 3 and AU58 to AU77 detail) is in `docs/logs/AUDIOLOG-archive.md`.

**Next ID: AU91.**

## Current state: the music rewrite, closed 2026-11-22 (Julien: "Yes on the music reel music go")
**Brief (Julien, 2026-11-15):** the instruments at the front "sound like an awful set of bagpipes or maybe horns"; he asked for "a lofi score with jazz chords and swinging drum patterns that create a relaxed groove", across the whole score. It outranks every older line. Code: `tools/audio/compose.py`, `jazz.py`, `palette.py` (the build enforces it).

**Bank:** MuseScore General (`MuseScore_General_Full.sf3`, bank C; the file states "MIT, parts PD or CC0"; `tools/audio/BANKS.md` has the sha256), named in `tools/audio/BANK`.

**What each round rewrote**
- R1: the eight loops (Downtown and its sparse chart, Suburbs, Waterfront, University, Industrial, Uptown, MegaSlice HQ). Notes round 2 (2026-11-19) thinned the Rhodes to 2 or 3 note voicings, with less reverb and chorus.
- R2: 73 stingers, six triumphs, the city theme, two rep stings, Victor's exit, recipe, reunion; then the AU79 to AU90 fix pass (6/9 arrivals, HQ tempo, hierarchy gaps of 0.3 LU or more). 153 cues, no brass, reed, crash or tambourine.
- Notes round 3: 192 kbps everywhere, Downtown's own stinger ladder 2 LU lower, `triumph_downtown` starts at 0 s, new `story/splash_theme`. 28,030,177 B of the 32 MB cap.

**What Julien said**
- R0, 2026-11-16: "C". R1 reel, 2026-11-16: "I like this excerpt, it might be my favorite of the six tracks"; the Rhodes chords drone, muddy, the sustain not releasing before the next chord; "I rather like the swinging hi hats and brushed snare". 2026-11-19: "more articulate ... less smearing ... crisper, simpler phrasing"; cap 25 MB; "Go".
- R2 reel, 2026-11-19: hear the whole score at a higher bitrate; cap 32 MB; 256 kbps. 2026-11-22: "the stingers and story moments do not sit well over the music"; then "only the downtown stinger lands wrong"; "Downtown triumph has a gap around 0:07"; "Instrument bank is ok"; "Game needs a splash screen theme song"; 192 kbps from now on; "Yes on the music reel music go".

**Audiocritic, R2 (last verdict):** NOT SATISFIED (advisory), 1 major (AU85, fixed), 10 minor. Table as filed; the fix pass (2026-11-19) did the code or doc fix for each, and no later review has re-checked them:

| ID | Note |
| --- | --- |
| AU85, AU86 | Arrival and stinger tag as 6/9, not maj9; clash check on story cues |
| AU87 | Rep stings at the HQ tempo and swing |
| AU88 | Stinger leads 1.5 dB lower |
| AU89 | Widen 0.1 LU hierarchy gaps |
| AU90, AU84 | AUDIO.md: measured kbps, stale rows |
| AU79, AU80, AU81 | University tail and bed2, HQ pizzicato |
| AU83 | Deviations recorded; Julien agreed 2026-11-22 |

**Open, not this track's:** AU39 device checks (and crackle under a podcast), AU40 `react-native-audio-api`, AU41 other-audio hint (all Julien); AU25 v2 arrangements, rush layer, Boston theme (card A2); AU76 (Collect silenced as it starts) and AU77 (perk over a triumph's payoff) fixed after the lofi loop, never reviewed, the codecritic's full review covers them.

**Audition checks for Julien (ring switch on; AirPods and speaker)**
1. `downtown_milestone_big` and `industrial_manager` over their loops: the arrival chord and bass note land; the bell stays clear; clearly bigger than a plain milestone. Then the Downtown stinger kinds over `downtown_sparse`: do they sit in the loop.
2. 10 min idle in Suburbs or Uptown: crackle a texture, not a tic; wow not seasick; no audible seam; then a podcast underneath.
3. A MegaSlice scheme into its win: HQ's Rhodes motif over the bed, `megaslice_rep`'s unresolved chord, then the triumph's 6/9 arrival chord and bass note as the payoff (no crash).
4. Pier 9 bid, Dock Saved, `triumph_waterfront`: the held A7 resolves to D; the three bell strikes.
5. Fast buying, rush and a milestone: nothing clips or blurs; then a daily claim and the offline Collect: Collect is heard every time (AU76).
