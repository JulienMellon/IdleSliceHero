"""Chord release check (notes round R1): does the keyboard comping let go before the next chord begins?

    python3 keys_release.py                       # the eight lofi loops
    python3 keys_release.py downtown suburbs

For each loop it reads build/midi/<loop>.mid (the file the render uses, after swing, humanising and laid-back) and takes
the keyboard comping tracks (names 'rhodes' and 'piano'). Notes that start within 150 ms of each other form one hit; a hit of three or more notes is a chord (University's
Rhodes also plays one single-note melody statement, which is not counted).
For every hit it finds the next hit and prints, over the whole loop:
  hits/bar    chord hits per bar (the busyness)
  overlap     hits whose last note is still sounding when the next hit begins (the drone Julien heard), as a count
  gap min/med the silence, in seconds, between the last note-off of a hit and the next hit's first note-on
  hold max    the longest a hit is held, in seconds
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MIDI = os.path.join(HERE, 'build', 'midi')
KEYS = ('rhodes', 'piano')
LOOPS = ['downtown', 'downtown_sparse', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown', 'megaslice_hq']


def hits(loop: str):
    """[(start s, end s)] for each chord hit of the keyboard tracks, plus beats per bar in seconds and the bar count."""
    mid = mido.MidiFile(os.path.join(MIDI, loop + '.mid'))
    man = json.load(open(os.path.join(MIDI, 'manifest.json')))[loop]
    tempo = 500000
    for tr in mid.tracks:
        for m in tr:
            if m.type == 'set_tempo':
                tempo = m.tempo
    sec = lambda ticks: ticks * tempo / 1e6 / mid.ticks_per_beat
    out = []
    for tr in mid.tracks:
        name = next((m.name for m in tr if m.type == 'track_name'), '')
        if name not in KEYS:
            continue
        t, open_, notes = 0, {}, []
        for m in tr:
            t += m.time
            if m.type == 'note_on' and m.velocity > 0:
                open_.setdefault(m.note, []).append(t)
            elif m.type in ('note_off', 'note_on') and open_.get(m.note):
                notes.append((sec(open_[m.note].pop(0)), sec(t)))
        notes.sort()
        cur = None
        for (a, b) in notes:
            if cur and a - cur[0] <= 0.15:
                cur[1] = max(cur[1], b)
                cur[2] += 1
            else:
                if cur:
                    out.append(tuple(cur))
                cur = [a, b, 1]
        if cur:
            out.append(tuple(cur))
    out = sorted((a, b) for (a, b, n) in out if n >= 3)  # a hit of fewer than three notes is a melody note, not a chord
    return out, man['seconds'], man['bars']


def measure(loop: str) -> dict:
    hs, secs, bars = hits(loop)
    gaps = [hs[i + 1][0] - hs[i][1] for i in range(len(hs) - 1)]
    return dict(loop=loop, hits_per_bar=round(len(hs) / bars, 2), overlap=sum(g < 0 for g in gaps), hits=len(hs),
                gap_min=round(min(gaps), 3), gap_med=round(float(np.median(gaps)), 3),
                hold_max=round(max(b - a for a, b in hs), 2), hold_med=round(float(np.median([b - a for a, b in hs])), 2))


def main(argv):
    loops = [a for a in argv if not a.startswith('--')] or LOOPS
    rows = [measure(l) for l in loops]
    print(f'{"loop":16} {"hits/bar":>8} {"overlap":>8} {"gap min":>8} {"gap med":>8} {"hold med":>9} {"hold max":>9}')
    for r in rows:
        print(f'{r["loop"]:16} {r["hits_per_bar"]:8} {str(r["overlap"]) + "/" + str(r["hits"]):>8} {r["gap_min"]:8} '
              f'{r["gap_med"]:8} {r["hold_med"]:9} {r["hold_max"]:9}')
    return rows


if __name__ == '__main__':
    main(sys.argv[1:])
