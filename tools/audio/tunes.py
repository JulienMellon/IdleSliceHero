"""The tunes of the eight loops (notes round R1-3, 2026-11-19: "reimagine the melodic phrasing, themes and arrangements").

Each neighbourhood has its own theme, written here as text so a phrase reads like a line of music:

    "1':1.5! 6:.5 5:1 3:1"      pitch:beats[flags], separated by spaces

pitch   a scale degree 1..7 of the major scale on the loop's root, with b or # in front for a flat or sharp ("b7", "#4"),
        and ' (up an octave) or , (down an octave) after it. "r" is a rest. "g" is a grace note: "g:b3" sounds 0.08 beat
        before the next note and takes no time.
beats   the length in quarter notes (".5" an eighth, "1.5" a dotted quarter); a note tied over the barline is just a longer note.
flags   ! accent (velocity +7), ~ soft (velocity -8), s staccato (half length)

Rhythm is written in straight eighths: the loop's swing (`compose.jazz_finish`) swings them, so a syncopated line leans the way
the kit does. A line is placed by `place`, which returns the beat it ends on. `LINES` below has, per loop, the lines in the order
they are played: (bar, voice, text, options).

`analyse` prints, for one loop, each lead note that is held a beat or more or lands on a beat, with the chord under it and
whether it is a chord tone, a tension of the chord (9, 11, 13) or outside it.
"""
from __future__ import annotations

import re

import jazz
from mlib import p

MAJOR = [0, 2, 4, 5, 7, 9, 11]
TOKEN = re.compile(r"^(r|g|[b#]*[1-7])([',]*):?([0-9.]*)([!~s]*)$")


def parse(text: str):
    """-> list of (kind, semitones above the root | None, beats, flags): kind is 'n' (note), 'r' (rest) or 'g' (grace)."""
    out = []
    for tok in text.split():
        head, _, tail = tok.partition(':')
        if head == 'g':  # grace: "g:b3"
            m = TOKEN.match(tail + ':0')
            assert m, f'bad grace {tok!r}'
            out.append(('g', _semis(m.group(1), m.group(2)), 0.0, ''))
            continue
        m = TOKEN.match(tok)
        assert m, f'bad token {tok!r} in {text!r}'
        spec, octs, beats, flags = m.groups()
        assert beats, f'no length on {tok!r}'
        if spec == 'r':
            out.append(('r', None, float(beats), ''))
        else:
            out.append(('n', _semis(spec, octs), float(beats), flags))
    return out


def _semis(spec: str, octs: str) -> int:
    acc = spec.count('#') - spec.count('b')
    d = int(spec.strip('b#'))
    return MAJOR[d - 1] + acc + 12 * (octs.count("'") - octs.count(','))


def length(text: str) -> float:
    return sum(b for (_k, _s, b, _f) in parse(text))


def events(root, text: str, t0: float, vel: int, legato: float = 0.9, shift: int = 0, soft: int = 0):
    """-> list of (start, beats, pitch, velocity) for one line starting at beat t0."""
    r = p(root) + shift
    out, t = [], t0
    pending = []
    for (kind, semi, beats, flags) in parse(text):
        if kind == 'g':
            pending.append(semi)
            continue
        if kind == 'n':
            v = vel + (7 if '!' in flags else 0) - (8 if '~' in flags else 0) - soft
            for g in pending:
                out.append((t - 0.08, 0.08, r + g, max(1, v - 16)))
            out.append((t, beats * (0.5 if 's' in flags else legato), r + semi, max(1, v)))
        pending = []
        t += beats
    return out


def place(track, root, text: str, t0: float, vel: int, legato: float = 0.9, shift: int = 0, soft: int = 0) -> float:
    for (u, d, pi, v) in events(root, text, t0, vel, legato, shift, soft):
        track.n(u, d, pi, v)
    return t0 + length(text)


def count(root, text: str, motif: str) -> int:
    """How many times `motif` (a text line) occurs in `text` as the same pitches and the same lengths (grace notes ignored)."""
    def seq(s):
        return [(k, semi, b) for (k, semi, b, _f) in parse(s) if k != 'g']
    a, m = seq(text), seq(motif)
    return sum(1 for i in range(len(a) - len(m) + 1) if a[i:i + len(m)] == m)


