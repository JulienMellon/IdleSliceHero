# R2 — stingers and story cues

**Scope:** everything that is not a loop: the gameplay stingers in all six neighbourhoods, the Pier 9 bid, the six triumphs, the city theme, the MegaSlice rep stings, Victor's exit, recipe and reunion. All in the loop language Julien approved in R1. Sound effects stay as they are.

**Start check:** STATE `heard:` must show a yes for R1. If it doesn't, stop and ask Julien (README section 3).

## Cards (one composer at a time, in this order)
| ID | What | Card |
| --- | --- | --- |
| M2a | Gameplay stingers and the bid | `card-M2a.md` |
| M2b | Six triumphs and the city theme | `card-M2b.md` |
| M2c | Villain stings, Victor's exit, recipe, reunion; the hierarchy check; the full build; the cue sheet | `card-M2c.md` |

If Julien's yes on R1 came with notes, M2a gets `extra: Julien's notes: docs/build/music/notes/R1.md. Apply the ones about loops first, with card-NOTES.md's rules, and rebuild those loops.`

Each card is a fresh `composer`.

## Flow
1. M2a → M2b → M2c.
2. Verify (README section 6), commit, push.
3. Review: `audiocritic`, **full effort**, on the whole score (measures: M2a, M2b, M2c; `PREV` is `review-R1-audio.md`).
4. One fix pass for bugs and majors, then verify and commit again.
5. Reel preset `R2` (M2c defines it: about 5 minutes). If loops changed in this session, build and send preset `R1` as well.
6. Stop.

## The question for Julien
"Do the stingers and story moments sit well over the loops: still readable as moments, nothing poking out? Say 'go' to close the rewrite, or tell me which cue and what to change. Default: nothing merges as final until you answer."

## Defaults
- **D1, lengths:** every stinger and story cue stays within 0.5 s of its length today; `megaslice_rep` and `megaslice_rep_dock` stay under 5.5 s; `victor_exit` stays near 3.2 s.
- **D2, triumph timing:** each triumph and the city theme lands its arrival chord within 0.25 s of today's `payoffSeconds`. The cues move to the loop tempos and lose bars to fit; they don't keep the old fast tempos.
- **D3, the arrival:** a wide maj9 or maj13 voicing, a deep bass note and a soft bell. No brass, no crash cymbal. Waterfront keeps the three-strike ship's bell and the A7 to D hand-off.
- **D4, tiers:** unchanged (`STING_LUFS`, `STORY_MASTER`, `LUFS_OVERRIDE` in `build.py`). If softer sources can't reach a tier under the −6 dBFS ceiling, the cue is quieter, never louder, and the measures file says by how much.
- **D5, hierarchy:** `milestone_big` over `manager` and `build`, over `milestone`, over `upgrade`, over `bottleneck`, on integrated and on momentary-max loudness. The build enforces it after M2c.
- **D6, sound effects:** not edited. The measures file lists each SFX tier next to the stinger tiers so Julien and the audiocritic can see the distances.
