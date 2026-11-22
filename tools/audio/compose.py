"""Slice Empire score: six neighbourhood loops, story cues and per-key stingers, all from one city motif.

Lofi jazz rewrite (2026-11-15, rounds R1 and R2): every cue is jazz-voiced, swung, played on the palette's instruments
(Rhodes, nylon guitar, vibraphone, marimba, kalimba, harp, celesta, flute, warm pad, upright bass, brushes). Nothing is exempt
from `palette.check`.

Run: python3 compose.py [outdir]   -> writes .mid files plus manifest.json (bpm, meter, loop length per cue).
Instruments are General MIDI programs, 0-based here (the cue sheet lists them 1-based).
"""
from __future__ import annotations

import dataclasses
import json
import math
import os
import sys

from mlib import (Song, Track, deg, p, MAJOR, MIXO, MINOR, KICK, SNARE, RIM, CLAP, CHH, OHH, PEDAL, CRASH, RIDE,
                  TAMB, SHAKER, COWBELL, TOM_LO, TOM_MID, TOM_HI, CONGA_LO, CONGA_HI, CLAVES, TRIANGLE_OPEN, CABASA,
                  SPLASH)
import material as M
import jazz
import palette

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'build', 'midi')
os.makedirs(OUT, exist_ok=True)
MANIFEST: dict = {}

GM = dict(piano=0, celesta=8, glock=9, vibes=11, marimba=12, bells=14, nylon=24, steel=25, jazz_gtr=26, clean_gtr=27,
          ac_bass=32, fing_bass=33, fretless=34, syn_bass=38, strings=48, slow_strings=49, pizz=45, harp=46, flute=73,
          steel_drums=114, rhodes=4, choir=52, oohs=53, warm_pad=89, kalimba=108)
BRUSH = 40  # GM drum kit program 40 = "Brush": the soft kit under every lofi loop
BRUSH_TAP, BRUSH_SWIRL = 38, 40  # in the brush kit, the "snare" notes are brushes

# Per-neighbourhood identity (AU17). `root` is the melody's tonic (around middle C).
# Lofi round 1 (2026-10-31): every tempo drops and the swing is 56-60% (Industrial keeps its triplet shuffle, Downtown
# its 6/8 lilt). Downtown's bpm is the quarter note: dotted quarter = 66.
HOODS = {
    'downtown': dict(root='F4', mode=MAJOR, bpm=99, bar=3, ts=(6, 8), lead=GM['nylon'], swing=0.0),
    'suburbs': dict(root='G4', mode=MAJOR, bpm=86, bar=4, ts=(4, 4), lead=GM['vibes'], swing=0.58),
    'waterfront': dict(root='D4', mode=MIXO, bpm=80, bar=4, ts=(4, 4), lead=GM['marimba'], swing=0.56),
    'university': dict(root='Bb4', mode=MAJOR, bpm=76, bar=4, ts=(4, 4), lead=GM['vibes'], swing=0.58),
    'industrial': dict(root='A3', mode=MIXO, bpm=76, bar=4, ts=(4, 4), lead=GM['vibes'], swing=0.667),
    'uptown': dict(root='Eb4', mode=MAJOR, bpm=84, bar=4, ts=(4, 4), lead=GM['nylon'], swing=0.6),
}
LEAD_CAP = 80  # leads never play louder than this (after humanising)
# Every cue goes through the palette check (palette.py) before its MIDI is written: `finish()`, `sting_save()`, `story_save()`,
# `story_cue()` and the bid call it, so a build stops on a violation. No cue is exempt (card M2c).
PALETTE_CHECKED: list[str] = []


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


# ------------------------------------------------------------------------------------------------ the lofi bed
def rh_voicing(R, d, mode, ext=None):
    """Rootless Rhodes voicing of the chord on degree `d`: 3rd, 5th, 7th and (on I, ii, IV, V, vi) the 9th, so the chords
    read as maj7/9, add9 or min9. Folded so the lowest note sits within an octave below the key's tonic."""
    if ext and d in ext:
        stack = [p(x) for x in ext[d]]
    else:
        ks = (1, 2, 3) + ((4,) if d in (1, 2, 4, 5, 6) else ())
        stack = [deg(R, d + 2 * k, mode) for k in ks]
    lo = p(R) - 12
    while min(stack) < lo:
        stack = [x + 12 for x in stack]
    while min(stack) >= lo + 12:
        stack = [x - 12 for x in stack]
    return sorted(stack)


def rh_hit(rh: Track, t, notes, dur, vel, strum=0.03):
    """A soft, slightly rolled Rhodes chord: the upper notes come in a hair later and a hair quieter."""
    for i, q in enumerate(notes):
        rh.n(t + strum * i, dur, q, vel - 2 * i)


def rh_comp(rh: Track, u, beats, d, R, mode, vel=48, ext=None, answer=True):
    """The shared Rhodes comp: a long chord on the downbeat and a quieter one anticipating beat 3 (the 'and' of 2)."""
    notes = rh_voicing(R, d, mode, ext)
    rh_hit(rh, u, notes, min(beats, 4) * 0.88, vel)
    if answer and beats >= 4:
        rh_hit(rh, u + 1.5, notes[1:], 1.0, vel - 12)


def hats(drm: Track, t, n=8, step=0.5, on=40, off=28, note=CHH):
    for i in range(n):
        drm.n(t + step * i, 0.15, note, on if i % 2 == 0 else off)


def soft_claps(drm: Track, t, vel=44, offs=(0.0, 1 / 3, 2 / 3)):
    """Soft claps: a hand clap kept very low with a rim tick under it. They live on their own track, which the swing
    skips, so the triplet stays even (swinging it made an uneven ~35 ms flam: AU71)."""
    for i, off in enumerate(offs):
        drm.n(t + off, 0.1, CLAP, vel - 3 * i)
        drm.n(t + off, 0.06, RIM, max(1, vel - 14))


def lofi_finish(s: Song, ratio: float, leads=(), straight=()):
    """Swing everything (except `straight` tracks), humanise (hats ±10 vel, ±8 ms) and cap the leads at LEAD_CAP."""
    swing_smooth([tr for tr in s.tracks if tr.name not in straight], ratio)
    s.humanize_ms(8, 8, 10, cap={n: LEAD_CAP for n in leads})


WET_REVERB, WET_CHORUS = 0.5, 0.25  # share of the chart's reverb and chorus sends the pitched tracks keep (R1, 2026-11-19)


def jazz_finish(s: Song, ratio: float, leads=(), lead_cap: int = 56, laid_ms: float = 15.0, straight=()):
    """The jazz loop finish, in this order: swing every subdivision (`swing_smooth`, none at ratio 0), humanise (timing
    +-6 ms, velocity +-10, kit velocity +-12, leads capped at `lead_cap`), then lay the kit and bass back (`jazz.laid_back`).
    Notes round R1, 2026-11-19 (less smearing): every pitched track's reverb send is cut to `WET_REVERB` and its chorus
    send to `WET_CHORUS` of what the chart set. The kit keeps its sends (he likes the brushes)."""
    for tr in s.tracks:
        if tr.channel != 9:
            tr.reverb = int(round(tr.reverb * WET_REVERB))
            tr.chorus = int(round(tr.chorus * WET_CHORUS))
    swing_smooth([tr for tr in s.tracks if tr.name not in straight], ratio)
    s.humanize_ms(6, 10, 12, cap={n: lead_cap for n in leads})
    jazz.laid_back(s.tracks, laid_ms, s.bpm)


CLASH_INTERVALS = (1, 13)  # a semitone or a minor ninth between a held lead note and a note of the chord under it


def clash_scan(hm: jazz.Harmony, t0: float, notes, min_beats: float = 1.0, also_default: bool = True) -> list:
    """AU78: every held lead note (`notes`: (start, beats, pitch) events of one section that starts at beat `t0`) that sits a
    semitone or a minor ninth from a note of a chord it overlaps for `min_beats` or more. The chords are the voicings the Rhodes
    comp plays (`jazz.comp_voicings`) and, with `also_default`, the nearest-the-low-register voicing the pads and arpeggios use.
    Returns (beat, lead pitch, chord note, chord degree, quality) tuples; an empty list is a pass."""
    comp_v = jazz.comp_voicings(hm)
    out = []
    for (u, d, pi) in notes:
        if d < min_beats - 1e-9:
            continue
        # a lead note that doubles a note of the voicing is the chord's own interval (a min9's 9th and 3rd, say): not a clash
        for ((c0, ch), cv) in zip(hm.chords(t0), comp_v):
            if min(u + d, c0 + ch.beats) - max(u, c0) < min_beats - 1e-9:
                continue
            voicings = [cv] + ([jazz.voicing_off(hm.key, ch.off, ch.q)] if also_default else [])
            for v in voicings:
                if pi % 12 in {q % 12 for q in v}:
                    continue
                for q in v:
                    if abs(pi - q) in CLASH_INTERVALS:
                        out.append((round(u, 2), pi, q, ch.off, ch.q))
    return sorted(set(out))


def lead_mark(*tracks) -> list:
    """Remember where each lead track's events stand, so `clash_assert` can look at just the notes a section added."""
    return [(tr, len(tr.events)) for tr in tracks]


def clash_assert(name: str, hm: jazz.Harmony, t0: float, mark: list, min_beats: float = 1.0) -> None:
    """AU78 build check: no lead note added since `mark` may sit a semitone or a minor ninth from the chord under it."""
    notes = [(u, d, pi) for (tr, n) in mark for (u, d, pi, _v) in tr.events[n:]]
    bad = clash_scan(hm, t0, notes, min_beats)
    assert not bad, f'{name}: lead clashes with its chord (beat, lead, chord note, root offset, quality): {bad}'


def finish(song: Song, name: str, bars: int, bar_beats: float, ts, kind: str, extra=None):
    beats = bars * bar_beats
    palette.check(song, name)
    PALETTE_CHECKED.append(name)
    secs = song.save(os.path.join(OUT, f'{name}.mid'), beats, ts)
    roots = getattr(song, 'bar_roots', None)
    if roots:  # the chord degree on each bar's downbeat, so stingers can wait for the tonic (AU47)
        assert len(roots) == bars, (name, len(roots), bars)
        extra = {**(extra or {}), 'barRoots': roots}
    MANIFEST[name] = dict(kind=kind, bpm=song.bpm, beatsPerBar=bar_beats, bars=bars, seconds=round(secs, 4),
                          **(extra or {}))
    return secs


# ================================================================================================ DOWNTOWN
def downtown_chart() -> list:
    """Downtown's harmony, one entry per section: (section, Harmony, melody bars | None). F major, 6/8 (3 beats a bar).
    Written with the jazz helpers; every melody bar is checked against the chord under it (see AUDIOLOG M1a)."""
    K, B = 'F', 3.0
    hold, bars, ii_V_I = jazz.hold, jazz.bars, jazz.ii_V_I
    intro = hold(K, B, 'I', 'maj9') + hold(K, B, 'I', '6/9') + jazz.i_vi_ii_V(K, B)           # home, then I vi | ii V
    a_m = hold(K, B, 'I', '6/9') + ii_V_I(K, B, target_q='6/9') + hold(K, B, 'I', '6/9')      # F6/9 | Gm9 C13 | F6/9 | F6/9 (AU78: the lead holds F)
    a_ans = (hold(K, B, 'IV', 'maj9') + ii_V_I(K, B, resolve=False, v_q='dom7b9') + hold(K, B, 'I', 'maj9')
             + ii_V_I(K, B, 'IV', resolve=False))                                              # Bbmaj9 | Gm9 C7b9 | Fmaj9 | Cm9 F13
    a_dev = bars(K, B, [('IV', '6/9', 3)], [('I', 'maj9', 3)], [('ii', 'min11', 3)], [('vi', 'sus13', 3)])
    a_close = ii_V_I(K, B, target_q='6/9', shape='bar') + jazz.backdoor(K, B, resolve=False)                  # Gm9 | C13 | F6/9 | Bbm9 Eb13
    bed1 = (hold(K, B, 'I', 'maj9') + hold(K, B, 'IV', 'maj9') + ii_V_I(K, B, resolve=False)
            + bars(K, B, [('I', 'maj9', 1.5), ('iii', 'dom7b9', 1.5)]))                       # ... Fmaj9 A7b9 into Dm
    b1 = bars(K, B, [('vi', 'min9', 3)], [('ii', 'min11', 3)], [('iii', 'min9', 1.5), ('iii', 'dom9', 1.5)],
              [('vi', 'min11', 1.5), ('IV', 'maj7s11', 1.5)], [('vi', 'min9', 3)], [('IV', '6/9', 3)],
              [('V', 'dom9', 3)], [('ii', 'min9', 1.5), ('iii', 'dom7b9', 1.5)])
    b2 = bars(K, B, [('vi', 'min9', 3)], [('ii', 'min11', 3)], [('iii', 'min9', 1.5), ('bvii', 'dom13', 1.5)],
              [('vi', 'min11', 1.5), ('iii', 'sus13', 1.5)], [('vi', 'min9', 3)], [('IV', '6/9', 3)],
              [('V', 'dom9', 3)], [('ii', 'min9', 1.5), ('V', 'dom7b9', 1.5)])
    a2 = ii_V_I(K, B, target_q='6/9', shape='bar') + ii_V_I(K, B, resolve=False, tritone=True)  # Gm9 | C13 | F6/9 | Gm9 Gb13
    bed2 = (hold(K, B, 'I', 'maj9') + hold(K, B, 'I', '6/9')
            + bars(K, B, [('I', 'maj9', 1.5), ('#iv', 'dim7', 1.5)]) + ii_V_I(K, B, resolve=False))
    # The melody of each 4-bar phrase and which chart bars it sits on. The A phrases are M, ANS, DEV, CLOSE.
    return [('intro', intro, None), ('A', a_m, M.M68), ('A', a_ans, M.ANS68), ('A', a_dev, M.DEV68),
            ('A', a_close, M.CLOSE68), ('bed', bed1, None), ('B', b1, M.B68), ('B', b2, M.B68),
            ('A2', a_m, M.M68), ('A2', a2, M.CLOSE68), ('bed', bed2, None)]


