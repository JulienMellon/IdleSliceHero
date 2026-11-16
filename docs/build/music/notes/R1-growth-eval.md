# R1 growth evaluation: music that builds as a neighbourhood's restaurant grows

Julien, 2026-11-16: "evaluate writing the music so it builds and becomes more complex as the restaurant in each neighborhood grows". Evaluation only, nothing built. Nobody has listened to any option; the byte figures are arithmetic from `tools/audio/build/report.json`, not renders.

## Where we are
- Audio total 13,877,074 B of 14,680,064: **802,990 B (0.77 MiB) of room**. A loop is stereo AAC at 96 kbps (12,000 B per second), so a 98 s loop is about 1.2 MB. Six neighbourhood loops cost 8.69 MB.
- The score is code, so a thinner version of a chart is cheap to write (Downtown already has one: `downtown(sparse=True)`, same timeline, same `barRoots`, swapped in at the same position by the director). What costs is bytes and director work.
- The loops already open with a bed and keep a bed before the motif returns, so the "small restaurant" version is mostly the bed.

## Option A: two charts per neighbourhood (the Downtown sparse pattern, five more times)
- Work (mine): a `sparse` flag per hood function plus the existing equal-timeline assert; the thin chart is Rhodes, bass and one lead, no kit. Small, a card per two neighbourhoods.
- Bytes: five more loops. Stereo 96 kbps: +5.8 MB (cap broken by 5 MB). Mono 48 kbps: 6,000 B/s, about 0.6 MB each, **+2.9 MB**; still 2.1 MB over, so it needs the six full loops re-encoded at 80 kbps (saves about 1.2 MB) and a 4-6 bar trim on each.
- Needs outside my lane: `director.ts`/`logic.ts` choose the sparse or full file per neighbourhood level (today only Downtown's takeover does), `manifest.ts` is generated, so no hand edit; a store value for each neighbourhood's level.
- Gives two levels only. Swapping files at a bar line is audible as a change of sound, not a growth.

## Option B: stacked stems per neighbourhood (recommended)
- Each loop is split into three synchronous stems: **bed** (kit and bass), **harmony** (Rhodes or piano, pad, guitar stabs), **colour** (leads, arpeggios, bells, harp tag). The director starts the bed alone and fades in harmony, then colour, as the level rises. Three or four levels from one chart.
- Work (mine): `build.py` renders each stem from the same MIDI split by track (the audit already splits lead and bed), applies the same wow and saturation to each so they stay phase-locked, puts crackle on the bed only, and holds the loudness tier on the sum of all three. Medium: one card for the pipeline, one per neighbourhood to check each stem stands alone as a bed. A stem boundary needs the whole loop to stay a loop (seam check per stem).
- Bytes: three mono stems at 40 kbps are 15,000 B/s, about 1.47 MB per loop against 1.22 MB today: **about +1.5 MB for the six**, which is 0.7 MB over the room. Trimming each loop by about 8 bars (about 20 s) or going to 32 kbps per stem closes it. Only B fits the cap with a modest trim.
- Needs outside my lane: the director must start three players in the same audio-clock tick and keep them in step (the largest risk: players that drift by a few ms smear the swing), per-stage gain so the bed alone is not quieter than its tier, `manifest.ts` fields for the stems (generated), the same level value as A. `director.ts` and `logic.ts` tests change.

## Option C: one "grown" overlay on today's loop
- The loop stays as is for the small restaurant; one extra stem per neighbourhood (a second voice, brushes fill, pad) fades in at the top level. Cheapest director change (two players), but the base loop is already full, so the small restaurant does not get simpler, and the overlay is 2.9 MB (mono 40 kbps, about 0.5 MB each x6). Two levels. Not recommended: it adds weight and does not make the early game sparser.

## Recommendation
**B, prototyped on Suburbs first.** It is the only one that gives three or four steps within a byte budget, and it keeps one chart per neighbourhood, so the equal-timeline and `barRoots` rules cannot drift between versions. Before building: (1) Julien chooses between trimming each loop by about 20 s or raising the 14 MB cap; (2) a director spike proves three players hold sync on a device (the check `src/audio` cannot make offline); (3) one Suburbs prototype gives real stem sizes, so the +1.5 MB estimate becomes a measurement. If the spike fails, fall back to A on the bed-only level for the five neighbourhoods.
