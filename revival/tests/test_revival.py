# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../../NOTICE)
"""In-process checks of the repaired 2021 app (Flask test client; no server, no Mongo).

    XORUBY_ROOT=/path/to/xoruby-2026 nix run path:./revival#check

Model-dependent tests need XORUBY_ROOT with .local/recipe2021/recipe.onnx (+ .json) and a
22050 Hz clip (REVIVAL_TEST_CLIP, default $XORUBY_ROOT/.local/recipe2021/wav/blue-jay.wav).
REVIVAL_REFERENCE_JSON (the output of `just recipe-infer` on that clip) adds the parity check.
"""
import io
import hashlib
import base64
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
import json
import os
import re
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
INTERPRETER = Path(os.environ.get("INTERPRETER_DIR") or REPO / "interpreter").resolve()
TOLERANCE = 1e-4


def _xoruby(*parts):
    root = os.environ.get("XORUBY_ROOT")
    return Path(root, *parts) if root else None


MODEL = Path(os.environ["RECIPE_ONNX"]) if os.environ.get("RECIPE_ONNX") else _xoruby(".local", "recipe2021", "recipe.onnx")
CLIP = Path(os.environ["REVIVAL_TEST_CLIP"]) if os.environ.get("REVIVAL_TEST_CLIP") else _xoruby(".local", "recipe2021", "wav", "blue-jay.wav")
HAVE_MODEL = bool(MODEL and MODEL.exists() and MODEL.with_suffix(".json").exists() and CLIP and CLIP.exists())


class RevivalApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.chdir(INTERPRETER)  # the 2021 app resolves demos/ and uploads/ from the working directory
        sys.path.insert(0, str(INTERPRETER))
        from app import create_app
        from app.main import revival
        from app.main.classify import config
        cls.revival = revival
        cls.uploads = Path(config.inpath)
        cls.app = create_app()
        cls.app.testing = True
        cls.client = cls.app.test_client()

    def uploads_now(self):
        return set(os.listdir(self.uploads)) if self.uploads.exists() else set()

    def post_clip(self, path):
        with open(CLIP, "rb") as handle:
            return self.client.post(path, data={"file": (io.BytesIO(handle.read()), CLIP.name)},
                                    content_type="multipart/form-data")

    # --- pages -------------------------------------------------------------------------------
    def test_every_page_carries_the_banner(self):
        for path in ("/classify/select", "/classify/standard", "/classify/server"):
            with self.subTest(path=path):
                with self.client.get(path) as response:
                    page = response.get_data(as_text=True)
                self.assertEqual(response.status_code, 200)
                self.assertIn(self.revival.BANNER.replace("'", "&#x27;"), page)
                self.assertIn('data-provenance-model="reconstruction"', page)
                self.assertEqual(response.headers["X-Revival-Banner"], self.revival.BANNER)

    def test_offline_pages_request_only_available_local_resources(self):
        class Resources(HTMLParser):
            def __init__(self):
                super().__init__()
                self.refs = []
                self.scripts = 0

            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == "script":
                    self.scripts += 1
                if tag in ("link", "script", "img", "source", "video", "audio", "iframe"):
                    ref = attrs.get("src") or attrs.get("href")
                    if ref:
                        self.refs.append((tag, ref))

        for route in ("/classify/select", "/classify/standard", "/classify/server"):
            with self.subTest(route=route), self.client.get(route) as response:
                parser = Resources()
                parser.feed(response.get_data(as_text=True))
                self.assertEqual(parser.scripts, 0)
                self.assertIn("script-src 'none'", response.headers["Content-Security-Policy"])
                self.assertIn(("link", "/revival-assets/bootstrap-4.5.0.min.css"), parser.refs)
                for tag, ref in parser.refs:
                    full = urljoin("http://localhost" + route, ref)
                    parsed = urlsplit(full)
                    self.assertEqual(parsed.netloc, "localhost", full)
                    with self.client.get(parsed.path) as asset:
                        self.assertEqual(asset.status_code, 200, full)
                        if parsed.path.endswith(".css"):
                            self.assertEqual(asset.mimetype, "text/css")
                            self.assertNotRegex(asset.get_data(as_text=True), r"url\(\s*[\"']?(?:https?:)?//|@import")

    def test_offline_asset_route_refuses_unlisted_paths(self):
        for name in ("manifest.json", "bootstrap-LICENSE", "../../config/config.cfg", "missing.css"):
            self.assertEqual(self.client.get("/revival-assets/" + name).status_code, 404)

    def test_bootstrap_integrity_and_original_templates(self):
        assets = REPO / "revival" / "assets"
        manifest = json.loads((assets / "manifest.json").read_text())
        for name, digest in manifest["files"].items():
            self.assertEqual(hashlib.sha256((assets / name).read_bytes()).hexdigest(), digest)
        css = (assets / "bootstrap-4.5.0.min.css").read_bytes()
        sri = base64.b64encode(hashlib.sha384(css).digest()).decode()
        for name in ("uploaderSelectOps.html", "uploaderStandardOps.html", "spec_crop_interpreter.html"):
            template = (INTERPRETER / "demos" / name).read_text()
            self.assertIn('integrity="sha384-' + sri + '"', template)
            self.assertIn("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/", template)
        self.assertIn("Permission is hereby granted", (assets / "bootstrap-LICENSE").read_text())

    def test_upload_pages_label_the_2021_sample_output(self):
        for path in ("/classify/select", "/classify/standard"):
            with self.subTest(path=path), self.client.get(path) as response:
                self.assertIn("2021 page&#x27;s own sample text", response.get_data(as_text=True))

    def test_headline_page_says_it_cannot_classify(self):
        with self.client.get("/classify/server") as response:
            page = response.get_data(as_text=True)
        self.assertIn("was never committed, so this page cannot classify here", page)

    def test_root_still_redirects_as_in_2021(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/classify/server"))

    def test_out_of_scope_blueprints_are_off_and_no_mongo_or_tensorflow_is_loaded(self):
        for path in ("/user/", "/reports/x/overview", "/files/x/", "/annotator/audio"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)
        for module in ("pymongo", "bson", "tensorflow", "librosa", "jose", "passlib"):
            self.assertNotIn(module, sys.modules)

    def test_served_code_has_no_shell_true_or_tflite(self):
        served = sorted({Path(m.__file__) for m in list(sys.modules.values())
                         if getattr(m, "__file__", None) and Path(m.__file__).resolve().is_relative_to(INTERPRETER)})
        self.assertTrue(any(p.name == "models.py" for p in served), served)
        for path in served:
            text = path.read_text()
            for needle in ("shell=True", "tf.lite", "import tensorflow", "import librosa"):
                with self.subTest(path=str(path), needle=needle):
                    self.assertNotIn(needle, text)

    # --- uploads -----------------------------------------------------------------------------
    def test_oversized_upload_is_refused(self):
        before = self.uploads_now()
        cap = self.app.config["MAX_CONTENT_LENGTH"]
        self.app.config["MAX_CONTENT_LENGTH"] = 1024
        try:
            response = self.client.post("/classify/api/select", data={"file": (io.BytesIO(b"\0" * 4096), "big.wav")},
                                        content_type="multipart/form-data")
        finally:
            self.app.config["MAX_CONTENT_LENGTH"] = cap
        self.assertEqual(response.status_code, 413)
        self.assertEqual(self.uploads_now(), before)

    def test_default_upload_cap_is_16_mb(self):
        self.assertEqual(self.app.config["MAX_CONTENT_LENGTH"],
                         int(float(os.environ.get("INTERPRETER_MAX_UPLOAD_MB", "16")) * 1024 * 1024))

    @unittest.skipUnless(HAVE_MODEL, "needs XORUBY_ROOT with the recipe ONNX and a clip")
    def test_api_routes_score_three_classes_and_remove_the_upload(self):
        results = {}
        for path in ("/classify/api/select", "/classify/api/standard"):
            with self.subTest(path=path):
                before = self.uploads_now()
                response = self.post_clip(path)
                self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
                body = response.get_json()
                self.assertEqual(body.pop("banner"), self.revival.BANNER)
                self.assertEqual(sorted(body), sorted(json.loads(MODEL.with_suffix(".json").read_text())["classes"]))
                self.assertLessEqual(self.uploads_now(), before)  # this request's directory is gone
                results[path] = {k: float(v) for k, v in body.items()}
        # Both 2021 paths now score the same first 3 s through the same model.
        self.assertEqual(results["/classify/api/select"], results["/classify/api/standard"])
        reference = os.environ.get("REVIVAL_REFERENCE_JSON")
        if reference:
            text = Path(reference).read_text()
            expected = json.loads(text[text.index("{"):])["probabilities"]
            worst = max(abs(results["/classify/api/select"][k] - v) for k, v in expected.items())
            self.assertLessEqual(worst, TOLERANCE)

    @unittest.skipUnless(HAVE_MODEL, "needs XORUBY_ROOT with the recipe ONNX and a clip")
    def test_html_form_flashes_scores_under_the_banner(self):
        response = self.post_clip("/classify/select")
        self.assertEqual(response.status_code, 200)
        page = response.get_data(as_text=True)
        self.assertRegex(page, re.compile(r"blue_jay: 0\.\d+"))
        self.assertLess(page.index("revival-2026-banner"), page.index("blue_jay: "))


if __name__ == "__main__":
    unittest.main()
