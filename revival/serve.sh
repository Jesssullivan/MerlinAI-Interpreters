# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../NOTICE)
#
# Serve the repaired 2021 interpreter on loopback only (hosting ruling: 127.0.0.1 on the
# presenting laptop; a tailnet preview goes in front of this port, never a public path).
#
#   XORUBY_ROOT=/path/to/xoruby-2026 nix run path:./revival -- [--port 5000] [--max-seconds N]
#
# Run from the repository root (or set INTERPRETER_DIR to its interpreter/ directory).
# --max-seconds makes the server exit on its own through timeout(1), in its own process tree.
port="${PORT:-5000}"
max_seconds=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --port) port="$2"; shift 2 ;;
    --max-seconds) max_seconds="$2"; shift 2 ;;
    *) echo "usage: interpreter-revival-serve [--port N] [--max-seconds N]" >&2; exit 64 ;;
  esac
done
dir="${INTERPRETER_DIR:-$PWD/interpreter}"
if [ ! -f "$dir/app/main/revival.py" ]; then
  echo "no revival-2026 interpreter at $dir (run from the repository root or set INTERPRETER_DIR)" >&2
  exit 66
fi
: "${XORUBY_ROOT:?set XORUBY_ROOT to an xoruby-2026 checkout (the model and its front end live there)}"
model="${RECIPE_ONNX:-$XORUBY_ROOT/.local/recipe2021/recipe.onnx}"
if [ ! -f "$model" ] || [ ! -f "${model%.onnx}.json" ]; then
  echo "model not found: $model (and its .json); see README.md, 'Revival 2026', 'Run it'" >&2
  exit 66
fi
export XORUBY_ROOT RECIPE_ONNX="$model" PYTHONDONTWRITEBYTECODE=1
cd "$dir"
echo "revival-2026: http://127.0.0.1:$port/classify/select (model $model; loopback only)" >&2
serve=(waitress-serve --listen="127.0.0.1:$port" --threads=4 --call app:create_app)
if [ "$max_seconds" -gt 0 ]; then
  exec timeout --signal=TERM "$max_seconds" "${serve[@]}"
fi
exec "${serve[@]}"
