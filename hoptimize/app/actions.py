from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from typing import List

from .config import get_settings
from .models import ActionDefinition
from .rbac import ACTION_MINIMUM_ROLES


SECRET_PATTERNS = [
    re.compile(r"(?i)(password|passwd|pwd|secret|token|api[_-]?key)\s*=\s*([^\s]+)"),
    re.compile(r"(?i)(bearer)\s+[A-Za-z0-9._~+/=-]+"),
]


ACTION_DESCRIPTIONS = {
    "health_check": "Read local Hoptimize health.",
    "get_system_info": "Read basic OS and resource information.",
    "get_network_status": "Read limited local network status.",
    "list_services": "List approved service names.",
    "get_service_status": "Read one approved systemd service status.",
    "restart_service": "Restart one approved systemd service.",
    "get_service_logs": "Read capped journal logs for one approved service.",
    "get_docker_status": "Read Docker container status for approved containers.",
    "restart_container": "Restart one approved Docker container.",
    "deploy_compose_stack": "Deploy an approved Docker Compose stack.",
    "check_frp_status": "Read FRP client service status.",
    "restart_frpc": "Restart the FRP client service.",
    "rotate_frp_token": "Rotate one FRP tunnel token.",
    "reload_nginx_or_traefik": "Reload an approved reverse proxy.",
    "read_audit": "Read local audit records.",
    "list_actions": "List action definitions and required roles.",
    "manage_allowed_actions": "Manage allowed action definitions.",
}


DANGEROUS_ACTIONS = {
    "deploy_compose_stack",
    "rotate_frp_token",
    "reload_nginx_or_traefik",
}


NOT_IMPLEMENTED_ACTIONS = {
    "deploy_compose_stack",
    "rotate_frp_token",
    "reload_nginx_or_traefik",
    "manage_allowed_actions",
}


@dataclass
class CommandResult:
    command: List[str]
    returncode: int
    stdout: str
    stderr: str
    timed_out: bool = False

    @property
    def status(self) -> str:
        if self.timed_out:
            return "timeout"
        return "ok" if self.returncode == 0 else "error"


def redact(text: str) -> str:
    redacted = text or ""
    for pattern in SECRET_PATTERNS:
        if pattern.pattern.lower().startswith("(?i)(bearer)"):
            redacted = pattern.sub(r"\1 [REDACTED]", redacted)
        else:
            redacted = pattern.sub(r"\1=[REDACTED]", redacted)
    return redacted


def summarize(text: str) -> str:
    settings = get_settings()
    safe = redact(text)
    if len(safe) <= settings.log_summary_chars:
        return safe
    return safe[: settings.log_summary_chars] + "\n[truncated]"


def command_to_string(command: List[str]) -> str:
    return " ".join(command)


def run_fixed_command(command: List[str], timeout: int | None = None) -> CommandResult:
    settings = get_settings()
    effective_timeout = timeout or settings.command_timeout_seconds
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=effective_timeout,
        )
        return CommandResult(
            command=command,
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
        )
    except subprocess.TimeoutExpired as exc:
        return CommandResult(
            command=command,
            returncode=124,
            stdout=exc.stdout or "",
            stderr=exc.stderr or "command timed out",
            timed_out=True,
        )


def action_definitions() -> list[ActionDefinition]:
    definitions = []
    for action, minimum_role in sorted(ACTION_MINIMUM_ROLES.items()):
        definitions.append(
            ActionDefinition(
                name=action,
                minimum_role=minimum_role,
                description=ACTION_DESCRIPTIONS.get(action, "No description available."),
                dangerous=action in DANGEROUS_ACTIONS,
                implemented=action not in NOT_IMPLEMENTED_ACTIONS,
            )
        )
    return definitions
