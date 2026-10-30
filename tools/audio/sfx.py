"""Synthesised sound effects (AU21). One sonic palette: wood, dough, warm metal, kitchen fire.

Every function returns a mono float64 array at 44.1 kHz. Variants are built from a seeded RNG so builds are repeatable.
"""
from __future__ import annotations

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a=0.002, d=0.1, curve=1.0):
    x = np.arange(n) / SR
    att = np.clip(x / max(a, 1e-4), 0, 1)
    dec = np.exp(-np.maximum(0, x - a) / max(d, 1e-4) * curve)
    return att * dec


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def noise(rng, sec):
    return rng.standard_normal(int(sec * SR))


def pad_to(x, sec):
    n = int(sec * SR)
    return x[:n] if len(x) >= n else np.concatenate([x, np.zeros(n - len(x))])


def mix(*parts, at=None):
    at = at or [0] * len(parts)
    n = max(int(a * SR) + len(p) for p, a in zip(parts, at))
    out = np.zeros(n)
    for p, a in zip(parts, at):
        i = int(a * SR)
        out[i:i + len(p)] += p
    return out


def semis(k):
    return 2 ** (k / 12)


def sweep_sine(f0, f1, sec, tau=None):
    t = t_(sec)
    f = f1 + (f0 - f1) * np.exp(-t / (tau or sec / 4))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def marimba(f, sec=0.45, vel=1.0):
    t = t_(sec)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.18)
         + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.05)
         + 0.12 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t / 0.015))
    return x * env(len(t), 0.001, 10) * vel


def coin(rng, f=2600.0, sec=0.15, k=1.0):
    t = t_(sec)
    parts = [(1.0, 1.0, 0.07), (1.505, 0.6, 0.05), (2.04, 0.45, 0.04), (2.73, 0.3, 0.03)]
    x = sum(a * np.sin(2 * np.pi * f * r * k * t + rng.uniform(0, 6)) * np.exp(-t / d) for r, a, d in parts)
    click = hp(noise(rng, sec), 5000) * np.exp(-t / 0.003) * 0.4
    return (x + click) * env(len(t), 0.0005, 10)


# ---------------------------------------------------------------------------------------------------- the 14 cues
def kitchen_tap(v):
    rng = np.random.default_rng(100 + v)
    k = semis(rng.uniform(-1, 1))
    thump = sweep_sine(170 * k, 70 * k, 0.12, 0.025) * env(int(0.12 * SR), 0.002, 0.04)
    slap = lp(noise(rng, 0.12), 900) * env(int(0.12 * SR), 0.001, 0.012) * 0.8
    sizzle = hp(noise(rng, 0.12), 4500 + 600 * v) * env(int(0.12 * SR), 0.01, 0.05) * 0.18
    return pad_to(thump + slap + sizzle, 0.12)


def queue_full(v):
    rng = np.random.default_rng(200 + v)
    f = 620 * semis(v * 1.5 - 0.75)
    t = t_(0.1)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.025) + 0.4 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t / 0.012)
    x += bp(noise(rng, 0.1), 500, 2000) * np.exp(-t / 0.004) * 0.6
    return lp(x, 2500) * 0.9  # muted: no top end


def purchase(step):
    """Two-note marimba rising a fourth, plus shimmer. `step` = semitones up the purchase chain (0..7)."""
    rng = np.random.default_rng(300 + step)
    base = 523.25 * semis(step)
    a = marimba(base, 0.35, 0.8)
    b = marimba(base * semis(5), 0.3, 1.0)
    shimmer = hp(noise(rng, 0.3), 7000) * env(int(0.3 * SR), 0.02, 0.08) * 0.12
    bell = sum(np.sin(2 * np.pi * base * 4 * r * t_(0.3)) * np.exp(-t_(0.3) / 0.1) for r in (1, 1.5)) * 0.08
    return pad_to(mix(a, b, shimmer, bell, at=[0, 0.07, 0.07, 0.07]), 0.35)


def sparkle():
    rng = np.random.default_rng(350)
    parts, at = [], []
    for i, f in enumerate([2093, 2637, 3136, 4186, 3520]):
        parts.append(np.sin(2 * np.pi * f * t_(0.18)) * np.exp(-t_(0.18) / 0.05) * 0.3)
        at.append(0.04 * i + rng.uniform(0, 0.01))
    return pad_to(mix(*parts, at=at), 0.35)


def refused(v):
    rng = np.random.default_rng(400 + v)
    k = semis(-v)
    t = t_(0.2)
    x = sweep_sine(190 * k, 120 * k, 0.2, 0.05) * env(len(t), 0.008, 0.06)
    x += 0.3 * sweep_sine(380 * k, 240 * k, 0.2, 0.05) * env(len(t), 0.008, 0.03)
    felt = lp(noise(rng, 0.2), 400) * env(len(t), 0.004, 0.02) * 0.5
    return lp(x + felt, 1200)


