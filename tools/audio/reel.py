"""Audition reels: one mp3 and one index per preset, for Julien to listen to.

    python3 reel.py R0        # build/reel/R0.mp3 + R0.txt
    python3 reel.py R1

Every clip gets a 0.3 s fade in and out, with 0.7 s of silence between clips. One static gain is applied to the whole reel,
set so the reel measures about -16 LUFS. There is no loudnorm and no per-clip matching, so level differences between
clips survive. Stereo. `R0` and `R1` are 128 kbps. `R2` and `FULL` (card M2c, 2026-11-19; 320 kbps until 2026-11-22, then 192 kbps by Julien's note) are 192 kbps MP3 cut from the 32-bit
float masters that `build.py` keeps under build/master/ (the decoded .m4a when a master is missing), with the reel built in
float and no 16-bit step. `R0`, `R1`, `R2` and `FULL` are entries of PRESETS; a later round adds a preset by adding a function
that returns a list of (label, stereo float array at 44.1 kHz).

    python3 reel.py R2      # the new story cues and the neighbourhoods' hand-overs
    python3 reel.py FULL    # every music, sting and story cue, whole, in cue-sheet order (build/reel/FULL.mp3 + FULL.txt)
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
MASTER = os.path.join(HERE, 'build', 'master')
KBPS = {'R0': 128, 'R1': 128, 'R2': 192, 'FULL': 192}  # MP3 bitrate per preset
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



# ---------------------------------------------------------------------------------------------------- R2 and FULL (card M2c)
HOODS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown']
HOOD_NAMES = {h: h.capitalize() for h in HOODS}
DUCK_DB = {'bottleneck': -3.0, 'upgrade': -6.0, 'milestone': -6.0, 'manager': -9.0, 'milestone_big': -9.0, 'build': -9.0}  # AUDIO.md mix rules
DUCK_DOWN, DUCK_UP = 0.08, 0.4  # ramp seconds
REPORT = os.path.join(HERE, 'build', 'report.json')


def report() -> dict:
    return json.load(open(REPORT))


def master(kind: str, name: str) -> np.ndarray:
    """A cue as stereo float at 44.1 kHz: the 32-bit float master under build/master/<kind>/ when it exists, else the decoded
    .m4a in assets/audio. `kind` is music, sting or story; a sting's `name` carries its sting_ prefix."""
    from scipy.io import wavfile
    p = os.path.join(MASTER, kind, name + '.wav')
    if os.path.exists(p):
        sr, x = wavfile.read(p)
        assert sr == SR, (p, sr)
        x = x.astype(np.float64)
    else:
        f = name.removeprefix('sting_') if kind == 'sting' else name
        x = decode(os.path.join(ROOT, 'assets', 'audio', kind, f + '.m4a'), 600.0)
    return np.repeat(x.reshape(-1, 1), 2, axis=1) if x.ndim == 1 or x.shape[1] == 1 else x


def clock(t: float) -> str:
    return f'{int(t // 60)}:{int(t % 60):02d}'


def preset_r2() -> list[tuple[str, np.ndarray]]:
    """The new story cues and the hand-overs, in this order: each triumph whole after the last 8 s of its neighbourhood's loop
    (the loop's own level; it drops out in 80 ms as it does in the game); the city theme; megaslice_hq for 15 s into
    megaslice_rep, then megaslice_rep_dock; victor_exit; waterfront_bid straight into triumph_waterfront; recipe; reunion;
    then Downtown and Industrial, each: 6 s of the loop, then the five stingers mixed over the running loop."""
    clips: list[tuple[str, np.ndarray]] = []
    for h in HOODS:
        loop = master('music', h)
        tail = loop[-int(8 * SR):].copy()
        tail[-int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR))[:, None]
        clips.append((f'{HOOD_NAMES[h]} loop, last 8 s (the loop at its own level); triumph_{h} starts at 0:08',
                      np.concatenate([tail, master('story', f'triumph_{h}')])))
    clips.append(('city_theme, whole', master('story', 'city_theme')))
    hq = master('music', 'megaslice_hq')[:int(15 * SR)].copy()
    hq[-int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR))[:, None]
    clips.append(('megaslice_hq, first 15 s; megaslice_rep starts at 0:15', np.concatenate([hq, master('story', 'megaslice_rep')])))
    clips.append(('megaslice_rep_dock, whole', master('story', 'megaslice_rep_dock')))
    clips.append(('victor_exit, whole', master('story', 'victor_exit')))
    bid = master('sting', 'sting_waterfront_bid')
    clips.append((f'waterfront_bid, then triumph_waterfront straight after it at {clock(len(bid) / SR)}',
                  np.concatenate([bid, master('story', 'triumph_waterfront')])))
    clips.append(('recipe, whole', master('story', 'recipe')))
    clips.append(('reunion, whole', master('story', 'reunion')))
    for h in ('downtown', 'industrial'):
        clips.append(stinger_run(h))
    return clips


