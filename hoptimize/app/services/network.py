from __future__ import annotations

import os
import platform
from typing import Any

from ..actions import CommandResult, command_to_string, run_fixed_command, summarize


def system_info() -> dict[str, Any]:
    return {
        "hostname": platform.node(),
        "system": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "python_version": platform.python_version(),
        "uid": os.getuid() if hasattr(os, "getuid") else None,
    }


def network_status() -> CommandResult:
    command = ["/usr/sbin/ip", "-brief", "addr"]
    result = run_fixed_command(command)
    if result.returncode == 0:
        return result
    fallback = run_fixed_command(["/sbin/ip", "-brief", "addr"])
    if fallback.returncode == 0:
        return fallback
    return result


def listening_tcp() -> CommandResult:
    return run_fixed_command(["/usr/bin/ss", "-ltn"])


def payload_from_result(result: CommandResult) -> dict[str, str | int]:
    return {
        "returncode": result.returncode,
        "command": command_to_string(result.command),
        "stdout": summarize(result.stdout),
        "stderr": summarize(result.stderr),
    }
