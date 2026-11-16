# Soundfont banks for the offline render

None of these ship in the app: they only change how the MIDI is rendered before it is encoded. Files live in
`tools/audio/banks/` (git-ignored); `./fetch_bank.sh <letter>` fetches or links one and prints its size and sha256.
`tools/audio/BANK` (one line, a path relative to `tools/audio/`, e.g. `banks/GeneralUser-GS.sf2`) picks the bank the
build uses; the `SF2` environment variable overrides it; with neither, the build uses A. Each build writes the bank's
name and sha256 to `build/bank.json`. Each fetch also saves the licence text it read next to the file as `<file>.licence`.

All four load and render in `spessasynth_core` 4.4.2 (checked by rendering `downtown_sparse.mid` through each; C needs
the SF3 decoder awaited, which `render.mjs` now does).

| Letter | Name and version | File | MB | sha256 | Licence, as the file states it | Where the licence was read |
|---|---|---|---|---|---|---|
| A | TimGM6mb, apt `timgm6mb-soundfont` 1.3-5 | `TimGM6mb.sf2` | 5.97 | `c5378b62028c920cb11e4803327983fee2f2cdff5dc89c708e39da417e51c854` | `License: GPL-2` for `TimGM6mb.sf2`; its comment quotes the author: some samples are his own, "all others are either public domain or fall under the terms of the GNU General Public License" | `/usr/share/doc/timgm6mb-soundfont/copyright` |
| B | Fluid (R3) GM, apt `fluid-soundfont-gm` 3.1-5.3 | `FluidR3_GM.sf2` | 148.40 | `74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0` | "I hereby release Fluid under the MIT license, as described in COPYING", followed by the MIT text | `/usr/share/doc/fluid-soundfont-gm/copyright` |
| C | MuseScore General, apt `musescore-general-soundfont` 0.2.1-1 | `MuseScore_General_Full.sf3` | 85.97 | `f9a37b36655f23e167c66ec91bef6097c8e99be29286219a54062919eb41aeae` | "MuseScore_General_HQ SoundFont (MIT, parts PD or CC0)", with the MuseScore Drumline samples, the Splendid Grand piano and the VCSL and VSCO samples listed as CC0 or public domain, and the Fluid (R3) parts as MIT | `/usr/share/doc/musescore-general-soundfont/copyright` |
| D | GeneralUser GS v2.0.3 | `GeneralUser-GS.sf2` | 32.32 | `9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe` | "GeneralUser GS License v2.0": "You may use GeneralUser GS without restriction for your own music creation, private or commercial." It adds that the author cannot be 100% sure where all contained samples originated | `https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/documentation/LICENSE.txt` |

Notes on what the files say, without a reading of what they permit:
- C: the copyright file says the package's precompiled `.sf3` was excluded when repacking, yet the package contains
  `MuseScore_General_Full.sf3` (86 MB). The package description reads "HQ version, lossy". The licence text names the HQ bank.
- D: the file was fetched from the `main` branch of `mrbumpy409/GeneralUser-GS` (path `GeneralUser-GS.sf2`, repo root); the
  version number comes from the header of `documentation/LICENSE.txt`. The sha256 above pins what was fetched.
