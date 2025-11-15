# ML Project Skeleton

Prepared for iterative experimentation with TensorFlow, PyTorch, and scikit-learn.

## Structure
- `data/`: landing directory for raw and processed datasets.
- `notebooks/`: exploratory notebooks (prefer naming `analysis.ipynb` or `model_prototype.ipynb`).
- `scripts/`: reusable preprocessing and training scripts.
- `models/`: checkpoints, exports, or serialized artifacts.
- `utils/`: helper modules for data handling, metrics, etc.

See `docs/environment.md` for environment setup details and `docs/packaging.md` for next steps toward PC packaging.

## Python + Termux workflow for Play Store readiness
1. **Termux environment prep**
   - Update Termux (`pkg upgrade`) and install tooling: `pkg install python git clang cmake nodejs openjdk-17`. These cover Python ML dependencies, native build tools, and Java for Android packaging.
   - Keep projects under `~/storage/shared/projects` or a Git repo synced from this template to make it easy to move artifacts off-device.
2. **Model coding in Python**
   - Create a virtual environment (`python -m venv .venv && source .venv/bin/activate`) and install the frameworks you need (TensorFlow, PyTorch, scikit-learn) via `pip`.
   - Track experiments with scripts in `scripts/` and notebooks in `notebooks/`; pin dependencies in `requirements.txt` or `pyproject.toml`.
   - Export trained checkpoints to portable formats (SavedModel, TorchScript, ONNX) inside `models/` so they can later be bundled with a mobile app.
3. **Bridging Python to Android**
   - For Python-first apps, rely on Termux-friendly Android bridges such as Kivy (buildozer), BeeWare, or Chaquopy. Each can consume the exported model artifacts and expose inference APIs to your UI layer.
   - Alternatively, convert models to TensorFlow Lite or ONNX Runtime Mobile, then integrate them in a native Android or React Native shell while keeping Python-based training here.
4. **Testing and optimization**
   - Use Termux to run unit tests (`pytest`) plus lightweight benchmarks to gauge latency and memory consumption on-device.
   - Profile inference, quantize or prune models, and validate fallbacks (e.g., CPU-only execution) to meet Play Store performance expectations.
5. **Play Store release checklist**
   - Generate signed release APKs/AABs from your chosen Android toolchain, run `bundletool`/`apksigner`, and verify on multiple devices.
   - Ensure compliance with Google Play policies (privacy labels, data safety, permissions), include an offline-friendly onboarding flow, and prepare marketing assets before submission.

Following this flow lets you iterate on ML code inside Termux, package optimized artifacts, and ship an Android experience that meets Play Store requirements.

## Termux integration confirmation
Termux is treated as the primary runtime for the multi-agent AI interface: it hosts local Ollama models, proxies LiteLLM routes for external APIs, serves the Streamlit UI, and exposes the experience over ngrok without relying on a desktop. Thanks to Termux's Linux-like userland, every dependency mentioned in this repo (pkg, pip, tmux, ngrok, etc.) can be installed and managed directly on Android, making it practical to keep the entire orchestration loop on a mobile device.

## Key integration benefits
- Portability: carry the full ML stack (training, inference, UI, tunnels) on Android hardware with offline-friendly local models and only enable networking when needed.
- Cost control: rely on free local LLMs plus free-tier Gemini/HF/Groq calls via LiteLLM while keeping secrets and artifacts on-device.
- Multi-agent collaboration: AutoGen agents coordinate model routing, QA, DevOps, and Notion/NotebookLM integrations while Streamlit handles multi-user chats.
- Custom UI flexibility: Streamlit dashboards render in Android browsers, support invites, and tie directly into backend tooling such as Notion MCP servers.
- Operational simplicity: tmux sessions keep Ollama, Streamlit, and ngrok running persistently with minimal energy overhead.

## Termux-ready UI generation prompt
Use the following prompt with a local Ollama model (or any free LLM) to emit the Termux-compatible Streamlit/AutoGen UI code:

