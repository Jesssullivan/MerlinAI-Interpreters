# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see NOTICE)
"""revival-2026 glue around the 2021 app: the banner, an upload cap and a per-process secret.

Nothing here changes what the 2021 routes compute (the model swap is in
classify/recipe_onnx.py). Every HTML page gets the banner at the top; every
JSON answer from /classify/api/* gets a "banner" key; every response carries
an X-Revival-Banner header.

Environment:
  INTERPRETER_MAX_UPLOAD_MB  upload cap in MB (default 16); larger bodies get 413
  INTERPRETER_SECRET_KEY     Flask session key for the 2021 flash() messages
                             (default: random per process; the key committed in
                             config/config.cfg in 2021 is not used)
  INTERPRETER_2021_EXTRAS=1  also register the 2021 blueprints outside the revival's
                             scope (userdb, datadb, reports, annotator, models, static).
                             Off by default; they need the 2021 dependencies
                             (python-jose, passlib, pymongo), which revival/flake.nix
                             does not provide.
"""
import html
import json
import os
import secrets

from flask import abort, request

from .classify.recipe_onnx import BANNER

EXTRAS = os.environ.get("INTERPRETER_2021_EXTRAS") == "1"

SERVER_PAGE_NOTE = ("This 2021 page ran a TensorFlow.js model in the browser; that model was never "
                    "committed, so this page cannot classify here. The repaired routes are the "
                    "server-side ones: ")

_STYLE = ("position:relative;z-index:100000;margin:0;padding:10px 16px;background:#fff3cd;color:#1d1d1d;"
          "border-bottom:3px solid #8a6d00;font:600 16px/1.45 system-ui,-apple-system,sans-serif;")


def banner_html(path):
    extra = ""
    if path.rstrip("/") == "/classify/server":
        extra = ('<br><span style="font-weight:400">' + html.escape(SERVER_PAGE_NOTE) +
                 '<a href="/classify/select">Select Ops</a> and <a href="/classify/standard">Standard Ops</a>.</span>')
    return ('<div id="revival-2026-banner" role="note" data-provenance-interface="repaired" '
            'data-provenance-model="reconstruction" style="' + _STYLE + '">' + html.escape(BANNER) + extra + '</div>')


def _inject(page, banner):
    lower = page.lower()
    at = lower.find("</head>")
    if at >= 0:
        at += len("</head>")
    else:
        body = lower.find("<body")
        at = lower.find(">", body) + 1 if body >= 0 else 0
    return page[:at] + "\n" + banner + "\n" + page[at:]


def install(app):
    app.config["SECRET_KEY"] = os.environ.get("INTERPRETER_SECRET_KEY") or secrets.token_hex(32)
    app.config["MAX_CONTENT_LENGTH"] = int(float(os.environ.get("INTERPRETER_MAX_UPLOAD_MB", "16")) * 1024 * 1024)

    @app.before_request
    def refuse_oversized_upload():
        # Refuse before a 2021 route makes its per-request upload directory.
        cap = app.config.get("MAX_CONTENT_LENGTH")
        if cap and request.content_length is not None and request.content_length > cap:
            abort(413)

    @app.after_request
    def revival_banner(response):
        response.headers["X-Revival-Banner"] = BANNER
        if 300 <= response.status_code < 400 or response.status_code == 206:
            return response
        if response.mimetype == "text/html":
            response.direct_passthrough = False
            page = response.get_data(as_text=True)
            response.set_data(_inject(page, banner_html(request.path)))
        elif response.mimetype == "application/json" and request.path.startswith("/classify/api/"):
            data = json.loads(response.get_data(as_text=True))
            if isinstance(data, dict):
                data["banner"] = BANNER
                response.set_data(json.dumps(data, indent=1, sort_keys=True) + "\n")
        return response

    return app
