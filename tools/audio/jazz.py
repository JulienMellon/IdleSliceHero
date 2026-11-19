"""The lofi-jazz language, written once (card M1a). Cards M1b and M1c build their loops from these helpers.

What is here, all of it deterministic (every random choice comes from a `seed` you pass):
  voicing / voicing_off   rootless close voicings, every note between C3 (48) and E4 (64)
  Harmony + helpers       bar-by-bar chord lists that also know their barRoots: bars, hold, i_vi_ii_V, ii_V_I
                          (with a tritone option), tritone, backdoor
  comp                    Rhodes (or any keys) comping: a chord on 1, a quieter answer, now and then the next
                          chord anticipated by an eighth; every hit is released RELEASE_GAP beats before the next
  bass_two_feel/bass_walk upright bass: roots and fifths in half notes, or quarter-note walking with chromatic
                          approach tones
  brushes                 the kit: spang-a-lang ride, feathered kick, ghosted taps, cross-stick and pedal hat on 2
                          and 4, a swirl every N bars; feels F68 (6/8), SWING44 (swung 4/4), SHUFFLE (triplet shuffle)
  articulate              every pitched note cut to 0.75 of its written length (pads 0.9), so notes don't run together
  laid_back               kit 12-18 ms late, bass 5-8 ms late, kick and snare off the grid by their own +-6 ms

Swing itself is not here: `compose.swing_smooth` swings the straight-eighth positions these helpers write (the kit
and the comping alike), then `Song.humanize_ms` does the velocity and timing humanising, then `laid_back` runs last
(`compose.jazz_finish` does all three in that order).

Times are in beats (quarter notes), as everywhere in mlib. A 6/8 bar is 3 beats: two dotted-quarter pulses of 1.5.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

from mlib import Track, p, MAJOR, KICK, RIM, PEDAL, RIDE

LOW, HIGH = 48, 64  # C3 and E4: every voicing sits in here
RELEASE_GAP = 0.4  # beats of silence the keys leave before the next chord (swing can shorten it to about 0.27)

# --- the chord vocabulary: intervals above the chord root, bottom to top, root left out ---------------------------
QUALITIES: dict[str, list[int]] = {
    'maj7': [4, 7, 11, 14],            # 3 5 7 9
    'maj9': [11, 14, 16, 19],          # 7 9 3 5
    'maj7s11': [4, 11, 14, 18],        # 3 7 9 #11
    '6/9': [4, 7, 9, 14],              # 3 5 6 9
    'min9': [3, 7, 10, 14],            # b3 5 b7 9
    'min11': [3, 10, 14, 17],          # b3 b7 9 11
    'dom9': [4, 7, 10, 14],            # 3 5 b7 9
    'dom13': [10, 14, 16, 21],         # b7 9 3 13
    'sus13': [10, 14, 17, 21],         # b7 9 11 13
    'dim7': [3, 6, 9, 15],             # b3 b5 6 b3
    'min(maj7)': [3, 7, 11, 14],       # b3 5 7 9
    'min7b5': [3, 6, 10, 14],          # b3 b5 b7 9
    'dom7b9': [4, 7, 10, 13],          # altered: 3 5 b7 b9
    'dom7s11': [4, 10, 14, 18],        # altered: 3 b7 9 #11
    'alt7': [4, 10, 13, 18],           # altered: 3 b7 b9 #11
}
MINOR_THIRD = {'min9', 'min11', 'dim7', 'min(maj7)', 'min7b5'}
FLAT_FIFTH = {'dim7', 'min7b5'}

OFFSETS = {'i': 0, 'bii': 1, 'ii': 2, 'biii': 3, 'iii': 4, 'iv': 5, '#iv': 6, 'bv': 6, 'v': 7, 'bvi': 8, 'vi': 9,
           'bvii': 10, 'vii': 11}
# barRoots are scale degrees 1..7 (the director waits for a 1). A chromatic root takes the degree it is spelled from.
DEGREE_OF = {0: 1, 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7}


def tonic(key) -> int:
    """MIDI number of a key given as 'F', 'F4', 'Bb' or a number (octave 4 when none is named)."""
    return p(key) if isinstance(key, int) or key[-1].isdigit() else p(key + '4')


def offset(degree) -> int:
    """Semitones above the key's tonic: an int 1..7 is the major-scale degree, a string is a roman numeral
    ('ii', 'bVII', '#iv'; case ignored)."""
    if isinstance(degree, str):
        return OFFSETS[degree.strip().lower()]
    return MAJOR[(degree - 1) % 7]


def voicing_off(root, off: int, quality: str, near: float | None = None) -> list[int]:
    """Rootless voicing of the chord whose root is `off` semitones above `root`. The octave that puts every note in
    C3..E4 is chosen among the inversions; the one whose centre is nearest `near` (default 53, low in the window) wins."""
    base = [(tonic(root) + off) % 12 + i for i in QUALITIES[quality]]
    fits = []
    for rot in range(len(base)):  # every inversion: the lowest notes move up an octave
        inv = base[rot:] + [x + 12 for x in base[:rot]]
        shift = 12 * math.ceil((LOW - inv[0]) / 12)
        while inv[0] + shift <= HIGH:
            v = [x + shift for x in inv]
            if min(v) >= LOW and max(v) <= HIGH:
                fits.append(v)
            shift += 12
    if not fits:
        raise ValueError(f'no voicing of {quality} on offset {off} fits C3..E4')
    target = 53 if near is None else near
    return min(fits, key=lambda v: abs(sum(v) / len(v) - target))


def voicing(root, degree, quality: str, near: float | None = None) -> list[int]:
    """Rootless close voicing of the chord on `degree` (1..7 or a roman numeral) of the key whose tonic is `root`."""
    return voicing_off(root, offset(degree), quality, near)


# --- harmony: a chord list per bar that also yields barRoots ---------------------------------------------------------
@dataclass(frozen=True)
class Ch:
    off: int        # root, in semitones above the key's tonic
    q: str          # a key of QUALITIES
    beats: float

    @property
    def degree(self) -> int:
        return DEGREE_OF[self.off % 12]

    @property
    def is_dominant(self) -> bool:
        return self.q.startswith('dom') or self.q in ('sus13', 'alt7')


class Harmony(list):
    """A list of bars; a bar is a list of Ch. Carries the key and the bar length; `+` joins two charts."""

    def __init__(self, key, bar_beats: float, bars=()):
        super().__init__(bars)
        self.key, self.bar_beats = key, bar_beats

    def __add__(self, other: 'Harmony') -> 'Harmony':
        assert other.key == self.key and other.bar_beats == self.bar_beats
        return Harmony(self.key, self.bar_beats, list(self) + list(other))

    @property
    def roots(self) -> list[int]:
        """The scale degree of the chord on each bar's downbeat: what goes to `finish()` as barRoots."""
        return [bar[0].degree for bar in self]

    @property
    def beats(self) -> float:
        return len(self) * self.bar_beats

    def chords(self, start: float = 0.0):
        """Flat list of (start beat, Ch)."""
        out, t = [], start
        for bar in self:
            u = t
            for ch in bar:
                out.append((u, ch))
                u += ch.beats
            t += self.bar_beats
        return out


