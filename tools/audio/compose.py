"""Slice Empire score: six neighbourhood loops, story cues and per-key stingers, all from one city motif.

Run: python3 compose.py [outdir]   -> writes .mid files plus manifest.json (bpm, meter, loop length per cue).
Instruments are General MIDI programs, 0-based here (the cue sheet lists them 1-based).
"""
from __future__ import annotations

import json
import os
import sys

from mlib import (Song, Track, deg, p, MAJOR, MIXO, MINOR, KICK, SNARE, RIM, CLAP, CHH, OHH, PEDAL, CRASH, RIDE,
                  TAMB, SHAKER, COWBELL, TOM_LO, TOM_MID, TOM_HI, CONGA_LO, CONGA_HI, CLAVES, TRIANGLE_OPEN, CABASA,
                  SPLASH)
import material as M

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'build', 'midi')
os.makedirs(OUT, exist_ok=True)
MANIFEST: dict = {}

GM = dict(piano=0, celesta=8, glock=9, vibes=11, marimba=12, bells=14, organ=16, accordion=21, tango_acc=23,
          nylon=24, steel=25, jazz_gtr=26, clean_gtr=27, ac_bass=32, fing_bass=33, syn_bass=38, strings=48,
          slow_strings=49, pizz=45, harp=46, timpani=47, trumpet=56, trombone=57, tuba=58, mute_tpt=59, horn=60,
          brass=61, tenor_sax=66, bassoon=70, clarinet=71, flute=73, whistle=78, square=80, fiddle=110,
          steel_drums=114, rhodes=4, choir=52, oohs=53)

# Per-neighbourhood identity (AU17). `root` is the melody's tonic (around middle C).
HOODS = {
    'downtown': dict(root='F4', mode=MAJOR, bpm=126, bar=3, ts=(6, 8), lead=GM['accordion'], swing=0.0),
    'suburbs': dict(root='G4', mode=MAJOR, bpm=112, bar=4, ts=(4, 4), lead=GM['trumpet'], swing=0.0),
    'waterfront': dict(root='D4', mode=MIXO, bpm=96, bar=4, ts=(4, 4), lead=GM['fiddle'], swing=0.0),
    'university': dict(root='Bb4', mode=MAJOR, bpm=84, bar=4, ts=(4, 4), lead=GM['square'], swing=0.58),
    'industrial': dict(root='A3', mode=MIXO, bpm=92, bar=4, ts=(4, 4), lead=GM['tenor_sax'], swing=0.667),
    'uptown': dict(root='Eb4', mode=MAJOR, bpm=104, bar=4, ts=(4, 4), lead=GM['clarinet'], swing=0.6),
}


# ------------------------------------------------------------------------------------------------ helpers
def swing(song: Song, ratio: float, tracks=None):
    """Delay off-beat eighths to `ratio` of the beat (0.5 = straight, 0.667 = triplet shuffle)."""
    if ratio <= 0.5:
        return
    for tr in tracks or song.tracks:
        ev = []
        for (t, d, pi, v) in tr.events:
            frac = t - int(t)
            if abs(frac - 0.5) < 0.02:
                nt = int(t) + ratio
                ev.append((nt, max(0.05, d - (ratio - 0.5)), pi, v))
            else:
                ev.append((t, d, pi, v))
        tr.events = ev


def swing_smooth(tracks, ratio: float):
    """Swing every subdivision, not just the off-beat eighth: within each beat, 0→0, .5→ratio, 1→1 (piecewise
    linear), so 16ths line up with swung 8th-note hats (AU48)."""
    if ratio <= 0.5:
        return
    def f(x):
        b = int(x)
        fr = x - b
        return b + (fr / 0.5 * ratio if fr <= 0.5 else ratio + (fr - 0.5) / 0.5 * (1 - ratio))
    for tr in tracks:
        tr.events = [(f(t), max(0.04, f(t + d) - f(t)), pi, v) for (t, d, pi, v) in tr.events]


def melody(tr: Track, root, bars, mode, start, bar_beats, vel=96, legato=0.92, shift=0, accent_first=True):
    for (t, d, pi) in M.bar_melody(root, bars, mode, start, bar_beats, shift):
        v = vel + (6 if accent_first and abs((t - start) % bar_beats) < 1e-6 else 0)
        tr.n(t, d * legato, pi, min(127, v))


def pickup(tr: Track, root, mode, at, vel=88, shift=0):
    tr.n(at - 0.5, 0.45, deg(root, -2, mode) + shift, vel)


def segs(harm_bars, start, bar_beats):
    """Yield (t, beats, degree, size) for each harmony segment."""
    t = start
    for bar in harm_bars:
        u = t
        for (d, size, beats) in bar:
            yield u, beats, d, size
            u += beats
        t += bar_beats


def cn(root, d, size, mode, octs=0, remap=None):
    if remap and d in remap:
        return [p(x) + 12 * octs for x in remap[d]]
    return M.chord_notes(root, d, size, mode, octs)