def downtown(sparse=False):
    """Downtown, lofi jazz (card M1a). F major, 6/8, dotted quarter = 66, 52 bars. Rhodes comping is the centre; the nylon
    guitar plays every line the accordion had (an octave lower: the old lines reached G5), a warm pad sits very low, an
    upright bass plays the 6/8 two-feel, brushes keep the 6/8 long-short ride. The sparse chart (AU20) is the nylon
    guitar and Rhodes on the same timeline and the same barRoots."""
    h = HOODS['downtown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=11)
    lead = s.track('nylon melody', 0, GM['nylon'], volume=109 if not sparse else 87, pan=80, reverb=40)
    arp = s.track('nylon arpeggio', 1, GM['nylon'], volume=96, pan=76, reverb=40)
    rh = s.track('rhodes', 4, GM['rhodes'], volume=72, pan=48, reverb=45, chorus=40)
    pad = s.track('warm pad', 5, GM['warm_pad'], volume=36, pan=64, reverb=55)
    bass = s.track('bass', 3, GM['ac_bass'], volume=84, pan=64, reverb=20)
    perc = s.track('soft kit', 9, BRUSH, volume=78, pan=70, reverb=30)

    sections = downtown_chart()
    full = jazz.Harmony('F', B)
    for (_, hm, _m) in sections:
        full = full + hm
    s.bar_roots = full.roots
    t = 0.0
    bar_i = 0
    for sec, hm, mel in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        jazz.comp(rh, hm, jazz.F68, start=t, seed=11 + bar_i, vel=40 if quiet else 44)
        if not sparse:
            jazz.bass_two_feel(bass, hm, jazz.F68, start=t, vel=58 if quiet else 62)
            jazz.brushes(perc, nb, jazz.F68, start=t, seed=21 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
            for (u, ch) in hm.chords(t):  # the pad: the voicing's lower three notes, one slow chord per chord
                vc = jazz.voicing_off(R, ch.off, ch.q)[:3]
                for q in vc:
                    pad.n(u, ch.beats * 1.02, q, 30)
        if quiet:  # slow nylon arpeggio, one soft tone a beat, only while no line is playing
            for (u, ch) in hm.chords(t):
                vc = jazz.voicing_off(R, ch.off, ch.q)
                tones = [vc[0], vc[1], vc[2], vc[1]]
                for k in range(int(math.ceil(ch.beats))):
                    arp.n(u + k, 1.1, tones[k % 4], 34)
        if mel:
            mark = lead_mark(lead)
            if sec in ('A', 'A2') and mel is M.M68:
                pickup(lead, R, md, t, 44, shift=-12)
            melody(lead, R, mel, md, t, B, vel=44 if sec != 'B' else 42, shift=-12)
            clash_assert('downtown', hm, t, mark)
        t += nb * B
        bar_i += nb
    if sparse:  # AU20: before Nonna takes over, just the nylon guitar and the Rhodes
        s.tracks = [lead, arp, rh]
    jazz_finish(s, 0.0, leads=('nylon melody',))
    name = 'downtown_sparse' if sparse else 'downtown'
    secs = finish(s, name, int(t // B), B, h['ts'], 'loop', dict(hood='downtown', lofi=True))
    if sparse:  # Nonna's takeover swaps one chart for the other at the same position
        if 'downtown' not in MANIFEST:
            downtown()
        full_m, sp_m = MANIFEST['downtown'], MANIFEST['downtown_sparse']
        assert sp_m['barRoots'] == full_m['barRoots'], 'downtown_sparse barRoots differ from downtown'
        assert (sp_m['bars'], sp_m['seconds'], sp_m['bpm']) == (full_m['bars'], full_m['seconds'], full_m['bpm'])
    return secs


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
                pickup(tr, R, md, t, opt.get('pvel', 60), opt.get('shift', 0))
            melody(tr, R, mel, md, t, B, vel=opt.get('vel', 66), legato=opt.get('legato', 0.92), shift=opt.get('shift', 0))
            if opt.get('double'):
                dtr, dshift, dvel = opt['double']
                melody(leads[dtr], R, mel, md, t, B, vel=dvel, shift=dshift)
        if opt and opt.get('hook'):
            opt['hook'](t, nb)
        t += nb * B
    return int(round(t / B))


# ================================================================================================ 4/4 jazz shared
def walk_into(bass: Track, hm, nxt, feel, start: float, seed: int, vel: int = 60):
    """`jazz.bass_walk` over `hm`, with the last quarter approaching the first chord of `nxt` (the bar that follows) instead
    of the first chord of `hm`. Only the notes of `hm` are kept."""
    scratch = Track('scratch', bass.channel)
    jazz.bass_walk(scratch, hm + nxt, feel, start=start, seed=seed, vel=vel)
    end = start + hm.beats
    bass.events += [e for e in scratch.events if e[0] < end - 1e-9]


def kick_late(perc: Track, ms: float, bpm: float):
    """Kick (36) `ms` later than the rest of the kit: the lofi hip-hop pocket."""
    d = ms / 1000.0 * bpm / 60.0
    perc.events = [(t + d if pi == KICK else t, du, pi, v) for (t, du, pi, v) in perc.events]


def stabs(track: Track, hm, start: float, positions=(1.0, 3.0), vel: int = 32, dur: float = 0.3, near: float = 58,
          skip_bars=()):
    """A short chord on each of `positions` (beats in the bar; 1 and 3 are beats 2 and 4) of every bar of `hm`, voiced on the
    chord sounding there (`jazz.voicing_off`, nearest `near`). Bars listed in `skip_bars` get none."""
    chords = hm.chords(start)
    for b in range(len(hm)):
        if b in skip_bars:
            continue
        for pos in positions:
            at = start + b * hm.bar_beats + pos
            u, ch = next((u, c) for (u, c) in reversed(chords) if u <= at + 1e-9)
            for q in jazz.voicing_off(hm.key, ch.off, ch.q, near):
                track.n(at, dur, q, vel)


def major_b(K, B: float = 4.0) -> jazz.Harmony:
    """The 8-bar B of a major-key 4/4 loop, written to carry `material.B_BARS` (vi | ii | IV | I V | vi | ii | IV ii | V).
    Each chord holds every melody note of its bar as a chord tone, the 9th, 11th or 13th (checked against the chord under it: docs/build/music/reports/M1b.md)."""
    return jazz.bars(K, B,
                     [('vi', 'min9', 4)], [('ii', 'min11', 4)], [('IV', '6/9', 4)], [('I', 'maj9', 2), ('V', 'dom13', 2)],
                     [('vi', 'min11', 4)], [('ii', 'min9', 4)], [('IV', 'maj9', 2), ('ii', 'min9', 2)], [('V', 'dom13', 4)])


# ================================================================================================ SUBURBS
def suburbs_chart() -> list:
    """Suburbs, one entry per section: (section, Harmony, melody bars | None, who plays it). G major, 4/4, 32 bars."""
    K, B = 'G', 4.0
    hold, bars = jazz.hold, jazz.bars
    intro = jazz.i_vi_ii_V(K, B) + hold(K, B, 'I', 'maj9') + hold(K, B, 'I', '6/9')           # Gmaj9 Em9 | Am9 D13 | Gmaj9 | G6/9
    a_h = (hold(K, B, 'I', '6/9') + bars(K, B, [('V', 'dom13', 2), ('I', '6/9', 2)])
           + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]) + hold(K, B, 'I', '6/9'))     # AU78: the lead holds degree 1
    bed1 = (hold(K, B, 'I', 'maj9') + hold(K, B, 'IV', 'maj7s11') + bars(K, B, [('iii', 'min9', 2), ('vi', 'dom7b9', 2)])
            + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]))                              # ... D13 falls to the B's Em9
    bed2 = (hold(K, B, 'I', 'maj9') + hold(K, B, 'IV', 'maj7s11') + bars(K, B, [('iii', 'min9', 2), ('vi', 'dom7b9', 2)])
            + bars(K, B, [('ii', 'min9', 2), ('bii', 'dom13', 2)]))                            # ... Am9 Db13 into the loop's Gmaj9
    march = (bars(K, B, [('IV', 'maj9', 2), ('iii', 'min9', 2)], [('V', 'dom13', 2), ('I', 'maj9', 2)],
                  [('ii', 'min9', 2), ('V', 'dom13', 2)], [('V', 'dom9', 4)]))
    return [('intro', intro, None, None), ('A', a_h, M.A2_BARS, 'vib'), ('bed', bed1, None, None),
            ('B', major_b(K, B), M.B_BARS, 'gtr'),
            ('march', march, [M.ANSWER_1, M.ANSWER_2, M.CADENCE_1, [(5, 3), (None, 1)]], 'vib'),
            ('A', a_h, M.A2_BARS, 'vib'), ('bed', bed2, None, None)]