def bars(key, bar_beats: float, *specs) -> Harmony:
    """Each spec is one bar: a list of (degree, quality, beats). The beats of a bar must sum to the bar length."""
    out = []
    for spec in specs:
        bar = [Ch(offset(d), q, float(b)) for (d, q, b) in spec]
        assert abs(sum(c.beats for c in bar) - bar_beats) < 1e-9, (spec, bar_beats)
        out.append(bar)
    return Harmony(key, bar_beats, out)


def hold(key, bar_beats: float, degree, quality: str, n: int = 1) -> Harmony:
    """`n` whole bars on one chord."""
    return bars(key, bar_beats, *([[(degree, quality, bar_beats)]] * n))


def _rel(key, bar_beats, base_off: int, plan, shape: str) -> Harmony:
    """plan: [(semitones above base_off, quality)]; 'half' puts two chords in a bar, 'bar' gives each its own bar."""
    h = bar_beats / 2
    chords = [Ch((base_off + o) % 12, q, 0.0) for (o, q) in plan]
    out = []
    if shape == 'half':
        for i in range(0, len(chords), 2):
            pair = chords[i:i + 2]
            out.append([Ch(c.off, c.q, bar_beats if len(pair) == 1 else h) for c in pair])
    else:
        out = [[Ch(c.off, c.q, bar_beats)] for c in chords]
    return Harmony(key, bar_beats, out)


def i_vi_ii_V(key, bar_beats: float, degree='I', quals=('maj9', 'min9', 'min9', 'dom13')) -> Harmony:
    """I vi | ii V on the chord at `degree`: two bars, two chords each."""
    base = offset(degree)
    return _rel(key, bar_beats, base, list(zip((0, 9, 2, 7), quals)), 'half')


