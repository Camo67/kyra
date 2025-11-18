"""
Minimal CLI + Streamlit loop for hybrid agents.
"""
from __future__ import annotations

import argparse
import os
from typing import List

from .agents import build_default_agents
from .config import OFFLINE_MODE, ONLINE_MODE, load_config
from .tools import CredentialManager, audit_logger, write_file


def run_cli(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Hybrid AI agent CLI")
    parser.add_argument("--mode", choices=[OFFLINE_MODE, ONLINE_MODE], help="Override mode")
    parser.add_argument("--agent", choices=["offline_researcher", "online_connector"])
    parser.add_argument("--task", help="Task text to send to agent")
    parser.add_argument("--tool", help="Tool name to invoke directly")
    parser.add_argument("--tool-args", nargs="*", help="Arguments for the tool (key=value)")
    parser.add_argument("--store-credential", nargs=2, metavar=("USER", "SECRET"))
    parser.add_argument("--read-file", help="Quick read helper relative to data root")
    args = parser.parse_args(argv)

    if args.mode:
        os.environ["AI_AGENT_MODE"] = args.mode
    cfg = load_config()
    agents = build_default_agents(cfg)

    if args.store_credential:
        user, secret = args.store_credential
        CredentialManager().store(user, secret)
        print(f"Stored credential for {user}")
        return

    if args.read_file:
        from .tools import read_file

        content = read_file(args.read_file, config=cfg)
        print(content)
        return

    if args.tool:
        agent = agents[args.agent or "offline_researcher"]
        kwargs = {}
        if args.tool_args:
            for arg in args.tool_args:
                key, value = arg.split("=", 1)
                kwargs[key] = value
        output = agent.tool_call(args.tool, **kwargs)
        print(output)
        return

    if args.task:
        agent = agents[args.agent or "offline_researcher"]
        result = agent.run(args.task)
        print(result)
    else:
        parser.print_help()


def run_streamlit_ui() -> None:
    import streamlit as st

    cfg = load_config()
    agents = build_default_agents(cfg)
    st.title("Hybrid Offline/Online Agents")
    mode = st.radio("Execution mode", [OFFLINE_MODE, ONLINE_MODE], index=0)
    os.environ["AI_AGENT_MODE"] = mode
    chat_area = st.container()
    task = st.text_input("Task")
    selected_agent = st.selectbox("Agent", list(agents))
    if st.button("Run Task") and task:
        result = agents[selected_agent].run(task)
        chat_area.write(result)

    st.subheader("Audit Log (first 1 KB)")
    try:
        data = cfg.audit_log_path.read_bytes()[:1024]
        st.code(data.decode("utf-8", errors="ignore"))
    except FileNotFoundError:
        st.info("No audit log yet.")


if __name__ == "__main__":
    run_cli()