def suburbs():
    """Suburbs, lofi jazz (card M1b). G major, 86 bpm, 58% swing, 32 bars. A vibraphone carries the A and the march, a clean
    jazz guitar the B, over Rhodes comping; the glockenspiel is down to single notes at velocity 40 or under. Upright bass
    in a two-feel, walking through the B and the march. The kit is the swung backbeat: cross-stick on 2 and 4, ride, feathered
    kick, no snare march figure."""
    h = HOODS['suburbs']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=21)
    vib = s.track('vibraphone', 0, GM['vibes'], volume=110, pan=60, reverb=45)
    gtr = s.track('clean guitar', 1, GM['jazz_gtr'], volume=110, pan=84, reverb=32)
    glk = s.track('glockenspiel', 2, GM['glock'], volume=50, pan=40, reverb=55)
    rh = s.track('rhodes', 4, GM['rhodes'], volume=82, pan=50, reverb=45, chorus=40)
    bass = s.track('bass', 3, GM['ac_bass'], volume=88, reverb=15)
    perc = s.track('soft kit', 9, BRUSH, volume=84, pan=64, reverb=25)
    who = dict(vib=vib, gtr=gtr)

    sections = suburbs_chart()
    full = jazz.Harmony('G', B)
    for (_, hm, _m, _w) in sections:
        full = full + hm
    s.bar_roots = full.roots
    a_first = jazz.Harmony('G', B, sections[1][1][:1])
    t, bar_i = 0.0, 0
    walk_from = None
    for k, (sec, hm, mel, w) in enumerate(sections):
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        jazz.comp(rh, hm, jazz.SWING44, start=t, seed=21 + bar_i, vel=40 if quiet else 46, antic_p=0.15, answer_p=0.4)  # R1 note: too busy
        jazz.brushes(perc, nb, jazz.SWING44, start=t, seed=31 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        if sec in ('B', 'march'):
            walk_from = t if walk_from is None else walk_from
        else:
            jazz.bass_two_feel(bass, hm, jazz.SWING44, start=t, vel=58 if quiet else 62)
        if quiet:  # glockenspiel: single notes only, one in each bar, the top of the chord
            for i, (u, ch) in enumerate(hm.chords(t)):
                if ch.beats >= 2:
                    vc = jazz.voicing_off('G', ch.off, ch.q)
                    glk.n(u + (1.5 if i % 2 else 0.0), 1.2, vc[-1 - (i % 2)] + 12, 34)
        if mel:
            vel = {'vib': 46, 'gtr': 44}[w]
            mark = lead_mark(vib, gtr)
            if sec == 'A':
                pickup(who[w], R, md, t, 40)
            melody(who[w], R, mel, md, t, B, vel=vel, legato=0.9 if w == 'vib' else 0.8)
            if sec == 'B':  # the vibraphone doubles the guitar, very soft
                melody(vib, R, mel, md, t, B, vel=30, legato=0.85)
            clash_assert('suburbs', hm, t, mark)
        t += nb * B
        bar_i += nb
    bm = jazz.Harmony('G', B)
    for (sec, hm, _m, _w) in sections:
        if sec in ('B', 'march'):
            bm = bm + hm
    walk_into(bass, bm, a_first, jazz.SWING44, walk_from, seed=5, vel=62)
    jazz_finish(s, h['swing'], leads=('vibraphone', 'clean guitar'))
    glk.events = [(u, d, pi, min(v, 40)) for (u, d, pi, v) in glk.events]
    return finish(s, 'suburbs', int(t // B), B, h['ts'], 'loop', dict(hood='suburbs', lofi=True))


# ================================================================================================ WATERFRONT
def waterfront_chart() -> list:
    """Waterfront: (section, Harmony, melody bars | None, who). D Mixolydian, 4/4, 32 bars. Tonic chords are dominant (D9, D13,
    Dsus13), the minor v and the bVII (Cmaj9) are the Mixolydian colours; the loop turns round on Gm9 | Cmaj9 into D."""
    K, B = 'D', 4.0
    hold, bars = jazz.hold, jazz.bars
    intro = (hold(K, B, 'I', 'dom9') + hold(K, B, 'IV', 'maj9') + bars(K, B, [('v', 'min9', 2), ('bvii', 'maj9', 2)])
             + hold(K, B, 'I', 'dom13'))
    a_h = (hold(K, B, 'I', 'dom13') + bars(K, B, [('IV', 'maj9', 2), ('I', 'dom9', 2)])
           + bars(K, B, [('ii', 'min9', 2), ('v', 'min9', 2)]) + hold(K, B, 'I', 'sus13'))
    bed1 = (bars(K, B, [('IV', 'maj9', 2), ('I', 'sus13', 2)], [('v', 'min9', 2), ('I', 'dom9', 2)])
            + hold(K, B, 'bvii', 'maj9') + hold(K, B, 'v', 'min9'))
    b_h = bars(K, B, [('bvii', 'maj9', 4)], [('ii', 'min11', 4)], [('IV', '6/9', 4)], [('I', 'dom13', 2), ('v', 'min9', 2)],
               [('bvii', 'maj7s11', 4)], [('ii', 'min9', 4)], [('IV', 'maj9', 2), ('ii', 'min9', 2)], [('v', 'min11', 4)])
    bed2 = bars(K, B, [('I', 'dom9', 4)], [('v', 'min9', 2), ('I', 'dom13', 2)], [('IV', 'maj9', 2), ('I', 'sus13', 2)],
                [('bvii', 'maj9', 4)], [('v', 'min9', 2), ('I', 'dom9', 2)], [('IV', '6/9', 4)],
                [('IV', 'maj9', 2), ('ii', 'min9', 2)], [('iv', 'min9', 2), ('bvii', 'maj9', 2)])
    return [('intro', intro, None, None), ('A', a_h, M.A2_BARS, 'harp'), ('bed', bed1, None, None),
            ('B', b_h, M.B_BARS, 'mar'), ('A2', a_h, M.A2_BARS, 'harp'), ('bed', bed2, None, None)]


def waterfront():
    """Waterfront, lofi jazz (card M1b). D Mixolydian, 80 bpm, 56% swing, 32 bars. A harp carries the A, a marimba the B,
    over Rhodes comping and a soft marimba arpeggio; the bass is a half-note two-feel that plays the habanera's dotted figure
    in the first half of every second bar; shaker and brushes, no congas, no fiddle, no accordion."""
    h = HOODS['waterfront']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=31)
    harp = s.track('harp', 0, GM['harp'], volume=112, pan=44, reverb=48)
    mar = s.track('marimba', 1, GM['marimba'], volume=112, pan=36, reverb=40)
    arp = s.track('marimba arpeggio', 2, GM['marimba'], volume=84, pan=30, reverb=40)
    rh = s.track('rhodes', 4, GM['rhodes'], volume=80, pan=60, reverb=45, chorus=40)
    bass = s.track('bass', 3, GM['ac_bass'], volume=88, reverb=20)
    perc = s.track('soft kit', 9, BRUSH, volume=80, pan=64, reverb=32)

    sections = waterfront_chart()
    full = jazz.Harmony('D', B)
    for (_, hm, _m, _w) in sections:
        full = full + hm
    s.bar_roots = full.roots
    t, bar_i = 0.0, 0
    for sec, hm, mel, w in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        jazz.comp(rh, hm, jazz.SWING44, start=t, seed=31 + bar_i, vel=40 if quiet else 46)
        jazz.bass_two_feel(bass, hm, jazz.SWING44, start=t, vel=58 if quiet else 62)
        for i, bar in enumerate(hm):  # the habanera: dotted eighth, sixteenth, eighth, eighth, in every second bar's first half
            u = t + i * B
            if (bar_i + i) % 2 == 0 and len(bar) == 1:
                r = next(e[2] for e in bass.events if abs(e[0] - u) < 1e-6)
                bass.events = [e for e in bass.events if not (u - 1e-6 <= e[0] < u + 2.0 - 1e-6)]
                for off, dur, iv, v in ((0, .7, 0, 62), (.75, .2, 7, 42), (1, .45, 12, 50), (1.5, .45, 7, 46)):
                    bass.n(u + off, dur, r + iv, v)
        jazz.brushes(perc, nb, jazz.SWING44, start=t, seed=41 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        for i in range(nb * 8):  # shaker: soft eighths, the off-beats a little lighter
            perc.n(t + 0.5 * i, 0.15, SHAKER, 24 if i % 2 == 0 else 17)
        if sec != 'B':  # marimba: a soft arpeggio, one note a beat, under everything but the B
            pat = [0, 1, 2, 1]
            for (u, ch) in hm.chords(t):
                vc = jazz.voicing_off(R, ch.off, ch.q)
                for k in range(int(ch.beats)):
                    arp.n(u + k, 0.9, vc[pat[k % 4]] + 12, 36 if k % 2 == 0 else 28)
        if mel:
            if w == 'harp':
                pickup(harp, R, md, t, 38)
                melody(harp, R, mel, md, t, B, vel=48, legato=0.9)
                if sec == 'A2':  # a marimba an octave up, very soft, doubles the return
                    melody(mar, R, mel, md, t, B, vel=30, shift=12)
            else:
                melody(mar, R, mel, md, t, B, vel=46, legato=0.6)
        t += nb * B
        bar_i += nb
    jazz_finish(s, h['swing'], leads=('harp', 'marimba'))
    return finish(s, 'waterfront', int(t // B), B, h['ts'], 'loop', dict(hood='waterfront', lofi=True))


# ================================================================================================ UNIVERSITY
HIPHOP = jazz.Feel('hip-hop', 4.0, 2.0, 0.60,
                   ride=((0, 34), (0.5, 22), (1, 32), (1.5, 22), (2, 34), (2.5, 22), (3, 32), (3.5, 24)),
                   cross=(1, 3), pedal=(), kick=((0, 1.0), (1.5, 0.55), (2.5, 0.75)), ghosts=(0.5, 3.5), answer=(1.5,))


def university_chart() -> list:
    """University: (section, Harmony, melody bars | None, who). B-flat major, 4/4, 32 bars. maj9 and min9 chords throughout;
    the loop turns round on Ebm9 | Ab13 (backdoor) in the intro and on Cm9 F13 in the tail."""
    K, B = 'Bb', 4.0
    hold, bars = jazz.hold, jazz.bars
    intro = jazz.i_vi_ii_V(K, B) + hold(K, B, 'IV', 'maj9') + bars(K, B, [('iv', 'min9', 2), ('bvii', 'dom13', 2)])
    a_h = (hold(K, B, 'I', '6/9') + bars(K, B, [('V', 'dom13', 2), ('I', '6/9', 2)])
           + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]) + hold(K, B, 'I', '6/9'))     # AU78: the lead holds degree 1
    bed1 = (hold(K, B, 'IV', 'maj9') + bars(K, B, [('iii', 'min9', 2), ('vi', 'dom7b9', 2)])
            + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]) + hold(K, B, 'I', 'maj9'))
    half = (hold(K, B, 'I', '6/9') + hold(K, B, 'vi', 'min9') + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)])
            + hold(K, B, 'I', '6/9'))                                    # under the Rhodes' half-speed motif
    bed2 = (half + hold(K, B, 'IV', 'maj7s11') + bars(K, B, [('iii', 'min9', 2), ('vi', 'dom7b9', 2)])
            + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]) + hold(K, B, 'vi', 'min9'))
    tail = (hold(K, B, 'I', 'maj9') + hold(K, B, 'vi', 'min9') + hold(K, B, 'IV', 'maj9')
            + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]))
    a_mel = M.A2_BARS[:3] + [[(1, 2), (None, 2)]]
    return [('intro', intro, None, None), ('A', a_h, a_mel, 'kal'), ('bed', bed1, None, None),
            ('B', major_b(K, B), M.B_BARS, 'vib'), ('bed', bed2, None, None), ('tail', tail, None, None)]


