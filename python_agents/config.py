"""
Configuration helpers for the hybrid offline/online agent runtime.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


OFFLINE_MODE = "offline-private"
ONLINE_MODE = "online-extended"


@dataclass(frozen=True)
class AgentConfig:
    mode: str = OFFLINE_MODE
    data_root: Path = Path(os.environ.get("AI_AGENT_DATA_ROOT", Path.cwd() / "agent_data"))
    audit_log_path: Path = Path(
        os.environ.get("AI_AGENT_AUDIT_LOG", Path.cwd() / "agent_data" / "audit.log.enc")
    )
    encryption_key_path: Path = Path(
        os.environ.get("AI_AGENT_FERNET_KEY", Path.cwd() / "agent_data" / "fernet.key")
    )
    proxy_url: str | None = os.environ.get("AI_AGENT_PROXY_URL")
    api_token_env: str = os.environ.get("AI_AGENT_API_TOKEN_ENV", "AI_AGENT_REMOTE_TOKEN")

    @property
    def api_token(self) -> str | None:
        return os.environ.get(self.api_token_env)


def load_config() -> AgentConfig:
    mode = os.environ.get("AI_AGENT_MODE", OFFLINE_MODE)
    if mode not in {OFFLINE_MODE, ONLINE_MODE}:
        mode = OFFLINE_MODE
    cfg = AgentConfig(mode=mode)
    cfg.data_root.mkdir(parents=True, exist_ok=True)
    cfg.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.encryption_key_path.parent.mkdir(parents=True, exist_ok=True)
    return cfg

