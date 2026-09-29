# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../NOTICE)
#
# In-process checks (Flask test client; no server, no Mongo). Run from the repository root:
#   XORUBY_ROOT=/path/to/xoruby-2026 [REVIVAL_REFERENCE_JSON=recipe-infer.json] nix run path:./revival#check
root="${REVIVAL_REPO:-$PWD}"
if [ ! -f "$root/revival/tests/test_revival.py" ]; then
  echo "run from the revival-2026 repository root (or set REVIVAL_REPO)" >&2
  exit 66
fi
export PYTHONDONTWRITEBYTECODE=1
exec python3 -m unittest -v "$root/revival/tests/test_revival.py"
