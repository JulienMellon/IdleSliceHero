"""Post-processing: loop seams, loudness, limiting, encoding, and measurement."""
from __future__ import annotations

import json
import os
import subprocess

import numpy as np
import pyloudnorm as pyln

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))


def render_midi(mid_path: str, tail: float = 2.0) -> np.ndarray:
    raw = mid_path + '.f32'
    subprocess.run(['node', os.path.join(HERE, 'render.mjs'), mid_path, raw, str(tail)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=HERE)
    a = np.fromfile(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    os.remove(raw)
    return a


def wrap_loop(a: np.ndarray, loop_seconds: float) -> np.ndarray:
    """Seamless loop: fold everything after the loop end (reverb tails, ringing notes) back onto the start."""
    n = int(round(loop_seconds * SR))
    out = a[:n].copy()
    tail = a[n:]
    k = min(len(tail), n)
    out[:k] += tail[:k]
    return out


def trim_silence(a: np.ndarray, thresh_db=-60.0, pad=0.02) -> np.ndarray:
    amp = np.max(np.abs(a), axis=1)
    th = 10 ** (thresh_db / 20)
    idx = np.where(amp > th)[0]
    if len(idx) == 0:
        return a
    end = min(len(a), idx[-1] + int(pad * SR))
    return a[: end]


def fade(a: np.ndarray, fin=0.0, fout=0.0) -> np.ndarray:
    a = a.copy()
    if fin > 0:
        n = int(fin * SR)
        a[:n] *= np.linspace(0, 1, n)[:, None]
    if fout > 0:
        n = min(len(a), int(fout * SR))
        a[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    return a


def lufs(a: np.ndarray) -> float:
    if len(a) < int(0.4 * SR):  # meter needs 400 ms
        a = np.concatenate([a, np.zeros((int(0.4 * SR) - len(a) + 1, a.shape[1]))])
    return float(pyln.Meter(SR).integrated_loudness(a))


def peak_db(a: np.ndarray) -> float:
    return float(20 * np.log10(max(1e-9, np.max(np.abs(a)))))


def soft_limit(a: np.ndarray, ceiling_db=-1.0, lookahead=0.002, release=0.06) -> np.ndarray:
    """Look-ahead peak limiter: gain rides down just before a peak and recovers over `release`, so a
    loudness target never clips and transients aren't squared off."""
    from scipy.ndimage import minimum_filter1d
    c = 10 ** (ceiling_db / 20)
    amp = np.max(np.abs(a), axis=1) if a.ndim == 2 else np.abs(a)
    if amp.max() <= c:
        return a
    need = np.minimum(1.0, c / np.maximum(amp, 1e-9))
    la = max(1, int(lookahead * SR))
    need = minimum_filter1d(need, size=2 * la + 1, mode='nearest')
    rel = np.exp(-1.0 / (release * SR))
    g = np.empty_like(need)
    cur = 1.0
    for i, x in enumerate(need):
        cur = x if x < cur else x + (cur - x) * rel
        g[i] = cur
    out = a * (g[:, None] if a.ndim == 2 else g)
    return np.clip(out, -c, c)


def normalize(a: np.ndarray, target_lufs: float | None = None, peak_target_db: float | None = None, ceiling_db=-1.0):
    if target_lufs is not None:
        g = 10 ** ((target_lufs - lufs(a)) / 20)
        a = a * g
    if peak_target_db is not None:
        a = a * (10 ** (peak_target_db / 20) / max(1e-9, np.max(np.abs(a))))
    return soft_limit(a, ceiling_db)


def to_mono(a: np.ndarray) -> np.ndarray:
    return a.mean(axis=1, keepdims=True) if a.ndim == 2 and a.shape[1] == 2 else a.reshape(-1, 1)


def encode(a: np.ndarray, out_path: str, kbps: int, mono: bool, sr_out: int = 44100) -> dict:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    x = to_mono(a) if mono else a
    ch = x.shape[1]
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', str(ch), '-i', '-',
           '-ar', str(sr_out), '-c:a', 'aac', '-b:a', f'{kbps}k', '-movflags', '+faststart', out_path]
    subprocess.run(cmd, input=pcm, check=True)
    return {'file': os.path.relpath(out_path, os.path.join(HERE, '..', '..')), 'bytes': os.path.getsize(out_path),
            'seconds': round(len(x) / SR, 3), 'lufs': round(lufs(x), 1),
            'peak_dbfs': round(peak_db(x), 1), 'channels': ch, 'kbps': kbps, 'sample_rate': sr_out}


def write_report(path: str, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=1)
