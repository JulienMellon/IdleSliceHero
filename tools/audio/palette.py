"""The palette check (Julien, 2026-11-15: lofi jazz, nothing reedy, brassy or piercing in front).

`check(song, name)` raises PaletteError naming the cue, the track and the program (or the kit note) that breaks the
palette. `compose.py` calls it from `finish()` for every cue in its `JAZZ` set, so a build stops on a violation.
Program numbers are 0-based General MIDI (the cue sheet lists them 1-based).

Banned programs: accordions and harmonica 21-23, brass 56-63, reeds 64-71, square and saw leads 80-81, and the
bagpipe, fiddle and shanai 109-111. Organs 16-20 are allowed only on a track whose notes are all at velocity 50 or
under (a pad under the keys, never a front voice). Banned kit notes: toms 41 43 45 47 48 50, crash, china and splash
49 52 55 57, tambourine 54, cowbell 56.
"""
from __future__ import annotations

BANNED_PROGRAMS = {
    **{n: 'accordion or harmonica' for n in (21, 22, 23)},
    **{n: 'brass' for n in range(56, 64)},
    **{n: 'reed' for n in range(64, 72)},
    **{n: 'square or saw lead' for n in (80, 81)},
    **{n: 'bagpipe, fiddle or shanai' for n in (109, 110, 111)},
}
ORGANS = range(16, 21)
ORGAN_MAX_VEL = 50
BANNED_KIT = {
    **{n: 'tom' for n in (41, 43, 45, 47, 48, 50)},
    **{n: 'crash, china or splash' for n in (49, 52, 55, 57)},
    54: 'tambourine',
    56: 'cowbell',
}


class PaletteError(Exception):
    pass


def problems(song, name: str = '?') -> list[str]:
    """Every violation in `song`, one line each: cue, track, program or kit note."""
    out: list[str] = []
    for tr in song.tracks:
        if tr.channel == 9:  # the kit: its program is a kit number, so only the notes matter
            bad = sorted({pi for (_, _, pi, _) in tr.events if pi in BANNED_KIT})
            for pi in bad:
                out.append(f'{name}: track "{tr.name}" (kit {tr.program}) plays note {pi}, a {BANNED_KIT[pi]}')
            continue
        if tr.program in BANNED_PROGRAMS:
            out.append(f'{name}: track "{tr.name}" uses program {tr.program}, a {BANNED_PROGRAMS[tr.program]}')
        elif tr.program in ORGANS:
            loud = max((v for (_, _, _, v) in tr.events), default=0)
            if loud > ORGAN_MAX_VEL:
                out.append(f'{name}: track "{tr.name}" uses organ program {tr.program} with a note at velocity {loud} '
                           f'(organs stay at {ORGAN_MAX_VEL} or under)')
    return out


def check(song, name: str) -> None:
    errs = problems(song, name)
    if errs:
        raise PaletteError('; '.join(errs))