def cash_pop(v):
    rng = np.random.default_rng(500 + v)
    return coin(rng, 2600, 0.15, semis(rng.uniform(-2, 2)))


def rush_tap(v):
    rng = np.random.default_rng(600 + v)
    t = t_(0.25)
    n = noise(rng, 0.25)
    # sizzle-whoosh: band sweeping up
    lo = np.linspace(800, 3500, len(t))
    whoosh = np.zeros(len(t))
    for i in range(0, len(t), 441):
        seg = n[i:i + 441]
        whoosh[i:i + len(seg)] = bp(seg, lo[i], lo[i] * 2.2)
    whoosh *= np.sin(np.pi * t / 0.25) ** 2 * 0.5
    coins = [coin(rng, 2600, 0.12, semis(rng.uniform(-1, 3))) * 0.5 for _ in range(3)]
    return pad_to(mix(whoosh, *coins, at=[0, 0.05, 0.11, 0.17]), 0.25)


def milestone_whoomp():
    rng = np.random.default_rng(700)
    t = t_(0.4)
    air = lp(noise(rng, 0.4), 600) * (np.sin(np.pi * np.minimum(1, t / 0.4)) ** 1.5) * 0.9
    thump = sweep_sine(110, 45, 0.4, 0.08) * env(len(t), 0.06, 0.12)
    hinge = bp(noise(rng, 0.4), 1500, 3000) * env(len(t), 0.001, 0.01) * 0.2
    return air + thump + hinge


def expand_kachunk():
    rng = np.random.default_rng(800)
    hit1 = bp(noise(rng, 0.2), 1200, 4000) * env(int(0.2 * SR), 0.001, 0.02)
    clang = sum(np.sin(2 * np.pi * f * t_(0.3)) * np.exp(-t_(0.3) / 0.06) for f in (523, 1131, 1870)) * 0.25
    thud = sweep_sine(120, 50, 0.3, 0.05) * env(int(0.3 * SR), 0.002, 0.08)
    return pad_to(mix(hit1, clang, thud, at=[0, 0.16, 0.16]), 0.5)


def oven_roar():
    rng = np.random.default_rng(900)
    t = t_(0.6)
    brown = np.cumsum(noise(rng, 0.6))
    brown = hp(brown / np.max(np.abs(brown)), 60)
    roar = bp(brown + 0.2 * noise(rng, 0.6), 120, 1400) * np.sin(np.pi * t / 0.6) ** 1.2
    crackle = lp(hp(noise(rng, 0.6), 2500) * (rng.random(len(t)) > 0.993), 7000) * 0.8
    return roar * 2.2 + crackle * np.sin(np.pi * t / 0.6)


def fleet(vehicle):
    """0 bike (bell), 1 scooter, 2 car, 3 van, 4 drone. Engine then horn."""
    rng = np.random.default_rng(1000 + vehicle)
    t = t_(0.6)
    if vehicle == 0:
        f = 2400
        ring = sum(a * np.sin(2 * np.pi * f * r * t) for r, a in ((1, 1), (1.47, .5), (2.1, .3)))
        ring *= np.exp(-t / 0.18) * (1 + 0.5 * np.sin(2 * np.pi * 18 * t))
        return mix(ring * 0.6, ring * 0.5, at=[0, 0.14])[: len(t)]
    if vehicle == 4:
        whirr = np.sin(2 * np.pi * np.cumsum(np.linspace(300, 520, len(t))) / SR)
        whirr = np.sign(whirr) * 0.3 * (1 + 0.6 * np.sin(2 * np.pi * 60 * t))
        return lp(whirr, 3000) * np.sin(np.pi * t / 0.6) * 0.8
    base = {1: 95, 2: 62, 3: 44}[vehicle]
    ph = np.cumsum(base * (1 + 0.5 * t)) / SR
    saw = 2 * (ph % 1) - 1
    engine = lp(saw * (1 + 0.4 * np.sin(2 * np.pi * base / 2 * t)), 900) * np.minimum(1, t / 0.05) * 0.5
    engine *= np.where(t < 0.32, 1, np.exp(-(t - 0.32) / 0.05))
    hf = {1: 740, 2: 440, 3: 330}[vehicle]
    ht = t_(0.26)
    horn = np.sign(np.sin(2 * np.pi * hf * ht)) * 0.5 + np.sign(np.sin(2 * np.pi * hf * 1.26 * ht)) * 0.5
    horn = lp(horn, 2500) * env(len(ht), 0.01, 10) * np.where(ht > 0.22, 0, 1) * 0.35
    return pad_to(mix(engine, horn, at=[0, 0.3]), 0.6)


