"""The shared musical material: the city motif (AU16), its answer, the B section, and diatonic harmony.

Melodies are lists of (scale degree | None, beats). Degree 1 = tonic; 8 = octave; 0 = the 7th below; -2 = the 5th below.
Harmony is a list per bar of (degree, size, beats); size 3 = triad, 4 = seventh, built diatonically in the mode,
so a Mixolydian key gets its own flat-7 colour for free.
"""
from mlib import deg, MAJOR

# --- 4/4 versions -------------------------------------------------------------------------------------------------
PICKUP = [(-2, 0.5)]  # "5," eighth pickup into bar 1
MOTIF = [(1, 1), (3, .5), (5, .5), (6, 1.5), (5, .5)]              # opening phrase
CLOSE = [(4, .5), (3, .5), (2, .5), (3, .5), (1, 2)]               # closing phrase
ANSWER_1 = [(6, 1), (5, .5), (4, .5), (3, 1.5), (2, .5)]
ANSWER_2 = [(0, .5), (1, .5), (2, .5), (4, .5), (3, 2)]
CADENCE_1 = [(4, 1), (6, .5), (5, .5), (4, 1), (2, 1)]
CADENCE_2 = [(1, 3), (None, 1)]

# 8-bar A phrase: motif, answer, motif, cadence (the motif is stated twice)
A_BARS = [MOTIF, CLOSE, ANSWER_1, ANSWER_2, MOTIF, CLOSE, CADENCE_1, CADENCE_2]
A_HARM = [
    [(1, 3, 4)], [(5, 4, 2), (1, 3, 2)], [(4, 3, 2), (1, 3, 2)], [(5, 4, 2), (1, 3, 2)],
    [(1, 3, 4)], [(5, 4, 2), (1, 3, 2)], [(2, 4, 2), (5, 4, 2)], [(1, 3, 4)],
]
# A' (4 bars): one statement + cadence, used for the return
A2_BARS = [MOTIF, CLOSE, CADENCE_1, CADENCE_2]
A2_HARM = [A_HARM[0], A_HARM[1], A_HARM[6], A_HARM[7]]

# 8-bar B: the motif's rhythm sequenced on vi and IV (development, no literal statement)
B_BARS = [
    [(6, 1), (8, .5), (7, .5), (6, 1.5), (5, .5)],
    [(5, .5), (4, .5), (3, .5), (4, .5), (5, 2)],
    [(4, 1), (6, .5), (8, .5), (9, 1.5), (8, .5)],
    [(8, .5), (7, .5), (6, .5), (7, .5), (5, 2)],
    [(6, 1), (8, .5), (7, .5), (6, 1.5), (5, .5)],
    [(4, .5), (3, .5), (2, .5), (3, .5), (4, 2)],
    [(6, 1), (5, 1), (4, 1), (2, 1)],
    [(5, 3), (None, 1)],
]
B_HARM = [[(6, 3, 4)], [(3, 3, 4)], [(4, 3, 4)], [(1, 3, 2), (5, 3, 2)],
          [(6, 3, 4)], [(2, 4, 4)], [(4, 3, 2), (5, 3, 2)], [(5, 4, 4)]]

# --- 6/8 versions (Downtown). 1 beat = a quarter; a 6/8 bar = 3 beats --------------------------------------------
M68 = [
    [(1, 1), (3, .5), (5, .5), (6, 1)],
    [(5, .5), (4, .5), (3, .5), (2, 1), (3, .5)],
    [(1, 1.5), (None, 1.5)],
    [(None, 3)],
]
ANS68 = [
    [(6, 1), (5, .5), (4, .5), (3, 1)],
    [(2, .5), (0, .5), (1, .5), (2, 1), (4, .5)],
    [(3, 1.5), (None, 1.5)],
    [(None, 3)],
]
DEV68 = [
    [(4, 1), (6, .5), (8, .5), (9, 1)],
    [(8, .5), (7, .5), (6, .5), (5, 1), (6, .5)],
    [(5, 1.5), (3, 1.5)],
    [(2, 1.5), (-2, 1.5)],
]
CLOSE68 = [
    [(4, .5), (3, .5), (2, .5), (3, 1), (5, .5)],
    [(4, .5), (3, .5), (2, .5), (0, 1), (2, .5)],
    [(1, 1.5), (None, 1.5)],
    [(None, 3)],
]
# Downtown B (relative minor colour), mandolin-led
B68 = [
    [(6, 1), (8, .5), (7, .5), (6, 1)], [(5, .5), (4, .5), (3, .5), (4, 1.5)],
    [(3, 1), (5, .5), (4, .5), (3, 1)], [(2, 1.5), (0, 1.5)],
    [(6, 1), (8, .5), (7, .5), (6, 1)], [(5, .5), (6, .5), (7, .5), (8, 1.5)],
    [(7, 1), (6, .5), (5, .5), (4, 1)], [(5, 1.5), (None, 1.5)],
]
H68 = {
    'M': [[(1, 3, 3)], [(5, 4, 3)], [(1, 3, 3)], [(1, 3, 3)]],
    'ANS': [[(4, 3, 3)], [(5, 4, 3)], [(1, 3, 3)], [(5, 4, 3)]],
    'DEV': [[(4, 3, 3)], [(1, 3, 3)], [(2, 4, 3)], [(5, 4, 3)]],
    'CLOSE': [[(2, 3, 3)], [(5, 4, 3)], [(1, 3, 3)], [(1, 3, 3)]],
    'B': [[(6, 3, 3)], [(2, 3, 3)], [(3, 3, 3)], [(6, 3, 1.5), (5, 4, 1.5)],
          [(6, 3, 3)], [(4, 3, 3)], [(2, 4, 3)], [(5, 4, 3)]],
}


def chord_notes(root, d: int, size: int = 3, mode=MAJOR, octave_shift: int = 0):
    return [deg(root, d + 2 * k, mode) + 12 * octave_shift for k in range(size)]


def bar_melody(root, bars, mode=MAJOR, start=0.0, bar_beats=4.0, shift=0):
    """-> list of (t, dur, pitch) for a list of bars. Each bar sums to bar_beats."""
    out = []
    t = start
    for b in bars:
        u = t
        for d, dur in b:
            if d is not None:
                out.append((u, dur, deg(root, d, mode) + shift))
            u += dur
        t += bar_beats
    return out


def flat(root, d: int, mode=MAJOR):
    return deg(root, d, mode) - 1
