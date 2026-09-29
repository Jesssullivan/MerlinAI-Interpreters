# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see NOTICE)
"""The 2026 model behind the repaired 2021 classify routes (revival-2026).

The 2021 routes loaded two TFLite models (demos/models/lite and liteStdOps)
that were never committed. This module stands in for both
TensorFlow Lite interpreter calls: ONNX Runtime on xoruby-2026's reconstruction of
the 2021 training recipe (PCEN + ResNet-18 + sigmoid; three classes; trained
in 2026 on public Wikimedia Commons audio). It is NOT Merlin's model.

Front end: xoruby's own ml/recipe2021/frontend.py, loaded from the xoruby
checkout at run time and never reimplemented here; PCEN runs inside the
ONNX graph. That is the same input contract `just recipe-infer` uses.

Environment:
  XORUBY_ROOT  an xoruby-2026 checkout (required)
  RECIPE_ONNX  the model (default $XORUBY_ROOT/.local/recipe2021/recipe.onnx;
               its recipe.json with the class names sits beside it)
"""
import importlib.util
import json
import os
import subprocess
import threading
import wave

import numpy as np

BANNER = ("2021 interface, repaired in 2026. Model: a 2026 reconstruction trained on "
          "public audio for three species; not Merlin's model.")
SAMPLE_RATE = 22050
WINDOW_SAMPLES = 22050 * 3  # the 2021 select path's MODEL_INPUT_SAMPLE_COUNT and recipe-infer's window

_lock = threading.Lock()
_state = {}


def xoruby_root():
    root = os.environ.get("XORUBY_ROOT")
    if not root:
        raise RuntimeError("XORUBY_ROOT is not set: point it at an xoruby-2026 checkout "
                           "(the model and its front end live there)")
    return os.path.abspath(root)


def model_path():
    return os.path.abspath(os.environ.get("RECIPE_ONNX") or
                           os.path.join(xoruby_root(), ".local", "recipe2021", "recipe.onnx"))


def _load():
    with _lock:
        if not _state:
            import onnxruntime as ort
            frontend_path = os.path.join(xoruby_root(), "ml", "recipe2021", "frontend.py")
            spec = importlib.util.spec_from_file_location("xoruby_recipe2021_frontend", frontend_path)
            frontend = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(frontend)
            path = model_path()
            with open(os.path.splitext(path)[0] + ".json") as f:
                meta = json.load(f)
            session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
            _state.update(frontend=frontend, meta=meta, session=session, path=path)
    return _state


def labels():
    """Index -> class name: the role the 2021 labels.json files played."""
    return list(_load()["meta"]["classes"])


def describe():
    s = _load()
    return {"model": s["path"], "sha256": s["meta"].get("sha256"), "checkpoint": s["meta"].get("checkpoint"),
            "classes": list(s["meta"]["classes"]), "note": s["meta"].get("note")}


def load_22050(path):
    """Mono samples at 22050 Hz on the PCM16 scale (int16 / 32768), as `just recipe-infer` reads them.

    A mono 16-bit 22050 Hz WAV is read as is; anything else is decoded by ffmpeg with the
    arguments xoruby's recipe uses (-ac 1 -ar 22050 -c:a pcm_s16le). This replaces the 2021
    librosa.load(sr=44100) + scipy decimate(q=2) pair, which needed librosa.
    """
    try:
        with wave.open(path) as handle:
            if (handle.getnchannels(), handle.getsampwidth(), handle.getframerate()) == (1, 2, SAMPLE_RATE):
                pcm = handle.readframes(handle.getnframes())
                return np.frombuffer(pcm, dtype="<i2").astype(np.float64) / 32768.0
    except (wave.Error, EOFError):
        pass
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-ac", "1",
                          "-ar", str(SAMPLE_RATE), "-c:a", "pcm_s16le", "-f", "s16le", "-"],
                         check=True, capture_output=True, timeout=60).stdout
    return np.frombuffer(pcm, dtype="<i2").astype(np.float64) / 32768.0


def predict(window):
    """One window (22050 Hz; cut or zero-padded to 3 s) -> per-class probabilities (float32)."""
    s = _load()
    window = np.asarray(window, dtype=np.float64)[:WINDOW_SAMPLES]
    window = np.pad(window, (0, WINDOW_SAMPLES - window.size))
    mel = s["frontend"].mel_power(window).T  # (bands, frames), float64, as recipe-infer
    feed = {s["meta"]["input"]["name"]: mel[None, None].astype(np.float32)}
    return s["session"].run(None, feed)[0][0]
