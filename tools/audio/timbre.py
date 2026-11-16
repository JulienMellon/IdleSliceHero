"""Timbre proxy table (card M0): for each bank and GM program, how bright and how droning the render measures.

    python3 timbre.py [A B C D] > table.md

Plays the city motif's opening phrase (material.MOTIF: degrees 1 3 5 6 5 in C major, middle C, velocity 64, 80 bpm) and then,
in a second file, one 2-second C4 at velocity 64. Measures, from the raw render (no mastering):
  centroid  spectral centroid in Hz of the phrase (power spectrum of the whole phrase plus its first 0.5 s of decay)
  2-5 kHz   share of that power between 2 and 5 kHz, percent
  sustain   RMS of the held note from 1.0 to 1.5 s after its onset over RMS of its first 0.2 s (a high value is a drone)
  own       whether the bank has a preset with that bank/program number, and its name; otherwise the synth falls back
These numbers are a proxy for harshness and droning. Nobody has listened.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import mido
import numpy as np

import post
import material as M
from mlib import p

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, 'build', 'timbre')
SR = post.SR
BANKS = {'A': 'TimGM6mb.sf2', 'B': 'FluidR3_GM.sf2', 'C': 'MuseScore_General_Full.sf3', 'D': 'GeneralUser-GS.sf2'}
PROGRAMS = [('Rhodes', 4), ('nylon guitar', 24), ('jazz guitar', 26), ('clean guitar', 27), ('vibraphone', 11), ('marimba', 12),
            ('kalimba', 108), ('harp', 46), ('celesta', 8), ('flute', 73), ('warm pad', 89), ('acoustic bass', 32),
            ('accordion (reference)', 21), ('muted trumpet (reference)', 59)]
BPM = 80
TPB = 480


def make_mid(path: str, program: int, notes: list[tuple[float, float, int]]):
    """notes: (start beat, duration beats, pitch), velocity 64, channel 0."""
    m = mido.MidiFile(type=1, ticks_per_beat=TPB)
    meta, tr = mido.MidiTrack(), mido.MidiTrack()
    m.tracks += [meta, tr]
    meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM), time=0))
    tr.append(mido.Message('program_change', channel=0, program=program, time=0))
    ev = []
    for t, d, pi in notes:
        ev += [(int(round(t * TPB)), 1, pi), (int(round((t + d) * TPB)), 0, pi)]
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tk, on, pi in ev:
        tr.append(mido.Message('note_on' if on else 'note_off', channel=0, note=pi, velocity=64 if on else 0, time=tk - last))
        last = tk
    m.save(path)


def rms(x):
    return float(np.sqrt(np.mean(x ** 2) + 1e-18))


def measure(bank: str, program: int, tag: str) -> dict:
    os.makedirs(WORK, exist_ok=True)
    phrase, t = [], 0.0
    for d, dur in M.MOTIF:
        phrase.append((t, dur * 0.95, p('C4') + [0, 2, 4, 5, 7, 9, 11][(d - 1) % 7]))
        t += dur
    mp = os.path.join(WORK, f'{tag}_phrase.mid')
    make_mid(mp, program, phrase)
    a = post.to_mono(post.render_midi(mp, tail=0.5, bank=bank))[:, 0]
    a = a[:int((t * 60 / BPM + 0.5) * SR)]
    w = np.hanning(len(a))
    P = np.abs(np.fft.rfft(a * w)) ** 2
    f = np.fft.rfftfreq(len(a), 1 / SR)
    centroid = float((f * P).sum() / P.sum())
    share = float(P[(f >= 2000) & (f <= 5000)].sum() / P.sum() * 100)
    mp2 = os.path.join(WORK, f'{tag}_held.mid')
    make_mid(mp2, program, [(0.0, 2.0 * BPM / 60, p('C4'))])
    h = post.to_mono(post.render_midi(mp2, tail=1.0, bank=bank))[:, 0]
    on = int(np.argmax(np.abs(h) > 1e-4))
    seg = lambda s, e: h[on + int(s * SR): on + int(e * SR)]
    return dict(centroid=centroid, share=share, sustain=rms(seg(1.0, 1.5)) / rms(seg(0.0, 0.2)))


def presets_of(bank: str) -> dict[int, str]:
    out = subprocess.run(['node', os.path.join(HERE, 'presets.mjs'), bank], check=True, capture_output=True, text=True, cwd=HERE).stdout
    return {x['program']: x['name'] for x in json.loads(out) if x['msb'] == 0 and x['lsb'] == 0 and not x['drum']}


if __name__ == '__main__':
    letters = sys.argv[1:] or list(BANKS)
    print('| Bank | Program | GM | Centroid Hz | 2-5 kHz % | Sustain ratio | Own preset |')
    print('|---|---|---|---|---|---|---|')
    for L in letters:
        bank = os.path.join(HERE, 'banks', BANKS[L])
        names = presets_of(bank)
        for label, prog in PROGRAMS:
            r = measure(bank, prog, f'{L}_{prog}')
            own = f'yes: {names[prog]}' if prog in names else 'no (falls back)'
            print(f"| {L} | {label} | {prog} | {r['centroid']:.0f} | {r['share']:.1f} | {r['sustain']:.2f} | {own} |", flush=True)
