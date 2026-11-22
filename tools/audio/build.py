"""Build every audio asset: compose MIDI, render it, process, encode, measure, and write the app manifest.

    cd tools/audio && npm install && pip install mido numpy scipy pyloudnorm
    python3 build.py

Outputs:
  assets/audio/music/*.m4a   stereo AAC 192 kbps (96 before 2026-11-19, 128 in round R1, 256 until 2026-11-22), loops cut to exact bar length with the tail folded onto the start
  assets/audio/sting/*.m4a   mono AAC 192 kbps (64 before 2026-11-19, 256 until 2026-11-22), beat 1 at `downbeatSeconds`
  assets/audio/story/*.m4a   stereo AAC 192 kbps (96 before 2026-11-19, 256 until 2026-11-22)
  assets/audio/sfx/*.m4a     mono AAC 64 kbps, peaks at -9 dBFS (unchanged, 16-bit in)
  tools/audio/build/master/{music,sting,story}/*.wav   the 32-bit float masters that went into the encoder (not in git; reel.py cuts from them)
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
KBPS = 192  # music, stingers and story cues (Julien, 2026-11-22: 192 kbps going forward, reel and game; 256 from 2026-11-19; 128 for loops, 64 for stingers, 96 for story before)
MASTER = os.path.join(HERE, 'build', 'master')
LOOP_CEILING = -6.0
# AU67: Nonna's takeover (sparse -> full) lifts by 2 LU. AU70, card M1c: the MegaSlice HQ loop keeps its own tier, 1 LU above the
# other loops, and now goes through the same lofi chain.
LOOP_LUFS = {'downtown_sparse': -22.0, 'megaslice_hq': -19.0}
# AU64: the cues that sit over a lofi loop come down from -16 to -18 and get the story master (tape_sat, 10 kHz)
STORY_MASTER = {'megaslice_rep': -18.0, 'megaslice_rep_dock': -18.0, 'city_theme': -18.0, 'victor_exit': -19.0,  # notes R2: victor_exit -16 -> -19
                **{f'triumph_{h}': -18.0 for h in ('downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown')}}
# AU36: loudness by tier, so rare big moments are louder than frequent small ones; every file's peak ≤ −6 dBFS (AU38)
CEILING = -6.0
SFX_LUFS = {'click': -32, 'bubble': -32, 'tap': -28, 'full': -28, 'cash': -28, 'buy': -22, 'refused': -22, 'rush': -22,
            'sparkle': -24, 'milestone': -19, 'expand': -19, 'grade': -19, 'fleet': -19, 'gavel': -18, 'build': -16,
            'collect': (-19, -17.5, -16)}
# every tier moved down 2 LU with the loops (lofi round 1), so each stinger sits the same distance above the music.
# Notes R2 (Julien 2026-11-22, "the stingers and story moments do not sit well over the music"): the cues that play over a ducked
# loop come down so they sit 3 to 4 LU closer to it (over the ducked loop: milestone_big +13 -> +10.5 LU, manager +12 -> +9.5,
# build +12 -> +8.5, milestone +7 -> +4, upgrade, fleet and drone +6 -> +3). The ladder keeps the order of D5 with 1 LU between
# rungs, because two cues with the same integrated tier differ by up to 0.8 LU in momentary max (the first try, manager = build, failed
# the hierarchy check). The bottleneck only drops 2 LU: its duck is -3 dB, so it was +1 LU over the loop and is now -1. The perk
# stays at -20: it is layered over the exclusive triumphs and the city theme, where the loop is silent.
STING_LUFS = {'bottleneck': -24, 'upgrade': -23, 'fleet': -23, 'drone': -23, 'milestone': -22, 'welcome': -22,
              'warmth': -23, 'manager': -19.5, 'milestone_big': -18.5, 'build': -20.5, 'perk': -20, 'offline': -25, 'bid': -21}
# per-cue loudness overrides: the reveals are the game's quietest moments (AU13)
LUFS_OVERRIDE = {'reunion': -23.0, 'recipe': -21.0, 'offline_open': -20.0}


def current_bank() -> str:
    """The soundfont render.mjs will use: SF2 env, else the line in tools/audio/BANK, else TimGM6mb."""
    if os.environ.get('SF2'):
        return os.environ['SF2']
    bf = os.path.join(HERE, 'BANK')
    if os.path.exists(bf):
        line = open(bf).read().split('\n')[0].strip()
        if line:
            return os.path.abspath(os.path.join(HERE, line))
    return '/usr/share/sounds/sf2/TimGM6mb.sf2'


def write_bank_json():
    """build/bank.json: which soundfont this build rendered through. A separate file: write_manifest iterates report.json."""
    import hashlib
    path = current_bank()
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
    json.dump({'name': os.path.basename(path), 'sha256': h.hexdigest()}, open(os.path.join(HERE, 'build', 'bank.json'), 'w'), indent=1)


def tier_ok(info: dict, target: float) -> bool:
    """AU51/AU62: a file lands within 0.5 LU of its tier, unless the -6 dBFS ceiling stopped it (then quieter, never louder)."""
    return abs(info['lufs'] - target) <= 0.5 or (info['lufs'] < target and info['peak_dbfs'] >= CEILING - 0.6)


HOODS = ('downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown')
# Card M2c: in every neighbourhood the stingers rank milestone_big > manager >= build > milestone > upgrade > bottleneck, on
# integrated loudness and on momentary-max loudness (400 ms window), so a rare big moment is never quieter than a frequent small one.
HIERARCHY = [('milestone_big', 'manager', True), ('manager', 'build', False), ('build', 'milestone', True),
             ('milestone', 'upgrade', True), ('upgrade', 'bottleneck', True)]  # (louder, softer, strictly louder?)


def hierarchy_errors(report: dict) -> list[str]:
    """One line per inversion, naming both cues and their numbers. A neighbourhood with a missing stinger is skipped (partial build)."""
    out = []
    for h in HOODS:
        row = {k: report.get(f'sting_{h}_{k}') for k in ('milestone_big', 'manager', 'build', 'milestone', 'upgrade', 'bottleneck')}
        if any(v is None for v in row.values()):
            continue
        for hi, lo, strict in HIERARCHY:
            for key, label in (('lufs', 'integrated'), ('momentary_max', 'momentary max')):
                if key not in row[hi] or key not in row[lo]:  # a report from before the check (partial build)
                    continue
                a, b = row[hi][key], row[lo][key]
                if (a <= b) if strict else (a < b):
                    out.append(f'{h}: {hi} {a:.1f} LUFS {"is not above" if strict else "is below"} {lo} {b:.1f} LUFS ({label})')
    return out


def main(only: set[str] | None = None):
    if not only:  # a full build starts clean, so renamed or retired cues don't linger in the bundle
        import shutil
        shutil.rmtree(ASSETS, ignore_errors=True)
    subprocess.run([sys.executable, os.path.join(HERE, 'compose.py'), MIDI], check=True, stdout=subprocess.DEVNULL)
    man = json.load(open(os.path.join(MIDI, 'manifest.json')))
    rp = os.path.join(HERE, 'build', 'report.json')
    if only and not os.path.exists(rp):  # a partial build would write a manifest holding only these cues
        raise SystemExit('build/report.json is missing: run one full `python3 build.py` before a partial build.')
    report = json.load(open(rp)) if only else {}
    for name, cue in man.items():
        if cue['kind'] == 'stem' or (only and name not in only):  # stems are rendered with the cue that owns them
            continue
        a = post.render_midi(os.path.join(MIDI, name + '.mid'), tail=2.5 if cue.get('lofi') and cue['kind'] == 'stinger' else 4.0)
        if cue['kind'] == 'loop':
            a = post.wrap_loop(a, cue['seconds'])
            a = post.lofi_loop(a, seed=sum(map(ord, name)))
            a = post.normalize(a, LOOP_LUFS.get(name, LOUD['music']), ceiling_db=LOOP_CEILING)
            join, p99 = post.seam_step(a)
            if join > p99:  # the loop seam must be no bigger than an ordinary sample step
                raise SystemExit(f'{name}: loop seam step {join:.5f} > 99th-percentile step {p99:.5f}')
            info = post.encode(a, os.path.join(ASSETS, 'music', name + '.m4a'), KBPS, mono=False,
                               master=os.path.join(MASTER, 'music', name + '.wav'))
            info['seam'] = [round(join, 5), round(p99, 5)]
            info['target_lufs'] = LOOP_LUFS.get(name, LOUD['music'])
            if not tier_ok(info, info['target_lufs']):
                raise SystemExit(f'loop {name}: {info["lufs"]} LUFS, tier {info["target_lufs"]} (peak {info["peak_dbfs"]})')
        elif cue['kind'] == 'stinger':
            if cue.get('lofi'):  # shorter tails: trim at -46 dBFS and fade the last 0.3 s
                bell = post.render_midi(os.path.join(MIDI, cue['bellStem'] + '.mid'), tail=2.5) if cue.get('bellStem') else None
                a = post.fade(post.lofi_sting(a, bell), 0, 0.3)
            else:
                a = post.fade(post.trim_silence(a, -50), 0, 0.15)
            # AU59/AU62: normalise after the mono fold, because mono is what ships (stereo-then-fold read ~3 LU low)
            a = post.normalize(post.to_mono(a), STING_LUFS.get(cue['cue'], LOUD['sting']), ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'sting', name.removeprefix('sting_') + '.m4a'), KBPS, mono=True,
                               master=os.path.join(MASTER, 'sting', name + '.wav'))
            target = STING_LUFS.get(cue['cue'], LOUD['sting'])
            info['target_lufs'] = target
            if not tier_ok(info, target):
                raise SystemExit(f'stinger {name}: {info["lufs"]} LUFS, tier {target} (peak {info["peak_dbfs"]})')
        else:
            if name in STORY_MASTER:
                a = post.story_master(a)
            a = post.fade(post.trim_silence(a, -50), 0, 0.3)
            a = post.normalize(a, STORY_MASTER.get(name, LUFS_OVERRIDE.get(name, LOUD['story'])), ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'story', name + '.m4a'), KBPS, mono=False,
                               master=os.path.join(MASTER, 'story', name + '.wav'))
            info['target_lufs'] = STORY_MASTER.get(name, LUFS_OVERRIDE.get(name, LOUD['story']))
            if not tier_ok(info, info['target_lufs']):
                raise SystemExit(f'story {name}: {info["lufs"]} LUFS, tier {info["target_lufs"]} (peak {info["peak_dbfs"]})')
        report[name] = {**cue, **info}
        print(f"{name:34s} {info['seconds']:7.2f}s {info['lufs']:6.1f} LUFS {info['peak_dbfs']:6.1f} dBFS {info['bytes'] / 1024:7.1f} KB")
    for name, variants in SFX.ALL.items():
        if only and name not in only:
            continue
        for i, x in enumerate(variants):
            tier = SFX_LUFS[name]
            target = tier[i] if isinstance(tier, tuple) else tier
            a = post.normalize(x.reshape(-1, 1), target, None, ceiling_db=CEILING)
            info = post.encode(a, os.path.join(ASSETS, 'sfx', f'{name}_{i}.m4a'), 64, mono=True, float_in=False)
            report[f'sfx_{name}_{i}'] = {'kind': 'sfx', 'target_lufs': target, **info}
            # AU51: every effect lands on its tier, unless the −6 dBFS ceiling stopped it (then it's quieter, never louder)
            if not tier_ok(info, target):
                raise SystemExit(f'sfx {name}_{i}: {info["lufs"]} LUFS, tier {target} (peak {info["peak_dbfs"]})')
    os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
    post.write_report(os.path.join(HERE, 'build', 'report.json'), report)
    bad = hierarchy_errors(report)
    if bad:
        raise SystemExit('loudness hierarchy broken:\n  ' + '\n  '.join(bad))
    write_bank_json()
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
