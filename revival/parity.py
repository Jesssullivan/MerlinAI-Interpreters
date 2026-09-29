# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../NOTICE)
"""Write the parity receipt for parity.sh: the repaired routes vs `just recipe-infer` on one clip.

A numerical parity check between two front ends of the same 2026 reconstruction
(Python/NumPy + ONNX Runtime here, Ruby + the onnxruntime gem in xoruby), not an
accuracy claim, and nothing about Merlin's model.
"""
import argparse
import datetime
import hashlib
import json
import os
import platform
import subprocess
import sys
from pathlib import Path

TOLERANCE = 1e-4
BANNER = ("2021 interface, repaired in 2026. Model: a 2026 reconstruction trained on "
          "public audio for three species; not Merlin's model.")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def git_head(path):
    try:
        return subprocess.run(["git", "-C", str(path), "rev-parse", "HEAD"], capture_output=True, text=True,
                              check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def versions():
    out = {"python": platform.python_version()}
    for name in ("flask", "werkzeug", "waitress", "numpy", "onnxruntime"):
        try:
            from importlib.metadata import version
            out[name] = version(name)
        except Exception:  # noqa: BLE001 - a missing package is recorded, not fatal
            out[name] = None
    return out


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("--clip", "--reference", "--receipt", "--select", "--standard", "--headers",
                 "--server-page", "--select-page"):
        parser.add_argument(name, required=True)
    for name in ("--server-status", "--select-status", "--oversized-status", "--uploads-left", "--port"):
        parser.add_argument(name, type=int, required=True)
    args = parser.parse_args(argv)

    text = Path(args.reference).read_text()
    reference = json.loads(text[text.index("{"):])
    expected = reference["probabilities"]
    routes = {}
    for route, path in (("/classify/api/select", args.select), ("/classify/api/standard", args.standard)):
        body = json.loads(Path(path).read_text())
        banner = body.pop("banner", None)
        scores = {name: float(value) for name, value in body.items()}
        routes[route] = {"raw": json.loads(Path(path).read_text()), "banner_ok": banner == BANNER,
                         "classes_match": sorted(scores) == sorted(expected),
                         "max_abs_vs_recipe_infer": max(abs(scores.get(k, float("inf")) - v) for k, v in expected.items())}
    headers = Path(args.headers).read_text()
    server_page = Path(args.server_page).read_text()
    select_page = Path(args.select_page).read_text()
    model_path = os.environ.get("RECIPE_ONNX") or str(Path(os.environ["XORUBY_ROOT"], ".local/recipe2021/recipe.onnx"))
    model_meta = json.loads(Path(model_path).with_suffix(".json").read_text())
    checks = {
        "select_within_tolerance": routes["/classify/api/select"]["max_abs_vs_recipe_infer"] <= TOLERANCE,
        "standard_within_tolerance": routes["/classify/api/standard"]["max_abs_vs_recipe_infer"] <= TOLERANCE,
        "json_banner": all(r["banner_ok"] for r in routes.values()),
        "three_classes": all(r["classes_match"] for r in routes.values()) and len(expected) == 3,
        "banner_header": "X-Revival-Banner: " + BANNER in headers,
        "server_page_200_with_banner": args.server_status == 200 and "revival-2026-banner" in server_page,
        "select_page_200_with_banner": args.select_status == 200 and "revival-2026-banner" in select_page,
        "oversized_upload_413": args.oversized_status == 413,
        "uploads_removed": args.uploads_left == 0,
    }
    root = Path(__file__).resolve().parents[1]
    receipt = {
        "title": "Repaired 2021 interpreter routes vs just recipe-infer, one clip (revival-2026)",
        "note": ("2021 interface, repaired in 2026; model: a 2026 reconstruction (xoruby-2026 ml/recipe2021), not "
                 "Merlin's model. One clip; a numerical parity check between two front ends of the same ONNX "
                 "graph, not an accuracy claim."),
        "date_utc": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        "tolerance": TOLERANCE,
        "pass": all(checks.values()),
        "checks": checks,
        "served": {"bind": f"127.0.0.1:{args.port}", "server": "waitress-serve --call app:create_app",
                   "revival_commit": git_head(root), "xoruby_commit": git_head(os.environ.get("XORUBY_ROOT", "."))},
        "clip": {"path": args.clip, "sha256": sha256(args.clip), "upload": "curl -F file=@<clip>"},
        "model": {"path": model_path, "sha256": sha256(model_path), "checkpoint": model_meta.get("checkpoint"),
                  "classes": model_meta.get("classes")},
        "routes": routes,
        "recipe_infer": {"probabilities": expected, "runtime": reference.get("runtime")},
        "runtime": versions(),
    }
    Path(args.receipt).write_text(json.dumps(receipt, indent=1) + "\n")
    print(json.dumps({"pass": receipt["pass"], "checks": checks,
                      "max_abs": {k: v["max_abs_vs_recipe_infer"] for k, v in routes.items()}}, indent=1))
    return 0 if receipt["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
