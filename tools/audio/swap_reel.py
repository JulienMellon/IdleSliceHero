"""Swap reel: audition other instruments for one part of one loop, same notes, through the shipped loop chain.

    python3 swap_reel.py downtown rhodes 11 26 5 0:240
    python3 swap_reel.py downtown rhodes 11 26 5 0:240 --lead "nylon melody" --solo-seconds 8 --mix-seconds 25

Each option is `program` or `program:cap`, where `cap` is the longest a note may sound, in MIDI ticks (480 a beat); the
notes, their starts and the voicing stay as composed. The score is composed into a temp folder (nothing under build/midi,
assets/ or src/ is touched). The reel is: the reference (the part as composed) as a full mix, then for each option the part
alone, then the full mix with it. Velocities of an option are scaled by one factor so that the part alone, through the loop
chain, reads the same integrated LUFS as the composed part alone (tolerance 0.4 LU, velocities kept 1-127).
Full-mix clips are not normalised: every clip uses the one gain that puts the reference loop at its tier, the build's way.
The solos share one make-up gain (the reference part alone lands at -18 LUFS). 1 s of silence between clips, 0.3 s fades.
Writes build/reel/<loop>-<part>-swap.mp3 and .txt. The .txt also gives lead minus bed (stem audit method) per option.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile

import mido
import numpy as np

import palette
import post
from solo_reel import FADE, GAP, GM_NAMES, OUT, SR, master
from timbre import BANKS

HERE = os.path.dirname(os.path.abspath(__file__))


def tname(tr) -> str:
    return next((e.name for e in tr if e.type == 'track_name'), '')


def keep_only(src: str, names: tuple[str, ...], dst: str, drop: bool = False) -> None:
    """Copy of `src` whose tracks other than `names` (or those in `names` if drop) have no notes."""
    m = mido.MidiFile(src)
    for i, t in enumerate(m.tracks):
        if i == 0 or (tname(t) in names) != drop:
            continue
        kept, carry = [], 0
        for e in t:
            if e.type in ('note_on', 'note_off'):
                carry += e.time
                continue
            kept.append(e.copy(time=e.time + carry))
            carry = 0
        t[:] = kept
    m.save(dst)


def swap(src: str, part: str, program: int, cap: int | None, vscale: float, dst: str) -> None:
    """Part's program changed, velocities scaled, notes held no longer than `cap` ticks (note_off pulled in)."""
    m = mido.MidiFile(src)
    for t in m.tracks:
        if tname(t) != part:
            continue
        ab, tick = [], 0
        for e in t:
            tick += e.time
            ab.append([tick, e.copy()])
        on = {}
        for item in ab:
            tick, e = item
            if e.type == 'program_change':
                e.program = program
            elif e.type == 'note_on' and e.velocity > 0:
                e.velocity = int(min(127, max(1, round(e.velocity * vscale))))
                on[e.note] = item
            elif e.type in ('note_off', 'note_on') and e.note in on:
                st = on.pop(e.note)[0]
                if cap and tick - st > cap:
                    item[0] = st + cap
        ab.sort(key=lambda x: (x[0], 0 if (x[1].type == 'note_off' or (x[1].type == 'note_on' and x[1].velocity == 0)) else 1))
        out, prev = [], 0
        for tick, e in ab:
            e.time = tick - prev
            prev = tick
            out.append(e)
        t[:] = out
    m.save(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('loop')
    ap.add_argument('part', help='track name, e.g. rhodes')
    ap.add_argument('options', nargs='+', help='GM program (0-based) or program:capTicks')
    ap.add_argument('--bank', default='C')
    ap.add_argument('--lead', default='nylon melody')
    ap.add_argument('--solo-seconds', type=float, default=8.0)
    ap.add_argument('--mix-seconds', type=float, default=25.0)
    args = ap.parse_args()
    bank = os.path.join(HERE, 'banks', BANKS[args.bank])
    letters = 'ABCDEFGH'
    opts = []
    for o in args.options:
        p, _, c = o.partition(':')
        opts.append((int(p), int(c) if c else None))
    for p, _ in opts:
        assert p not in palette.BANNED_PROGRAMS, f'program {p} is banned'
    os.makedirs(OUT, exist_ok=True)
    rep = json.load(open(os.path.join(HERE, 'build', 'report.json'))).get(args.loop, {})
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([sys.executable, os.path.join(HERE, 'compose.py'), tmp], check=True, stdout=subprocess.DEVNULL)
        src = os.path.join(tmp, args.loop + '.mid')
        man = json.load(open(os.path.join(tmp, 'manifest.json')))[args.loop]
        secs = man['seconds']

        def render(mid, sub=None):
            return master(mid, bank, args.loop, secs)

        def solo_of(mid):
            d = os.path.join(tmp, 'solo.mid')
            keep_only(mid, (args.part,), d)
            return render(d)

        def lead_bed(mid):
            d1, d2 = os.path.join(tmp, 'lead.mid'), os.path.join(tmp, 'bed.mid')
            keep_only(mid, (args.lead,), d1)
            keep_only(mid, (args.lead,), d2, drop=True)
            return post.lufs(render(d1)) - post.lufs(render(d2))

        ref_full = render(src)
        tier = rep.get('target_lufs', -20.0)
        gain = 10 ** ((tier - post.lufs(ref_full)) / 20)
        ref_solo = solo_of(src)
        ref_solo_l = post.lufs(ref_solo)
        make = 10 ** ((-18.0 - ref_solo_l) / 20)
        clips = [('Reference: ' + args.part + ' as composed (GM %d %s) — full mix' % (
            next(e.program for t in mido.MidiFile(src).tracks if tname(t) == args.part for e in t if e.type == 'program_change'),
            GM_NAMES[next(e.program for t in mido.MidiFile(src).tracks if tname(t) == args.part for e in t if e.type == 'program_change')]),
            ref_full * gain, args.mix_seconds, lead_bed(src))]
        notes = []
        for k, (prog, cap) in enumerate(opts):
            L = letters[k]
            nm = f'GM {prog} {GM_NAMES[prog]}'
            vs, hist = 1.0, []
            for it in range(5):
                dst = os.path.join(tmp, f'opt{k}.mid')
                swap(src, args.part, prog, cap, vs, dst)
                s = solo_of(dst)
                err = post.lufs(s) - ref_solo_l
                hist.append((vs, err))
                if abs(err) <= 0.4:
                    break
                vs *= 10 ** (-err / 20 / 1.6)  # velocity to level is roughly 1.6 dB per dB of velocity ratio; refined by retry
                if it >= 1:  # secant on log scale from the last two
                    (v0, e0), (v1, e1) = hist[-2], hist[-1]
                    if abs(np.log(v1 / v0)) > 1e-6:
                        slope = (e1 - e0) / np.log(v1 / v0)
                        vs = v1 * np.exp(-e1 / slope) if slope > 0 else vs
            vs = hist[-1][0]
            swap(src, args.part, prog, cap, vs, dst)
            palette_ok = True
            full = render(dst)
            lb = lead_bed(dst)
            s = solo_of(dst)
            adj = f'velocity x{vs:.2f}' + (f', notes capped at {cap} ticks ({cap / 480:.2f} beat)' if cap else ', note lengths as composed')
            adj += f'; part alone {post.lufs(s) - ref_solo_l:+.1f} LU vs reference alone; lead minus bed {lb:+.1f} LU'
            clips.append((f'{L} {nm} — solo', s * make, args.solo_seconds, None, adj))
            clips.append((f'{L} {nm} — full mix', full * gain, args.mix_seconds, lb, adj))
    parts, rows, t, n = [], [], 0.0, 0
    for c in clips:
        label, a, dur = c[0], c[1], c[2]
        a = post.fade(a[: int(dur * SR)], FADE, FADE)
        n += 1
        rows.append(f'{n}\t{int(t // 60)}:{int(t % 60):02d}\t{label}\t' + (c[4] if len(c) > 4 else f'full mix at the shipped gain; lead minus bed {c[3]:+.1f} LU'))
        parts.append(a)
        parts.append(np.zeros((int(GAP * SR), 2)))
        t += len(a) / SR + GAP
    reel = np.concatenate(parts[:-1])
    base = os.path.join(OUT, f'{args.loop}-{args.part}-swap')
    pcm = (np.clip(reel, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame',
                    '-b:a', '128k', base + '.mp3'], input=pcm, check=True)
    open(base + '.txt', 'w').write('\n'.join(rows) + '\n')
    print('\n'.join(rows))
    print(f'{base}.mp3: {len(reel) / SR:.1f} s, peak {post.peak_db(reel):.1f} dBFS')


if __name__ == '__main__':
    main()