# --- analysis ---------------------------------------------------------------------------------------------------------
def chord_pcs(key, ch) -> tuple[set, set]:
    """(chord tones, tensions) as pitch classes: the root and the quality's intervals, and the 9th, 11th and 13th of them."""
    root = (jazz.tonic(key) + ch.off) % 12
    iv = jazz.QUALITIES[ch.q]
    tones = {root} | {(root + x) % 12 for x in iv} | {(root + (6 if ch.q in jazz.FLAT_FIFTH else 7)) % 12}
    return tones, set()


def analyse(name: str, hm, notes, t0: float, bar_beats: float, strong_only: bool = True) -> list:
    """Lines of text for the lead notes that matter: held >= 1 beat or on a beat. Marks notes outside the chord's own pitch
    classes with '??'. `notes`: (start, beats, pitch)."""
    chords = hm.chords(t0)
    out = []
    for (u, d, pi) in sorted(notes):
        on_beat = abs((u - t0) % 1.0) < 0.02 or abs((u - t0) % 1.0 - 1.0) < 0.02
        if strong_only and not (d >= 1.0 or on_beat):
            continue
        ch = next((c for (c0, c) in reversed(chords) if c0 <= u + 1e-6), None)
        if ch is None:
            continue
        tones, _ = chord_pcs(hm.key, ch)
        flag = '' if pi % 12 in tones else '??'
        out.append(f'{name} bar {int((u - t0) // bar_beats):2d} beat {((u - t0) % bar_beats):4.1f} pitch {pi} {ch.q}@{ch.off} {flag}')
    return out


# === the lines, per loop ====================================================================================================
# (bar, voice, text, beat within that bar, soft). `soft` lowers the line's velocity. The loop's chart and the voices' tracks,
# shifts and levels are in compose.py; `compose.play_tune` places these and `compose.tune_check` checks them against the chart.
def L(bar, voice, text, beat=0.0, soft=0):
    return (bar, voice, text, beat, soft)


# --- Suburbs (G, 4/4). Theme S: a dotted-quarter on the 1st, then a falling G6 arpeggio (G5 E5 D5 B4) --------------------------
S_THEME = "1':1.5! 6:.5 5:1 3:1"
SUBURBS = [
    L(3, 'vib', "5:.5", 3.5),                                                   # the pick-up
    L(4, 'vib', S_THEME + "  2:1 3:.5 5:.5 6:1.5 r:.5"),                        # A, call (vibraphone), bars 4-5
    L(6, 'gtr', "5:1.5 4:.5 3:1 2:1  3:.5 2:.5 1:2 r:1"),                       # A, response (guitar), bars 6-7
    L(12, 'gtr', "3:1.5! 5:.5 6:1 1':1  4:1.5 6:.5 1':1 2':1  r:.5 6:.5 1':1 2':2  1':1 7:.5 5:.5 4:1 3:1"),   # B: the rhythm of S rising in sequence, peak on bar 14
    L(16, 'vib', "1':3 6:1  5:2 3:2  4:1 3:1 2:1 1:1  r:1 4:.5 5:.5 7:2"),      # B: the vibraphone answers, augmented, then falls and leans on the dominant
    L(20, 'vib', "1':1.5! 5:.5 7:1 5:1"),                                       # march: the two voices trade a bar each
    L(21, 'gtr', "r:.5 4:.5 5:.5 6:.5 5:1 3:1"),
    L(22, 'vib', "2':1.5 7:.5 6:1 5:1"),
    L(23, 'gtr', "5:1 4:.5 3:.5 2:1 r:.5 5:.5"),                                # ... and the guitar's last note is the pick-up
    L(24, 'vib', S_THEME + "  2:1 3:.5 5:.5 6:1 1':1  2':1.5 1':.5 7:1 5:1  1':3 r:1"),   # A again: the theme as it was, a longer second bar, a high resolve
    L(25, 'gtr', "r:2 3:2  5:2 4:2  3:3 r:1", soft=10),                         # the guitar a third under the resolve
]

