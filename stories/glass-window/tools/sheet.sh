#!/bin/bash
# Contact sheet (cloud version of the skill's contact_sheet.sh, with the local browser).
set -e
OUT="$1"; shift
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
EXTRA=""; [ -x "$B" ] && EXTRA="--browser-executable=$B"
TMP="$(mktemp -d)"; i=0
for fr in "$@"; do
  npx remotion still src/index.ts Film "$TMP/raw_$i.png" --frame="$fr" --log=error $EXTRA >/dev/null
  ffmpeg -v error -y -i "$TMP/raw_$i.png" -vf "scale=270:-2,drawtext=text='$fr':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" "$TMP/$(printf 'seq_%03d' $i).png"
  i=$((i+1))
done
COLS=$(( i < 6 ? i : 6 )); ROWS=$(( (i + COLS - 1) / COLS ))
ffmpeg -v error -y -framerate 1 -i "$TMP/seq_%03d.png" -vf "tile=${COLS}x${ROWS}:padding=6:color=white" -frames:v 1 "$OUT"
echo "-> $OUT"
