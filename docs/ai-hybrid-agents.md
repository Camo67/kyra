# Hybrid Offline/Online Agent Blueprint

This repository now ships a reference implementation for AI-enhanced Android APKs that rely on a hybrid offline/online architecture. The code lives under `python_agents/` and is designed to run on both Ubuntu and Android Termux (Python 3.11+).

## Goals

- **Offline-private mode (`AI_AGENT_MODE=offline-private`)**  
  Local Python agents (Termux/Ubuntu) handle sensitive data such as API keys, secrets, and user documents. All file I/O is sandboxed under `agent_data/`, credentials are stored via `keyring`, and every tool invocation emits an encrypted audit log (Fernet AES-128).

- **Online-extended mode (`AI_AGENT_MODE=online-extended`)**  
  Only non-sensitive workloads are routed to upstream providers. Calls go through `tools.call_external_api`, which optionally proxies through `AI_AGENT_PROXY_URL` and reads its token from `AI_AGENT_REMOTE_TOKEN`. Keys never leave the device.

## Modules

| File | Responsibility |
| --- | --- |
| `python_agents/config.py` | Mode toggles, data directories, Fernet key locations |
| `python_agents/tools.py` | Modular tool functions (file I/O, math, credential management, secure API wrapper, Termux app integrations, audit logging) |
| `python_agents/agents.py` | Sample agent dataclasses with tool wiring for offline and online execution |
| `python_agents/main.py` | CLI/Streamlit entry point showing toggles, tool calls, and agent task execution |

## Dependencies

All packages are open-source and available on Termux/Ubuntu:

```
pip install keyring cryptography numpy sympy requests streamlit
```

Termux tips: install `pkg install python clang libffi libcrypt openssl termux-api` before `pip`, and install the Termux:API companion app from F-Droid so commands like `termux-app-list` and `termux-activity-start` work.

## Usage

```bash
# Offline mode
export AI_AGENT_MODE=offline-private
python -m python_agents.main --agent offline_researcher --task "Summarize local file"

# Online mode with proxy
export AI_AGENT_MODE=online-extended
export AI_AGENT_PROXY_URL="https://secure-proxy.example.com"
export AI_AGENT_REMOTE_TOKEN="your_token"
python -m python_agents.main --agent online_connector --task "Fetch public data"

# Streamlit UI for collaborative chats (Termux or Ubuntu)
streamlit run python_agents/main.py

# Example Termux integration (inside Termux)
python -m python_agents.main --agent offline_researcher --tool termux_list_apps
```

Audit logs land in `agent_data/audit.log.enc`. To inspect them, decrypt with the Fernet key stored at `agent_data/fernet.key`.

## Testing Offline Tools

1. `mkdir -p agent_data && echo "private notes" > agent_data/notes.txt`
2. `python -m python_agents.main --agent offline_researcher --tool read_file --tool-args relative_path=notes.txt`
3. `python -m python_agents.main --agent offline_researcher --tool solve_equation --tool-args expression="x**2-4"`

These commands use only offline tooling; audit logs remain encrypted.

## Packaging Considerations

- Bundle `python_agents/` into your Termux workload (for on-device inference) and expose the CLI via your native shell or through a Streamlit WebView inside the Capacitor Android shell.
- Grant Termux:API permissions (notifications, apps) using the Termux:API Android app; the toolkit automatically blocks package names containing "bank" to maintain compliance.
- The Android APK should communicate with these agents via localhost HTTP (e.g., Termux + `termux-services`) without sending private data over the network.
- Extend the Streamlit UI into a "Permissions Dashboard" to show which Termux capabilities are enabled and let the user toggle offline/online mode at runtime.
- Keep dependencies synchronized across Ubuntu CI and Termux by pinning them in `requirements.txt` when you expand this prototype.

Use this blueprint to extend the multi-agent feedback loop system while preserving privacy guarantees on-device.
