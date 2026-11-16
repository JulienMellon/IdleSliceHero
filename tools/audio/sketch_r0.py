"""Round R0 sketch: today's Downtown chart with the accordion played by a nylon guitar (card M0).

The chart is untouched. The composed MIDI is remapped with mido: the accordion track's program becomes nylon guitar (24)
and its velocities are multiplied by 0.7. Everything else in the file is copied as it is.

    python3 sketch_r0.py            # writes build/reel/downtown_sketch_r0.mid
"""
from __future__ import annotations

import os

import mido

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'build', 'midi', 'downtown.mid')
OUT = os.path.join(HERE, 'build', 'reel', 'downtown_sketch_r0.mid')
TRACK, PROGRAM, VEL = 'accordion', 24, 0.7


def track_name(tr) -> str:
    return next((m.name for m in tr if m.type == 'track_name'), '')


def sketch(src: str = SRC, dst: str = OUT, track: str = TRACK, program: int = PROGRAM, vel: float = VEL) -> str:
    m = mido.MidiFile(src)
    hit = 0
    for tr in m.tracks:
        if track_name(tr) != track:
            continue
        hit += 1
        for i, msg in enumerate(tr):
            if msg.type == 'program_change':
                tr[i] = msg.copy(program=program)
            elif msg.type == 'note_on' and msg.velocity > 0:
                tr[i] = msg.copy(velocity=max(1, min(127, int(round(msg.velocity * vel)))))
    if hit != 1:
        raise SystemExit(f'{src}: expected one track named {track!r}, found {hit}')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    m.save(dst)
    return dst


def first_note_seconds(src: str, track: str = TRACK) -> float:
    """Seconds at which `track` first sounds (the tempo is constant in these files)."""
    m = mido.MidiFile(src)
    tempo = next(x.tempo for x in m.tracks[0] if x.type == 'set_tempo')
    for tr in m.tracks:
        if track_name(tr) == track:
            t = 0
            for msg in tr:
                t += msg.time
                if msg.type == 'note_on' and msg.velocity > 0:
                    return mido.tick2second(t, m.ticks_per_beat, tempo)
    raise SystemExit(f'{src}: no track named {track!r}')


if __name__ == '__main__':
    print(sketch())
