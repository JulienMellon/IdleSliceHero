"""Tiny MIDI composition helpers for Slice Empire (mido).

Times are in beats (quarter notes). Pitches are MIDI numbers or names like 'C4', 'F#3', 'Bb2'.
A Song holds tracks; each track is (channel, program, list of events). Drums use channel 9.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

import mido

TPB = 480
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

# GM drum keys
KICK, SNARE, RIM, CLAP, CHH, OHH, PEDAL, CRASH, RIDE, TAMB, SHAKER, COWBELL = 36, 38, 37, 39, 42, 46, 44, 49, 51, 54, 70, 56
TOM_LO, TOM_MID, TOM_HI, CONGA_LO, CONGA_HI, BONGO_HI, BONGO_LO, CLAVES, WOODBLOCK_HI, WOODBLOCK_LO = 45, 47, 50, 64, 63, 60, 61, 75, 76, 77
TIMBALE_HI, TIMBALE_LO, CABASA, CHINA, SPLASH, TRIANGLE_OPEN = 65, 66, 69, 52, 55, 81


def p(x) -> int:
    if isinstance(x, int):
        return x
    s = x.strip()
    n = NAMES[s[0].upper()]
    i = 1
    while i < len(s) and s[i] in '#b':
        n += 1 if s[i] == '#' else -1
        i += 1
    return n + 12 * (int(s[i:]) + 1)


MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
DORIAN = [0, 2, 3, 5, 7, 9, 10]
MIXO = [0, 2, 4, 5, 7, 9, 10]
HARM_MINOR = [0, 2, 3, 5, 7, 8, 11]


def deg(root, d: int, mode=MAJOR) -> int:
    """Scale degree d (1-based; 8 = octave, 0 = degree 7 below, negatives go down) above root."""
    r = p(root)
    i = d - 1
    return r + 12 * (i // 7) + mode[i % 7]


def chord(root, kind='maj', inv=0):
    r = p(root)
    iv = {'maj': [0, 4, 7], 'min': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'min7': [0, 3, 7, 10],
          'dim': [0, 3, 6], 'dim7': [0, 3, 6, 9], 'sus4': [0, 5, 7], '6': [0, 4, 7, 9], 'min6': [0, 3, 7, 9],
          'add9': [0, 4, 7, 14], '9': [0, 4, 7, 10, 14], 'min9': [0, 3, 7, 10, 14], 'aug': [0, 4, 8]}[kind]
    notes = [r + i for i in iv]
    for _ in range(inv):
        notes = notes[1:] + [notes[0] + 12]
    return notes


@dataclass
class Track:
    name: str
    channel: int
    program: int = 0
    volume: int = 100
    pan: int = 64
    reverb: int = 40
    chorus: int = 0
    events: list = field(default_factory=list)  # (start_beat, dur_beats, pitch, vel)
    bends: list = field(default_factory=list)  # (beat, value -8192..8191)
    ccs: list = field(default_factory=list)  # (beat, cc, value)

    def n(self, t, dur, pitch, vel=90):
        vel = int(max(1, min(127, vel)))
        if isinstance(pitch, (list, tuple)):
            for q in pitch:
                self.events.append((t, dur, p(q), vel))
        else:
            self.events.append((t, dur, p(pitch), vel))
        return self

    def seq(self, t, items, vel=90, legato=0.95):
        """items: list of (pitch|None, dur). Returns end time."""
        for pitch, dur in items:
            if pitch is not None:
                self.n(t, dur * legato, pitch, vel)
            t += dur
        return t

    def roll(self, t, dur, pitch, vel=80, rate=0.125):
        """Tremolo (mandolin/marimba style) on pitch for dur beats."""
        k = 0
        while k * rate < dur - 1e-6:
            self.n(t + k * rate, rate * 0.9, pitch, max(1, vel - (8 if k % 2 else 0)))
            k += 1
        return self


class Song:
    def __init__(self, bpm: float, beats_per_bar: int = 4, seed: int = 1):
        self.bpm = bpm
        self.bpb = beats_per_bar
        self.tracks: list[Track] = []
        self.rng = random.Random(seed)
        self.markers: list[tuple[float, str]] = []

    def track(self, name, channel, program=0, **kw) -> Track:
        t = Track(name, channel, program, **kw)
        self.tracks.append(t)
        return t

    def bar(self, b: float) -> float:
        return b * self.bpb

    def humanize(self, amt_beats=0.012, vel=6):
        for tr in self.tracks:
            out = []
            for (t, d, pi, v) in tr.events:
                j = 0 if t == 0 else self.rng.uniform(-amt_beats, amt_beats)
                out.append((max(0, t + j), d, pi, max(1, min(127, v + self.rng.randint(-vel, vel)))))
            tr.events = out

    def save(self, path: str, length_beats: float | None = None, ts=(4, 4)):
        mid = mido.MidiFile(type=1, ticks_per_beat=TPB)
        meta = mido.MidiTrack()
        mid.tracks.append(meta)
        meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        meta.append(mido.MetaMessage('time_signature', numerator=ts[0], denominator=ts[1], time=0))
        last = 0
        for (bt, text) in sorted(self.markers):
            tk = int(round(bt * TPB))
            meta.append(mido.MetaMessage('marker', text=text, time=tk - last))
            last = tk
        end = length_beats if length_beats is not None else max(
            (t + d for tr in self.tracks for (t, d, _, _) in tr.events), default=0)
        endtk = int(round(end * TPB))
        meta.append(mido.MetaMessage('end_of_track', time=max(0, endtk - last)))
        for tr in self.tracks:
            mt = mido.MidiTrack()
            mid.tracks.append(mt)
            mt.append(mido.MetaMessage('track_name', name=tr.name, time=0))
            msgs = []
            ch = tr.channel
            if ch != 9:
                msgs.append((0, 0, mido.Message('program_change', channel=ch, program=tr.program)))
            else:
                msgs.append((0, 0, mido.Message('program_change', channel=ch, program=tr.program)))
            for cc, val in ((7, tr.volume), (10, tr.pan), (91, tr.reverb), (93, tr.chorus), (11, 127)):
                msgs.append((0, 1, mido.Message('control_change', channel=ch, control=cc, value=val)))
            for (bt, cc, val) in tr.ccs:
                msgs.append((int(round(bt * TPB)), 1, mido.Message('control_change', channel=ch, control=cc, value=val)))
            for (bt, val) in tr.bends:
                msgs.append((int(round(bt * TPB)), 1, mido.Message('pitchwheel', channel=ch, pitch=val)))
            for (t, d, pi, v) in tr.events:
                on = max(0, int(round(t * TPB)))
                off = max(on + 1, int(round((t + d) * TPB)))
                msgs.append((on, 3, mido.Message('note_on', channel=ch, note=pi, velocity=v)))
                msgs.append((off, 2, mido.Message('note_off', channel=ch, note=pi, velocity=0)))
            msgs.sort(key=lambda m: (m[0], m[1]))
            cur = 0
            for tk, _, m in msgs:
                mt.append(m.copy(time=tk - cur))
                cur = tk
            mt.append(mido.MetaMessage('end_of_track', time=max(0, endtk - cur)))
        mid.save(path)
        return end * 60 / self.bpm