def bass_root(root, d, mode, oct_=-2, remap=None):
    if remap and d in remap:
        return p(remap[d][0]) - 12 * ((p(remap[d][0]) - (p(root) + 12 * oct_)) // 12)
    return deg(root, d, mode) + 12 * oct_


def finish(song: Song, name: str, bars: int, bar_beats: float, ts, kind: str, extra=None):
    beats = bars * bar_beats
    secs = song.save(os.path.join(OUT, f'{name}.mid'), beats, ts)
    roots = getattr(song, 'bar_roots', None)
    if roots:  # the chord degree on each bar's downbeat, so stingers can wait for the tonic (AU47)
        assert len(roots) == bars, (name, len(roots), bars)
        extra = {**(extra or {}), 'barRoots': roots}
    MANIFEST[name] = dict(kind=kind, bpm=song.bpm, beatsPerBar=bar_beats, bars=bars, seconds=round(secs, 4),
                          **(extra or {}))
    return secs


# ================================================================================================ DOWNTOWN
def downtown(sparse=False):
    h = HOODS['downtown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=11 + sparse)
    lead = s.track('accordion', 0, GM['accordion'], volume=100, pan=58, reverb=45)
    mand = s.track('mandolin (steel gtr tremolo)', 1, GM['steel'], volume=92, pan=80, reverb=40)
    pizz = s.track('pizzicato', 2, GM['pizz'], volume=84, pan=44, reverb=50)
    bass = s.track('bass', 3, GM['ac_bass'], volume=100, pan=64, reverb=20)
    perc = s.track('tambourine', 9, 0, volume=70, pan=70, reverb=30)

    plan = [  # (section, harmony key, melody bars | None, melody track)
        ('intro', ['M', 'ANS'], None, None),
        ('A', ['M'], M.M68, 'lead'), ('A', ['ANS'], M.ANS68, 'lead'),
        ('A', ['DEV'], M.DEV68, 'pizz'), ('A', ['CLOSE'], M.CLOSE68, 'lead'),
        ('bed', ['ANS', 'CLOSE'], None, None),
        ('B', ['B'], M.B68, 'mand'), ('B', ['B'], M.B68, 'lead_low'),
        ('A2', ['M'], M.M68, 'lead'), ('A2', ['CLOSE'], M.CLOSE68, 'lead'),
        ('bed', ['M', 'ANS'], None, None),
    ]
    t = 0.0
    s.bar_roots = [bar[0][0] for (_, hkeys, _m, _w) in plan for k in hkeys for bar in M.H68[k]]
    for sec, hkeys, mel, who in plan:
        harm = [bar for k in hkeys for bar in M.H68[k]]
        nb = len(harm)
        quiet = sec in ('intro', 'bed')
        for (u, beats, d, size) in segs(harm, t, B):
            ch = cn(R, d, size, md, -1)
            # mandolin: 16th tremolo on the top two chord tones (the Neapolitan mandolinata sound)
            if not (who == 'mand' and not quiet):
                for q in ch[-2:]:
                    mand.roll(u, beats, q + 12, vel=52 if quiet else 58, rate=0.25)
            if sparse:
                continue
            # tarantella bass: dotted quarters, root then fifth
            for k in range(int(beats // 1.5)):
                b = bass_root(R, d, md, -2) + (7 if k % 2 else 0)
                bass.n(u + 1.5 * k, 1.3, b, 92 if k == 0 else 80)
            # pizzicato off-beats (eighths 2-3 and 5-6 of the bar)
            if who != 'pizz':
                for k in range(int(beats // 1.5)):
                    for off in (0.5, 1.0):
                        pizz.n(u + 1.5 * k + off, 0.3, ch[1:], 54 if quiet else 62)
        if not sparse:
            for k in range(nb * 6):  # tambourine eighths, accents on 1 and 4
                acc = k % 3 == 0
                perc.n(t + 0.5 * k, 0.2, TAMB, 78 if acc else 46)
        if mel:
            if who == 'lead':
                if sec in ('A', 'A2') and mel is M.M68:
                    pickup(lead, R, md, t, 86)
                melody(lead, R, mel, md, t, B, vel=98)
            elif who == 'lead_low':
                melody(lead, R, mel, md, t, B, vel=86, shift=-12)
            elif who == 'pizz':
                melody(pizz, R, mel, md, t, B, vel=86, legato=0.5, shift=12)
                melody(lead, R, mel, md, t, B, vel=62, shift=-12)  # accordion shadows it an octave down
            elif who == 'mand':
                for (u, d_, pi) in M.bar_melody(R, mel, md, t, B, 12):
                    mand.roll(u, d_, pi, vel=82, rate=0.25)
        if sparse and mel and who != 'lead':
            pass
        t += nb * B
    if sparse:  # AU20: before Nonna takes over, just accordion and mandolin
        s.tracks = [lead, mand]
    s.humanize(0.01, 5)
    name = 'downtown_sparse' if sparse else 'downtown'
    return finish(s, name, int(t // B), B, h['ts'], 'loop', dict(hood='downtown'))


# ================================================================================================ 4/4 shared
def play_sections(s: Song, h: dict, plan, comp, bassf, drums, leads: dict, remap=None):
    """plan: list of (section name, harmony bars, melody bars | None, lead key, options)."""
    R, md, B = h['root'], h['mode'], h['bar']
    s.bar_roots = [bar[0][0] for (_, harm, *_r) in plan for bar in harm]
    t = 0.0
    for (sec, harm, mel, who, opt) in plan:
        nb = len(harm)
        for (u, beats, d, size) in segs(harm, t, B):
            comp(u, beats, d, size, sec)
            bassf(u, beats, d, size, sec)
        for k in range(nb):
            drums(t + k * B, k, nb, sec)
        if mel is not None and who:
            tr = leads[who]
            if opt.get('pickup'):
                pickup(tr, R, md, t, 84, opt.get('shift', 0))
            melody(tr, R, mel, md, t, B, vel=opt.get('vel', 96), legato=opt.get('legato', 0.92), shift=opt.get('shift', 0))
            if opt.get('double'):
                dtr, dshift, dvel = opt['double']
                melody(leads[dtr], R, mel, md, t, B, vel=dvel, shift=dshift)
        if opt and opt.get('hook'):
            opt['hook'](t, nb)
        t += nb * B
    return int(round(t / B))


# ================================================================================================ SUBURBS
def suburbs():
    h = HOODS['suburbs']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=21)
    tpt = s.track('trumpet', 0, GM['trumpet'], volume=96, pan=60, reverb=40)
    gtr = s.track('steel guitar', 1, GM['steel'], volume=88, pan=84, reverb=30)
    glk = s.track('glockenspiel', 2, GM['glock'], volume=78, pan=40, reverb=50)
    bass = s.track('bass', 3, GM['ac_bass'], volume=100, reverb=15)
    drm = s.track('kit', 9, 0, volume=92, reverb=25)

    def comp(u, beats, d, size, sec):
        ch = cn(R, d, 3, md, -1)
        # bright down-up strum: 1, 2&, 3, 4& feel (country-pop)
        for off, v in ((0, 70), (1.5, 56), (2, 66), (3.5, 56)):
            if off < beats:
                for i, q in enumerate(ch + [ch[0] + 12]):
                    gtr.n(u + off + i * 0.02, 0.45, q, v)
        if sec in ('intro', 'bed', 'march'):
            for k in range(int(beats * 2)):  # glock arpeggio eighths
                glk.n(u + 0.5 * k, 0.4, ch[k % 3] + 24, 54)

    def bassf(u, beats, d, size, sec):
        r = bass_root(R, d, md, -2)
        bass.n(u, 0.9, r, 92)
        if beats >= 2:
            bass.n(u + 1, 0.9, r + 7, 76)
        if beats >= 4:
            bass.n(u + 2, 0.9, r, 86)
            bass.n(u + 3, 0.9, r + (4 if d in (1, 4, 5) else 3), 74)

    def drums(t, k, nb, sec):
        last = k == nb - 1
        if sec == 'march':  # youth-sports marching-band snare cadence
            for i in range(8):
                drm.n(t + 0.5 * i, 0.2, SNARE, 70 + (20 if i % 4 == 0 else 0))
            drm.n(t, 0.5, KICK, 100)
            drm.n(t + 2, 0.5, KICK, 92)
            if last:
                for i in range(8):
                    drm.n(t + 2 + 0.25 * i, 0.15, SNARE, 60 + 6 * i)
            return
        drm.n(t, 0.5, KICK, 100)
        drm.n(t + 2, 0.5, KICK, 92)
        drm.n(t + 2.5, 0.5, KICK, 70)
        drm.n(t + 1, 0.5, SNARE, 88)
        drm.n(t + 3, 0.5, SNARE, 92)
        for i in range(8):
            drm.n(t + 0.5 * i, 0.2, CHH, 64 if i % 2 == 0 else 44)
        if sec in ('A', 'chant'):
            drm.n(t + 1, 0.2, CLAP, 84)
            drm.n(t + 3, 0.2, CLAP, 84)
        if k == 0 and sec != 'intro':
            drm.n(t, 1, CRASH, 80)

    def go_mudhens(t, nb):  # "Go, Mud-hens!" three claps answering the trumpet in the last bar's rest
        last = t + (nb - 1) * B
        for i, off in enumerate((3.0, 3.33, 3.67)):
            drm.n(last + off, 0.2, CLAP, 110 - 4 * i)

    def chant(t, nb):
        for k in range(nb):
            for off in (0, 0.75, 1.5):
                drm.n(t + k * B + 2 + off * 0.67, 0.2, CLAP, 96)

    H = M.A_HARM
    plan = [
        ('intro', H, None, None, {}),
        ('A', H, M.A_BARS, 'tpt', dict(pickup=True, hook=go_mudhens)),
        ('chant', [H[0], H[1], H[6], H[7]], None, None, dict(hook=chant)),
        ('B', M.B_HARM, M.B_BARS, 'glk', dict(shift=12, vel=86, double=('gtr', 0, 70))),
        ('march', [H[2], H[3], H[2], H[3], H[2], H[3], H[6], [(5, 4, 4)]], [M.ANSWER_1, M.ANSWER_2] * 3 + [M.CADENCE_1, [(5, 3), (None, 1)]], 'glk', dict(shift=12, vel=76)),
        ('A', [H[0], H[1], H[6], H[7]], M.A2_BARS, 'tpt', dict(pickup=True, hook=go_mudhens)),
        ('bed', H[:6] + [[(2, 4, 4)], [(5, 4, 4)]], None, None, {}),
    ]
    bars = play_sections(s, h, plan, comp, bassf, drums, dict(tpt=tpt, glk=glk, gtr=gtr))
    s.humanize(0.01, 5)
    return finish(s, 'suburbs', bars, B, h['ts'], 'loop', dict(hood='suburbs'))


# ================================================================================================ WATERFRONT
def waterfront():
    h = HOODS['waterfront']
    R, md, B = h['root'], h['mode'], h['bar']
    remap = {3: ['C4', 'E4', 'G4']}  # iii in Mixolydian is diminished: use bVII (C) instead
    s = Song(h['bpm'], B, seed=31)
    fid = s.track('fiddle', 0, GM['fiddle'], volume=94, pan=50, reverb=55)
    acc = s.track('accordion', 1, GM['accordion'], volume=74, pan=76, reverb=45)
    mar = s.track('marimba', 2, GM['marimba'], volume=86, pan=36, reverb=40)
    bass = s.track('bass', 3, GM['ac_bass'], volume=100, reverb=20)
    sd = s.track('steel drums', 4, GM['steel_drums'], volume=78, pan=90, reverb=50)
    drm = s.track('perc', 9, 0, volume=80, reverb=35)

    def comp(u, beats, d, size, sec):
        ch = cn(R, d, 3, md, -1, remap)
        acc.n(u, beats * 0.98, ch, 50 if sec in ('intro', 'bed') else 58)  # squeezebox pad
        if sec != 'B':
            pat = [0, 1, 2, 1]
            for k in range(int(beats * 2)):
                mar.n(u + 0.5 * k, 0.45, ch[pat[k % 4]] + 12, 58 if k % 2 == 0 else 46)

    def bassf(u, beats, d, size, sec):
        r = bass_root(R, d, md, -2, remap)
        for half in range(int(beats // 2)):  # habanera: dotted-eighth, sixteenth, eighth, eighth
            b = u + 2 * half
            for off, dur, iv, v in ((0, .7, 0, 96), (.75, .2, 7, 70), (1, .45, 12, 82), (1.5, .45, 7, 76)):
                bass.n(b + off, dur, r + iv, v)

    def drums(t, k, nb, sec):
        drm.n(t, 0.4, KICK, 84)
        drm.n(t + 2, 0.4, KICK, 70)
        for i in range(8):
            drm.n(t + 0.5 * i, 0.2, SHAKER, 54 if i % 2 else 66)
        drm.n(t + 1.75, 0.2, CONGA_HI, 60)
        drm.n(t + 3, 0.3, CONGA_LO, 66)
        if k == nb - 1 and sec != 'intro':  # steel-drum fill at phrase ends
            ch = cn(R, 5, 3, md, 0)
            for i, q in enumerate([ch[0], ch[1], ch[2], ch[2] + 3, ch[2] + 5]):
                sd.n(t + 2 + 0.25 * i, 0.3, q, 74)

    def foghorn(t, nb):  # D–A drone under the shanty: low strings in the bed
        pass

    H = M.A_HARM
    BH = [[(6, 3, 4)], [(7, 3, 4)], [(4, 3, 4)], [(1, 3, 2), (7, 3, 2)], [(6, 3, 4)], [(2, 3, 4)], [(4, 3, 2), (7, 3, 2)], [(5, 3, 4)]]
    plan = [
        ('intro', H, None, None, {}),
        ('A', H, M.A_BARS, 'fid', dict(pickup=True)),
        ('B', BH, M.B_BARS, 'mar', dict(shift=12, vel=92, legato=0.6, double=('sd', 0, 60))),
        ('A', [H[0], H[1], H[6], H[7]], M.A2_BARS, 'fid', dict(pickup=True, double=('acc', 0, 70))),
        ('bed', H, None, None, {}),
        ('bed', [H[2], H[3], [(7, 3, 4)], [(5, 3, 4)]], None, None, {}),
    ]
    bars = play_sections(s, h, plan, comp, bassf, drums, dict(fid=fid, mar=mar, sd=sd, acc=acc), remap)
    s.humanize(0.012, 6)
    return finish(s, 'waterfront', bars, B, h['ts'], 'loop', dict(hood='waterfront'))


# ================================================================================================ UNIVERSITY
def university():
    h = HOODS['university']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=41)
    sq = s.track('square lead', 0, GM['square'], volume=70, pan=56, reverb=35)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=96, pan=70, reverb=50, chorus=40)
    vib = s.track('vibraphone', 2, GM['vibes'], volume=80, pan=40, reverb=55)
    bass = s.track('synth bass', 3, GM['syn_bass'], volume=92, reverb=10)
    drm = s.track('soft kit', 9, 0, volume=84, reverb=20)

    def comp(u, beats, d, size, sec):
        ch = cn(R, d, 4, md, -1)  # maj7 / min7 voicings
        ch = [ch[0], ch[1], ch[3], ch[2] + 12]  # spread: root, 3rd, 7th, 5th up
        if d in (1, 4):
            ch.append(deg(R, d + 8, md) - 12)  # add the 9th
        for i, q in enumerate(ch):
            rh.n(u + 0.03 * i, beats * 0.48, q, 58)
        if beats >= 4:
            for i, q in enumerate(ch[1:]):
                rh.n(u + 2.5 + 0.03 * i, 1.2, q, 48)

    def bassf(u, beats, d, size, sec):
        r = bass_root(R, d, md, -2)
        bass.n(u, 1.4, r, 96)
        bass.n(u + 1.5, 0.4, r, 70)
        if beats >= 4:
            bass.n(u + 2.5, 0.9, r + 7, 80)
            bass.n(u + 3.5, 0.4, r + 12, 64)

    def drums(t, k, nb, sec):
        drm.n(t, 0.4, KICK, 92)
        drm.n(t + 1.5, 0.3, KICK, 60)
        drm.n(t + 2.5, 0.4, KICK, 84)
        drm.n(t + 1, 0.3, RIM if sec == 'intro' else SNARE, 66)
        drm.n(t + 3, 0.3, SNARE, 70)
        for i in range(8):
            drm.n(t + 0.5 * i, 0.15, CHH, 50 if i % 2 else 60)

    def chip(t, nb, bars):  # chiptune: 16th arpeggios that keep the melody note on top of every other step (AU33)
        for (u, d, pi) in M.bar_melody(R, bars, md, t, B, 0):
            k = 0
            while k * 0.25 < d * 0.95:
                iv, v = ((0, 82), (12, 48), (0, 72), (7, 48))[k % 4]
                sq.n(u + 0.25 * k, 0.22, pi + iv, v)
                k += 1

    H = M.A_HARM
    half_speed = [[(1, 2), (3, 1), (5, 1)], [(6, 3), (5, 1)], [(4, 1), (3, 1), (2, 1), (3, 1)], [(1, 4)]]
    plan = [
        ('intro', H[:4], None, None, {}),
        ('A', H, None, None, dict(hook=lambda t, nb: chip(t, nb, M.A_BARS))),
        ('B', M.B_HARM, M.B_BARS, 'vib', dict(vel=84, legato=0.85)),
        ('bed', [H[0], H[1], H[0], [(5, 4, 4)], H[2], H[3], H[6], H[7]], None, None,
         dict(hook=lambda t, nb: melody(rh, R, half_speed, md, t + 0, B, vel=74, shift=0))),
        ('A', [H[0], H[1], H[6], [(5, 4, 4)]], None, None, dict(hook=lambda t, nb: chip(t, nb, M.A2_BARS[:3] + [[(1, 2), (None, 2)]]))),
    ]
    bars = play_sections(s, h, plan, comp, bassf, drums, dict(vib=vib, sq=sq, rh=rh))
    swing(s, h['swing'], [tr for tr in s.tracks if tr is not sq])
    swing_smooth([sq], h['swing'])  # the chip 16ths swing with the hats (AU48)
    s.humanize(0.018, 8)
    return finish(s, 'university', bars, B, h['ts'], 'loop', dict(hood='university', lofi=True))


# ================================================================================================ INDUSTRIAL
def industrial():
    h = HOODS['industrial']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=51)
    sax = s.track('tenor sax', 0, GM['tenor_sax'], volume=96, pan=56, reverb=40)
    org = s.track('drawbar organ', 1, GM['organ'], volume=70, pan=74, reverb=30)
    gtr = s.track('clean guitar', 2, GM['clean_gtr'], volume=82, pan=36, reverb=30)
    bass = s.track('finger bass', 3, GM['fing_bass'], volume=100, reverb=10)
    acc = s.track('ghost accordion', 4, GM['accordion'], volume=56, pan=64, reverb=60)
    drm = s.track('kit', 9, 0, volume=90, reverb=20)

    # 12-bar blues in A with true dominant sevenths
    D7 = {'I': ['A2', 'C#3', 'E3', 'G3'], 'IV': ['D3', 'F#3', 'A3', 'C4'], 'V': ['E3', 'G#3', 'B3', 'D4']}
    FORM = ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V']

    def bar_chord(c):
        return [p(x) for x in D7[c]]

    def boogie(t, c, vel=92):  # walking shuffle bass: 1 3 5 6 b7 6 5 3
        r = bar_chord(c)[0] - 12 if c != 'I' else p('A1')
        for i, iv in enumerate([0, 4, 7, 9, 10, 9, 7, 4]):
            bass.n(t + 0.5 * i, 0.42, r + iv, vel - (10 if i % 2 else 0))

    def stabs(t, c, vel=60):  # organ shuffle stabs on the "and" of 2 and 4, guitar chop on 2 and 4
        ch = bar_chord(c)
        for off in (1.5, 3.5):
            org.n(t + off, 0.35, [q + 12 for q in ch[1:]], vel)
        for off in (1, 3):
            gtr.n(t + off, 0.2, [q + 12 for q in ch[1:]], 58)

    def kit(t, chorus, k):
        drm.n(t, 0.3, KICK, 96)
        drm.n(t + 2, 0.3, KICK, 88)
        drm.n(t + 1, 0.3, SNARE, 84)
        drm.n(t + 3, 0.3, SNARE, 88)
        for i in range(8):
            drm.n(t + 0.5 * i, 0.15, RIDE if chorus else CHH, 62 if i % 2 == 0 else 46)
        drm.n(t + 1, 0.2, COWBELL, 40)  # the anvil: muted cowbell on 2 and 4
        drm.n(t + 3, 0.2, COWBELL, 46)
        if k == 11:
            for i, tom in enumerate((TOM_HI, TOM_MID, TOM_LO, TOM_LO)):
                drm.n(t + 2 + 0.5 * i, 0.3, tom, 80)

    def blues_motif(t, bars, vel=98, track=None):
        # the city motif with a blue flat-3 grace before each 3rd
        tr = track or sax
        for (u, d, pi) in M.bar_melody(R, bars, md, t, B, 12):
            # swing here, so the grace lands just before the swung note (AU34); swing() leaves both alone after
            if abs((u - int(u)) - 0.5) < 0.02:
                u = int(u) + h['swing']
                d = max(0.1, d - (h['swing'] - 0.5))
            if (pi - p(R)) % 12 == 4 and d >= 0.5:
                tr.n(u - 0.08, 0.08, pi - 1, vel - 18)
            tr.n(u, d * 0.9, pi, vel)

    t = 0.0
    s.bar_roots = [{'I': 1, 'IV': 4, 'V': 5}[c] for c in FORM] * 3
    for chorus in range(3):
        for k, c in enumerate(FORM):
            boogie(t + k * B, c)
            stabs(t + k * B, c, 52 if chorus == 0 else 62)
            kit(t + k * B, chorus, k)
        if chorus == 0:  # chorus 1: guitar riff call-and-response, no lead
            for k in (0, 4, 8):
                r = bar_chord(FORM[k])[0] + 12
                for i, iv in enumerate((0, 3, 4, 7, 9, 7)):
                    gtr.n(t + k * B + 0.5 * i, 0.4, r + iv, 70)
        elif chorus == 1:  # chorus 2: the sax states the motif
            pickup(sax, R, md, t, 84, 12)
            blues_motif(t, [M.MOTIF, M.CLOSE])
            blues_motif(t + 4 * B, [[(4, 1), (6, .5), (8, .5), (9, 1.5), (8, .5)], [(6, .5), (4, .5), (3, .5), (4, .5), (1, 2)]], 92)
            blues_motif(t + 8 * B, [M.ANSWER_1, M.ANSWER_2], 94)
        else:  # chorus 3: organ answers, then the sax closes with the ghost accordion doubling the last 4 bars
            for k in range(0, 8, 2):
                ch = bar_chord(FORM[k])
                org.n(t + k * B, 3.5, [q + 12 for q in ch], 66)
            pickup(sax, R, md, t + 8 * B, 84, 12)
            blues_motif(t + 8 * B, [M.MOTIF, M.CLOSE, M.CADENCE_1, [(1, 2), (None, 2)]], 96)
            blues_motif(t + 8 * B, [M.MOTIF, M.CLOSE, M.CADENCE_1, [(1, 2), (None, 2)]], 64, acc)
        t += 12 * B
    swing(s, h['swing'])
    s.humanize(0.012, 6)
    return finish(s, 'industrial', 36, B, h['ts'], 'loop', dict(hood='industrial'))


# ================================================================================================ UPTOWN
def uptown():
    h = HOODS['uptown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=61)
    cla = s.track('clarinet', 0, GM['clarinet'], volume=94, pan=56, reverb=50)
    pno = s.track('piano', 1, GM['piano'], volume=84, pan=72, reverb=40)
    gtr = s.track('jazz guitar (pompe)', 2, GM['jazz_gtr'], volume=72, pan=40, reverb=30)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=100, reverb=20)
    acc = s.track('musette accordion', 4, GM['accordion'], volume=70, pan=84, reverb=55)
    drm = s.track('brushes', 9, 0, volume=70, reverb=30)

    def comp(u, beats, d, size, sec):
        ch = cn(R, d, 4, md, -1)
        for i in range(int(beats)):  # manouche "pompe": short chord on every beat, stronger on 2 and 4
            gtr.n(u + i, 0.22, ch, 60 if (i % 2) else 48)
        if sec in ('bed', 'tag'):  # piano takes the bed with rolled tenths
            pno.n(u, 0.9, ch[0] - 12, 70)
            for i, q in enumerate(ch[1:]):
                pno.n(u + 1 + 0.05 * i, 0.8, q + 12, 58)
        else:
            pno.n(u + 1.5, 0.5, ch[1:], 50)
        if sec == 'B':
            acc.n(u, beats * 0.95, [q + 12 for q in ch[1:]], 58)

    nxt = {}

    def bassf(u, beats, d, size, sec):  # walking quarters with a chromatic approach to the next bar
        r = bass_root(R, d, md, -2)
        ch = M.chord_notes(R, d, 4, md, -2)
        # beat 4 walks a semitone into the next chord's root (AU34; was a natural 7th against the flat-7 pompe)
        nr = nxt.get(round(u, 3), r)
        app = nr - 1 if nr - 1 > r else nr + 1
        line = [r, ch[1], ch[2], app][:int(beats)] if beats >= 4 else [r, app][:int(beats)]
        for i, q in enumerate(line):
            bass.n(u + i, 0.85, q, 88 if i == 0 else 74)

    def drums(t, k, nb, sec):
        for i in range(4):
            drm.n(t + i, 0.3, RIDE, 46 + (8 if i % 2 else 0))
            drm.n(t + i + 0.6, 0.2, RIDE, 34)
        drm.n(t + 1, 0.3, PEDAL, 52)
        drm.n(t + 3, 0.3, PEDAL, 52)
        drm.n(t + 1, 0.3, SNARE, 30)  # soft brush swish
        drm.n(t + 3, 0.3, SNARE, 34)

    def clarinet(t, bars, vel=94):  # chromatic approach notes into long notes
        for (u, d, pi) in M.bar_melody(R, bars, md, t, B, 0):
            if d >= 1.5:
                cla.n(u - 0.12, 0.12, pi - 1, vel - 20)
            cla.n(u, d * 0.9, pi, vel)

    H = M.A_HARM
    plan = [
        ('intro', [H[0], H[1], H[6], H[7]], None, None, {}),
        ('A', H, None, None, dict(hook=lambda t, nb: (pickup(cla, R, md, t, 80), clarinet(t, M.A_BARS)))),
        ('B', M.B_HARM, M.B_BARS, 'cla', dict(shift=-12, vel=80)),
        ('bed', H, None, None, {}),
        ('A', [H[0], H[1], H[6], H[7]], None, None, dict(hook=lambda t, nb: (pickup(cla, R, md, t, 80), clarinet(t, M.A2_BARS)))),
        ('tag', M.B_HARM, None, None, {}),
    ]
    tt = 0.0
    seq = []
    for (_, harm, *_r) in plan:
        for (u, _b, d, _z) in segs(harm, tt, B):
            seq.append((u, d))
        tt += len(harm) * B
    for i, (u, d) in enumerate(seq):
        nxt[round(u, 3)] = bass_root(R, seq[(i + 1) % len(seq)][1], md, -2)
    bars = play_sections(s, h, plan, comp, bassf, drums, dict(cla=cla))
    swing(s, h['swing'])
    s.humanize(0.012, 6)
    return finish(s, 'uptown', bars, B, h['ts'], 'loop', dict(hood='uptown'))


# ================================================================================================ STINGERS (AU14)
STING_KINDS = ['bottleneck', 'milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'welcome', 'warmth',
               'build', 'perk', 'offline']
T0 = 1.0  # beat 1 of every stinger: a whole beat in, so swing() treats its eighths like the loop's (AU31b)


def phrases(h):
    """The neighbourhood's own meter (AU31a): opening bar, opening+closing, cadence, and their harmony."""
    if h['bar'] == 3:
        return dict(B=3, open=[M.M68[0]], motif=[M.M68[0], M.M68[1], [(1, 3)]], cad=M.CLOSE68[:2] + [[(1, 3)]],
                    harm_motif=[[(1, 3, 3)], [(5, 4, 3)], [(1, 3, 3)]], harm_cad=[[(2, 3, 3)], [(5, 4, 3)], [(1, 3, 3)]])
    if h['bpm'] < 100:  # slow neighbourhoods: two bars, so a stinger doesn't hold the loop down for ~10 s (AU53)
        return dict(B=4, open=[M.MOTIF], motif=[M.MOTIF, M.CLOSE], cad=[M.CADENCE_1, M.CLOSE],
                    harm_motif=[[(1, 3, 4)], [(5, 4, 2), (1, 3, 2)]], harm_cad=[[(2, 4, 2), (5, 4, 2)], [(1, 3, 4)]])
    return dict(B=4, open=[M.MOTIF], motif=[M.MOTIF, M.CLOSE[:4] + [(1, 2)], [(1, 4)]],
                cad=[M.CADENCE_1, M.CLOSE[:4] + [(1, 2)], [(1, 4)]],
                harm_motif=[[(1, 3, 4)], [(5, 4, 2), (1, 3, 2)], [(1, 3, 4)]],
                harm_cad=[[(2, 4, 2), (5, 4, 2)], [(5, 4, 2), (1, 3, 2)], [(1, 3, 4)]])


def chord_bed(tr, R, md, harm, t0, B, vel, octs=-1, bars=None):
    for k, (u, beats, d, size) in enumerate(segs(harm[:bars] if bars else harm, t0, B)):
        tr.n(u, beats * 0.95, M.chord_notes(R, d, 3, md, octs), vel)


def stingers(hood: str):
    h = HOODS[hood]
    R, md, bpm = h['root'], h['mode'], h['bpm']
    ph = phrases(h)
    B = ph['B']
    for kind in STING_KINDS:
        s = Song(bpm, B, seed=sum(map(ord, kind)))
        ld = s.track('lead', 0, h['lead'], volume=104, reverb=45)
        drm = s.track('perc', 9, 0, volume=90, reverb=40)
        t0 = T0
        if kind == 'bottleneck':  # 1 bar: just the opening phrase and a splash (the frequent one: kept small)
            pickup(ld, R, md, t0, 80)
            melody(ld, R, ph['open'], md, t0, B, vel=92, legato=0.8)
            drm.n(t0, 0.5, SPLASH, 54)
            end = t0 + B + 1
        elif kind in ('milestone', 'milestone_big'):  # opening + closing as a cadence, with brass
            br = s.track('brass', 1, GM['brass'], volume=96, reverb=45)
            pickup(ld, R, md, t0, 86)
            melody(ld, R, ph['motif'], md, t0, B, vel=104)
            melody(br, R, ph['motif'], md, t0, B, vel=84, shift=-12)
            chord_bed(br, R, md, ph['harm_motif'], t0, B, 74)
            drm.n(t0, 1, CRASH, 84)
            nb = len(ph['motif'])
            if kind == 'milestone_big':
                tim = s.track('timpani', 2, GM['timpani'], volume=110, reverb=50)
                r = deg(R, 1, md) - 24
                roll_from = t0 + (nb - 2) * B + (B / 2 if nb == 2 else 0)
                n_ = int((t0 + (nb - 1) * B - roll_from) * 8)
                for i in range(n_):
                    tim.n(roll_from + 0.125 * i, 0.12, r - 5, 60 + 56 * i / max(1, n_))
                tim.n(t0 + (nb - 1) * B, 1.8, r, 120)
                drm.n(t0 + (nb - 1) * B, 2, CRASH, 110)
            end = t0 + nb * B
        elif kind == 'manager':  # warm, resolving: cadence then closing phrase over strings
            st = s.track('strings', 1, GM['strings'], volume=86, reverb=60)
            melody(ld, R, ph['cad'], md, t0, B, vel=88)
            chord_bed(st, R, md, ph['harm_cad'], t0, B, 66)
            nb = len(ph['cad'])
            st.n(t0 + (nb - 1) * B, B, deg(R, 1, md) - 24, 70)
            drm.n(t0 + (nb - 1) * B, 2, TRIANGLE_OPEN, 50)
            end = t0 + nb * B
        elif kind in ('upgrade', 'fleet', 'drone'):  # opening phrase, brass an octave up; fleet horn; drone square
            prog = GM['square'] if kind == 'drone' else GM['brass']
            br = s.track('brass', 1, prog, volume=100, reverb=45)
            pickup(br, R, md, t0, 86, 0 if kind == 'drone' else 12)
            melody(br, R, ph['open'], md, t0, B, vel=96, shift=0 if kind == 'drone' else 12, legato=0.8)
            br.n(t0 + B, B * 0.6, deg(R, 5, md) + (0 if kind == 'drone' else 12), 92)
            if kind == 'fleet':
                hn = s.track('horn', 2, GM['horn'], volume=100, reverb=45)
                hn.n(t0 + B, 0.25, deg(R, 5, md) - 12, 100)  # beep
                hn.n(t0 + B + 0.5, 0.8, deg(R, 5, md) - 12, 104)  # beeeep
            if kind == 'drone':
                arp = s.track('arp', 3, GM['square'], volume=96, reverb=45)
                for i in range(8):
                    arp.n(t0 + B + 0.125 * i, 0.1, deg(R, 1 + (i % 4) * 2, md) + 12, 70)
            drm.n(t0, 0.5, SPLASH, 70)
            end = t0 + 2 * B
        elif kind == 'build':  # a new pizzeria opens: its neighbourhood's lead states the motif, with claps (AU36)
            pickup(ld, R, md, t0, 90)
            melody(ld, R, ph['motif'], md, t0, B, vel=106)
            hp = s.track('glock', 1, GM['glock'], volume=84, reverb=55)
            melody(hp, R, ph['open'], md, t0, B, vel=70, shift=12)
            nb = len(ph['motif'])
            for k in range(int((nb - 1) * B)):
                drm.n(t0 + k, 0.2, CLAP, 90 if k % 2 == 0 else 74)
            drm.n(t0 + (nb - 1) * B, 2, CRASH, 96)
            end = t0 + nb * B
        elif kind == 'welcome':  # character sting (story beat 1)
            pickup(ld, R, md, t0, 80)
            melody(ld, R, ph['open'] + [[(5, B - 1), (None, 1)]], md, t0, B, vel=96)
            hp = s.track('harp', 1, GM['harp'], volume=80, reverb=60)
            for i, q in enumerate(M.chord_notes(R, 1, 3, md, -1) + M.chord_notes(R, 1, 3, md, 0)):
                hp.n(t0 + 0.08 * i, 2, q, 66)
            end = t0 + 2 * B + 1
        elif kind == 'warmth':  # beat 2: the closing phrase, softer
            melody(ld, R, ph['cad'], md, t0, B, vel=76)
            pd = s.track('pad', 1, GM['slow_strings'], volume=74, reverb=70)
            chord_bed(pd, R, md, ph['harm_cad'], t0, B, 56)
            end = t0 + len(ph['cad']) * B
        elif kind == 'perk':  # perk card (AU13): the opening phrase on glockenspiel and harp, in this key (AU26)
            s.tracks.remove(ld)
            gl = s.track('glock', 0, GM['glock'], volume=100, reverb=60)
            hp = s.track('harp', 1, GM['harp'], volume=90, reverb=60)
            pickup(gl, R, md, t0, 80, 12)
            for tr, v in ((gl, 96), (hp, 80)):
                melody(tr, R, ph['open'], md, t0, B, vel=v, legato=1.2, shift=12)
            end = t0 + B + 1
        else:  # offline popup opens (AU15/AU30): the closing phrase on celesta, in this key
            s.tracks.remove(ld)
            ce = s.track('celesta', 0, GM['celesta'], volume=96, reverb=60)
            melody(ce, R, ph['cad'][1:2], md, t0, B, vel=70, legato=1.1, shift=12)
            end = t0 + B + 1
        swing(s, h['swing'], [tr for tr in s.tracks if tr.name not in ('perc', 'timpani', 'arp')])  # rolls stay even (AU48)
        name = f'sting_{hood}_{kind}'
        s.save(os.path.join(OUT, f'{name}.mid'), end, h['ts'])
        # musicSeconds: where the music ends (the duck and the gate hold this long, not the reverb tail: AU53)
        MANIFEST[name] = dict(kind='stinger', hood=hood, cue=kind, bpm=bpm, downbeatSeconds=round(t0 * 60 / bpm, 4),
                              seconds=round(end * 60 / bpm, 3), musicSeconds=round(end * 60 / bpm, 3))


def bid_sting():
    """AU27: Pier 9 bid. Held V7 tension over a timpani roll, no resolution: waterfront-4 resolves it."""
    h = HOODS['waterfront']
    R, md = h['root'], MAJOR  # a true dominant 7th, not Mixolydian's minor v
    s = Song(h['bpm'], 4, seed=5)
    br = s.track('brass', 0, GM['brass'], volume=100, reverb=55)
    st = s.track('strings', 1, GM['strings'], volume=96, reverb=65)
    tim = s.track('timpani', 2, GM['timpani'], volume=110, reverb=50)
    v7 = M.chord_notes(R, 5, 4, md, -1)
    st.n(0.6, 3.4, v7, 84)
    br.n(0.6, 3.0, v7[:3], 90)
    for i in range(28):
        tim.n(0.6 + 0.125 * i, 0.12, deg(R, 5, md) - 24, 54 + 2 * i)
    s.save(os.path.join(OUT, 'sting_waterfront_bid.mid'), 4.2)
    # musicSeconds: Dock Saved's villain sting comes in as the A7 hangs, not after the whole ring-out (AU57)
    MANIFEST['sting_waterfront_bid'] = dict(kind='stinger', hood='waterfront', cue='bid', bpm=h['bpm'], downbeatSeconds=0.0,
                                            seconds=round(4.2 * 60 / h['bpm'], 3), musicSeconds=2.6)


def groove(hood: str, s: Song, harm, t0: float, B: float, bars: int):
    """Each neighbourhood's own rhythm section under the triumph's brass (AU35)."""
    h = HOODS[hood]
    R, md = h['root'], h['mode']
    bass = s.track('groove bass', 6, GM['fing_bass'] if hood == 'industrial' else GM['syn_bass'] if hood == 'university' else GM['ac_bass'], volume=100, reverb=20)
    drm = s.track('groove kit', 9, 0, volume=96, reverb=40)
    seg = list(segs(harm, t0, B))
    for (u, beats, d, size) in seg:
        r = deg(R, d, md) - 24
        if hood == 'downtown':
            for k in range(int(beats // 1.5)):
                bass.n(u + 1.5 * k, 1.3, r + (7 if k % 2 else 0), 96)
        elif hood == 'waterfront':
            for half in range(int(beats // 2)):
                for off, dur, iv, v in ((0, .7, 0, 96), (.75, .2, 7, 70), (1, .45, 12, 82), (1.5, .45, 7, 76)):
                    bass.n(u + 2 * half + off, dur, r + iv, v)
        elif hood == 'industrial':
            for i, iv in enumerate([0, 4, 7, 9, 10, 9, 7, 4][:int(beats * 2)]):
                bass.n(u + 0.5 * i, 0.42, r + iv, 92 - (10 if i % 2 else 0))
        elif hood == 'uptown':
            ch = M.chord_notes(R, d, 4, md, -2)
            for i, q in enumerate([r, ch[1], ch[2], r + 7][:int(beats)]):
                bass.n(u + i, 0.85, q, 88)
        else:
            for i in range(int(beats)):
                bass.n(u + i, 0.8, r + (7 if i % 2 else 0), 92 if i % 2 == 0 else 78)
    for b in range(bars):
        t = t0 + b * B
        if hood == 'downtown':
            for k in range(6):
                drm.n(t + 0.5 * k, 0.2, TAMB, 92 if k % 3 == 0 else 58)
        elif hood == 'suburbs':
            for i in range(8):
                drm.n(t + 0.5 * i, 0.2, SNARE, 70 + (24 if i % 4 == 0 else 0))
            drm.n(t, 0.5, KICK, 104)
            drm.n(t + 2, 0.5, KICK, 96)
        elif hood == 'waterfront':
            for i in range(8):
                drm.n(t + 0.5 * i, 0.2, SHAKER, 70)
            drm.n(t + 1.75, 0.2, CONGA_HI, 80)
            drm.n(t + 3, 0.3, CONGA_LO, 86)
        elif hood == 'university':
            for off, k, v in ((0, KICK, 100), (1, SNARE, 84), (2.5, KICK, 92), (3, SNARE, 88)):
                drm.n(t + off, 0.3, k, v)
            for i in range(8):
                drm.n(t + 0.5 * i, 0.15, CHH, 62)
            rh = s.track('rhodes', 7, GM['rhodes'], volume=84, reverb=50) if b == 0 else [tr for tr in s.tracks if tr.name == 'rhodes'][0]
            for (u, beats, d, size) in seg:
                if t <= u < t + B:
                    rh.n(u, beats * 0.9, M.chord_notes(R, d, 4, md, -1), 66)
        elif hood == 'industrial':
            for off, k, v in ((0, KICK, 100), (1, SNARE, 90), (2, KICK, 96), (3, SNARE, 94)):
                drm.n(t + off, 0.3, k, v)
            for i in range(8):
                drm.n(t + 0.5 * i, 0.15, RIDE, 70)
            org = s.track('organ', 7, GM['organ'], volume=72, reverb=30) if b == 0 else [tr for tr in s.tracks if tr.name == 'organ'][0]
            for (u, beats, d, size) in seg:
                if t <= u < t + B:
                    org.n(u + 1.5, 0.35, M.chord_notes(R, d, 4, md, 0)[1:], 66)
        else:  # uptown: pompe guitar and ride
            gt = s.track('pompe', 7, GM['jazz_gtr'], volume=76, reverb=30) if b == 0 else [tr for tr in s.tracks if tr.name == 'pompe'][0]
            for (u, beats, d, size) in seg:
                if t <= u < t + B:
                    for i in range(int(beats)):
                        gt.n(u + i, 0.22, M.chord_notes(R, d, 4, md, -1), 66 if i % 2 else 54)
            for i in range(4):
                drm.n(t + i, 0.3, RIDE, 60)


def triumph(hood: str):
    """Beat-4 win (AU4/AU12/AU26): snare pickup, motif + closing phrase, the crash by ~6 s, in the
    neighbourhood's key, tempo and meter, over its own rhythm section (AU35)."""
    h = HOODS[hood]
    R, md = h['root'], h['mode']
    ph = phrases(h)
    B = ph['B']
    bpm = h['bpm']
    s = Song(bpm, B, seed=71)
    ld = s.track('lead', 0, h['lead'], volume=110, reverb=50)
    br = s.track('brass', 1, GM['brass'], volume=100, reverb=55)
    st = s.track('strings', 2, GM['strings'], volume=96, reverb=65)
    tim = s.track('timpani', 3, GM['timpani'], volume=110, reverb=50)
    lead_in = 2.0
    if hood == 'waterfront':  # the ship's bell (AU13) rings first
        bell = s.track('ship bell', 4, GM['bells'], volume=110, reverb=80)
        for i in range(3):
            bell.n(0.6 * i, 2, deg(R, 5, md), 110 - 10 * i)
        lead_in = 4.0
    t0 = lead_in
    drm0 = s.track('swell', 9, 0, volume=96, reverb=45)
    for i in range(8):  # snare-roll swell into the downbeat
        drm0.n(t0 - 2 + 0.25 * i, 0.2, SNARE, 50 + 8 * i)
    tim.n(t0 - 2, 2, deg(R, 5, md) - 24, 70)
    pickup(ld, R, md, t0, 96)
    mel = ph['motif'][:2]
    harm = ph['harm_motif'][:2]
    melody(ld, R, mel, md, t0, B, vel=112)
    melody(br, R, mel, md, t0, B, vel=96, shift=-12)
    for (u, beats, d, size) in segs(harm, t0, B):
        st.n(u, beats * 0.98, M.chord_notes(R, d, 3, md, 0), 84)
        tim.n(u, 0.6, deg(R, d, md) - 24, 100)
    groove(hood, s, harm, t0, B, 2)
    drm0.n(t0, 1, CRASH, 96)
    end_ = t0 + 2 * B  # the payoff: tutti tonic with a big crash
    drm0.n(end_, 3, CRASH, 124)
    tim.n(end_, 3, deg(R, 1, md) - 24, 124)
    br.n(end_, 3, M.chord_notes(R, 1, 3, md, -1) + [deg(R, 1, md) + 12], 108)
    ld.n(end_, 3, deg(R, 1, md) + 12, 108)
    st.n(end_, 3, M.chord_notes(R, 1, 3, md, 0), 96)
    swing(s, h['swing'], [tr for tr in s.tracks if tr.name not in ('swell', 'timpani')])  # rolls stay even (AU48)
    name = f'triumph_{hood}'
    s.save(os.path.join(OUT, f'{name}.mid'), end_ + 3, h['ts'])
    MANIFEST[name] = dict(kind='story', hood=hood, seconds=round((end_ + 3) * 60 / bpm, 3), bpm=bpm, beatsPerBar=B,
                          downbeatSeconds=round(t0 * 60 / bpm, 4), payoffSeconds=round(end_ * 60 / bpm, 3))


# ================================================================================================ STORY CUES
def megaslice():
    """AU18: comic villainy. C minor sneaky march, staccato tuba/bassoon, muted-trumpet stabs, pizzicato, timpani."""
    R, md = 'C4', MINOR
    bpm = 76
    s = Song(bpm, 4, seed=81)
    tuba = s.track('tuba', 0, GM['tuba'], volume=104, reverb=30)
    bsn = s.track('bassoon', 1, GM['bassoon'], volume=96, pan=44, reverb=35)
    mt = s.track('muted trumpet', 2, GM['mute_tpt'], volume=88, pan=84, reverb=40)
    pz = s.track('pizzicato', 3, GM['pizz'], volume=88, pan=30, reverb=40)
    tim = s.track('timpani', 4, GM['timpani'], volume=100, reverb=45)
    drm = s.track('perc', 9, 0, volume=70, reverb=30)
    # villain motif: 5, | 1 b3 b5 b6. 5 | b6 5 b5 4 1
    V1 = [(1, 1), (3, .5), ('b5', .5), (6, 1.5), (5, .5)]
    V2 = [(6, .5), (5, .5), ('b5', .5), (4, .5), (1, 2)]

    def vline(tr, t, bars, vel, shift=0, legato=0.45):
        u = t
        for bar in bars:
            for d, dur in bar:
                if d is not None:
                    pi = deg(R, 5, md) - 1 if d == 'b5' else deg(R, d, md)
                    tr.n(u, dur * legato, pi + shift, vel)
                u += dur

    # bar 0 is a tuba-only vamp, so the villain motif's pickup has room and every entry starts the same way (AU29)
    for bar in range(17):
        t = 4 * bar
        root = deg(R, 1 if (max(0, bar - 1) // 2) % 4 != 3 else 5, md) - 24
        for i in range(4):  # sneaky staccato march bass
            tuba.n(t + i, 0.3, root + (0 if i % 2 == 0 else 7), 92 if i % 2 == 0 else 74)
        if bar == 0:
            tim.n(t, 0.5, deg(R, 1, md) - 24, 80)
            continue
        for i in range(8):
            pz.n(t + 0.5 * i, 0.15, deg(R, (1, 3, 5, 3)[i % 4], md) - 12, 58)
        tim.n(t, 0.5, deg(R, 1, md) - 24, 70 if bar % 4 else 92)
        drm.n(t + 1, 0.2, SNARE, 44)
        drm.n(t + 3, 0.2, SNARE, 50)
        if bar % 2 == 1:
            mt.n(t + 3.5, 0.2, M.chord_notes(R, 5, 3, md, 0), 84)  # stab
    for sec in (1, 9):
        pickup(bsn, R, md, 4 * sec)
        vline(bsn, 4 * sec, [V1, V2], 96, 0)
        vline(mt, 4 * sec + 8, [V1, V2], 80, 0, 0.35)
        vline(bsn, 4 * sec + 16, [V1, [(6, .5), (5, .5), ('b5', .5), (4, .5), (2, 1), (0, 1)]], 92, -12)
    s.humanize(0.008, 4)
    s.save(os.path.join(OUT, 'megaslice_hq.mid'), 68)
    MANIFEST['megaslice_hq'] = dict(kind='loop', bpm=bpm, beatsPerBar=4, bars=17, seconds=round(68 * 60 / bpm, 4), restart=True)

    # Rep sting: the villain motif at double speed with a trombone glissando
    s = Song(152, 4, seed=82)
    bsn = s.track('bassoon', 0, GM['bassoon'], volume=104, reverb=35)
    tb = s.track('trombone', 1, GM['trombone'], volume=104, reverb=40)
    tuba = s.track('tuba', 2, GM['tuba'], volume=100, reverb=30)
    pickup(bsn, R, md, 0.5)
    vline(bsn, 0.5, [V1, V2], 100, 0, 0.6)
    vline(tuba, 0.5, [V1, V2], 90, -24, 0.4)
    tb.n(8.5, 2, deg(R, 5, md) - 12, 100)
    for k in range(17):
        tb.bends.append((8.6 + k * 0.1, int(-8192 * k / 16)))
    tb.bends.append((10.6, 0))
    s.save(os.path.join(OUT, 'megaslice_rep.mid'), 11)
    MANIFEST['megaslice_rep'] = dict(kind='story', seconds=round(11 * 60 / 152, 3))

    # Dock Saved (waterfront-4 p1, AU42): the same sting in D minor over an A pedal, so the bid's held A7 is still
    # hanging when the ship's bell triumph resolves it to D
    DR = 'D4'
    s = Song(152, 4, seed=84)
    bsn = s.track('bassoon', 0, GM['bassoon'], volume=104, reverb=35)
    tb = s.track('trombone', 1, GM['trombone'], volume=104, reverb=40)
    tuba = s.track('tuba', 2, GM['tuba'], volume=100, reverb=30)
    ped = s.track('pedal', 3, GM['strings'], volume=90, reverb=50)
    def dline(tr, t, bars, vel, shift=0, legato=0.6):
        u = t
        for bar in bars:
            for d, dur in bar:
                if d is not None:
                    pi = deg(DR, 5, md) - 1 if d == 'b5' else deg(DR, d, md)
                    tr.n(u, dur * legato, pi + shift, vel)
                u += dur
    pickup(bsn, DR, md, 0.5)
    dline(bsn, 0.5, [V1, V2], 100)
    dline(tuba, 0.5, [V1, V2], 88, -24, 0.4)
    ped.n(0.5, 10.5, [p('A2'), p('A3')], 70)
    tb.n(8.5, 2, deg(DR, 5, md) - 12, 100)
    for k in range(17):
        tb.bends.append((8.6 + k * 0.1, int(-8192 * k / 16)))
    tb.bends.append((10.6, 0))
    s.save(os.path.join(OUT, 'megaslice_rep_dock.mid'), 11)
    MANIFEST['megaslice_rep_dock'] = dict(kind='story', seconds=round(11 * 60 / 152, 3))

    # Victor's exit: the tuba deflates, trombone slides down
    s = Song(90, 4, seed=83)
    tuba = s.track('tuba', 0, GM['tuba'], volume=108, reverb=40)
    tb = s.track('trombone', 1, GM['trombone'], volume=100, reverb=50)
    for i, d in enumerate((5, 4, 3, 2)):
        tuba.n(0.5 * i, 0.45, deg(R, d, md) - 24, 96 - 8 * i)
    tuba.n(2, 2.2, deg(R, 1, md) - 24, 70)
    for k in range(20):
        tuba.bends.append((2.1 + k * 0.1, int(-8192 * k / 19)))
    tb.n(0, 2, deg(R, 5, md) - 12, 90)
    for k in range(20):
        tb.bends.append((0.2 + k * 0.1, int(-8192 * k / 19)))
    tuba.bends.append((4.4, 0))
    tb.bends.append((4.4, 0))
    s.save(os.path.join(OUT, 'victor_exit.mid'), 4.5)
    MANIFEST['victor_exit'] = dict(kind='story', seconds=round(4.5 * 60 / 90, 3))


def reunion():
    """AU13 industrial-4 p2: solo accordion in F at ♩=60, tenor sax answers, then both in unison. The quietest cue."""
    R, md = 'F4', MAJOR
    s = Song(60, 4, seed=91)
    acc = s.track('accordion', 0, GM['accordion'], volume=88, pan=50, reverb=70)
    sax = s.track('tenor sax', 1, GM['tenor_sax'], volume=84, pan=78, reverb=70)
    pad = s.track('strings', 2, GM['slow_strings'], volume=60, reverb=80)
    pickup(acc, R, md, 0.5, 60)
    melody(acc, R, [M.MOTIF], md, 0.5, 4, vel=66, legato=1.0)
    melody(sax, R, [M.CLOSE], md, 4.5, 4, vel=62, shift=-12, legato=1.0)
    melody(acc, R, [M.MOTIF, M.CLOSE], md, 8.5, 4, vel=70, legato=1.0)
    melody(sax, R, [M.MOTIF, M.CLOSE], md, 8.5, 4, vel=64, shift=-12, legato=1.0)
    pad.n(8.5, 4, M.chord_notes(R, 4, 3, md, -1), 40)
    pad.n(12.5, 3.5, M.chord_notes(R, 1, 3, md, -1), 44)
    s.save(os.path.join(OUT, 'reunion.mid'), 16.5)
    MANIFEST['reunion'] = dict(kind='story', seconds=16.5)


def recipe():
    """AU13 downtown-4 p3: solo accordion, rubato (AU34: the line breathes after each long note), music out."""
    R, md = 'F4', MAJOR
    s = Song(66, 4, seed=92)
    acc = s.track('accordion', 0, GM['accordion'], volume=90, reverb=65)
    t = 0.5
    pickup(acc, R, md, t, 58)
    lag = 0.0
    notes = M.bar_melody(R, [M.MOTIF, M.CLOSE], md, t, 4)
    for k, (u, d, pi) in enumerate(notes):
        # a slight push into the phrase, then a held breath after every long note
        hold = 0.35 if d >= 1.5 else 0.0
        accel = -0.03 if k < 3 else 0.0
        acc.n(u + lag, d * 0.98 + hold, pi, 60 + (6 if d >= 1.5 else 0))
        lag += hold + accel
    end_ = notes[-1][0] + lag + notes[-1][1]
    acc.n(end_ - 1.5, 3.0, M.chord_notes(R, 1, 3, md, -1), 44)
    s.save(os.path.join(OUT, 'recipe.mid'), end_ + 2)
    MANIFEST['recipe'] = dict(kind='story', seconds=round((end_ + 2) * 60 / 66, 3))


def city_theme():
    """AU26: the six leads enter one bar apart in build order (each adds the opening phrase over a rising tonic
    bed), then the whole band plays the A′ phrase with fiddle and clarinet a third above (AU34). ~24 s, once."""
    R, md = 'Eb4', MAJOR
    bpm = 104
    s = Song(bpm, 4, seed=95)
    order = ['accordion', 'trumpet', 'fiddle', 'square', 'tenor_sax', 'clarinet']
    leads = [s.track(n, i, GM[n], volume=96, pan=20 + 18 * i, reverb=55) for i, n in enumerate(order)]
    st = s.track('strings', 6, GM['strings'], volume=90, reverb=65)
    bs = s.track('bass', 7, GM['ac_bass'], volume=100, reverb=25)
    br = s.track('brass', 8, GM['brass'], volume=92, reverb=55)
    drm = s.track('kit', 9, 0, volume=88, reverb=40)
    tim = s.track('timpani', 10, GM['timpani'], volume=100, reverb=50)
    octave = {'tenor_sax': -12, 'trumpet': 0, 'square': 12}
    t = 1.0
    entry_harm = [(1, 3, 4)] * 4 + [(4, 3, 4), (5, 4, 4)]
    for i, tr in enumerate(leads):
        u = t + 4 * i
        pickup(tr, R, md, u, 84, octave.get(order[i], 0))
        melody(tr, R, [M.MOTIF], md, u, 4, vel=96, shift=octave.get(order[i], 0))
        # the earlier leads hold a chord tone under the newcomer
        d, size, _ = entry_harm[i]
        tones = M.chord_notes(R, d, 4 if size == 4 else 3, md, 0)
        for j, held in enumerate(leads[:i]):
            q = tones[j % len(tones)] + 12 * (j // len(tones))
            held.n(u, 3.8, q + octave.get(order[j], 0) - 12, 46)
        st.n(u, 3.9, M.chord_notes(R, d, 3, md, -1), 46 + 6 * i)
        bs.n(u, 3.6, deg(R, d, md) - 24, 70 + 5 * i)
        for k in range(4):
            if i >= 2:
                drm.n(u + k, 0.2, KICK if k % 2 == 0 else CHH, 50 + 8 * i)
    for i in range(8):  # swell into the tutti
        drm.n(t + 24 - 2 + 0.25 * i, 0.2, SNARE, 60 + 7 * i)
    t += 24
    third = {'fiddle': 2, 'clarinet': 2}
    for i, tr in enumerate(leads):
        if third.get(order[i]):
            for (u, d, pi) in M.bar_melody(R, M.A2_BARS, md, t, 4, 0):
                tr.n(u, d * 0.92, M.material_third(R, pi, md), 86)
        else:
            melody(tr, R, M.A2_BARS, md, t, 4, vel=90, shift=octave.get(order[i], 0))
    pickup(leads[1], R, md, t, 90)
    melody(br, R, M.A2_BARS, md, t, 4, vel=84, shift=-12)
    for (u, beats, d, size) in segs(M.A2_HARM, t, 4):
        st.n(u, beats, M.chord_notes(R, d, 3, md, 0), 84)
        bs.n(u, beats * 0.9, deg(R, d, md) - 24, 100)
        tim.n(u, 0.5, deg(R, d, md) - 24, 90)
    for k in range(4):
        drm.n(t + 4 * k, 1, CRASH if k % 2 == 0 else RIDE, 92)
        for i in range(4):
            drm.n(t + 4 * k + i, 0.3, KICK if i % 2 == 0 else SNARE, 92)
    end_ = t + 16
    drm.n(end_, 4, CRASH, 124)
    tim.n(end_, 3, deg(R, 1, md) - 24, 124)
    for tr in leads + [br]:
        tr.n(end_, 3.5, deg(R, 1, md), 100)
    st.n(end_, 3.5, M.chord_notes(R, 1, 3, md, 0), 96)
    s.save(os.path.join(OUT, 'city_theme.mid'), end_ + 4)
    MANIFEST['city_theme'] = dict(kind='story', seconds=round((end_ + 4) * 60 / bpm, 3), bpm=bpm, beatsPerBar=4,
                                  downbeatSeconds=round(1.0 * 60 / bpm, 4), payoffSeconds=round(end_ * 60 / bpm, 3))


if __name__ == '__main__':
    downtown()
    downtown(sparse=True)
    suburbs()
    waterfront()
    university()
    industrial()
    uptown()
    for hd in HOODS:
        stingers(hd)
        triumph(hd)
    bid_sting()
    megaslice()
    reunion()
    recipe()
    city_theme()
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(MANIFEST, f, indent=1)
    for k, v in MANIFEST.items():
        if v['kind'] == 'loop':
            print(f"{k:18s} {v['bars']:3d} bars {v['seconds']:7.2f}s")
    print(len(MANIFEST), 'cues')
