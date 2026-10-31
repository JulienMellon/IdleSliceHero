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
    """Integrated loudness. Files shorter than the 400 ms gating block are measured over their own length,
    not padded with silence (padding made short effects read ~5–9 dB quieter than they sound: AU51)."""
    block = min(0.4, (len(a) - 1) / SR)
    return float(pyln.Meter(SR, block_size=block).integrated_loudness(a))


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


# --- the lofi master chain (shared by every neighbourhood loop and gameplay stinger) --------------------------------
LOFI_CUTOFF = 7000.0  # Hz: the tape roll-off


def _lowpass(a: np.ndarray, hz: float = LOFI_CUTOFF, circular: bool = False) -> np.ndarray:
    from scipy.signal import butter, sosfilt
    sos = butter(2, hz, btype='low', fs=SR, output='sos')
    if not circular:
        return sosfilt(sos, a, axis=0)
    n = len(a)  # filter three copies and keep the middle one, so the loop's seam has no start-up transient
    return sosfilt(sos, np.concatenate([a, a, a]), axis=0)[n:2 * n]


def tape_wow(a: np.ndarray, cents: float = 6.0) -> np.ndarray:
    """Slow tape wow: a pitch drift of at most ±`cents`, as two slow sines (0.4 Hz and 0.15 Hz, 2:1) whose periods
    divide the loop exactly, so the read position (and the seam) stays continuous."""
    n = len(a)
    length = n / SR
    t = np.arange(n) / SR
    delay = np.zeros(n)
    for f_target, share, phase in ((0.4, 2 / 3, 0.0), (0.15, 1 / 3, 1.3)):
        f = max(1, round(f_target * length)) / length
        speed = 2 ** (cents * share / 1200) - 1  # peak speed deviation of this component
        delay += -speed / (2 * np.pi * f) * np.cos(2 * np.pi * f * t + phase)
    pos = (np.arange(n) + delay * SR) % n
    i0 = np.floor(pos).astype(int)
    fr = (pos - i0)[:, None]
    return a[i0] * (1 - fr) + a[(i0 + 1) % n] * fr


def vinyl(a: np.ndarray, seed: int, pops_per_s: float = 7.0, pop_db: float = -22.0, hiss_db: float = -54.0) -> np.ndarray:
    """Gentle vinyl crackle: sparse soft pops (a few ms of band-limited noise) and a faint hiss, both relative to the
    programme's RMS so every loop gets the same amount. Nothing lands in the first or last 50 ms (the seam)."""
    from scipy.signal import butter, sosfilt
    rng = np.random.default_rng(seed)
    n = len(a)
    rms = float(np.sqrt(np.mean(a ** 2)))
    out = np.zeros(n)
    amp = rms * 10 ** (pop_db / 20)
    guard = int(0.05 * SR)
    for pos in rng.integers(guard, n - guard - 60, size=int(pops_per_s * n / SR)):
        k = int(rng.integers(12, 48))
        burst = rng.standard_normal(k) * np.exp(-np.arange(k) / (k / 4)) * rng.exponential(1.0)
        out[pos:pos + k] += burst * amp
    out += rng.standard_normal(n) * rms * 10 ** (hiss_db / 20)
    out = sosfilt(butter(2, 6500, btype='low', fs=SR, output='sos'), out)
    return a + out[:, None]


def tape_sat(a: np.ndarray, headroom: float = 5.0) -> np.ndarray:
    """Soft tape saturation: tanh with the drive set from the programme's RMS, so the 16 dB crest of a soft kit and
    Rhodes attacks is rounded off (about 3 dB at the peaks) instead of being hit by the −6 dBFS limiter."""
    rms = float(np.sqrt(np.mean(a ** 2)))
    k = 1.0 / (headroom * rms)
    return np.tanh(a * k) / k


def lofi_loop(a: np.ndarray, seed: int) -> np.ndarray:
    """Loop master: tape wow, soft saturation, vinyl crackle, then the 7 kHz roll-off over everything (circular, so
    the seam holds)."""
    a = tape_sat(tape_wow(a))
    a = vinyl(a, seed)
    return _lowpass(a, circular=True)


def lofi_sting(a: np.ndarray) -> np.ndarray:
    """Stinger master: the same 7 kHz roll-off (no wow or crackle on a two-second one-shot)."""
    return _lowpass(a)


def seam_step(a: np.ndarray) -> tuple[float, float]:
    """(join step, 99th-percentile sample step): the jump from the last sample back to the first, against how big a
    normal sample-to-sample step is in the file. A seamless loop has a join step no bigger than the 99th percentile."""
    join = float(np.max(np.abs(a[0] - a[-1])))
    p99 = float(np.max(np.percentile(np.abs(np.diff(a, axis=0)), 99, axis=0)))
    return join, p99


def write_report(path: str, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=1)