def ii_V_I(key, bar_beats: float, target='I', target_q: str = 'maj9', shape: str = 'half', resolve: bool = True,
           ii_q: str | None = None, v_q: str | None = None, tritone: bool = False) -> Harmony:
    """ii-V-I into `target`. shape 'half': ii and V share a bar, then the I bar; shape 'bar': a bar each. A minor target
    gets a half-diminished ii and a b9 dominant. `tritone` swaps the V for the dominant a tritone away (bII7, which
    also resolves to the target). `resolve=False` leaves the target out (the next section supplies it)."""
    minor = target_q.startswith('min')
    ii_q = ii_q or ('min7b5' if minor else 'min9')
    v_q = v_q or ('dom7b9' if minor else 'dom13')
    v_off = 1 if tritone else 7
    plan = [(2, ii_q), (v_off, v_q)] + ([(0, target_q)] if resolve else [])
    return _rel(key, bar_beats, offset(target), plan, shape)


def tritone(h: Harmony) -> Harmony:
    """Tritone substitution: every dominant chord is replaced by the dominant a tritone away, same beats."""
    out = [[Ch((c.off + 6) % 12, 'dom13' if c.q in ('dom9', 'dom13', 'sus13') else c.q, c.beats) if c.is_dominant else c
            for c in bar] for bar in h]
    return Harmony(h.key, h.bar_beats, out)


def backdoor(key, bar_beats: float, target='I', target_q: str = 'maj9', shape: str = 'half',
             resolve: bool = True) -> Harmony:
    """Backdoor cadence: iv minor 9, then bVII13, then home."""
    plan = [(5, 'min9'), (10, 'dom13')] + ([(0, target_q)] if resolve else [])
    return _rel(key, bar_beats, offset(target), plan, shape)


# --- feels ------------------------------------------------------------------------------------------------------------
@dataclass(frozen=True)
class Feel:
    name: str
    bar_beats: float
    pulse: float                  # the two-feel step: a half bar (a dotted quarter in 6/8)
    swing: float                  # the ratio to give compose.swing_smooth; 0 = none (6/8 carries its own lilt)
    ride: tuple                   # (position in bar, velocity)
    cross: tuple                  # cross-stick positions (2 and 4)
    pedal: tuple                  # pedal-hat positions (2 and 4)
    kick: tuple                   # (position, probability): feathered
    ghosts: tuple                 # ghost-tap positions
    answer: tuple                 # where the comping answers the downbeat chord
    antic: float = 0.5            # how early an anticipated chord lands (an eighth, swung later in 4/4)


F68 = Feel('6/8', 3.0, 1.5, 0.0,
           ride=((0, 40), (1.0, 28), (1.5, 34), (2.5, 26)), cross=(1.5,), pedal=(1.5,),
           kick=((0, 1.0), (2.0, 0.25)), ghosts=(0.5, 2.0), answer=(1.5,))
SWING44 = Feel('swing', 4.0, 2.0, 0.58,
               ride=((0, 40), (1, 38), (1.5, 28), (2, 40), (3, 38), (3.5, 28)), cross=(1, 3), pedal=(1, 3),
               kick=((0, 1.0), (2, 0.35)), ghosts=(0.5, 2.5), answer=(1.5,))
SHUFFLE = Feel('shuffle', 4.0, 2.0, 0.667,
               ride=((0, 40), (0.5, 26), (1, 36), (1.5, 26), (2, 40), (2.5, 26), (3, 36), (3.5, 26)),
               cross=(1, 3), pedal=(1, 3), kick=((0, 1.0), (2, 0.4)), ghosts=(), answer=(1.5,))


def _pc(key, ch: Ch) -> int:
    return (tonic(key) + ch.off) % 12


def comp_voicings(h: Harmony, near: float | None = None) -> list[list[int]]:
    """The voicing `comp` plays for each chord of `h`, in order: each follows the nearest octave to the one before it."""
    out, prev = [], near
    for (_t, ch) in h.chords(0.0):
        v = voicing_off(h.key, ch.off, ch.q, prev)
        prev = sum(v) / len(v)
        out.append(v)
    return out


