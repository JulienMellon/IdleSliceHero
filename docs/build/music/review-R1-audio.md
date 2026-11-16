# Music rewrite R1 (the eight loops): audiocritic review

Sources: `tools/audio/compose.py`, `jazz.py`, `palette.py`, `material.py`, `audit.py`; `docs/build/music/reports/M1a.md`, `M1b.md`, `M1c.md`; `tools/audio/build/report.json`; `docs/AUDIO.md`.

```
VERDICT: NOT SATISFIED
SUMMARY: I can't listen and neither could the composer, so this is a check of code and measurements only; Julien's listen is the audition. Palette, lead level, tempos, swing and the hard constraints hold on all eight loops; the biggest gap is that the motif's home note lands a minor ninth or a semitone above the Rhodes' major 7th at its own cadence in four loops.
MOMENTS:
- AU81 [minor] MegaSlice scheme → megaslice_hq → the villain Rhodes (pitches 43-56) shares its octave with the walking bass (33-55), the pizzicato doubling (45-67) and the comping (48-64), at -3.4 LU under them. Four parts in one octave: the motif may not read. Drop the pizzicato in the bars that carry the line (1-2, 4, 9-10, 12); keep it in bar 0 and bars 5-8, 13-16. Not louder, just clear.
MUSIC:
- AU78 [major] Motif cadence, Suburbs / University / Downtown / Uptown. The melody's tonic sits on a I maj9 whose voicing holds the major 7th underneath.
  - Suburbs `a_h` bar 2 beats 3-4 and bar 4 (3 beats), both A sections: vibraphone G4 (67) over Gmaj9, whose two possible voicings both contain F#3 (54). 13 semitones, a minor ninth, on the phrase's last note.
  - University `a_h` bars 2 and 4: kalimba B♭3 and B♭4 against A3 (in every B♭maj9 voicing): a semitone and a minor ninth. The half-speed Rhodes motif holds B♭4 for 2 beats (bar 1) and 4 beats (bar 4) over the same chord.
  - Downtown `a_m` bar 1 (F3 inside C3 E3 G3 A3) and bar 3 (1.5 beats, Fmaj9); Uptown `a_h` bars 2 and 4 (E♭3 against D3 when that inversion is chosen): a semitone.
  - The reports' melody check counts the root as a chord tone, so it could not see this. It contradicts section 2.2 ("a tonic that resolves softly").
  - Fix: where a lead holds degree 1 for a beat or more, voice I as `6/9` (bar 1 of the 4/4 A already does). `barRoots` don't change. Add to the check: fail a lead note 1 or 13 semitones above a comp note for a beat or more; exempt `megaslice_hq`, where the rub is the point.
- AU79 [minor] University, loop return. The form closes on `tail`: 4 bars of kalimba eighths (pitches 60-76, track volume 127, a `leads=` track) right up to the seam. M1b's "last bed has none" refers to bars 20-27 and skips the tail. Thin it to one note a beat at velocity 34 or under on a non-lead track (as Downtown's arpeggio and Waterfront's marimba), or swap the tail and the second bed.
- AU80 [minor] University, second motif statement. It is on the `rhodes` track at velocity 52 (up to 62 after humanising), so `lead_cap=50` doesn't apply and `audit.py` counts it as bed. Give it its own Rhodes track named in `leads=`; re-run the audit.
- AU83 [minor] Groove against R1 default D4. Downtown has no "off-beat eighths late by 8-12 ms" (`jazz_finish(s, 0.0)`, humanise only); University's kit is 15-21 ms late and its kick 29 ms on average, outside "12-18 ms everywhere". Code and `AUDIO.md` agree with each other; implement Downtown's delay (kit and comp off-beats) or record both as agreed deviations.
- Checked, no note:
  - Palette: programs 24, 4, 89, 32, 11, 26, 9, 46, 12, 108, 33, 73, 27, 0, 45 and kit notes 36 37 38 40 44 51 70; none banned.
  - Tempos 99 (dotted quarter 66), 86, 80, 76, 76, 84, 76. Swing 58 / 56 / 60 / 66.7 / 60, HQ 58.
  - Voicings asserted inside C3-E4; changes every bar or half bar with a home area in each loop; Industrial is a real jazz blues (ii-V turnarounds, #IV dim).
  - Kit and bass laid back in code; velocity ±10 (kit ±12), timing ±6 ms.
  - Sparse `barRoots`, bars, seconds and bpm asserted equal to the full chart. Motif stated twice in every loop. Lead-free intro in all eight. HQ keeps `restart` and opens on the vamp.
  - Bid A7 → D and triumph `payoffSeconds`: those cues are untouched (R2), and no old values are listed in M1a-c yet.
- For Julien's listen, not a note: Industrial's flute (chorus 3, bars 1-2, A4-F#5) is the only sustained wind in the round, so it is the first place to listen for "horn". Downtown's nylon line (48-67) sits inside the Rhodes' register (48-64), so listen for whether the motif is audible at all.
EFFECTS & MIX:
- Lead minus bed: -3.0 to -3.6 LU on all eight loops (rule 0 or less). Pass.
- AU82 [minor] Stinger hierarchy after the bank-C re-render (`report.json`). No inversion, but `milestone_big` over `build` is 0.2 (Downtown), 0.1 (Suburbs), 0.1 (Waterfront), 0.0 (University, tied at -17.1), 0.4 (Industrial), 0.5 LU (Uptown) against a 1 LU tier gap; all are held at the -6 dBFS ceiling. Momentary max is in none of the three measures files, so half of this check is unmeasured. In R2: soften the bell and arrival transients of `milestone_big` so it reaches -16 under the ceiling (not louder sources), and report integrated plus momentary max per neighbourhood.
COST & PLATFORM:
- Size: 13,867,227 bytes of 14,680,064; seams 0.0001-0.0025 against 99th percentiles of 0.011-0.028. Pass.
- AU84 [minor] `docs/AUDIO.md` against the code.
  - Line 3 still says every cue renders through TimGM6mb.
  - The stinger paragraph's measured figures are the old render (`milestone_big` "-16.3 to -16.8" is now -16.5 to -17.3; `manager` -17.1 to -17.5).
  - "13.2 MB" and "14 MB" are MiB beside a byte count.
  - Downtown is called a "jazz waltz" in 6/8.
  - M1a lists programs 0-based and M1c 1-based without saying so.
FIXED SINCE LAST REVIEW: n/a (AU76 and AU77 are fixed in `src/audio`, which this track doesn't review)
STILL OPEN FROM LAST REVIEW: none in this track's scope
```

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU78 | major | A | compose.py `suburbs_chart`, `university_chart`, `downtown_chart`, `uptown_chart` | Where a lead holds degree 1 a beat or more, voice I as 6/9, not maj9; add a 1- or 13-semitone clash check. |
| AU79 | minor | A | compose.py `university` tail | Thin the kalimba tail to one note a beat, velocity 34 or under, non-lead track; or swap tail and second bed. |
| AU80 | minor | A | compose.py `university` bed2 | Put the half-speed Rhodes motif on its own track named in `leads=`, capped at 50; re-run the audit. |
| AU81 | minor | A | compose.py `megaslice` HQ | Drop the pizzicato doubling in bars 1-2, 4, 9-10, 12 so the villain Rhodes reads. |
| AU82 | minor | A | stingers / build.py (R2) | Soften `milestone_big` transients to reach -16 under the ceiling; report integrated and momentary max per neighbourhood. |
| AU83 | minor | A | compose.py `downtown`, `university`; AUDIO.md | Add Downtown's 8-12 ms off-beat delay or record it and University's 29 ms kick as agreed deviations from D4. |
| AU84 | minor | A | docs/AUDIO.md | Fix the TimGM6mb line, the stale stinger measurements, the MB/MiB units and "jazz waltz". |

Next IDs: AU85