# --- Waterfront (D Mixolydian, 4/4). Theme W: a long A, a falling fifth, then a turn B-C-D (the flat 7 is the sea's colour) ---
W_CALL = "1':2! 5:1 6:.5 b7:.5  1':1.5 2':.5 3':1.5 2':.5"
WATERFRONT = [
    L(3, 'harp', "6:.5 b7:.5", 3.0),
    L(4, 'harp', W_CALL),                                                       # A, call: harp
    L(6, 'mar', "1':1 6:1 5:2  4:1 5:.5 b7:.5 6:2"),                            # A, response: marimba, hangs on the 13th
    L(12, 'mar', "5:.75! 6:.25 b7:1 1':.75 b7:.25 6:1  r:.5 6:.5 5:.75 4:.25 3:1 4:1  5:.75! 6:.25 1':1 3':.75 2':.25 1':1  1':1.5 6:.5 5:2"),   # B: the marimba's dotted turn, three bars of it, then home on A
    L(16, 'harp', "3':3 r:1  2':2 1':2  6:1 1':1 6:1 5:1  5:1 4:1 r:1 6:.5 b7:.5", soft=0),   # B: the harp sings the long line over the Lydian bar
    L(16, 'mar', "r:3 6:.5 b7:.5", soft=6),
    L(20, 'harp', W_CALL),                                                      # A again
    L(22, 'mar', "1':1 6:1 5:1 4:1  5:.5 b7:.5 1':3"),                          # ... and this time the response comes home to D
    L(24, 'mar', "3':2 1':2  2':2 b7:2  1':2 6:2  5:3 r:1", soft=6),            # coda: the theme's contour in whole notes, then bed
]

# --- University (Bb, 4/4). Theme U: repeated F5, a drop to D5, back up: the pencil tap, space on the downbeat ---------------
U_HOOK = "r:.5 5:.5 5:.5 3:.5 5:1.5 r:.5"
UNIVERSITY = [
    L(4, 'kal', U_HOOK + "  r:.5 5:.5 5:.5 6:.5 5:1 3:1  r:.5 5:.5 5:.5 4:.5 3:1 2:1  3:2 r:2"),
    L(12, 'vib', "3:1.5 r:.5 5:1 6:1  6:2 4:1 3:1  2:.5 3:.5 5:1 6:2  5:1 3:1 2:2"),                 # B: a singing line with a breath in every bar
    L(16, 'vib', "1':1.5 6:.5 5:1 3:1  4:1.5 2:.5 3:1 r:1"),
    L(18, 'kal', "r:.5 5:.5 5:.5 3:.5 4:1 3:1  2:2 r:2"),                      # B: the hook answers from the kalimba
    L(20, 'rhm', "r:1 5:1 5:1 3:1  5:3 r:1  r:1 5:1 5:1 6:1  3:3 r:1"),          # the hook at half speed on the Rhodes
    L(28, 'kal', "r:2 5:1 3:1  1:3 r:1  r:1 5:1 3:1 1:1  r:4", soft=6),         # tail: the hook's shape falls away
]

# --- Industrial (A, shuffle, three 12-bar choruses). Theme I: C#-E-G up the A9, a long G, then back to E ---------------------
I_RIFF = "r:1 3:.5 5:.5 b7:1.5! 5:.5"
INDUSTRIAL = [
    L(12, 'vib', I_RIFF + "  6:1.5 5:.5 3:1 r:1"),                              # chorus 2: the vibraphone calls ...
    L(14, 'gtr', "r:2 b7,:.5 1:.5 3:1"),                                        # ... the guitar answers low
    L(15, 'vib', "5:1 2:1 3:1 1:1"),
    L(16, 'vib', "5:1 3:.5 5:.5 1':1.5 r:.5  5:1 2:1 6:1 1:1"),                 # IV: the call a fourth up
    L(18, 'vib', "3:.5 5:.5 b7:1.5! 5:.5 3:1  6:1 5:.5 3:.5 3:2"),              # the call again, displaced by a half beat
    L(20, 'vib', "5:1 6:1 5:1 3:1  1':1 5:1 2:1 5:1  3:1 5:1 3:2  5:1 3:1 2:1 r:1"),   # the turnaround, one note a beat
    L(24, 'flt', "r:1 3:.5 5:.5 b7:2"),                                         # chorus 3: the flute takes the theme, the vibraphone fills
    L(25, 'vib', "r:2 6:.5 5:.5 3:1"),
    L(26, 'flt', "5:1.5 3:.5 5:1 b7:1"),
    L(27, 'vib', "r:1 2:.5 5:.5 3:2"),
    L(28, 'flt', "1':2 5:1 6:1"),
    L(29, 'vib', "r:2 6:1 1:1"),
    L(30, 'flt', "b7:1.5! 5:.5 3:1 5:1"),
    L(31, 'vib', "6:1 5:.5 3:.5 3:2"),
    L(32, 'flt', "5:2 6:2  1':2 5:2  3:2 5:2  3:1 2:1 r:2"),
]

