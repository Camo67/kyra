"""
Agent tool implementations with mandatory audit logging and mode awareness.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List

import keyring
import numpy as np
import requests
import sympy as sp
from cryptography.fernet import Fernet

from .config import AgentConfig, OFFLINE_MODE, ONLINE_MODE, load_config


class AuditLogger:
    def __init__(self, config: AgentConfig):
        self.config = config
        self._fernet = None

    def _load_fernet(self) -> Fernet:
        if self._fernet:
            return self._fernet
        key_path = self.config.encryption_key_path
        if key_path.exists():
            key = key_path.read_bytes()
        else:
            key = Fernet.generate_key()
            key_path.write_bytes(key)
        self._fernet = Fernet(key)
        return self._fernet

    def log(self, event: str, payload: Dict[str, Any]) -> None:
        record = {
            "ts": time.time(),
            "mode": self.config.mode,
            "event": event,
            "payload": payload,
        }
        serialized = json.dumps(record, sort_keys=True).encode("utf-8")
        if self.config.mode == OFFLINE_MODE:
            serialized = self._load_fernet().encrypt(serialized)
        else:
            serialized += b"\n"
        with self.config.audit_log_path.open("ab") as handle:
            handle.write(serialized)
            if self.config.mode == OFFLINE_MODE:
                handle.write(b"\n")


audit_logger = AuditLogger(load_config())


def require_mode(mode: str):
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            cfg = kwargs.get("config") or load_config()
            if cfg.mode != mode:
                audit_logger.log(
                    "tool_denied",
                    {"tool": func.__name__, "required_mode": mode, "current_mode": cfg.mode},
                )
                raise PermissionError(f"{func.__name__} requires {mode}, not {cfg.mode}")
            return func(*args, **kwargs)

        return wrapper

    return decorator


def _ensure_under_root(path: Path, root: Path) -> Path:
    path = path.expanduser().resolve()
    root = root.expanduser().resolve()
    if root not in path.parents and path != root:
        raise PermissionError(f"Access to {path} not allowed; must be inside {root}")
    return path


def read_file(relative_path: str, config: AgentConfig | None = None) -> str:
    cfg = config or load_config()
    path = _ensure_under_root(Path(cfg.data_root, relative_path), cfg.data_root)
    data = path.read_text()
    audit_logger.log("read_file", {"path": str(path)})
    return data


def write_file(relative_path: str, content: str, config: AgentConfig | None = None) -> None:
    cfg = config or load_config()
    path = _ensure_under_root(Path(cfg.data_root, relative_path), cfg.data_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    audit_logger.log("write_file", {"path": str(path), "bytes": len(content.encode("utf-8"))})


def copy_file(src: str, dst: str, config: AgentConfig | None = None) -> None:
    cfg = config or load_config()
    src_path = _ensure_under_root(Path(cfg.data_root, src), cfg.data_root)
    dst_path = _ensure_under_root(Path(cfg.data_root, dst), cfg.data_root)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_path, dst_path)
    audit_logger.log("copy_file", {"src": str(src_path), "dst": str(dst_path)})


def solve_equation(expression: str, variable: str = "x") -> str:
    sym = sp.symbols(variable)
    solutions = sp.solve(sp.sympify(expression), sym)
    audit_logger.log("solve_equation", {"expression": expression, "variable": variable})
    return json.dumps([str(sol) for sol in solutions])


def vector_norm(values: Iterable[float]) -> float:
    array = np.asarray(list(values), dtype=float)
    norm = float(np.linalg.norm(array))
    audit_logger.log("vector_norm", {"values": list(array), "norm": norm})
    return norm


class CredentialManager:
    def __init__(self, service: str = "hybrid-agent"):
        self.service = service

    def store(self, username: str, secret: str) -> None:
        keyring.set_password(self.service, username, secret)
        audit_logger.log("credential_store", {"username": username})

    def fetch(self, username: str) -> str | None:
        secret = keyring.get_password(self.service, username)
        audit_logger.log("credential_fetch", {"username": username, "found": secret is not None})
        return secret

    def delete(self, username: str) -> None:
        keyring.delete_password(self.service, username)
        audit_logger.log("credential_delete", {"username": username})


@require_mode(ONLINE_MODE)
def call_external_api(
    endpoint: str,
    payload: Dict[str, Any],
    *,
    config: AgentConfig | None = None,
) -> Dict[str, Any]:
    cfg = config or load_config()
    headers = {"Authorization": f"Bearer {cfg.api_token}"} if cfg.api_token else {}
    if cfg.proxy_url:
        endpoint = f"{cfg.proxy_url.rstrip('/')}/{endpoint.lstrip('/')}"
    response = requests.post(endpoint, json=payload, timeout=20, headers=headers)  # noqa: S113
    response.raise_for_status()
    audit_logger.log("call_external_api", {"endpoint": endpoint, "status": response.status_code})
    return response.json()


def local_api_stub(task: str, *, config: AgentConfig | None = None) -> Dict[str, Any]:
    cfg = config or load_config()
    audit_logger.log("local_api_stub", {"task": task})
    return {"mode": cfg.mode, "task": task, "result": f"Offline stub completed: {task}"}


# --- Termux / Android bridging -------------------------------------------------

TERMUX_COMMANDS = {"termux-app-list", "termux-activity-start", "termux-notification-list"}
PROHIBITED_PACKAGES = {"com.bank", "com.android.bankapp"}


def _ensure_termux_available() -> None:
    for cmd in TERMUX_COMMANDS:
        if shutil.which(cmd):
            return
    raise EnvironmentError("Termux:API commands not available. Install termux-api package.")


def termux_list_apps(config: AgentConfig | None = None) -> List[str]:
    _ensure_termux_available()
    result = subprocess.run(  # noqa: S603,S607
        ["termux-app-list"],
        capture_output=True,
        text=True,
        check=True,
    )
    try:
        apps = json.loads(result.stdout)
    except json.JSONDecodeError:
        apps = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    audit_logger.log("termux_list_apps", {"count": len(apps)})
    return apps


def termux_launch_app(package_name: str, *, config: AgentConfig | None = None) -> Dict[str, Any]:
    _ensure_termux_available()
    lower = package_name.lower()
    if "bank" in lower or package_name in PROHIBITED_PACKAGES:
        audit_logger.log("termux_launch_blocked", {"package": package_name})
        raise PermissionError("Launching financial/banking apps is blocked for safety.")
    subprocess.run(  # noqa: S603,S607
        ["termux-activity-start", "-p", package_name],
        check=True,
    )
    audit_logger.log("termux_launch_app", {"package": package_name})
    return {"status": "launched", "package": package_name}


def termux_read_notifications(limit: int = 10, *, config: AgentConfig | None = None) -> List[Dict[str, Any]]:
    _ensure_termux_available()
    result = subprocess.run(  # noqa: S603,S607
        ["termux-notification-list"],
        capture_output=True,
        text=True,
        check=True,
    )
    notifications = json.loads(result.stdout) if result.stdout else []
    notifications = notifications[:limit]
    audit_logger.log("termux_read_notifications", {"count": len(notifications)})
    return notifications