```
You are an expert Android/Termux developer and AI engineer, proficient in building multi-agent systems with Streamlit, AutoGen, LiteLLM, Ollama, Notion API, and Google NotebookLM. Generate complete, Termux-optimized Python code for a custom online multi-user UI that runs natively in Termux for collaborative software development.

Context: The system is hosted in Termux on Android, simulating a virtual team for building apps like a 'Task Manager Mobile App' (React Native, auth, CRUD, Firebase sync). Integrate:
- Local free models: DeepSeek-R1:1.5B, LLaMA 3.2 3B, Mistral 7B via Ollama (install with pkg install git cmake; ollama pull <model>).
- Online free models: Gemini (free tier), Hugging Face Inference, Groq LLaMA via LiteLLM proxy.
- Notion agent: MCP for databases/tasks (notion-client pip install).
- NotebookLM agent: Doc synthesis (google-generativeai pip install).
- Multi-user: Invite via links, JWT auth, up to 10 users in group chats.
- Termux-Specific: Use pkg for deps (e.g., pkg install python nodejs), ngrok for online tunneling (chmod +x ngrok; ./ngrok http 8501), and tmux for background sessions.

Requirements:
1. Streamlit UI: Responsive dashboard with sidebar (invites, model plugs), chat panel (threaded, real-time via session state), mobile-optimized for Android browsers.
2. AutoGen Orchestration: Group chat with agents (PM: Gemini; Dev: LLaMA; QA: HF; DevOps: Groq; Notion: tracking; NotebookLM: insights); route via LiteLLM (pip install litellm) for free/no-key calls.
3. User Management: Simple auth with streamlit-authenticator; invite button generates ngrok URLs; sync with WebSockets if needed (flask-socketio).
4. Termux Deployment: Include script to setup env (pkg update; pip install streamlit autogen litellm ollama notion-client google-generativeai); handle storage ($HOME/.streamlit) and errors (e.g., rate limits).
5. Outputs: Full app.py with imports, Termux setup commands in comments, ngrok integration, example run: streamlit run app.py --server.port 8501, then ngrok for online.
6. Modular Code: Functions for Termux init, agent config, chat handler; ensure lightweight for Android CPU (e.g., quantized models).
7. Security: HTTPS via ngrok, token storage in Termux vars (export NOTION_TOKEN=...).

Step-by-Step:
- Termux env setup function.
- Agent and LiteLLM init.
- UI: Login, invites, chat flow (user input -> agent round -> Notion/NotebookLM updates).
- Deployment: Notes for persistent run (tmux new -s ai-ui 'streamlit run app.py').

Example Termux Snippet:
import os
os.system('pkg install -y python nodejs')  # Initial setup
import streamlit as st
# ... rest of app

Generate the code now, fully compatible with Termux v0.118+.
```

## Termux setup steps
1. **Update & packages**: `pkg update && pkg upgrade -y` followed by `pkg install python nodejs git cmake clang wget tmux -y` to cover compilers, UI tooling, and session management.
2. **Python deps**: `pip install streamlit autogen litellm ollama notion-client google-generativeai streamlit-authenticator flask-socketio` to support the UI, agent routing, and collaboration stack.
3. **Local models**: Install Ollama (`git clone https://github.com/ollama/ollama && cd ollama && go build && ./ollama serve &`) and pull required models: `ollama pull deepseek-r1:1.5b`, `ollama pull llama3.2:3b`, `ollama pull mistral:7b`.
4. **Ngrok tunneling**: Download (`wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz`), extract, run `./ngrok authtoken <TOKEN>`, then expose Streamlit with `./ngrok http 8501`.
5. **Run sessions**: Launch Streamlit via tmux (`tmux new -s multi-ai 'streamlit run app.py --server.port 8501'`), keep Ollama and LiteLLM proxies in their own panes, and share the ngrok URL for collaborators.
6. **Agent credentials**: Export tokens before launching (`export NOTION_TOKEN=...`, `export GOOGLE_API_KEY=...`) so Notion/NotebookLM integrations work for each chat round.

## Potential challenges and fixes
- **Storage pressure**: Large model weights may exceed internal storage. Run `termux-setup-storage` and move Ollama data to an SD card or use quantized/gguf variants.
- **Ngrok limits**: Free tunnels reset hourly; either script restarts in cron/at, or switch to paid ngrok/Cloudflare tunnels for long-running demos.
- **Device performance**: 7B models can tax CPUs; prefer 4-bit quantization, restrict concurrent sessions, and offload heavier inference to Groq/Gemini.
- **Multi-user latency**: If Streamlit session state feels sluggish, add LiteLLM caching, reduce message payloads, or add polling intervals instead of continuous sockets.
- **Auth validation**: Test streamlit-authenticator flows in incognito/mobile browsers to confirm ngrok HTTPS, JWT handling, and invite links behave as expected.

## Google Cloud + VS Code workflow
For desktop development, enable Cloud Code in VS Code so you can manage Google Cloud resources without leaving the IDE:

