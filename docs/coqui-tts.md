# Coqui TTS Setup

Use this guide to add speech synthesis to the project with the [Coqui TTS](https://github.com/coqui-ai/TTS) library and NVIDIA CUDA 11.8 wheels.

## 1. Create an isolated Python env

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
```

## 2. Install dependencies (CUDA 11.8)

All commands reuse the CUDA 11.8 wheel index so the GPU-enabled builds are selected:

```bash
pip install --extra-index-url https://download.pytorch.org/whl/cu118 coqui-tts --no-deps
pip install --extra-index-url https://download.pytorch.org/whl/cu118 torch torchaudio
```

Notes:

- The `--no-deps` flag prevents pip from pulling CPU-only Torch wheels; we install the matching GPU builds explicitly.
- On a CPU-only machine you can omit the `--extra-index-url` flag and drop `--no-deps`.

## 3. Generate speech

`scripts/coqui_tts_demo.py` wraps the recommended usage (`from TTS.api import TTS`) and exposes a small CLI:

```bash
python scripts/coqui_tts_demo.py \
  --text "Coqui TTS is now wired up." \
  --output ./data/tts-sample.wav \
  --language en \
  --speaker speaker_0
```

Arguments:

- `--text`: required phrase to synthesize.
- `--output`: destination `.wav` file.
- `--model`: override the default `tts_models/multilingual/multi-dataset/your_tts`.
- `--language`: language code supported by the chosen model.
- `--speaker`: optional speaker ID for multi-speaker checkpoints.

First run will download model files under `~/.local/share/tts`; subsequent runs are instant.
