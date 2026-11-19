"""Solo audition reel: one loop, each part of the score playing alone, one after another, for Julien to listen to.

    python3 solo_reel.py downtown            # build/reel/downtown-solo.mp3 + .txt, bank C
    python3 solo_reel.py suburbs --bank C --seconds 28

The score is composed fresh with compose.py into a scratch folder (nothing under build/midi, assets/ or src/ is touched).
For every MIDI track the other tracks are dropped, the file goes through render.mjs and the build's loop path (wrap_loop,
lofi_loop), and the first `--seconds` from bar 0 are cut. Level: the full mix is normalised to the loop tier exactly as
build.py does it, and that one gain is applied to every solo, so a part that is quiet in the mix stays quiet in the reel
(a part's solo still gets the chain's own saturation, which is set from the programme it carries). Each clip fades in and
out over 0.3 s with 1 s of silence between clips. One static gain on the whole reel puts the full-mix reference at -16 LUFS.
The reel ends with `--mix-seconds` of the full mix. The .txt has one tab-separated row per clip:
index, start m:ss, part, GM program and name, role, and the part's first-note bar.
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

import post
from timbre import BANKS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'build', 'reel')
SR = post.SR
FADE, GAP, TARGET_LUFS = 0.3, 1.0, -18.0

GM_NAMES = (
    'Acoustic Grand Piano,Bright Acoustic Piano,Electric Grand Piano,Honky-tonk Piano,Electric Piano 1,Electric Piano 2,Harpsichord,'
    'Clavinet,Celesta,Glockenspiel,Music Box,Vibraphone,Marimba,Xylophone,Tubular Bells,Dulcimer,Drawbar Organ,Percussive Organ,'
    'Rock Organ,Church Organ,Reed Organ,Accordion,Harmonica,Tango Accordion,Acoustic Guitar (nylon),Acoustic Guitar (steel),'
    'Electric Guitar (jazz),Electric Guitar (clean),Electric Guitar (muted),Overdriven Guitar,Distortion Guitar,Guitar Harmonics,'
    'Acoustic Bass,Electric Bass (finger),Electric Bass (pick),Fretless Bass,Slap Bass 1,Slap Bass 2,Synth Bass 1,Synth Bass 2,'
    'Violin,Viola,Cello,Contrabass,Tremolo Strings,Pizzicato Strings,Orchestral Harp,Timpani,String Ensemble 1,String Ensemble 2,'
    'Synth Strings 1,Synth Strings 2,Choir Aahs,Voice Oohs,Synth Voice,Orchestra Hit,Trumpet,Trombone,Tuba,Muted Trumpet,French Horn,'
    'Brass Section,Synth Brass 1,Synth Brass 2,Soprano Sax,Alto Sax,Tenor Sax,Baritone Sax,Oboe,English Horn,Bassoon,Clarinet,Piccolo,'
    'Flute,Recorder,Pan Flute,Blown Bottle,Shakuhachi,Whistle,Ocarina,Lead 1 (square),Lead 2 (sawtooth),Lead 3 (calliope),'
    'Lead 4 (chiff),Lead 5 (charang),Lead 6 (voice),Lead 7 (fifths),Lead 8 (bass+lead),Pad 1 (new age),Pad 2 (warm),Pad 3 (polysynth),'
    'Pad 4 (choir),Pad 5 (bowed),Pad 6 (metallic),Pad 7 (halo),Pad 8 (sweep),FX 1 (rain),FX 2 (soundtrack),FX 3 (crystal),'
    'FX 4 (atmosphere),FX 5 (brightness),FX 6 (goblins),FX 7 (echoes),FX 8 (sci-fi),Sitar,Banjo,Shamisen,Koto,Kalimba,Bag pipe,Fiddle,'
    'Shanai,Tinkle Bell,Agogo,Steel Drums,Woodblock,Taiko Drum,Melodic Tom,Synth Drum,Reverse Cymbal,Guitar Fret Noise,Breath Noise,'
    'Seashore,Bird Tweet,Telephone Ring,Helicopter,Applause,Gunshot').split(',')


def role(name: str, program: int, channel: int) -> str:
    n = name.lower()
    if channel == 9 or 'kit' in n or 'drum' in n or 'perc' in n:
        return 'drums'
    if 'bass' in n or 32 <= program <= 39:
        return 'bass'
    if 'pad' in n or 88 <= program <= 95:
        return 'pad'
    if 'melody' in n or 'lead' in n:
        return 'lead'
    if 'arp' in n:
        return 'arpeggio (counter-line)'
    if any(k in n for k in ('rhodes', 'comp', 'chord', 'keys', 'piano')):
        return 'comping (chords)'
    return 'other'


def load_parts(path: str) -> list[dict]:
    m = mido.MidiFile(path)
    parts = []
    for i, t in enumerate(m.tracks):
        notes = [e for e in t if e.type == 'note_on' and e.velocity > 0]
        if not notes:
            continue
        prog = next((e.program for e in t if e.type == 'program_change'), None)
        ch = notes[0].channel
        tick, first = 0, None
        for e in t:
            tick += e.time
            if e.type == 'note_on' and e.velocity > 0:
                first = tick
                break
        parts.append({'index': i, 'name': t.name or f'track {i}', 'program': prog, 'channel': ch, 'first_tick': first,
                      'tpb': m.ticks_per_beat})
    return parts


def solo_midi(src: str, keep: int, dst: str) -> None:
    """The same file with every track but `keep` emptied of notes. Track 0 (tempo, meter) and the other tracks' program
    changes and controllers stay, so channels are set up exactly as in the full score; only the notes go."""
    m = mido.MidiFile(src)
    for i, t in enumerate(m.tracks):
        if i == keep or i == 0:
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


def master(mid: str, bank: str, name: str, seconds: float) -> np.ndarray:
    """build.py's loop path up to normalisation: render, fold the tail, lofi master. Returns the un-normalised audio."""
    a = post.wrap_loop(post.render_midi(mid, tail=4.0, bank=bank), seconds)
    return post.lofi_loop(a, seed=sum(map(ord, name)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('loop')
    ap.add_argument('--bank', default='C')
    ap.add_argument('--seconds', type=float, default=28.0)
    ap.add_argument('--mix-seconds', type=float, default=20.0)
    args = ap.parse_args()
    bank = os.path.join(HERE, 'banks', BANKS[args.bank])
    if not os.path.exists(bank):
        subprocess.run([os.path.join(HERE, 'fetch_bank.sh'), args.bank], check=True, stdout=subprocess.DEVNULL)
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([sys.executable, os.path.join(HERE, 'compose.py'), tmp], check=True, stdout=subprocess.DEVNULL)
        man = json.load(open(os.path.join(tmp, 'manifest.json')))[args.loop]
        src = os.path.join(tmp, args.loop + '.mid')
        loop_s = man['seconds']
        bar_s = man['beatsPerBar'] * 60.0 / man['bpm']
        full = master(src, bank, args.loop, loop_s)
        gain = 10 ** ((-20.0 - post.lufs(full)) / 20)  # build.py's LOUD['music'] tier (the loop's own tier if it has one)
        tier = json.load(open(os.path.join(HERE, 'build', 'report.json'))).get(args.loop, {}).get('target_lufs')
        if tier is not None:
            gain = 10 ** ((tier - post.lufs(full)) / 20)
        parts = load_parts(src)
        clips = []
        for p in parts:
            dst = os.path.join(tmp, f'solo_{p["index"]}.mid')
            solo_midi(src, p['index'], dst)
            a = master(dst, bank, args.loop, loop_s) * gain
            gm = p['program']
            gm_txt = f'GM {gm} {GM_NAMES[gm]}' if p['channel'] != 9 and gm is not None else f'GM drum kit program {gm} (brushes)'
            first_bar = p['first_tick'] / p['tpb'] / man['beatsPerBar']
            clips.append((p['name'], gm_txt, role(p['name'], gm or 0, p['channel']), first_bar, a[: int(args.seconds * SR)],
                          post.lufs(a) - post.lufs(full * gain)))
        clips.append(('full mix', 'all parts', 'reference', 0.0, (full * gain)[: int(args.mix_seconds * SR)], 0.0))

    parts_a, rows, t = [], [], 0.0
    for i, (name, gm_txt, rl, fb, a, mix_lu) in enumerate(clips):
        a = post.soft_limit(a * 10 ** ((TARGET_LUFS - post.lufs(a)) / 20), -1.0)
        clips[i] = (name, gm_txt, rl, fb, a, mix_lu)
        parts_a.append(post.fade(a, FADE, FADE))
        rows.append(f'{i + 1}\t{int(t // 60)}:{int(t % 60):02d}\t{name}\t{gm_txt}\t{rl}\tfirst note at bar {fb:.1f}\t{mix_lu:+.1f} LU vs full mix when mixed')
        t += len(a) / SR
        if i < len(clips) - 1:
            parts_a.append(np.zeros((int(GAP * SR), 2)))
            t += GAP
    reel = np.concatenate(parts_a)
    peak = post.peak_db(reel)
    base = os.path.join(OUT, f'{args.loop}-solo')
    pcm = (np.clip(reel, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame',
                    '-b:a', '128k', base + '.mp3'], input=pcm, check=True)
    with open(base + '.txt', 'w') as f:
        f.write('\n'.join(rows) + '\n')
    for (name, _, _, _, a, lu) in clips:
        print(f'{name:16s} {post.lufs(a):6.1f} LUFS  peak {post.peak_db(a):6.1f} dBFS  {lu:+.1f} LU in the mix')
    print(f'{base}.mp3: {len(reel) / SR:.1f} s, peak {peak:.1f} dBFS')


if __name__ == '__main__':
    main()
