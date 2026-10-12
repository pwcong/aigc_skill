#!/usr/bin/env bash
# One-time Python envs (uv). Creates ~/.cache/ai-anime-mv/{audio,ml}env
set -e
BASE="$HOME/.cache/ai-anime-mv"
mkdir -p "$BASE"
[ -x "$BASE/audioenv/bin/python" ] || uv venv -q "$BASE/audioenv" --python 3.11
VIRTUAL_ENV="$BASE/audioenv" uv pip install -q numpy scipy librosa soundfile pillow
[ -x "$BASE/mlenv/bin/python" ] || uv venv -q "$BASE/mlenv" --python 3.12
VIRTUAL_ENV="$BASE/mlenv" uv pip install -q demucs faster-whisper soundfile scipy "numpy<2.3"
echo "audio env: $BASE/audioenv/bin/python"
echo "ml env:    $BASE/mlenv/bin/python"
