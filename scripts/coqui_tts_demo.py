#!/usr/bin/env python3
"""Minimal Coqui TTS CLI helper.

Install deps first:
  pip install --extra-index-url https://download.pytorch.org/whl/cu118 coqui-tts --no-deps
  pip install --extra-index-url https://download.pytorch.org/whl/cu118 torch torchaudio
"""

from __future__ import annotations

import argparse
import pathlib
import sys

try:
    from TTS.api import TTS
except ImportError as exc:  # pragma: no cover - import guard
    sys.stderr.write(
        "Coqui TTS is not installed. Follow docs/coqui-tts.md for setup.\n"
    )
    raise


DEFAULT_MODEL = "tts_models/multilingual/multi-dataset/your_tts"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a WAV file using Coqui TTS.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--text",
        required=True,
        help="Utterance to synthesize.",
    )
    parser.add_argument(
        "--output",
        default="tts-output.wav",
        help="Destination WAV path.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help="Model name from https://coqui.ai",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="Language code supported by the chosen model.",
    )
    parser.add_argument(
        "--speaker",
        default=None,
        help="Speaker ID for multi-speaker models.",
    )
    parser.add_argument(
        "--gpu",
        action="store_true",
        help="Force GPU usage (auto-detect if omitted).",
    )
    return parser.parse_args()


def synthesize() -> None:
    args = parse_args()

    output_path = pathlib.Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    tts = TTS(model_name=args.model, progress_bar=False, gpu=args.gpu)
    tts.tts_to_file(
        text=args.text,
        speaker=args.speaker,
        language=args.language,
        file_path=str(output_path),
    )

    print(f"Wrote synthesized speech to {output_path.resolve()}")


if __name__ == "__main__":
    synthesize()
