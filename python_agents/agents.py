"""
Sample multi-agent definitions wiring toolkits to offline/online execution.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List

from .config import AgentConfig, OFFLINE_MODE, ONLINE_MODE, load_config
from . import tools


ToolFn = Callable[..., Any]


@dataclass
class ToolSpec:
    name: str
    description: str
    func: ToolFn

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)


@dataclass
class Agent:
    name: str
    mode: str
    tools: List[ToolSpec] = field(default_factory=list)
    config: AgentConfig = field(default_factory=load_config)

    def run(self, task: str, **kwargs) -> Dict[str, Any]:
        if self.mode == OFFLINE_MODE:
            result = tools.local_api_stub(task, config=self.config)
        else:
            payload = {"task": task, "metadata": kwargs}
            result = tools.call_external_api("/agent/task", payload, config=self.config)
        return {"agent": self.name, "result": result}

    def tool_call(self, tool_name: str, *args, **kwargs) -> Any:
        for tool in self.tools:
            if tool.name == tool_name:
                return tool(*args, **kwargs)
        raise ValueError(f"{self.name} lacks tool {tool_name}")


def build_default_agents(config: AgentConfig | None = None) -> Dict[str, Agent]:
    cfg = config or load_config()
    offline_tools = [
        ToolSpec("read_file", "Read agent data file", lambda path: tools.read_file(path, config=cfg)),
        ToolSpec(
            "solve_equation", "Solve algebraic equation", lambda expr: tools.solve_equation(expr)
        ),
        ToolSpec(
            "vector_norm",
            "Compute vector norm",
            lambda values: tools.vector_norm(values),
        ),
        ToolSpec(
            "termux_list_apps",
            "List installed Android apps via Termux API",
            lambda: tools.termux_list_apps(config=cfg),
        ),
        ToolSpec(
            "termux_launch_app",
            "Launch an installed Android app (non-banking).",
            lambda package: tools.termux_launch_app(package, config=cfg),
        ),
        ToolSpec(
            "termux_read_notifications",
            "Read Android notifications (requires permission).",
            lambda limit=10: tools.termux_read_notifications(limit=limit, config=cfg),
        ),
    ]
    online_tools = offline_tools + [
        ToolSpec(
            "call_external_api",
            "Proxy safe external call",
            lambda endpoint, payload: tools.call_external_api(endpoint, payload, config=cfg),
        )
    ]
    return {
        "offline_researcher": Agent(
            name="offline_researcher",
            mode=OFFLINE_MODE,
            tools=offline_tools,
            config=cfg,
        ),
        "online_connector": Agent(
            name="online_connector",
            mode=ONLINE_MODE,
            tools=online_tools,
            config=cfg,
        ),
    }
