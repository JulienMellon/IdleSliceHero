# R1 — the loops

**Scope:** the six neighbourhood loops, Downtown's sparse chart and the MegaSlice HQ loop, rewritten as lofi jazz through the bank Julien chose. Stingers, triumphs and story cues are R2; in this round they only have to keep building.

## Cards (one composer at a time, in this order)
| ID | What | Card |
| --- | --- | --- |
| M1a | The shared jazz language, the palette check, Downtown and Downtown sparse | `card-M1a.md` |
| M1b | Suburbs, Waterfront, University | `card-M1b.md` |
| M1c | Industrial, Uptown, MegaSlice HQ, the full build, the cue sheet | `card-M1c.md` |

`extra` for M1a: `Julien's bank answer and notes: docs/build/music/notes/R0.md. Letter table: top of docs/build/music/reports/M0.md.`

Each card is a fresh `composer`. Don't continue one composer across cards: the shared language lives in `tools/audio/jazz.py` after M1a, so a fresh one loses nothing and starts with an empty context.

## Flow
1. M1a → M1b → M1c. After M1a, set `bank:` in STATE from its report.
2. Verify (README section 6), commit, push.
3. Review: `audiocritic`, **full effort**, on this round (measures: M1a, M1b, M1c).
4. One fix pass for bugs and majors, then verify and commit again.
5. Reel preset `R1` (about 4 minutes: 30 s of each of the eight loops).
6. Stop.

## The question for Julien
"Are these loops relaxing enough to leave on, and is anything still bagpipe-like or horn-like? Say 'go' to start the stingers and story cues in this language, or tell me which loop and what to change. Default: nothing else is built until you answer."

## Defaults
- **D1, tempo, key, metre, bar count:** unchanged from today's loops (Downtown 6/8 at dotted quarter = 66 in F, 52 bars; Suburbs 86 in G, 32; Waterfront 80 in D Mixolydian, 32; University 76 in B♭, 32; Industrial 76 in A, 36; Uptown 84 in E♭, 32; HQ 76 in C minor, 17). A loop is trimmed only if the audio total would pass 14 MB.
- **D2, palette:** the banned programs are out of the whole score, not only out of the front. A sustained reed or accordion pad behind the band is the likeliest "bagpipe". Organ is allowed only as a pad at velocity 50 or under.
- **D3, instruments:** the per-neighbourhood proposal in section 2.4 of the plan, as written on the cards.
- **D4, swing:** Suburbs 58%, Waterfront 56%, University 60%, Uptown 60%, Industrial a triplet shuffle (66.7%), Downtown a 6/8 lilt with the off-beat eighths late by 8–12 ms. Drums 12–18 ms behind the beat everywhere.
- **D5, lead level:** lead minus bed between −2 and −4 LU on every loop; 0 or above fails the card.
- **D6, HQ:** moves onto the lofi chain like the other loops and keeps its own loudness tier (−19 LUFS) and its start at bar 0.
- **D7, stingers and triumphs in this round:** they change timbre where they read a neighbourhood's lead from the shared table. That is accepted for one round as long as the build's tier checks pass. They are not on the R1 reel.
- **D8, harmony changes `barRoots`:** allowed. The roots come from the chart through the build, and the full test suite must pass afterwards.