1. **Install Cloud Code**: In VS Code open the Extensions view (`Ctrl+Shift+X`), search for "Google Cloud Code", and install/restart. This adds Kubernetes, Cloud Run, Cloud APIs, and Gemini Code Assist tooling.
2. **Authenticate**: Use the Cloud Code status bar entry to sign in via browser, or run `gcloud auth application-default login` in the VS Code terminal to reuse existing credentials.
3. **Develop and deploy**: From the Cloud Code side panel you can pick projects, browse APIs, scaffold services, debug Kubernetes/Cloud Run apps, deploy, manage secrets, and open BigQuery notebooks or terminals. SSH into VM instances directly from the IDE when remote debugging is needed.
4. **AI assistance**: Gemini Code Assist inside Cloud Code offers inline completions, code generation, and troubleshooting aligned with Google Cloud services.
5. **API keys when needed**: Most workflows rely on your authenticated account, but create/manage service-specific API keys under Google Cloud Console → APIs & Services → Credentials for public endpoints or client-side usage.

This setup keeps your cloud workflows close to the codebase while the Termux instructions handle on-device experimentation.

## Perplexity pplx-api integration
Treat Perplexity like every other provider in your API Key Manager so Codex/backends can consume it consistently:

1. **Schema entry**
   ```yaml
   required_api_keys:
     - service: "Perplexity API"
       provider: "Perplexity"
       type: "API_KEY"
       free_tier: "Pro / Enterprise"
       portal_url: "https://www.perplexity.ai/settings/api"
       env_var: "PERPLEXITY_API_KEY"
       prefix: "pplx_"
       description: "For pplx-api chat/completions in the multi-agent system"
       environments: ["Desktop", "Mobile", "Cloud"]
   ```
2. **Key generation guide**
   ```yaml
   key_generation_guides:
     - service: "Perplexity API"
       steps:
         - {step: 1, action: "Log into https://www.perplexity.ai"}
         - {step: 2, action: "Open Settings → API / API Keys"}
         - {step: 3, action: "Click 'Generate API Key'"}
         - {step: 4, action: "Name it (e.g., 'multi-agent-ai-codex') and confirm"}
         - {step: 5, action: "Copy the key starting with 'pplx-' and store it"}
       verification:
         - "Key string begins with 'pplx-'"
         - "/chat/completions returns choices[0].message.content"
   ```
3. **Environment configs**
   - Desktop `.env` → `PERPLEXITY_API_KEY="pplx_xxx"`
   - Termux session → `export PERPLEXITY_API_KEY="pplx_xxx"`
   - Cloud Run deploy → `--update-env-vars PERPLEXITY_API_KEY=pplx_xxx`
4. **Backend usage**
   ```python
   import os, requests

   PPLX_API_KEY = os.getenv("PERPLEXITY_API_KEY")

   def ask_perplexity(messages):
       resp = requests.post(
           "https://api.perplexity.ai/chat/completions",
           headers={
               "Authorization": f"Bearer {PPLX_API_KEY}",
               "Content-Type": "application/json",
           },
           json={"model": "pplx-70b-online", "messages": messages, "stream": False},
           timeout=60,
       )
       resp.raise_for_status()
       return resp.json()
   ```
   Use that helper inside your AutoGen/LiteLLM agents so Perplexity is just another backend.
5. **Connectivity test**
   ```bash
   curl https://api.perplexity.ai/chat/completions \
     -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"pplx-70b-online","messages":[{"role":"user","content":"Hello"}],"stream":false}'
   ```
6. **Safety reminder**
   Store only schemas/templates in Git; actual keys stay in `.env`, Termux exports, secret managers, or deployment-time env vars.

### Grok (xAI) integration
Add Grok to the same key manager pattern so agents can hit Grok chat endpoints:

1. **Schema entry**
   ```yaml
   required_api_keys:
     - service: "Grok API"
       provider: "xAI"
       type: "API_KEY"
       env_var: "GROK_API_KEY"
       description: "Access token for Grok chat/completions"
       environments: ["Desktop", "Mobile", "Cloud"]
   ```
2. **Example key**
   `.env.example` lists a placeholder under `GROK_API_KEY`. Replace it with your actual xAI token inside `.env.local`/Termux exports.
3. **Usage snippet**
   ```python
   import os, requests

   GROK_API_KEY = os.getenv("GROK_API_KEY")

   def ask_grok(messages):
       resp = requests.post(
           "https://api.x.ai/v1/chat/completions",
           headers={"Authorization": f"Bearer {GROK_API_KEY}", "Content-Type": "application/json"},
           json={"model": "grok-beta", "messages": messages},
           timeout=60,
       )
       resp.raise_for_status()
       return resp.json()
   ```
4. **Connectivity test**
   ```bash
   curl https://api.x.ai/v1/chat/completions \
     -H "Authorization: Bearer $GROK_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"grok-beta","messages":[{"role":"user","content":"ping"}]}'
   ```

