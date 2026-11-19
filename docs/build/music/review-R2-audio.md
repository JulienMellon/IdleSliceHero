# Music rewrite R2 (stingers, triumphs, city theme, story cues): audiocritic review

Sources: `tools/audio/compose.py` (`arrival_chord`, `story_cue`, `clash_assert`, `rep_sting`), `docs/build/music/reports/M2a.md`, `M2b.md`, `M2c.md`, `NOTES-R1.md`; `docs/AUDIO.md`.

```
VERDICT: NOT SATISFIED
SUMMARY: I can't listen and neither could the composer, so this is a check of code and measurements only; Julien's listen is the audition. Palette, hierarchy order, payoff timing, the bid's A7 to D resolution and the budget all hold. The biggest gap is that every triumph and the city theme land their payoff on the AU78 rub: the lead holds the tonic over a maj9 whose Rhodes voicing has the major 7th in it, and the clash check never runs on story cues.
MOMENTS:
- AU85 [major] Win beat / Dock Saved / city complete → triumph_* and city_theme arrival. `arrival_chord` voices the Rhodes 7-9-3-5 (`voicing_off(..., 'maj9', ...)`, G3..Bb4), and M2b says the closing phrase is "placed so its held tonic is the arrival note". So the arrival chord has the lead's degree 1 sitting a semitone or a minor ninth above the Rhodes' 7th. AU78 already ruled this out in the loops. `clash_assert` is only called in the four loop charts, not in `story_cue`, so the build can't catch it. Fix: voice the arrival as 6/9 (6 9 3 5) and keep the deep bass, strings and celesta as they are. Call `clash_assert` in `story_cue` and on the stinger tags.
- AU86 [minor] Gameplay stingers → tag chord. It is the same maj9 (7 9 3 5) under phrases that end on the tonic (the "closing" and "cadence" kinds: milestone, milestone_big, manager, build, welcome, warmth). It's the same rub on a smaller moment. Use 6/9 wherever the lead's last note is degree 1. Waterfront's and Industrial's dom9 tags are fine.
- AU87 [minor] MegaSlice scheme → megaslice_rep / _dock run at `REP_BPM = 120`, outside the plan's 70-86 range. At 4.6 s, with no swing stated, it reads as a quick alarm rather than "sneaky" villainy. Use the HQ loop's tempo and swing (58%), and let the dim7/tritone harmony carry the threat. Keep `payoffSeconds`/the length within 0.5 s by dropping a beat if needed.
- Checked, no note: victor_exit (a soft vibraphone fall and a bass bend, no slide whistle or brass); the bid's Rhodes A7 (B3 C#4 E4 G4 over A2) resolves at 0 s into the Dock Saved D maj9 (G to F#, C# held); recipe and reunion are solo nylon / nylon plus a vibraphone at -21 and -23 LUFS.
MUSIC:
- Triumph payoffs: largest drift +0.224 s (Suburbs) and -0.206 s (Industrial), both within 0.25 s. Pass, with little room: the next chart change must re-check them.
- Triumph and city-theme tempos are now the neighbourhoods' own (HOODS); the city theme is 84 bpm in Eb. Pass.
- Lead under bed, story: -2.9 to -3.5 LU. Pass.
EFFECTS & MIX:
- AU88 [minor] Lead minus bed, stingers (M2a): fleet up to -0.1 LU, build up to -0.7, manager up to -1.2, milestone_big and upgrade up to -1.5. Fleet and build fall in the -1 to 0 band. Cut the lead's track volume in those cues by 1.5 dB, or raise the bed pad. Don't make anything louder.
- AU89 [minor] Hierarchy holds in all six neighbourhoods on integrated and momentary max (M2c), but by 0.1 LU in several places: milestone_big over manager on momentary max in Uptown (0.1); manager tied with build in University (integrated and momentary max) and on Waterfront's momentary max; build over milestone on momentary max in Waterfront and University (0.1). milestone_big still sits 0.5-0.9 LU under -16, at the ceiling. This supersedes AU82: AU82's tie is gone and momentary max is now measured. Widen the gaps to 0.5 LU by thinning the manager's and build's arrival transients (a lower bass velocity, as `BASS_HOOD` already shows), not by adding level to milestone_big.
COST & PLATFORM:
- Budget: 33,240,658 B of 33,554,432 at 256 kbps, as Julien asked. Pass. The margin is 313,774 B (0.9%), so one more loop won't fit.
- AU90 [minor] Encoding: the mono stingers come out at 93-171 kbps against a 256 setting (M2c). That is fine, but `AUDIO.md` should state the actual range rather than "256".
- AU84 [minor, carried] `docs/AUDIO.md` against the code: line 25 still says "jazz waltz"; line 55 still says the "payoff crash" (there is no crash now); M2a and M2b say they didn't update the cue sheet, so check the stinger rows against M2c's programs and loudness; M2c lists programs 1-based while M2a lists them 0-based.
FIXED SINCE LAST REVIEW: AU82 (replaced by AU89: momentary max is now measured and the tie is gone); AU78 in the loops (clash_assert in all four charts).
STILL OPEN FROM LAST REVIEW: AU79, AU80, AU81, AU83, AU84 (R2 didn't touch the loops; M2c doesn't show a change to these)
```

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| AU85 | major | A | compose.py `arrival_chord`, `story_cue` | Voice the triumph/city-theme arrival as 6/9, not maj9, under the held tonic; run clash_assert on story cues. |
| AU86 | minor | A | compose.py stinger tag (`voicing_off` maj9) | Use 6/9 for the tag where the lead ends on degree 1; run the clash check on stingers. |
| AU87 | minor | A | compose.py `REP_BPM` | Play megaslice_rep at the HQ tempo and swing, not 120 bpm; keep the length within 0.5 s. |
| AU88 | minor | A | stingers fleet, build | Lead minus bed is -0.1 / -0.7 LU; lower the lead track 1.5 dB so it measures -1 LU or under. |
| AU89 | minor | A | build.py hierarchy, `BASS_HOOD` | Widen 0.1 LU hierarchy gaps to 0.5 LU by thinning manager/build transients, not by raising milestone_big. |
| AU90 | minor | A | docs/AUDIO.md encoding | State the measured kbps range (stingers 93-171) rather than a flat 256. |
| AU79 | minor | A | compose.py `university` tail | Thin the kalimba tail to one note a beat, velocity 34 or under, non-lead track; or swap tail and second bed. |
| AU80 | minor | A | compose.py `university` bed2 | Put the half-speed Rhodes motif on its own track named in `leads=`, capped at 50; re-run the audit. |
| AU81 | minor | A | compose.py `megaslice` HQ | Drop the pizzicato doubling in bars 1-2, 4, 9-10, 12 so the villain Rhodes reads. |
| AU83 | minor | A | compose.py `downtown`, `university`; AUDIO.md | Add Downtown's 8-12 ms off-beat delay or record it and University's kick as agreed deviations. |
| AU84 | minor | A | docs/AUDIO.md | Fix "jazz waltz", "payoff crash", the stale stinger rows and the 0- versus 1-based program numbering. |

Next IDs: AU91
