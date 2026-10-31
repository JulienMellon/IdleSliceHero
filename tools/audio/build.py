"""Build every audio asset: compose MIDI, render it, process, encode, measure, and write the app manifest.

    cd tools/audio && npm install && pip install mido numpy scipy pyloudnorm
    python3 build.py

Outputs:
  assets/audio/music/*.m4a   stereo AAC 96 kbps, loops cut to exact bar length with the tail folded onto the start
  assets/audio/sting/*.m4a   mono AAC 64 kbps, beat 1 at `downbeatSeconds`
  assets/audio/story/*.m4a   stereo AAC 96 kbps
  assets/audio/sfx/*.m4a     mono AAC 64 kbps, peaks at -9 dBFS
  src/audio/manifest.ts      generated: every cue's file, length, tempo and loudness
  tools/audio/build/report.json
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import numpy as np

import post
import sfx as SFX

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MIDI = os.path.join(HERE, 'build', 'midi')
ASSETS = os.path.join(ROOT, 'assets', 'audio')

LOUD = dict(music=-20.0, story=-16.0, sting=-18.0)  # AU22; the lofi loops sit 2 LU lower (2026-10-31)
HQ_LUFS, HQ_CEILING = -18.0, -4.0  # the MegaSlice HQ loop keeps its old master (lofi round 1 leaves it alone)
LOOP_CEILING = -6.0
# AU36: loudness by tier, so rare big moments are louder than frequent small ones; every file's peak ≤ −6 dBFS (AU38)
CEILING = -6.0
SFX_LUFS = {'click': -30, 'bubble': -30, 'tap': -26, 'full': -26, 'cash': -26, 'buy': -22, 'refused': -22, 'rush': -22,
            'sparkle': -24, 'milestone': -19, 'expand': -19, 'grade': -19, 'fleet': -19, 'gavel': -18, 'build': -16,
            'collect': (-19, -17.5, -16)}
# every tier moved down 2 LU with the loops (lofi round 1), so each stinger sits the same distance above the music
STING_LUFS = {'bottleneck': -22, 'upgrade': -20, 'fleet': -20, 'drone': -20, 'milestone': -19, 'welcome': -19,
              'warmth': -20, 'manager': -17, 'milestone_big': -17, 'build': -17, 'perk': -20, 'offline': -22, 'bid': -18}
# per-cue loudness overrides: the reveals are the game's quietest moments (AU13)
LUFS_OVERRIDE = {'reunion': -23.0, 'recipe': -21.0, 'offline_open': -20.0}


def main(only: set[str] | None = None):
    if not only:  # a full build starts clean, so renamed or retired cues don't linger in the bundle
        import shutil
        shutil.rmtree(ASSETS, ignore_errors=True)
    subprocess.run([sys.executable, os.path.join(HERE, 'compose.py'), MIDI], check=True, stdout=subprocess.DEVNULL)
    man = json.load(open(os.path.join(MIDI, 'manifest.json')))
    rp = os.path.join(HERE, 'build', 'report.json')
    report = json.load(open(rp)) if only and os.path.exists(rp) else {}
    for name, cue in man.items():
        if only and name not in only:
            continue
        a = post.render_midi(os.path.join(MIDI, name + '.mid'), tail=2.5 if cue.get('lofi') and cue['kind'] == 'stinger' else 4.0)
        if cue['kind'] == 'loop':
            a = post.wrap_loop(a, cue['seconds'])
            if cue.get('lofi'):
                a = post.lofi_loop(a, seed=sum(map(ord, name)))
                a = post.normalize(a, LOUD['music'], ceiling_db=LOOP_CEILING)
            else:
                a = post.normalize(a, HQ_LUFS, ceiling_db=HQ_CEILING)  # AU52: room for a tap on a kick
            join, p99 = post.seam_step(a)
            if join > p99:  # the loop seam must be no bigger than an ordinary sample step
                raise SystemExit(f'{name}: loop seam step {join:.5f} > 99th-percentile step {p99:.5f}')
            info = post.encode(a, os.path.join(ASSETS, 'music', name + '.m4a'), 96, mono=False)
            info['seam'] = [round(join, 5), round(p99, 5)]
        elif cue['kind'] == 'stinger':
            if cue.get('lofi'):  # shorter tails: trim at -46 dBFS and fade the last 0.3 s
                a = post.fade(post.trim_silence(post.lofi_sting(a), -46), 0, 0.3)
            else:
                a = post.fade(post.trim_silence(a, -50), 0, 0.15)
            a = post.normalize(a, STING_LUFS.get(cue['cue'], LOUD['sting']), ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'sting', name.removeprefix('sting_') + '.m4a'), 64, mono=True)
        else:
            a = post.fade(post.trim_silence(a, -50), 0, 0.3)
            a = post.normalize(a, LUFS_OVERRIDE.get(name, LOUD['story']), ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'story', name + '.m4a'), 96, mono=False)
        report[name] = {**cue, **info}
        print(f"{name:34s} {info['seconds']:7.2f}s {info['lufs']:6.1f} LUFS {info['peak_dbfs']:6.1f} dBFS {info['bytes'] / 1024:7.1f} KB")
    for name, variants in SFX.ALL.items():
        if only and name not in only:
            continue
        for i, x in enumerate(variants):
            tier = SFX_LUFS[name]
            target = tier[i] if isinstance(tier, tuple) else tier
            a = post.normalize(x.reshape(-1, 1), target, None, ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'sfx', f'{name}_{i}.m4a'), 64, mono=True)
            report[f'sfx_{name}_{i}'] = {'kind': 'sfx', 'target_lufs': target, **info}
            # AU51: every effect lands on its tier, unless the −6 dBFS ceiling stopped it (then it's quieter, never louder)
            ok = abs(info['lufs'] - target) <= 0.5 or (info['lufs'] < target and info['peak_dbfs'] >= CEILING - 0.6)
            if not ok:
                raise SystemExit(f'sfx {name}_{i}: {info["lufs"]} LUFS, tier {target} (peak {info["peak_dbfs"]})')
    os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
    post.write_report(os.path.join(HERE, 'build', 'report.json'), report)
    write_manifest(report)
    tot = {}
    for r in report.values():
        tot[r['kind']] = tot.get(r['kind'], 0) + r['bytes']
    print({k: f'{v / 1024 / 1024:.2f} MB' for k, v in tot.items()})


def write_manifest(report: dict):
    """src/audio/manifest.ts: require() map + timing data. Generated; edit build.py, not the output."""
    lines = ['// GENERATED by tools/audio/build.py — do not edit by hand.', '/* eslint-disable */', '',
             'export interface CueInfo { seconds: number; bpm?: number; beatsPerBar?: number; downbeatSeconds?: number }', '']
    music, sting, story, sfx = [], [], [], {}
    for k, r in sorted(report.items()):
        f = '../../' + r['file']
        meta = {'seconds': r['seconds']}
        for key in ('bpm', 'beatsPerBar', 'downbeatSeconds', 'payoffSeconds', 'musicSeconds', 'barRoots'):
            if key in r:
                meta[key] = r[key]
        if r['kind'] == 'loop':
            music.append((k, f, meta))
        elif r['kind'] == 'stinger':
            sting.append((k.removeprefix('sting_'), f, meta))
        elif r['kind'] == 'story':
            story.append((k, f, meta))
        else:
            base = k.removeprefix('sfx_').rsplit('_', 1)[0]
            sfx.setdefault(base, []).append(f)

    def block(title, items):
        out = [f'export const {title} = {{']
        for k, f, meta in items:
            props = ', '.join(f'{mk}: {json.dumps(mv)}' for mk, mv in meta.items())
            out.append(f"  {k}: {{ src: require('{f}'), {props} }},")
        out.append('} as const;')
        return out

    lines += block('MUSIC', music) + [''] + block('STINGS', sting) + [''] + block('STORY', story) + ['']
    lines.append('export const SFX = {')
    for base, files in sfx.items():
        lines.append(f"  {base}: [{', '.join(f'require({json.dumps(f)})' for f in files)}],")
    lines.append('} as const;')
    lines += ['', 'export type MusicId = keyof typeof MUSIC;', 'export type StingId = keyof typeof STINGS;',
              'export type StoryCueId = keyof typeof STORY;', 'export type SfxId = keyof typeof SFX;', '']
    os.makedirs(os.path.join(ROOT, 'src', 'audio'), exist_ok=True)
    open(os.path.join(ROOT, 'src', 'audio', 'manifest.ts'), 'w').write('\n'.join(lines))


if __name__ == '__main__':
    if sys.argv[1:] == ['--manifest-only']:
        write_manifest(json.load(open(os.path.join(HERE, 'build', 'report.json'))))
    else:
        main(set(sys.argv[1:]) or None)
