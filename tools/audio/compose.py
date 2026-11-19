"""Slice Empire score: six neighbourhood loops, story cues and per-key stingers, all from one city motif.

Lofi round 1 (2026-10-31): the neighbourhood loops and the gameplay stingers are lofi (Rhodes bed, brush kit, swing,
lower tempos); the triumphs, MegaSlice cues and story cues are unchanged.

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
import tunes

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'build', 'midi')
os.makedirs(OUT, exist_ok=True)
MANIFEST: dict = {}

GM = dict(piano=0, celesta=8, glock=9, vibes=11, marimba=12, bells=14, organ=16, accordion=21, tango_acc=23,
          nylon=24, steel=25, jazz_gtr=26, clean_gtr=27, ac_bass=32, fing_bass=33, fretless=34, syn_bass=38, strings=48,
          slow_strings=49, pizz=45, harp=46, timpani=47, trumpet=56, trombone=57, tuba=58, mute_tpt=59, horn=60,
          brass=61, tenor_sax=66, bassoon=70, clarinet=71, flute=73, whistle=78, square=80, fiddle=110,
          steel_drums=114, rhodes=4, choir=52, oohs=53, warm_pad=89, kalimba=108)
BRUSH = 40  # GM drum kit program 40 = "Brush": the soft kit under every lofi loop
BRUSH_TAP, BRUSH_SWIRL = 38, 40  # in the brush kit, the "snare" notes are brushes

# Per-neighbourhood identity (AU17). `root` is the melody's tonic (around middle C).
# Lofi round 1 (2026-10-31): every tempo drops and the swing is 56-60% (Industrial keeps its triplet shuffle, Downtown
# its 6/8 lilt). Downtown's bpm is the quarter note: dotted quarter = 66.
HOODS = {
    'downtown': dict(root='F4', mode=MAJOR, bpm=99, bar=3, ts=(6, 8), lead=GM['accordion'], swing=0.0),
    'suburbs': dict(root='G4', mode=MAJOR, bpm=86, bar=4, ts=(4, 4), lead=GM['vibes'], swing=0.58),
    'waterfront': dict(root='D4', mode=MIXO, bpm=80, bar=4, ts=(4, 4), lead=GM['marimba'], swing=0.56),
    'university': dict(root='Bb4', mode=MAJOR, bpm=76, bar=4, ts=(4, 4), lead=GM['vibes'], swing=0.58),
    'industrial': dict(root='A3', mode=MIXO, bpm=76, bar=4, ts=(4, 4), lead=GM['tenor_sax'], swing=0.667),
    'uptown': dict(root='Eb4', mode=MAJOR, bpm=84, bar=4, ts=(4, 4), lead=GM['clarinet'], swing=0.6),
}
# The win triumphs keep their shape and energy this round (owner, 2026-10-31): they stay in the old tempos and leads.
LEGACY = {
    'downtown': dict(root='F4', mode=MAJOR, bpm=126, bar=3, ts=(6, 8), lead=GM['accordion'], swing=0.0),
    'suburbs': dict(root='G4', mode=MAJOR, bpm=112, bar=4, ts=(4, 4), lead=GM['trumpet'], swing=0.0),
    'waterfront': dict(root='D4', mode=MIXO, bpm=96, bar=4, ts=(4, 4), lead=GM['fiddle'], swing=0.0),
    'university': dict(root='Bb4', mode=MAJOR, bpm=84, bar=4, ts=(4, 4), lead=GM['square'], swing=0.58),
    'industrial': dict(root='A3', mode=MIXO, bpm=92, bar=4, ts=(4, 4), lead=GM['tenor_sax'], swing=0.667),
    'uptown': dict(root='Eb4', mode=MAJOR, bpm=104, bar=4, ts=(4, 4), lead=GM['clarinet'], swing=0.6),
}
LEAD_CAP = 80  # leads never play louder than this (after humanising)
# The cues rewritten as lofi jazz so far. `finish()` runs the palette check (palette.py) on each; later cards add theirs,
# card M2c makes it every cue.
JAZZ = {'downtown', 'downtown_sparse', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown', 'megaslice_hq'}
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


def jazz_finish(s: Song, ratio: float, leads=(), lead_cap: int = 56, laid_ms: float = 15.0, straight=()):
    """The jazz loop finish, in this order: swing every subdivision (`swing_smooth`, none at ratio 0), humanise (timing
    +-6 ms, velocity +-10, kit velocity +-12, leads capped at `lead_cap`), cut the notes short (`jazz.articulate`), then lay the kit
    and bass back (`jazz.laid_back`)."""
    swing_smooth([tr for tr in s.tracks if tr.name not in straight], ratio)
    s.humanize_ms(6, 10, 12, cap={n: lead_cap for n in leads})
    jazz.articulate(s.tracks)  # notes round R1-2: shorter notes
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


def play_tune(lines, voices: dict, root, B: float, bar_offset: float = 0.0) -> None:
    """Notes round R1-3: place a loop's lines (`tunes.<LOOP>`) on its tracks. `voices` maps a voice name to
    (track, base velocity, legato, shift in semitones)."""
    for (bar, voice, text, beat, soft) in lines:
        if voice not in voices:  # the sparse chart leaves some voices out
            continue
        tr, vel, legato, shift = voices[voice]
        tunes.place(tr, root, text, bar * B + beat + bar_offset, vel, legato, shift, soft)


def tune_check(name: str, full: jazz.Harmony, B: float, lead_tracks, mark: list, free_bars, motif: str | None = None,
               voices_text=None) -> None:
    """Notes round R1-3 build checks for one loop's lines. (1) the chord-tone clash check (AU78) over every note the lines
    added; (2) no lead note starts in a lead-free bed bar (a pick-up in the last beat of the bar before a lead section is
    allowed); (3) `motif`, if given, is stated at most twice in `voices_text`; (4) the lead tracks' notes stay in the range 48..96."""
    clash_assert(name, full, 0.0, mark)
    if os.environ.get('TUNES'):  # print the notes that are on a beat or held and are not in the chord (not an error)
        notes = [(u, d, pi) for (tr, n) in mark for (u, d, pi, _v) in tr.events[n:]]
        for line in tunes.analyse(name, full, notes, 0.0, B):
            if line.endswith('??'):
                print(line)
    free = set(free_bars)
    for tr in lead_tracks:
        for (u, _d, pi, _v) in tr.events:
            b = int(u // B + 1e-9)
            if b in free:
                last_of_run = (b + 1) not in free
                if not (last_of_run and u >= (b + 1) * B - 1.0 - 1e-9):
                    raise AssertionError(f'{name}: lead track {tr.name!r} plays at beat {u} in bar {b}, a lead-free bed')
            assert 48 <= pi <= 96, f'{name}: {tr.name} note {pi} out of range at beat {u}'
    if motif:
        n = sum(tunes.count('C4', t, motif) for t in (voices_text or []))
        assert n <= 2, f'{name}: the theme is stated {n} times (at most 2)'


def cut(track: Track, t0: float, t1: float) -> None:
    """Drop-out: remove every note that starts in [t0, t1) beats from `track`."""
    track.events = [e for e in track.events if not (t0 - 1e-9 <= e[0] < t1 - 1e-9)]


def finish(song: Song, name: str, bars: int, bar_beats: float, ts, kind: str, extra=None):
    beats = bars * bar_beats
    if name in JAZZ:
        song.tight = True  # notes round R1-2: short releases, half the reverb and chorus sends (mlib.Song.save)
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
    """Downtown, lofi jazz (card M1a; the tune is notes round R1-3). F major, 6/8, dotted quarter = 66, 52 bars. Rhodes comping is
    the centre; the nylon guitar plays the tune (`tunes.DOWNTOWN`: the lilt, its answer a third up, a development in quarter notes
    across the dotted pulse, a close; a B in two halves, the second a step higher; the lilt again and a coda) and a celesta fills
    its rests; a warm pad sits very low, an upright bass plays the 6/8 two-feel and rests for the last bar of the A, the bed and
    the B's first half. The sparse chart (AU20) is the nylon guitar and Rhodes on the same timeline and the same barRoots."""
    h = HOODS['downtown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=11)
    lead = s.track('nylon melody', 0, GM['nylon'], volume=112 if not sparse else 84, pan=80, reverb=40)
    arp = s.track('nylon arpeggio', 1, GM['nylon'], volume=96, pan=76, reverb=40)
    cel = s.track('celesta', 2, GM['celesta'], volume=64, pan=40, reverb=45)
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
    free_bars = []
    for sec, hm, mel in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        if quiet:
            free_bars += range(bar_i, bar_i + nb)
        dens = dict(antic_p=0.1, answer_p=0.4) if quiet else (            # comping density: thin under the quarter-note
            dict(antic_p=0.15, answer_p=0.3) if 12 <= bar_i < 16 else (   # development, fuller under the B
                dict(antic_p=0.4, answer_p=0.85) if 24 <= bar_i < 40 else {}))
        jazz.comp(rh, hm, jazz.F68, start=t, seed=11 + bar_i, vel=40 if quiet else 44, **dens)
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
        t += nb * B
        bar_i += nb
    if not sparse:
        for b in (7, 23, 39):  # the bass rests: the last bar of the A, of the bed and of the B's first half
            cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(lead, cel)
    voices = dict(ng=(lead, 58, 0.9, 0), cel=(cel, 40, 0.9, 0))
    play_tune(tunes.DOWNTOWN, voices, R, B)
    tune_check('downtown', full, B, [lead], mark, free_bars, motif=tunes.D_THEME,
               voices_text=[x[2] for x in tunes.DOWNTOWN if x[1] == 'ng'])
    if sparse:  # AU20: before Nonna takes over, just the nylon guitar and the Rhodes
        s.tracks = [lead, arp, rh]
    jazz_finish(s, 0.0, leads=('nylon melody',), lead_cap=72)
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
    """Suburbs, lofi jazz (card M1b; the tune is notes round R1-3). G major, 86 bpm, 58% swing, 32 bars. The vibraphone and the clean
    jazz guitar trade the tune (`tunes.SUBURBS`: theme S on the vibraphone, the guitar answering; a B that rises in sequence on the
    guitar and is answered by the vibraphone; a march of one-bar trades; theme S again with the guitar a third under the resolve) over
    Rhodes comping; the glockenspiel is down to single notes at velocity 40 or under. Upright bass in a two-feel that rests for the last
    bar of the A and of each bed, walking through the B and the march. The kit is the swung backbeat."""
    h = HOODS['suburbs']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=21)
    vib = s.track('vibraphone', 0, GM['vibes'], volume=110, pan=60, reverb=45)
    gtr = s.track('clean guitar', 1, GM['jazz_gtr'], volume=110, pan=84, reverb=32)
    glk = s.track('glockenspiel', 2, GM['glock'], volume=50, pan=40, reverb=55)
    rh = s.track('rhodes', 4, GM['rhodes'], volume=82, pan=50, reverb=45, chorus=40)
    bass = s.track('bass', 3, GM['ac_bass'], volume=88, reverb=15)
    perc = s.track('soft kit', 9, BRUSH, volume=84, pan=64, reverb=25)

    sections = suburbs_chart()
    full = jazz.Harmony('G', B)
    for (_, hm, _m, _w) in sections:
        full = full + hm
    s.bar_roots = full.roots
    a_first = jazz.Harmony('G', B, sections[1][1][:1])
    t, bar_i = 0.0, 0
    walk_from = None
    free_bars = []
    for k, (sec, hm, mel, w) in enumerate(sections):
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        if quiet:
            free_bars += range(bar_i, bar_i + nb)
        dens = dict(antic_p=0.1, answer_p=0.25) if quiet else (
            dict(antic_p=0.2, answer_p=0.5) if sec == 'B' else dict(antic_p=0.15, answer_p=0.4))  # R1 note: too busy
        jazz.comp(rh, hm, jazz.SWING44, start=t, seed=21 + bar_i, vel=40 if quiet else 46, **dens)
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
        t += nb * B
        bar_i += nb
    for b in (7, 11, 27):  # the bass rests for the last bar of the A, of the first bed and of the return
        cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(vib, gtr)
    voices = dict(vib=(vib, 54, 0.9, 0), gtr=(gtr, 52, 0.8, 0))
    play_tune(tunes.SUBURBS, voices, R, B)
    tune_check('suburbs', full, B, [vib, gtr], mark, free_bars, motif=tunes.S_THEME,
               voices_text=[x[2] for x in tunes.SUBURBS])
    bm = jazz.Harmony('G', B)
    for (sec, hm, _m, _w) in sections:
        if sec in ('B', 'march'):
            bm = bm + hm
    walk_into(bass, bm, a_first, jazz.SWING44, walk_from, seed=5, vel=62)
    jazz_finish(s, h['swing'], leads=('vibraphone', 'clean guitar'), lead_cap=68)
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
    """Waterfront, lofi jazz (card M1b; the tune is notes round R1-3). D Mixolydian, 80 bpm, 56% swing, 32 bars. A harp calls and a
    marimba answers (`tunes.WATERFRONT`: the A hangs on the 13th; the B is the marimba's dotted turn, then the harp's long line over the
    Lydian bar; the A again with an answer that comes home to D; a marimba coda in whole notes) over Rhodes comping and a soft marimba
    arpeggio (which rests in the B and the coda); the bass is a half-note two-feel that plays the habanera's dotted figure in the first
    half of every second bar and rests for the last bar of each A; shaker and brushes."""
    h = HOODS['waterfront']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=31)
    harp = s.track('harp', 0, GM['harp'], volume=112, pan=44, reverb=48)
    mar = s.track('marimba', 1, GM['marimba'], volume=112, pan=76, reverb=40)
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
    free_bars = []
    for sec, hm, mel, w in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed')
        if quiet:
            free_bars += range(bar_i, bar_i + nb)
        dens = dict(antic_p=0.1, answer_p=0.4) if quiet else (dict(antic_p=0.4, answer_p=0.85) if sec == 'B' else {})
        jazz.comp(rh, hm, jazz.SWING44, start=t, seed=31 + bar_i, vel=40 if quiet else 46, **dens)
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
        t += nb * B
        bar_i += nb
    cut(arp, 24 * B, 28 * B)  # the coda is the marimba alone over the keys
    free_bars = [b for b in free_bars if not 24 <= b < 28]
    for b in (7, 23):  # the bass rests for the last bar of each A
        cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(harp, mar)
    voices = dict(harp=(harp, 52, 0.9, 0), mar=(mar, 50, 0.7, 0))
    play_tune(tunes.WATERFRONT, voices, R, B)
    tune_check('waterfront', full, B, [harp, mar], mark, free_bars, motif=tunes.W_CALL,
               voices_text=[x[2] for x in tunes.WATERFRONT])
    jazz_finish(s, h['swing'], leads=('harp', 'marimba'), lead_cap=64)
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
    """University, lofi jazz (card M1b; the tune is notes round R1-3). B-flat major, 76 bpm, 60% swing, 32 bars. Rhodes with maj9 and
    min9 chords. The tune (`tunes.UNIVERSITY`) is a hook: repeated F5, a drop to D5 and back, a rest on the downbeat. The kalimba plays
    it in the A, a vibraphone sings the B over it with a breath in every bar and the kalimba answers with the hook, a Rhodes states the
    hook at half speed over the bed, and the kalimba's last four bars let it fall away. A round electric bass that rests for the last bar
    of the A, of the first bed and of the Rhodes' statement; the kit is a lofi hip-hop pocket: kick 10 ms later than the rest of the kit."""
    h = HOODS['university']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=41)
    kal = s.track('kalimba', 0, GM['kalimba'], volume=110, pan=60, reverb=45)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=60, pan=70, reverb=50, chorus=50)
    vib = s.track('vibraphone', 2, GM['vibes'], volume=110, pan=40, reverb=55)
    shim = s.track('vibes shimmer', 5, GM['vibes'], volume=35, pan=44, reverb=55)
    rhm = s.track('rhodes melody', 6, GM['rhodes'], volume=60, pan=56, reverb=50, chorus=50)
    bass = s.track('bass', 3, GM['fing_bass'], volume=63, reverb=10)
    perc = s.track('soft kit', 9, BRUSH, volume=60, pan=64, reverb=22)

    sections = university_chart()
    full = jazz.Harmony('Bb', B)
    for (_, hm, _m, _w) in sections:
        full = full + hm
    s.bar_roots = full.roots
    t, bar_i = 0.0, 0
    free_bars = []
    for sec, hm, mel, w in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed', 'tail')
        if sec in ('intro', 'bed'):
            free_bars += range(bar_i, bar_i + nb)
        if quiet:
            dens = dict(antic_p=0.1, answer_p=0.35)
        elif sec == 'A':
            dens = dict(antic_p=0.15, answer_p=0.4)  # the hook leaves the downbeat free: the keys keep out of its way
        else:
            dens = {}
        jazz.comp(rh, hm, HIPHOP, start=t, seed=41 + bar_i, vel=44 if quiet else 50, strum=0.045, **dens)
        jazz.bass_two_feel(bass, hm, HIPHOP, start=t, vel=58 if quiet else 62)
        jazz.brushes(perc, nb, HIPHOP, start=t, seed=51 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        if sec != 'intro':  # a soft vibraphone shimmer, the top note of each whole-bar chord
            for (u, ch) in hm.chords(t):
                if ch.beats >= 4:
                    shim.n(u, ch.beats * 0.9, jazz.voicing_off(R, ch.off, ch.q)[-1] + 12, 24)
        t += nb * B
        bar_i += nb
    free_bars = [b for b in free_bars if not 20 <= b < 24]  # the Rhodes states the hook over the first four bars of the second bed
    # the Rhodes' statement: the comp of those four bars is one soft chord a bar, no answers, so the hook has room
    rh.events = [e for e in rh.events if not (20 * B <= e[0] < 24 * B)]
    jazz.comp(rh, jazz.Harmony('Bb', B, list(full)[20:24]), HIPHOP, start=20 * B, seed=41 + 20, vel=40, strum=0.045, antic_p=0.0, answer_p=0.0)
    for b in (7, 11, 23):  # the bass rests for the last bar of the A, of the first bed and of the Rhodes' statement
        cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(kal, vib, rhm)
    voices = dict(kal=(kal, 46, 0.85, 0), vib=(vib, 46, 0.85, 0), rhm=(rhm, 50, 0.85, 0))
    play_tune(tunes.UNIVERSITY, voices, R, B)
    tune_check('university', full, B, [kal, vib, rhm], mark, free_bars, motif=tunes.U_HOOK,
               voices_text=[x[2] for x in tunes.UNIVERSITY])
    jazz_finish(s, 0.60, leads=('kalimba', 'vibraphone', 'rhodes melody'), lead_cap=50, laid_ms=18.0)  # 60%: the HOODS 58% stays for the stingers
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
    """Industrial, lofi jazz (card M1c; the tune is notes round R1-3). A, 76 bpm, triplet shuffle (66.7%), 36 bars = three 12-bar
    choruses of a jazz blues. A muted Rhodes and a clean guitar comp. Chorus 1 has no lead (the guitar's six-note riff on the I and
    the IV). In chorus 2 the vibraphone calls and the guitar answers low (`tunes.INDUSTRIAL`: a riff up the A9 to a long G, the same call a
    fourth up on the IV, the call again displaced by a half beat, a turnaround one note a beat); in chorus 3 the flute takes the theme
    over a warm pad, the vibraphone fills the gaps between its phrases, and the flute closes alone. The upright bass is in a two-feel in
    chorus 1 and walks in 2 and 3; it rests for the last bar of choruses 1 and 2."""
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

    riff_bars = (0, 4)
    for chorus in range(3):
        t = chorus * 12 * B
        quiet = chorus == 0
        dens = dict(antic_p=0.1, answer_p=0.4) if quiet else ({} if chorus == 1 else dict(antic_p=0.3, answer_p=0.8))
        jazz.comp(rh, one, jazz.SHUFFLE, start=t, seed=51 + 12 * chorus, vel=40 if quiet else 44, **dens)
        stabs(gtr, one, t, vel=28 if quiet else 32, skip_bars=riff_bars if quiet else ((2,) if chorus == 1 else ()))
        if quiet:
            jazz.bass_two_feel(bass, one, jazz.SHUFFLE, start=t, vel=56)
            for k in riff_bars:  # chorus 1: a six-note guitar riff on the I and the IV, no lead
                ch = one[k][0]
                r = 57 + (((p(h['root']) + ch.off) - 57) % 12)
                for i, iv in enumerate((0, 3, 4, 7, 9, 7)):
                    gtr.n(t + k * B + 0.5 * i, 0.4, r + iv, 40)
        jazz.brushes(perc, 12, jazz.SHUFFLE, start=t, seed=61 + 12 * chorus, scale=0.85 if quiet else 1.0, bar0=12 * chorus)
        if chorus == 2:  # a warm pad under the first 8 bars of chorus 3
            for (u, ch) in one.chords(t):
                if u < t + 8 * B:
                    for q in jazz.voicing_off(R, ch.off, ch.q)[:3]:
                        pad.n(u, ch.beats * 1.02, q, 28)
    walk = one + one
    walk_start = 12 * B
    jazz.bass_walk(bass, walk, jazz.SHUFFLE, start=walk_start, seed=5, vel=60)
    for b in (11, 23):  # the bass rests for the last bar of choruses 1 and 2
        cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(vib, flt, gtr)
    voices = dict(vib=(vib, 40, 0.9, 12), flt=(flt, 40, 0.9, 12), gtr=(gtr, 40, 0.8, 0))
    play_tune(tunes.INDUSTRIAL, voices, R, B)
    tune_check('industrial', full, B, [vib, flt], mark, range(12), motif=tunes.I_RIFF,
               voices_text=[x[2] for x in tunes.INDUSTRIAL])
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
    """Uptown, lofi jazz (card M1c; the tune is notes round R1-3). E-flat, 84 bpm, 60% swing, 32 bars. A nylon guitar plays the theme
    (`tunes.UPTOWN`: a broken Eb6 in eighths that lands on the 6th, then a turn down to a long Bb; a B of long notes with the first one
    late, its second half traded between the harp and the guitar; the theme again with a rising run and a high resolve), a piano comps,
    the manouche "pompe" is a jazz guitar on 2 and 4 at velocity 42 or under, and the harp has the 8-bar tag alone. A walking upright
    bass that rests for the last bar of the A and of the bed; brushes."""
    h = HOODS['uptown']
    R, md, B = h['root'], h['mode'], h['bar']
    s = Song(h['bpm'], B, seed=61)
    mel = s.track('nylon melody', 0, GM['nylon'], volume=112, pan=56, reverb=42)
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

    t, bar_i = 0.0, 0
    free_bars = []
    for sec, hm, ml in sections:
        nb = len(hm)
        quiet = sec in ('intro', 'bed', 'tag')
        if sec in ('intro', 'bed'):
            free_bars += range(bar_i, bar_i + nb)
        dens = dict(antic_p=0.1, answer_p=0.4) if quiet else {}
        jazz.comp(pno, hm, jazz.SWING44, start=t, seed=61 + bar_i, vel=38 if quiet else 44, **dens)
        stabs(pompe, hm, t, vel=30 if quiet else 32, dur=0.3, near=58)
        jazz.brushes(perc, nb, jazz.SWING44, start=t, seed=71 + bar_i, scale=0.85 if quiet else 1.0, bar0=bar_i)
        t += nb * B
        bar_i += nb
    jazz.bass_walk(bass, full, jazz.SWING44, start=0.0, seed=7, vel=60)
    for b in (7, 19):  # the bass rests for the last bar of the A and of the bed
        cut(bass, b * B, (b + 1) * B)
    mark = lead_mark(mel, harp)
    voices = dict(ng=(mel, 60, 0.85, 0), hp=(harp, 50, 1.0, 0))
    play_tune(tunes.UPTOWN, voices, R, B)
    tune_check('uptown', full, B, [mel, harp], mark, free_bars, motif=tunes.T_THEME,
               voices_text=[x[2] for x in tunes.UPTOWN])
    jazz_finish(s, h['swing'], leads=('nylon melody', 'harp'), lead_cap=72)
    return finish(s, 'uptown', int(t // B), B, h['ts'], 'loop', dict(hood='uptown', lofi=True))


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


def rh_bed(rh, R, md, harm, t0, B, vel):
    """Rhodes chords under a stinger: one rolled chord per harmony segment (a held voicing, not a strum)."""
    for (u, beats, d, size) in segs(harm, t0, B):
        rh_hit(rh, u, rh_voicing(R, d, md), beats * 0.95, vel)


def mallet_swell(s: Song, R, md, t_from, t_to, peak=96):
    """A soft mallet swell (replaces the timpani roll): vibraphone root and fifth held under a rising expression
    curve, then a single low, soft timpani thump on the arrival."""
    vib = s.track('swell', 6, GM['vibes'], volume=84, reverb=40)
    root = deg(R, 1, md) - 12
    n_ = max(2, int((t_to - t_from) * 4))
    vib.n(t_from, t_to - t_from + 1.2, [root, root + 7], 46)
    for i in range(n_ + 1):
        vib.ccs.append((t_from + (t_to - t_from) * i / n_, 11, int(30 + (peak - 30) * (i / n_) ** 1.5)))
    vib.ccs.append((t_to + 0.6, 11, 60))
    tim = s.track('thump', 7, GM['timpani'], volume=80, reverb=40)
    tim.n(t_to, 1.5, deg(R, 1, md) - 24, 54)


def brush_swirl(s: Song, t_from, t_to, v0=60, v1=104):
    """A brush-swirl crescendo into the arrival bar: a swirl every half beat, rising. Its own track, so it stays even."""
    sw = s.track('swirl', 9, BRUSH, volume=93, reverb=30)
    n_ = max(2, int(round((t_to - t_from) * 2)))
    for i in range(n_):
        sw.n(t_from + (t_to - t_from) * i / n_, 0.5, BRUSH_SWIRL, int(v0 + (v1 - v0) * i / (n_ - 1)))


def bell_program(hood: str) -> int:
    """The bell colour the bed lacks: glockenspiel, except in Suburbs, whose loop already has one (then celesta)."""
    return GM['celesta'] if hood == 'suburbs' else GM['glock']


def stingers(hood: str):
    h = HOODS[hood]
    R, md, bpm = h['root'], h['mode'], h['bpm']
    ph = phrases(h)
    B = ph['B']
    bellp = bell_program(hood)
    for kind in STING_KINDS:
        s = Song(bpm, B, seed=sum(map(ord, kind)))
        ld = s.track('lead', 0, h['lead'], volume=96, reverb=38)
        rh = s.track('rhodes', 4, GM['rhodes'], volume=88, pan=56, reverb=32, chorus=30)
        t0 = T0

        def bell_double(bars, vel=50, legato=0.8, pick=True):
            """AU62: a bell an octave above the lead at ~velocity 50, a colour the loop's bed doesn't have."""
            bl = s.track('bell', 5, bellp, volume=84, reverb=40)
            if pick:
                pickup(bl, R, md, t0, vel, 12)
            melody(bl, R, bars, md, t0, B, vel=vel, legato=legato, shift=12)
            return bl

        if kind == 'bottleneck':  # 1 bar: just the opening phrase and a bell (no Rhodes chord: it only waits a beat, so it
            s.tracks.remove(rh)   # would often land on the loop's IV or V chord: AU62)
            pickup(ld, R, md, t0, 54)
            melody(ld, R, ph['open'], md, t0, B, vel=62, legato=0.8)
            bell_double(ph['open'], 46)
            end = t0 + B + 1
        elif kind in ('milestone', 'milestone_big'):  # opening + closing as a cadence over a I–V–I Rhodes bed
            pickup(ld, R, md, t0, 58)
            melody(ld, R, ph['motif'], md, t0, B, vel=70)
            rh_bed(rh, R, md, ph['harm_motif'], t0, B, 50)
            bell_double(ph['motif'])
            nb = len(ph['motif'])
            arrive = t0 + (nb - 1) * B
            roll_from = t0 + (nb - 2) * B + (B / 2 if nb == 2 else 0)
            if kind == 'milestone_big':  # a longer, louder brush crescendo, a mallet swell, then bass root and celesta on arrival (AU65)
                brush_swirl(s, t0 + (nb - 2) * B, arrive, 64, 112)
                mallet_swell(s, R, md, roll_from, arrive)
                bs = s.track('bass', 3, GM['ac_bass'], volume=96, reverb=20)
                bs.n(arrive, 2.5, deg(R, 1, md) - 24, 72)
                ce = s.track('bell arrival', 8, GM['celesta'], volume=88, reverb=45)
                ce.n(arrive, 2.5, [deg(R, 1, md) + 12, deg(R, 5, md) + 12], 66)
            else:
                brush_swirl(s, roll_from, arrive)
            end = t0 + nb * B
        elif kind == 'manager':  # warm, resolving: cadence then closing phrase over Rhodes (ii–V–I)
            melody(ld, R, ph['cad'], md, t0, B, vel=64)
            rh_bed(rh, R, md, ph['harm_cad'], t0, B, 46)
            bell_double(ph['cad'], 46, pick=False)
            nb = len(ph['cad'])
            rh_hit(rh, t0 + (nb - 1) * B, [deg(R, 1, md) - 12] + rh_voicing(R, 1, md), B, 40)
            brush_swirl(s, t0 + (nb - 2) * B + (B / 2 if nb == 2 else 0), t0 + (nb - 1) * B)
            end = t0 + nb * B
        elif kind in ('upgrade', 'fleet', 'drone'):  # opening phrase with a rising Rhodes lift; fleet horn; drone square
            if kind == 'drone':
                s.tracks.remove(ld)
                ld = s.track('lead', 0, GM['square'], volume=80, reverb=38)
            pickup(ld, R, md, t0, 56)
            melody(ld, R, ph['open'], md, t0, B, vel=64, legato=0.8)
            ld.n(t0 + B, B * 0.6, deg(R, 5, md), 60)
            bl = bell_double(ph['open'], 48)
            bl.n(t0 + B, B * 0.6, deg(R, 5, md) + 12, 46)
            for i, q in enumerate(M.chord_notes(R, 1, 3, md, -1) + [deg(R, 1, md)]):  # the lift: a rising arpeggio
                rh.n(t0 + 0.5 * i, 0.9, q, 38 + 3 * i)
            if kind == 'fleet':
                hn = s.track('horn', 2, GM['horn'], volume=84, reverb=40)
                hn.n(t0 + B, 0.25, deg(R, 5, md) - 12, 62)  # beep
                hn.n(t0 + B + 0.5, 0.8, deg(R, 5, md) - 12, 66)  # beeeep
            if kind == 'drone':
                arp = s.track('arp', 3, GM['square'], volume=70, reverb=38)
                for i in range(8):
                    arp.n(t0 + B + 0.125 * i, 0.1, deg(R, 1 + (i % 4) * 2, md) + 12, 44)
            end = t0 + 2 * B
        elif kind == 'build':  # a new pizzeria opens: its neighbourhood's lead states the motif with soft claps
            pickup(ld, R, md, t0, 58)
            melody(ld, R, ph['motif'], md, t0, B, vel=70)
            hp = s.track('bell', 1, bellp, volume=64, reverb=50)
            melody(hp, R, ph['open'], md, t0, B, vel=46, shift=12)
            rh_bed(rh, R, md, ph['harm_motif'], t0, B, 46)
            nb = len(ph['motif'])
            clp = s.track('soft claps', 9, BRUSH, volume=70, reverb=25)
            for k in range(int((nb - 1) * B)):
                clp.n(t0 + k, 0.1, CLAP, 42 if k % 2 == 0 else 34)
                clp.n(t0 + k, 0.06, RIM, 28)
            end = t0 + nb * B
        elif kind == 'welcome':  # character sting (story beat 1)
            pickup(ld, R, md, t0, 54)
            melody(ld, R, ph['open'] + [[(5, B - 1), (None, 1)]], md, t0, B, vel=66)
            bell_double(ph['open'] + [[(5, B - 1), (None, 1)]], 44)
            for i, q in enumerate(M.chord_notes(R, 1, 3, md, -1) + M.chord_notes(R, 1, 3, md, 0)):  # the roll, on Rhodes
                rh.n(t0 + 0.1 * i, 2, q, 40)
            end = t0 + 2 * B + 1
        elif kind == 'warmth':  # beat 2: the closing phrase, softer, over a Rhodes pad
            melody(ld, R, ph['cad'], md, t0, B, vel=58)
            bell_double(ph['cad'], 40, pick=False)
            rh_bed(rh, R, md, ph['harm_cad'], t0, B, 40)
            end = t0 + len(ph['cad']) * B
        elif kind == 'perk':  # perk card (AU13): the opening phrase on a bell and Rhodes, in this key (AU26)
            s.tracks.remove(ld)
            gl = s.track('glock', 0, bellp, volume=90, reverb=50)
            pickup(gl, R, md, t0, 54, 12)
            for tr, v, sh in ((gl, 68, 12), (rh, 46, 0)):
                melody(tr, R, ph['open'], md, t0, B, vel=v, legato=1.2, shift=sh)
            end = t0 + B + 1
        else:  # offline popup opens (AU15/AU30): the closing phrase on celesta over a soft Rhodes chord
            s.tracks.remove(ld)
            ce = s.track('celesta', 0, GM['celesta'], volume=88, reverb=50)
            melody(ce, R, ph['cad'][1:2], md, t0, B, vel=54, legato=1.1, shift=12)
            rh_hit(rh, t0, rh_voicing(R, 1, md), B, 36)
            end = t0 + B + 1
        swing_smooth([tr for tr in s.tracks if tr.name not in ('arp', 'swell', 'thump', 'swirl', 'soft claps')], h['swing'])  # rolls stay even (AU48)
        s.humanize_ms(5, 4, 6, cap={'lead': LEAD_CAP})
        name = f'sting_{hood}_{kind}'
        # AU73: the bell (glockenspiel / celesta) is its own stem. build.py saturates the body and mixes the bell in
        # afterwards, so a bass or Rhodes peak can't drive the tanh through the bell, and the bell keeps its top end.
        bells = [tr for tr in s.tracks if tr.name.startswith('bell')]
        extra = {}
        if bells:
            s.tracks = [tr for tr in s.tracks if tr not in bells]
            s.save(os.path.join(OUT, f'{name}.mid'), end, h['ts'])
            s.tracks = bells
            s.save(os.path.join(OUT, f'{name}__bell.mid'), end, h['ts'])
            MANIFEST[f'{name}__bell'] = dict(kind='stem', of=name)
            extra['bellStem'] = f'{name}__bell'
        else:
            s.save(os.path.join(OUT, f'{name}.mid'), end, h['ts'])
        # musicSeconds: where the music ends (the duck and the gate hold this long, not the reverb tail: AU53)
        MANIFEST[name] = dict(kind='stinger', hood=hood, cue=kind, bpm=bpm, downbeatSeconds=round(t0 * 60 / bpm, 4),
                              seconds=round(end * 60 / bpm, 3), musicSeconds=round(end * 60 / bpm, 3), lofi=True, **extra)


def bid_sting():
    """AU27: Pier 9 bid. A held V7 on Rhodes under a soft mallet swell, no resolution: waterfront-4 resolves it."""
    h = HOODS['waterfront']
    R, md = h['root'], MAJOR  # a true dominant 7th, not Mixolydian's minor v
    s = Song(h['bpm'], 4, seed=5)
    rh = s.track('rhodes', 0, GM['rhodes'], volume=92, reverb=40, chorus=30)
    v7 = M.chord_notes(R, 5, 4, md, -1)
    rh_hit(rh, 0.6, v7 + [deg(R, 2, md)], 3.4, 56, strum=0.06)
    vib = s.track('swell', 1, GM['vibes'], volume=84, reverb=40)
    vib.n(0.6, 3.6, [deg(R, 5, md) - 12, deg(R, 5, md)], 44)
    for i in range(12):
        vib.ccs.append((0.6 + 0.2 * i, 11, int(30 + 70 * (i / 11) ** 1.5)))
    tim = s.track('thump', 2, GM['timpani'], volume=80, reverb=40)
    tim.n(0.6, 2.0, deg(R, 5, md) - 24, 52)
    s.save(os.path.join(OUT, 'sting_waterfront_bid.mid'), 4.2)
    # musicSeconds: Dock Saved's villain sting comes in as the A7 hangs, not after the whole ring-out (AU57)
    MANIFEST['sting_waterfront_bid'] = dict(kind='stinger', hood='waterfront', cue='bid', bpm=h['bpm'], downbeatSeconds=0.0,
                                            seconds=round(4.2 * 60 / h['bpm'], 3), musicSeconds=2.6, lofi=True)




def groove(hood: str, s: Song, harm, t0: float, B: float, bars: int):
    """Each neighbourhood's own rhythm section under the triumph's brass (AU35)."""
    h = LEGACY[hood]  # the triumphs keep the old tempo and lead (lofi round 1 leaves them alone)
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
    h = LEGACY[hood]  # the triumphs keep the old tempo and lead (lofi round 1 leaves them alone)
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
    drm0.n(end_, 3, CRASH, 96)  # AU64: was 124; the lofi loop underneath is 12 LU quieter
    tim.n(end_, 3, deg(R, 1, md) - 24, 100)
    br.n(end_, 3, M.chord_notes(R, 1, 3, md, -1) + [deg(R, 1, md) + 12], 108)
    ld.n(end_, 3, deg(R, 1, md) + 12, 108)
    st.n(end_, 3, M.chord_notes(R, 1, 3, md, 0), 96)
    swing(s, h['swing'], [tr for tr in s.tracks if tr.name not in ('swell', 'timpani')])  # rolls stay even (AU48)
    name = f'triumph_{hood}'
    s.save(os.path.join(OUT, f'{name}.mid'), end_ + 3, h['ts'])
    MANIFEST[name] = dict(kind='story', hood=hood, seconds=round((end_ + 3) * 60 / bpm, 3), bpm=bpm, beatsPerBar=B,
                          downbeatSeconds=round(t0 * 60 / bpm, 4), payoffSeconds=round(end_ * 60 / bpm, 3))


# ================================================================================================ STORY CUES
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
    """Card M1c: HQ is a sneaky, slightly comic jazz walk (the rep stings and Victor's exit below are card M2b). C minor, 76 bpm,
    17 bars, restart. A dark Rhodes plays the villain motif low, a second Rhodes comps, an upright bass walks with a pizzicato
    doubling it an octave up, brushes keep a side stick on 2 and 4 at velocity 40 or under."""
    R, md = 'C4', MINOR
    bpm = 76
    # villain motif: 5, | 1 b3 b5 b6. 5 | b6 5 b5 4 1
    V1 = [(1, 1), (3, .5), ('b5', .5), (6, 1.5), (5, .5)]
    V2 = [(6, .5), (5, .5), ('b5', .5), (4, .5), (1, 2)]
    W = [(6, .5), (5, .5), ('b5', .5), (4, .5), (2, 1), (0, 1)]  # the motif's answer, into the turnaround

    def vline(tr, t, bars, vel, shift=0, legato=0.45):
        u = t
        for bar in bars:
            for d, dur in bar:
                if d is not None:
                    pi = deg(R, 5, md) - 1 if d == 'b5' else deg(R, d, md)
                    tr.n(u, dur * legato, pi + shift, vel)
                u += dur

    hm = hq_chart()
    s = Song(bpm, 4, seed=81)
    vil = s.track('rhodes villain', 0, GM['rhodes'], volume=110, pan=56, reverb=35, chorus=30)
    rh = s.track('rhodes', 1, GM['rhodes'], volume=70, pan=72, reverb=40, chorus=40)
    bass = s.track('upright bass', 3, GM['ac_bass'], volume=88, reverb=20)
    pz = s.track('bass pizzicato', 4, GM['pizz'], volume=70, pan=34, reverb=35)
    pe = s.track('pizzicato echo', 6, GM['pizz'], volume=84, pan=30, reverb=35)
    perc = s.track('soft kit', 9, BRUSH, volume=80, pan=64, reverb=28)
    jazz.comp(rh, jazz.Harmony('C', 4.0, list(hm)[1:]), jazz.SWING44, start=4.0, seed=81, vel=36)  # bar 0 is the bass alone
    jazz.bass_walk(bass, hm, jazz.SWING44, start=0.0, seed=9, vel=62)
    cut(bass, 8 * 4.0 + 2.0, 9 * 4.0)  # the bass stops for two beats before the villain's second tiptoe
    pz.events = [(t, 0.4, pi + 12, 36) for (t, _d, pi, _v) in bass.events]
    snaps = dataclasses.replace(jazz.SWING44, cross=())  # the side stick is written by hand, at velocity 28 (40 after humanising)
    jazz.brushes(perc, 17, snaps, start=0.0, seed=71, scale=0.85)
    for b in range(17):
        for pos in (1, 3):
            perc.n(4 * b + pos, 0.2, 37, 28)
    mark = lead_mark(vil, pe)
    voices = dict(vil=(vil, 52, 0.9, -12), pz=(pe, 46, 0.9, 0))
    play_tune(tunes.HQ, voices, R, 4.0)
    tune_check('megaslice_hq', hm, 4.0, [vil, pe], mark, (0, 5, 6, 7, 8, 13, 14, 15), motif=tunes.V_TIPTOE,
               voices_text=[x[2] for x in tunes.HQ])
    jazz_finish(s, 0.58, leads=('rhodes villain', 'pizzicato echo'), lead_cap=64)
    finish(s, 'megaslice_hq', 17, 4, (4, 4), 'loop', dict(lofi=True, restart=True))

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
    drm.n(end_, 4, CRASH, 96)  # AU64
    tim.n(end_, 3, deg(R, 1, md) - 24, 100)
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
    print(f'palette: {len(PALETTE_CHECKED)} cues checked ({", ".join(PALETTE_CHECKED)}), 0 errors')