### Hugging Face Inference integration
1. **Schema entry**
   ```yaml
   required_api_keys:
     - service: "Hugging Face Inference"
       provider: "Hugging Face"
       type: "API_KEY"
       env_var: "HUGGINGFACE_API_KEY"
       description: "Direct calls to Inference Endpoints / text-generation"
       environments: ["Desktop", "Mobile", "Cloud"]
   ```
2. **Model + key**
   `.env.example` now includes `HUGGINGFACE_MODEL_ID=meta-llama/Meta-Llama-3.1-8B-Instruct` plus a placeholder `HUGGINGFACE_API_KEY`. Overwrite the placeholder with your actual HF token locally.
3. **Usage snippet**
   ```python
   import os, requests

   HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
   HF_MODEL = os.getenv("HUGGINGFACE_MODEL_ID", "meta-llama/Meta-Llama-3.1-8B-Instruct")

   def ask_hf(prompt: str):
       resp = requests.post(
           f"https://api-inference.huggingface.co/models/{HF_MODEL}",
           headers={"Authorization": f"Bearer {HF_API_KEY}"},
           json={"inputs": prompt},
           timeout=60,
       )
       resp.raise_for_status()
       return resp.json()
   ```
4. **Connectivity test**
   ```bash
   curl https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct \
     -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"inputs":"Hello"}'
   ```

### Google AI Studio (Gemini) integration
1. **Schema entry**
   ```yaml
   required_api_keys:
     - service: "Google AI Studio"
       provider: "Google"
       type: "API_KEY"
       env_var: "GOOGLE_API_KEY"
       description: "Gemini/NotebookLM access from AutoGen + Termux"
       environments: ["Desktop", "Mobile", "Cloud"]
   ```
2. **Key storage**
   `.env.example` contains a placeholder `GOOGLE_API_KEY`. Replace it with your Google AI Studio key inside `.env.local`/Termux exports.
3. **Usage snippet**
   ```python
   import os, requests

   GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

   def ask_gemini(prompt: str):
       resp = requests.post(
           "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
           params={"key": GOOGLE_API_KEY},
           json={"contents": [{"parts": [{"text": prompt}]}]},
           timeout=60,
       )
       resp.raise_for_status()
       return resp.json()
   ```
4. **Connectivity test**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GOOGLE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

## Git workflow (repo + remote)
1. **Initialize & track**: If this folder is fresh, run `git init`, then `git add -A` to stage everything and `git commit -m "chore: bootstrap project"`.
2. **Create remote**: Make an empty repo on GitHub/GitLab, copy its SSH/HTTPS URL, and link it with `git remote add origin <URL>`.
3. **Push baseline**: `git push -u origin master` (or `main`) to sync the entire history. Future commits can use `git commit -am "feat: ..."` followed by `git push`.
4. **Secrets hygiene**: Keep `.env` files out of Git and rely on `.env.example` plus secret stores (GitHub Actions secrets, Firebase config, Termux exports) for actual values.

## Firebase integration
1. **Dependencies**: `npm install firebase firebase-admin` (already added to `package.json`).
2. **Env vars**: Copy `.env.example` to `.env.local` (desktop) or export in Termux; fill the Firebase client + admin values from your Firebase console.
3. **CLI setup**: `npm i -g firebase-tools`, run `firebase login`, then `firebase init` (choose Hosting/Firestore/Auth as needed and select your project).
4. **Config files**: The repo exposes `lib/firebase/client.ts` for browser usage and `lib/firebase/admin.ts` for server-side code (API routes, RSC). Import these helpers wherever you interact with Firestore/Auth/Storage.
5. **Deployment**: Build with `npm run build`, then `firebase deploy --only hosting` (or integrate with Cloud Run/Functions depending on your architecture).
6. **Termux tip**: Install Firebase CLI via `npm`, authenticate once, and run deployments from tmux sessions just like the rest of the stack.

### Firebase project metadata
- **Project name**: `kira`
- **Project ID**: `kira-d74fa`
- **Project number**: `508668209646`
- **Environment type**: `Unspecified` (customize later per stage if needed)

### Android / Termux in-app guide
- The main workspace header now includes a **Termux Guide** button (see `app/page.tsx`). Tapping it on Android brings up a modal with every required Termux command grouped by stage (updates, Python deps, Ollama, ngrok/tmux, env exports).
- Each command block has a copy icon, so you can paste directly into Termux without retyping on mobile.
- The guide mirrors the sections above, ensuring offline local models plus remote tunnels can be configured entirely from an Android device.