# --- Uptown (Eb, 4/4). Theme T: a broken Eb6 in eighths that lands on the 6th, then a turn down a fourth and a long Bb -------
T_THEME = "3:.5 5:.5 3:.5 5:.5 6:2  6:.5 5:.5 4:.5 3:.5 5:1.5 r:.5"
UPTOWN = [
    L(4, 'ng', T_THEME + "  2:.5 3:.5 4:.5 5:.5 6:1 7:1  1':3 r:1"),
    L(8, 'ng', "r:.5 5:1.5! 6:1 7:1  1':2.5 7:.5 6:1  5:1 6:1 1':2  7:1 5:1 4:1 3:1"),          # B: long notes, the first one late
    L(12, 'hp', "r:.5 5:.5 6:.5 7:.5 1':2  2':1.5 1':.5 6:1 5:1"),               # B: the harp
    L(14, 'ng', "5:1 3:1 4:1 5:1  6:1 7:1 5:2"),                                 # ... and the guitar closes
    L(20, 'ng', T_THEME + "  5:.5 6:.5 7:.5 1':.5 2':1 7:1  3':2 1':1 r:1"),
    L(24, 'hp', "1':2 5:2  4:2 3:2  3:1 5:1 5:1 3:1  2':1.5 1':.5 7:1 6:1  6:2 7:2  5:3 r:1  7:2 5:2  r:4", soft=4),
]

# --- MegaSlice HQ (C minor, 4/4, 17 bars). The villain tiptoes: staccato, chromatic, a rest after every few notes --------------
V_TIPTOE = "r:.5 1:.5s b2:.5s 2:.5s b3:1 r:.5 5:.5s  b6:1.5 r:.5 5:.5s b5:.5s 4:1"
HQ = [
    L(1, 'vil', V_TIPTOE),
    L(3, 'pz', "r:2 5:.5s b5:.5s 4:.5s r:.5  b3:1s r:3"),
    L(9, 'vil', V_TIPTOE, 1.0),                                                 # the same, a beat late
    L(11, 'pz', "r:2 5:.5s b5:.5s 4:.5s r:.5  r:.5 b3:.5s 2:.5s 1:.5s r:2"),
    L(16, 'pz', "b5:.5s 4:.5s", 3.0),
]

# --- Downtown (F, 6/8, 3 beats a bar). Theme D: the lilt, an eighth rest then A-C-D, D held, and a step-wise fall to G --------
D_THEME = "r:.5 3:.5 5:.5 6:1.5  5:.5 4:.5 3:.5 2:1.5  r:.5 3:.5 5:.5 6:.5 5:.5 3:.5  3:1.5! r:1.5"
DOWNTOWN = [
    L(4, 'ng', D_THEME),                                                        # A: the lilt
    L(7, 'cel', "r:1.5 5:.5 3:.5 1:.5", soft=6),                                # the celesta fills the rest (full chart only)
    L(8, 'ng', "r:.5 5:.5 6:.5 1':1.5  1':.5 6:.5 5:.5 4:1.5  r:.5 3:.5 5:.5 7:1.5  6:.5 5:.5 4:.5 3:1.5"),   # the answer, a third higher
    L(12, 'ng', "6:1 5:1 4:1  3:1 5:1 7:1  1':1 5:1 4:1  3:1 2:1 r:1"),         # development: quarters across the dotted pulse
    L(16, 'ng', "r:.5 4:.5 3:.5 2:1.5  r:.5 5:.5 6:.5 7:1.5  1':1.5 5:.5 3:.5 5:.5  r:1.5 5:.5 4:.5 2:.5"),   # close
    L(24, 'ng', "r:1 5:1 1':1  2':1.5 1':.5 5:1  7:1.5 2':1.5  1':1.5 6:.5 5:.5 4:.5  r:.5 5:.5 6:1 1':1  2':1.5 1':.5 6:1  5:1 7:1 2':1  6:1.5 7:1.5"),   # B, first half
    L(32, 'ng', "5:1 1':1 3':1  2':1.5 1':.5 2':1  7:1.5 2':1.5  1':1.5 6:1.5  r:.5 5:.5 6:1 3':1  2':1.5 1':.5 6:1  7:1 5:1 2:1  6:1.5 5:1.5"),   # B, second half: a step higher
    L(36, 'cel', "1':3  6:3  7:3", soft=8),                                      # a halo over the last three bars of the second half (full chart only)
    L(40, 'ng', D_THEME),                                                       # A again
    L(44, 'ng', "2':1.5 1':.5 5:.5 4:.5  3:1.5 2:.5 3:.5 5:.5  1':3  r:3"),     # coda
]