# --- keys -------------------------------------------------------------------------------------------------------------
def comp(track: Track, h: Harmony, feel: Feel, start: float = 0.0, seed: int = 1, vel: int = 46, strum: float = 0.03,
         antic_p: float = 0.3, answer_p: float = 0.7, near: float | None = None, gap: float = RELEASE_GAP,
         hold: float = 1.25, answer_len: float = 1.0) -> None:
    """Comping: a long chord on the chord's downbeat (rolled up, upper notes a hair later and quieter); on a whole-bar
    chord a quieter answer at `feel.answer`; with probability `antic_p` a chord that follows a chord of at least a
    pulse is struck `feel.antic` early (and not re-struck on its downbeat). Voicings follow the nearest octave.

    Every note is released before the next hit begins (notes round R1): no note of a hit sounds within `gap` beats of
    the next hit's first note (an anticipated chord counts from its early onset), no hit is held longer than `hold`
    pulses (`feel.pulse`), the downbeat chord lets go `gap` beats before its own answer, and a hit's notes all end
    together (the strum delays the attacks, not the releases). The last hit of the chart ends `gap` before its last bar."""
    rng = random.Random(seed)
    chords = h.chords(start)
    early = [False] * len(chords)
    answer = [False] * len(chords)
    for i, (t, ch) in enumerate(chords):
        early[i] = i > 0 and chords[i - 1][1].beats >= feel.pulse and rng.random() < antic_p
        if ch.beats >= feel.bar_beats - 1e-9:
            answer[i] = [rng.random() < answer_p for _a in feel.answer]
    onsets = [t - (feel.antic if early[i] else 0.0) for i, (t, _c) in enumerate(chords)]
    voicings = comp_voicings(h, near)

    def hit(t, end, notes, v):
        for i, q in enumerate(notes):
            track.n(t + strum * i, max(0.2, end - t - strum * i), q, v - 2 * i)

    for i, ((t, ch), v) in enumerate(zip(chords, voicings)):
        limit = (onsets[i + 1] if i + 1 < len(chords) else t + ch.beats) - gap
        on = onsets[i]
        end = min(on + hold * feel.pulse, limit)
        plays = [a for a, p in zip(feel.answer, answer[i] or []) if p]
        if plays:
            end = min(end, t + plays[0] - gap)
        hit(on, end, v, vel - 4 if early[i] else vel)
        for k, a in enumerate(plays):
            nxt = t + plays[k + 1] - gap if k + 1 < len(plays) else limit
            hit(t + a, min(t + a + answer_len, nxt, limit), v[1:], vel - 12)


# --- bass -------------------------------------------------------------------------------------------------------------
def _bass_root(pc: int, lo: int = 36) -> int:
    return lo + (pc - lo) % 12


