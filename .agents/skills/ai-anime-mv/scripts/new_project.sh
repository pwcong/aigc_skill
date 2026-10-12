#!/usr/bin/env bash
# new_project.sh <dir> — copy the Remotion template and install deps
set -e
SK="$(cd "$(dirname "$0")/.." && pwd)"
DST="$1"; [ -n "$DST" ] || { echo "usage: new_project.sh <dir>"; exit 1; }
mkdir -p "$DST"
cp -R "$SK/assets/template/." "$DST/"
mkdir -p "$DST/public/audio/vocal_slices" "$DST/public/clips" "$DST/public/images/keyframes" "$DST/public/images/bg" "$DST/out" "$DST/docs"
cd "$DST" && npm install --silent
echo "project ready: $DST"
