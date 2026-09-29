# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../NOTICE)
#
# End to end on 127.0.0.1: start the server (it exits on its own after --max-seconds), upload
# one clip with `curl -F` to both JSON routes, check the pages, an oversized upload and the
# uploads directory, then compare the scores with `just recipe-infer` on the same clip.
#
#   XORUBY_ROOT=... nix run path:./revival#parity -- CLIP.wav RECIPE_INFER.json RECEIPT.json [PORT]
if [ "$#" -lt 3 ]; then
  echo "usage: interpreter-revival-parity CLIP.wav RECIPE_INFER.json RECEIPT.json [PORT]" >&2
  exit 64
fi
clip="$1" reference="$2" receipt="$3" port="${4:-5071}"
root="${REVIVAL_REPO:-$PWD}"
seconds="${REVIVAL_PARITY_SECONDS:-25}"
base="http://127.0.0.1:$port"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

INTERPRETER_DIR="$root/interpreter" interpreter-revival-serve --port "$port" --max-seconds "$seconds" 2> "$work/server.log" &
server=$!
ready=0
for _ in $(seq 1 100); do
  if curl -fsS -o /dev/null "$base/classify/select" 2> /dev/null; then ready=1; break; fi
  sleep 0.2
done
if [ "$ready" -ne 1 ]; then cat "$work/server.log" >&2; echo "server did not answer on $base" >&2; exit 1; fi

curl -fsS -D "$work/select.headers" -F "file=@$clip" "$base/classify/api/select" -o "$work/select.json"
curl -fsS -F "file=@$clip" "$base/classify/api/standard" -o "$work/standard.json"
server_status="$(curl -sS -o "$work/server.html" -w '%{http_code}' "$base/classify/server")"
select_status="$(curl -sS -o "$work/select.html" -w '%{http_code}' "$base/classify/select")"
head -c $((17 * 1024 * 1024)) /dev/zero > "$work/oversized.wav"
oversized_status="$(curl -sS -o /dev/null -w '%{http_code}' -F "file=@$work/oversized.wav" "$base/classify/api/select")"
uploads_left="$(find "$root/interpreter/uploads" -mindepth 1 -maxdepth 1 2> /dev/null | wc -l | tr -d ' ')"

wait "$server" || true  # timeout(1) ends the server with status 124 after --max-seconds

python3 "$root/revival/parity.py" --clip "$clip" --reference "$reference" --receipt "$receipt" \
  --select "$work/select.json" --standard "$work/standard.json" --headers "$work/select.headers" \
  --server-page "$work/server.html" --server-status "$server_status" \
  --select-page "$work/select.html" --select-status "$select_status" \
  --oversized-status "$oversized_status" --uploads-left "$uploads_left" --port "$port"