def bass_two_feel(track: Track, h: Harmony, feel: Feel, start: float = 0.0, vel: int = 60) -> None:
    """Roots and fifths, one note per `feel.pulse` (half notes in 4/4, dotted quarters in 6/8). A chord shorter than
    a pulse gets its root only. Roots live in C2..B2; the fifth drops a fourth instead of going above G3."""
    for t, ch in h.chords(start):
        root = _bass_root(_pc(h.key, ch))
        fifth = root + (6 if ch.q in FLAT_FIFTH else 7)
        if fifth > 55:
            fifth -= 12
        for k in range(max(1, int(ch.beats // feel.pulse + 1e-9))):
            track.n(t + k * feel.pulse, feel.pulse * 0.92, root if k % 2 == 0 else fifth, vel if k == 0 else vel - 10)


def bass_walk(track: Track, h: Harmony, feel: Feel, start: float = 0.0, seed: int = 1, vel: int = 62) -> None:
    """Quarter-note walking. A chord's first quarter is its root, the last is a half step above or below the next
    chord's root (the last chord approaches the first, so the loop is circular), the ones between are chord tones
    that avoid repeating the note before."""
    rng = random.Random(seed)
    chords = h.chords(start)
    n = len(chords)

    def near(pitch_class: int, to: int) -> int:
        c = lo = 33 + (pitch_class - 33) % 12
        for x in (lo, lo + 12, lo - 12):
            if 33 <= x <= 55 and abs(x - to) < abs(c - to):
                c = x
        return c

    last = None
    for i, (t, ch) in enumerate(chords):
        nxt = chords[(i + 1) % n][1]
        root = _bass_root(_pc(h.key, ch))
        steps = max(1, int(round(ch.beats)))
        third = 3 if ch.q in MINOR_THIRD else (5 if ch.q.startswith('sus') else 4)
        fifth = 6 if ch.q in FLAT_FIFTH else 7
        tones = [(root + third) % 12, (root + fifth) % 12, (root + 9) % 12 if ch.q not in FLAT_FIFTH else (root + 10) % 12]
        cur = root
        for k in range(steps):
            if k == 0:
                cur = root
            elif k == steps - 1:
                tgt = _bass_root(_pc(h.key, nxt))
                cur = near((tgt + rng.choice((-1, 1))) % 12, cur)
            else:
                pick = rng.choice([x for x in tones if near(x, cur) != last] or tones)
                cur = near(pick, cur)
            track.n(t + k, 0.92, cur, vel if k == 0 else vel - 8)
            last = cur


# --- the kit ----------------------------------------------------------------------------------------------------------
def brushes(drm: Track, nbars: int, feel: Feel, start: float = 0.0, seed: int = 1, scale: float = 1.0,
            swirl_every: int = 8, bar0: int = 0) -> None:
    """The brush kit for `nbars` bars from beat `start`. Ride 51 low (spang-a-lang in 4/4, the long-short skip in 6/8),
    feathered kick 36 (velocity 30-42), ghosted brush taps 38 (16-26), cross-stick 37 and pedal hat 44 on 2 and 4, and
    on bars where (bar0 + bar) % swirl_every == swirl_every - 1 a brush swirl (40) in place of the ride. Positions are
    straight: swing them afterwards. `scale` shrinks every velocity (beds and intros play softer)."""
    rng = random.Random(seed)

    def v(x):
        return max(1, int(round(x * scale)))

    for b in range(nbars):
        t0 = start + b * feel.bar_beats
        if swirl_every and (bar0 + b) % swirl_every == swirl_every - 1:
            n = int(feel.bar_beats * 2)
            for i in range(n):
                drm.n(t0 + i * 0.5, 0.5, 40, v(16 + 18 * math.sin(math.pi * (i + 0.5) / n)))
        else:
            for pos, vel in feel.ride:
                drm.n(t0 + pos, 0.25, RIDE, v(vel + rng.randint(-2, 2)))
        for pos, prob in feel.kick:
            if prob >= 1.0 or rng.random() < prob:
                drm.n(t0 + pos, 0.3, KICK, v(rng.randint(30, 42)))
        for pos in feel.cross:
            drm.n(t0 + pos, 0.2, RIM, v(38 + rng.randint(-2, 2)))
        for pos in feel.pedal:
            drm.n(t0 + pos, 0.2, PEDAL, v(32 + rng.randint(-2, 2)))
        for pos in feel.ghosts:
            if rng.random() < 0.45:
                drm.n(t0 + pos, 0.15, 38, v(rng.randint(16, 26)))


ARTICULATE = 0.75  # notes round R1-2: every pitched note sounds for this share of the length it was written with
ARTICULATE_PAD = 0.9


def articulate(tracks, scale: float = ARTICULATE, pad_scale: float = ARTICULATE_PAD, floor: float = 0.15) -> None:
    """Shorter notes, so each one is heard on its own (notes round R1-2): every pitched note (not the kit) is cut to `scale` of
    its length (`pad_scale` on a track whose name contains 'pad'); a note already shorter than `floor` beats is left alone,
    and none goes below `floor`. One rule for every part, so the charts keep the lengths they were written with."""
    for tr in tracks:
        if tr.channel == 9:
            continue
        k = pad_scale if 'pad' in tr.name.lower() else scale
        tr.events = [(t, d if d <= floor else max(floor, d * k), pi, v) for (t, d, pi, v) in tr.events]


def laid_back(tracks, ms: float, bpm: float, seed: int = 5) -> None:
    """Behind the beat. The kit (channel 9) lands `ms` late give or take 3 ms (so 12-18 ms for ms=15), the bass
    (a track whose name contains 'bass') 0.33-0.53 of that (5-8 ms), and kick (36) and snare-family (37, 38, 40) hits
    get a further +-6 ms of their own. Everything else stays where it is."""
    rng = random.Random(seed)
    per_ms = bpm / 60.0 / 1000.0  # beats per millisecond
    for tr in tracks:
        kit = tr.channel == 9
        bass = 'bass' in tr.name.lower()
        if not (kit or bass):
            continue
        out = []
        for (t, d, pi, v) in tr.events:
            if kit:
                late = rng.uniform(ms - 3.0, ms + 3.0)
                if pi in (36, 37, 38, 40):
                    late += rng.uniform(-6.0, 6.0)
            else:
                late = rng.uniform(ms * 0.33, ms * 0.53)
            out.append((max(0.0, t + late * per_ms), d, pi, v))
        tr.events = out