def university():
    """University, lofi jazz (card M1b). B-flat major, 76 bpm, 60% swing, 32 bars. Rhodes with maj9 and min9 chords, a
    vibraphone on top in the B, the chip arpeggios (note, octave, fifth) on a soft kalimba at velocity 50 or under. A round
    electric bass; the kit is a lofi hip-hop pocket: kick 10 ms later than the rest of the kit, swing a touch heavier."""
    h = HOODS['university']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=41)
    kal = s.track('kalimba', 0, GM['kalimba'], volume=127, pan=60, reverb=45)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=60, pan=70, reverb=50, chorus=50)
    vib = s.track('vibraphone', 2, GM['vibes'], volume=127, pan=40, reverb=55)
    shim = s.track('vibes shimmer', 5, GM['vibes'], volume=35, pan=44, reverb=55)
    kal_tail = s.track('kalimba tail', 6, GM['kalimba'], volume=90, pan=60, reverb=45)  # AU79: the tail's arpeggio is bed, not lead
    rh_motif = s.track('rhodes motif', 7, GM['rhodes'], volume=60, pan=70, reverb=50, chorus=50)  # AU80: the half-speed motif is a lead
    bass = s.track('bass', 3, GM['fing_bass'], volume=63, reverb=10)
    perc = s.track('soft kit', 9, BRUSH, volume=60, pan=64, reverb=22)

    sections = university_chart()
    full = jazz.Harmony('Bb', B)
    for (_, hm, _m, _w) in sections:
        full = full + hm
    s.bar_roots = full.roots
    half_speed = [[(1, 2), (3, 1), (5, 1)], [(6, 3), (5, 1)], [(4, 1), (3, 1), (2, 1), (3, 1)], [(1, 4)]]
    t, bar_i = 0.0, 0
    for sec, hm, mel, w in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed', 'tail')
        jazz.comp(rh, hm, HIPHOP, start=t, seed=41 + bar_i, vel=44 if quiet else 50, strum=0.03)
        jazz.bass_two_feel(bass, hm, HIPHOP, start=t, vel=58 if quiet else 62)
        jazz.brushes(perc, nb, HIPHOP, start=t, seed=51 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        if sec != 'intro':  # a soft vibraphone shimmer, the top note of each whole-bar chord
            for (u, ch) in hm.chords(t):
                if ch.beats >= 4:
                    shim.n(u, ch.beats * 0.9, jazz.voicing_off(R, ch.off, ch.q)[-1] + 12, 24)
        mark = lead_mark(kal, vib, rh_motif)
        if sec == 'A':  # the motif, first statement: kalimba arpeggios, note on top of every other step
            for (u, d, pi) in M.bar_melody(R, mel, md, t, B, -12):
                k = 0
                while k * 0.5 < d * 0.95:
                    iv, v = ((0, 46), (12, 30), (0, 40), (7, 30))[k % 4]
                    kal.n(u + 0.5 * k, 0.45, pi + iv, v)
                    k += 1
        elif sec == 'B':
            melody(vib, R, mel, md, t, B, vel=46, legato=0.85)
        elif sec == 'tail':  # chord-tone arpeggios, no motif: one soft kalimba note a beat (AU79), on the bed's own track
            for (u, ch) in hm.chords(t):
                vc = jazz.voicing_off(R, ch.off, ch.q)
                tones = [vc[0], vc[1], vc[2], vc[3], vc[2], vc[1]]
                for k in range(int(ch.beats)):
                    kal_tail.n(u + k, 0.9, tones[k % 6] + 12, 30)
        elif sec == 'bed' and hm.beats == 32.0:  # the second statement: the Rhodes at half speed over the bed's first 4 bars
            melody(rh_motif, R, half_speed, md, t, B, vel=46, shift=0)
        if sec in ('A', 'B') or (sec == 'bed' and hm.beats == 32.0):
            # the kalimba's arpeggio steps are half a beat long: hold them to the same test as a sustained lead note
            clash_assert('university', hm, t, mark, 0.4 if sec == 'A' else 1.0)
        t += nb * B
        bar_i += nb
    jazz_finish(s, 0.60, leads=('kalimba', 'vibraphone', 'rhodes motif'), lead_cap=50, laid_ms=18.0)  # 60%: the HOODS 58% stays for the stingers
    kal_tail.events = [(t_, d_, pi, min(v, 34)) for (t_, d_, pi, v) in kal_tail.events]  # humanising can lift a note past 34
    kick_late(perc, 10.0, s.bpm)
    return finish(s, 'university', int(t // B), B, h['ts'], 'loop', dict(hood='university', lofi=True))


# ================================================================================================ INDUSTRIAL
def industrial_chart() -> jazz.Harmony:
    """One chorus of Industrial's jazz blues: 12 bars in A, dominant 9ths and 13ths on the I and IV, an Em9 A7b9 into the IV
    in bar 4, a sharp-IV diminished passing chord in bar 6 (D13 | D#dim7), and ii-V turnarounds in bars 9-12 (Bm9 E13 |
    Dm9 G13 backdoor | A9 F#7b9 | Bm9 E7b9). The loop plays it three times."""
    K, B = 'A', 4.0
    return jazz.bars(K, B,
                     [('I', 'dom9', 4)], [('I', 'dom13', 4)], [('I', 'dom9', 4)], [('v', 'min9', 2), ('I', 'dom7b9', 2)],
                     [('IV', 'dom9', 4)], [('IV', 'dom13', 2), ('#iv', 'dim7', 2)], [('I', 'dom9', 4)],
                     [('I', 'dom13', 2), ('vi', 'dom7b9', 2)],
                     [('ii', 'min9', 2), ('V', 'dom13', 2)], [('iv', 'min9', 2), ('bvii', 'dom13', 2)],
                     [('I', 'dom9', 2), ('vi', 'dom7b9', 2)], [('ii', 'min9', 2), ('V', 'dom7b9', 2)])


def industrial():
    """Industrial, lofi jazz (card M1c). A, 76 bpm, triplet shuffle (66.7%), 36 bars = three 12-bar choruses of a jazz blues.
    A muted Rhodes and a clean guitar comp; the vibraphone carries the motif (the flute states it again in chorus 3 at
    velocity 50 or under), each third with a blue flat-3 grace. Brushes and a ride in the shuffle, the rim click on 2 and 4;
    the upright bass is in a two-feel in chorus 1 and walks in 2 and 3. Chorus 1 has no lead."""
    h = HOODS['industrial']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=51)
    vib = s.track('vibraphone', 0, GM['vibes'], volume=110, pan=56, reverb=42)
    flt = s.track('flute', 1, GM['flute'], volume=110, pan=70, reverb=45)
    gtr = s.track('clean guitar', 2, GM['clean_gtr'], volume=70, pan=36, reverb=32)
    rh = s.track('rhodes', 5, GM['rhodes'], volume=80, pan=64, reverb=45, chorus=40)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=86, reverb=15)
    pad = s.track('warm pad', 4, GM['warm_pad'], volume=40, pan=74, reverb=55)
    perc = s.track('brushes', 9, BRUSH, volume=84, reverb=24)

    one = industrial_chart()
    full = one + one + one
    s.bar_roots = full.roots

    def blue_motif(tr, t, bars, vel, shift=0):  # the city motif with a blue flat-3 grace before each 3rd
        for (u, d, pi) in M.bar_melody(R, bars, md, t, B, shift):
            if (pi - shift - p(R)) % 12 == 4 and d >= 0.5:
                tr.n(u - 0.08, 0.08, pi - 1, vel - 18)
            tr.n(u, d * 0.9, pi, vel)

    dev = [[(4, 1), (6, .5), (8, .5), (9, 1.5), (8, .5)], [(6, .5), (4, .5), (3, .5), (4, .5), (1, 2)]]
    turn = [M.ANSWER_1, [(4, 1), (2, 1), (1, 1), (0, 1)]]  # F# E D C# B | D B A G over Bm9 E13 | Dm9 G13
    riff_bars = (0, 4)
    for chorus in range(3):
        t = chorus * 12 * B
        quiet = chorus == 0
        jazz.comp(rh, one, jazz.SHUFFLE, start=t, seed=51 + 12 * chorus, vel=40 if quiet else 44)
        stabs(gtr, one, t, vel=28 if quiet else 32, skip_bars=riff_bars if quiet else ())
        if quiet:
            jazz.bass_two_feel(bass, one, jazz.SHUFFLE, start=t, vel=56)
            for k in riff_bars:  # chorus 1: a six-note guitar riff on the I and the IV, no lead
                ch = one[k][0]
                r = 57 + (((p(h['root']) + ch.off) - 57) % 12)
                for i, iv in enumerate((0, 3, 4, 7, 9, 7)):
                    gtr.n(t + k * B + 0.5 * i, 0.4, r + iv, 40)
        jazz.brushes(perc, 12, jazz.SHUFFLE, start=t, seed=61 + 12 * chorus, scale=0.85 if quiet else 1.0, bar0=12 * chorus)
        if chorus == 1:  # chorus 2: the vibraphone states the motif, develops it on the IV, answers over the turnaround
            pickup(vib, R, md, t, 44)
            blue_motif(vib, t, [M.MOTIF, M.CLOSE], 44)
            blue_motif(vib, t + 4 * B, dev, 42)
            blue_motif(vib, t + 8 * B, turn, 44)
        elif chorus == 2:  # chorus 3: a warm pad under 8 bars, the flute states the motif, the vibraphone closes
            for (u, ch) in one.chords(t):
                if u < t + 8 * B:
                    for q in jazz.voicing_off(R, ch.off, ch.q)[:3]:
                        pad.n(u, ch.beats * 1.02, q, 28)
            pickup(flt, R, md, t, 42, 12)
            blue_motif(flt, t, [M.MOTIF, M.CLOSE], 44, 12)
            blue_motif(vib, t + 4 * B, dev, 42)
            blue_motif(vib, t + 8 * B, turn + [[(1, 2), (None, 2)]], 44)
    walk = one + one
    walk_start = 12 * B
    jazz.bass_walk(bass, walk, jazz.SHUFFLE, start=walk_start, seed=5, vel=60)
    jazz_finish(s, h['swing'], leads=('vibraphone', 'flute'), lead_cap=50)
    return finish(s, 'industrial', 36, B, h['ts'], 'loop', dict(hood='industrial', lofi=True))


# ================================================================================================ UPTOWN
def uptown_chart() -> list:
    """Uptown: (section, Harmony, melody bars | None). E-flat, 4/4, 32 bars: intro 4, A 4, B 8, bed 4, A 4, tag 8. The A and the B
    sit on the chords the University and Suburbs charts use for the same melody bars; the tag turns round on a backdoor and
    a tritone substitution (Fm9 E13) into the intro's Ebmaj9."""
    K, B = 'Eb', 4.0
    hold, bars = jazz.hold, jazz.bars
    intro = hold(K, B, 'I', 'maj9') + jazz.i_vi_ii_V(K, B) + hold(K, B, 'I', '6/9')
    a_h = (hold(K, B, 'I', '6/9') + bars(K, B, [('V', 'dom13', 2), ('I', '6/9', 2)])
           + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]) + hold(K, B, 'I', '6/9'))     # AU78: the lead holds degree 1
    bed = (hold(K, B, 'I', 'maj9') + hold(K, B, 'IV', 'maj7s11') + bars(K, B, [('iii', 'min9', 2), ('vi', 'dom7b9', 2)])
           + bars(K, B, [('ii', 'min9', 2), ('V', 'dom13', 2)]))
    tag = bars(K, B, [('vi', 'min9', 4)], [('ii', 'min11', 4)], [('iii', 'min9', 2), ('vi', 'dom7b9', 2)],
               [('ii', 'min9', 2), ('V', 'dom13', 2)], [('IV', 'maj7s11', 4)], [('iv', 'min9', 2), ('bvii', 'dom13', 2)],
               [('I', 'maj9', 4)], [('ii', 'min9', 2), ('bii', 'dom13', 2)])
    return [('intro', intro, None), ('A', a_h, M.A2_BARS), ('B', major_b(K, B), M.B_BARS), ('bed', bed, None),
            ('A', a_h, M.A2_BARS), ('tag', tag, None)]


