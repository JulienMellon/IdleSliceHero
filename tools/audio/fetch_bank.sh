#!/usr/bin/env bash
# Fetch or link a General MIDI soundfont into tools/audio/banks/ (not in git). Idempotent.
#   ./fetch_bank.sh A   TimGM6mb.sf2 (system file, linked)
#   ./fetch_bank.sh B   FluidR3_GM.sf2 (apt: fluid-soundfont-gm, unpacked here, no root needed)
#   ./fetch_bank.sh C   MuseScore_General_Full.sf3 (apt: musescore-general-soundfont, unpacked here; may need apt-get update)
#   ./fetch_bank.sh D   GeneralUser-GS.sf2 (GitHub raw, mrbumpy409/GeneralUser-GS)
#   ./fetch_bank.sh     the bank named in tools/audio/BANK (nothing if that file is missing)
# Prints: letter, path, size and sha256. The licence text each bank ships with is saved next to it as <file>.licence.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BANKS="$HERE/banks"
mkdir -p "$BANKS"

L="${1:-}"
if [ -z "$L" ]; then
  [ -f "$HERE/BANK" ] || exit 0
  f="$(head -n1 "$HERE/BANK" | tr -d '[:space:]')"          # e.g. banks/GeneralUser-GS.sf2
  case "$(basename "$f")" in
    TimGM6mb.sf2) L=A ;; FluidR3_GM.sf2) L=B ;; MuseScore_General_Full.sf3) L=C ;; GeneralUser-GS.sf2) L=D ;;
    *) echo "BANK names an unknown file: $f" >&2; exit 1 ;;
  esac
fi

from_deb() {  # from_deb <package> <path in package> <licence path in package> <out name>
  local pkg="$1" inner="$2" lic="$3" out="$4" tmp
  tmp="$(mktemp -d)"
  if ! ( cd "$tmp" && apt-get download "$pkg" >"$tmp/apt.log" 2>&1 ); then
    echo "fetch_bank: apt-get download $pkg failed (run 'apt-get update' first, or check the apt mirrors are reachable):" >&2
    cat "$tmp/apt.log" >&2; rm -rf "$tmp"; exit 1
  fi
  dpkg-deb --fsys-tarfile "$tmp"/*.deb | tar -xO ".$inner" > "$BANKS/$out"
  dpkg-deb --fsys-tarfile "$tmp"/*.deb | tar -xO ".$lic" > "$BANKS/$out.licence"
  rm -rf "$tmp"
}

case "$L" in
  A) NAME=TimGM6mb.sf2
     [ -e "$BANKS/$NAME" ] || { [ -f /usr/share/sounds/sf2/$NAME ] || apt-get install -y -qq timgm6mb-soundfont >/dev/null 2>&1
       ln -sf /usr/share/sounds/sf2/$NAME "$BANKS/$NAME"; cp /usr/share/doc/timgm6mb-soundfont/copyright "$BANKS/$NAME.licence"; } ;;
  B) NAME=FluidR3_GM.sf2
     [ -s "$BANKS/$NAME" ] || from_deb fluid-soundfont-gm /usr/share/sounds/sf2/$NAME /usr/share/doc/fluid-soundfont-gm/copyright $NAME ;;
  C) NAME=MuseScore_General_Full.sf3
     [ -s "$BANKS/$NAME" ] || from_deb musescore-general-soundfont /usr/share/sounds/sf3/$NAME /usr/share/doc/musescore-general-soundfont/copyright $NAME ;;
  D) NAME=GeneralUser-GS.sf2
     U=https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main
     [ -s "$BANKS/$NAME" ] || { curl -fsSL -m 300 -o "$BANKS/$NAME.part" "$U/GeneralUser-GS.sf2" && mv "$BANKS/$NAME.part" "$BANKS/$NAME"; }
     [ -s "$BANKS/$NAME.licence" ] || curl -fsSL -m 60 -o "$BANKS/$NAME.licence" "$U/documentation/LICENSE.txt" ;;
  *) echo "usage: fetch_bank.sh [A|B|C|D]" >&2; exit 1 ;;
esac
SHA="$(sha256sum "$BANKS/$NAME" | cut -d' ' -f1)"
# Optional pin: a second line in tools/audio/BANK holding the expected sha256. A mismatch stops the build.
WANT="$( [ -f "$HERE/BANK" ] && sed -n 2p "$HERE/BANK" | tr -d '[:space:]' || true)"
if [ -n "$WANT" ] && [ "$(head -n1 "$HERE/BANK" | xargs basename)" = "$NAME" ] && [ "$WANT" != "$SHA" ]; then
  echo "fetch_bank: $NAME sha256 is $SHA, tools/audio/BANK expects $WANT" >&2; exit 1
fi
echo "$L banks/$NAME $(stat -L -c %s "$BANKS/$NAME") bytes sha256 $SHA"