def info_down(hood: str, kind: str) -> float:
    return report()[f'sting_{hood}_{kind}'].get('downbeatSeconds', 0.0)


def stinger_run(hood: str, kinds=('bottleneck', 'upgrade', 'milestone', 'manager', 'milestone_big'), lead_in: float = 6.0,
                gap: float = 1.5) -> tuple[str, np.ndarray]:
    """`lead_in` seconds of the loop, then each stinger over the running loop, its beat 1 on a bar line of the loop that the director would pick (the next tonic bar, notes R2), the loop
    ducked by the cue sheet's amount for the stinger's `musicSeconds` (80 ms down, 400 ms up). Every cue at its own level."""
    rep = report()
    loop = master('music', hood)
    lm = rep[hood]
    bar = lm['beatsPerBar'] * 60.0 / lm['bpm']
    roots = lm['barRoots']
    t, plan = lead_in, []
    for k in kinds:
        info = rep[f'sting_{hood}_{k}']
        x = master('sting', f'sting_{hood}_{k}')
        down = info.get('downbeatSeconds', 0.0)
        extra_duck = 0.0
        if k == 'bottleneck':  # the director plays it on the next beat (a dotted quarter in 6/8), whatever the chord
            beat = bar / 2 if lm['beatsPerBar'] == 3 else 60.0 / lm['bpm']
            bar_t = np.ceil((t + down) / beat - 1e-9) * beat
        else:
            # notes R2 (a3: "only the downtown stinger lands wrong"): the director waits for the next bar whose chord is I, up to
            # 2 bars ahead and only while the wait is 2.5 s or less (AU47, AU63, AU74); failing that it takes the next bar and
            # ducks the loop a further 6 dB. The reel used to take the first bar line whatever its chord.
            first = np.ceil((t + down) / bar - 1e-9) * bar
            bar_t = first
            for j in range(3):
                cand = first + j * bar
                if j > 0 and cand - t > 2.5:
                    break
                if roots[int(round(cand / bar)) % len(roots)] == 1:
                    bar_t = cand
                    break
            else:
                extra_duck = -6.0
            if roots[int(round(bar_t / bar)) % len(roots)] != 1:
                extra_duck = -6.0
        start = bar_t - down
        plan.append((k, start, x, info.get('musicSeconds', info['seconds']), extra_duck))
        t = start + len(x) / SR + gap
    total = int(round((t + 1.0) * SR))
    base = np.tile(loop, (total // len(loop) + 1, 1))[:total]
    gain = np.ones(total)
    for k, start, x, music, xd in plan:
        a0, a1 = int(start * SR), int((start + music) * SR)
        g = 10 ** ((DUCK_DB[k] + xd) / 20)
        env = np.ones(total)
        env[a0:a1] = g
        nd, nu = int(DUCK_DOWN * SR), int(DUCK_UP * SR)
        env[max(0, a0 - nd):a0] = np.linspace(1, g, len(env[max(0, a0 - nd):a0]))
        env[a1:a1 + nu] = np.linspace(g, 1, len(env[a1:a1 + nu]))
        gain = np.minimum(gain, env)
    mix = base * gain[:, None]
    for k, start, x, music, xd in plan:
        a0 = int(start * SR)
        seg = mix[a0:a0 + len(x)]
        seg += x[:len(seg)]
    when = ', '.join(f'{k} {clock(s)} (loop {DUCK_DB[k] + xd:+.0f} dB, bar {int(round((s + info_down(hood, k)) / bar)) % len(roots)})' for k, s, _x, _m, xd in plan)
    return f'{HOOD_NAMES[hood]}: loop from 0:00, then {when}', mix


def full_order(rep: dict) -> list[tuple[str, str, str]]:
    """(kind, file name, label) for every music, sting and story cue, in the order of docs/AUDIO.md: the neighbourhood loops;
    the story-cue table (welcome and warmth per neighbourhood, MegaSlice HQ, the rep stings, the triumphs with the Dock Saved bell
    last, recipe, reunion, Victor's exit, the city theme, perk, offline); then the gameplay-stinger table by kind, in build order."""
    out = []
    for n in ('downtown', 'downtown_sparse', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'):
        out.append(('music', n, f'{n} (loop)'))
    for k in ('welcome', 'warmth'):
        out += [('sting', f'sting_{h}_{k}', f'{h} {k}') for h in HOODS]
    out.append(('music', 'megaslice_hq', 'megaslice_hq (loop)'))
    for n in ('megaslice_rep', 'megaslice_rep_dock'):
        out.append(('story', n, n))
    out += [('story', f'triumph_{h}', f'triumph_{h}') for h in HOODS if h != 'waterfront'] + [('story', 'triumph_waterfront', 'triumph_waterfront (Dock Saved bell)')]
    for n in ('recipe', 'reunion', 'victor_exit', 'city_theme'):
        out.append(('story', n, n))
    for k in ('perk', 'offline'):
        out += [('sting', f'sting_{h}_{k}', f'{h} {k}') for h in HOODS]
    for k in ('bottleneck', 'milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'build'):
        out += [('sting', f'sting_{h}_{k}', f'{h} {k}') for h in HOODS]
    out.append(('sting', 'sting_waterfront_bid', 'waterfront bid'))
    listed = {n for _k, n, _l in out}
    missing = [k for k, v in rep.items() if v['kind'] in ('loop', 'stinger', 'story') and k not in listed]
    assert not missing, f'cues missing from the FULL order: {missing}'
    return out


def preset_full() -> list[tuple[str, np.ndarray]]:
    rep = report()
    clips = []
    for kind, name, label in full_order(rep):
        clips.append((f'{label}, {rep[name]["seconds"]:.1f} s, {rep[name].get("target_lufs", rep[name]["lufs"])} LUFS tier', master(kind, name)))
    return clips


PRESETS = {'R0': preset_r0, 'R1': preset_r1, 'R2': preset_r2, 'FULL': preset_full}
FADES = {'FULL': 0.01}  # a whole cue keeps its own start and end; only a click guard


def assemble(clips: list[tuple[str, np.ndarray]], fade: float = FADE):
    parts, rows, t = [], [], 0.0
    for i, (label, a) in enumerate(clips):
        a = post.fade(a.copy(), fade, fade)
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
    reel, rows, gain_db = assemble(clips, FADES.get(name, FADE))
    peak = post.peak_db(reel)
    if peak > -0.3:
        raise SystemExit(f'{name}: reel peaks at {peak:.1f} dBFS with the static gain {gain_db:+.1f} dB; it would clip')
    mp3 = os.path.join(OUT, name + '.mp3')
    if KBPS[name] > 128:  # the newer reels go to the encoder as 32-bit float
        pcm, fmt = np.clip(reel, -1, 1).astype('<f4').tobytes(), 'f32le'
    else:
        pcm, fmt = (np.clip(reel, -1, 1) * 32767).astype('<i2').tobytes(), 's16le'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', fmt, '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame',
                    '-b:a', f'{KBPS[name]}k', mp3], input=pcm, check=True)
    with open(os.path.join(OUT, name + '.txt'), 'w') as f:
        for n, ts, label in rows:
            f.write(f'{n}\t{ts}\t{label}\n')
    print(f'{mp3}: {len(reel) / SR:.1f} s, {post.lufs(reel):.1f} LUFS, peak {peak:.1f} dBFS, static gain {gain_db:+.1f} dB, {KBPS[name]} kbps, {len(rows)} tracks')


if __name__ == '__main__':
    if sys.argv[1:] and sys.argv[1] in PRESETS:
        main(sys.argv[1])
    else:
        raise SystemExit(f'usage: reel.py {"|".join(PRESETS)}')
