"""Audition reels: one mp3 and one index per preset, for Julien to listen to.

    python3 reel.py R0        # build/reel/R0.mp3 + R0.txt
    python3 reel.py R1

Every clip gets a 0.3 s fade in and out, with 0.7 s of silence between clips. One static gain is applied to the whole reel,
set so the reel measures about -16 LUFS. There is no loudnorm and no per-clip matching, so level differences between
clips survive. Stereo, 128 kbps. `R0` and `R1` are entries of PRESETS; a later round adds a preset by adding a function
that returns a list of (label, stereo float array at 44.1 kHz).
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import numpy as np

import post
import sketch_r0
from timbre import BANKS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'build', 'reel')
SR = post.SR
FADE, GAP, TARGET_LUFS = 0.3, 0.7, -16.0
CLIP_SECONDS = 12.0
BANK_NAMES = {k: os.path.splitext(v)[0] for k, v in BANKS.items()}


def bank_path(letter: str) -> str:
    p = os.path.join(HERE, 'banks', BANKS[letter])
    if not os.path.exists(p):
        subprocess.run([os.path.join(HERE, 'fetch_bank.sh'), letter], check=True, stdout=subprocess.DEVNULL)
    return p


def loop_master(mid: str, bank: str, name: str, seconds: float) -> np.ndarray:
    """The build's loop path for a lofi loop: render, fold the tail, lofi master, normalise to the loop tier."""
    a = post.wrap_loop(post.render_midi(mid, tail=4.0, bank=bank), seconds)
    a = post.lofi_loop(a, seed=sum(map(ord, name)))
    return post.normalize(a, -20.0, ceiling_db=-6.0)


def preset_r0() -> list[tuple[str, np.ndarray]]:
    mid = os.path.join(HERE, 'build', 'midi', 'downtown.mid')
    man = json.load(open(os.path.join(HERE, 'build', 'midi', 'manifest.json')))['downtown']
    bar = man['beatsPerBar'] * 60.0 / man['bpm']
    # the first bar line at or after the accordion's first note (that note is the one-beat pickup into bar 4)
    start = float(np.ceil(sketch_r0.first_note_seconds(mid) / bar - 1e-6) * bar)
    cut = lambda a: a[int(round(start * SR)): int(round((start + CLIP_SECONDS) * SR))]
    sk = sketch_r0.sketch()
    clips = [('1. A %s, today\'s Downtown, accordion (GM 21)' % BANK_NAMES['A'], cut(loop_master(mid, bank_path('A'), 'downtown', man['seconds'])))]
    for i, L in enumerate('ABCD'):
        clips.append((f'{i + 2}. {L} {BANK_NAMES[L]}, same bars, nylon guitar (GM 24) at 0.7 velocity for the accordion',
                      cut(loop_master(sk, bank_path(L), 'downtown', man['seconds']))))
    return clips


def decode(path: str, seconds: float) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-t', str(seconds), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


R1_ORDER = ['downtown', 'downtown_sparse', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown', 'megaslice_hq']


def preset_r1() -> list[tuple[str, np.ndarray]]:
    return [(f'{i + 1}. {n}, first 30 s of assets/audio/music/{n}.m4a',
             decode(os.path.join(ROOT, 'assets', 'audio', 'music', n + '.m4a'), 30.0)) for i, n in enumerate(R1_ORDER)]


PRESETS = {'R0': preset_r0, 'R1': preset_r1}


def assemble(clips: list[tuple[str, np.ndarray]]):
    parts, rows, t = [], [], 0.0
    for i, (label, a) in enumerate(clips):
        a = post.fade(a.copy(), FADE, FADE)
        rows.append((i + 1, f'{int(t // 60)}:{int(t % 60):02d}', label))
        parts.append(a)
        t += len(a) / SR
        if i < len(clips) - 1:
            parts.append(np.zeros((int(GAP * SR), 2)))
            t += GAP
    reel = np.concatenate(parts)
    gain_db = TARGET_LUFS - post.lufs(reel)
    reel = reel * 10 ** (gain_db / 20)
    return reel, rows, gain_db


def main(name: str):
    os.makedirs(OUT, exist_ok=True)
    clips = PRESETS[name]()
    reel, rows, gain_db = assemble(clips)
    peak = post.peak_db(reel)
    if peak > -0.3:
        raise SystemExit(f'{name}: reel peaks at {peak:.1f} dBFS with the static gain {gain_db:+.1f} dB; it would clip')
    mp3 = os.path.join(OUT, name + '.mp3')
    pcm = (np.clip(reel, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame',
                    '-b:a', '128k', mp3], input=pcm, check=True)
    with open(os.path.join(OUT, name + '.txt'), 'w') as f:
        for n, ts, label in rows:
            f.write(f'{n}\t{ts}\t{label}\n')
    print(f'{mp3}: {len(reel) / SR:.1f} s, {post.lufs(reel):.1f} LUFS, peak {peak:.1f} dBFS, static gain {gain_db:+.1f} dB')


if __name__ == '__main__':
    if sys.argv[1:] and sys.argv[1] in PRESETS:
        main(sys.argv[1])
    else:
        raise SystemExit(f'usage: reel.py {"|".join(PRESETS)}')