def build_ribbon():
    rng = np.random.default_rng(1100)
    snip = [hp(noise(rng, 0.03), 3000) * env(int(0.03 * SR), 0.0005, 0.005) for _ in range(2)]
    # small cheer: a few formant-filtered voices gliding up ("yay!") plus light applause
    t = t_(0.7)
    voices = np.zeros(len(t))
    for i in range(6):
        f0 = rng.uniform(220, 420)
        f = f0 * (1 + 0.25 * np.minimum(1, t / 0.25))
        ph = np.cumsum(f * (1 + 0.01 * np.sin(2 * np.pi * rng.uniform(5, 7) * t))) / SR
        saw = 2 * (ph % 1) - 1
        v = bp(saw, 600, 1200) + 0.6 * bp(saw, 1800, 2600)
        voices += v * np.clip(t / 0.05, 0, 1) * np.exp(-np.maximum(0, t - 0.25) / 0.18)
    clap = np.zeros(len(t))
    for _ in range(14):
        i = int(rng.uniform(0.05, 0.6) * SR)
        c = bp(noise(rng, 0.02), 1000, 4000) * env(int(0.02 * SR), 0.0005, 0.004)
        clap[i:i + len(c)] += c[: len(clap) - i] * 0.5
    cheer = voices * 0.3 + clap * 0.8
    return pad_to(mix(snip[0] * 0.3, snip[1] * 0.3, cheer, at=[0, 0.06, 0.12]), 0.8)


def collect(size):
    """0 small (0.6 s), 1 medium (1.0 s), 2 big (1.5 s): register ka-ching plus a coin cascade."""
    rng = np.random.default_rng(1200 + size)
    sec = (0.6, 1.0, 1.5)[size]
    clack = bp(noise(rng, 0.06), 800, 3000) * env(int(0.06 * SR), 0.0005, 0.008)
    drawer = lp(noise(rng, 0.12), 500) * env(int(0.12 * SR), 0.01, 0.04) * 0.6
    bt = t_(0.8)
    bell = sum(a * np.sin(2 * np.pi * 1760 * r * bt) for r, a in ((1, 1), (2.76, .4), (5.4, .2))) * np.exp(-bt / 0.25) * 0.5
    n_coins = (6, 14, 26)[size]
    coins, at = [], []
    for i in range(n_coins):
        coins.append(coin(rng, 2400, 0.15, semis(rng.uniform(-3, 4))) * rng.uniform(0.25, 0.5))
        at.append(0.12 + (sec - 0.3) * (i / n_coins) ** 0.8 + rng.uniform(0, 0.02))
    return pad_to(mix(clack, drawer, bell, *coins, at=[0, 0, 0.04] + at), sec)


def ui_click():
    rng = np.random.default_rng(1300)
    t = t_(0.05)
    x = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.006) * 0.6 + bp(noise(rng, 0.05), 2000, 6000) * np.exp(-t / 0.002) * 0.3
    return x


def bubble_pop(v):
    t = t_(0.08)
    f0 = 400 * semis(v * 2)
    x = sweep_sine(f0, f0 * 2.4, 0.08, 0.02) * env(len(t), 0.002, 0.03)
    return lp(x, 4000)


def gavel():
    """AU27: Pier 9 auction — knock, knock, SOLD. Hardwood block, the last strike bigger and lower."""
    rng = np.random.default_rng(1400)
    hits = []
    for i, (f, g, d) in enumerate(((900, 0.6, 0.03), (900, 0.65, 0.03), (700, 1.0, 0.06))):
        t = t_(0.25)
        body = (np.sin(2 * np.pi * f * t) * np.exp(-t / d) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t / (d / 2)))
        crack = bp(noise(rng, 0.25), 1500, 6000) * np.exp(-t / 0.003) * 0.35
        thud = sweep_sine(160, 70, 0.25, 0.03) * env(len(t), 0.001, 0.05) * (0.9 if i == 2 else 0.3)
        hits.append((body + crack + thud) * g)
    return pad_to(mix(*hits, at=[0, 0.16, 0.36]), 0.6)


ALL = {
    'tap': [kitchen_tap(v) for v in range(4)],
    'full': [queue_full(v) for v in range(2)],
    'buy': [purchase(s) for s in range(8)],
    'sparkle': [sparkle()],
    'refused': [refused(v) for v in range(2)],
    'cash': [cash_pop(v) for v in range(5)],
    'rush': [rush_tap(v) for v in range(4)],
    'milestone': [milestone_whoomp()],
    'expand': [expand_kachunk()],
    'grade': [oven_roar()],
    'fleet': [fleet(v) for v in range(5)],
    'build': [build_ribbon()],
    'collect': [collect(s) for s in range(3)],
    'click': [ui_click()],
    'bubble': [bubble_pop(v) for v in range(3)],
    'gavel': [gavel()],
}