def uptown():
    """Uptown, lofi jazz (card M1c). E-flat, 84 bpm, 60% swing, 32 bars. A nylon guitar plays the melody (the clarinet's chromatic
    approach notes stay), a piano comps, and the manouche "pompe" is a jazz guitar on 2 and 4 at velocity 42 or under. A walking
    upright bass and brushes; a harp plays the tag."""
    h = HOODS['uptown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=61)
    mel = s.track('nylon melody', 0, GM['nylon'], volume=100, pan=56, reverb=42)
    pno = s.track('piano', 1, GM['piano'], volume=80, pan=72, reverb=40)
    pompe = s.track('jazz guitar (pompe)', 2, GM['jazz_gtr'], volume=70, pan=40, reverb=30)
    harp = s.track('harp', 4, GM['harp'], volume=84, pan=84, reverb=55)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=86, reverb=20)
    perc = s.track('brushes', 9, BRUSH, volume=84, pan=64, reverb=30)

    sections = uptown_chart()
    full = jazz.Harmony('Eb', B)
    for (_, hm, _m) in sections:
        full = full + hm
    s.bar_roots = full.roots

    def guitar_line(t, bars, vel):  # chromatic approach notes into the long notes, an octave down
        for (u, d, pi) in M.bar_melody(R, bars, md, t, B, -12):
            if d >= 1.5:
                mel.n(u - 0.12, 0.12, pi - 1, vel - 14)
            mel.n(u, d * 0.9, pi, vel)

    t, bar_i = 0.0, 0
    for sec, hm, ml in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed', 'tag')
        jazz.comp(pno, hm, jazz.SWING44, start=t, seed=61 + bar_i, vel=38 if quiet else 44)
        stabs(pompe, hm, t, vel=30 if quiet else 32, dur=0.3, near=58)
        jazz.brushes(perc, nb, jazz.SWING44, start=t, seed=71 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        mark = lead_mark(mel)
        if sec == 'A':
            pickup(mel, R, md, t, 40, shift=-12)
            guitar_line(t, ml, 44)
        elif sec == 'B':
            melody(mel, R, ml, md, t, B, vel=44, legato=0.85, shift=-12)
        if sec in ('A', 'B'):
            clash_assert('uptown', hm, t, mark)
        elif sec == 'tag':  # the harp: each chord rolled up its voicing, one tone a beat (two a beat on a half bar's chord)
            for (u, ch) in hm.chords(t):
                vc = jazz.voicing_off(R, ch.off, ch.q)
                step = 1.0 if ch.beats >= 4 else 0.5
                for k, q in enumerate(vc):
                    harp.n(u + k * step, 1.6, q + 12, 34 if k % 2 == 0 else 28)
        t += nb * B
        bar_i += nb
    jazz.bass_walk(bass, full, jazz.SWING44, start=0.0, seed=7, vel=60)
    jazz_finish(s, h['swing'], leads=('nylon melody',))
    return finish(s, 'uptown', int(t // B), B, h['ts'], 'loop', dict(hood='uptown', lofi=True))


# ================================================================================================ STINGERS (AU14)
# R2, card M2a (2026-11-19): every gameplay stinger is a short jazz tag in the loop language: the city motif swung over one
# maj9 voicing of the neighbourhood's tonic (dom9 where the loop's tonic chord is a dominant), on that neighbourhood's R1
# front instruments, with a celesta bell colour at velocity 60 or under (its own stem, as before). Kinds differ by length,
# register and how much of the band plays; the lengths and `T0` are the ones the director and the tests expect.
STING_KINDS = ['bottleneck', 'milestone', 'milestone_big', 'manager', 'upgrade', 'fleet', 'drone', 'welcome', 'warmth',
               'build', 'perk', 'offline']
T0 = 1.0  # beat 1 of every stinger: a whole beat in, so swing() treats its eighths like the loop's (AU31b)
FULL_BED = ('milestone_big', 'manager', 'build')
# The full-band kinds (milestone_big, manager, build) hold a warm pad under the phrase and an upright bass on the first beat and the
# arrival. The bass is the loudest single note of each file, so the -6 dBFS ceiling's limiter works hardest on it and holds the file
# below its tier; the pad is sustained and slow to attack, so it adds loudness without a peak and lifts the file back toward its tier.
# These are the defaults: FULL_PAD (track volume, velocity), OPEN_BASS and ARRIVE_BASS (velocities); the tables below override them.
FULL_PAD = {'milestone_big': (127, 70), 'manager': (127, 44), 'build': (127, 30)}
OPEN_BASS = {'milestone_big': 54, 'manager': 54, 'build': 54}
ARRIVE_BASS = {'milestone_big': 68, 'manager': 68, 'build': 56}
PAD_FADE = 1.0  # beats: the full-band pad's expression falls to 20 over its last beat, so a loud pad doesn't lengthen the file
PAD_SWELL = {'milestone_big': 90}  # milestone_big's pad starts at this expression (of 127) and rises to full at the arrival
# Per (neighbourhood, kind) pad and bass velocities, found by building every combination of five pad and three bass settings and
# picking, for each neighbourhood, the one that puts the three kinds in the order milestone_big > manager >= build > milestone on
# integrated and momentary-max loudness with the widest gaps and the least distance from the tiers (card M2c; `build.hierarchy_errors`
# is the check). Re-found by the same search when the arrangement of these kinds changes.
# AU89 (review R2): re-found after the tag chord became a 6/9, over five pad velocities (26 to 70), five bass settings and three
# velocities for the Rhodes chord struck on the arrival (ARRIVE_RH), keeping manager >= build and each within 0.5 LU of its tier and
# maximising the smallest of the four strict gaps (milestone_big over manager and build over milestone, on integrated and on
# momentary max). RING_VEL gives Suburbs' and Industrial's milestone a louder afterglow pad, which lowers its momentary max.
FULL_PAD_HOOD: dict = {('downtown', 'build'): (127, 38), ('downtown', 'manager'): (127, 38), ('downtown', 'milestone_big'): (127, 38), ('industrial', 'build'): (127, 26), ('industrial', 'manager'): (127, 38), ('industrial', 'milestone_big'): (127, 52), ('suburbs', 'build'): (127, 38), ('suburbs', 'manager'): (127, 38), ('suburbs', 'milestone_big'): (127, 52), ('university', 'build'): (127, 26), ('university', 'manager'): (127, 70), ('university', 'milestone_big'): (127, 70), ('uptown', 'build'): (127, 26), ('uptown', 'manager'): (127, 52), ('uptown', 'milestone_big'): (127, 38), ('waterfront', 'build'): (127, 38), ('waterfront', 'manager'): (127, 70), ('waterfront', 'milestone_big'): (127, 70)}  # (track volume, velocity)
BASS_HOOD: dict = {('downtown', 'build'): (66, 84), ('downtown', 'manager'): (66, 84), ('downtown', 'milestone_big'): (54, 68), ('industrial', 'build'): (54, 68), ('industrial', 'manager'): (66, 84), ('industrial', 'milestone_big'): (30, 30), ('suburbs', 'build'): (80, 100), ('suburbs', 'manager'): (66, 84), ('suburbs', 'milestone_big'): (30, 30), ('university', 'build'): (30, 30), ('university', 'manager'): (42, 50), ('university', 'milestone_big'): (30, 30), ('uptown', 'build'): (54, 68), ('uptown', 'manager'): (80, 100), ('uptown', 'milestone_big'): (54, 68), ('waterfront', 'build'): (54, 68), ('waterfront', 'manager'): (54, 68), ('waterfront', 'milestone_big'): (30, 30)}  # (velocity on the first beat, velocity on the arrival)
RING_VEL: dict = {('industrial', 'milestone'): 64, ('suburbs', 'milestone'): 64}  # (neighbourhood, kind) -> velocity of the afterglow pad of the kinds without a full band (default 28)
ARRIVE_RH: dict = {('downtown', 'build'): 40, ('downtown', 'manager'): 30, ('industrial', 'build'): 30, ('industrial', 'manager'): 50, ('suburbs', 'build'): 50, ('suburbs', 'manager'): 50, ('university', 'build'): 50, ('university', 'manager'): 50, ('uptown', 'build'): 50, ('uptown', 'manager'): 30, ('waterfront', 'build'): 40, ('waterfront', 'manager'): 50}  # (neighbourhood, kind) -> velocity of the Rhodes chord struck on the arrival of milestone, milestone_big, manager and build (default 42; manager 40, build 42)
BELL_MAX = 60  # bell velocity ceiling after humanising
STING_LEAD_CAP = 58
LEAD_TRIM_DB = {('downtown', 'fleet'): 1.5, ('uptown', 'fleet'): 1.5, ('downtown', 'upgrade'): 1.5, ('uptown', 'upgrade'): 1.5}
# The tag's front instruments per neighbourhood (the loops' R1 leads) and the kit feel its band plays: Downtown's is the 6/8 one.
# `shift` moves the lead's register in semitones from the neighbourhood's root octave (the nylon guitar sits an octave low).
STING_FRONT = {
    'downtown': dict(lead=GM['nylon'], shift=-12, feel=jazz.F68),
    'suburbs': dict(lead=GM['vibes'], shift=0, feel=jazz.SWING44),
    'waterfront': dict(lead=GM['marimba'], shift=0, feel=jazz.SWING44),
    'university': dict(lead=GM['kalimba'], shift=0, feel=HIPHOP),
    'industrial': dict(lead=GM['vibes'], shift=0, feel=jazz.SHUFFLE),
    'uptown': dict(lead=GM['nylon'], shift=-12, feel=jazz.SWING44),
}
# How long the tag's warm pad rings, per (neighbourhood, kind). The struck and plucked instruments die away quickly, so a soft
# pad chord rings out the end of the tag and keeps each file as long as the one the director and its timing tests were written
# against (within 0.5 s). Found by building and measuring. A kind with no entry has no afterglow. Beats from the last lead
# note's onset; in the full-band kinds (FULL_BED) the bed's pad runs from beat 1 and the value is its end in beats from `end`
# (default -0.4).
STING_RING = {('downtown', 'bottleneck'): 0.8, ('downtown', 'build'): -0.91, ('downtown', 'fleet'): 0.8, ('downtown', 'perk'): 0.8, ('downtown', 'upgrade'): 0.8, ('downtown', 'welcome'): 1.5, ('industrial', 'bottleneck'): 1.71, ('industrial', 'drone'): 1.6, ('industrial', 'fleet'): 2.01, ('industrial', 'milestone'): 0.9, ('industrial', 'offline'): 1.5, ('industrial', 'upgrade'): 2.02, ('industrial', 'warmth'): 1.5, ('industrial', 'welcome'): 2.44, ('suburbs', 'bottleneck'): 1.73, ('suburbs', 'build'): -0.99, ('suburbs', 'drone'): 1.71, ('suburbs', 'fleet'): 0.8, ('suburbs', 'manager'): -0.92, ('suburbs', 'milestone'): 0.7, ('suburbs', 'offline'): 0.8, ('suburbs', 'upgrade'): 0.45, ('suburbs', 'warmth'): 0.8, ('suburbs', 'welcome'): 0.8, ('university', 'bottleneck'): 1.78, ('university', 'build'): -1.1, ('university', 'drone'): 1.9, ('university', 'fleet'): 1.5, ('university', 'manager'): -1.01, ('university', 'milestone'): 1.5, ('university', 'milestone_big'): -0.76, ('university', 'offline'): 0.45, ('university', 'perk'): 0.3, ('university', 'upgrade'): 0.3, ('university', 'warmth'): 0.8, ('university', 'welcome'): 0.8, ('uptown', 'bottleneck'): 1.85, ('uptown', 'drone'): 1.78, ('uptown', 'fleet'): 1.92, ('uptown', 'offline'): 1.5, ('uptown', 'perk'): 0.32, ('uptown', 'upgrade'): 1.93, ('uptown', 'welcome'): 2.42, ('waterfront', 'bottleneck'): 1.82, ('waterfront', 'build'): -1.01, ('waterfront', 'drone'): 1.75, ('waterfront', 'fleet'): 1.5, ('waterfront', 'manager'): -0.99, ('waterfront', 'milestone'): 1.5, ('waterfront', 'offline'): 1.03, ('waterfront', 'perk'): 0.35, ('waterfront', 'warmth'): 1.5}  # RING-TABLE
def phrases(h):
    """The neighbourhood's own meter (AU31a): opening bar, opening+closing, cadence, and their harmony (the harmony is
    read by `triumph`; the tags play one chord)."""
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


def tag_voicing(R, md, near: float = 62) -> list[int]:
    """The tag's one chord: the 6/9 voicing of the tonic (3 5 6 9, rootless; dom13 b7 9 3 13 in a Mixolydian key, where the
    loop's tonic chord is a dominant, so the sixth degree the lead holds is the chord's own 13th and not a semitone under its b7), in the keys' window G3..Bb4, the inversion nearest `near`. The bass plays the root.
    AU86: the tag's lead ends on degree 1, and a maj9 would put the major seventh a semitone under it."""
    return jazz.voicing_off(R, 0, 'dom13' if md == MIXO else '6/9', near, None, jazz.KEYS_LOW, jazz.KEYS_HIGH)


def rh_bed(rh, V, hits, strum: float = 0.018):
    """Rhodes under a stinger: the voicing `V` struck once per hit, (start, held beats, velocity), upper notes a hair later and
    quieter, every note let go together. Short holds: the chord never drones into the next sound (notes round R1)."""
    for (t, hold, vel) in hits:
        for k, q in enumerate(V):
            rh.n(t + strum * k, hold - strum * k, q, vel - 2 * k)


def tonic_bass(R) -> int:
    """The tonic as an upright-bass note in C2..B2."""
    return jazz._bass_root(jazz.tonic(R) % 12)


def mallet_swell(s: Song, R, md, t_from, t_to, peak=84):
    """A soft mallet swell: vibraphone root and fifth held under a rising expression curve into the arrival (the bass
    note under the arrival is the caller's)."""
    vib = s.track('swell', 6, GM['vibes'], volume=76, reverb=30)
    root = deg(R, 1, md) - 12
    n_ = max(2, int((t_to - t_from) * 4))
    vib.n(t_from, t_to - t_from + 1.2, [root, root + 7], 44)
    for i in range(n_ + 1):
        vib.ccs.append((t_from + (t_to - t_from) * i / n_, 11, int(30 + (peak - 30) * (i / n_) ** 1.5)))
    vib.ccs.append((t_to + 0.6, 11, 60))


def arrival_bell(s: Song, R, md, arrive: float, vel: int) -> None:
    """A celesta octave (root and fifth) on the arrival of a full-band stinger."""
    ce = s.track('bell arrival', 8, GM['celesta'], volume=84, reverb=40)
    ce.n(arrive, 2.5, [deg(R, 1, md) + 12, deg(R, 5, md) + 12], vel)


def brush_swirl(s: Song, t_from, t_to, v0=24, v1=64):
    """A brush-swirl crescendo into the arrival bar: a swirl every half beat, rising. Its own track, so it stays even."""
    sw = s.track('swirl', 9, BRUSH, volume=80, reverb=30)
    n_ = max(2, int(round((t_to - t_from) * 2)))
    for i in range(n_):
        sw.n(t_from + (t_to - t_from) * i / n_, 0.5, BRUSH_SWIRL, int(v0 + (v1 - v0) * i / (n_ - 1)))


def bell_program(hood: str) -> int:
    """The bell colour the bed lacks: celesta in every neighbourhood (softer than the glockenspiel; Suburbs' loop already
    carries a glockenspiel, Downtown's, Waterfront's and Uptown's have no bell)."""
    return GM['celesta']


def sting_save(s: Song, name: str, end: float, ts) -> dict:
    """Palette-check the stinger and write it; the bell tracks go to their own stem (AU73: build.py saturates the body and
    mixes the bell in afterwards, so a bass or Rhodes peak can't drive the tanh through the bell). Returns the manifest extras."""
    palette.check(s, name)
    PALETTE_CHECKED.append(name)
    for tr in s.tracks:  # humanising can lift a bell past its ceiling
        if tr.name.startswith('bell') or tr.name == 'celesta':
            tr.events = [(t, d, pi, min(v, BELL_MAX)) for (t, d, pi, v) in tr.events]
    bells = [tr for tr in s.tracks if tr.name.startswith('bell')]
    if not bells:
        s.save(os.path.join(OUT, f'{name}.mid'), end, ts)
        return {}
    s.tracks = [tr for tr in s.tracks if tr not in bells]
    s.save(os.path.join(OUT, f'{name}.mid'), end, ts)
    s.tracks = bells
    s.save(os.path.join(OUT, f'{name}__bell.mid'), end, ts)
    PALETTE_CHECKED.append(f'{name}__bell')
    MANIFEST[f'{name}__bell'] = dict(kind='stem', of=name)
    return dict(bellStem=f'{name}__bell')


def stingers(hood: str):
    h = HOODS[hood]
    fr = STING_FRONT[hood]
    R, md, bpm = h['root'], h['mode'], h['bpm']
    ph = phrases(h)
    B = ph['B']
    bellp = bell_program(hood)
    feel, sh = fr['feel'], fr['shift']
    V = tag_voicing(R, md)
    for kind in STING_KINDS:
        s = Song(bpm, B, seed=sum(map(ord, kind)))
        # a lead sits at or under its bed; the four tags whose lead measured -1 LU or closer to its bed are trimmed 1.5 dB (AU88;
        # CC7 is 40 log10 of the value, so 1.5 dB is a factor of 0.918)
        ld = s.track('lead', 0, fr['lead'], volume=100 if kind in FULL_BED else int(round(80 * 10 ** (-LEAD_TRIM_DB.get((hood, kind), 0.0) / 40))),
                     reverb=30)
        rh = s.track('rhodes', 1, GM['rhodes'], volume=100 if kind not in FULL_BED else 88, pan=56, reverb=26, chorus=20)
        t0 = T0

        def bell_double(bars, vel=44, legato=0.8, pick=True):
            """AU62: a bell an octave above the lead, a colour the loop's bed doesn't have (velocity 60 or under)."""
            bl = s.track('bell', 2, bellp, volume=84, reverb=40)
            if pick:
                pickup(bl, R, md, t0, vel, sh + 12)
            melody(bl, R, bars, md, t0, B, vel=vel, legato=legato, shift=sh + 12)
            return bl

        def full_bed(nb, kit_bars, arrive, swirl_from=None):
            """The band for the big kinds: a warm pad under the phrase, an upright bass note on the first beat and a longer one
            under the arrival, brushes on the bars `kit_bars`, a brush swirl rising into the arrival bar."""
            end_ = t0 + nb * B
            pv = FULL_PAD_HOOD.get((hood, kind), FULL_PAD[kind])
            pad = s.track('pad', 3, GM['warm_pad'], volume=pv[0], reverb=30)
            pe = end_ + STING_RING.get((hood, kind), -0.4)
            pad.n(t0, pe - t0, V, pv[1])
            pad.ccs += [(pe - PAD_FADE, 11, 127), (pe, 11, 20)]  # a loud pad would otherwise ring past the file's old length
            bs = s.track('bass', 4, GM['ac_bass'], volume=96, reverb=12)
            ob, ab = BASS_HOOD.get((hood, kind), (OPEN_BASS[kind], ARRIVE_BASS[kind]))
            bs.n(t0, B * 0.4, tonic_bass(R), ob)
            bs.n(arrive, 2.5, tonic_bass(R), ab)
            drm = s.track('kit', 9, BRUSH, volume=78, reverb=22)
            for b in kit_bars:
                jazz.brushes(drm, 1, feel, start=t0 + b * B, seed=11 + b, scale=0.85, swirl_every=0)
            if swirl_from is not None:
                brush_swirl(s, swirl_from, arrive, 24, 70 if kind == 'milestone_big' else 60)
            if kind in PAD_SWELL:  # the pad leans into the arrival: its expression rises from PAD_SWELL[kind] to full over the phrase
                for i in range(9):
                    pad.ccs.append((t0 + (arrive - t0) * i / 8, 11, int(PAD_SWELL[kind] + (127 - PAD_SWELL[kind]) * (i / 8) ** 1.5)))

        if kind == 'bottleneck':  # 3 notes of the motif and a bell; no Rhodes chord (it only waits a beat, so it would often
            s.tracks.remove(rh)   # land on the loop's IV or V chord: AU62)
            opening = [ph['open'][0][:3]]
            melody(ld, R, opening, md, t0, B, vel=54, legato=1.0, shift=sh)
            bell_double(opening, 40, 1.0, pick=False)
            end = t0 + B + 1
        elif kind in ('milestone', 'milestone_big'):  # opening + closing as a cadence over the tag chord
            pickup(ld, R, md, t0, 52, sh)
            melody(ld, R, ph['motif'], md, t0, B, vel=54, shift=sh)
            nb = len(ph['motif'])
            arrive = t0 + (nb - 1) * B
            roll_from = t0 + (nb - 2) * B + (B / 2 if nb == 2 else 0)
            rh_bed(rh, V, [(t0, B * 0.4, 46), (arrive, B * 0.7, ARRIVE_RH.get((hood, kind), 42))])
            bell_double(ph['motif'])
            if kind == 'milestone_big':  # a longer brush crescendo, a mallet swell, a bass root and a celesta chord on arrival (AU65)
                full_bed(nb, [b for b in range(nb - 2)] + [nb - 1], arrive, t0 + (nb - 2) * B)
                mallet_swell(s, R, md, roll_from, arrive)
                arrival_bell(s, R, md, arrive, 54)
            else:
                brush_swirl(s, roll_from, arrive, 24, 54)
            end = t0 + nb * B
        elif kind == 'manager':  # resolving: the cadence then the closing phrase, the full band
            melody(ld, R, ph['cad'], md, t0, B, vel=52, shift=sh)
            nb = len(ph['cad'])
            arrive = t0 + (nb - 1) * B
            rh_bed(rh, V, [(t0, B * 0.4, 42), (arrive, B * 0.7, ARRIVE_RH.get((hood, kind), 40))])
            bell_double(ph['cad'], 40, pick=False)
            full_bed(nb, [b for b in range(nb - 2)] + [nb - 1], arrive, t0 + (nb - 2) * B + (B / 2 if nb == 2 else 0))
            end = t0 + nb * B
        elif kind in ('upgrade', 'fleet', 'drone'):  # opening phrase with a rising Rhodes lift
            pickup(ld, R, md, t0, 52, sh)
            melody(ld, R, ph['open'], md, t0, B, vel=54, legato=0.8, shift=sh)
            ld.n(t0 + B, B * 0.6, deg(R, 5, md) + sh, 52)
            bl = bell_double(ph['open'], 42)
            bl.n(t0 + B, B * 0.6, deg(R, 5, md) + sh + 12, 40)
            for i, q in enumerate(V):  # the lift: the tag chord rising, each note let go before the next lands
                rh.n(t0 + 0.5 * i, 0.45, q, 38 + 3 * i)
            if kind == 'fleet':  # two short low marimba notes where the horn was: a beep and a longer beep
                bp = s.track('beep', 5, GM['marimba'], volume=84, reverb=20)
                bp.n(t0 + B, 0.25, deg(R, 5, md) - 12, 50)
                bp.n(t0 + B + 0.5, 0.8, deg(R, 5, md) - 12, 54)
            if kind == 'drone':  # a quick harp flutter up the chord, straight eighths of a sixteenth apart
                arp = s.track('arp', 7, GM['harp'], volume=72, reverb=24)
                for i in range(6):
                    arp.n(t0 + B + 0.125 * i, 0.3, V[i % len(V)] + 12 * (i // len(V)), 36 + 2 * i)
            end = t0 + 2 * B
        elif kind == 'build':  # a new pizzeria opens: the motif over the full band, brushes all the way
            pickup(ld, R, md, t0, 52, sh)
            melody(ld, R, ph['motif'], md, t0, B, vel=54, shift=sh)
            nb = len(ph['motif'])
            arrive = t0 + (nb - 1) * B
            bell_double(ph['open'], 40, pick=False)
            rh_bed(rh, V, [(t0, B * 0.4, 44), (arrive, B * 0.7, ARRIVE_RH.get((hood, kind), 42))])
            full_bed(nb, list(range(nb)), arrive)
            end = t0 + nb * B
        elif kind == 'welcome':  # character sting (story beat 1)
            welcome = ph['open'] + [[(5, B - 1), (None, 1)]]
            pickup(ld, R, md, t0, 52, sh)
            melody(ld, R, welcome, md, t0, B, vel=54, shift=sh)
            bell_double(welcome, 40)
            for i, q in enumerate(V):  # the roll, on Rhodes: the tag chord rising, left to ring
                rh.n(t0 + 0.1 * i, 1.6, q, 40)
            end = t0 + 2 * B + 1
        elif kind == 'warmth':  # beat 2: the closing phrase, softer, over the tag chord
            melody(ld, R, ph['cad'], md, t0, B, vel=48, shift=sh)
            bell_double(ph['cad'], 38, pick=False)
            rh_bed(rh, V, [(t0, B * 0.4, 38), (t0 + (len(ph['cad']) - 1) * B, B * 0.7, 36)])
            end = t0 + len(ph['cad']) * B
        elif kind == 'perk':  # perk card (AU13): the opening phrase on a celesta over the tag chord, in this key (AU26)
            s.tracks.remove(ld)
            gl = s.track('celesta', 0, bellp, volume=88, reverb=40)
            pickup(gl, R, md, t0, 50, 12)
            melody(gl, R, ph['open'], md, t0, B, vel=56, legato=1.0, shift=12)
            rh_bed(rh, V, [(t0, B * 0.5, 40)])
            end = t0 + B + 1
        else:  # offline popup opens (AU15/AU30): the closing phrase on celesta over a soft tag chord
            s.tracks.remove(ld)
            ce = s.track('celesta', 0, GM['celesta'], volume=84, reverb=40)
            melody(ce, R, ph['cad'][1:2], md, t0, B, vel=52, legato=1.1, shift=12)
            rh_bed(rh, V, [(t0, B * 0.6, 34)])
            end = t0 + B + 1
        if (hood, kind) in STING_RING and kind not in FULL_BED:  # the afterglow: a soft pad chord from the last lead note
            lead_tr = next((tr for tr in s.tracks if tr.name in ('lead', 'celesta')), None)
            at = max(t_ for (t_, _d, _p, _v) in lead_tr.events)
            pad = s.track('pad', 3, GM['warm_pad'], volume=72, reverb=30)
            pad.n(at, STING_RING[(hood, kind)], V, RING_VEL.get((hood, kind), 28))
        # AU86: no lead or bell note held a beat or more sits a semitone or a minor ninth from the tag chord (the bell is an octave up)
        held = [(u, d, pi) for tr in s.tracks if tr.name in ('lead', 'bell', 'celesta') for (u, d, pi, _v) in tr.events]
        bad = sorted({(round(u, 2), pi, q) for (u, d, pi) in held if d >= 1.0 - 1e-9 and pi % 12 not in {x % 12 for x in V}
                      for q in V if abs(pi - q) in CLASH_INTERVALS})
        assert not bad, f'sting_{hood}_{kind}: lead clashes with the tag chord (beat, lead, chord note): {bad}'
        jazz_finish(s, h['swing'], leads=('lead',), lead_cap=STING_LEAD_CAP, straight=('arp', 'swell', 'swirl', 'beep'))
        name = f'sting_{hood}_{kind}'
        # AU73: the bell is its own stem (see sting_save).
        extra = sting_save(s, name, end, h['ts'])
        # musicSeconds: where the music ends (the duck and the gate hold this long, not the reverb tail: AU53)
        MANIFEST[name] = dict(kind='stinger', hood=hood, cue=kind, bpm=bpm, downbeatSeconds=round(t0 * 60 / bpm, 4),
                              seconds=round(end * 60 / bpm, 3), musicSeconds=round(end * 60 / bpm, 3), lofi=True, **extra)


def bid_sting():
    """AU27: Pier 9 bid. A held A7 (an A9 voicing: C# E G B on the Rhodes, the root A on the upright bass, root and octave on
    a soft vibraphone swell), no resolution and nothing after it: waterfront-4 resolves it to D."""
    h = HOODS['waterfront']
    R, md = h['root'], MAJOR  # a true dominant 7th, not Mixolydian's minor v
    s = Song(h['bpm'], 4, seed=5)
    rh = s.track('rhodes', 0, GM['rhodes'], volume=92, reverb=40, chorus=30)
    v9 = jazz.voicing_off(R, 7, 'dom9', 62, None, jazz.KEYS_LOW, jazz.KEYS_HIGH)  # rootless A9: C# E G B, in G3..Bb4
    rh_hit(rh, 0.6, v9, 3.4, 56, strum=0.06)
    bs = s.track('bass', 3, GM['ac_bass'], volume=96, reverb=12)
    bs.n(0.6, 3.4, deg(R, 5, md) - 24, 62)  # the root, A2
    vib = s.track('swell', 1, GM['vibes'], volume=76, reverb=30)
    vib.n(0.6, 3.6, [deg(R, 5, md) - 12, deg(R, 5, md)], 44)
    for i in range(12):
        vib.ccs.append((0.6 + 0.2 * i, 11, int(30 + 70 * (i / 11) ** 1.5)))
    jazz_finish(s, 0.0, straight=('swell',))
    palette.check(s, 'sting_waterfront_bid')
    PALETTE_CHECKED.append('sting_waterfront_bid')
    s.save(os.path.join(OUT, 'sting_waterfront_bid.mid'), 4.2)
    # musicSeconds: Dock Saved's villain sting comes in as the A7 hangs, not after the whole ring-out (AU57)
    MANIFEST['sting_waterfront_bid'] = dict(kind='stinger', hood='waterfront', cue='bid', bpm=h['bpm'], downbeatSeconds=0.0,
                                            seconds=round(4.2 * 60 / h['bpm'], 3), musicSeconds=2.6, lofi=True)



# ================================================================================================ THE WIN MOMENTS
# Card M2b (2026-11-19). The six triumphs and the city theme in the loops' language: swung brushes, a Rhodes and a vibraphone
# rising through the voicing, a slow-string swell, the closing phrase of the motif on the neighbourhood's front instrument over
# ii-V, then one arrival chord for all seven cues: a wide maj9 of the tonic (upright bass an octave under the loop's bass, Rhodes
# 7-9-3-5, strings root-5th-9th, vibraphone, a celesta bell) under a brush swirl that ends on it. No cymbal, no timpani, no brass.
# Each cue plays at its neighbourhood's loop tempo and swing (`HOODS`); the arrival lands where the old payoff crash did.
# (t0, P): the beat the first bar starts and the beat of the arrival, picked so P in seconds is within 0.25 s of the old payoff.
# Downtown's t0 is 0 since notes R2 (2026-11-22): a 0.5-beat pickup left 0.3 s at -28 dB where the loop drops out.
TRIUMPH_TIMING = {'downtown': (0.0, 6.0), 'suburbs': (0.0, 8.0), 'waterfront': (2.0, 10.0), 'university': (1.0, 9.0),
                  'industrial': (0.0, 8.0), 'uptown': (0.0, 8.0)}
# Where the music ends, in beats from the arrival (tuned so the encoded file is within 1.0 s of the old file's length).
TRIUMPH_TAIL = {'downtown': 4.4, 'suburbs': 4.0, 'waterfront': 4.0, 'university': 4.2, 'industrial': 4.0, 'uptown': 4.0}
# The lead's (track volume, velocity before humanising) per cue, found by measuring lead minus bed on the stems (aim -2 to -4 LU;
# the kalimba and the marimba are the quietest voices at the same velocity). The lead's velocity cap is STORY_LEAD_CAP.
STORY_LEAD = {'triumph_downtown': (116, 54), 'triumph_suburbs': (118, 54), 'triumph_waterfront': (127, 60),
              'triumph_university': (127, 70), 'triumph_industrial': (124, 56), 'triumph_uptown': (106, 54),
              'city_theme': (112, 54), 'splash_theme': (116, 54)}
STORY_LEAD_CAP = 72
STORY_BELL_VEL = 56  # arrival bell


def arrival_chord(s: Song, R, P: float, tail: float, pulse: float, vel: float = 1.0) -> list:
    """The arrival, the same for every cue in its own key: a 6/9 of the tonic, wide (AU85: the lead ends on degree 1 and holds it
    over the chord, and a maj9 puts the major seventh a semitone under it; the 6/9 has no seventh). Bass an octave under the
    loops' bass (and the loops' own octave, softer), Rhodes 3-5-6-9 rootless, strings on root, fifth and ninth, vibraphone on the
    fifth and ninth an octave up, a celesta bell on the root and fifth two octaves above the Rhodes' floor, a feathered kick and
    a soft brush tap where the swirl ends. Every note lets go by `tail` beats. Returns the pitches of the chord's pitched notes
    above the bass (for `story_cue`'s clash check)."""
    tn = jazz.tonic(R)
    b = jazz._bass_root(tn % 12)  # the loops' bass root, C2..B2
    V = jazz.voicing_off(R, 0, '6/9', 62, None, jazz.KEYS_LOW, jazz.KEYS_HIGH)
    bs = [t for t in s.tracks if t.name == 'bass'][0]
    bs.n(P, tail * 0.92, b - 12, int(86 * vel))
    bs.n(P + 0.02, tail * 0.8, b, int(56 * vel))
    rh = [t for t in s.tracks if t.name == 'rhodes'][0]
    for k, q in enumerate(V):
        rh.n(P + 0.02 * k, tail * 0.85 - 0.02 * k, q, int(64 * vel) - 2 * k)
    st = [t for t in s.tracks if t.name == 'strings'][0]
    st.n(P, tail * 0.95, [b + 12, b + 19, b + 26], int(62 * vel))
    vb = [t for t in s.tracks if t.name == 'vibes'][0]
    vb.n(P + 0.03, tail * 0.7, [V[1] + 12, V[3] + 12], int(46 * vel))
    bl = s.track('bell', 5, GM['celesta'], volume=84, reverb=40)
    bl.n(P + 0.01, tail * 0.65, [tn + 12, tn + 19], STORY_BELL_VEL)
    dr = [t for t in s.tracks if t.name == 'kit'][0]
    dr.n(P, 0.3, KICK, 52)
    dr.n(P, 0.3, 38, 46)
    return sorted(set(V) | {b + 12, b + 19, b + 26, V[1] + 12, V[3] + 12, tn + 12, tn + 19})


def story_cue(name: str, R, md, bpm: float, B: float, feel, swing: float, ts, P: float, n_pre: int, tail: float, leads: list,
              seed: int, front=None, opener=None) -> float:
    """One win moment. `n_pre` bars of ii-V-I (the city theme's hand-offs) then two bars of build, ii and then V (sus13, then
    13), the last one ending at the arrival beat `P`. `leads`: dicts with name, program, shift, pan, volume, phrases: a list of
    (bars, start beat, velocity). `opener(s, tb)` adds what only this cue has (the waterfront's ship's bell and D)."""
    pulse = feel.pulse
    tc = P - 2 * B                      # the first of the two build bars
    t_first = tc - n_pre * B
    s = Song(bpm, B, seed=seed)
    lead_ch = (0, 1, 2, 3, 10, 11)  # channels 4-9 are the bass, bell, keys, vibes, strings and kit
    lead_tr = [s.track(L['name'], lead_ch[i], L['program'], volume=L['volume'], pan=L['pan'], reverb=30) for i, L in enumerate(leads)]
    rh = s.track('rhodes', 6, GM['rhodes'], volume=100, pan=56, reverb=26, chorus=20)
    vb = s.track('vibes', 7, GM['vibes'], volume=80, pan=44, reverb=30)
    st = s.track('strings', 8, GM['slow_strings'], volume=70, reverb=40)
    bs = s.track('bass', 4, GM['ac_bass'], volume=96, reverb=12)
    dr = s.track('kit', 9, BRUSH, volume=78, reverb=22)
    for L, tr in zip(leads, lead_tr):
        for (bars_, start, vel) in L['phrases']:
            melody(tr, R, bars_, md, start, B, vel=vel, shift=L['shift'])
        if L.get('pickup') is not None:
            pickup(tr, R, md, L['pickup'], vel=L.get('pickup_vel', 48), shift=L['shift'])
    # the harmony: ii-V-I per pre bar (4/4), then ii | V sus13, V 13
    pre = jazz.bars(R, B, *([[(2, 'min9', B / 2), (5, 'dom13', B / 4), (1, 'maj9', B / 4)]] * n_pre)) if n_pre else None
    close = jazz.bars(R, B, [(2, 'min9', B)], [(5, 'sus13', B / 2), (5, 'dom13', B / 2)])
    hm = (pre + close) if pre else close
    chords = hm.chords(t_first)
    # keys: one soft strike per chord (two on a whole-bar chord), each voicing a little higher than the one before
    for i, (t, ch) in enumerate(chords):
        v = jazz.voicing_off(R, ch.off, ch.q, 57 + 8.0 * i / max(1, len(chords) - 1), jazz.SIMPLE, jazz.KEYS_LOW, jazz.KEYS_HIGH)
        hold = min(1.6, ch.beats - 0.45) if ch.beats >= 2 else 0.5
        for k, q in enumerate(v):
            rh.n(t + 0.018 * k, hold - 0.018 * k, q, 42 + int(6 * i / max(1, len(chords) - 1)) - 2 * k)
        if ch.beats >= B - 1e-9 and B == 4:
            for k, q in enumerate(v[1:] if len(v) > 2 else v):
                rh.n(t + 2 + 0.018 * k, 0.5, q, 32)
    # vibraphone: the last chord's voicing rising, four notes up the chord an octave above the keys, quieter than the keys
    last_t, last_ch = chords[-1]
    vv = jazz.voicing_off(R, last_ch.off, last_ch.q, 55)
    for k in range(4):
        vb.n(last_t + k * last_ch.beats / 4, last_ch.beats / 4 * 0.9, vv[k % len(vv)] + 12 + 12 * (k // len(vv)), 30 + 6 * k)
    # strings: guide tones of each chord of the build, one note group per chord, joined; a swell under them
    for (t, ch) in chords[-3:]:
        sv = jazz.voicing_off(R, ch.off, ch.q, 55, jazz.SIMPLE, 48, 64)
        st.n(t, ch.beats + 0.05, sv, 40)
    ramp0 = P - 2 * B
    for i in range(0, int(4 * (P - ramp0)) + 1):
        x = ramp0 + i / 4.0
        st.ccs.append((x, 11, int(34 + 66 * (i / (4 * (P - ramp0))) ** 1.4)))
    st.ccs.append((P + tail * 0.55, 11, 100))
    st.ccs.append((P + tail * 0.95, 11, 36))
    # bass: walking in 4/4 (two-feel in 6/8) from the first bar to the beat before the arrival
    full = hm + jazz.hold(R, B, 1, '6/9')
    if feel.bar_beats == 4.0:
        jazz.bass_walk(bs, full, feel, start=t_first, seed=seed, vel=56)
    else:
        jazz.bass_two_feel(bs, full, feel, start=t_first, vel=52)
    bs.events = [e for e in bs.events if e[0] < P - 0.01]
    # brushes: the ride and feathered kick to the swirl, which ends on the arrival
    nb = n_pre + 1
    jazz.brushes(dr, nb, feel, start=t_first, seed=seed + 3, scale=0.8, swirl_every=0)
    jazz.brushes(dr, 1, feel, start=tc + B, seed=seed + 4, scale=0.8, swirl_every=0)
    dr.events = [e for e in dr.events if e[0] < P - pulse - 0.01]
    brush_swirl(s, P - pulse, P, 22, 62)
    arrival = arrival_chord(s, R, P, tail, pulse)
    lead_notes = [(u, d, pi) for tr in lead_tr for (u, d, pi, _v) in tr.events]
    # AU85: no held lead note sits a semitone or a minor ninth from the chords under it (the build's and the arrival's own notes)
    bad = clash_scan(full, t_first, lead_notes) + [
        (round(u, 2), pi, q, 0, '6/9 arrival') for (u, d, pi) in lead_notes if u < P + 2 and u + d > P + 1.0 - 1e-9
        for q in arrival if pi % 12 != q % 12 and abs(pi - q) in CLASH_INTERVALS]
    assert not bad, f'{name}: lead clashes with its chord (beat, lead, chord note, root offset, quality): {bad}'
    if opener:
        opener(s)
    end = P + tail
    jazz_finish(s, swing, leads=tuple(L['name'] for L in leads), lead_cap=STORY_LEAD_CAP, straight=('swirl', 'strings', 'ship bell'))
    for tr in s.tracks:  # humanising can lift a bell past its ceiling
        if tr.name in ('bell',):
            tr.events = [(t, d, pi, min(v, BELL_MAX)) for (t, d, pi, v) in tr.events]
    palette.check(s, name)
    PALETTE_CHECKED.append(name)
    s.save(os.path.join(OUT, f'{name}.mid'), end, ts)
    MANIFEST[name] = dict(kind='story', hood=name.removeprefix('triumph_') if name.startswith('triumph_') else None,
                          seconds=round(end * 60 / bpm, 3), bpm=bpm, beatsPerBar=int(B) if B == int(B) else B,
                          downbeatSeconds=round(t_first * 60 / bpm, 4), payoffSeconds=round(P * 60 / bpm, 3))
    if MANIFEST[name]['hood'] is None:
        del MANIFEST[name]['hood']
    return end


def triumph(hood: str):
    """Beat-4 win (AU4/AU12/AU26): the closing phrase of the motif on the neighbourhood's front instrument over ii-V, the
    arrival chord where the old payoff was, in the neighbourhood's key, loop tempo, swing and meter."""
    h = HOODS[hood]
    R, md, bpm, B = h['root'], h['mode'], h['bpm'], float(h['bar'])
    fr = STING_FRONT[hood]
    t0, P = TRIUMPH_TIMING[hood]
    tail = TRIUMPH_TAIL[hood]
    sh = fr['shift']
    lvol, lvel = STORY_LEAD[f'triumph_{hood}']
    if B == 3:  # 6/8: CLOSE68's two bars over ii and V, its tonic on the arrival
        phrases_ = [(M.CLOSE68[:3], t0, lvel)]
    else:       # 4/4: the cadence over ii, then the closing phrase so that its tonic is the arrival
        phrases_ = [([M.CADENCE_1], t0, lvel), ([M.CLOSE], P - 2, lvel)]
    leads = [dict(name='lead', program=fr['lead'], shift=sh, pan=64, volume=lvol, phrases=phrases_,
                  pickup=t0 if t0 >= 0.5 else None)]
    opener = None
    if hood == 'waterfront':  # the ship's bell (AU13) rings first, over the D that the bid's held A7 resolves to (AU77)
        def opener(s):
            bell = s.track('ship bell', 12, GM['bells'], volume=90, reverb=70)
            for i, v in enumerate((92, 82, 72)):
                bell.n(0.5 * i, 1.3, deg(R, 5, md), v)
            V = jazz.voicing_off(R, 0, '6/9', 62, None, jazz.KEYS_LOW, jazz.KEYS_HIGH)
            rh = [t for t in s.tracks if t.name == 'rhodes'][0]
            for k, q in enumerate(V):
                rh.n(0.018 * k, 1.7, q, 40 - 2 * k)
            bs = [t for t in s.tracks if t.name == 'bass'][0]
            bs.n(0.0, 1.7, jazz._bass_root(jazz.tonic(R) % 12), 58)
    story_cue(f'triumph_{hood}', R, md, bpm, B, fr['feel'], h['swing'], h['ts'], P, 0, tail, leads, seed=71 + sum(map(ord, hood)) % 17,
              opener=opener)


# ================================================================================================ STORY CUES
HQ_BPM = 76  # MegaSlice HQ's tempo; the rep stings play at it too (AU87)


def hq_chart() -> jazz.Harmony:
    """MegaSlice HQ's 17 bars in C minor. Bar 0 is the bass-only vamp. The motif sits on Cm(maj7) | Fm9 (bars 1-2 and 9-10);
    C#dim7 and Eb dim7 are passing chords; Dm7b5 | Db13 (bars 7 and 15) is the tritone substitution for Dm7b5 | G7b9."""
    K, B = 'C', 4.0
    return jazz.bars(K, B,
                     [('i', 'min9', 4)],
                     [('i', 'min(maj7)', 4)], [('iv', 'min9', 4)], [('i', 'min9', 2), ('bii', 'dim7', 2)],
                     [('ii', 'min7b5', 2), ('v', 'dom7b9', 2)],
                     [('bvi', 'maj7s11', 4)], [('iv', 'min11', 4)], [('ii', 'min7b5', 2), ('bii', 'dom13', 2)],
                     [('i', 'min(maj7)', 2), ('biii', 'dim7', 2)],
                     [('i', 'min(maj7)', 4)], [('iv', 'min9', 4)], [('i', 'min9', 2), ('bii', 'dim7', 2)],
                     [('ii', 'min7b5', 2), ('v', 'dom7b9', 2)],
                     [('bvi', 'maj7s11', 4)], [('iv', 'min11', 4)], [('ii', 'min7b5', 2), ('bii', 'dom13', 2)],
                     [('i', 'min9', 2), ('bii', 'dim7', 2)])


def megaslice():
    """Card M1c: HQ is a sneaky, slightly comic jazz walk (the rep stings and Victor's exit are `rep_sting` and `victor_exit`, card M2c). C minor, 76 bpm,
    17 bars, restart. A dark Rhodes plays the villain motif low, a second Rhodes comps, an upright bass walks with a pizzicato
    doubling it an octave up, brushes keep a side stick on 2 and 4 at velocity 40 or under."""
    R, md = 'C4', MINOR
    # villain motif: 5, | 1 b3 b5 b6. 5 | b6 5 b5 4 1
    V1, V2, W = VILLAIN_V1, VILLAIN_V2, VILLAIN_W

    def vline(tr, t, bars, vel, shift=0, legato=0.45):
        villain_line(tr, R, md, t, bars, vel, shift, legato)

    hm = hq_chart()
    s = Song(HQ_BPM, 4, seed=81)
    vil = s.track('rhodes villain', 0, GM['rhodes'], volume=110, pan=56, reverb=35, chorus=30)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=70, pan=72, reverb=40, chorus=40)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=88, reverb=20)
    pz = s.track('bass pizzicato', 4, GM['pizz'], volume=70, pan=34, reverb=35)
    perc = s.track('soft kit', 9, BRUSH, volume=80, pan=64, reverb=28)
    jazz.comp(rh, jazz.Harmony('C', 4.0, list(hm)[1:]), jazz.SWING44, start=4.0, seed=81, vel=36)  # bar 0 is the bass alone
    jazz.bass_walk(bass, hm, jazz.SWING44, start=0.0, seed=9, vel=62)
    # AU81: the pizzicato doubling sits out the bars where the villain Rhodes plays (bars 1-2, 4, 9-10, 12), so the motif reads
    pz.events = [(t, 0.4, pi + 12, 36) for (t, _d, pi, _v) in bass.events
                 if not any(4 * b0 <= t < 4 * b1 for (b0, b1) in ((1, 3), (4, 5), (9, 11), (12, 13)))]
    snaps = dataclasses.replace(jazz.SWING44, cross=())  # the side stick is written by hand, at velocity 28 (40 after humanising)
    jazz.brushes(perc, 17, snaps, start=0.0, seed=71, scale=0.85)
    for b in range(17):
        for pos in (1, 3):
            perc.n(4 * b + pos, 0.2, 37, 28)
    for sec in (1, 9):
        pickup(vil, R, md, 4 * sec, 40, shift=-12)
        vline(vil, 4 * sec, [V1, V2], 44, -12, 0.6)
        vline(vil, 4 * sec + 12, [W], 42, -12, 0.6)
    jazz_finish(s, 0.58, leads=('rhodes villain',))
    finish(s, 'megaslice_hq', 17, 4, (4, 4), 'loop', dict(lofi=True, restart=True))

    rep_sting('megaslice_rep', 'C', seed=82, pedal=False)
    rep_sting('megaslice_rep_dock', 'D', seed=84, pedal=True)
    victor_exit()


def story_save(s: Song, name: str, beats: float, ratio: float, leads=(), lead_cap: int = 56, straight=(), laid_ms: float = 15.0) -> float:
    """Finish a short story cue the way the loops are finished (swing, humanise, laid-back kit), palette-check it, write its
    MIDI and its manifest row. Returns the MIDI length in seconds."""
    jazz_finish(s, ratio, leads=leads, lead_cap=lead_cap, laid_ms=laid_ms, straight=straight)
    palette.check(s, name)
    PALETTE_CHECKED.append(name)
    secs = s.save(os.path.join(OUT, f'{name}.mid'), beats, (4, 4))
    MANIFEST[name] = dict(kind='story', seconds=round(secs, 3))
    return secs


# The villain's rep sting (card M2c): the HQ loop's idea cut to one phrase and a held chord. An upright bass stalks up the scale,
# a dark Rhodes plays the motif low over Cm(maj7), and the last chord is a diminished seventh that does not resolve: on C it sits
# over a low F#, which makes F#7b9, the tritone substitute for the dominant; on D (the Dock Saved variant) it is G#dim7 over the
# same held A the bid leaves hanging, which makes A7b9. AU87: at the HQ loop's own tempo and swing (`HQ_BPM`, 0.58), not 120 bpm.
REP_BPM = HQ_BPM
REP_STALK = (0, 3, 5)  # the bass's semitones above the tonic, one quarter note each from beat 0.5, then the held note on beat 3.5
REP_END = 6.0  # beats: where the held chord lets go


def villain_line(tr: Track, R, md, t: float, bars, vel: int, shift: int = 0, legato: float = 0.45) -> None:
    """The HQ villain motif (`V1`, `V2`, `W` in `megaslice`) on `tr`: bars of (scale degree | 'b5', beats) from beat `t`."""
    u = t
    for bar in bars:
        for d, dur in bar:
            if d is not None:
                pi = deg(R, 5, md) - 1 if d == 'b5' else deg(R, d, md)
                tr.n(u, dur * legato, pi + shift, vel)
            u += dur


VILLAIN_V1 = [(1, 1), (3, .5), ('b5', .5), (6, 1.5), (5, .5)]
VILLAIN_V2 = [(6, .5), (5, .5), ('b5', .5), (4, .5), (1, 2)]
VILLAIN_W = [(6, .5), (5, .5), ('b5', .5), (4, .5), (2, 1), (0, 1)]  # the motif's answer, into the turnaround


def rep_sting(name: str, key: str, seed: int, pedal: bool) -> None:
    """`megaslice_rep` (key C) and `megaslice_rep_dock` (key D, with the held A under it: `pedal`). 76 bpm, swing 0.58: beat 0.5 is
    the motif (`VILLAIN_V1` up to its held sixth), beat 3.5 the unresolved diminished chord, held to beat 6."""
    R, md = key + '4', MINOR
    s = Song(REP_BPM, 4, seed=seed)
    vil = s.track('rhodes villain', 0, GM['rhodes'], volume=110, pan=56, reverb=35, chorus=30)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=70, pan=72, reverb=40, chorus=40)
    vb = s.track('vibes', 2, GM['vibes'], volume=64, pan=40, reverb=40)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=88, reverb=20)
    perc = s.track('soft kit', 9, BRUSH, volume=80, pan=64, reverb=28)
    tn = jazz.tonic(R) % 12
    pickup(vil, R, md, 0.5, 40, shift=-12)
    villain_line(vil, R, md, 0.5, [VILLAIN_V1[:4]], 44, -12, 0.6)
    # the keys: Cm(maj7), then the diminished chord (on the tonic's flat second; on the dominant's major third for the dock)
    dim_off = 11 if pedal else 1
    for t, d, off, q, v in ((0.5, 2.8, 0, 'min(maj7)', 36), (3.5, REP_END - 3.5, dim_off, 'dim7', 38)):
        for k, pi in enumerate(jazz.voicing_off(R, off, q, 55, jazz.SIMPLE)):
            rh.n(t + 0.018 * k, d - 0.018 * k, pi, v - 2 * k)
    top = jazz.voicing_off(R, dim_off, 'dim7', 62)
    vb.n(3.5, REP_END - 3.6, [top[1] + 12, top[2] + 12], 36)
    # the stalking bass: a minor third and a fourth up, then it lands and holds the tritone (the fifth, for the dock)
    for i, o in enumerate(REP_STALK):
        bass.n(0.5 + i, 0.8, 36 + tn + o, 60 + (4 if i == 0 else 0))
    bass.n(3.5, REP_END - 3.5, 36 + tn + (7 if pedal else 6), 58)
    if pedal:  # the held A of the bid, under everything
        ped = s.track('pedal', 4, GM['warm_pad'], volume=72, reverb=50)
        ped.n(0.5, REP_END - 1.2, [p('A2'), p('A3')], 40)
    snaps = dataclasses.replace(jazz.SWING44, cross=())  # the side stick is written by hand, at velocity 28
    jazz.brushes(perc, 2, snaps, start=0.5, seed=seed, scale=0.85)
    for pos in (1.5, 3.5, 5.5):
        perc.n(pos, 0.2, 37, 28)
    perc.events = [e for e in perc.events if e[0] < REP_END - 0.01]
    story_save(s, name, REP_END + 0.2, 0.58, leads=('rhodes villain',))


def victor_exit() -> None:
    """Victor's exit (card M2c): a vibraphone run falls a step at a time and an upright bass note sags a whole step onto the one
    low note that ends it. 90 bpm, 4.8 beats."""
    R, md = 'C4', MINOR
    s = Song(90, 4, seed=83)
    vb = s.track('vibes', 0, GM['vibes'], volume=100, pan=56, reverb=40)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=96, reverb=25)
    run = [deg(R, d, md) for d in (8, 7, 6, 5, 4, 3, 2, 1)]  # C5 down to C4 in the scale, eighths
    for i, pi in enumerate(run):
        vb.n(0.5 * i, 0.45, pi, 62 - 3 * i)
    bass.n(2.0, 2.6, 38, 74)  # D2, then the bend: two semitones down onto C2
    for k in range(7):
        bass.bends.append((2.25 + k * 0.1, int(-8192 * k / 6)))
    bass.bends.append((4.6, 0))
    story_save(s, 'victor_exit', 4.8, 0.58, leads=('vibes',), lead_cap=62)


def reunion():
    """AU13 industrial-4 p2, card M2c: a solo nylon guitar states the motif in F at 60 bpm, a soft vibraphone (velocity 50 or
    under) answers with the closing phrase where the sax did, then both play it through over a warm pad. The quietest cue."""
    R, md = 'F4', MAJOR
    s = Song(60, 4, seed=91)
    gt = s.track('nylon', 0, GM['nylon'], volume=100, pan=50, reverb=70)
    vb = s.track('vibes', 1, GM['vibes'], volume=84, pan=78, reverb=70)
    pad = s.track('warm pad', 2, GM['warm_pad'], volume=60, reverb=80)
    pickup(gt, R, md, 0.5, 52, shift=-12)
    melody(gt, R, [M.MOTIF], md, 0.5, 4, vel=58, legato=1.0, shift=-12)
    melody(vb, R, [M.CLOSE], md, 4.5, 4, vel=44, legato=1.0)
    melody(gt, R, [M.MOTIF, M.CLOSE], md, 8.5, 4, vel=60, legato=1.0, shift=-12)
    melody(vb, R, [M.MOTIF, M.CLOSE], md, 8.5, 4, vel=44, legato=1.0)
    pad.n(8.5, 4, M.chord_notes(R, 4, 3, md, -1), 36)
    pad.n(12.5, 3.5, M.chord_notes(R, 1, 3, md, -1), 40)
    jazz_finish(s, 0.0, leads=('nylon', 'vibes'), lead_cap=64)
    vb.events = [(t, d, pi, min(v, 50)) for (t, d, pi, v) in vb.events]  # the vibraphone never passes velocity 50
    palette.check(s, 'reunion')
    PALETTE_CHECKED.append('reunion')
    secs = s.save(os.path.join(OUT, 'reunion.mid'), 16.5)
    MANIFEST['reunion'] = dict(kind='story', seconds=round(secs, 3))


def recipe():
    """AU13 downtown-4 p3, card M2c: a solo nylon guitar, rubato (AU34: the line breathes after each long note), the motif
    at its plainest, music out. No swing, no kit."""
    R, md = 'F4', MAJOR
    s = Song(66, 4, seed=92)
    gt = s.track('nylon', 0, GM['nylon'], volume=100, reverb=90)
    t = 0.5
    pickup(gt, R, md, t, 50, shift=-12)
    lag = 0.0
    notes = M.bar_melody(R, [M.MOTIF, M.CLOSE], md, t, 4, -12)
    for k, (u, d, pi) in enumerate(notes):
        # a slight push into the phrase, then a held breath after every long note
        hold = 0.45 if d >= 1.5 else 0.0
        accel = -0.03 if k < 3 else 0.0
        gt.n(u + lag, d * 0.98 + hold, pi, 52 + (4 if d >= 1.5 else 0))
        lag += hold + accel
    end_ = notes[-1][0] + lag + notes[-1][1]
    gt.n(end_ - 1.5, 3.6, M.chord_notes(R, 1, 3, md, -1), 40)
    jazz_finish(s, 0.0, leads=('nylon',), lead_cap=64)
    palette.check(s, 'recipe')
    PALETTE_CHECKED.append('recipe')
    secs = s.save(os.path.join(OUT, 'recipe.mid'), end_ + 2.6)
    MANIFEST['recipe'] = dict(kind='story', seconds=round(secs, 3))


def city_theme():
    """AU26, card M2b: the six neighbourhoods' front instruments take the motif in turn, a bar each, every bar its own ii-V-I,
    at Uptown's tempo and key (84 bpm, Eb), then all six play the cadence and the closing phrase over ii and V into the same
    arrival chord as the triumphs. Beat 33 is the old payoff second (23.65 s) to within 0.1 s."""
    h = HOODS['uptown']
    R, md, bpm, B = h['root'], h['mode'], h['bpm'], 4.0
    P, n_pre = 33.0, 6
    tc = P - 2 * B
    t_first = tc - n_pre * B
    order = list(HOODS)  # the build order: downtown, suburbs, waterfront, university, industrial, uptown
    leads = []
    lvol, lvel = STORY_LEAD['city_theme']
    for i, hd in enumerate(order):
        fr = STING_FRONT[hd]
        leads.append(dict(name=f'lead {hd}', program=fr['lead'], shift=fr['shift'], pan=18 + 18 * i, volume=lvol,
                          phrases=[([M.MOTIF], t_first + B * i, lvel), ([M.CADENCE_1], tc, 30), ([M.CLOSE], P - 2, 30)],
                          pickup=t_first if i == 0 else None))
    story_cue('city_theme', R, md, bpm, B, jazz.SWING44, h['swing'], h['ts'], P, n_pre, 4.0, leads, seed=95)


def splash_theme():
    """Notes R2 (Julien, 2026-11-22): "Game needs a splash screen theme song". A short non-looping story cue for the splash, in
    Downtown's language (6/8, dotted quarter 66, nylon guitar 25, swung brushes, upright bass): the city motif once over a ii-V-I
    vamp (two bars), then CLOSE68 over ii and V, into the same 6/9 arrival chord as the triumphs. Its first note is at 0 s."""
    h = HOODS['downtown']
    R, md, bpm, B = h['root'], h['mode'], h['bpm'], float(h['bar'])
    fr = STING_FRONT['downtown']
    n_pre = 2
    P = (n_pre + 2) * B
    lvol, lvel = STORY_LEAD['splash_theme']
    tc = P - 2 * B
    t_first = tc - n_pre * B
    leads = [dict(name='lead', program=fr['lead'], shift=fr['shift'], pan=64, volume=lvol,
                  phrases=[(M.M68[:2], t_first, lvel), (M.CLOSE68[:3], tc, lvel)], pickup=None)]
    story_cue('splash_theme', R, md, bpm, B, fr['feel'], h['swing'], h['ts'], P, n_pre, 4.4, leads, seed=97)


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
    splash_theme()
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(MANIFEST, f, indent=1)
    for k, v in MANIFEST.items():
        if v['kind'] == 'loop':
            print(f"{k:18s} {v['bars']:3d} bars {v['seconds']:7.2f}s")
    print(len(MANIFEST), 'cues')
    print(f'palette: {len(PALETTE_CHECKED)} cues checked ({", ".join(PALETTE_CHECKED)}), 0 errors')
