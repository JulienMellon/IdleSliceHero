"""Stem audit: how far a loop's lead tracks sit above or below the rest of the loop.

    python3 audit.py downtown suburbs industrial          # through the current bank (SF2 env, BANK file, else TimGM6mb)
    python3 audit.py --bank banks/GeneralUser-GS.sf2 downtown

For each loop it splits build/midi/<loop>.mid by track name into the lead tracks and everything else (the kit, bass,
comping, any other melody), renders each alone, wraps and masters each as the build does (`post.lofi_loop`) without normalising, and prints integrated LUFS for each and lead minus bed. The leads come from the
chart: the `leads=` tuple that the loop's function passes to `lofi_finish` or `jazz_finish` in compose.py. Integrated loudness is gated, so a
lead that is silent for part of the loop is measured over the bars where it plays. A second pair of columns repeats
the measure on the raw render, before mastering. Reusable: `audit(loop, bank=None)` returns the numbers as a dict.
"""
from __future__ import annotations

import ast
import os
import subprocess
import sys

import mido

import post

HERE = os.path.dirname(os.path.abspath(__file__))
MIDI = os.path.join(HERE, 'build', 'midi')
WORK = os.path.join(HERE, 'build', 'audit')


def leads_of(loop: str) -> tuple[str, ...]:
    """The `leads=` tuple of the `lofi_finish` call in the compose.py function that writes `loop`."""
    tree = ast.parse(open(os.path.join(HERE, 'compose.py')).read())
    found: list[str] = []
    for fn in (n for n in tree.body if isinstance(n, ast.FunctionDef)):
        for call in (c for c in ast.walk(fn) if isinstance(c, ast.Call)):
            if getattr(call.func, 'id', '') in ('lofi_finish', 'jazz_finish'):
                for kw in call.keywords:
                    if kw.arg == 'leads':
                        names = tuple(ast.literal_eval(kw.value))
                        if fn.name == loop or (loop, fn.name) in (('downtown_sparse', 'downtown'), ('megaslice_hq', 'megaslice')):
                            found = list(names)
    if not found:
        raise SystemExit(f'{loop}: no leads= found in compose.py')
    return tuple(found)


def split(loop: str, leads: tuple[str, ...]) -> tuple[str, str]:
    """Write <loop>_lead.mid and <loop>_bed.mid under build/audit/; return their paths."""
    os.makedirs(WORK, exist_ok=True)
    src = mido.MidiFile(os.path.join(MIDI, loop + '.mid'))
    out = {}
    for part in ('lead', 'bed'):
        m = mido.MidiFile(type=src.type, ticks_per_beat=src.ticks_per_beat)
        for i, tr in enumerate(src.tracks):
            name = next((x.name for x in tr if x.type == 'track_name'), '')
            if i == 0 or (name in leads) == (part == 'lead'):  # track 0 is the tempo and meter map
                m.tracks.append(tr)
        have = {next((x.name for x in tr if x.type == 'track_name'), '') for tr in m.tracks}
        if part == 'lead' and not set(leads) & have:
            raise SystemExit(f'{loop}: none of the lead tracks {leads} exist in the MIDI (tracks: {sorted(have)})')
        out[part] = os.path.join(WORK, f'{loop}_{part}.mid')
        m.save(out[part])
    return out['lead'], out['bed']


def audit(loop: str, bank: str | None = None) -> dict:
    import json
    man = json.load(open(os.path.join(MIDI, 'manifest.json')))[loop]
    leads = leads_of(loop)
    paths = dict(zip(('lead', 'bed'), split(loop, leads)))
    res = {'loop': loop, 'leads': leads, 'bank': os.path.basename(bank) if bank else None}
    for part, path in paths.items():
        a = post.wrap_loop(post.render_midi(path, tail=4.0, bank=bank), man['seconds'])
        res[part + '_raw'] = post.lufs(a)
        m = post.lofi_loop(a, seed=sum(map(ord, loop)))
        res[part] = post.lufs(m)
    res['diff'] = res['lead'] - res['bed']
    res['diff_raw'] = res['lead_raw'] - res['bed_raw']
    return res


if __name__ == '__main__':
    args = sys.argv[1:]
    bank = None
    if args[:1] == ['--bank']:
        bank, args = os.path.abspath(args[1]), args[2:]
    if not args:
        raise SystemExit(__doc__)
    if not os.path.exists(os.path.join(MIDI, 'manifest.json')):
        subprocess.run([sys.executable, os.path.join(HERE, 'compose.py'), MIDI], check=True, stdout=subprocess.DEVNULL)
    print(f"{'loop':16s} {'leads':32s} {'lead LUFS':>9s} {'bed LUFS':>9s} {'lead-bed':>9s} {'raw lead-bed':>13s}")
    for loop in args:
        r = audit(loop, bank)
        print(f"{loop:16s} {', '.join(r['leads']):32s} {r['lead']:9.1f} {r['bed']:9.1f} {r['diff']:+9.1f} {r['diff_raw']:+13.1f}")
